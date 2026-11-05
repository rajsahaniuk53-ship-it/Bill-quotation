import React, { useState } from 'react';
import { DocumentData, LineItem, DocumentType } from '../types/document';
import { 
  Building2, 
  User, 
  Package, 
  Receipt, 
  CreditCard, 
  FileText, 
  Plus, 
  Trash2, 
  Copy, 
  Upload, 
  PenTool, 
  QrCode,
  Sparkles,
  HelpCircle,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { calculateDocument } from '../utils/calculator';
import { formatCurrency } from '../utils/numberToWords';

interface DocumentEditorFormProps {
  document: DocumentData;
  onChange: (updatedDoc: DocumentData) => void;
  onOpenSignatureModal: () => void;
  onOpenTemplateSelector: () => void;
}

const COMMON_UNITS = ['Pcs', 'Box', 'Kg', 'Mtr', 'Hours', 'Days', 'Set', 'Sq.Ft', 'Pkt', 'Nos', 'Ltr'];
const GST_RATES = [0, 5, 12, 18, 28];

export const DocumentEditorForm: React.FC<DocumentEditorFormProps> = ({
  document: doc,
  onChange,
  onOpenSignatureModal,
  onOpenTemplateSelector,
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'company' | 'client' | 'basic' | 'taxes' | 'bank' | 'terms'>('items');

  const updateField = <K extends keyof DocumentData>(field: K, value: DocumentData[K]) => {
    onChange({
      ...doc,
      [field]: value,
      updatedAt: new Date().toISOString(),
    });
  };

  const updateCompany = (field: string, value: string) => {
    onChange({
      ...doc,
      company: { ...doc.company, [field]: value },
      updatedAt: new Date().toISOString(),
    });
  };

  const updateClient = (field: string, value: string) => {
    onChange({
      ...doc,
      client: { ...doc.client, [field]: value },
      updatedAt: new Date().toISOString(),
    });
  };

  const updateBank = (field: string, value: string) => {
    onChange({
      ...doc,
      bankDetails: { ...doc.bankDetails, [field]: value },
      updatedAt: new Date().toISOString(),
    });
  };

  // Item helpers
  const handleItemChange = (index: number, field: keyof LineItem, val: any) => {
    const newItems = [...doc.items];
    newItems[index] = {
      ...newItems[index],
      [field]: val,
    };
    // Update calculated amount
    const qty = Number(field === 'quantity' ? val : newItems[index].quantity) || 0;
    const rate = Number(field === 'rate' ? val : newItems[index].rate) || 0;
    const disc = Number(field === 'discountPercent' ? val : newItems[index].discountPercent) || 0;
    const gross = qty * rate;
    const net = gross - (gross * disc) / 100;
    newItems[index].amount = Number(net.toFixed(2));

    onChange({
      ...doc,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  };

  const addItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: '',
      hsn: '',
      quantity: 1,
      unit: 'Pcs',
      rate: 0,
      discountPercent: 0,
      taxRate: doc.taxType === 'gst' ? 18 : 0,
      amount: 0,
    };
    onChange({
      ...doc,
      items: [...doc.items, newItem],
      updatedAt: new Date().toISOString(),
    });
  };

  const duplicateItem = (index: number) => {
    const target = doc.items[index];
    const cloned: LineItem = {
      ...target,
      id: `item-${Date.now()}`,
      description: `${target.description} (Copy)`,
    };
    const newItems = [...doc.items];
    newItems.splice(index + 1, 0, cloned);
    onChange({
      ...doc,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  };

  const removeItem = (index: number) => {
    if (doc.items.length <= 1) {
      alert('At least one item is required in the document.');
      return;
    }
    const newItems = doc.items.filter((_, i) => i !== index);
    onChange({
      ...doc,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          updateCompany('logoUrl', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const calculations = calculateDocument(doc);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
      
      {/* Top Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-3 pt-3 flex items-center gap-1 overflow-x-auto text-xs shrink-0">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-1.5 px-3 py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'items'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Package className="w-3.5 h-3.5" /> Items ({doc.items.length})
        </button>

        <button
          onClick={() => setActiveTab('basic')}
          className={`flex items-center gap-1.5 px-3 py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'basic'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" /> Doc Info
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-1.5 px-3 py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'company'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" /> My Business
        </button>

        <button
          onClick={() => setActiveTab('client')}
          className={`flex items-center gap-1.5 px-3 py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'client'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <User className="w-3.5 h-3.5" /> Client
        </button>

        <button
          onClick={() => setActiveTab('taxes')}
          className={`flex items-center gap-1.5 px-3 py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'taxes'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Percent className="w-3.5 h-3.5" /> Taxes & Fees
        </button>

        <button
          onClick={() => setActiveTab('bank')}
          className={`flex items-center gap-1.5 px-3 py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'bank'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" /> Bank & QR
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-1.5 px-3 py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'terms'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Sign & Terms
        </button>
      </div>

      {/* Tab Panels Body */}
      <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-xs">
        
        {/* ================= TAB 1: ITEMS ================= */}
        {activeTab === 'items' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Products & Services List (सामान व सेवा सूची)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Rate, Quantity, Discount aur GST auto-calculate hote hain
                </p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Item (+ सामान जोड़ें)
              </button>
            </div>

            {/* Line Items List */}
            <div className="space-y-3">
              {doc.items.map((item, index) => (
                <div 
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] flex items-center justify-center font-mono">
                        {index + 1}
                      </span>
                      Item #{index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => duplicateItem(index)}
                        title="Duplicate Item"
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        title="Delete Item"
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-2.5">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Item Name & Description (विवरण) *
                    </label>
                    <textarea
                      rows={2}
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="e.g. 1 HP Submersible Pump / Web Development Services / CPVC Pipe 1 Inch"
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Pricing and Quantity Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 mb-1">
                        HSN / SAC Code
                      </label>
                      <input
                        type="text"
                        value={item.hsn || ''}
                        onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                        placeholder="e.g. 998314"
                        className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 mb-1">
                        Quantity (मात्रा) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 mb-1">
                        Unit (इकाई)
                      </label>
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                      >
                        {COMMON_UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 mb-1">
                        Rate ({doc.currency}) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 mb-1">
                        Discount %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discountPercent}
                        onChange={(e) => handleItemChange(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* GST rate and calculated line total */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">GST Rate:</span>
                      <div className="flex gap-1">
                        {GST_RATES.map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => handleItemChange(index, 'taxRate', rate)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                              item.taxRate === rate
                                ? 'bg-indigo-600 text-white font-bold'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                            }`}
                          >
                            {rate}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">Total ({doc.currency}):</span>
                      <input
                        type="number"
                        step="any"
                        value={item.amount}
                        onChange={(e) => {
                          const newAmt = parseFloat(e.target.value) || 0;
                          const qty = Number(item.quantity) || 1;
                          const newItems = [...doc.items];
                          newItems[index] = {
                            ...newItems[index],
                            amount: newAmt,
                            rate: qty > 0 ? Number((newAmt / qty).toFixed(2)) : newAmt,
                          };
                          onChange({ ...doc, items: newItems, updatedAt: new Date().toISOString() });
                        }}
                        className="w-24 px-2 py-0.5 border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white font-mono text-xs text-right focus:ring-1 focus:ring-amber-500"
                        title="Click to directly edit Total Amount"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="w-full py-2.5 border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 rounded-xl text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-center gap-2 hover:bg-indigo-50/30 transition-colors"
            >
              <Plus className="w-4 h-4" /> + Add Another Item (नया सामान जोड़ें)
            </button>
          </div>
        )}

        {/* ================= TAB 2: BASIC INFO ================= */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Document Information (दस्तावेज़ विवरण)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Document Type (प्रकार) *
                </label>
                <select
                  value={doc.type}
                  onChange={(e) => updateField('type', e.target.value as DocumentType)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                >
                  <option value="quotation">Quotation / कोटेशन (Estimate)</option>
                  <option value="invoice">Tax Invoice / बिल (टैक्स इनवॉइस)</option>
                  <option value="estimate">Estimate / अनुमान</option>
                  <option value="proforma">Proforma Invoice</option>
                  <option value="delivery_challan">Delivery Challan</option>
                  <option value="cash_memo">Cash Memo / नकद पर्ची</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {doc.type === 'quotation' ? 'Quotation Number' : 'Invoice Number'} *
                </label>
                <input
                  type="text"
                  value={doc.docNumber}
                  onChange={(e) => updateField('docNumber', e.target.value)}
                  placeholder="e.g. QT-2026-001 or INV-001"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Date of Issue (दिनांक) *
                </label>
                <input
                  type="date"
                  value={doc.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {doc.type === 'quotation' ? 'Valid Until (वैधता तारीख)' : 'Due Date (भुगतान तारीख)'}
                </label>
                <input
                  type="date"
                  value={doc.dueDate}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  P.O. Number / Work Order No
                </label>
                <input
                  type="text"
                  value={doc.poNumber || ''}
                  onChange={(e) => updateField('poNumber', e.target.value)}
                  placeholder="e.g. PO-88902"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Payment Terms / भुगतान शर्तें
                </label>
                <input
                  type="text"
                  value={doc.paymentTerms || ''}
                  onChange={(e) => updateField('paymentTerms', e.target.value)}
                  placeholder="e.g. Immediate / 50% Advance / Net 15 Days"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: COMPANY DETAILS ================= */}
        {activeTab === 'company' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  My Business / Company Details (आपकी दुकान या कंपनी)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Yeh jaankari har letterhead aur bill par sabse upar show hogi
                </p>
              </div>
            </div>

            {/* Logo Upload Box */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {doc.company.logoUrl ? (
                  <img src={doc.company.logoUrl} alt="Logo" className="w-14 h-14 object-contain rounded bg-white p-1 border" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center font-bold text-xl">
                    {doc.company.name.charAt(0) || 'B'}
                  </div>
                )}
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">Business Logo (कंपनी का लोगो)</p>
                  <p className="text-[11px] text-slate-500">PNG, JPG or SVG format</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span>Upload Logo</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                {doc.company.logoUrl && (
                  <button
                    type="button"
                    onClick={() => updateCompany('logoUrl', '')}
                    className="text-xs text-rose-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Business / Company Name (दुकान/कंपनी का नाम) *
                </label>
                <input
                  type="text"
                  value={doc.company.name}
                  onChange={(e) => updateCompany('name', e.target.value)}
                  placeholder="e.g. Apex Hardware & Electricals / Nexus Technologies"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Tagline / Business Subtitle (स्लोगन)
                </label>
                <input
                  type="text"
                  value={doc.company.tagline || ''}
                  onChange={(e) => updateCompany('tagline', e.target.value)}
                  placeholder="e.g. Complete Plumbing & Sanitary Solutions"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Phone Number (फोन नंबर) *
                </label>
                <input
                  type="text"
                  value={doc.company.phone}
                  onChange={(e) => updateCompany('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Email Address (ईमेल) *
                </label>
                <input
                  type="email"
                  value={doc.company.email}
                  onChange={(e) => updateCompany('email', e.target.value)}
                  placeholder="contact@mybusiness.com"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Address Line 1 (पता लाइन 1) *
                </label>
                <input
                  type="text"
                  value={doc.company.addressLine1}
                  onChange={(e) => updateCompany('addressLine1', e.target.value)}
                  placeholder="Shop No. 12, Main Market Road"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  City (शहर) *
                </label>
                <input
                  type="text"
                  value={doc.company.city}
                  onChange={(e) => updateCompany('city', e.target.value)}
                  placeholder="Jaipur / Mumbai / Delhi"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  State & Pincode (राज्य व पिनकोड)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={doc.company.state}
                    onChange={(e) => updateCompany('state', e.target.value)}
                    placeholder="State (e.g. Rajasthan)"
                    className="w-2/3 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    value={doc.company.pincode}
                    onChange={(e) => updateCompany('pincode', e.target.value)}
                    placeholder="Pincode"
                    className="w-1/3 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  GSTIN (जीएसटी नंबर)
                </label>
                <input
                  type="text"
                  value={doc.company.gstin || ''}
                  onChange={(e) => updateCompany('gstin', e.target.value.toUpperCase())}
                  placeholder="e.g. 08AAAAA0000A1Z5"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  PAN Number (पैन नंबर)
                </label>
                <input
                  type="text"
                  value={doc.company.pan || ''}
                  onChange={(e) => updateCompany('pan', e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: CLIENT DETAILS ================= */}
        {activeTab === 'client' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Client / Customer Details (ग्राहक का विवरण)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Customer / Contact Person Name (ग्राहक का नाम) *
                </label>
                <input
                  type="text"
                  value={doc.client.name}
                  onChange={(e) => updateClient('name', e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Client Business / Firm Name (फर्म का नाम)
                </label>
                <input
                  type="text"
                  value={doc.client.companyName || ''}
                  onChange={(e) => updateClient('companyName', e.target.value)}
                  placeholder="e.g. Royal Infotech Ltd"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Customer Phone (फोन नंबर)
                </label>
                <input
                  type="text"
                  value={doc.client.phone}
                  onChange={(e) => updateClient('phone', e.target.value)}
                  placeholder="+91 98290 12345"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Customer Email (ईमेल)
                </label>
                <input
                  type="email"
                  value={doc.client.email}
                  onChange={(e) => updateClient('email', e.target.value)}
                  placeholder="client@gmail.com"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Client Address (ग्राहक का पता)
                </label>
                <input
                  type="text"
                  value={doc.client.addressLine1}
                  onChange={(e) => updateClient('addressLine1', e.target.value)}
                  placeholder="Flat No 402, Shanti Vihar, Station Road"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  City & State (शहर व राज्य)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={doc.client.city}
                    onChange={(e) => updateClient('city', e.target.value)}
                    placeholder="City"
                    className="w-1/2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    value={doc.client.state}
                    onChange={(e) => updateClient('state', e.target.value)}
                    placeholder="State"
                    className="w-1/2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Client GSTIN (ग्राहक का जीएसटी)
                </label>
                <input
                  type="text"
                  value={doc.client.gstin || ''}
                  onChange={(e) => updateClient('gstin', e.target.value.toUpperCase())}
                  placeholder="e.g. 08BBBBB9999B1Z2"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: TAXES & CHARGES ================= */}
        {activeTab === 'taxes' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Taxes, Discounts & Extra Charges (टैक्स और अतिरिक्त शुल्क)
            </h3>

            {/* GST Configuration */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Tax Regime (टैक्स का प्रकार):</span>
                  <p className="text-[11px] text-slate-500">Enable GST for CGST, SGST and IGST calculations</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('taxType', 'gst')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      doc.taxType === 'gst'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200'
                    }`}
                  >
                    GST Bill (जीएसटी)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('taxType', 'none')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      doc.taxType === 'none'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200'
                    }`}
                  >
                    Non-GST / Exempt
                  </button>
                </div>
              </div>

              {doc.taxType === 'gst' && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">GST Supply Location:</span>
                    <p className="text-[11px] text-slate-500">
                      {doc.isInterstate 
                        ? 'Inter-State (बाहरी राज्य) → Full IGST applies' 
                        : 'Intra-State (समान राज्य) → 50% CGST + 50% SGST applies'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField('isInterstate', !doc.isInterstate)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-300"
                  >
                    {doc.isInterstate ? 'Switch to CGST+SGST (Local)' : 'Switch to IGST (Interstate)'}
                  </button>
                </div>
              )}
            </div>

            {/* Extra charges grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Overall Discount on Bill (अतिरिक्त छूट)
                </label>
                <div className="flex gap-2">
                  <select
                    value={doc.discountTotalType}
                    onChange={(e) => updateField('discountTotalType', e.target.value as 'fixed' | 'percentage')}
                    className="w-1/3 px-2 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="fixed">{doc.currency} Flat</option>
                    <option value="percentage">% Percent</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={doc.discountTotalValue}
                    onChange={(e) => updateField('discountTotalValue', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-2/3 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Delivery / Shipping Charges (डिलीवरी शुल्क)
                </label>
                <input
                  type="number"
                  min="0"
                  value={doc.shippingCharges}
                  onChange={(e) => updateField('shippingCharges', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Packaging / Handling Charges
                </label>
                <input
                  type="number"
                  min="0"
                  value={doc.packagingCharges}
                  onChange={(e) => updateField('packagingCharges', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-400 mb-1">
                  Less Advance Received (एडवांस मिला)
                </label>
                <input
                  type="number"
                  min="0"
                  value={doc.advanceReceived || ''}
                  onChange={(e) => updateField('advanceReceived', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Currency Symbol (मुद्रा)
                </label>
                <select
                  value={doc.currency}
                  onChange={(e) => updateField('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="₹">₹ INR (Indian Rupee)</option>
                  <option value="$">$ USD (US Dollar)</option>
                  <option value="€">€ EUR (Euro)</option>
                  <option value="£">£ GBP (British Pound)</option>
                  <option value="AED">AED (UAE Dirham)</option>
                </select>
              </div>
            </div>

            {/* Round off toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">Auto Round-Off (राउंड ऑफ)</span>
                <p className="text-[11px] text-slate-500">Automatically round total amount to the nearest integer</p>
              </div>
              <input
                type="checkbox"
                checked={doc.roundOff}
                onChange={(e) => updateField('roundOff', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ================= TAB 6: BANK DETAILS & UPI QR ================= */}
        {activeTab === 'bank' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Bank Details & Instant UPI QR (बैंक खाता और क्यूआर कोड)
                </h3>
                <p className="text-[11px] text-slate-500">
                  GPay / PhonePe / Paytm ke liye live QR code generate hota hai
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <input
                  type="checkbox"
                  checked={doc.showUpiQr}
                  onChange={(e) => updateField('showUpiQr', e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                Show UPI QR Code
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Bank Name (बैंक का नाम)
                </label>
                <input
                  type="text"
                  value={doc.bankDetails.bankName}
                  onChange={(e) => updateBank('bankName', e.target.value)}
                  placeholder="e.g. HDFC Bank / SBI / ICICI Bank"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Account Holder Name (खाताधारक का नाम)
                </label>
                <input
                  type="text"
                  value={doc.bankDetails.accountName}
                  onChange={(e) => updateBank('accountName', e.target.value)}
                  placeholder="e.g. Apex Hardware Stores"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Bank Account Number (खाता संख्या)
                </label>
                <input
                  type="text"
                  value={doc.bankDetails.accountNumber}
                  onChange={(e) => updateBank('accountNumber', e.target.value)}
                  placeholder="e.g. 50200012345678"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  IFSC Code (आईएफएससी कोड)
                </label>
                <input
                  type="text"
                  value={doc.bankDetails.ifsc}
                  onChange={(e) => updateBank('ifsc', e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Branch Name (शाखा)
                </label>
                <input
                  type="text"
                  value={doc.bankDetails.branch}
                  onChange={(e) => updateBank('branch', e.target.value)}
                  placeholder="e.g. Main Market Branch"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  UPI ID / VPA (गूगलपे / फोनपे यूपीआई)
                </label>
                <input
                  type="text"
                  value={doc.bankDetails.upiId}
                  onChange={(e) => updateBank('upiId', e.target.value)}
                  placeholder="e.g. 9876543210@paytm or business@okhdfcbank"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-semibold text-emerald-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 7: TERMS, NOTES & SIGNATURE ================= */}
        {activeTab === 'terms' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Terms & Conditions, Notes and Signature (नियम व हस्ताक्षर)
            </h3>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Customer Notes / विशेष टिप्पणी
              </label>
              <textarea
                rows={2}
                value={doc.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="e.g. Thank you for your business! Please feel free to reach out if you have any questions."
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Terms and Conditions */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Terms & Conditions (नियम व शर्तें)
                </label>
                <div className="flex gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => updateField('termsConditions', '1. Quotation validity is 15 days from issue.\n2. 50% advance required to start project.\n3. Goods once sold will not be taken back.')}
                    className="text-indigo-600 hover:underline"
                  >
                    Load Standard Terms
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => updateField('termsConditions', '1. Interest @ 18% p.a. will be charged after due date.\n2. Goods dispatched at buyer\'s risk.\n3. Subject to local legal jurisdiction.')}
                    className="text-indigo-600 hover:underline"
                  >
                    Load Retail Terms
                  </button>
                </div>
              </div>
              <textarea
                rows={3}
                value={doc.termsConditions}
                onChange={(e) => updateField('termsConditions', e.target.value)}
                placeholder="Enter document terms and conditions..."
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
              />
            </div>

            {/* Digital Signature section */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                  Digital Signature / Seal (डिजिटल दस्तखत)
                </p>
                <p className="text-[11px] text-slate-500">
                  Draw signature on canvas or upload company seal image
                </p>
              </div>

              <div className="flex items-center gap-2">
                {doc.signatureImage ? (
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded border">
                    <img src={doc.signatureImage} alt="Signature" className="h-8 max-w-[80px] object-contain" />
                    <button
                      type="button"
                      onClick={() => updateField('signatureImage', '')}
                      className="text-rose-500 hover:text-rose-700 p-1 text-xs"
                      title="Remove signature"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={onOpenSignatureModal}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs shadow-xs flex items-center gap-1"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  {doc.signatureImage ? 'Change Signature' : 'Sign Document (हस्ताक्षर जोड़ें)'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Signatory Designation / Title
              </label>
              <input
                type="text"
                value={doc.signatureTitle}
                onChange={(e) => updateField('signatureTitle', e.target.value)}
                placeholder="e.g. Authorized Signatory / Proprietor / Director"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Editor Footer with Quick Live Totals */}
      <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
          <span>Items: <strong className="text-slate-900 dark:text-white font-mono">{doc.items.length}</strong></span>
          <span>Tax: <strong className="text-slate-900 dark:text-white font-mono">{formatCurrency(calculations.totalTax, doc.currency)}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[11px]">Total:</span>
          <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
            {formatCurrency(calculations.grandTotal, doc.currency)}
          </span>
        </div>
      </div>
    </div>
  );
};
