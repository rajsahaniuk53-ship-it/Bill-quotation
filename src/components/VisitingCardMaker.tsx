import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { VisitingCardData, VisitingCardTheme } from '../types/visitingCard';
import { VISITING_CARD_THEMES } from '../data/visitingCardThemes';
import { CompanyProfile } from '../types/document';
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
  ZoomIn,
  ZoomOut,
  Type
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
    logoUrl: initialCompany.logoUrl || '',
    qrType: 'vcard',
    qrContent: '',
    themeId: 'theme-1',
    primaryColor: '#0f172a',
    secondaryColor: '#d97706',
    fontFamily: 'modern',
    activeSide: 'both',
    printLayout: 'sheet',
  }));

  const [cardScale, setCardScale] = useState<'normal' | 'large' | 'compact'>('normal');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const activeTheme = VISITING_CARD_THEMES.find((t) => t.id === cardData.themeId) || VISITING_CARD_THEMES[0];

  // Generate QR Code: vCard or UPI or Website
  useEffect(() => {
    let payload = '';
    if (cardData.qrType === 'vcard') {
      payload = `BEGIN:VCARD\nVERSION:3.0\nN:${cardData.personName}\nFN:${cardData.personName}\nORG:${cardData.companyName}\nTITLE:${cardData.designation}\nTEL:${cardData.phone}\nTEL:${cardData.alternatePhone || ''}\nEMAIL:${cardData.email}\nADR:;;${cardData.address};${cardData.cityStatePincode};;;India\nEND:VCARD`;
    } else if (cardData.qrType === 'upi') {
      payload = `upi://pay?pa=${encodeURIComponent(cardData.phone)}@paytm&pn=${encodeURIComponent(cardData.personName)}&cu=INR`;
    } else {
      payload = cardData.website || 'https://google.com';
    }

    QRCode.toDataURL(payload, {
      width: 220,
      margin: 1,
      color: {
        dark: activeTheme.id === 'theme-3' ? '#18181b' : '#ffffff',
        light: activeTheme.id === 'theme-3' ? '#ffffff' : '#00000000',
      },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('QR code error:', err));
  }, [cardData.qrType, cardData.personName, cardData.companyName, cardData.phone, cardData.alternatePhone, cardData.email, cardData.website, cardData.address, cardData.cityStatePincode, cardData.designation, activeTheme]);

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
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCardData((prev) => ({ ...prev, logoUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `*Visiting Card - ${cardData.personName}*\n${cardData.designation}\n📞 Phone: ${cardData.phone} / ${cardData.alternatePhone || ''}\n✉️ Email: ${cardData.email}\n📍 Address: ${cardData.address}, ${cardData.cityStatePincode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cardData.personName} - Visiting Card`,
          text: text,
        });
        return;
      } catch (e) {
        // user cancelled
      }
    }
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    const text = `${cardData.personName}\n${cardData.designation}\nPhone: ${cardData.phone} / ${cardData.alternatePhone || ''}\nEmail: ${cardData.email}\nAddress: ${cardData.address}, ${cardData.cityStatePincode}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLight = activeTheme.id === 'theme-3';

  // Card Font Scale helper
  const titleSizeClass = 
    cardScale === 'large' ? 'text-2xl' :
    cardScale === 'compact' ? 'text-base' : 'text-xl';

  // Render Front of Card with Direct Inline Editing
  const renderCardFront = (isPrint = false) => (
    <div
      className={`relative rounded-xl overflow-hidden shadow-2xl flex flex-col justify-between p-5 select-none transition-all ${
        isLight ? 'border border-slate-300 text-slate-900 bg-white' : 'text-white'
      } ${isPrint ? 'w-[88.9mm] h-[50.8mm] m-1 page-break-inside-avoid shadow-none border border-slate-400' : 'w-full max-w-[440px] aspect-[1.75/1]'}`}
      style={{
        background: activeTheme.bgGradient,
        fontFamily: cardData.fontFamily === 'serif' ? 'Playfair Display, serif' : 'Manrope, sans-serif',
      }}
    >
      {/* Decorative accent geometry */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full border-2 border-white absolute -top-40 -right-40" />
        <div className="w-[300px] h-[300px] rounded-full border border-white absolute -top-10 -right-10" />
      </div>

      {/* Card Header: Brand & Phone */}
      <div className="relative z-10 flex justify-between items-start gap-2">
        <div className="flex items-center gap-2">
          {cardData.logoUrl ? (
            <img src={cardData.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded bg-white/20 p-1" />
          ) : (
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-md shrink-0"
              style={{ backgroundColor: activeTheme.accentColor, color: isLight ? '#ffffff' : '#0f172a' }}
            >
              {cardData.companyName.charAt(0) || 'R'}
            </div>
          )}
          <div>
            <input
              type="text"
              value={cardData.companyName}
              onChange={(e) => setCardData({ ...cardData, companyName: e.target.value })}
              className="font-extrabold text-xs tracking-tight uppercase leading-tight bg-transparent focus:outline-none focus:bg-white/20 px-1 rounded w-44"
              placeholder="COMPANY NAME"
            />
            <input
              type="text"
              value={cardData.tagline}
              onChange={(e) => setCardData({ ...cardData, tagline: e.target.value })}
              className="text-[8.5px] opacity-75 font-medium tracking-wide bg-transparent focus:outline-none focus:bg-white/20 px-1 rounded block w-44"
              placeholder="TAGLINE"
            />
          </div>
        </div>

        {/* Top Right Phone */}
        <div className="text-right">
          <input
            type="text"
            value={cardData.phone}
            onChange={(e) => setCardData({ ...cardData, phone: e.target.value })}
            className="text-[10px] font-mono font-bold bg-transparent text-right focus:outline-none focus:bg-white/20 px-1 rounded w-28"
            placeholder="8181881311"
          />
          {cardData.alternatePhone && (
            <input
              type="text"
              value={cardData.alternatePhone}
              onChange={(e) => setCardData({ ...cardData, alternatePhone: e.target.value })}
              className="text-[9px] font-mono opacity-80 bg-transparent text-right focus:outline-none focus:bg-white/20 px-1 rounded w-28 block"
              placeholder="8181881318"
            />
          )}
        </div>
      </div>

      {/* Card Center: Person Name & Designation (Editable in place) */}
      <div className="relative z-10 my-auto py-1">
        <input
          type="text"
          value={cardData.personName}
          onChange={(e) => setCardData({ ...cardData, personName: e.target.value })}
          className={`w-full font-extrabold tracking-tight bg-transparent focus:outline-none focus:bg-white/20 px-1 rounded ${titleSizeClass}`}
          style={{ color: activeTheme.accentColor }}
          placeholder="RAJ SAHANI"
        />
        <input
          type="text"
          value={cardData.designation}
          onChange={(e) => setCardData({ ...cardData, designation: e.target.value })}
          className="w-full text-[10.5px] font-semibold opacity-90 tracking-wide bg-transparent focus:outline-none focus:bg-white/20 px-1 rounded mt-0.5"
          placeholder="PAINTING, POLISHING & INTERIOR WORKS"
        />
        <div className="w-12 h-0.5 mt-1 rounded-full" style={{ backgroundColor: activeTheme.accentColor }} />
      </div>

      {/* Card Footer: Address, Email & QR */}
      <div className="relative z-10 flex justify-between items-end gap-2 text-[8.5px] pt-1.5 border-t border-white/15">
        <div className="space-y-0.5 max-w-[72%]">
          <input
            type="text"
            value={cardData.email}
            onChange={(e) => setCardData({ ...cardData, email: e.target.value })}
            className="w-full bg-transparent focus:outline-none focus:bg-white/20 px-1 rounded opacity-90"
            placeholder="rajsahaniuk53@gmail.com"
          />
          <input
            type="text"
            value={cardData.address}
            onChange={(e) => setCardData({ ...cardData, address: e.target.value })}
            className="w-full bg-transparent focus:outline-none focus:bg-white/20 px-1 rounded opacity-90"
            placeholder="Hanuman Nagar, Kandivali (E), Mumbai 400101"
          />
        </div>

        {/* QR Code */}
        {qrDataUrl && (
          <div className="flex flex-col items-center shrink-0">
            <img src={qrDataUrl} alt="vCard QR" className="w-10 h-10 object-contain rounded p-0.5 bg-white shadow-xs" />
            <span className="text-[6px] uppercase font-bold tracking-wider opacity-80 mt-0.5">
              Scan vCard
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // Render Back of the Card
  const renderCardBack = (isPrint = false) => (
    <div
      className={`relative rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-6 select-none transition-all ${
        isLight ? 'border border-slate-300 text-slate-900 bg-white' : 'text-white'
      } ${isPrint ? 'w-[88.9mm] h-[50.8mm] m-1 page-break-inside-avoid shadow-none border border-slate-400' : 'w-full max-w-[440px] aspect-[1.75/1]'}`}
      style={{
        background: activeTheme.bgGradient,
        fontFamily: cardData.fontFamily === 'serif' ? 'Playfair Display, serif' : 'Manrope, sans-serif',
      }}
    >
      <div className="text-center relative z-10 space-y-2 max-w-xs">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl mx-auto shadow-lg"
          style={{ backgroundColor: activeTheme.accentColor, color: isLight ? '#ffffff' : '#0f172a' }}
        >
          {cardData.companyName.charAt(0) || 'R'}
        </div>
        <h3 className="font-extrabold text-base tracking-wider uppercase">
          {cardData.companyName}
        </h3>
        <p className="text-[10px] opacity-80 tracking-wide">
          {cardData.designation}
        </p>
        <p className="text-[9px] font-mono pt-1 text-white/90" style={{ color: activeTheme.accentColor }}>
          Ph: {cardData.phone} {cardData.alternatePhone ? `/ ${cardData.alternatePhone}` : ''}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      
      {/* Sub Header for Visiting Card */}
      <div className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 rounded-lg">
            <CreditCard className="w-4 h-4" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">
              Visiting Card Maker (विजिटिंग कार्ड मेकर)
            </h2>
            <p className="text-[11px] text-slate-500">
              Click & edit directly on the card · 8+ distinct designs · Single & 10-Card A4 sheet printing
            </p>
          </div>
        </div>

        {/* Text size & Print controls */}
        <div className="flex items-center gap-2">
          {/* Text size selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCardScale('compact')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded ${cardScale === 'compact' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xs' : 'text-slate-500'}`}
              title="Compact Text"
            >
              A-
            </button>
            <button
              onClick={() => setCardScale('normal')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded ${cardScale === 'normal' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xs' : 'text-slate-500'}`}
              title="Normal Text"
            >
              A
            </button>
            <button
              onClick={() => setCardScale('large')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded ${cardScale === 'large' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xs' : 'text-slate-500'}`}
              title="Large Text"
            >
              A+
            </button>
          </div>

          <button
            onClick={handleSyncCompany}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg font-medium flex items-center gap-1.5 transition"
            title="Load Company Details from Quotation / Bill"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Sync with Bill</span>
          </button>

          <button
            onClick={handleShare}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share (व्हाट्सएप)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Cards (प्रिंट कार्ड)</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 overflow-hidden max-w-[1700px] mx-auto w-full">
        
        {/* Left Side: Themes & Card Options */}
        <div className="lg:col-span-5 h-[calc(100vh-160px)] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 text-xs shadow-sm">
          
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Distinct Card Themes (अलग-अलग डिज़ाइन व रंग)
            </h3>
            <span className="text-[10px] text-slate-400">8 Premium Styles</span>
          </div>

          {/* Distinct Visual Cards Picker */}
          <div className="grid grid-cols-2 gap-2.5">
            {VISITING_CARD_THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setCardData((prev) => ({ ...prev, themeId: t.id, fontFamily: t.defaultFont }))}
                className={`p-3 rounded-xl text-left border-2 transition-all flex flex-col justify-between h-20 ${
                  cardData.themeId === t.id
                    ? 'border-indigo-600 ring-2 ring-indigo-500/30 font-bold shadow-md'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
                style={{ background: t.bgGradient, color: t.textColor }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold leading-tight drop-shadow-xs">{t.name}</span>
                  <div className="w-3.5 h-3.5 rounded-full border border-white/60" style={{ backgroundColor: t.accentColor }} />
                </div>
                <span className="text-[9px] opacity-80">{t.hindiName}</span>
              </button>
            ))}
          </div>

          {/* Quick Details Inputs */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
              Direct Info Editor (या सीधे कार्ड पर क्लिक करके बदलें):
            </h4>

            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">Name / Firm Name</label>
              <input
                type="text"
                value={cardData.personName}
                onChange={(e) => setCardData({ ...cardData, personName: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">Designation / Work Type</label>
              <input
                type="text"
                value={cardData.designation}
                onChange={(e) => setCardData({ ...cardData, designation: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1">Mobile 1</label>
                <input
                  type="text"
                  value={cardData.phone}
                  onChange={(e) => setCardData({ ...cardData, phone: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1">Mobile 2</label>
                <input
                  type="text"
                  value={cardData.alternatePhone || ''}
                  onChange={(e) => setCardData({ ...cardData, alternatePhone: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">Address / लोकेशन</label>
              <input
                type="text"
                value={cardData.address}
                onChange={(e) => setCardData({ ...cardData, address: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Live Interactive Card Canvas & Print Layout Switcher */}
        <div className="lg:col-span-7 h-[calc(100vh-160px)] overflow-y-auto bg-slate-200/70 dark:bg-slate-900/50 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-start border border-slate-200 dark:border-slate-800">
          
          {/* Controls Bar for Preview */}
          <div className="no-print w-full max-w-xl flex items-center justify-between mb-4 text-xs">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setCardData({ ...cardData, printLayout: 'single' })}
                className={`px-3 py-1 rounded font-semibold transition ${
                  cardData.printLayout === 'single'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Single Card View
              </button>
              <button
                onClick={() => setCardData({ ...cardData, printLayout: 'sheet' })}
                className={`px-3 py-1 rounded font-semibold transition ${
                  cardData.printLayout === 'sheet'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                10-Card Print Sheet (A4 शीट)
              </button>
            </div>

            <button
              onClick={handleCopyText}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:underline"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Info'}
            </button>
          </div>

          {/* SINGLE VIEW MODE: Front and Back side display with Direct In-Place Editing */}
          {cardData.printLayout === 'single' && (
            <div className="w-full max-w-xl flex flex-col items-center gap-6 py-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                  Front Side (सामने का भाग - सीधे क्लिक करके एडिट करें):
                </p>
                {renderCardFront()}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                  Back Side (पीछे का भाग):
                </p>
                {renderCardBack()}
              </div>
            </div>
          )}

          {/* PRINT SHEET MODE: Multi-Card Grid for Printing 10 Cards on A4 */}
          {cardData.printLayout === 'sheet' && (
            <div className="w-full flex flex-col items-center">
              <div className="no-print text-center text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-indigo-600" />
                <span>A4 Sheet with cutting guidelines: Print directly on 250-300 GSM card paper!</span>
              </div>

              {/* A4 Sheet Container */}
              <div 
                className="print-area bg-white p-6 shadow-xl border border-slate-300 rounded-sm"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  boxSizing: 'border-box',
                }}
              >
                <div className="text-center pb-2 border-b border-slate-200 text-[10px] text-slate-400 no-print flex justify-between">
                  <span>BillCraft Card Sheet · Cut along dashed lines</span>
                  <span>Size: Standard 3.5" × 2" (88.9mm × 50.8mm)</span>
                </div>

                {/* 10 Cards Grid (5 rows x 2 cols) */}
                <div className="grid grid-cols-2 gap-3 pt-3">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex justify-center border border-dashed border-slate-300 p-0.5 rounded">
                      {renderCardFront(true)}
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
