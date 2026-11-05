import React from 'react';
import { Smartphone, Download, X, CheckCircle, WifiOff, Globe, Share2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const result = await install();
    if (result === 'accepted') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                Install BillCraft on Your Phone
              </h3>
              <p className="text-[11px] text-indigo-100">
                Use offline anytime like a native mobile app!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {/* Key Advantages */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Fast & Offline</span>
                <span className="text-[10px] text-slate-500">Opens instantly without internet</span>
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Full Screen</span>
                <span className="text-[10px] text-slate-500">Runs full screen like a native app</span>
              </div>
            </div>
          </div>

          {/* Direct Install Button (If browser supports BeforeInstallPrompt) */}
          {isInstallable ? (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 text-center space-y-2">
              <p className="font-bold text-indigo-950 dark:text-indigo-200">
                Ready for One-Click Installation!
              </p>
              <button
                onClick={handleInstallClick}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>Install App to Mobile Home Screen Now</span>
              </button>
            </div>
          ) : isInstalled ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center text-emerald-900 dark:text-emerald-200 font-bold flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>BillCraft is already installed on your device!</span>
            </div>
          ) : null}

          {/* Device specific step-by-step guidance */}
          <div className="space-y-3 pt-1">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
              How to Install on Your Device:
            </h4>

            {/* Android / Chrome Guide */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Android Chrome / Edge / Brave:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                <li>Tap the <strong>three dots menu (⋮)</strong> at top right corner.</li>
                <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                <li>Confirm <strong>"Install"</strong>. The BillCraft icon will appear on your phone screen!</li>
              </ol>
            </div>

            {/* iPhone / iPad Safari Guide */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>iPhone / iPad (Safari):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                <li>Tap the <strong>Share button</strong> (square with arrow pointing up) at the bottom.</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                <li>Tap <strong>"Add"</strong> at the top right.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
