import React, { useState } from 'react';
import { DocumentData } from '../types/document';
import { calculateDocument } from '../utils/calculator';
import { formatCurrency } from '../utils/numberToWords';
import { captureDocumentAsImage, downloadDocumentAsImage } from '../utils/documentImage';
import { downloadPrintableHtml } from '../utils/exporter';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  MessageSquare, 
  Share2, 
  Image as ImageIcon, 
  Download, 
  Loader2, 
  Sparkles,
  QrCode
} from 'lucide-react';

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
  const [isCapturingImage, setIsCapturingImage] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<string>('');

  if (!isOpen) return null;

  const calculations = calculateDocument(doc);
  const isQuote = doc.type === 'quotation' || doc.type === 'estimate';

  // Build clean WhatsApp message text in English
  const messageLines = [
    `*${isQuote ? '📋 QUOTATION / ESTIMATE' : '🧾 TAX INVOICE'} #${doc.docNumber}*`,
    `Business: *${doc.company.name}*`,
    `Client: *${doc.client.name}* ${doc.client.siteLocation ? `(Site: ${doc.client.siteLocation})` : ''}`,
    `Date: ${doc.date}`,
    ``,
    `*Summary of Particulars:*`,
    ...doc.items.slice(0, 8).map((it, i) => `${i + 1}. ${it.description} = *${it.itemType === 'advance' ? '-' : ''}${doc.currency}${it.amount}*`),
    doc.items.length > 8 ? `... and ${doc.items.length - 8} additional items` : '',
    ``,
    `*Total Work Charges: ${doc.currency}${calculations.totalWorkCharges.toFixed(2)}*`,
    calculations.totalAdvanceDeductions > 0 ? `*Less Total Advance Received: -${doc.currency}${calculations.totalAdvanceDeductions.toFixed(2)}*` : '',
    `*Net Balance Due: ${doc.currency}${calculations.netRemainingDue.toFixed(2)}*`,
    ``,
    doc.bankDetails.upiId ? `*UPI ID:* ${doc.bankDetails.upiId} (GPay / PhonePe / Paytm)` : '',
    doc.showUpiQr ? `(Live UPI QR code is attached in the document for instant payment)` : '',
    ``,
    `Thank you for your business! 🙏`,
  ].filter(Boolean).join('\n');

  // Option 1: Native Share FULL BILL IMAGE with QR CODE
  const handleShareFullImage = async () => {
    setIsCapturingImage(true);
    setShareSuccess('');
    try {
      const result = await captureDocumentAsImage('printable-document', doc);
      if (!result) {
        throw new Error('Capture failed');
      }

      const shareTitle = `${isQuote ? 'Quotation' : 'Invoice'} #${doc.docNumber} - ${doc.company.name}`;
      const shareText = `${shareTitle}\nNet Balance Due: ${doc.currency} ${calculations.netRemainingDue.toFixed(2)}`;

      if (navigator.canShare && navigator.canShare({ files: [result.file] })) {
        await navigator.share({
          files: [result.file],
          title: shareTitle,
          text: shareText,
        });
        setShareSuccess('Document shared successfully!');
      } else {
        // Fallback: download the image and prompt WhatsApp
        await downloadDocumentAsImage(doc, 'printable-document');
        setShareSuccess('Full bill image downloaded! Send via WhatsApp below.');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Share image error, downloading instead:', err);
        await downloadDocumentAsImage(doc, 'printable-document');
        setShareSuccess('Image saved to downloads! Share directly on WhatsApp.');
      }
    } finally {
      setIsCapturingImage(false);
    }
  };

  // Option 2: Download Full Bill Image
  const handleDownloadImage = async () => {
    setIsCapturingImage(true);
    try {
      await downloadDocumentAsImage(doc, 'printable-document');
      setShareSuccess('Full document image saved successfully!');
    } catch (e) {
      console.error(e);
    } finally {
      setIsCapturingImage(false);
    }
  };

  // Option 3: Download Offline Printable HTML
  const handleDownloadHtml = async () => {
    await downloadPrintableHtml(doc);
    setShareSuccess('Offline printable HTML downloaded!');
  };

  // Option 4: Open WhatsApp with text message
  const handleSendWhatsAppText = () => {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2 text-emerald-600">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                Share Quotation / Bill
              </h3>
              <p className="text-[11px] text-slate-500">Send complete letterhead with live payment QR code</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Notification Toast */}
          {shareSuccess && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{shareSuccess}</span>
            </div>
          )}

          {/* PRIMARY ACTION 1: Share Full Image with QR Code */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border-2 border-emerald-500 rounded-2xl shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-emerald-950 dark:text-emerald-100 text-xs sm:text-sm flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>1-Click Share (Full Image + QR Code)</span>
              </span>
              <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                Recommended
              </span>
            </div>
            <p className="text-[11px] text-emerald-900 dark:text-emerald-200 leading-normal">
              Shares the complete letterhead, full list of particulars, and <strong>live UPI QR code as an image</strong> directly to WhatsApp.
            </p>
            <button
              type="button"
              disabled={isCapturingImage}
              onClick={handleShareFullImage}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isCapturingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating image...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>📲 Share Full Bill Image (WhatsApp / Device)</span>
                </>
              )}
            </button>
          </div>

          {/* ACTION 2: Quick Downloads (Image PNG or Offline HTML) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isCapturingImage}
              onClick={handleDownloadImage}
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl text-left transition flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs mb-1">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Download Image (PNG)</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Save high-resolution image to device gallery
              </p>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl text-left transition flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs mb-1">
                <Download className="w-3.5 h-3.5" />
                <span>Printable File (HTML)</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Offline standalone file ready for any printer
              </p>
            </button>
          </div>

          {/* ACTION 3: Client Phone & WhatsApp Text */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client Mobile Number (WhatsApp)
              </label>
              <div className="flex gap-2">
                <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300 flex items-center font-bold">
                  +91
                </span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={handleSendWhatsAppText}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>

            {/* Text Message Preview */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Text Summary Preview
                </label>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:underline"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10.5px] text-slate-700 dark:text-slate-300 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {messageLines}
              </pre>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
