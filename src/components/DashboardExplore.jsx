import React, { useState } from 'react';

export default function DashboardExplore({ exploreWorkspaces, handleToggleLike, handleClone, navigate }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = exploreWorkspaces.filter(ws => ws.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="animate-fade-in flex flex-col h-full text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Explore Community Works</h1>
          <p className="text-slate-400">Discover, like, and clone public workspaces from creators.</p>
        </div>
        <div className="relative w-full md:w-72 shrink-0">
          <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
          <input 
            type="text" placeholder="Search workspace titles..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 shadow-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 mt-12">
          <i className="bi bi-compass text-5xl mb-4 block opacity-30"></i>
          <p className="font-bold text-slate-400 text-lg">No public workspaces found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(ws => (
            <div key={ws.id} onClick={() => handleClone(ws)} className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(79,70,229,0.15)] transition-all cursor-pointer flex flex-col relative overflow-hidden">
              
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex flex-col gap-1.5">
                   <div className="flex items-center gap-2">
                     {ws.authorPhoto ? <img src={ws.authorPhoto} className="w-8 h-8 rounded-full border border-slate-700 object-cover shadow-sm" alt="Author" /> : <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700"><i className="bi bi-person-fill"></i></div>}
                     <div className="text-xs font-bold text-slate-300 truncate max-w-[100px]">@{ws.authorName}</div>
                   </div>
                   {ws.authorRole === 'developer' && <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold w-max">DEV</span>}
                   {ws.authorRole === 'pro' && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold w-max">PRO</span>}
                   {ws.authorRole === 'normal' && <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[9px] px-1.5 py-0.5 rounded font-bold w-max">USER</span>}
                </div>
                
                <button onClick={(e) => handleToggleLike(e, ws.id, ws.authorId, ws.isLikedByMe)} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all shadow-sm ${ws.isLikedByMe ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30' : 'bg-slate-950 border border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
                  <i className={`bi ${ws.isLikedByMe ? 'bi-heart-fill drop-shadow-[0_0_5px_rgba(244,114,182,0.8)]' : 'bi-heart'} ${ws.isLikedByMe ? 'animate-bounce' : ''}`}></i> {ws.likeCount}
                </button>
              </div>

              <div className="relative z-10 bg-slate-950 rounded-xl p-3 border border-slate-800 flex-1 flex flex-col justify-center transition-colors group-hover:border-indigo-500/30">
                <h3 className="font-bold text-slate-200 text-sm mb-1 truncate group-hover:text-indigo-400 transition-colors text-center">{ws.name}</h3>
                <div className="text-[10px] text-slate-500 text-center uppercase tracking-wider font-bold mt-2"><i className="bi bi-diagram-3 text-indigo-500/50"></i> Open Preview</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}