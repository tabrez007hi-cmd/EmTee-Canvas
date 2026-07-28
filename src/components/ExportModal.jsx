import React, { useState, useEffect } from 'react';

export default function ExportModal({ isOpen, onClose, code, projectName, userRole }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) onClose();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

const canDownload = userRole === 'pro' || userRole === 'advance' || userRole === 'admin';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!canDownload) return;
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName ? projectName.replace(/\s+/g, '-').toLowerCase() : 'emteecanvas-project'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-slate-900 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-4xl p-6 md:p-8 relative flex flex-col max-h-[90vh] border border-slate-800 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none z-0"></div>

        <button onClick={onClose} className="cursor-pointer absolute top-5 right-5 text-slate-500 hover:text-white transition-colors bg-slate-800 border border-slate-700 w-8 h-8 rounded-full flex items-center justify-center z-20">
          <i className="bi bi-x-lg text-sm"></i>
        </button>

        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5 shrink-0 pr-8 relative z-10">
          <h2 className="text-xl font-bold text-white flex items-center">
            <i className="bi bi-code-slash text-indigo-500 mr-2 drop-shadow-[0_0_8px_rgba(79,70,229,0.8)]"></i> Compile & Export
          </h2>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col gap-3 relative z-10">
          <p className="text-xs text-slate-400 font-medium">Your canvas layout compiled into production-ready HTML and Tailwind CSS.</p>
          <div className="flex-1 bg-slate-950 rounded-2xl p-6 overflow-auto custom-scrollbar relative border border-slate-800 shadow-inner">
            <pre className="text-emerald-400 text-[11px] font-mono whitespace-pre-wrap break-all select-all">
              {code}
            </pre>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800 mt-4 shrink-0 relative z-10">
          <button onClick={handleCopy} className={`px-5 py-2.5 bg-slate-800 border hover:bg-slate-700 text-sm font-bold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-2 ${copied ? 'border-emerald-500/50 text-emerald-400' : 'border-slate-700 text-slate-300'}`}>
            <i className={`bi ${copied ? 'bi-check-lg text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'bi-clipboard'}`}></i>
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          
          <button 
            onClick={handleDownload} 
            disabled={!canDownload}
            className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-colors flex items-center gap-2 ${canDownload ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] cursor-pointer' : 'bg-slate-900 border border-slate-700 text-slate-500 cursor-not-allowed'}`}
            title={!canDownload ? 'Upgrade to Pro or Developer to Download HTML' : ''}
          >
            {canDownload ? <i className="bi bi-download"></i> : <i className="bi bi-lock-fill text-amber-500"></i>}
            Download .HTML {(!canDownload) && '(Pro)'}
          </button>
        </div>
      </div>
    </div>
  );
}