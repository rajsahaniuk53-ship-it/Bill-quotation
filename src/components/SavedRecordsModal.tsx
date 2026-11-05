import React, { useState } from 'react';
import { DocumentData } from '../types/document';
import { X, Search, FolderOpen, Trash2, Copy, Download, Upload, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/numberToWords';

interface SavedRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedDocuments: DocumentData[];
  onLoadDocument: (doc: DocumentData) => void;
  onDeleteDocument: (id: string) => void;
  onExportAll: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNewDocument: () => void;
}

export const SavedRecordsModal: React.FC<SavedRecordsModalProps> = ({
  isOpen,
  onClose,
  savedDocuments,
  onLoadDocument,
  onDeleteDocument,
  onExportAll,
  onImportFile,
  onNewDocument,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = savedDocuments.filter(d => {
    const q = search.toLowerCase();
    return (
      d.docNumber.toLowerCase().includes(q) ||
      d.client.name.toLowerCase().includes(q) ||
      d.company.name.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Saved Quotations & Bills (सुरक्षित रिकॉर्ड्स)
            </h2>
            <p className="text-xs text-slate-500">
              Browse, search, duplicate, or reload previously saved documents
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by doc number, client, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportAll}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1"
              title="Download backup JSON"
            >
              <Download className="w-3.5 h-3.5" /> Backup All (JSON)
            </button>
            <label className="cursor-pointer px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" /> Restore
              <input type="file" accept=".json" onChange={onImportFile} className="hidden" />
            </label>
            <button
              onClick={() => {
                onNewDocument();
                onClose();
              }}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> + New Blank
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">No saved documents found</p>
              <p className="text-xs mt-1">Click "Save Document" on the top bar to store your quotations and bills here.</p>
            </div>
          ) : (
            filtered.map((d) => (
              <div
                key={d.id}
                className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                      {d.docNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                      d.type === 'quotation'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    }`}>
                      {d.type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {d.date}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">
                    Client: <strong className="text-slate-800 dark:text-slate-200">{d.client.name}</strong>
                    {d.client.companyName ? ` (${d.client.companyName})` : ''} · {d.items.length} items
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onLoadDocument(d);
                      onClose();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-lg flex items-center gap-1"
                  >
                    <FolderOpen className="w-3.5 h-3.5" /> Open (खोलें)
                  </button>
                  <button
                    onClick={() => onDeleteDocument(d.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center text-xs text-slate-500">
          <span>Total saved: {savedDocuments.length} records</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-700 rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
