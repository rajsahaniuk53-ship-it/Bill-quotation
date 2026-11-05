import React, { useState } from 'react';
import { LETTERHEAD_TEMPLATES } from '../data/letterheadTemplates';
import { LetterheadTemplate } from '../types/document';
import { X, Check, Palette, Sparkles, Filter } from 'lucide-react';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplateId: string;
  onSelectTemplate: (template: LetterheadTemplate) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
}

const CATEGORIES = [
  'All',
  'Corporate',
  'Modern Minimal',
  'Royal Luxury',
  'Vyapar Traditional',
  'Creative Studio',
  'Industrial',
  'Tech',
  'Medical',
  'Compact',
];

const PRESET_COLORS = [
  { name: 'Navy Blue', hex: '#0f2b48' },
  { name: 'Royal Indigo', hex: '#4338ca' },
  { name: 'Traditional Maroon', hex: '#991b1b' },
  { name: 'Forest Emerald', hex: '#064e3b' },
  { name: 'Ocean Cyan', hex: '#0284c7' },
  { name: 'Crimson Red', hex: '#be123c' },
  { name: 'Charcoal Slate', hex: '#18181b' },
  { name: 'Amber Bronze', hex: '#b45309' },
  { name: 'Teal Turquoise', hex: '#0f766e' },
  { name: 'Electric Violet', hex: '#6d28d9' },
  { name: 'Terracotta', hex: '#c2410c' },
  { name: 'Pure Onyx', hex: '#000000' },
];

export const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedTemplateId,
  onSelectTemplate,
  currentColor,
  onColorChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const filteredTemplates = LETTERHEAD_TEMPLATES.filter((tpl) => {
    const matchesCat = selectedCategory === 'All' || tpl.category === selectedCategory;
    const matchesSearch = 
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tpl.subtitle && tpl.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tpl.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Palette className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Choose from 30 Professional Letterhead Designs
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select any design with a single click to instantly apply styling and color themes
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Color customizer strip */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Accent Theme Color:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => onColorChange(c.hex)}
                  title={c.name}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    currentColor.toLowerCase() === c.hex.toLowerCase() 
                      ? 'scale-125 border-white ring-2 ring-indigo-500 shadow-sm' 
                      : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <input
                type="color"
                value={currentColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-6 h-6 p-0 border border-slate-300 rounded cursor-pointer"
                title="Custom color picker"
              />
            </div>
          </div>
          <span className="text-slate-500 text-[11px]">
            Showing {filteredTemplates.length} of 30 Designs
          </span>
        </div>

        {/* Filter Bar & Search */}
        <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white dark:bg-indigo-600'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search templates (e.g. Vyapar, Navy, Minimal)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg w-60 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((tpl) => {
            const isSelected = tpl.id === selectedTemplateId;
            return (
              <div
                key={tpl.id}
                onClick={() => {
                  onSelectTemplate(tpl);
                  onClose();
                }}
                className={`group relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20 dark:bg-indigo-950/20'
                    : 'border-slate-200 hover:border-slate-400 bg-white dark:bg-slate-800 dark:border-slate-700'
                }`}
              >
                {/* Visual Letterhead Mini-Mockup */}
                <div className="h-32 w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 mb-3 flex flex-col justify-between overflow-hidden relative shadow-inner">
                  {/* Mini Header simulation */}
                  <div className="w-full">
                    {tpl.headerLayout === 'banner' ? (
                      <div 
                        className="h-7 w-full rounded flex items-center justify-between px-2 text-[8px] text-white font-bold"
                        style={{ backgroundColor: tpl.defaultPrimaryColor }}
                      >
                        <span className="truncate">COMPANY NAME</span>
                        <span className="opacity-80">INVOICE</span>
                      </div>
                    ) : tpl.headerLayout === 'centered' ? (
                      <div className="text-center">
                        <div 
                          className="w-4 h-4 rounded-full mx-auto mb-0.5" 
                          style={{ backgroundColor: tpl.defaultPrimaryColor }} 
                        />
                        <div className="h-1.5 w-16 mx-auto bg-slate-400 rounded-full mb-1" />
                        <div className="h-0.5 w-full bg-slate-300 mb-1" />
                      </div>
                    ) : tpl.headerLayout === 'ribbon' ? (
                      <div className="flex gap-2">
                        <div className="w-1.5 h-7 rounded-sm" style={{ backgroundColor: tpl.defaultPrimaryColor }} />
                        <div className="flex-1">
                          <div className="h-2 w-20 bg-slate-700 rounded-full mb-1" />
                          <div className="h-1 w-12 bg-slate-300 rounded-full" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="h-2 w-20 bg-slate-800 rounded-full" />
                          <div className="h-1 w-12 bg-slate-300 rounded-full" />
                        </div>
                        <div 
                          className="h-4 w-12 rounded flex items-center justify-center text-[7px] text-white font-bold"
                          style={{ backgroundColor: tpl.defaultPrimaryColor }}
                        >
                          DOC
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Simulated table lines */}
                  <div className="space-y-1 py-1">
                    <div 
                      className="h-1.5 w-full rounded"
                      style={{ 
                        backgroundColor: tpl.tableHeaderStyle === 'dark' ? tpl.defaultPrimaryColor : '#cbd5e1' 
                      }} 
                    />
                    <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-1 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>

                  {/* Simulated bottom total pill */}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800">
                    <div className="h-1 w-10 bg-slate-300 rounded" />
                    <div 
                      className="h-3 w-14 rounded text-[6px] text-white font-bold flex items-center justify-center"
                      style={{ backgroundColor: tpl.defaultPrimaryColor }}
                    >
                      TOTAL ₹
                    </div>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1 shadow">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Template Info */}
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        #{tpl.number} · {tpl.category}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {tpl.name}
                      </h3>
                      {tpl.subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {tpl.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {tpl.description}
                  </p>
                </div>

                {/* Bottom select button */}
                <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: tpl.defaultPrimaryColor }}
                      title="Default Palette"
                    />
                    <span className="text-[10px] text-slate-400 capitalize">{tpl.headerLayout} Header</span>
                  </div>
                  <button
                    className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                      isSelected 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {isSelected ? 'Applied ✓' : 'Use Template'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center text-xs text-slate-500">
          <span>Click on any design to immediately apply it to your current quotation/bill.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white dark:bg-indigo-600 rounded-lg font-medium hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
