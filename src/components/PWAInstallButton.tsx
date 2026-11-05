import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'banner' | 'mobile' }> = ({
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Handle click for Chromium / Android / Desktop or trigger guide
  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // In preview or browsers where prompt event hasn't fired yet, show helpful install tips
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'mobile' ? (
        <button
          onClick={handleClick}
          className="flex flex-col items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-semibold text-xs"
        >
          <Download className="w-4 h-4" />
          <span>Install App</span>
        </button>
      ) : (
        <button
          onClick={handleClick}
          title="Install as Mobile/Desktop App to use anywhere offline"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-all transform active:scale-95 whitespace-nowrap"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install App (ऐप डाउनलोड करें)</span>
        </button>
      )}

      {/* Guide Modal for iOS Safari / Desktop Manual Install */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Install BillCraft App</h3>
                <p className="text-[11px] text-slate-500">मोबाइल या लैपटॉप पर बिना इंटरनेट भी चलाएं</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 my-4 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed">
              {isIOS ? (
                <>
                  <p className="font-semibold text-slate-900 dark:text-white">iPhone / iPad Safari में कैसे इंस्टॉल करें:</p>
                  <p>1. नीचे Safari टूलबार में <strong>Share (शेयर)</strong> बटन दबाएं।</p>
                  <p>2. नीचे स्क्रॉल करके <strong>Add to Home Screen (होम स्क्रीन पर जोड़ें)</strong> पर टैप करें।</p>
                  <p>3. अब यह ऐप आपके मोबाइल की स्क्रीन पर एक असली ऐप की तरह आ जाएगा!</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-900 dark:text-white">Android / Chrome / Edge में कैसे इंस्टॉल करें:</p>
                  <p>1. ब्राउज़र के मेनू (ऊपर दायें कोने में <strong>3 डॉट्स ⋮</strong>) पर क्लिक करें।</p>
                  <p>2. <strong>Install app (ऐप इंस्टॉल करें)</strong> या <strong>Add to Home Screen</strong> चुनें।</p>
                  <p>3. आपका बिल और कोटेशन मेकर ऐप तुरंत आपके फोन या लैपटॉप में सेव हो जाएगा!</p>
                </>
              )}
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm transition"
            >
              Theek Hai (समझ गया)
            </button>
          </div>
        </div>
      )}
    </>
  );
};
