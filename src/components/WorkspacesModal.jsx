import React from 'react';

export default function WorkspacesModal({ 
  isOpen, onClose, workspaces, activeWorkspaceId, currentUserUid, currentUsername, userRole, // ✨ NEW
  onCreateWorkspace, onSelectWorkspace, onDeleteWorkspace, onOpenWorkspaceSettings, onDuplicateWorkspace 
}) {
  if (!isOpen) return null;
  const atWorkspaceLimit = userRole === 'normal' && workspaces.length >= 1;

  const handleShareWorkspace = (id) => {
    // Generates a fully qualified URL path with user context and owner signature
    const shareUrl = `${window.location.origin}/builder?u=${currentUsername}&owner=${currentUserUid}&ws=${id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Project workspace deep-link copied to clipboard! 🔗\n\nEnsure Public Access is toggled ON in your Workspace Settings to allow other accounts to view it.');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative flex flex-col max-h-[80vh]">
        <button onClick={onClose} className="cursor-pointer absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded-full flex items-center justify-center z-10">
          <i className="bi bi-x-lg text-base"></i>
        </button>

        <div className="flex items-center justify-between border-b pb-4 mb-4 shrink-0 pr-8">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <i className="bi bi-folder2-open text-indigo-600 mr-2"></i> Manage Projects
          </h2>
          <button onClick={onCreateWorkspace} disabled={atWorkspaceLimit} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1 shrink-0">
            <i className="bi bi-plus-lg"></i> New Project
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {workspaces.map(ws => {
            const isActive = ws.id === activeWorkspaceId;
            return (
              <div key={ws.id} className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${isActive ? 'bg-indigo-50/60 border-indigo-200 ring-1 ring-indigo-200' : 'bg-gray-50 border-gray-100 hover:border-gray-300'}`}>
                <div className="flex-1 min-w-0">
                  <div onClick={() => { onSelectWorkspace(ws.id); onClose(); }} className="cursor-pointer font-bold text-sm text-gray-800 truncate flex items-center gap-2">
                    <i className={`bi ${isActive ? 'bi-folder-fill text-indigo-500' : 'bi-folder text-gray-400'}`}></i>
                    <div className="flex flex-col truncate">
                      <span className="truncate">{ws.name}</span>
                      <span className="text-[9px] font-mono text-gray-400 truncate flex items-center gap-1">
                        {ws.isPublic ? <i className="bi bi-globe-americas text-green-500"></i> : <i className="bi bi-lock-fill text-amber-500"></i>}
                        {ws.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Updated Actions Board */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleShareWorkspace(ws.id)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 text-gray-500 rounded-md hover:text-indigo-600 hover:border-indigo-100 shadow-xs transition-colors" title="Share Project"><i className="bi bi-share text-xs"></i></button>
                  <button onClick={() => onOpenWorkspaceSettings(ws)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 text-gray-500 rounded-md hover:text-slate-600 hover:border-slate-300 shadow-xs transition-colors" title="Workspace Settings"><i className="bi bi-gear text-xs"></i></button>
                  <button onClick={() => onDuplicateWorkspace(ws.id)} disabled={atWorkspaceLimit} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 text-gray-500 rounded-md hover:text-emerald-600 hover:border-emerald-100 shadow-xs transition-colors" title="Duplicate Project"><i className="bi bi-files text-xs"></i></button>
                  <button onClick={() => onDeleteWorkspace(ws.id)} disabled={workspaces.length <= 1} className={`w-7 h-7 flex items-center justify-center bg-white border rounded-md shadow-xs transition-colors ${workspaces.length <= 1 ? 'opacity-40 cursor-not-allowed border-gray-100 text-gray-300' : 'border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-100'}`} title="Delete Project"><i className="bi bi-trash text-xs"></i></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}