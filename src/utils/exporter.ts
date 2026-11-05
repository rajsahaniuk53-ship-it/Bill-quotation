import { DocumentData } from '../types/document';
import { LETTERHEAD_TEMPLATES } from '../data/letterheadTemplates';
import { calculateDocument } from './calculator';
import { formatCurrency, numberToWordsIndian } from './numberToWords';

/**
 * Downloads a standalone, self-contained offline HTML file of the quotation/bill
 * which can be opened and printed on any phone, tablet, or PC without needing an internet connection.
 */
export function downloadPrintableHtml(doc: DocumentData): void {
  const template = LETTERHEAD_TEMPLATES.find((t) => t.id === doc.templateId) || LETTERHEAD_TEMPLATES[0];
  const calc = calculateDocument(doc);
  const isQuote = doc.type === 'quotation' || doc.type === 'estimate';
  const title = isQuote ? `Quotation_${doc.docNumber}` : `Invoice_${doc.docNumber}`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${doc.company.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .page { max-width: 210mm; margin: 0 auto; background: #fff; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-radius: 8px; box-sizing: border-box; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid ${doc.primaryColor || '#0f2b48'}; padding-bottom: 20px; margin-bottom: 20px; }
    .badge { background: ${doc.primaryColor || '#0f2b48'}; color: white; padding: 6px 14px; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    th { background: ${doc.primaryColor || '#0f2b48'}; color: white; padding: 10px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
    .totals { width: 280px; margin-left: auto; margin-bottom: 20px; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
    .grand-total { background: ${doc.primaryColor || '#0f2b48'}; color: white; font-weight: bold; font-size: 16px; padding: 10px; border-radius: 6px; margin-top: 10px; }
    .actions { text-align: center; margin-bottom: 20px; }
    .btn { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: bold; margin: 0 5px; }
    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="actions no-print">
    <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <div class="page">
    <div class="header">
      <div>
        <h1 style="margin: 0 0 5px 0; font-size: 24px; color: #0f172a;">${doc.company.name}</h1>
        <p style="margin: 0; font-size: 12px; color: #64748b;">${doc.company.tagline || ''}</p>
        <p style="margin: 5px 0 0 0; font-size: 12px;">${doc.company.addressLine1}, ${doc.company.city} - ${doc.company.pincode}</p>
        <p style="margin: 2px 0 0 0; font-size: 12px;">Ph: ${doc.company.phone} | Email: ${doc.company.email}</p>
        ${doc.company.gstin ? `<p style="margin: 2px 0 0 0; font-size: 12px; font-weight: bold;">GSTIN: ${doc.company.gstin}</p>` : ''}
      </div>
      <div style="text-align: right;">
        <div class="badge">${isQuote ? 'QUOTATION' : 'TAX INVOICE'}</div>
        <p style="margin: 10px 0 2px 0; font-size: 14px; font-weight: bold;"># ${doc.docNumber}</p>
        <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Date: ${doc.date}</p>
        ${doc.dueDate ? `<p style="margin: 2px 0; font-size: 12px; color: #64748b;">Due: ${doc.dueDate}</p>` : ''}
      </div>
    </div>

    <div class="grid">
      <div style="background: #f8fafc; padding: 12px; border-radius: 6px;">
        <strong style="font-size: 11px; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 5px;">Billed To / बिल प्राप्तकर्ता:</strong>
        <strong style="font-size: 14px;">${doc.client.name}</strong>
        ${doc.client.companyName ? `<div style="font-size: 12px; color: #475569;">${doc.client.companyName}</div>` : ''}
        <div style="font-size: 12px; color: #475569; margin-top: 4px;">${doc.client.addressLine1}, ${doc.client.city}</div>
        <div style="font-size: 12px; color: #475569;">Ph: ${doc.client.phone} | ${doc.client.email}</div>
        ${doc.client.gstin ? `<div style="font-size: 12px; font-weight: bold; margin-top: 4px;">GSTIN: ${doc.client.gstin}</div>` : ''}
      </div>
      <div style="background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 12px;">
        <strong style="font-size: 11px; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 5px;">Bank & Payment Info:</strong>
        <div>Bank: <strong>${doc.bankDetails.bankName || 'N/A'}</strong></div>
        <div>A/C No: <strong>${doc.bankDetails.accountNumber || 'N/A'}</strong></div>
        <div>IFSC: <strong>${doc.bankDetails.ifsc || 'N/A'}</strong></div>
        ${doc.bankDetails.upiId ? `<div>UPI ID: <strong style="color: #059669;">${doc.bankDetails.upiId}</strong></div>` : ''}
      </div>
    </div>

    ${doc.tableMode === 'direct_amount' ? `
    <table>
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th>काम / मटेरियल या एडवांस विवरण (Particulars)</th>
          <th style="text-align: center; width: 110px;">प्रकार (+/-)</th>
          <th style="text-align: right; width: 140px;">रकम AMOUNT (${doc.currency})</th>
        </tr>
      </thead>
      <tbody>
        ${calc.items.map((it, idx) => {
          const isAdv = it.itemType === 'advance';
          return `
          <tr style="${isAdv ? 'background: #fffbeb; color: #b45309;' : ''}">
            <td>${idx + 1}</td>
            <td><strong>${it.description}</strong></td>
            <td style="text-align: center; font-weight: bold; font-size: 11px;">
              ${isAdv ? '<span style="background: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 4px;">[-] ADVANCE</span>' : '<span style="background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px;">[+] CHARGE</span>'}
            </td>
            <td style="text-align: right; font-weight: bold; font-size: 14px;">
              ${isAdv ? `- ${doc.currency} ${Math.abs(it.amount).toFixed(2)}` : `${doc.currency} ${it.amount.toFixed(2)}`}
            </td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    ` : `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th style="text-align: center;">Qty / Unit</th>
          <th style="text-align: right;">Rate</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${calc.items.map((it, idx) => {
          const isAdv = it.itemType === 'advance';
          return `
          <tr style="${isAdv ? 'background: #fffbeb; color: #b45309;' : ''}">
            <td>${idx + 1}</td>
            <td><strong>${it.description}</strong></td>
            <td style="text-align: center;">${it.quantity} ${it.unit}</td>
            <td style="text-align: right;">${doc.currency} ${it.rate.toFixed(2)}</td>
            <td style="text-align: right; font-weight: bold;">
              ${isAdv ? `- ${doc.currency} ${Math.abs(it.amount).toFixed(2)}` : `${doc.currency} ${it.amount.toFixed(2)}`}
            </td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    `}

    <div class="totals" style="width: 320px; margin-left: auto; margin-bottom: 20px;">
      <div class="total-row"><span>कुल काम की रकम (Total Work):</span><strong>${doc.currency} ${calc.totalWorkCharges.toFixed(2)}</strong></div>
      ${calc.totalDiscount > 0 ? `<div class="total-row" style="color: #059669;"><span>Discount:</span><strong>- ${doc.currency} ${calc.totalDiscount.toFixed(2)}</strong></div>` : ''}
      ${calc.totalTax > 0 ? `<div class="total-row"><span>GST/Tax:</span><strong>+ ${doc.currency} ${calc.totalTax.toFixed(2)}</strong></div>` : ''}
      ${calc.shippingCharges > 0 ? `<div class="total-row"><span>Shipping/Misc:</span><strong>+ ${doc.currency} ${calc.shippingCharges.toFixed(2)}</strong></div>` : ''}
      <div class="total-row grand-total">
        <span>Grand Total (कुल रकम):</span>
        <span>${doc.currency} ${calc.grandTotal.toFixed(2)}</span>
      </div>
      ${calc.totalAdvanceDeductions > 0 ? `
      <div class="total-row" style="color: #b45309; padding-top: 8px;"><span>कुल एडवांस मिला (Less Total Advance):</span><strong>- ${doc.currency} ${calc.totalAdvanceDeductions.toFixed(2)}</strong></div>
      <div class="total-row" style="background: #0f172a; color: #fef08a; padding: 12px; border-radius: 6px; margin-top: 8px; font-weight: bold; font-size: 16px;">
        <span>बाकी बचा हुआ रुपया (Net Due):</span>
        <span>${doc.currency} ${calc.netRemainingDue.toFixed(2)}</span>
      </div>` : ''}
    </div>

    <div style="font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px; display: flex; justify-content: space-between;">
      <div>
        <strong>Notes / Terms:</strong>
        <p style="margin: 2px 0;">${doc.termsConditions || 'Goods once sold will not be returned.'}</p>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-weight: bold;">For ${doc.company.name}</p>
        <p style="margin: 40px 0 0 0; border-top: 1px dashed #cbd5e1; padding-top: 4px;">Authorized Signatory</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
