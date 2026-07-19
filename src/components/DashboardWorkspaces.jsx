import React from 'react';

export default function DashboardWorkspaces({ workspaces, handleCreateProject, atWorkspaceLimit, setWorkspaceSettingsTarget, navigate, userProfile }) {
  return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">My Workspaces</h1>
        <button 
          onClick={() => handleCreateProject(null, 'New Component Project')} 
          disabled={atWorkspaceLimit}
          className={`px-4 py-2.5 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 ${atWorkspaceLimit ? 'bg-indigo-400 opacity-50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 cursor-pointer'}`}
          title={atWorkspaceLimit ? "Free plan limited to 3 workspaces" : ""}
        >
          <i className="bi bi-plus-lg"></i> New Empty Project
        </button>
      </div>

      {workspaces.length === 0 ? (
        <div className="flex-1 flex items-center justify-center animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 max-w-lg w-full text-center shadow-sm relative overflow-hidden">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><i className="bi bi-rocket-takeoff-fill text-4xl text-indigo-500"></i></div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-3">Welcome to EmTeeCanvas!</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed px-4">Start by creating a blank canvas or browse our templates.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => handleCreateProject(null, 'New Component Project')} disabled={atWorkspaceLimit} className={`px-6 py-3 text-white font-bold rounded-xl w-full sm:w-auto ${atWorkspaceLimit ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md cursor-pointer'}`}>Blank Project</button>
              <button onClick={() => navigate('/user/templates')} className="px-6 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl w-full sm:w-auto cursor-pointer hover:bg-slate-50">Browse Templates</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
          {workspaces.map(ws => (
            <div key={ws.id} onClick={() => navigate(`/builder?u=${userProfile?.username || 'user'}&ws=${ws.id}`)} className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-400 hover:shadow-xl transition-all cursor-pointer flex flex-col h-48 relative overflow-hidden">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 z-20">
                <button onClick={(e) => { e.stopPropagation(); setWorkspaceSettingsTarget(ws); }} className="w-8 h-8 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-full flex items-center justify-center shadow-sm"><i className="bi bi-gear-fill"></i></button>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-indigo-500 rounded-xl flex items-center justify-center mb-auto"><i className="bi bi-folder-fill text-lg"></i></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                   <h3 className="font-bold text-slate-800 text-base truncate">{ws.name}</h3>
                   {ws.isPublic ? <i className="bi bi-globe-americas text-green-500 text-[10px]" title="Public Explorer Node"></i> : <i className="bi bi-lock-fill text-amber-500 text-[10px]" title="Private"></i>}
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate mb-3">ID: {ws.id}</div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100 pt-3">
                   <span>Updated</span><span>{new Date(ws.updatedAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}