import React, { useState } from 'react';
import { useUI } from '../contexts/UIContext';
import RoleBadge from './RoleBadge';

export default function DashboardExplore({ exploreWorkspaces, handleToggleLike, handleClone, navigate, userProfile }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast, showConfirm } = useUI();

  const filtered = exploreWorkspaces.filter(ws => ws.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleShare = (e, ws) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/share?u=${ws.authorName}&owner=${ws.authorId}&ws=${ws.id}`;
    navigator.clipboard.writeText(shareUrl);
    showToast('Project link copied to clipboard! 🔗', 'success');
  };

  return (
    <div className="animate-fade-in flex flex-col h-full text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b border-slate-800/50 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2 tracking-tight">Explore Works</h1>
          <p className="text-slate-400 font-medium text-sm">Discover, like, and clone public designs from the community.</p>
        </div>
        <div className="relative w-full md:w-80 shrink-0 group">
          <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"></i>
          <input 
            type="text" placeholder="Search amazing works..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-full pl-11 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 mt-12">
          <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 mb-6 shadow-inner">
            <i className="bi bi-compass text-4xl text-slate-600"></i>
          </div>
          <p className="font-bold text-slate-300 text-lg">No creative works found.</p>
          <p className="text-sm mt-2">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(ws => (
            <div 
              key={ws.id} 
              onClick={() => handleClone(ws)} 
              className="group bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-5 hover:bg-slate-800/60 hover:border-indigo-500/50 hover:shadow-[0_10px_40px_rgba(79,70,229,0.15)] transition-all duration-300 cursor-pointer flex flex-col relative overflow-hidden"
            >
              
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                   <div className="relative shrink-0">
                     {ws.authorPhoto ? (
                       <img src={ws.authorPhoto} className="w-10 h-10 rounded-full border-2 border-slate-700 object-cover shadow-md group-hover:border-indigo-500/50 transition-colors" alt="Author" />
                     ) : (
                       <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border-2 border-slate-700 group-hover:border-indigo-500/50 transition-colors">
                         <i className="bi bi-person-fill text-lg"></i>
                       </div>
                     )}
                   </div>
                   
                  <div className="flex flex-col justify-center gap-0.5 min-w-0">
                    <div className="group-hover:text-indigo-300 transition-colors truncate">
                      {/* ✨ FIX 1: Accurately mapping author data instead of current user data! */}
                      <RoleBadge role={ws.authorRole} username={ws.authorName} prefix="@" />
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono tracking-wider">{new Date(ws.updatedAt || ws.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex-1 flex flex-col justify-center mb-6 px-1">
                {/* ✨ FIX 2: Softened typography from extrabold/text-lg to semibold/text-base */}
                <h3 className="font-semibold text-white text-base leading-snug mb-3 line-clamp-2 transition-colors">{ws.name}</h3>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold tracking-wide">
                  <span className="flex items-center gap-1.5"><i className="bi bi-diagram-3 text-indigo-400"></i> {ws.allowDomView ? 'DOM Exposed' : 'Layout'}</span>
                  <span className="flex items-center gap-1.5"><i className="bi bi-code-slash text-emerald-400"></i> {ws.allowCodeView ? 'Code Exposed' : 'Canvas'}</span>
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between border-t border-slate-800/60 pt-4 mt-auto">
                <button 
                  onClick={(e) => handleToggleLike(e, ws.id, ws.authorId, ws.isLikedByMe)} 
                  className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${ws.isLikedByMe ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.1)]' : 'bg-slate-950/50 border border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <i className={`bi ${ws.isLikedByMe ? 'bi-heart-fill drop-shadow-[0_0_5px_rgba(244,114,182,0.8)]' : 'bi-heart'}`}></i> {ws.likeCount}
                </button>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handleShare(e, ws)} 
                    className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-slate-950/50 border border-slate-700/50 text-slate-400 hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all shadow-sm"
                    title="Copy Share Link"
                  >
                    <i className="bi bi-link-45deg text-sm"></i>
                  </button>
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <i className="bi bi-arrow-right-short text-lg"></i>
                  </div>
                </div>
              </div>

              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-bl-full pointer-events-none -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-110"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}