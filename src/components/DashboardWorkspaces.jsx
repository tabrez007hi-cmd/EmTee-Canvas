import React from 'react';

export default function DashboardWorkspaces({ workspaces, handleCreateProject, atWorkspaceLimit, setWorkspaceSettingsTarget, navigate, userProfile }) {
  return (
    <div className="animate-fade-in flex flex-col h-full text-slate-200">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">My Workspaces</h1>
        <button 
          onClick={() => handleCreateProject(null, 'New Component Project')} 
          disabled={atWorkspaceLimit}
          className={`px-4 py-2.5 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center gap-2 ${atWorkspaceLimit ? 'bg-indigo-600/50 opacity-50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 cursor-pointer hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]'}`}
          title={atWorkspaceLimit ? "Free plan limited to 3 workspaces" : ""}
        >
          <i className="bi bi-plus-lg"></i> New Empty Project
        </button>
      </div>

      {workspaces.length === 0 ? (
        <div className="flex-1 flex items-center justify-center animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 max-w-lg w-full text-center shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none"></div>
            <div className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><i className="bi bi-rocket-takeoff-fill text-4xl text-indigo-500 drop-shadow-[0_0_10px_rgba(79,70,229,0.8)]"></i></div>
            <h2 className="text-2xl font-extrabold text-white mb-3 relative z-10">Welcome to EmTeeCanvas!</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed px-4 relative z-10">Start by creating a blank canvas or browse our templates.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
              <button onClick={() => handleCreateProject(null, 'New Component Project')} disabled={atWorkspaceLimit} className={`px-6 py-3 text-white font-bold rounded-xl w-full sm:w-auto ${atWorkspaceLimit ? 'bg-indigo-600/50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)] cursor-pointer'}`}>Blank Project</button>
              <button onClick={() => navigate('/user/templates')} className="px-6 py-3 bg-slate-950 border border-slate-700 text-slate-300 font-bold rounded-xl w-full sm:w-auto cursor-pointer hover:bg-slate-800 transition-colors">Browse Templates</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
          {workspaces.map(ws => (
            <div key={ws.id} onClick={() => navigate(`/builder?u=${userProfile?.username || 'user'}&ws=${ws.id}`)} className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(79,70,229,0.15)] transition-all cursor-pointer flex flex-col h-48 relative overflow-hidden">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 z-20 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); setWorkspaceSettingsTarget(ws); }} className="w-8 h-8 bg-slate-950 border border-slate-700 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-colors"><i className="bi bi-gear-fill"></i></button>
              </div>
              <div className="w-10 h-10 bg-slate-950 border border-slate-800 text-indigo-500 rounded-xl flex items-center justify-center mb-auto group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors"><i className="bi bi-folder-fill text-lg"></i></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                   <h3 className="font-bold text-white text-base truncate group-hover:text-indigo-300 transition-colors">{ws.name}</h3>
                   {ws.isPublic ? <i className="bi bi-globe-americas text-emerald-400 text-[10px]" title="Public Explorer Node"></i> : <i className="bi bi-lock-fill text-amber-500 text-[10px]" title="Private"></i>}
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate mb-3">ID: {ws.id}</div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium border-t border-slate-800 pt-3">
                   <span>Updated</span><span className="text-slate-300">{new Date(ws.updatedAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}