import React, { createContext, useContext, useState, useCallback } from 'react';

const UIContext = createContext();
export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Toast System
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // Confirm / Prompt Modal System
  const showConfirm = useCallback((config) => {
    setConfirmConfig(config);
  }, []);

  const closeConfirm = () => setConfirmConfig(null);

  return (
    <UIContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* 🍞 TOAST CONTAINER */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto px-5 py-3.5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border flex items-center gap-3 animate-fade-in backdrop-blur-md ${t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : t.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-slate-800/90 border-slate-700 text-slate-200'}`}>
             <i className={`bi text-lg ${t.type === 'success' ? 'bi-check-circle-fill' : t.type === 'error' ? 'bi-exclamation-octagon-fill' : 'bi-info-circle-fill'}`}></i>
             <span className="text-sm font-bold tracking-wide">{t.message}</span>
          </div>
        ))}
      </div>

      {/* 🛑 CONFIRM / PROMPT MODAL */}
      {confirmConfig && (
         <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
           <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none"></div>
             
             <h2 className="text-xl font-bold text-white mb-2 relative z-10">{confirmConfig.title || 'Confirm Action'}</h2>
             <p className="text-sm text-slate-400 mb-6 leading-relaxed relative z-10">{confirmConfig.message}</p>
             
             {confirmConfig.isPrompt && (
               <input 
                 type="text" 
                 id="ui-prompt-input" 
                 className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 mb-6 focus:border-indigo-500 focus:outline-none transition-colors relative z-10" 
                 placeholder={confirmConfig.placeholder || 'Enter value...'} 
                 autoFocus
               />
             )}
             
             <div className="flex gap-3 relative z-10">
               <button onClick={closeConfirm} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition-colors cursor-pointer shadow-sm">Cancel</button>
               <button 
                 onClick={() => {
                   const val = confirmConfig.isPrompt ? document.getElementById('ui-prompt-input').value : true;
                   confirmConfig.onConfirm(val);
                   closeConfirm();
                 }} 
                 className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-sm text-white ${confirmConfig.danger ? 'bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)]'}`}
               >
                 {confirmConfig.confirmText || 'Confirm'}
               </button>
             </div>
           </div>
         </div>
      )}
    </UIContext.Provider>
  );
};