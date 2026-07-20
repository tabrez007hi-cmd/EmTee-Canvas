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

  useEffect(() => {
    if (workspace) {
      setName(workspace.name || '');
      setIsPublic(workspace.isPublic || false);
      setIsShareable(workspace.isShareable || false);
      setAllowCodeView(workspace.allowCodeView || false);
      setAllowDomView(workspace.allowDomView || false);
      
      // Auto-select the first available private workspace for swapping if needed
      if (otherPrivateWorkspaces.length > 0) {
        setSwapTargetId(otherPrivateWorkspaces[0].id);
      }
    }
  }, [workspace, isOpen]);

  if (!isOpen || !workspace) return null;

  const handleSave = () => {
    // If they need to swap but haven't selected one, block save
    if (requireSwap && !swapTargetId) {
      alert("Please select a workspace to make public in exchange for this one.");
      return;
    }

    onSave(
      workspace.id, 
      { name: name.trim(), isPublic, isShareable, allowCodeView, allowDomView },
      requireSwap ? swapTargetId : null // Pass the swap ID to the backend function
    );
    onClose();
  };

  const createdDate = workspace.createdAt ? new Date(workspace.createdAt).toLocaleString() : 'Legacy Project';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-200 flex flex-col max-h-[90vh]">
        
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i className="bi bi-sliders text-indigo-600"></i> Workspace Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-full hover:bg-slate-200 cursor-pointer">
            <i className="bi bi-x-lg text-sm"></i>
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Project Name 🏷️</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Creation Timeline 📅</label>
              <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono shadow-inner flex items-center gap-2">
                <i className="bi bi-calendar-event text-slate-400"></i> {createdDate}
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Visibility & Sharing 🚀</label>
            
            {/* 🌐 GLOBAL EXPLORE TOGGLE */}
            <div className={`p-4 border rounded-xl transition-colors ${!isPublic ? 'bg-slate-50 border-slate-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    {isPublic ? <i className="bi bi-globe-americas text-green-500"></i> : <i className="bi bi-lock-fill text-slate-400"></i>}
                    Global Explore
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Show in the community Explore tab.</div>
                </div>
                <button 
                  onClick={() => setIsPublic(!isPublic)} 
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${isPublic ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {/* ⚠️ SWAP UI TRIGGER */}
              {requireSwap && (
                <div className="mt-3 pt-3 border-t border-slate-200 animate-fade-in">
                  <div className="text-xs font-bold text-amber-600 mb-2 flex items-center gap-1.5">
                    <i className="bi bi-exclamation-triangle-fill"></i> Private Limit Reached (Max {privateLimit})
                  </div>
                  <p className="text-[10px] text-slate-600 mb-2 leading-relaxed">
                    To make this project private, you must select an existing private project to become public. 🔄
                  </p>
                  <select 
                    value={swapTargetId} 
                    onChange={(e) => setSwapTargetId(e.target.value)}
                    className="w-full border border-amber-300 bg-amber-50 rounded-lg px-3 py-2 text-xs font-semibold text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {otherPrivateWorkspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>{ws.name} (ID: {ws.id})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 🔗 DIRECT LINK SHARING TOGGLE */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
              <div>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <i className="bi bi-link-45deg text-blue-500 text-lg"></i> Direct Link Sharing
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Allow others to import via your URL.</div>
              </div>
              <button 
                onClick={() => setIsShareable(!isShareable)} 
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${isShareable ? 'bg-blue-500' : 'bg-slate-300'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isShareable ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <div className={`transition-all duration-300 overflow-hidden ${isPublic || isShareable ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
              <div className="pl-4 border-l-2 border-indigo-100 space-y-4 mt-1 py-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700">Show DOM Tree</div>
                  <button onClick={() => setAllowDomView(!allowDomView)} className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors cursor-pointer ${allowDomView ? 'bg-indigo-500' : 'bg-slate-300'}`}><div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${allowDomView ? 'translate-x-4' : 'translate-x-0'}`}></div></button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700">Show Source Code</div>
                  <button onClick={() => setAllowCodeView(!allowCodeView)} className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors cursor-pointer ${allowCodeView ? 'bg-indigo-500' : 'bg-slate-300'}`}><div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${allowCodeView ? 'translate-x-4' : 'translate-x-0'}`}></div></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 shrink-0">
          <button 
            onClick={handleSave} 
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-transform active:scale-[0.98] cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            <i className="bi bi-check2-circle"></i> Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}