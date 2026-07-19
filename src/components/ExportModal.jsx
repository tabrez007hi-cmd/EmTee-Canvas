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

  // Roles validation
  const canDownload = userRole === 'pro' || userRole === 'developer';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 relative flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="cursor-pointer absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded-full flex items-center justify-center z-10">
          <i className="bi bi-x-lg text-base"></i>
        </button>

        <div className="flex items-center justify-between border-b pb-4 mb-4 shrink-0 pr-8">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <i className="bi bi-code-slash text-indigo-600 mr-2"></i> Compile & Export
          </h2>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col gap-3">
          <p className="text-xs text-gray-500 font-medium">Your canvas layout compiled into production-ready HTML and Tailwind CSS.</p>
          <div className="flex-1 bg-slate-900 rounded-xl p-4 overflow-auto custom-scrollbar relative border border-slate-800 shadow-inner">
            <pre className="text-emerald-400 text-[11px] font-mono whitespace-pre-wrap break-all select-all">
              {code}
            </pre>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4 shrink-0">
          <button onClick={handleCopy} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2">
            <i className={`bi ${copied ? 'bi-check-lg text-green-600' : 'bi-clipboard'}`}></i>
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          
          <button 
            onClick={handleDownload} 
            disabled={!canDownload}
            className={`px-4 py-2 text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 ${canDownload ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
            title={!canDownload ? 'Upgrade to Pro or Developer to Download HTML' : ''}
          >
            {canDownload ? <i className="bi bi-download"></i> : <i className="bi bi-lock-fill"></i>}
            Download .HTML {(!canDownload) && '(Pro)'}
          </button>
        </div>
      </div>
    </div>
  );
}