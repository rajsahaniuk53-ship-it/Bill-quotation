import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RotateCcw, PenTool, Upload } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (dataUrl: string) => void;
  currentSignature?: string;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSaveSignature,
  currentSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw');

  useEffect(() => {
    if (isOpen && activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveDrawn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(dataUrl);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onSaveSignature(reader.result);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Digital Signature (डिजिटल हस्ताक्षर)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex-1 py-2.5 font-medium border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'draw'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" /> Draw on Canvas (हाथ से साइन करें)
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 font-medium border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Upload Image (फोटो अपलोड)
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {activeTab === 'draw' ? (
            <div>
              <p className="text-xs text-slate-500 mb-2">
                Sign below using your mouse, trackpad, or finger:
              </p>
              <div className="border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950 overflow-hidden relative touch-none">
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[150px] cursor-crosshair"
                />
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="absolute bottom-2 right-2 text-[10px] bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 shadow-sm flex items-center gap-1 hover:bg-slate-100"
                >
                  <RotateCcw className="w-3 h-3" /> Clear (मिटाएं)
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 font-medium">
                Upload image of signature or company stamp (PNG, JPG)
              </p>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition">
                <span>Browse File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {currentSignature && (
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Current signature active</span>
              <button
                type="button"
                onClick={() => {
                  onSaveSignature('');
                  onClose();
                }}
                className="text-xs text-rose-600 hover:underline"
              >
                Remove signature
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded"
          >
            Cancel
          </button>
          {activeTab === 'draw' && (
            <button
              onClick={handleSaveDrawn}
              className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" /> Save Signature (हस्ताक्षर जोड़ें)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
