import React, { useEffect } from 'react';

export default function SettingsModal({ isOpen, onClose, autoSave, onToggleAutoSave }) {
  
  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) onClose();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-sm p-6 relative overflow-hidden text-slate-200">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none z-0"></div>

        <button onClick={onClose} className="cursor-pointer absolute top-4 right-4 text-slate-500 hover:text-white transition-colors bg-slate-800 border border-slate-700 w-8 h-8 rounded-full flex items-center justify-center z-100">
          <i className="bi bi-x-lg text-sm"></i>
        </button>
        

        <h2 className="text-xl font-bold text-white mb-6 text-center border-b border-slate-800 pb-4 relative z-10">
          <i className="bi bi-gear-fill text-indigo-500 mr-2 drop-shadow-[0_0_8px_rgba(79,70,229,0.8)]"></i> Settings
        </h2>

        <div className="space-y-4 relative z-10">
          {/* Setting 1: Cloud Auto-Save */}
          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
            <div>
              <div className="text-sm font-bold text-white">Cloud Auto-Save</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Sync layout to Firebase automatically</div>
            </div>
            <button 
              onClick={onToggleAutoSave}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${autoSave ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-slate-700'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${autoSave ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          {/* Setting 2: Placeholder Static UI Toggle for Snapping Lines */}
          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner opacity-50">
            <div>
              <div className="text-sm font-bold text-white">Canvas Grid Overlay</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Show blueprint snapping lines</div>
            </div>
            <button className="w-11 h-6 flex items-center bg-slate-700 rounded-full p-1 cursor-not-allowed">
              <div className="bg-slate-300 w-4 h-4 rounded-full shadow-md"></div>
            </button>
          </div>

          {/* Setting 3: Placeholder Static UI Toggle for Speed Performance */}
          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner opacity-50">
            <div>
              <div className="text-sm font-bold text-white">Performance Mode</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Reduce animations for speed</div>
            </div>
            <button className="w-11 h-6 flex items-center bg-indigo-600 rounded-full p-1 cursor-not-allowed">
              <div className="bg-white w-4 h-4 rounded-full shadow-md translate-x-5"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}