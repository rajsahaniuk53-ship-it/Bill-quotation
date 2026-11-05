import React, { useState, useRef, useEffect } from 'react';
import { VisitingCardData, VisitingCardTheme } from '../types/visitingCard';
import { Rotate3d, Play, Pause, RotateCcw, Eye, Sparkles, Smartphone, Download, Share2, Check } from 'lucide-react';

interface VisitingCard3DViewerProps {
  cardData: VisitingCardData;
  theme: VisitingCardTheme;
  renderFront: (is3D?: boolean) => React.ReactNode;
  renderBack: (is3D?: boolean) => React.ReactNode;
  onDownloadImage: () => void;
  onShare: () => void;
}

export const VisitingCard3DViewer: React.FC<VisitingCard3DViewerProps> = ({
  cardData,
  theme,
  renderFront,
  renderBack,
  onDownloadImage,
  onShare,
}) => {
  const [rotX, setRotX] = useState<number>(12);
  const [rotY, setRotY] = useState<number>(-25);
  const [isAutoSpin, setIsAutoSpin] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);
  const animFrameRef = useRef<number | null>(null);

  // Auto-spin animation loop
  useEffect(() => {
    if (isAutoSpin && !isDragging) {
      let lastTime = performance.now();
      const spin = (time: number) => {
        const delta = time - lastTime;
        lastTime = time;
        setRotY((prev) => (prev + (delta * 0.05)) % 360);
        animFrameRef.current = requestAnimationFrame(spin);
      };
      animFrameRef.current = requestAnimationFrame(spin);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isAutoSpin, isDragging]);

  // Mouse & Touch Drag Handlers for 360-degree rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setIsAutoSpin(false);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    setRotY((prev) => (prev + dx * 0.75) % 360);
    setRotX((prev) => Math.max(-60, Math.min(60, prev - dy * 0.5)));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Preset rotation positions
  const setPreset = (preset: 'front' | 'back' | 'iso' | 'vertical') => {
    setIsAutoSpin(false);
    if (preset === 'front') {
      setRotX(0);
      setRotY(0);
    } else if (preset === 'back') {
      setRotX(0);
      setRotY(180);
    } else if (preset === 'iso') {
      setRotX(15);
      setRotY(-35);
    } else if (preset === 'vertical') {
      setRotX(25);
      setRotY(70);
    }
  };

  // Calculate dynamic sheen reflection based on angle
  const sheenPos = ((rotY % 360) + 360) % 360;
  const sheenOpacity = Math.max(0, Math.sin((sheenPos * Math.PI) / 180));

  return (
    <div className="w-full flex flex-col items-center select-none">
      
      {/* 3D Viewer Top Controls */}
      <div className="w-full max-w-xl flex flex-wrap items-center justify-between gap-2 mb-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
        <div className="flex items-center gap-1.5">
          <span className="p-1 bg-amber-500/10 text-amber-600 rounded-lg">
            <Rotate3d className="w-4 h-4" />
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200">360° 3D Card View</span>
          <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold">
            {Math.round(rotY)}°
          </span>
        </div>

        {/* Action presets */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAutoSpin(!isAutoSpin)}
            className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition ${
              isAutoSpin 
                ? 'bg-amber-500 text-white shadow-xs' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
            title={isAutoSpin ? 'Pause Rotation' : 'Continuous 360° Auto Spin'}
          >
            {isAutoSpin ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isAutoSpin ? 'Spinning' : 'Auto Spin'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPreset('front')}
            className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg font-medium"
          >
            Front (0°)
          </button>
          
          <button
            type="button"
            onClick={() => setPreset('back')}
            className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg font-medium"
          >
            Back (180°)
          </button>

          <button
            type="button"
            onClick={() => setPreset('iso')}
            className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg font-medium"
          >
            3D Tilt
          </button>
        </div>
      </div>

      {/* 3D Scene Viewport */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full max-w-xl h-[330px] sm:h-[370px] flex items-center justify-center relative overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing border border-slate-300/60 dark:border-slate-800 shadow-inner"
        style={{
          perspective: 1200,
          background: 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.08) 0%, rgba(15, 23, 42, 0.22) 100%)',
          touchAction: 'none',
        }}
      >
        {/* Helper Hint */}
        <div className="absolute top-3 left-3 text-[10px] text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs px-2 py-1 rounded-full border border-slate-200 dark:border-slate-800 pointer-events-none flex items-center gap-1">
          <Rotate3d className="w-3 h-3 text-indigo-500 animate-spin" />
          <span>Drag with mouse / finger to rotate in 360°</span>
        </div>

        {/* 3D Rotating Double-Sided Card Container */}
        <div
          style={{
            transformStyle: 'preserve-3d',
            transform: `scale(${scale}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            width: '380px',
            height: '217px',
            position: 'relative',
          }}
        >
          {/* Card Edge Thickness (simulated real 3D card stock depth) */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              transform: 'translateZ(-2px)',
              boxShadow: '0 25px 45px -10px rgba(0, 0, 0, 0.45), 0 10px 20px -5px rgba(0, 0, 0, 0.3)',
              backgroundColor: theme.metalType === 'gold' ? '#b38728' : theme.metalType === 'copper' ? '#a05248' : '#64748b',
            }}
          />

          {/* FRONT SIDE (Face 0°) */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(0deg) translateZ(1.5px)',
              borderColor: theme.accentColor,
            }}
          >
            {renderFront(true)}

            {/* Dynamic Metallic Reflection Sheen */}
            {theme.metallicFoil && (
              <div
                className="absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-75"
                style={{
                  background: `linear-gradient(${rotY * 2}deg, rgba(255,255,255,0) 0%, ${theme.sheenHighlight || 'rgba(255,255,255,0.45)'} 50%, rgba(255,255,255,0) 100%)`,
                  opacity: 0.35 + sheenOpacity * 0.45,
                }}
              />
            )}
          </div>

          {/* BACK SIDE (Face 180°) */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg) translateZ(1.5px)',
              borderColor: theme.accentColor,
            }}
          >
            {renderBack(true)}

            {/* Dynamic Metallic Reflection Sheen for Back */}
            {theme.metallicFoil && (
              <div
                className="absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-75"
                style={{
                  background: `linear-gradient(${rotY * 2 + 180}deg, rgba(255,255,255,0) 0%, ${theme.sheenHighlight || 'rgba(255,255,255,0.45)'} 50%, rgba(255,255,255,0) 100%)`,
                  opacity: 0.35 + (1 - sheenOpacity) * 0.45,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Footer for 3D View */}
      <div className="w-full max-w-xl flex items-center justify-between mt-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDownloadImage}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-lg text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Download High-Res Card</span>
          </button>

          <button
            type="button"
            onClick={onShare}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Card (WhatsApp)</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          {theme.metalType ? `✨ ${theme.metalType.toUpperCase()} Metallic Finish` : 'Standard Matte'}
        </div>
      </div>

    </div>
  );
};
