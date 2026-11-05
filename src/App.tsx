import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { DocumentData, LetterheadTemplate, DocumentType } from './types/document';
import { LETTERHEAD_TEMPLATES } from './data/letterheadTemplates';
import { SAMPLE_PRESETS } from './data/samplePresets';
import { DocumentRenderer } from './components/DocumentRenderer';
import { DocumentEditorForm } from './components/DocumentEditorForm';
import { TemplateSelectorModal } from './components/TemplateSelectorModal';
import { SignatureModal } from './components/SignatureModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { SavedRecordsModal } from './components/SavedRecordsModal';
import { VisitingCardMaker } from './components/VisitingCardMaker';
import { PWAInstallButton } from './components/PWAInstallButton';
import { calculateDocument } from './utils/calculator';
import { downloadPrintableHtml } from './utils/exporter';
import { 
  Printer, 
  Share2, 
  Palette, 
  Sparkles, 
  FolderDown, 
  FileText, 
  Receipt, 
  ArrowRightLeft, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  Edit3, 
  Columns, 
  Check, 
  Save, 
  Plus, 
  Layers,
  HelpCircle,
  FileSpreadsheet,
  CreditCard,
  Download
} from 'lucide-react';

const STORAGE_KEY_ACTIVE = 'billcraft_active_doc';
const STORAGE_KEY_RECORDS = 'billcraft_saved_records';

