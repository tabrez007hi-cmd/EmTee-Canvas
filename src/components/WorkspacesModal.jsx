import React from 'react';
import { useUI } from '../contexts/UIContext';


export default function WorkspacesModal({ 
  isOpen, onClose, workspaces, activeWorkspaceId, currentUserUid, currentUsername, userRole, 
  onCreateWorkspace, onSelectWorkspace, onDeleteWorkspace, onOpenWorkspaceSettings, onDuplicateWorkspace 
}) {
  if (!isOpen) return null;
  const atWorkspaceLimit = userRole === 'normal' && workspaces.length >= 3;
    const { showToast, showConfirm } = useUI();


  const handleShareWorkspace = (id) => {
    const shareUrl = `${window.location.origin}/share?u=${currentUsername}&owner=${currentUserUid}&ws=${id}`;
    navigator.clipboard.writeText(shareUrl);
    showToast('Project link copied to clipboard! 🔗', 'success');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-slate-900 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-md p-6 md:p-8 relative flex flex-col max-h-[85vh] border border-slate-800 overflow-hidden text-slate-200">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none z-0"></div>

        <button onClick={onClose} className="cursor-pointer absolute top-5 right-5 text-slate-500 hover:text-white transition-colors bg-slate-800 border border-slate-700 w-8 h-8 rounded-full flex items-center justify-center z-20">
          <i className="bi bi-x-lg text-sm"></i>
        </button>

        <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-5 shrink-0 pr-8 relative z-10">
          <h2 className="text-xl font-bold text-white flex items-center">
            <i className="bi bi-folder2-open text-indigo-500 mr-2 drop-shadow-[0_0_8px_rgba(79,70,229,0.8)]"></i> Manage Projects
          </h2>
          <button onClick={onCreateWorkspace} disabled={atWorkspaceLimit} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-[0_0_10px_rgba(79,70,229,0.3)] transition-colors cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
            <i className="bi bi-plus-lg"></i> New Project
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar relative z-10">
          {workspaces.map(ws => {
            const isActive = ws.id === activeWorkspaceId;
            return (
              <div key={ws.id} className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${isActive ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.15)]' : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900'}`}>
                <div className="flex-1 min-w-0">
                  <div onClick={() => { onSelectWorkspace(ws.id); onClose(); }} className="cursor-pointer font-bold text-sm text-white truncate flex items-center gap-3">
                    <i className={`bi ${isActive ? 'bi-folder-fill text-indigo-400 drop-shadow-[0_0_5px_rgba(79,70,229,0.8)]' : 'bi-folder text-slate-500'}`}></i>
                    <div className="flex flex-col truncate">
                      <span className="truncate">{ws.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 truncate flex items-center gap-1 mt-0.5">
                        {ws.isPublic ? <i className="bi bi-globe-americas text-emerald-500"></i> : <i className="bi bi-lock-fill text-amber-500"></i>}
                        {ws.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => handleShareWorkspace(ws.id)} className="w-8 h-8 flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-400 rounded-lg hover:text-white hover:bg-blue-600 hover:border-blue-500 shadow-sm transition-colors" title="Share Project"><i className="bi bi-share text-xs"></i></button>
                  <button onClick={() => onOpenWorkspaceSettings(ws)} className="w-8 h-8 flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700 hover:border-slate-600 shadow-sm transition-colors" title="Workspace Settings"><i className="bi bi-gear text-xs"></i></button>
                  <button onClick={() => onDuplicateWorkspace(ws.id)} disabled={atWorkspaceLimit} className="w-8 h-8 flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-400 rounded-lg hover:text-white hover:bg-emerald-600 hover:border-emerald-500 shadow-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Duplicate Project"><i className="bi bi-files text-xs"></i></button>
                  <button onClick={() => onDeleteWorkspace(ws.id)} disabled={workspaces.length <= 1} className={`w-8 h-8 flex items-center justify-center bg-slate-800 border rounded-lg shadow-sm transition-colors ${workspaces.length <= 1 ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-600' : 'border-slate-700 text-slate-400 hover:text-white hover:bg-red-600 hover:border-red-500'}`} title="Delete Project"><i className="bi bi-trash text-xs"></i></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}