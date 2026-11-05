import React, { useState } from 'react';
import { DocumentData } from '../types/document';
import { calculateDocument } from '../utils/calculator';
import { formatCurrency } from '../utils/numberToWords';
import { X, Send, Copy, Check, MessageSquare } from 'lucide-react';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentData;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  document: doc,
}) => {
  const [phone, setPhone] = useState<string>(doc.client.phone.replace(/[^0-9]/g, '') || '');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const calculations = calculateDocument(doc);
  const isQuote = doc.type === 'quotation' || doc.type === 'estimate';

  // Build clean WhatsApp message
  const messageLines = [
    `*${isQuote ? '📋 QUOTATION' : '🧾 TAX INVOICE'} #${doc.docNumber}*`,
    `From: *${doc.company.name}*`,
    `To: *${doc.client.name}* ${doc.client.companyName ? `(${doc.client.companyName})` : ''}`,
    `Date: ${doc.date}${doc.dueDate ? ` | Valid Till: ${doc.dueDate}` : ''}`,
    ``,
    `*Items Summary:*`,
    ...doc.items.map((it, i) => `${i + 1}. ${it.description} - ${it.quantity} ${it.unit} @ ${doc.currency}${it.rate} = *${doc.currency}${it.amount}*`),
    ``,
    `Subtotal: ${doc.currency}${calculations.rawSubtotal}`,
    calculations.totalTax > 0 ? `Tax/GST: ${doc.currency}${calculations.totalTax}` : '',
    calculations.totalDiscount > 0 ? `Discount: -${doc.currency}${calculations.totalDiscount}` : '',
    `*Grand Total: ${doc.currency}${calculations.grandTotal}*`,
    ``,
    doc.bankDetails.upiId ? `*Pay via UPI:* ${doc.bankDetails.upiId}` : '',
    doc.bankDetails.accountNumber ? `*Bank Transfer:* A/C: ${doc.bankDetails.accountNumber} | IFSC: ${doc.bankDetails.ifsc}` : '',
    ``,
    `Thank you for your business! 🙏`,
  ].filter(Boolean).join('\n');

  const handleSendWhatsApp = () => {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone; // default India code if 10 digits
    }
    const encoded = encodeURIComponent(messageLines);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageLines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2 text-emerald-600">
            <MessageSquare className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Share on WhatsApp (व्हाट्सएप पर भेजें)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Client WhatsApp Number (ग्राहक का व्हाट्सएप नंबर)
            </label>
            <div className="flex gap-2">
              <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300 flex items-center">
                +91
              </span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210 (10 digit mobile)"
                className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Message Preview (संदेश का प्रीव्यू)
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 hover:underline"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>
            <pre className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 font-mono max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {messageLines}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSendWhatsApp}
            className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Open in WhatsApp (व्हाट्सएप खोलें)
          </button>
        </div>
      </div>
    </div>
  );
};
