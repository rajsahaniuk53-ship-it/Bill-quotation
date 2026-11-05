import { DocumentData } from '../types/document';
import { generateUpiQrDataUrl } from './qrGenerator';
import { calculateDocument } from './calculator';
import { downloadPrintableHtml } from './exporter';
import { downloadDocumentAsImage } from './documentImage';

/**
 * Triggers reliable printing of the quotation/bill across mobile browsers,
 * tablets, desktops, and iframe preview environments.
 */
export async function printDocumentReliably(doc: DocumentData): Promise<void> {
  const calc = calculateDocument(doc);
  const isQuote = doc.type === 'quotation' || doc.type === 'estimate';
  const title = isQuote ? `Quotation_${doc.docNumber}` : `Invoice_${doc.docNumber}`;

  // 1. Generate QR Code Data URL if enabled
  let qrDataUrl = '';
  if (doc.showUpiQr && doc.bankDetails.upiId) {
    try {
      const isFixed = doc.qrAmountMode === 'fixed';
      const targetAmount = isFixed ? (calc.netRemainingDue > 0 ? calc.netRemainingDue : calc.grandTotal) : null;
      qrDataUrl = await generateUpiQrDataUrl(
        doc.bankDetails.upiId,
        doc.bankDetails.accountName || doc.company.name,
        targetAmount,
        `${isQuote ? 'Quote' : 'Bill'} ${doc.docNumber}`
      );
    } catch (e) {
      console.error('Failed to generate QR for print:', e);
    }
  }

  // 2. Prepare isolated printable HTML
  const isDirectMode = doc.tableMode === 'direct_amount';
  const primaryColor = doc.primaryColor || '#0f2b48';
  const secondaryColor = doc.secondaryColor || '#d97706';

  const printableHtml = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${doc.company.name}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-size: 12px;
      line-height: 1.4;
    }
    .sheet {
      width: 100%;
      max-width: 190mm;
      margin: 0 auto;
      padding: 0;
      background: #ffffff;
    }
    .top-meta {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #cbd5e1;
      padding-bottom: 6px;
      margin-bottom: 12px;
      font-size: 11px;
      font-weight: bold;
      color: #334155;
    }
    .company-header {
      text-align: center;
      margin-bottom: 16px;
    }
    .company-title {
      font-size: 26px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: ${primaryColor};
      margin: 0 0 4px 0;
    }
    .accent-bar {
      width: 100%;
      height: 2px;
      background-color: ${secondaryColor};
      margin: 6px 0;
    }
    .tagline {
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #1e293b;
      margin: 0 0 4px 0;
    }
    .address {
      font-size: 11px;
      color: #475569;
      margin: 0;
    }
    .client-box {
      border: 1px solid #94a3b8;
      border-radius: 6px;
      padding: 10px 14px;
      background-color: #f8fafc;
      margin-bottom: 14px;
      font-size: 12px;
    }
    .client-row {
      display: flex;
      margin-bottom: 6px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
    }
    .client-row:last-child {
      margin-bottom: 0;
      border-bottom: none;
      padding-bottom: 0;
    }
    .client-label {
      width: 130px;
      font-weight: bold;
      color: #1e293b;
      text-transform: uppercase;
      font-size: 10.5px;
    }
    .client-val {
      flex: 1;
      font-weight: 700;
      color: #0f172a;
    }
    .work-heading {
      text-align: center;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 12px;
      padding: 6px;
      background-color: #f1f5f9;
      border: 1px solid #94a3b8;
      border-radius: 4px;
      margin-bottom: 10px;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      border: 1px solid #64748b;
      font-size: 11px;
    }
    th {
      background-color: ${primaryColor};
      color: #ffffff;
      padding: 8px 10px;
      font-size: 10.5px;
      font-weight: bold;
      text-align: left;
      border-right: 1px solid #94a3b8;
    }
    th:last-child { border-right: none; }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #cbd5e1;
      border-right: 1px solid #cbd5e1;
      vertical-align: middle;
    }
    td:last-child { border-right: none; }
    tr.advance-row {
      background-color: #fffbeb;
      color: #92400e;
    }
    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 12px;
    }
    .totals-box {
      width: 340px;
      border: 2px solid #64748b;
      border-radius: 6px;
      overflow: hidden;
      font-size: 11.5px;
    }
    .total-line {
      display: flex;
      justify-content: space-between;
      padding: 6px 12px;
      border-bottom: 1px solid #cbd5e1;
      background-color: #ffffff;
    }
    .total-line.grand {
      background-color: #f1f5f9;
      font-weight: 800;
      font-size: 13px;
      border-bottom: 2px solid #64748b;
    }
    .total-line.advance {
      background-color: #fef3c7;
      color: #92400e;
      font-weight: bold;
    }
    .total-line.due {
      background-color: ${primaryColor};
      color: #ffffff;
      font-weight: 800;
      font-size: 15px;
    }
    .words-box {
      border: 1px solid #94a3b8;
      border-radius: 6px;
      padding: 8px 12px;
      background-color: #f8fafc;
      font-size: 11px;
      margin-bottom: 12px;
      line-height: 1.5;
    }
    .bank-qr-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #94a3b8;
      border-radius: 6px;
      padding: 10px 14px;
      background-color: #f8fafc;
      margin-bottom: 14px;
    }
    .qr-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #ffffff;
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      text-align: left;
    }
    .qr-badge img {
      width: 68px;
      height: 68px;
      display: block;
    }
    .footer-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #94a3b8;
      padding-top: 10px;
      margin-top: 14px;
      font-size: 10.5px;
    }
    .sign-box {
      text-align: center;
      width: 180px;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <!-- Top Metadata -->
    <div class="top-meta">
      <div>DATE: ${doc.date} | REF: ${doc.docNumber}</div>
      <div>MOBIL. ${doc.company.phone} ${doc.company.phone2 ? '/ ' + doc.company.phone2 : ''}</div>
    </div>

    <!-- Company Header -->
    <div class="company-header">
      <h1 class="company-title">${doc.company.name}</h1>
      <div class="accent-bar"></div>
      <p class="tagline">${doc.company.tagline || ''}</p>
      <p class="address">${doc.company.addressLine1}, ${doc.company.city} ${doc.company.pincode}</p>
    </div>

    <!-- Client Box -->
    <div class="client-box">
      <div class="client-row">
        <span class="client-label">PARTY / CLIENT:</span>
        <span class="client-val">${doc.client.name}</span>
      </div>
      <div class="client-row">
        <span class="client-label">SITE LOCATION:</span>
        <span class="client-val">${doc.client.siteLocation || doc.client.addressLine1 || ''}</span>
      </div>
    </div>

    <!-- Work Heading -->
    <div class="work-heading">${doc.workTypeTitle || 'BILL FOR LABOUR WITH MATERIAL CHARGES'}</div>

    <!-- Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 36px; text-align: center;">S.NO.</th>
          <th>ITEM DESCRIPTION / PARTICULARS</th>
          ${!isDirectMode ? `
            <th style="width: 100px; text-align: center;">QUANTITY / UNIT</th>
            <th style="width: 90px; text-align: right;">RATE (₹)</th>
          ` : `
            <th style="width: 90px; text-align: center;">TYPE</th>
          `}
          <th style="width: 120px; text-align: right;">AMOUNT (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${calc.items.map((it, idx) => {
          const isAdv = it.itemType === 'advance';
          return `
          <tr class="${isAdv ? 'advance-row' : ''}">
            <td style="text-align: center; font-weight: bold; color: #64748b;">${idx + 1}</td>
            <td><strong>${it.description}</strong></td>
            ${!isDirectMode ? `
              <td style="text-align: center;">${it.quantity} ${it.unit}</td>
              <td style="text-align: right;">${doc.currency} ${it.rate.toFixed(2)}</td>
            ` : `
              <td style="text-align: center; font-weight: bold; font-size: 10px;">
                ${isAdv ? '<span style="color:#b45309; background:#fef3c7; padding:2px 4px; border-radius:3px;">[-] ADVANCE</span>' : '<span style="color:#1d4ed8; background:#dbeafe; padding:2px 4px; border-radius:3px;">[+] WORK CHARGE</span>'}
              </td>
            `}
            <td style="text-align: right; font-weight: 800; font-family: monospace; font-size: 12px;">
              ${isAdv ? `- ${doc.currency} ${Math.abs(it.amount).toFixed(2)}` : `${doc.currency} ${it.amount.toFixed(2)}`}
            </td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-wrapper">
      <div class="totals-box">
        <div class="total-line">
          <span>TOTAL WORK CHARGES:</span>
          <strong style="font-family: monospace;">${doc.currency} ${calc.totalWorkCharges.toFixed(2)}</strong>
        </div>
        ${calc.totalTax > 0 ? `
        <div class="total-line">
          <span>GST / Tax:</span>
          <strong>+ ${doc.currency} ${calc.totalTax.toFixed(2)}</strong>
        </div>` : ''}
        ${calc.shippingCharges > 0 ? `
        <div class="total-line">
          <span>Transport / Freight:</span>
          <strong>+ ${doc.currency} ${calc.shippingCharges.toFixed(2)}</strong>
        </div>` : ''}
        <div class="total-line grand">
          <span>GRAND TOTAL:</span>
          <span style="font-family: monospace; color: #0f172a;">${doc.currency} ${calc.grandTotal.toFixed(2)}</span>
        </div>
        ${calc.totalAdvanceDeductions > 0 ? `
        <div class="total-line advance">
          <span>LESS ADVANCE RECEIVED:</span>
          <strong style="font-family: monospace;">- ${doc.currency} ${calc.totalAdvanceDeductions.toFixed(2)}</strong>
        </div>
        <div class="total-line due">
          <span>NET REMAINING DUE:</span>
          <span style="font-family: monospace; color: #fef08a;">${doc.currency} ${calc.netRemainingDue.toFixed(2)}</span>
        </div>` : ''}
      </div>
    </div>

    <!-- Bank Details & QR -->
    ${doc.showUpiQr && doc.bankDetails.upiId ? `
    <div class="bank-qr-box">
      <div style="font-size: 11px;">
        <div style="font-weight: 800; text-transform: uppercase; margin-bottom: 4px; color: #1e293b;">BANK ACCOUNT DETAILS:</div>
        <div>Bank: <strong>${doc.bankDetails.bankName || 'State Bank of India'}</strong> | A/C: <strong style="font-family: monospace;">${doc.bankDetails.accountNumber}</strong></div>
        <div>IFSC: <strong style="font-family: monospace;">${doc.bankDetails.ifsc}</strong> | UPI ID: <strong style="font-family: monospace; color: #047857;">${doc.bankDetails.upiId}</strong></div>
      </div>
      ${qrDataUrl ? `
      <div class="qr-badge">
        <img src="${qrDataUrl}" alt="UPI QR" />
        <div>
          <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #047857; margin-bottom: 2px;">
            ${doc.qrAmountMode === 'fixed' ? '🔒 Pay Due Amount' : '⚡ Open Amount'}
          </div>
          <div style="font-size: 10px; font-weight: 800; color: #0f172a; line-height: 1.2;">
            ${doc.qrAmountMode === 'fixed' ? `${doc.currency} ${calc.netRemainingDue.toFixed(2)}` : 'Customer Enters Amount'}
          </div>
          <div style="font-size: 7.5px; color: #64748b; margin-top: 2px;">GPay • PhonePe • Paytm</div>
        </div>
      </div>` : ''}
    </div>` : ''}

    <!-- Footer -->
    <div class="footer-section">
      <div style="max-width: 320px;">
        <strong>Terms & Conditions:</strong>
        <p style="margin: 2px 0 0 0; color: #64748b;">${doc.termsConditions || 'Work guaranteed for 12 months. Balance payable on completion.'}</p>
      </div>
      <div class="sign-box">
        <div style="height: 40px;">
          ${doc.signatureImage ? `<img src="${doc.signatureImage}" style="max-height: 40px; max-width: 140px;" />` : ''}
        </div>
        <div style="border-top: 1px dashed #94a3b8; padding-top: 4px; font-weight: bold;">
          For ${doc.company.name}
        </div>
        <div style="font-size: 9.5px; color: #64748b;">${doc.signatureTitle || 'Proprietor'}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  // 3. Attempt print via isolated iframe (100% reliable across modern browsers)
  let printFrame = document.getElementById('isolated-print-iframe') as HTMLIFrameElement;
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = 'isolated-print-iframe';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden';
    document.body.appendChild(printFrame);
  }

  const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
  if (frameDoc && printFrame.contentWindow) {
    frameDoc.open();
    frameDoc.write(printableHtml);
    frameDoc.close();

    // Give images & fonts 300ms to render inside the iframe before printing
    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print restricted, falling back to window.print or direct download:', err);
        // Fallback for restricted mobile webviews
        downloadPrintableHtml(doc, qrDataUrl);
      }
    }, 350);
  } else {
    // If iframe not available, fallback to direct download
    downloadPrintableHtml(doc, qrDataUrl);
  }
}
