import React, { useState, useEffect } from 'react';

// ✨ FIX: Accept userRole and workspaces to calculate privacy limits
export default function WorkspaceSettingsModal({ isOpen, onClose, workspace, onSave, userRole, workspaces = [] }) {
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [allowCodeView, setAllowCodeView] = useState(false);
  const [allowDomView, setAllowDomView] = useState(false);

  // ✨ ENGINE: Calculate if Normal User has hit their 1 Private Workspace limit
  const otherPrivateCount = workspaces.filter(w => !w.isPublic && w.id !== workspace?.id).length;
  const forcePublic = userRole === 'normal' && otherPrivateCount >= 1;

  useEffect(() => {
    if (workspace) {
      setName(workspace.name || '');
      // If forced public, override to true. Otherwise use saved state.
      setIsPublic(forcePublic ? true : (workspace.isPublic || false));
      setAllowCodeView(workspace.allowCodeView || false);
      setAllowDomView(workspace.allowDomView || false);
    }
  }, [workspace, forcePublic]);

  if (!isOpen || !workspace) return null;

  const handleSave = () => {
    onSave(workspace.id, { name: name.trim(), isPublic, allowCodeView, allowDomView });
    onClose();
  };

  const createdDate = workspace.createdAt ? new Date(workspace.createdAt).toLocaleString() : 'Legacy Project';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-200">
        
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i className="bi bi-sliders text-indigo-600"></i> Workspace Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-full hover:bg-slate-200 cursor-pointer">
            <i className="bi bi-x-lg text-sm"></i>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Project Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Creation Timeline</label>
              <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono shadow-inner flex items-center gap-2">
                <i className="bi bi-calendar-event text-slate-400"></i> {createdDate}
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Access & Permissions</label>
            
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl transition-colors hover:border-slate-300">
              <div>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  {isPublic ? <i className="bi bi-globe-americas text-green-500"></i> : <i className="bi bi-lock-fill text-amber-500"></i>}
                  Public Access
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Allow anyone to view and import.</div>
                {/* ✨ Alert user if forced public */}
                {forcePublic && <div className="text-[9px] text-amber-600 mt-1 font-bold">Free plan limit: 1 private project max.</div>}
              </div>
              <button 
                disabled={forcePublic}
                onClick={() => !forcePublic && setIsPublic(!isPublic)} 
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${forcePublic ? 'opacity-50 cursor-not-allowed bg-slate-300' : 'cursor-pointer'} ${isPublic ? 'bg-green-500' : 'bg-slate-300'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <div className={`transition-all duration-300 overflow-hidden ${isPublic ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
              <div className="pl-4 border-l-2 border-indigo-100 space-y-4 mt-3 py-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-700">Show DOM Tree</div>
                  </div>
                  <button onClick={() => setAllowDomView(!allowDomView)} className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors cursor-pointer ${allowDomView ? 'bg-indigo-500' : 'bg-slate-300'}`}><div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${allowDomView ? 'translate-x-4' : 'translate-x-0'}`}></div></button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-700">Show Source Code</div>
                  </div>
                  <button onClick={() => setAllowCodeView(!allowCodeView)} className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors cursor-pointer ${allowCodeView ? 'bg-indigo-500' : 'bg-slate-300'}`}><div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${allowCodeView ? 'translate-x-4' : 'translate-x-0'}`}></div></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <button onClick={handleSave} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-transform active:scale-[0.98] cursor-pointer shadow-md flex items-center justify-center gap-2">
            <i className="bi bi-check2-circle"></i> Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}