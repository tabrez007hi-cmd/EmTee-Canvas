import React, { useState, useEffect } from 'react';

export default function WorkspaceSettingsModal({ isOpen, onClose, workspace, onSave, userRole, workspaces = [] }) {
  const [name, setName] = useState('');
  
  // 🌐 Global Explore Visibility
  const [isPublic, setIsPublic] = useState(false);
  
  // 🔗 Direct Link Sharing
  const [isShareable, setIsShareable] = useState(false);
  
  const [allowCodeView, setAllowCodeView] = useState(false);
  const [allowDomView, setAllowDomView] = useState(false);

  // 🔄 Swap State
  const [swapTargetId, setSwapTargetId] = useState('');

  // 🧠 Smart Limit Engine
  const privateLimit = userRole === 'normal' ? 1 : userRole === 'pro' ? 10 : Infinity;
  const otherPrivateWorkspaces = workspaces.filter(w => !w.isPublic && w.id !== workspace?.id);
  const isOverPrivateLimit = otherPrivateWorkspaces.length >= privateLimit;
  const requireSwap = !isPublic && isOverPrivateLimit && privateLimit > 0;

  // ✨ NEW: Dynamic URL Sync Engine
  useEffect(() => {
    if (workspace && isOpen) {
      setName(workspace.name || '');
      setIsPublic(workspace.isPublic || false);
      setIsShareable(workspace.isShareable || false);
      setAllowCodeView(workspace.allowCodeView || false);
      setAllowDomView(workspace.allowDomView || false);
      
      if (otherPrivateWorkspaces.length > 0) {
        setSwapTargetId(otherPrivateWorkspaces[0].id);
      }

      // Append custom setting slug to the browser URL silently
      const slug = `[${workspace.name.replace(/\s+/g, '_')}_setting]`;
      if (!window.location.search.includes(slug)) {
        const separator = window.location.search ? '&' : '?';
        window.history.pushState({}, '', `${window.location.pathname}${window.location.search}${separator}${slug}`);
      }
    }
  }, [workspace, isOpen]);

  // Clean URL when closing modal
  const handleClose = () => {
    if (workspace) {
      const slug = `[${workspace.name.replace(/\s+/g, '_')}_setting]`;
      let search = window.location.search;
      search = search.replace(`&${slug}`, '').replace(`?${slug}&`, '?').replace(`?${slug}`, '');
      window.history.pushState({}, '', `${window.location.pathname}${search}`);
    }
    onClose();
  };

  if (!isOpen || !workspace) return null;

  const handleSave = () => {
    if (requireSwap && !swapTargetId) {
      alert("Please select a workspace to make public in exchange for this one.");
      return;
    }

    onSave(
      workspace.id, 
      { name: name.trim(), isPublic, isShareable, allowCodeView, allowDomView },
      requireSwap ? swapTargetId : null 
    );
    handleClose();
  };

  const createdDate = workspace.createdAt ? new Date(workspace.createdAt).toLocaleString() : 'Legacy Project';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4 text-slate-200">
      <div className="bg-slate-900 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden relative border border-slate-800 flex flex-col max-h-[90vh]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none z-0"></div>

        <div className="bg-slate-950 px-6 py-5 border-b border-slate-800 flex items-center justify-between shrink-0 relative z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 truncate pr-4">
            <i className="bi bi-sliders text-indigo-500 drop-shadow-[0_0_8px_rgba(79,70,229,0.8)]"></i> 
            Settings: {name || 'Workspace'}
          </h2>
          <button onClick={handleClose} className="text-slate-500 hover:text-white bg-slate-800 border border-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0">
            <i className="bi bi-x-lg text-sm"></i>
          </button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar flex-1 relative z-10 bg-slate-900">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Project Name 🏷️</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Creation Timeline 📅</label>
              <div className="text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-mono shadow-inner flex items-center gap-2">
                <i className="bi bi-calendar-event text-slate-500"></i> {createdDate}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Access & Privacy 🚀</label>
            
            {/* 🌐 GLOBAL EXPLORE TOGGLE */}
            <div className={`p-5 border rounded-2xl transition-all duration-300 ${!isPublic ? 'bg-slate-950 border-slate-800 shadow-inner' : 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="pr-4">
                  <div className="text-sm font-extrabold text-white flex items-center gap-2 mb-1.5">
                    {isPublic ? <i className="bi bi-globe-americas text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]"></i> : <i className="bi bi-lock-fill text-slate-500"></i>}
                    Global Community Explore
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    Publish this project to the public Explore feed. Enabling this makes your design visible to the community and allows you to expose your underlying DOM Tree and Source Code settings.
                  </div>
                </div>
                <button 
                  onClick={() => setIsPublic(!isPublic)} 
                  className={`w-11 h-6 shrink-0 flex items-center rounded-full p-1 transition-colors cursor-pointer ${isPublic ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {/* ✨ FIX: DOM & Code toggles strictly locked behind 'isPublic' state */}
              <div className={`transition-all duration-300 overflow-hidden ${isPublic ? 'max-h-40 opacity-100 mt-4 pt-4 border-t border-emerald-500/20' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <div className="pl-3 border-l-2 border-emerald-500/50 space-y-4 py-1">
                  <div className="flex items-center justify-between">
                    <div className="pr-4">
                      <div className="text-xs font-bold text-slate-200 mb-0.5">Expose DOM Tree</div>
                      <div className="text-[9px] text-slate-400">Allow users to inspect your HTML element structure.</div>
                    </div>
                    <button onClick={() => setAllowDomView(!allowDomView)} className={`w-9 h-5 shrink-0 flex items-center rounded-full p-1 transition-colors cursor-pointer ${allowDomView ? 'bg-emerald-500' : 'bg-slate-700'}`}><div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${allowDomView ? 'translate-x-4' : 'translate-x-0'}`}></div></button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="pr-4">
                      <div className="text-xs font-bold text-slate-200 mb-0.5">Expose Source Code</div>
                      <div className="text-[9px] text-slate-400">Allow users to view your compiled Tailwind CSS block.</div>
                    </div>
                    <button onClick={() => setAllowCodeView(!allowCodeView)} className={`w-9 h-5 shrink-0 flex items-center rounded-full p-1 transition-colors cursor-pointer ${allowCodeView ? 'bg-emerald-500' : 'bg-slate-700'}`}><div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${allowCodeView ? 'translate-x-4' : 'translate-x-0'}`}></div></button>
                  </div>
                </div>
              </div>

              {/* ⚠️ SWAP UI TRIGGER */}
              {requireSwap && (
                <div className="mt-4 pt-4 border-t border-slate-800 animate-fade-in">
                  <div className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                    <i className="bi bi-exclamation-triangle-fill drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]"></i> Private Limit Reached (Max {privateLimit})
                  </div>
                  <p className="text-[10px] text-amber-500/80 mb-3 leading-relaxed">
                    To make this project private, you must select an existing private project to become public. 🔄
                  </p>
                  <select 
                    value={swapTargetId} 
                    onChange={(e) => setSwapTargetId(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/30 rounded-xl px-3 py-2.5 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-400 outline-none cursor-pointer"
                  >
                    {otherPrivateWorkspaces.map(ws => (
                      <option key={ws.id} value={ws.id} className="bg-slate-900">{ws.name} (ID: {ws.id})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 🔗 DIRECT LINK SHARING TOGGLE */}
            <div className={`flex items-start justify-between p-5 border rounded-2xl transition-all duration-300 ${isShareable ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-slate-950 border-slate-800 shadow-inner'}`}>
              <div className="pr-4">
                <div className="text-sm font-extrabold text-white flex items-center gap-2 mb-1.5">
                  <i className={`bi bi-link-45deg text-xl leading-none ${isShareable ? 'text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]' : 'text-slate-500'}`}></i> 
                  Direct Share Link
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Generate a private viewing link. When enabled, anyone with the exact URL can view your canvas. When disabled, the link becomes dead and your workspace is strictly locked to you.
                </div>
              </div>
              <button 
                onClick={() => setIsShareable(!isShareable)} 
                className={`w-11 h-6 shrink-0 flex items-center rounded-full p-1 transition-colors cursor-pointer ${isShareable ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-700'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isShareable ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>
            
          </div>
        </div>

        <div className="bg-slate-950 px-6 py-5 border-t border-slate-800 shrink-0 relative z-10">
          <button 
            onClick={handleSave} 
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2"
          >
            <i className="bi bi-check2-circle text-lg"></i> Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}