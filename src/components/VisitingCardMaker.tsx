import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { VisitingCardData, VisitingCardTheme } from '../types/visitingCard';
import { VISITING_CARD_THEMES } from '../data/visitingCardThemes';
import { CompanyProfile } from '../types/document';
import { VisitingCard3DViewer } from './VisitingCard3DViewer';
import { 
  Printer, 
  Share2, 
  RotateCw, 
  CreditCard, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  User, 
  Palette, 
  Upload, 
  Check, 
  Copy,
  Scissors,
  Rotate3d,
  Download,
  QrCode,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

interface VisitingCardMakerProps {
  initialCompany: CompanyProfile;
}

export const VisitingCardMaker: React.FC<VisitingCardMakerProps> = ({ initialCompany }) => {
  const [cardData, setCardData] = useState<VisitingCardData>(() => ({
    personName: initialCompany.name ? initialCompany.name : 'RAJ SAHANI',
    designation: 'PAINTING, POLISHING & INTERIOR WORKS',
    companyName: initialCompany.name || 'RAJ SAHANI',
    tagline: initialCompany.tagline || 'Contractor & Interior Specialist',
    phone: initialCompany.phone || '8181881311',
    alternatePhone: initialCompany.phone2 || '8181881318',
    email: initialCompany.email || 'rajsahaniuk53@gmail.com',
    website: initialCompany.website || '',
    address: initialCompany.addressLine1 || 'Hanuman Nagar, Kandivali (E)',
    cityStatePincode: `${initialCompany.city || 'Mumbai'}, ${initialCompany.state || 'Maharashtra'} - ${initialCompany.pincode || '400101'}`,
    gstin: initialCompany.gstin || '',
    upiId: initialCompany.phone ? `${initialCompany.phone}@paytm` : '8181881311@paytm',
    logoUrl: initialCompany.logoUrl || '',
    qrType: 'upi', // Default to live UPI payment QR code as requested!
    qrContent: '',
    themeId: 'theme-gold-obsidian', // Default to 24K Gold & Obsidian metallic luxury!
    primaryColor: '#0a0a0c',
    secondaryColor: '#d4af37',
    fontFamily: 'serif',
    activeSide: 'both',
    printLayout: 'paired_duplex', // Front & Back paired side-by-side with real crop marks
    metalType: 'gold',
  }));

  const [activeTab, setActiveTab] = useState<'3d' | 'edit' | 'print_duplex' | 'print_sheet'>('3d');
  const [themeFilter, setThemeFilter] = useState<string>('All');
  const [cardScale, setCardScale] = useState<'normal' | 'large' | 'compact'>('normal');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string>('');

  const frontCardRef = useRef<HTMLDivElement | null>(null);
  const backCardRef = useRef<HTMLDivElement | null>(null);

  const activeTheme = VISITING_CARD_THEMES.find((t) => t.id === cardData.themeId) || VISITING_CARD_THEMES[0];

  // Live QR Code Generation: UPI, vCard, or Website
  useEffect(() => {
    let payload = '';
    if (cardData.qrType === 'upi') {
      const upiTarget = cardData.upiId || (cardData.phone ? `${cardData.phone}@paytm` : '8181881311@paytm');
      payload = `upi://pay?pa=${encodeURIComponent(upiTarget)}&pn=${encodeURIComponent(cardData.companyName || cardData.personName)}&cu=INR&tn=Visiting%20Card%20Payment`;
    } else if (cardData.qrType === 'vcard') {
      payload = `BEGIN:VCARD\nVERSION:3.0\nN:${cardData.personName}\nFN:${cardData.personName}\nORG:${cardData.companyName}\nTITLE:${cardData.designation}\nTEL:${cardData.phone}\nTEL:${cardData.alternatePhone || ''}\nEMAIL:${cardData.email}\nADR:;;${cardData.address};${cardData.cityStatePincode};;;India\nEND:VCARD`;
    } else {
      payload = cardData.website || 'https://google.com';
    }

    QRCode.toDataURL(payload, {
      width: 240,
      margin: 1,
      color: {
        dark: '#0f172a', // High contrast dark slate / black modules
        light: '#ffffff', // Clean white background for 100% reliable scanner detection
      },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('QR code generation error:', err));
  }, [cardData.qrType, cardData.upiId, cardData.personName, cardData.companyName, cardData.phone, cardData.alternatePhone, cardData.email, cardData.website, cardData.address, cardData.cityStatePincode, cardData.designation, activeTheme]);

  // Handle UPI ID update and auto-switch to UPI QR mode
  const handleUpiIdChange = (val: string) => {
    setCardData((prev) => ({
      ...prev,
      upiId: val,
      qrType: 'upi', // Automatically activate UPI QR mode
    }));
  };

  // Sync from company profile
  const handleSyncCompany = () => {
    setCardData((prev) => ({
      ...prev,
      personName: initialCompany.name || prev.personName,
      companyName: initialCompany.name || prev.companyName,
      tagline: initialCompany.tagline || prev.tagline,
      phone: initialCompany.phone || prev.phone,
      alternatePhone: initialCompany.phone2 || prev.alternatePhone,
      email: initialCompany.email || prev.email,
      website: initialCompany.website || prev.website,
      address: initialCompany.addressLine1 || prev.address,
      cityStatePincode: `${initialCompany.city || ''}, ${initialCompany.state || ''} - ${initialCompany.pincode || ''}`,
      gstin: initialCompany.gstin || prev.gstin,
      logoUrl: initialCompany.logoUrl || prev.logoUrl,
    }));
    setExportNotice('Synced company info from Quotation / Bill!');
    setTimeout(() => setExportNotice(''), 3000);
  };

  // Reliable Printing across mobile and desktop
  const handlePrint = () => {
    window.print();
  };

  // Download high-resolution PNG image of the card
  const handleDownloadCardPng = async () => {
    setIsExporting(true);
    setExportNotice('');
    try {
      const targetElement = activeTab === 'edit' && backCardRef.current 
        ? backCardRef.current 
        : frontCardRef.current;

      if (!targetElement) {
        throw new Error('Element not ready');
      }

      const canvas = await html2canvas(targetElement, {
        scale: 3, // Ultra crisp print-ready 300 DPI
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Visiting_Card_${cardData.personName.replace(/\s+/g, '_')}.png`;
      link.click();
      setExportNotice('High-resolution visiting card downloaded!');
    } catch (err) {
      console.error('Card capture error:', err);
      setExportNotice('Download initiated');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportNotice(''), 3500);
    }
  };

  // Native Web Share or WhatsApp
  const handleShare = async () => {
    const text = `*Visiting Card - ${cardData.personName}*\n${cardData.designation}\n🏢 *${cardData.companyName}*\n📞 Phone: ${cardData.phone} ${cardData.alternatePhone ? `/ ${cardData.alternatePhone}` : ''}\n✉️ Email: ${cardData.email}\n📍 Address: ${cardData.address}, ${cardData.cityStatePincode}${cardData.upiId ? `\n⚡ UPI Payment ID: ${cardData.upiId}` : ''}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cardData.personName} - Visiting Card`,
          text: text,
        });
        return;
      } catch (e) {
        // user dismissed
      }
    }
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    const text = `${cardData.personName}\n${cardData.designation}\n${cardData.companyName}\nPhone: ${cardData.phone} ${cardData.alternatePhone ? `/ ${cardData.alternatePhone}` : ''}\nEmail: ${cardData.email}\nAddress: ${cardData.address}, ${cardData.cityStatePincode}${cardData.upiId ? `\nUPI ID: ${cardData.upiId}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLight = activeTheme.id === 'theme-3' || activeTheme.id === 'theme-gold-pearl';

  // Filter themes
  const filteredThemes = VISITING_CARD_THEMES.filter((t) => {
    if (themeFilter === 'All') return true;
    if (themeFilter === 'Gold') return t.metalType === 'gold';
    if (themeFilter === 'Silver') return t.metalType === 'silver' || t.metalType === 'titanium';
    if (themeFilter === 'Copper') return t.metalType === 'copper' || t.metalType === 'bronze';
    return t.category === themeFilter;
  });

  // =========================================================================
  // FRONT OF VISITING CARD (Inline Editable & Print Ready)
  // =========================================================================
  const renderCardFront = (is3D = false, isPrint = false) => (
    <div
      ref={!is3D && !isPrint ? frontCardRef : null}
      className={`relative overflow-hidden flex flex-col justify-between p-4 sm:p-5 select-none transition-all ${
        isPrint
          ? 'w-[88.9mm] h-[50.8mm] page-break-inside-avoid shadow-none border border-slate-300'
          : is3D
          ? 'w-full h-full'
          : 'w-full max-w-[440px] aspect-[1.75/1] rounded-2xl shadow-xl'
      } ${isLight ? 'text-slate-900 bg-white' : 'text-white'}`}
      style={{
        background: activeTheme.bgGradient,
        fontFamily: cardData.fontFamily === 'serif' ? 'Playfair Display, serif' : cardData.fontFamily === 'mono' ? 'Fira Code, monospace' : 'Manrope, sans-serif',
        border: activeTheme.cardBorder || 'none',
      }}
    >
      {/* Metallic Foil Shimmer Top Bar */}
      {activeTheme.metallicFoil && (
        <div
          className="absolute top-0 left-0 right-0 h-1.5 opacity-90"
          style={{ background: activeTheme.metallicFoil }}
        />
      )}

      {/* Background Decorative Accent Ring */}
      <div 
        className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full pointer-events-none opacity-15"
        style={{
          background: activeTheme.metallicFoil || activeTheme.accentColor,
        }}
      />

      {/* Card Header: Brand & Phone Numbers */}
      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-2">
          {cardData.logoUrl ? (
            <img src={cardData.logoUrl} alt="Logo" className="w-8 h-8 rounded-md object-contain bg-white/20 p-0.5" />
          ) : (
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs"
              style={{
                background: activeTheme.metallicFoil || activeTheme.accentColor,
                color: activeTheme.metalType === 'silver' ? '#0f172a' : '#000000',
              }}
            >
              <Building2 className="w-4 h-4" />
            </div>
          )}
          <div>
            <input
              type="text"
              value={cardData.companyName}
              onChange={(e) => setCardData({ ...cardData, companyName: e.target.value })}
              placeholder="COMPANY NAME"
              className="font-extrabold text-xs sm:text-sm tracking-wider uppercase bg-transparent border-b border-transparent hover:border-white/40 focus:border-white focus:outline-none w-48"
              style={{ color: activeTheme.accentColor }}
            />
            <input
              type="text"
              value={cardData.tagline}
              onChange={(e) => setCardData({ ...cardData, tagline: e.target.value })}
              placeholder="Tagline / Specialization"
              className="text-[9.5px] opacity-80 block bg-transparent border-b border-transparent hover:border-white/30 focus:border-white focus:outline-none w-48 truncate"
            />
          </div>
        </div>

        {/* Top Right Phone Numbers */}
        <div className="text-right text-[10px] space-y-0.5 font-mono">
          <div className="flex items-center justify-end gap-1">
            <Phone className="w-2.5 h-2.5 shrink-0 opacity-70" />
            <input
              type="text"
              value={cardData.phone}
              onChange={(e) => setCardData({ ...cardData, phone: e.target.value })}
              className="font-bold bg-transparent border-b border-transparent hover:border-white/40 focus:border-white focus:outline-none text-right w-24"
            />
          </div>
          {cardData.alternatePhone && (
            <div className="flex items-center justify-end gap-1 opacity-80">
              <input
                type="text"
                value={cardData.alternatePhone}
                onChange={(e) => setCardData({ ...cardData, alternatePhone: e.target.value })}
                className="bg-transparent border-b border-transparent hover:border-white/40 focus:border-white focus:outline-none text-right w-24"
              />
            </div>
          )}
        </div>
      </div>

      {/* Card Center: Person Name & Designation */}
      <div className="my-auto py-1 relative z-10">
        <input
          type="text"
          value={cardData.personName}
          onChange={(e) => setCardData({ ...cardData, personName: e.target.value })}
          placeholder="PERSON NAME"
          className="font-extrabold text-base sm:text-xl tracking-wide uppercase bg-transparent border-b border-transparent hover:border-white/40 focus:border-white focus:outline-none w-full"
          style={{
            textShadow: activeTheme.metalType === 'gold' ? '0 1px 2px rgba(0,0,0,0.8)' : 'none',
          }}
        />
        <div className="flex items-center gap-2 mt-0.5">
          <div 
            className="h-0.5 w-8 rounded-full" 
            style={{ background: activeTheme.metallicFoil || activeTheme.accentColor }} 
          />
          <input
            type="text"
            value={cardData.designation}
            onChange={(e) => setCardData({ ...cardData, designation: e.target.value })}
            placeholder="PAINTING, POLISHING & INTERIOR WORKS"
            className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase bg-transparent border-b border-transparent hover:border-white/40 focus:border-white focus:outline-none w-full"
            style={{ color: activeTheme.accentColor }}
          />
        </div>
      </div>

      {/* Card Footer: Address, Email & UPI Badge */}
      <div className="flex justify-between items-end text-[9px] sm:text-[10px] relative z-10 pt-1 border-t border-white/10">
        <div className="space-y-0.5 max-w-[260px]">
          <div className="flex items-start gap-1">
            <MapPin className="w-2.5 h-2.5 shrink-0 opacity-70 mt-0.5" />
            <input
              type="text"
              value={`${cardData.address}, ${cardData.cityStatePincode}`}
              onChange={(e) => setCardData({ ...cardData, address: e.target.value })}
              className="bg-transparent border-b border-transparent hover:border-white/30 focus:border-white focus:outline-none w-full truncate"
            />
          </div>
          <div className="flex items-center gap-1 opacity-85">
            <Mail className="w-2.5 h-2.5 shrink-0 opacity-70" />
            <input
              type="text"
              value={cardData.email}
              onChange={(e) => setCardData({ ...cardData, email: e.target.value })}
              className="bg-transparent border-b border-transparent hover:border-white/30 focus:border-white focus:outline-none w-full truncate"
            />
          </div>
        </div>

        {/* UPI ID Badge on Front */}
        {cardData.upiId && (
          <div 
            className="px-2 py-0.5 rounded text-[8.5px] font-mono font-bold flex items-center gap-1 shadow-2xs"
            style={{
              background: activeTheme.metallicFoil || 'rgba(255,255,255,0.15)',
              color: activeTheme.metalType === 'silver' ? '#0f172a' : '#000000',
            }}
          >
            <span>⚡ UPI: {cardData.upiId.split('@')[0]}</span>
          </div>
        )}
      </div>
    </div>
  );

  // =========================================================================
  // BACK OF VISITING CARD (With Live UPI QR Code & Banking Info)
  // =========================================================================
  const renderCardBack = (is3D = false, isPrint = false) => (
    <div
      ref={!is3D && !isPrint ? backCardRef : null}
      className={`relative overflow-hidden flex flex-col justify-between p-4 sm:p-5 select-none transition-all ${
        isPrint
          ? 'w-[88.9mm] h-[50.8mm] page-break-inside-avoid shadow-none border border-slate-300'
          : is3D
          ? 'w-full h-full'
          : 'w-full max-w-[440px] aspect-[1.75/1] rounded-2xl shadow-xl'
      } ${isLight ? 'text-slate-900 bg-white' : 'text-white'}`}
      style={{
        background: activeTheme.bgGradient,
        fontFamily: cardData.fontFamily === 'serif' ? 'Playfair Display, serif' : cardData.fontFamily === 'mono' ? 'Fira Code, monospace' : 'Manrope, sans-serif',
        border: activeTheme.cardBorder || 'none',
      }}
    >
      {/* Decorative accent geometry */}
      <div 
        className="absolute -left-12 -top-12 w-48 h-48 rounded-full pointer-events-none opacity-10"
        style={{
          background: activeTheme.metallicFoil || activeTheme.accentColor,
        }}
      />

      {/* Top Header of Back */}
      <div className="flex justify-between items-center relative z-10 border-b border-white/10 pb-1.5">
        <div>
          <span className="font-extrabold text-xs sm:text-sm tracking-wider uppercase block" style={{ color: activeTheme.accentColor }}>
            {cardData.companyName}
          </span>
          <span className="text-[9px] opacity-75">{cardData.tagline}</span>
        </div>
        <div className="text-[9px] font-mono text-right opacity-80">
          Ph: {cardData.phone}
        </div>
      </div>

      {/* Center Layout: Live UPI QR Code + Payment Instructions */}
      <div className="flex items-center justify-between gap-3 my-auto relative z-10 py-1">
        
        {/* Left Side: Services & Payment Info */}
        <div className="flex-1 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: activeTheme.accentColor }}>
            {cardData.qrType === 'upi' ? '⚡ Instant UPI Payment QR' : '📲 Scan for Contact & Details'}
          </div>
          
          {/* Directly editable UPI ID field on card back */}
          <div className="p-1.5 bg-white/10 rounded-lg border border-white/10 text-[9.5px]">
            <div className="text-[8px] opacity-80 flex items-center justify-between">
              <span>Pay via GPay, PhonePe, Paytm, BHIM:</span>
              <span className="text-[7.5px] bg-emerald-500 text-white px-1 py-0.2 rounded font-bold">LIVE UPI</span>
            </div>
            <input
              type="text"
              value={cardData.upiId || ''}
              onChange={(e) => handleUpiIdChange(e.target.value)}
              placeholder="e.g. yourname@paytm"
              className="font-mono font-bold tracking-wide mt-0.5 w-full bg-transparent border-b border-transparent hover:border-white/40 focus:border-white focus:outline-none text-[10px]"
              style={{ color: activeTheme.accentColor }}
            />
          </div>

          <div className="text-[8.5px] opacity-70 leading-tight">
            Work guaranteed with premium finish. Scan QR to pay or save contact directly.
          </div>
        </div>

        {/* Right Side: High Quality Live QR Code */}
        {qrDataUrl && (
          <div className="shrink-0 text-center bg-white p-1.5 rounded-xl shadow-md border border-slate-300">
            <img src={qrDataUrl} alt="UPI QR Code" className="w-18 h-18 sm:w-20 sm:h-20 object-contain mx-auto" />
            <div className="text-[7.5px] font-bold text-slate-900 uppercase tracking-tighter mt-0.5">
              {cardData.qrType === 'upi' ? '⚡ Scan & Pay' : 'vCard'}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer of Back */}
      <div className="flex justify-between items-center text-[8.5px] opacity-75 relative z-10 pt-1 border-t border-white/10">
        <span className="truncate">📍 {cardData.cityStatePincode}</span>
        {cardData.gstin ? (
          <span className="font-mono font-bold">GSTIN: {cardData.gstin}</span>
        ) : (
          <span>Verified Business Card</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
      
      {/* ================= TOP ACTION BAR ================= */}
      <div className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0 text-xs">
        
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg">
            <CreditCard className="w-4 h-4" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
              <span>Premium Metallic Visiting Card Maker</span>
              <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-bold uppercase">
                Gold & Silver
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              360° interactive 3D view · 12 luxury metallic designs · Live UPI QR code · A4 duplex cut sheet printing
            </p>
          </div>
        </div>

        {/* View Switchers & Export Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          
          {/* Main Mode Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('3d')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                activeTab === '3d'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Rotate3d className="w-3.5 h-3.5" />
              <span>360° 3D View</span>
            </button>

            <button
              onClick={() => setActiveTab('edit')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                activeTab === 'edit'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Direct Edit</span>
            </button>

            <button
              onClick={() => setActiveTab('print_duplex')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                activeTab === 'print_duplex'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="Prints Front & Back side-by-side with real crop marks for easy folding or cutting"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Paired Cut Sheet</span>
            </button>

            <button
              onClick={() => setActiveTab('print_sheet')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                activeTab === 'print_sheet'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>10-Card Sheet</span>
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleSyncCompany}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 rounded-lg font-medium flex items-center gap-1 transition"
            title="Sync company details from quotation"
          >
            <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Sync Bill</span>
          </button>

          {/* Download PNG Button */}
          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadCardPng}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-lg font-semibold flex items-center gap-1 text-slate-800 dark:text-slate-200 shadow-2xs transition"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-indigo-600" />}
            <span>PNG</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-xs transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {exportNotice && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 px-4 py-1.5 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-center gap-1.5 font-medium animate-in fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* ================= MAIN WORKSPACE GRID ================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-3 sm:p-5 overflow-hidden max-w-[1700px] mx-auto w-full">
        
        {/* LEFT COLUMN: Metallic Themes & Direct Details Customizer */}
        <div className="no-print lg:col-span-5 h-[calc(100vh-140px)] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 text-xs shadow-xs">
          
          {/* Category Filter Chips for Metallic Themes */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Choose Metallic Card Style</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">12 Premium Designs</span>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              {['All', 'Gold', 'Silver', 'Copper', 'Corporate', 'Minimal'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setThemeFilter(cat)}
                  className={`px-2.5 py-1 rounded-full font-semibold transition whitespace-nowrap ${
                    themeFilter === cat
                      ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-black shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {cat === 'Gold' ? '✨ 24K Gold' : cat === 'Silver' ? '🥈 Silver' : cat === 'Copper' ? '🥉 Copper' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Metallic Cards Theme Selector Grid */}
          <div className="grid grid-cols-2 gap-2">
            {filteredThemes.map((t) => {
              const isSelected = cardData.themeId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setCardData((prev) => ({ 
                    ...prev, 
                    themeId: t.id, 
                    fontFamily: t.defaultFont, 
                    metalType: t.metalType || 'none',
                    primaryColor: t.defaultPrimary,
                    secondaryColor: t.defaultSecondary
                  }))}
                  className={`p-2.5 rounded-xl text-left border-2 transition-all flex flex-col justify-between h-20 relative overflow-hidden group ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-400/40 shadow-md font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                  style={{ background: t.bgGradient, color: t.textColor }}
                >
                  {t.metallicFoil && (
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ background: t.metallicFoil }} />
                  )}
                  <div className="flex justify-between items-start w-full">
                    <span className="text-[10.5px] font-extrabold leading-tight line-clamp-2">
                      {t.name}
                    </span>
                    <div 
                      className="w-3.5 h-3.5 rounded-full border border-white/70 shrink-0 ml-1" 
                      style={{ backgroundColor: t.accentColor }} 
                    />
                  </div>
                  <div className="flex items-center justify-between w-full text-[9px] opacity-80 pt-1">
                    <span className="truncate">{t.category}</span>
                    {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0 font-bold" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Details Inputs & UPI Live QR Generator */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Card Information:</span>
              </h4>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* UPI ID Input (Key Request: "upi ID dalte hi QR code Ban jaaye") */}
            <div className="p-3 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 border border-amber-300 dark:border-amber-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>UPI Payment ID (Auto Live QR Code):</span>
                </label>
                <span className="text-[9.5px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold uppercase">
                  Instant Pay
                </span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={cardData.upiId || ''}
                  onChange={(e) => handleUpiIdChange(e.target.value)}
                  placeholder="e.g. 8181881311@paytm or rajsahani@okaxis"
                  className="flex-1 px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
                Typing your UPI ID generates a live scan-and-pay QR code on the back of the card for GPay, PhonePe & Paytm!
              </p>
            </div>

            {/* QR Code Type Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <span className="text-[10px] font-semibold text-slate-500 px-1">QR Type:</span>
              <button
                type="button"
                onClick={() => setCardData({ ...cardData, qrType: 'upi' })}
                className={`flex-1 py-1 text-[11px] rounded font-bold transition ${
                  cardData.qrType === 'upi'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                ⚡ UPI Payment
              </button>
              <button
                type="button"
                onClick={() => setCardData({ ...cardData, qrType: 'vcard' })}
                className={`flex-1 py-1 text-[11px] rounded font-bold transition ${
                  cardData.qrType === 'vcard'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                📇 vCard Contact
              </button>
            </div>

            {/* Name & Company */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Person Name</label>
                <input
                  type="text"
                  value={cardData.personName}
                  onChange={(e) => setCardData({ ...cardData, personName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Company / Firm</label>
                <input
                  type="text"
                  value={cardData.companyName}
                  onChange={(e) => setCardData({ ...cardData, companyName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-bold"
                />
              </div>
            </div>

            {/* Designation & Tagline */}
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Designation / Work Specialty</label>
              <input
                type="text"
                value={cardData.designation}
                onChange={(e) => setCardData({ ...cardData, designation: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>

            {/* Phones */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Mobile 1</label>
                <input
                  type="text"
                  value={cardData.phone}
                  onChange={(e) => setCardData({ ...cardData, phone: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Mobile 2 (Optional)</label>
                <input
                  type="text"
                  value={cardData.alternatePhone || ''}
                  onChange={(e) => setCardData({ ...cardData, alternatePhone: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Shop / Site Address</label>
              <input
                type="text"
                value={cardData.address}
                onChange={(e) => setCardData({ ...cardData, address: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>

            {/* City & Pincode */}
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-0.5">City, State & Pincode</label>
              <input
                type="text"
                value={cardData.cityStatePincode}
                onChange={(e) => setCardData({ ...cardData, cityStatePincode: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Views (360° 3D / Direct Edit / Paired Duplex Print Sheet) */}
        <div className="lg:col-span-7 h-[calc(100vh-140px)] overflow-y-auto bg-slate-200/70 dark:bg-slate-900/40 rounded-2xl p-3 sm:p-5 flex flex-col items-center justify-start border border-slate-200 dark:border-slate-800">
          
          {/* ================= VIEW 1: 360-DEGREE 3D INTERACTIVE CARD VIEWER ================= */}
          {activeTab === '3d' && (
            <VisitingCard3DViewer
              cardData={cardData}
              theme={activeTheme}
              renderFront={(is3D) => renderCardFront(is3D)}
              renderBack={(is3D) => renderCardBack(is3D)}
              onDownloadImage={handleDownloadCardPng}
              onShare={handleShare}
            />
          )}

          {/* ================= VIEW 2: DIRECT INLINE EDITING 2D VIEW ================= */}
          {activeTab === 'edit' && (
            <div className="w-full max-w-xl flex flex-col items-center gap-5 py-2">
              <div className="w-full text-center text-xs text-slate-500 bg-white dark:bg-slate-800 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700">
                ✍️ <strong>Click any text directly on the card below</strong> to edit name, designation, phone or address in place!
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5">
                  <span>Front Side</span>
                  <span className="text-[10px] text-amber-600 font-mono">({activeTheme.name})</span>
                </p>
                {renderCardFront(false)}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5">
                  <span>Back Side (Live Payment QR Code)</span>
                </p>
                {renderCardBack(false)}
              </div>
            </div>
          )}

          {/* ================= VIEW 3: PAIRED DUPLEX PRINT SHEET (FRONT + BACK WITH CROP MARKS) ================= */}
          {activeTab === 'print_duplex' && (
            <div className="w-full flex flex-col items-center">
              
              <div className="no-print w-full max-w-2xl bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-indigo-600" />
                    <span>A4 Paired Duplex Cut Sheet (Front & Back Side-by-Side)</span>
                  </span>
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print This Sheet</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Each row prints <strong>[ FRONT ]</strong> and <strong>[ BACK ]</strong> side-by-side with genuine corner cutting marks (<span className="font-mono">┌ ┐ └ ┘</span>) and a center fold guide. Print directly on 250-350 GSM card paper!
                </p>
              </div>

              {/* A4 Sheet Container for Paired Duplex Print */}
              <div
                className="print-area bg-white text-slate-900 p-4 sm:p-6 shadow-2xl border border-slate-300 rounded-sm"
                style={{
                  width: '100%',
                  maxWidth: '210mm',
                  minHeight: '297mm',
                  margin: '0 auto',
                  boxSizing: 'border-box',
                }}
              >
                {/* Print Sheet Header */}
                <div className="border-b border-slate-300 pb-2 mb-4 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>PRINT SHEET: PAIRED DUPLEX CARDS ({cardData.companyName})</span>
                  <span>CARD SIZE: 88.9mm x 50.8mm (STANDARD 3.5" x 2")</span>
                </div>

                {/* 4 Paired Rows on A4 (Total 4 Fronts + 4 Backs paired) */}
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((rowNum) => (
                    <div 
                      key={`duplex-row-${rowNum}`}
                      className="relative p-2 border border-dashed border-slate-300 rounded flex flex-wrap items-center justify-center gap-3 bg-slate-50/50"
                    >
                      {/* Cutting Guidelines Indicators */}
                      <span className="absolute top-0.5 left-1 font-mono text-[8px] text-slate-400 font-bold">
                        ┌ CUT PAIR #{rowNum}
                      </span>
                      <span className="absolute top-0.5 right-1 font-mono text-[8px] text-slate-400 font-bold">
                        ┐
                      </span>
                      <span className="absolute bottom-0.5 left-1 font-mono text-[8px] text-slate-400 font-bold">
                        └
                      </span>
                      <span className="absolute bottom-0.5 right-1 font-mono text-[8px] text-slate-400 font-bold">
                        ┘
                      </span>

                      {/* Front Card */}
                      <div className="relative">
                        <div className="absolute -top-3 left-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          FRONT
                        </div>
                        {renderCardFront(false, true)}
                      </div>

                      {/* Center Fold / Cut Axis Line */}
                      <div className="hidden sm:flex flex-col items-center justify-center h-28 px-1">
                        <div className="h-full border-r border-dashed border-slate-400" />
                        <span className="text-[7.5px] text-slate-400 font-mono rotate-90 my-1">FOLD / CUT</span>
                        <div className="h-full border-r border-dashed border-slate-400" />
                      </div>

                      {/* Back Card */}
                      <div className="relative">
                        <div className="absolute -top-3 left-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          BACK (PAYMENT QR)
                        </div>
                        {renderCardBack(false, true)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer notes */}
                <div className="mt-4 pt-2 border-t border-slate-300 text-center text-[9px] text-slate-400 font-mono">
                  • Follow crop guidelines to cut individual cards • Heavy cardstock recommended (280 - 350 GSM)
                </div>
              </div>

            </div>
          )}

          {/* ================= VIEW 4: 10-CARD MULTI-GRID PRINT SHEET ================= */}
          {activeTab === 'print_sheet' && (
            <div className="w-full flex flex-col items-center">
              
              <div className="no-print w-full max-w-xl bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    10-Card Single Side Sheet (A4)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Prints 10 cards per A4 page for standard single-sided cutting
                  </span>
                </div>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
              </div>

              {/* A4 Sheet Container */}
              <div
                className="print-area bg-white p-4 sm:p-6 shadow-2xl border border-slate-300 rounded-sm"
                style={{
                  width: '100%',
                  maxWidth: '210mm',
                  minHeight: '297mm',
                  margin: '0 auto',
                  boxSizing: 'border-box',
                }}
              >
                <div className="grid grid-cols-2 gap-3 justify-items-center">
                  {[...Array(10)].map((_, i) => (
                    <div key={`sheet-card-${i}`} className="p-0.5 border border-dashed border-slate-300 rounded">
                      {renderCardFront(false, true)}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
