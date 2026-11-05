import React, { useEffect, useState } from 'react';
import { DocumentData, LineItem } from '../types/document';
import { LETTERHEAD_TEMPLATES } from '../data/letterheadTemplates';
import { calculateDocument } from '../utils/calculator';
import { formatCurrency, numberToWordsIndian } from '../utils/numberToWords';
import { generateUpiQrDataUrl } from '../utils/qrGenerator';
import { 
  Plus, 
  Trash2, 
  CreditCard, 
  QrCode, 
  Phone, 
  MapPin, 
  Mail, 
  Check,
  Edit2,
  Palette,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface DocumentRendererProps {
  document: DocumentData;
  onUpdateDocument?: (updatedDoc: DocumentData) => void;
  scale?: number;
  isEditable?: boolean;
}

export const DocumentRenderer: React.FC<DocumentRendererProps> = ({
  document: doc,
  onUpdateDocument,
  scale = 1,
  isEditable = true,
}) => {
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');
  const template = LETTERHEAD_TEMPLATES.find((t) => t.id === doc.templateId) || LETTERHEAD_TEMPLATES[0];
  const calculations = calculateDocument(doc);

  // Generate UPI QR code (Supports Open Amount - No amount encoded so customer enters any amount they want!)
  useEffect(() => {
    let isMounted = true;
    if (doc.showUpiQr && doc.bankDetails.upiId) {
      // By default or when doc.qrAmountMode !== 'fixed', amount is null (Open Amount)
      const isFixed = doc.qrAmountMode === 'fixed';
      const targetAmount = isFixed 
        ? (calculations.netRemainingDue > 0 ? calculations.netRemainingDue : calculations.grandTotal)
        : null;

      generateUpiQrDataUrl(
        doc.bankDetails.upiId,
        doc.bankDetails.accountName || doc.company.name,
        targetAmount,
        `${doc.type === 'quotation' ? 'Quote' : 'Invoice'} ${doc.docNumber}`
      ).then((url) => {
        if (isMounted) setUpiQrUrl(url);
      });
    } else {
      setUpiQrUrl('');
    }
    return () => {
      isMounted = false;
    };
  }, [
    doc.showUpiQr, 
    doc.qrAmountMode, 
    doc.bankDetails.upiId, 
    doc.bankDetails.accountName, 
    doc.company.name, 
    calculations.netRemainingDue, 
    calculations.grandTotal, 
    doc.docNumber, 
    doc.type
  ]);

  // Root field update
  const handleUpdate = (field: keyof DocumentData, value: any) => {
    if (!onUpdateDocument) return;
    onUpdateDocument({
      ...doc,
      [field]: value,
      updatedAt: new Date().toISOString(),
    });
  };

  // Company update
  const handleUpdateCompany = (field: string, value: string) => {
    if (!onUpdateDocument) return;
    onUpdateDocument({
      ...doc,
      company: { ...doc.company, [field]: value },
      updatedAt: new Date().toISOString(),
    });
  };

  // Client update
  const handleUpdateClient = (field: string, value: string) => {
    if (!onUpdateDocument) return;
    onUpdateDocument({
      ...doc,
      client: { ...doc.client, [field]: value },
      updatedAt: new Date().toISOString(),
    });
  };

  // Bank details update
  const handleUpdateBank = (field: string, value: string) => {
    if (!onUpdateDocument) return;
    onUpdateDocument({
      ...doc,
      bankDetails: { ...doc.bankDetails, [field]: value },
      updatedAt: new Date().toISOString(),
    });
  };

  // Item field update (description, quantity, unit, rate)
  const handleUpdateItem = (index: number, field: keyof LineItem, value: any) => {
    if (!onUpdateDocument) return;
    const newItems = [...doc.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    // Recalculate amount when quantity or rate changes
    const qty = Number(field === 'quantity' ? value : newItems[index].quantity) || 0;
    const rate = Number(field === 'rate' ? value : newItems[index].rate) || 0;
    const disc = Number(field === 'discountPercent' ? value : newItems[index].discountPercent) || 0;
    const gross = qty * rate;
    const net = gross - (gross * disc) / 100;
    newItems[index].amount = Number(net.toFixed(2));

    onUpdateDocument({
      ...doc,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // DIRECT ITEM TOTAL AMOUNT EDIT (Requested by User!)
  // When user types in "TOTAL PRICE (₹)", we update amount and adjust rate = amount / quantity
  const handleUpdateItemTotalAmount = (index: number, newTotalAmount: number) => {
    if (!onUpdateDocument) return;
    const newItems = [...doc.items];
    const qty = Number(newItems[index].quantity) || 1;
    newItems[index] = {
      ...newItems[index],
      amount: newTotalAmount,
      rate: qty > 0 ? Number((newTotalAmount / qty).toFixed(2)) : newTotalAmount,
    };
    onUpdateDocument({
      ...doc,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Toggle row type: (+) Work/Charge vs (-) Advance Received/Deduction
  const handleToggleItemType = (index: number) => {
    if (!onUpdateDocument) return;
    const newItems = [...doc.items];
    const currentType = newItems[index].itemType || 'charge';
    newItems[index] = {
      ...newItems[index],
      itemType: currentType === 'charge' ? 'advance' : 'charge',
    };
    onUpdateDocument({
      ...doc,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Toggle Table Mode: 'measurement_sqft' (Qty x Rate detailed list) vs 'cash_ledger' (Direct Cash / Advance)
  const handleToggleTableMode = (targetMode?: 'measurement_sqft' | 'cash_ledger' | 'direct_amount' | 'rate_qty') => {
    if (!onUpdateDocument) return;
    const current = doc.tableMode || 'direct_amount';
    const next = targetMode 
      ? targetMode 
      : ((current === 'direct_amount' || current === 'cash_ledger') ? 'measurement_sqft' : 'cash_ledger');
    onUpdateDocument({
      ...doc,
      tableMode: next,
      updatedAt: new Date().toISOString(),
    });
  };

  // Add row directly from particulars table (type: 'charge' = (+) Work or 'advance' = (-) Advance Received)
  const handleAddRow = (type: 'charge' | 'advance' = 'charge') => {
    if (!onUpdateDocument) return;
    const isAdv = type === 'advance';
    const isDirect = (doc.tableMode || 'direct_amount') === 'direct_amount';
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: isAdv 
        ? 'Advance Payment Received' 
        : (isDirect ? 'Work Description / Particulars' : 'New Work Item'),
      hsn: isAdv ? '' : '9954',
      quantity: isDirect ? 1 : 100,
      unit: isDirect ? 'Lump' : 'SFT',
      rate: isAdv ? 10000 : (isDirect ? 25000 : 35),
      discountPercent: 0,
      taxRate: isAdv ? 0 : (doc.taxType === 'none' ? 0 : (doc.items[0]?.taxRate || 0)),
      amount: isAdv ? 10000 : (isDirect ? 25000 : 3500),
      itemType: type,
    };
    onUpdateDocument({
      ...doc,
      items: [...doc.items, newItem],
      updatedAt: new Date().toISOString(),
    });
  };

  // Delete row
  const handleDeleteRow = (index: number) => {
    if (!onUpdateDocument || doc.items.length <= 1) return;
    const newItems = doc.items.filter((_, i) => i !== index);
    onUpdateDocument({
      ...doc,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  };

  const primaryColor = doc.primaryColor || template.defaultPrimaryColor;
  const secondaryColor = doc.secondaryColor || template.defaultSecondaryColor;

  // Text size scale ("Bada / Chhota")
  const sizeMultiplier = 
    doc.fontSizeScale === 'compact' ? 'text-[11px]' :
    doc.fontSizeScale === 'large' ? 'text-[14px]' :
    doc.fontSizeScale === 'xlarge' ? 'text-[15px]' : 'text-[12px]';

  const fontClass = 
    doc.fontFamily === 'serif' ? 'font-serif' :
    doc.fontFamily === 'mono' ? 'font-mono' :
    doc.fontFamily === 'modern' ? 'font-sans tracking-tight' : 'font-sans';

  const liningStyle = doc.liningStyle || 'contractor_ledger';

  // Lining styles styling definitions
  const outerBorderClass = 
    liningStyle === 'double_border' ? 'border-8 border-double border-slate-800' :
    liningStyle === 'architect_grid' ? 'border-2 border-cyan-800' :
    liningStyle === 'ruled_ledger' ? 'border-4 border-red-800' :
    liningStyle === 'executive_box' ? 'border-2 border-slate-600' :
    liningStyle === 'modern_clean' ? 'border border-slate-200' :
    'border border-slate-300';

  const topBarLiningClass =
    liningStyle === 'double_border' ? 'border-b-4 border-double border-slate-700' :
    liningStyle === 'architect_grid' ? 'border-b-2 border-cyan-700 bg-cyan-950/5 p-1 rounded' :
    liningStyle === 'ruled_ledger' ? 'border-b-2 border-red-700' :
    liningStyle === 'executive_box' ? 'border-b border-slate-400 bg-slate-50 p-1 rounded' :
    liningStyle === 'modern_clean' ? 'border-b border-slate-200' :
    'border-b-2 border-slate-300';

  const clientBoxClass =
    liningStyle === 'double_border' ? 'p-3.5 bg-amber-50/20 border-2 border-slate-700 mb-3 text-xs space-y-2.5' :
    liningStyle === 'architect_grid' ? 'p-3.5 bg-cyan-50/30 border border-cyan-400 mb-3 text-xs space-y-2.5 font-mono' :
    liningStyle === 'ruled_ledger' ? 'p-3.5 bg-red-50/20 border-2 border-red-400 mb-3 text-xs space-y-2.5' :
    liningStyle === 'executive_box' ? 'p-3.5 bg-slate-50 border border-slate-300 rounded mb-3 text-xs space-y-2.5' :
    liningStyle === 'modern_clean' ? 'p-3.5 bg-white border border-slate-200 rounded mb-3 text-xs space-y-2.5' :
    'p-3.5 bg-slate-50/90 rounded-lg border border-slate-300 mb-3 text-xs space-y-2.5';

  const tableOuterClass =
    liningStyle === 'double_border' ? 'border-2 border-slate-800 overflow-hidden mb-3' :
    liningStyle === 'architect_grid' ? 'border-2 border-cyan-700 overflow-hidden mb-3' :
    liningStyle === 'ruled_ledger' ? 'border-2 border-red-800 overflow-hidden mb-3' :
    liningStyle === 'executive_box' ? 'border-2 border-slate-600 rounded overflow-hidden mb-3' :
    liningStyle === 'modern_clean' ? 'border border-slate-300 rounded overflow-hidden mb-3' :
    'border border-slate-400 rounded overflow-hidden mb-3';

  const cellBorderClass =
    liningStyle === 'double_border' ? 'border-r-2 border-slate-300' :
    liningStyle === 'architect_grid' ? 'border-r border-cyan-300' :
    liningStyle === 'ruled_ledger' ? 'border-r border-red-200' :
    liningStyle === 'executive_box' ? 'border-r border-slate-300' :
    'border-r border-slate-300';

  // Common inline input styling for seamless printing with underlined guidelines
  const inlineInputStyle = "bg-transparent border-b border-transparent hover:border-slate-400 focus:border-indigo-600 focus:bg-indigo-50/20 focus:outline-none transition-colors px-1 py-0.5 rounded";

  return (
    <div 
      className={`print-area mx-auto bg-white text-slate-800 shadow-2xl transition-all duration-200 relative select-text ${outerBorderClass}`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
        boxSizing: 'border-box',
      }}
      id="printable-document"
    >
      <div className={`p-8 md:p-10 flex flex-col justify-between min-h-[297mm] ${fontClass} ${sizeMultiplier}`}>
        
        <div>
          {/* ================= TOP METADATA BAR (Date, Ref No, Mobiles with Underline Lining) ================= */}
          <div className={`flex justify-between items-center text-[11px] text-slate-700 pb-2 mb-3 ${topBarLiningClass} font-mono`}>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="font-bold text-slate-800">DATE:</span>
                <input
                  type="date"
                  value={doc.date}
                  onChange={(e) => handleUpdate('date', e.target.value)}
                  className={`${inlineInputStyle} w-28 font-semibold`}
                />
              </span>
              <span className="text-slate-400">|</span>
              <span className="flex items-center gap-1">
                <span className="font-bold text-slate-800">REF:</span>
                <input
                  type="text"
                  value={doc.docNumber}
                  onChange={(e) => handleUpdate('docNumber', e.target.value)}
                  className={`${inlineInputStyle} font-bold text-slate-900 w-36`}
                />
              </span>
            </div>

            {/* Mobile Numbers on Top Right with Underline Line (Matching User Sample) */}
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="text-[11px] text-slate-700">MOBIL.</span>
              <div className="inline-flex items-center border-b border-slate-400 pb-0.5">
                <input
                  type="text"
                  value={doc.company.phone}
                  onChange={(e) => handleUpdateCompany('phone', e.target.value)}
                  placeholder="8181881311"
                  className="bg-transparent focus:outline-none w-24 text-center font-mono font-bold tracking-wider"
                />
              </div>
              <span>/</span>
              <div className="inline-flex items-center border-b border-slate-400 pb-0.5">
                <input
                  type="text"
                  value={doc.company.phone2 || ''}
                  onChange={(e) => handleUpdateCompany('phone2', e.target.value)}
                  placeholder="8181881318"
                  className="bg-transparent focus:outline-none w-24 text-center font-mono font-bold tracking-wider"
                />
              </div>
            </div>
          </div>

          {/* ================= LETTERPAD HEADER (Centered Name with Accent Line) ================= */}
          <div className="text-center py-2 mb-3 relative">
            {/* Company / Contractor Name */}
            <input
              type="text"
              value={doc.company.name}
              onChange={(e) => handleUpdateCompany('name', e.target.value)}
              placeholder="RAJ SAHANI"
              className="w-full text-center font-extrabold text-2xl md:text-3xl tracking-wider text-slate-900 uppercase focus:outline-none focus:bg-indigo-50/20 py-1 rounded transition"
              style={{ color: primaryColor }}
            />

            {/* Underline separator accent line (Matching User Sample) */}
            <div className="w-full h-0.5 my-2" style={{ backgroundColor: secondaryColor || '#d97706' }} />

            {/* Tagline / Work Specialty */}
            <input
              type="text"
              value={doc.company.tagline || ''}
              onChange={(e) => handleUpdateCompany('tagline', e.target.value)}
              placeholder="PAINTING, POLISHING & INTERIOR WORKS"
              className="w-full text-center font-bold text-xs tracking-widest text-slate-800 uppercase focus:outline-none focus:bg-indigo-50/20 py-0.5 rounded transition"
            />

            {/* Address */}
            <input
              type="text"
              value={doc.company.addressLine1}
              onChange={(e) => handleUpdateCompany('addressLine1', e.target.value)}
              placeholder="Hanuman Nagar, Kandivali (E), Mumbai 400101"
              className="w-full text-center text-[11px] text-slate-600 mt-0.5 focus:outline-none focus:bg-indigo-50/20 py-0.5 rounded transition"
            />
          </div>

          {/* ================= PARTY / CLIENT & SITE LOCATION BOX (With Full Underline Lining) ================= */}
          <div className={clientBoxClass}>
            {/* Party / Client Line */}
            <div className="flex items-end gap-2">
              <span className="font-bold text-slate-800 shrink-0 uppercase tracking-wide text-[11px]">
                PARTY / CLIENT:
              </span>
              <div className="flex-1 border-b border-slate-400 pb-0.5">
                <input
                  type="text"
                  value={doc.client.name}
                  onChange={(e) => handleUpdateClient('name', e.target.value)}
                  placeholder="Ramesh Sharma"
                  className="w-full font-bold text-slate-900 bg-transparent focus:outline-none focus:bg-indigo-50/20 px-1"
                />
              </div>
            </div>

            {/* Site Location Line */}
            <div className="flex items-end gap-2">
              <span className="font-bold text-slate-800 shrink-0 uppercase tracking-wide text-[11px]">
                SITE LOCATION:
              </span>
              <div className="flex-1 border-b border-slate-400 pb-0.5">
                <input
                  type="text"
                  value={doc.client.siteLocation || ''}
                  onChange={(e) => handleUpdateClient('siteLocation', e.target.value)}
                  placeholder="Kandivali Work Site"
                  className="w-full font-semibold text-slate-800 bg-transparent focus:outline-none focus:bg-indigo-50/20 px-1"
                />
              </div>
            </div>
          </div>

          {/* ================= WORK TYPE TITLE BANNER ================= */}
          <div 
            className="w-full py-2 px-4 rounded text-center font-extrabold text-xs uppercase tracking-wider shadow-2xs mb-3"
            style={{
              backgroundColor: `${primaryColor}15`,
              color: primaryColor,
              border: `1.5px solid ${primaryColor}50`,
            }}
          >
            <input
              type="text"
              value={doc.workTypeTitle || (doc.type === 'quotation' ? 'QUOTATION FOR LABOUR WITH MATERIAL CHARGES' : 'BILL FOR LABOUR WITH MATERIAL CHARGES')}
              onChange={(e) => handleUpdate('workTypeTitle', e.target.value)}
              className="w-full text-center bg-transparent font-extrabold focus:outline-none"
            />
          </div>

          {/* ================= PARTICULARS / WORK ITEMS TABLE (With Strict Grid Lining) ================= */}
          <div className={tableOuterClass}>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr 
                  className="font-bold uppercase tracking-wider text-[11px] border-b border-slate-400"
                  style={{
                    backgroundColor: template.tableHeaderStyle === 'dark' ? primaryColor : '#f1f5f9',
                    color: template.tableHeaderStyle === 'dark' ? '#ffffff' : '#0f172a',
                  }}
                >
                  <th className={`py-2.5 px-2 text-center w-10 ${cellBorderClass}`}>#</th>
                  <th className={`py-2.5 px-3 ${cellBorderClass}`}>
                    {(doc.tableMode === 'cash_ledger' || doc.tableMode === 'direct_amount')
                      ? 'PARTICULARS / TRANSACTION DESCRIPTION' 
                      : 'WORK DESCRIPTION (PAINTING / POLISHING / CARPENTRY / INTERIOR)'}
                  </th>
                  <th className={`py-2.5 px-2 text-center w-24 ${cellBorderClass}`}>TYPE (+ / -)</th>
                  
                  {/* Detailed Qty & Rate columns shown ONLY in 'measurement_sqft' mode */}
                  {doc.tableMode !== 'cash_ledger' && doc.tableMode !== 'direct_amount' && (
                    <>
                      <th className={`py-2.5 px-2 text-center w-28 ${cellBorderClass}`}>QUANTITY / SQ.FT</th>
                      <th className={`py-2.5 px-3 text-right w-28 ${cellBorderClass}`}>RATE ({doc.currency})</th>
                    </>
                  )}

                  <th className="py-2.5 px-3 text-right w-36">
                    AMOUNT ({doc.currency})
                  </th>
                  {isEditable && <th className="w-8 no-print"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-xs">
                {calculations.items.map((item, index) => {
                  const isAdvanceRow = item.itemType === 'advance';
                  const isCashLedger = doc.tableMode === 'cash_ledger' || doc.tableMode === 'direct_amount';
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isAdvanceRow ? 'bg-amber-50/40 text-amber-950' : ''
                      }`}
                    >
                      {/* Sr No */}
                      <td className={`py-2 px-1 text-center font-mono text-[11px] font-bold text-slate-500 ${cellBorderClass}`}>
                        {index + 1}
                      </td>

                      {/* Item Description (Editable) */}
                      <td className={`py-2 px-3 ${cellBorderClass}`}>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                          placeholder={isAdvanceRow ? "e.g. Paint Purchase Advance Received / Cash Received" : "e.g. Royal Wall Paint / Ceiling Work / Teakwood Wardrobe"}
                          className={`w-full bg-transparent font-medium uppercase focus:outline-none focus:bg-indigo-50/20 py-0.5 rounded ${
                            isAdvanceRow ? 'text-amber-950 font-bold' : 'text-slate-900'
                          }`}
                        />
                      </td>

                      {/* (+) Work / Charge vs (-) Advance Received Toggle */}
                      <td className={`py-2 px-1 text-center ${cellBorderClass}`}>
                        <button
                          type="button"
                          onClick={() => handleToggleItemType(index)}
                          title="Click to toggle: (+) Work/Bill vs (-) Advance Received / Minus"
                          className={`px-2 py-0.5 rounded text-[10.5px] font-extrabold flex items-center justify-center gap-0.5 mx-auto transition ${
                            isAdvanceRow
                              ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 shadow-2xs'
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 shadow-2xs'
                          }`}
                        >
                          {isAdvanceRow ? '(-) Advance' : '(+) Work'}
                        </button>
                      </td>

                      {/* Quantity & Unit (Visible only in 'measurement_sqft' mode) */}
                      {!isCashLedger && (
                        <>
                          <td className={`py-2 px-2 text-center ${cellBorderClass}`}>
                            <div className="flex items-center justify-center gap-1 font-mono">
                              <input
                                type="number"
                                step="any"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-14 text-center font-bold text-slate-800 bg-transparent focus:outline-none focus:bg-indigo-50/20 py-0.5 rounded"
                              />
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => handleUpdateItem(index, 'unit', e.target.value)}
                                placeholder="Sq.Ft"
                                className="w-12 text-center text-slate-600 uppercase bg-transparent focus:outline-none focus:bg-indigo-50/20 py-0.5 rounded text-[10.5px] font-semibold"
                              />
                            </div>
                          </td>

                          {/* Rate (Visible only in 'measurement_sqft' mode) */}
                          <td className={`py-2 px-3 text-right font-mono font-semibold ${cellBorderClass}`}>
                            <input
                              type="number"
                              step="any"
                              value={item.rate}
                              onChange={(e) => handleUpdateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                              className="w-20 text-right font-bold text-slate-800 bg-transparent focus:outline-none focus:bg-indigo-50/20 py-0.5 rounded"
                            />
                          </td>
                        </>
                      )}

                      {/* TOTAL AMOUNT - DIRECTLY EDITABLE (Shows + or -) */}
                      <td className="py-2 px-3 text-right font-mono tabular-nums">
                        <div className="flex items-center justify-end group/itemtotal">
                          <span className={`text-xs mr-0.5 font-bold ${isAdvanceRow ? 'text-rose-600' : 'text-slate-500'}`}>
                            {isAdvanceRow ? `- ${doc.currency}` : `+ ${doc.currency}`}
                          </span>
                          <input
                            type="number"
                            step="any"
                            value={item.amount}
                            onChange={(e) => handleUpdateItemTotalAmount(index, Math.abs(parseFloat(e.target.value) || 0))}
                            title="Click to directly edit amount"
                            className={`w-28 text-right font-extrabold bg-transparent focus:outline-none focus:ring-1 px-1 py-0.5 rounded font-mono tabular-nums text-xs border border-transparent transition cursor-text ${
                              isAdvanceRow
                                ? 'text-rose-700 hover:border-rose-400 focus:bg-rose-100/70 focus:ring-rose-500'
                                : 'text-slate-900 hover:border-amber-400 focus:bg-amber-100/70 focus:ring-amber-500'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Row delete on hover */}
                      {isEditable && (
                        <td className="py-2 px-1 text-center no-print">
                          {doc.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(index)}
                              className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-1 transition-opacity cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* In-Table Add Buttons (Work Charge + and Advance Received -) */}
            {isEditable && (
              <div className="py-2.5 px-3 bg-slate-50 border-t border-slate-300 no-print flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAddRow('charge')}
                  className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-md font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <span>+ + Add Work / Charge Item</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddRow('advance')}
                  className="px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-md font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <span>- - Add Advance / Payment Received</span>
                </button>
              </div>
            )}
          </div>

          {/* ================= TOTALS & ADVANCE DEDUCTION SECTION (With Distinct Grid Lines) ================= */}
          <div className="flex justify-end mb-3">
            <div className="w-full max-w-md border-2 border-slate-400 rounded overflow-hidden text-xs">
              
              {/* Total Work Charges / Subtotal */}
              <div className="flex justify-between items-center py-2 px-4 border-b border-slate-300 bg-white">
                <span className="font-bold text-slate-700 uppercase tracking-wide">
                  {calculations.totalAdvanceDeductions > 0 ? 'TOTAL WORK CHARGES:' : 'SUBTOTAL:'}
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {formatCurrency(calculations.totalWorkCharges || calculations.rawSubtotal, doc.currency)}
                </span>
              </div>

              {/* Customizable Highlight Service Tax / GST Box */}
              {doc.taxType !== 'none' ? (
                <div 
                  className="py-2 px-4 border-b border-slate-300 transition-colors relative group"
                  style={{ 
                    backgroundColor: doc.taxBoxBgColor || '#fef3c7',
                    color: doc.taxTextColor || '#78350f'
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-[11px] uppercase tracking-wide">
                        {isEditable ? (
                          <input
                            type="text"
                            value={doc.taxCustomLabel !== undefined ? doc.taxCustomLabel : 'Service Tax / GST'}
                            onChange={(e) => handleUpdate('taxCustomLabel', e.target.value)}
                            placeholder="Service Tax / GST"
                            className="font-extrabold bg-transparent border-b border-dashed border-current focus:outline-none px-1 text-xs"
                            style={{ color: doc.taxTextColor || '#78350f' }}
                          />
                        ) : (
                          <span>{doc.taxCustomLabel || 'Service Tax / GST'}</span>
                        )}
                      </span>
                      <div className="flex items-center gap-0.5 text-xs font-semibold">
                        <span>(</span>
                        {isEditable ? (
                          <input
                            type="number"
                            value={doc.items[0]?.taxRate || 18}
                            onChange={(e) => {
                              const newTax = parseFloat(e.target.value) || 0;
                              const newItems = doc.items.map(it => ({ ...it, taxRate: newTax }));
                              onUpdateDocument && onUpdateDocument({ ...doc, items: newItems, updatedAt: new Date().toISOString() });
                            }}
                            className="w-10 text-center font-bold bg-transparent border-b border-current focus:outline-none"
                            style={{ color: doc.taxTextColor || '#78350f' }}
                          />
                        ) : (
                          <span>{doc.items[0]?.taxRate || 18}</span>
                        )}
                        <span>%):</span>
                      </div>
                    </div>

                    <span className="font-mono tabular-nums font-extrabold text-xs">
                      + {formatCurrency(calculations.totalTax, doc.currency)}
                    </span>
                  </div>

                  {/* Edit Controls: Box Color & Text Color pickers */}
                  {isEditable && (
                    <div className="no-print mt-1.5 pt-1.5 border-t border-black/10 flex flex-wrap items-center justify-between gap-1.5 text-[10px] opacity-90">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">Box Color:</span>
                        {[
                          { hex: '#fef3c7', label: 'Amber' },
                          { hex: '#e0e7ff', label: 'Indigo' },
                          { hex: '#dcfce7', label: 'Emerald' },
                          { hex: '#fee2e2', label: 'Rose' },
                          { hex: '#f1f5f9', label: 'Slate' },
                          { hex: '#0f172a', label: 'Dark' },
                          { hex: '#ffffff', label: 'White' },
                        ].map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            title={c.label}
                            onClick={() => handleUpdate('taxBoxBgColor', c.hex)}
                            className="w-3.5 h-3.5 rounded-full border border-black/20 hover:scale-125 transition-transform cursor-pointer"
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                        <input
                          type="color"
                          value={doc.taxBoxBgColor || '#fef3c7'}
                          onChange={(e) => handleUpdate('taxBoxBgColor', e.target.value)}
                          title="Custom Box Color"
                          className="w-4 h-4 rounded cursor-pointer border-0 p-0"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">Text Color:</span>
                        {[
                          { hex: '#78350f', label: 'Amber' },
                          { hex: '#1e1b4b', label: 'Navy' },
                          { hex: '#064e3b', label: 'Green' },
                          { hex: '#991b1b', label: 'Red' },
                          { hex: '#0f172a', label: 'Black' },
                          { hex: '#ffffff', label: 'White' },
                        ].map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            title={c.label}
                            onClick={() => handleUpdate('taxTextColor', c.hex)}
                            className="w-3.5 h-3.5 rounded-full border border-black/20 hover:scale-125 transition-transform cursor-pointer"
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                        <input
                          type="color"
                          value={doc.taxTextColor || '#78350f'}
                          onChange={(e) => handleUpdate('taxTextColor', e.target.value)}
                          title="Custom Text Color"
                          className="w-4 h-4 rounded cursor-pointer border-0 p-0"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdate('taxType', 'none')}
                          className="text-[9.5px] text-rose-600 hover:underline ml-1 cursor-pointer font-bold"
                          title="Hide Tax Box"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : isEditable ? (
                <div className="py-1.5 px-4 border-b border-slate-300 bg-slate-50 text-center no-print">
                  <button
                    type="button"
                    onClick={() => handleUpdate('taxType', 'gst')}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                  >
                    <span>+ Add Highlight Box for Service Tax / GST / Labour</span>
                  </button>
                </div>
              ) : null}

              {/* Shipping / Transport Cost */}
              {(doc.shippingCharges > 0 || isEditable) && (
                <div className="flex justify-between items-center py-1.5 px-4 border-b border-slate-300 bg-white">
                  <span className="text-slate-700 font-medium">Transport / Freight Charges:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-mono">+ {doc.currency}</span>
                    <input
                      type="number"
                      value={doc.shippingCharges || 0}
                      onChange={(e) => handleUpdate('shippingCharges', parseFloat(e.target.value) || 0)}
                      className="w-20 text-right font-mono font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:outline-none px-1"
                    />
                  </div>
                </div>
              )}

              {/* GRAND TOTAL (Directly Editable with Auto Reset!) */}
              <div className="flex justify-between items-center py-2 px-4 bg-slate-100 border-b-2 border-slate-400 font-bold group">
                <div className="flex items-center gap-2">
                  <span className="uppercase text-slate-900 tracking-wider">GRAND TOTAL:</span>
                  {doc.customGrandTotal !== undefined && (
                    <button
                      type="button"
                      onClick={() => handleUpdate('customGrandTotal', undefined)}
                      title="Reset to auto-calculated total"
                      className="no-print text-[10px] bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full flex items-center gap-1 transition font-sans font-semibold cursor-pointer"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Auto</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-600 font-mono text-sm font-bold">{doc.currency}</span>
                  <input
                    type="number"
                    step="any"
                    value={calculations.grandTotal}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      handleUpdate('customGrandTotal', isNaN(val) ? 0 : val);
                    }}
                    title="Click to directly edit Grand Total amount"
                    className="w-36 text-right font-mono text-base font-extrabold text-slate-900 bg-transparent hover:border-amber-400 focus:bg-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500 px-1.5 py-0.5 rounded border border-transparent transition cursor-text"
                  />
                </div>
              </div>

              {/* ADVANCES & DEDUCTIONS SECTION (Minus Items + Direct Advance) */}
              <div className="py-2 px-4 bg-amber-50/90 border-b-2 border-slate-400 space-y-1.5">
                <div className="flex justify-between items-center font-bold text-amber-950">
                  <span className="uppercase tracking-wide">LESS TOTAL ADVANCE / RECEIVED:</span>
                  <span className="font-mono font-extrabold text-rose-600 tabular-nums">
                    - {formatCurrency(calculations.totalAdvanceDeductions, doc.currency)}
                  </span>
                </div>

                {/* Direct advance entry box */}
                <div className="flex justify-between items-center text-[11px] text-amber-900 pt-1 border-t border-amber-200/60">
                  <div className="flex items-center gap-1.5">
                    <span>Direct Cash / UPI Advance Received:</span>
                    <input
                      type="number"
                      value={doc.advanceReceived || ''}
                      onChange={(e) => handleUpdate('advanceReceived', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-24 px-1.5 py-0.5 border border-amber-400 rounded bg-white text-right font-mono font-bold text-amber-950 focus:outline-none text-xs"
                    />
                  </div>
                  <span className="font-mono font-bold text-rose-600">
                    - {formatCurrency(doc.advanceReceived || 0, doc.currency)}
                  </span>
                </div>
              </div>

              {/* NET REMAINING DUE (High contrast highlight bar) */}
              <div 
                className="flex justify-between items-center py-2.5 px-4 text-white font-extrabold shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                <div>
                  <span className="tracking-wider uppercase text-sm block">NET BALANCE DUE:</span>
                  <span className="text-[10px] font-normal opacity-90">Remaining Payable Amount</span>
                </div>
                <span className="font-mono text-xl tabular-nums" style={{ color: secondaryColor || '#fef08a' }}>
                  {formatCurrency(calculations.netRemainingDue, doc.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* ================= AMOUNT IN WORDS BOX (With Framing Lining) ================= */}
          <div className="border border-slate-400 rounded-lg p-3.5 mb-3 bg-slate-50/70 text-xs space-y-1.5 leading-relaxed">
            <div>
              <span className="font-bold text-slate-800 uppercase">TOTAL AMOUNT IN WORDS: </span>
              <span className="font-semibold text-slate-900 italic">
                {numberToWordsIndian(calculations.grandTotal, doc.currency === '₹' ? 'Rupees' : doc.currency)}
              </span>
            </div>

            {(calculations.totalAdvanceDeductions > 0 || (doc.advanceReceived || 0) > 0) && (
              <div className="pt-1 border-t border-slate-200">
                <span className="font-bold text-amber-950 uppercase">BALANCE PAYABLE IN WORDS: </span>
                <span className="font-bold text-slate-900 italic">
                  {numberToWordsIndian(calculations.netRemainingDue, doc.currency === '₹' ? 'Rupees' : doc.currency)}
                </span>
              </div>
            )}
          </div>

          {/* ================= BANK DETAILS & UPI QR (Editable & Open Amount Support) ================= */}
          {doc.showUpiQr && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-slate-50 border border-slate-300 rounded-lg mb-3 text-xs gap-3">
              <div className="space-y-1 flex-1">
                <p className="font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-700" />
                  Bank & Payment Details:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-700">
                  <div className="flex items-center gap-1">
                    <span className="shrink-0 text-slate-500">Bank:</span>
                    <input
                      type="text"
                      value={doc.bankDetails.bankName}
                      onChange={(e) => handleUpdateBank('bankName', e.target.value)}
                      placeholder="State Bank of India"
                      className="font-bold text-slate-900 bg-transparent hover:border-b hover:border-slate-400 focus:outline-none focus:bg-white px-1 py-0.2 rounded w-full"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="shrink-0 text-slate-500">A/C No:</span>
                    <input
                      type="text"
                      value={doc.bankDetails.accountNumber}
                      onChange={(e) => handleUpdateBank('accountNumber', e.target.value)}
                      placeholder="32109876543"
                      className="font-mono font-bold text-slate-900 bg-transparent hover:border-b hover:border-slate-400 focus:outline-none focus:bg-white px-1 py-0.2 rounded w-full"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="shrink-0 text-slate-500">IFSC:</span>
                    <input
                      type="text"
                      value={doc.bankDetails.ifsc}
                      onChange={(e) => handleUpdateBank('ifsc', e.target.value.toUpperCase())}
                      placeholder="SBIN0001234"
                      className="font-mono font-bold text-slate-900 bg-transparent hover:border-b hover:border-slate-400 focus:outline-none focus:bg-white px-1 py-0.2 rounded w-full"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="shrink-0 text-slate-500">UPI ID:</span>
                    <input
                      type="text"
                      value={doc.bankDetails.upiId}
                      onChange={(e) => handleUpdateBank('upiId', e.target.value)}
                      placeholder="8181881311@paytm"
                      className="font-mono font-bold text-emerald-800 bg-transparent hover:border-b hover:border-slate-400 focus:outline-none focus:bg-white px-1 py-0.2 rounded w-full"
                    />
                  </div>
                </div>
              </div>

              {/* UPI QR Code with Open / Custom Amount Badge */}
              {upiQrUrl && (
                <div className="flex items-center gap-2.5 bg-white p-2 rounded-lg border border-slate-300 shadow-2xs shrink-0 self-center sm:self-auto">
                  <img src={upiQrUrl} alt="UPI QR" className="w-16 h-16 object-contain" />
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <span className={`text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        doc.qrAmountMode === 'fixed' 
                          ? 'bg-amber-100 text-amber-900' 
                          : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {doc.qrAmountMode === 'fixed' ? '🔒 Fixed Bill Due' : '⚡ Open Amount'}
                      </span>
                    </div>
                    <div className="text-[11px] font-extrabold text-slate-900 mt-0.5 leading-tight">
                      {doc.qrAmountMode === 'fixed' 
                        ? `${formatCurrency(calculations.netRemainingDue, doc.currency)} Fixed` 
                        : 'Customer Enters Any Amount'}
                    </div>
                    <div className="text-[8.5px] text-slate-500 font-medium mt-0.5">
                      GPay • PhonePe • Paytm • BHIM
                    </div>
                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => handleUpdate('qrAmountMode', doc.qrAmountMode === 'fixed' ? 'open' : 'fixed')}
                        className="no-print mt-1 text-[9px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-indigo-700 font-bold border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                        title="Click to toggle between Open Amount (customer enters any amount) and Fixed Amount"
                      >
                        <span>{doc.qrAmountMode === 'fixed' ? '🔒 Fixed' : '⚡ Open (No Fixed Amount)'}</span>
                        <span className="text-slate-400 font-normal underline">Toggle ⇄</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= FOOTER / SIGNATURE ================= */}
        <div className="pt-2 border-t-2 border-slate-300 mt-2 text-xs">
          <div className="flex justify-between items-end">
            <div className="max-w-md">
              <p className="font-bold text-[10px] uppercase text-slate-600">Terms & Conditions:</p>
              <textarea
                rows={2}
                value={doc.termsConditions}
                onChange={(e) => handleUpdate('termsConditions', e.target.value)}
                className="w-full text-[10px] text-slate-700 bg-transparent focus:outline-none focus:bg-indigo-50/20 py-0.5 rounded leading-relaxed resize-none"
              />
            </div>

            <div className="text-center w-52">
              <div className="h-12 flex items-center justify-center">
                {doc.signatureImage ? (
                  <img src={doc.signatureImage} alt="Signature" className="max-h-12 max-w-full object-contain" />
                ) : (
                  <div className="text-[10px] text-slate-300 italic border-b border-dashed border-slate-300 w-36 pb-1">
                    Signature
                  </div>
                )}
              </div>
              <p className="font-bold text-slate-900 text-xs border-t border-slate-300 pt-1">
                For {doc.company.name}
              </p>
              <p className="text-[10px] text-slate-600">{doc.signatureTitle || 'Proprietor'}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
