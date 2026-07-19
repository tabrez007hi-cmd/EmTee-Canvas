import React, { useState } from 'react';

export default function DashboardExplore({ exploreWorkspaces, handleToggleLike, handleClone, navigate }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = exploreWorkspaces.filter(ws => ws.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2">Explore Community Works</h1>
          <p className="text-slate-500">Discover, like, and clone public workspaces from creators.</p>
        </div>
        <div className="relative w-full md:w-72 shrink-0">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" placeholder="Search workspace titles..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 shadow-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 mt-12">
          <i className="bi bi-compass text-5xl mb-4 block opacity-40"></i>
          <p className="font-bold text-slate-500 text-lg">No public workspaces found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(ws => (
            <div key={ws.id} onClick={() => handleClone(ws)} className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-400 hover:shadow-xl transition-all cursor-pointer flex flex-col relative overflow-hidden">
              
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex flex-col gap-1.5">
                   <div className="flex items-center gap-2">
                     {ws.authorPhoto ? <img src={ws.authorPhoto} className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-sm" alt="Author" /> : <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200"><i className="bi bi-person-fill"></i></div>}
                     <div className="text-xs font-bold text-slate-700 truncate max-w-[100px]">@{ws.authorName}</div>
                   </div>
                   {/* ✨ Role Badges */}
                   {ws.authorRole === 'developer' && <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[9px] px-1.5 py-0.5 rounded font-bold w-max">DEV</span>}
                   {ws.authorRole === 'pro' && <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[9px] px-1.5 py-0.5 rounded font-bold w-max">PRO</span>}
                   {ws.authorRole === 'normal' && <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[9px] px-1.5 py-0.5 rounded font-bold w-max">USER</span>}
                </div>
                
                <button onClick={(e) => handleToggleLike(e, ws.id, ws.authorId, ws.isLikedByMe)} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all shadow-sm ${ws.isLikedByMe ? 'bg-pink-50 text-pink-600 border border-pink-200' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  <i className={`bi ${ws.isLikedByMe ? 'bi-heart-fill' : 'bi-heart'} ${ws.isLikedByMe ? 'animate-bounce' : ''}`}></i> {ws.likeCount}
                </button>
              </div>

              <div className="relative z-10 bg-slate-50 rounded-xl p-3 border border-slate-100 flex-1 flex flex-col justify-center">
                <h3 className="font-bold text-slate-800 text-sm mb-1 truncate group-hover:text-indigo-600 transition-colors text-center">{ws.name}</h3>
                <div className="text-[10px] text-slate-400 text-center uppercase tracking-wider font-bold mt-2"><i className="bi bi-diagram-3"></i> Open Preview</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}