export default function App() {
  // App navigation section: 'documents' (Quotation & Bill) vs 'visiting_card' (Visiting Card)
  const [activeAppSection, setActiveAppSection] = useState<'documents' | 'visiting_card'>('documents');

  // Load initial document from localStorage or fallback to Sample 1
  const [currentDoc, setCurrentDoc] = useState<DocumentData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...SAMPLE_PRESETS[0].data,
          ...parsed,
          advanceReceived: parsed.advanceReceived !== undefined ? parsed.advanceReceived : SAMPLE_PRESETS[0].data.advanceReceived,
          fontSizeScale: parsed.fontSizeScale || 'normal',
        };
      }
    } catch (e) {
      console.error(e);
    }
    return SAMPLE_PRESETS[0].data;
  });

  // Saved records list
  const [savedRecords, setSavedRecords] = useState<DocumentData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return SAMPLE_PRESETS.map((p) => p.data);
  });

  // View & Modal states - Default to 'preview' so user directly sees the Letterhead!
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'editor'>('preview');
  const [previewScale, setPreviewScale] = useState<number>(0.85);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isSavedRecordsOpen, setIsSavedRecordsOpen] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  // Auto-save active doc to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(currentDoc));
    } catch (e) {
      console.error(e);
    }
  }, [currentDoc]);

  // Save records to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(savedRecords));
    } catch (e) {
      console.error(e);
    }
  }, [savedRecords]);

  // Adjust preview scale for smaller screen sizes on mount
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setPreviewScale(0.48);
      } else if (window.innerWidth < 1024) {
        setPreviewScale(0.68);
      } else {
        setPreviewScale(0.85);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeTemplate = LETTERHEAD_TEMPLATES.find((t) => t.id === currentDoc.templateId) || LETTERHEAD_TEMPLATES[0];
  const calculations = calculateDocument(currentDoc);

  // Convert Quotation to Bill with Confetti
  const handleConvertToBill = () => {
    const isCurrentlyQuote = currentDoc.type === 'quotation' || currentDoc.type === 'estimate';
    const newType: DocumentType = isCurrentlyQuote ? 'invoice' : 'quotation';
    const newNumber = isCurrentlyQuote 
      ? currentDoc.docNumber.replace(/^(QT|EST)/i, 'INV') || `INV-${Date.now().toString().slice(-4)}`
      : currentDoc.docNumber.replace(/^INV/i, 'QT') || `QT-${Date.now().toString().slice(-4)}`;

    setCurrentDoc({
      ...currentDoc,
      type: newType,
      docNumber: newNumber,
      updatedAt: new Date().toISOString(),
    });

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  // Change Template
  const handleSelectTemplate = (template: LetterheadTemplate) => {
    setCurrentDoc({
      ...currentDoc,
      templateId: template.id,
      primaryColor: template.defaultPrimaryColor,
      secondaryColor: template.defaultSecondaryColor,
      fontFamily: template.defaultFont,
      updatedAt: new Date().toISOString(),
    });
  };

  // Save Current Record
  const handleSaveToRecords = () => {
    const existingIndex = savedRecords.findIndex((r) => r.id === currentDoc.id);
    let updated: DocumentData[];
    if (existingIndex >= 0) {
      updated = [...savedRecords];
      updated[existingIndex] = { ...currentDoc, updatedAt: new Date().toISOString() };
    } else {
      updated = [
        { ...currentDoc, id: `doc-${Date.now()}`, updatedAt: new Date().toISOString() },
        ...savedRecords,
      ];
    }
    setSavedRecords(updated);
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 2500);
  };

  // Create New Blank Document
  const handleCreateNewBlank = () => {
    const isQuote = currentDoc.type === 'quotation';
    const newDoc: DocumentData = {
      id: `doc-${Date.now()}`,
      type: isQuote ? 'quotation' : 'invoice',
      docNumber: isQuote ? `QT-${Date.now().toString().slice(-4)}` : `INV-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      validityDays: 15,
      status: 'draft',
      company: {
        ...currentDoc.company,
      },
      client: {
        name: 'New Client / ग्राहक का नाम',
        companyName: '',
        addressLine1: 'Client Address Line 1',
        city: 'City',
        state: 'State',
        pincode: '000000',
        phone: '+91 90000 00000',
        email: 'client@example.com',
      },
      items: [
        {
          id: `item-${Date.now()}`,
          description: 'Product or Service Description (सामान का नाम)',
          hsn: '9983',
          quantity: 1,
          unit: 'Pcs',
          rate: 1000,
          discountPercent: 0,
          taxRate: 18,
          amount: 1000,
        },
      ],
      taxType: 'gst',
      isInterstate: false,
      discountTotalType: 'fixed',
      discountTotalValue: 0,
      shippingCharges: 0,
      packagingCharges: 0,
      advanceReceived: 0,
      roundOff: true,
      bankDetails: {
        ...currentDoc.bankDetails,
      },
      showUpiQr: true,
      notes: 'Thank you for your business!',
      termsConditions: '1. Quotation validity is 15 days.\n2. Goods once sold will not be returned.',
      signatureTitle: 'Authorized Signatory',
      templateId: currentDoc.templateId,
      primaryColor: currentDoc.primaryColor,
      fontFamily: currentDoc.fontFamily,
      fontSizeScale: 'normal',
      currency: '₹',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentDoc(newDoc);
  };

  // Load Preset
  const handleLoadPreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setCurrentDoc({
        ...preset.data,
        id: `doc-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Print Document
  const handlePrint = () => {
    window.print();
  };

  // Instant Download Offline Printable File
  const handleDownloadOfflineFile = () => {
    downloadPrintableHtml(currentDoc);
  };

  // Universal Native Share or WhatsApp
  const handleUniversalShare = async () => {
    const isQuote = currentDoc.type === 'quotation' || currentDoc.type === 'estimate';
    const shareTitle = `${isQuote ? 'Quotation' : 'Invoice'} #${currentDoc.docNumber} - ${currentDoc.company.name}`;
    const shareText = `${isQuote ? 'Quotation' : 'Tax Invoice'} #${currentDoc.docNumber}\nTotal Amount: ${currentDoc.currency} ${calculations.grandTotal}\nFrom: ${currentDoc.company.name}\nTo: ${currentDoc.client.name}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
        });
        return;
      } catch (err) {
        // user dismissed or not supported, fallback to WhatsApp modal
      }
    }
    setIsWhatsAppModalOpen(true);
  };

  // Export records JSON
  const handleExportAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `billcraft_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import records JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            setSavedRecords(parsed);
            if (parsed.length > 0) setCurrentDoc(parsed[0]);
            alert(`Successfully restored ${parsed.length} documents!`);
          }
        } catch (err) {
          alert('Invalid backup JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col antialiased text-slate-900 dark:text-slate-100">
      
      {/* ================= TOP NAVIGATION BAR (3-ZONE CONTRACT) ================= */}
      <header className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3 flex items-center justify-between gap-6 shrink-0 z-30 sticky top-0 shadow-xs">
        
        {/* Zone 1: Single text element wordmark + Section Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            B
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            BillCraft
          </span>

          {/* Section Switcher Tabs (Quotation/Bill vs Visiting Card) */}
          <div className="hidden sm:flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 ml-2 text-xs">
            <button
              onClick={() => setActiveAppSection('documents')}
              className={`px-3 py-1 rounded-md font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                activeAppSection === 'documents'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Quotation & Bill (बिल)</span>
            </button>
            <button
              onClick={() => setActiveAppSection('visiting_card')}
              className={`px-3 py-1 rounded-md font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                activeAppSection === 'visiting_card'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Visiting Card (विजिटिंग कार्ड)</span>
            </button>
          </div>
        </div>

        {/* Zone 2: Nav controls */}
        <nav className="hidden lg:flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
          
          {activeAppSection === 'documents' && (
            <>
              {/* 30 Letterhead Designs Button */}
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg transition-colors whitespace-nowrap font-semibold border border-indigo-200 dark:border-indigo-800"
              >
                <Palette className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>30 Letterhead Designs</span>
                <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-mono">
                  #{activeTemplate.number}
                </span>
              </button>

              {/* Quick Examples Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  <span>Examples (उदाहरण)</span>
                </button>
                <div className="hidden group-hover:block absolute left-0 top-full pt-1 w-64 z-50">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-xs">
                    {SAMPLE_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleLoadPreset(p.id)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex flex-col"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{p.title}</span>
                        <span className="text-[10px] text-slate-500">{p.hindiTitle}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Saved Records Drawer Button */}
              <button
                onClick={() => setIsSavedRecordsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
              >
                <FolderDown className="w-3.5 h-3.5 text-slate-500" />
                <span>Records ({savedRecords.length})</span>
              </button>
            </>
          )}

          {/* In-App PWA Install Button */}
          <PWAInstallButton variant="header" />
        </nav>

        {/* Zone 3: Actions (Print, Download, Share) */}
        <div className="flex items-center gap-2 shrink-0">
          {activeAppSection === 'documents' && (
            <>
              {/* Instant Download File */}
              <button
                onClick={handleDownloadOfflineFile}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap text-slate-700 dark:text-slate-300"
                title="Download self-contained offline printable file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>

              {/* Share */}
              <button
                onClick={handleUniversalShare}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors whitespace-nowrap font-medium text-xs border border-emerald-300 dark:border-emerald-800"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </>
          )}

          {/* Primary Print / Save PDF Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF (प्रिंट)</span>
          </button>
        </div>
      </header>

      {/* ================= SECONDARY WORKSPACE TOOLBAR (When in Documents Section) ================= */}
      {activeAppSection === 'documents' && (
        <div className="no-print bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Left: 1-Click Quotation ↔ Bill Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  if (currentDoc.type !== 'quotation') {
                    setCurrentDoc({ ...currentDoc, type: 'quotation', updatedAt: new Date().toISOString() });
                  }
                }}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  currentDoc.type === 'quotation' || currentDoc.type === 'estimate'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                📋 Quotation (कोटेशन)
              </button>
              <button
                onClick={() => {
                  if (currentDoc.type !== 'invoice') {
                    setCurrentDoc({ ...currentDoc, type: 'invoice', updatedAt: new Date().toISOString() });
                  }
                }}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  currentDoc.type === 'invoice' || currentDoc.type === 'cash_memo'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                🧾 Tax Invoice / Bill (बिल)
              </button>
            </div>

            {/* Quick Convert Button */}
            <button
              onClick={handleConvertToBill}
              title="Automatically switch between Quotation and Bill"
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg font-medium text-xs transition-colors"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>
                {currentDoc.type === 'quotation' ? 'Convert to Bill' : 'Convert to Quote'}
              </span>
            </button>
          </div>

          {/* Center: Active Template indicator */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-slate-500">Letterhead:</span>
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentDoc.primaryColor }} />
              <span>{activeTemplate.name}</span>
              <span className="text-slate-400 text-[11px]">(30 Designs)</span>
            </button>
          </div>

          {/* Right: View mode and zoom controls */}
          <div className="flex items-center gap-3">
            {viewMode !== 'editor' && (
              <div className="hidden sm:flex items-center gap-1 text-slate-500">
                <button
                  onClick={() => setPreviewScale((s) => Math.max(0.4, Number((s - 0.05).toFixed(2))))}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] w-9 text-center">{Math.round(previewScale * 100)}%</span>
                <button
                  onClick={() => setPreviewScale((s) => Math.min(1.2, Number((s + 0.05).toFixed(2))))}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* View Mode Toggle with Hindi + English labels */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'preview'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Direct Letterhead Live View & Edit"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>👁️ लेटरपैड (Direct Letterhead)</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`hidden md:flex px-2.5 py-1 rounded text-xs font-semibold transition-all items-center gap-1 ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Split View (Form + Preview)"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>स्प्लिट (Split)</span>
              </button>
              <button
                onClick={() => setViewMode('editor')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                  viewMode === 'editor'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Form Editor"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>फॉर्म (Form)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT WORKSPACE ================= */}
      <main className="flex-1 p-3 md:p-6 overflow-hidden flex flex-col">
        {activeAppSection === 'visiting_card' ? (
          /* VISITING CARD MAKER SECTION */
          <VisitingCardMaker initialCompany={currentDoc.company} />
        ) : (
          /* QUOTATION & BILL SECTION */
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 h-full max-w-[1700px] mx-auto w-full">
            
            {/* LEFT COLUMN: EDIT FORM */}
            {(viewMode === 'split' || viewMode === 'editor') && (
              <div className={`h-[calc(100vh-140px)] ${viewMode === 'editor' ? 'lg:col-span-12 max-w-4xl mx-auto w-full' : 'lg:col-span-5'}`}>
                <DocumentEditorForm
                  document={currentDoc}
                  onChange={setCurrentDoc}
                  onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
                  onOpenTemplateSelector={() => setIsTemplateModalOpen(true)}
                />
              </div>
            )}

            {/* RIGHT COLUMN: LIVE A4 PRINTABLE DOCUMENT PREVIEW */}
            {(viewMode === 'split' || viewMode === 'preview') && (
              <div 
                className={`h-[calc(100vh-140px)] overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start p-2 sm:p-4 bg-slate-200/70 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner relative ${
                  viewMode === 'preview' ? 'lg:col-span-12 w-full' : 'lg:col-span-7'
                }`}
              >
                {/* ================= 10 DEMO LETTERHEADS QUICK SELECTOR BAR ================= */}
                <div className="no-print w-full max-w-[210mm] mb-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white font-extrabold text-[11px] shadow-xs">
                        10
                      </span>
                      <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                        डेमो लेटरहेड डिज़ाइन्स (10 Ready Demo Letterheads):
                      </span>
                    </div>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hidden sm:inline">
                      ✨ नाम, रेट, आइटम व सारा विवरण पहले से भरा है — क्लिक करके तुरंत देखें व एडिट करें!
                    </span>
                  </div>

                  {/* 10 Direct Demo Letterhead Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 overflow-x-auto pb-0.5">
                    {SAMPLE_PRESETS.map((preset, idx) => {
                      const isSelected = currentDoc.id === preset.data.id || currentDoc.company.name === preset.data.company.name;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => handleLoadPreset(preset.id)}
                          className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/40 shadow-xs'
                              : 'bg-slate-50/80 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600 hover:border-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm">{preset.icon}</span>
                            <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 truncate">
                              {idx + 1}. {preset.data.company.name.split(' ')[0]} {preset.data.company.name.split(' ')[1] || ''}
                            </span>
                          </div>
                          <div className="text-[9.5px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {preset.data.workTypeTitle ? preset.data.workTypeTitle.slice(0, 24) : preset.title.slice(0, 24)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ================= LETTERHEAD LINING STYLES SELECTOR BAR ================= */}
                <div className="no-print w-full max-w-[210mm] mb-2.5 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0 text-[11px]">
                      <span>📐</span> लाइनिंग स्टाइल (Lining):
                    </span>
                    {[
                      { id: 'contractor_ledger', label: 'सैंपल जैसा खाता (Raj Sahani)', icon: '📐' },
                      { id: 'double_border', label: 'डबल बॉर्डर (Double Frame)', icon: '🏛️' },
                      { id: 'architect_grid', label: 'इंजीनियर ग्रिड (Architect)', icon: '🏗️' },
                      { id: 'ruled_ledger', label: 'बही-खाता लाल (Vyapar)', icon: '📜' },
                      { id: 'executive_box', label: 'एग्जीक्यूटिव बॉक्स (Corporate)', icon: '🏢' },
                      { id: 'modern_clean', label: 'मिनिमल क्लीन (Clean)', icon: '✨' },
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setCurrentDoc({ ...currentDoc, liningStyle: style.id as any, updatedAt: new Date().toISOString() })}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1 ${
                          (currentDoc.liningStyle || 'contractor_ledger') === style.id
                            ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs font-bold'
                            : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{style.icon}</span>
                        <span>{style.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* 30 Letterhead Designs Modal Trigger */}
                  <button
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
                  >
                    <span>+ 30 Designs देखें</span>
                  </button>
                </div>

                {/* ================= FLOATING TOOLBAR: TEXT SIZE, QUICK COLORS, INLINE EDIT HINT ================= */}
                <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2 w-full max-w-[210mm] text-xs bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  
                  {/* Left: Text Size Scale ("Bada / Chhota") */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <span className="text-indigo-600">Aa</span> Text साइज़:
                    </span>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                      <button
                        onClick={() => setCurrentDoc({ ...currentDoc, fontSizeScale: 'compact', updatedAt: new Date().toISOString() })}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${currentDoc.fontSizeScale === 'compact' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                        title="Small text"
                      >
                        A- (छोटा)
                      </button>
                      <button
                        onClick={() => setCurrentDoc({ ...currentDoc, fontSizeScale: 'normal', updatedAt: new Date().toISOString() })}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${currentDoc.fontSizeScale === 'normal' || !currentDoc.fontSizeScale ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                        title="Normal text"
                      >
                        A (सामान्य)
                      </button>
                      <button
                        onClick={() => setCurrentDoc({ ...currentDoc, fontSizeScale: 'large', updatedAt: new Date().toISOString() })}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${currentDoc.fontSizeScale === 'large' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                        title="Large text"
                      >
                        A+ (बड़ा)
                      </button>
                      <button
                        onClick={() => setCurrentDoc({ ...currentDoc, fontSizeScale: 'xlarge', updatedAt: new Date().toISOString() })}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${currentDoc.fontSizeScale === 'xlarge' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                        title="Extra Large text"
                      >
                        A++ (बहुत बड़ा)
                      </button>
                    </div>
                  </div>

                  {/* Center: Quick Color Palette */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium text-[11px]">रंग (Color):</span>
                    {[
                      { hex: '#0f2b48', name: 'Navy' },
                      { hex: '#991b1b', name: 'Maroon' },
                      { hex: '#064e3b', name: 'Emerald' },
                      { hex: '#b45309', name: 'Amber' },
                      { hex: '#18181b', name: 'Charcoal' },
                      { hex: '#4338ca', name: 'Indigo' },
                      { hex: '#be123c', name: 'Crimson' },
                      { hex: '#0f766e', name: 'Teal' },
                    ].map((col) => (
                      <button
                        key={col.hex}
                        onClick={() => setCurrentDoc({ ...currentDoc, primaryColor: col.hex, updatedAt: new Date().toISOString() })}
                        title={col.name}
                        className={`w-5 h-5 rounded-full border transition-transform ${
                          currentDoc.primaryColor.toLowerCase() === col.hex.toLowerCase()
                            ? 'scale-125 ring-2 ring-indigo-500 ring-offset-1 shadow-xs'
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: col.hex }}
                      />
                    ))}
                  </div>

                  {/* Right: Inline Edit Badge */}
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>सीधे लेटरपैड पर क्लिक करके बदलें</span>
                  </div>
                </div>

                {/* Informative Hint Banner for Easy Editing & Table Mode Switch */}
                <div className="no-print w-full max-w-[210mm] mb-3 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-950 dark:text-amber-100 text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-amber-800 dark:text-amber-300">✍️ आसान खाता:</span>
                    <span>बिना SqFt/इंच के सिर्फ रकम लिखें, या <strong>[+] काम</strong> और <strong>[-] एडवांस</strong> जोड़ें। हर चीज़ सीधे लेटरपैड पर एडिट करें।</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const next = (currentDoc.tableMode || 'direct_amount') === 'direct_amount' ? 'rate_qty' : 'direct_amount';
                        setCurrentDoc({ ...currentDoc, tableMode: next, updatedAt: new Date().toISOString() });
                      }}
                      className="px-3 py-1 bg-white dark:bg-slate-800 border border-amber-400 hover:bg-amber-100 dark:hover:bg-slate-700 text-amber-950 dark:text-amber-200 rounded-lg font-bold text-[11px] transition shadow-2xs flex items-center gap-1"
                    >
                      <span>{(currentDoc.tableMode || 'direct_amount') === 'direct_amount' ? '💰 सीधा रकम (Active)' : '📏 SqFt & रेट (Active)'}</span>
                      <span className="text-indigo-600 font-semibold underline text-[10px] ml-1">मोड बदलें ⇄</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="px-3 py-1 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-lg font-bold text-[11px] transition shadow-2xs flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" />
                      <span>प्रिंट निकालें</span>
                    </button>
                  </div>
                </div>

                {/* The Actual A4 Sheet */}
                <div className="print-container transition-transform">
                  <DocumentRenderer
                    document={currentDoc}
                    onUpdateDocument={setCurrentDoc}
                    scale={previewScale}
                    isEditable={true}
                  />
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* ================= MODALS & DRAWERS ================= */}
      {/* 30 Letterhead Designs Selector */}
      <TemplateSelectorModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        selectedTemplateId={currentDoc.templateId}
        onSelectTemplate={handleSelectTemplate}
        currentColor={currentDoc.primaryColor}
        onColorChange={(col) => setCurrentDoc({ ...currentDoc, primaryColor: col, updatedAt: new Date().toISOString() })}
      />

      {/* Digital Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        currentSignature={currentDoc.signatureImage}
        onSaveSignature={(dataUrl) => setCurrentDoc({ ...currentDoc, signatureImage: dataUrl, updatedAt: new Date().toISOString() })}
      />

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        document={currentDoc}
      />

      {/* Saved Records Drawer */}
      <SavedRecordsModal
        isOpen={isSavedRecordsOpen}
        onClose={() => setIsSavedRecordsOpen(false)}
        savedDocuments={savedRecords}
        onLoadDocument={(doc) => setCurrentDoc(doc)}
        onDeleteDocument={(id) => setSavedRecords(savedRecords.filter((d) => d.id !== id))}
        onExportAll={handleExportAll}
        onImportFile={handleImportFile}
        onNewDocument={handleCreateNewBlank}
      />

      {/* Bottom Floating Quick Actions on Mobile */}
      <div className="lg:hidden no-print fixed bottom-3 left-3 right-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-2 flex items-center justify-around z-40 text-xs">
        <button
          onClick={() => setActiveAppSection(activeAppSection === 'documents' ? 'visiting_card' : 'documents')}
          className="flex flex-col items-center gap-0.5 text-indigo-600 font-semibold"
        >
          {activeAppSection === 'documents' ? <CreditCard className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
          <span>{activeAppSection === 'documents' ? 'Visiting Card' : 'Bill / Quote'}</span>
        </button>

        {activeAppSection === 'documents' && (
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex flex-col items-center gap-0.5 text-slate-700 dark:text-slate-300 font-medium"
          >
            <Palette className="w-4 h-4 text-indigo-600" />
            <span>30 Designs</span>
          </button>
        )}

        {activeAppSection === 'documents' && (
          <button
            onClick={() => setViewMode(viewMode === 'editor' ? 'preview' : 'editor')}
            className="flex flex-col items-center gap-0.5 text-slate-700 dark:text-slate-300 font-medium"
          >
            {viewMode === 'editor' ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            <span>{viewMode === 'editor' ? 'Preview' : 'Edit Form'}</span>
          </button>
        )}

        <button
          onClick={handleUniversalShare}
          className="flex flex-col items-center gap-0.5 text-emerald-600 font-medium"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>

        <PWAInstallButton variant="mobile" />

        <button
          onClick={handlePrint}
          className="flex flex-col items-center gap-0.5 text-slate-900 dark:text-white font-bold"
        >
          <Printer className="w-4 h-4" />
          <span>Print / PDF</span>
        </button>
      </div>

    </div>
  );
}
