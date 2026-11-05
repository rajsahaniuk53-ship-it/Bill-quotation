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
import { printDocumentReliably } from './utils/printer';
import { hslToHex, hexToHue } from './utils/colorUtils';
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
  Download,
  ChevronDown,
  Sliders
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
          qrAmountMode: parsed.qrAmountMode || 'open',
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
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [isPresetsDropdownOpen, setIsPresetsDropdownOpen] = useState<boolean>(false);
  const [previewScale, setPreviewScale] = useState<number>(0.85);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isSavedRecordsOpen, setIsSavedRecordsOpen] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);
  const [currentHue, setCurrentHue] = useState<number>(() => hexToHue(currentDoc.primaryColor || '#0f2b48'));

  // Sync hue when primaryColor updates from template or outside
  useEffect(() => {
    if (currentDoc.primaryColor) {
      setCurrentHue(hexToHue(currentDoc.primaryColor));
    }
  }, [currentDoc.primaryColor]);

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
        name: 'New Client',
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
          description: 'Product or Service Description',
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

  // Print Document reliably across mobile, iframe and desktop
  const handlePrint = async () => {
    try {
      await printDocumentReliably(currentDoc);
    } catch (e) {
      console.warn('Fallback to window.print', e);
      window.print();
    }
  };

  // Instant Download Offline Printable File
  const handleDownloadOfflineFile = async () => {
    await downloadPrintableHtml(currentDoc);
  };

  // Universal Full Bill & Image Sharing (with Live QR Code)
  const handleUniversalShare = () => {
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
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 ml-1 sm:ml-2 text-[11px] sm:text-xs">
            <button
              onClick={() => setActiveAppSection('documents')}
              className={`px-3 py-1 rounded-md font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                activeAppSection === 'documents'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Quotation & Bill</span>
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
              <span>Visiting Card</span>
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
                  <span>Templates</span>
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
                        <span className="text-[10px] text-slate-500">{p.subtitle}</span>
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
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
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
                📋 Quotation
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
                🧾 Tax Invoice / Bill
              </button>
            </div>

            {/* Quick Convert Button */}
            <button
              onClick={handleConvertToBill}
              title="Automatically switch between Quotation and Bill"
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg font-medium text-xs transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>
                {currentDoc.type === 'quotation' ? 'Convert to Bill' : 'Convert to Quote'}
              </span>
            </button>

            {/* Top Workspace Mode 1 vs Mode 2 Switcher */}
            <div className="hidden sm:flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 ml-1">
              <button
                type="button"
                onClick={() => setCurrentDoc({ ...currentDoc, tableMode: 'measurement_sqft', updatedAt: new Date().toISOString() })}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all flex items-center gap-1 ${
                  currentDoc.tableMode !== 'cash_ledger' && currentDoc.tableMode !== 'direct_amount'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Mode 1: Detailed Sq.Ft Area & Rate List (Painting, Polishing, Carpentry, POP)"
              >
                <span>📐 Mode 1: Sq.Ft & Rate</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentDoc({ ...currentDoc, tableMode: 'cash_ledger', updatedAt: new Date().toISOString() })}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all flex items-center gap-1 ${
                  currentDoc.tableMode === 'cash_ledger' || currentDoc.tableMode === 'direct_amount'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Mode 2: Direct Cash & Credit Ledger (Lump sum amounts, Advances, Debits & Credits)"
              >
                <span>💰 Mode 2: Cash & Advance</span>
              </button>
            </div>
          </div>

          {/* Center: Active Template indicator */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-slate-500">Letterhead:</span>
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
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

            {/* View Mode Toggle with English labels */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'preview'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Live Letterhead View & Inline Edit"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>👁️ Live Letterhead</span>
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
                <span>Split View</span>
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
                <span>Form Editor</span>
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
                {/* ================= IF IN CLEAN PREVIEW MODE: SHOW MINIMAL ACTION BAR ================= */}
                {isPreviewMode ? (
                  <div className="no-print w-full max-w-[210mm] mb-3 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">
                        👁️ Clean Print Preview Mode
                      </span>
                      <span className="text-[11px] text-slate-500 hidden sm:inline">
                        (Pristine printable sheet — all edit outlines & buttons hidden)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsPreviewMode(false)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Back to Edit Mode</span>
                      </button>
                      <button
                        onClick={handlePrint}
                        className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                      <button
                        onClick={handleUniversalShare}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* ================= BAR 1: SINGLE 10-PRESETS BUTTON + MODE 1 & 2 + CLEAN PREVIEW BUTTON ================= */}
                    <div className="no-print w-full max-w-[210mm] mb-2.5 bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs relative">
                      
                      {/* Left: 1 Single Dropdown Button for all 10 Presets */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsPresetsDropdownOpen(!isPresetsDropdownOpen)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer text-xs"
                          title="Click to view all 10 ready demo letterheads"
                        >
                          <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white/25 text-white font-black text-[10px]">
                            10
                          </span>
                          <span>📂 10 Ready Demo Presets</span>
                          <span className="text-[10px] opacity-80">▾</span>
                        </button>

                        {/* Floating Dropdown for 10 Presets */}
                        {isPresetsDropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-30" 
                              onClick={() => setIsPresetsDropdownOpen(false)} 
                            />
                            <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-40 max-h-[75vh] overflow-y-auto space-y-1 animate-in fade-in zoom-in-95">
                              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                                <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                  10 Ready Demo Letterheads
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">Click to load</span>
                              </div>
                              {SAMPLE_PRESETS.map((preset, idx) => {
                                const isSelected = currentDoc.id === preset.data.id || currentDoc.company.name === preset.data.company.name;
                                return (
                                  <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => {
                                      handleLoadPreset(preset.id);
                                      setIsPresetsDropdownOpen(false);
                                    }}
                                    className={`w-full p-2.5 rounded-xl text-left transition flex items-start gap-2.5 cursor-pointer ${
                                      isSelected
                                        ? 'bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-400 text-indigo-950 dark:text-indigo-200 font-medium'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200'
                                    }`}
                                  >
                                    <span className="text-xl shrink-0 p-1.5 bg-slate-100 dark:bg-slate-700/80 rounded-xl">{preset.icon}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-xs truncate">
                                          {idx + 1}. {preset.data.company.name}
                                        </span>
                                        <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded font-semibold text-slate-500 shrink-0">
                                          {preset.title.split(' ')[0]}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {preset.data.workTypeTitle || preset.subtitle}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Middle: 2 Table Calculation Modes (Sq.Ft vs Cash & Advance) */}
                      <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600">
                        <button
                          type="button"
                          onClick={() => setCurrentDoc({ ...currentDoc, tableMode: 'measurement_sqft', updatedAt: new Date().toISOString() })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            currentDoc.tableMode !== 'cash_ledger' && currentDoc.tableMode !== 'direct_amount'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                          }`}
                          title="Mode 1: Detailed Sq.Ft Area & Rate (Painting, Polishing, Carpentry, POP)"
                        >
                          <span>📐 Mode 1: Sq.Ft</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentDoc({ ...currentDoc, tableMode: 'cash_ledger', updatedAt: new Date().toISOString() })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            currentDoc.tableMode === 'cash_ledger' || currentDoc.tableMode === 'direct_amount'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                          }`}
                          title="Mode 2: Direct Cash & Advance Ledger (Lump sums, Advances, Debits & Credits)"
                        >
                          <span>💰 Mode 2: Cash</span>
                        </button>
                      </div>

                      {/* Right: Switch to Clean Preview Mode */}
                      <button
                        type="button"
                        onClick={() => setIsPreviewMode(true)}
                        className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                        title="View Clean Printable Sheet without edit borders or buttons"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>👁️ Clean Preview</span>
                      </button>
                    </div>

                    {/* ================= BAR 2: RAINBOW HUE COLOR SLIDER + TEXT SIZE + LINING STYLES ================= */}
                    <div className="no-print w-full max-w-[210mm] mb-2.5 bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
                      
                      {/* Live Hue Rainbow Color Slider */}
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px] shrink-0">
                          <Palette className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Slide Color:</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Rainbow track slider */}
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={currentHue}
                            onChange={(e) => {
                              const hue = parseInt(e.target.value, 10);
                              setCurrentHue(hue);
                              const newHex = hslToHex(hue, 85, 26);
                              setCurrentDoc((prev) => ({
                                ...prev,
                                primaryColor: newHex,
                                updatedAt: new Date().toISOString(),
                              }));
                            }}
                            className="w-28 sm:w-36 h-3 rounded-lg appearance-none cursor-pointer shadow-inner"
                            style={{
                              background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                            }}
                            title="Slide smoothly across all colors in real time!"
                          />

                          {/* Native Hex Color Picker */}
                          <input
                            type="color"
                            value={currentDoc.primaryColor}
                            onChange={(e) => {
                              const col = e.target.value;
                              setCurrentDoc((prev) => ({ ...prev, primaryColor: col, updatedAt: new Date().toISOString() }));
                              setCurrentHue(hexToHue(col));
                            }}
                            title="Click to pick any custom color"
                            className="w-5 h-5 rounded cursor-pointer border border-slate-300 dark:border-slate-600 shrink-0 p-0"
                          />
                        </div>

                        {/* Quick Palette Swatches */}
                        <div className="flex items-center gap-1">
                          {[
                            { hex: '#0f2b48', name: 'Navy' },
                            { hex: '#991b1b', name: 'Maroon' },
                            { hex: '#064e3b', name: 'Emerald' },
                            { hex: '#b45309', name: 'Amber' },
                            { hex: '#4338ca', name: 'Indigo' },
                            { hex: '#0f766e', name: 'Teal' },
                          ].map((col) => (
                            <button
                              key={col.hex}
                              onClick={() => setCurrentDoc({ ...currentDoc, primaryColor: col.hex, updatedAt: new Date().toISOString() })}
                              title={col.name}
                              className={`w-4 h-4 rounded-full border transition-transform ${
                                currentDoc.primaryColor.toLowerCase() === col.hex.toLowerCase()
                                  ? 'scale-125 ring-2 ring-indigo-500 shadow-xs'
                                  : 'hover:scale-110'
                              }`}
                              style={{ backgroundColor: col.hex }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Text Size Scale */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                          Aa Size:
                        </span>
                        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                          <button
                            onClick={() => setCurrentDoc({ ...currentDoc, fontSizeScale: 'compact', updatedAt: new Date().toISOString() })}
                            className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold transition ${currentDoc.fontSizeScale === 'compact' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                            title="Small"
                          >
                            A-
                          </button>
                          <button
                            onClick={() => setCurrentDoc({ ...currentDoc, fontSizeScale: 'normal', updatedAt: new Date().toISOString() })}
                            className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold transition ${currentDoc.fontSizeScale === 'normal' || !currentDoc.fontSizeScale ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                            title="Normal"
                          >
                            A
                          </button>
                          <button
                            onClick={() => setCurrentDoc({ ...currentDoc, fontSizeScale: 'large', updatedAt: new Date().toISOString() })}
                            className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold transition ${currentDoc.fontSizeScale === 'large' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                            title="Large"
                          >
                            A+
                          </button>
                          <button
                            onClick={() => setCurrentDoc({ ...currentDoc, fontSizeScale: 'xlarge', updatedAt: new Date().toISOString() })}
                            className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold transition ${currentDoc.fontSizeScale === 'xlarge' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                            title="Extra Large"
                          >
                            A++
                          </button>
                        </div>
                      </div>

                      {/* 30 Letterhead Designs trigger */}
                      <button
                        onClick={() => setIsTemplateModalOpen(true)}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>30 Designs</span>
                      </button>
                    </div>

                    {/* ================= BAR 3: LINING & FRAME STYLE SELECTOR ================= */}
                    <div className="no-print w-full max-w-[210mm] mb-3 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0 text-[10.5px]">
                        <span>📐</span> Frame:
                      </span>
                      {[
                        { id: 'contractor_ledger', label: 'Contractor Ledger', icon: '📐' },
                        { id: 'double_border', label: 'Double Border', icon: '🏛️' },
                        { id: 'architect_grid', label: 'Architect Grid', icon: '🏗️' },
                        { id: 'ruled_ledger', label: 'Ruled Classic', icon: '📜' },
                        { id: 'executive_box', label: 'Executive Box', icon: '🏢' },
                        { id: 'modern_clean', label: 'Minimal Clean', icon: '✨' },
                      ].map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setCurrentDoc({ ...currentDoc, liningStyle: style.id as any, updatedAt: new Date().toISOString() })}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
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
                  </>
                )}

                {/* The Actual A4 Sheet */}
                <div className="print-container transition-transform">
                  <DocumentRenderer
                    document={currentDoc}
                    onUpdateDocument={setCurrentDoc}
                    scale={previewScale}
                    isEditable={!isPreviewMode}
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
