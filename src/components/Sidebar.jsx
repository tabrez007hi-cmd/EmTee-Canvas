import React, { useState } from 'react';

import RoleBadge from './RoleBadge';

export default function Sidebar({ isCollapsed, setIsCollapsed, layoutItems, onAddItem, onOpenWorkspaces }) {
  // Section toggle states[cite: 26]
  const [isContainersOpen, setIsContainersOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isElementsOpen, setIsElementsOpen] = useState(false);
  const [isFormsOpen, setIsFormsOpen] = useState(false); 
  const [isListsOpen, setIsListsOpen] = useState(false); 

  // Element arrays[cite: 26]
  const containerElements = ['div', 'section', 'article', 'header', 'aside', 'footer', 'nav'];
  const mediaElements = ['img', 'video', 'iframe', 'canvas', 'svg'];
  const textElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'p', 'span', 'a', 'b', 'strong', 'i', 'em', 'blockquote', 'code', 'pre'];
  const formElements = ['form', 'input', 'textarea', 'select', 'button', 'label'];
  const listElements = ['ul', 'ol', 'li', 'table', 'tr', 'td', 'th'];

  const handleSectionClick = (isOpen, toggleOpen) => {
    if (isCollapsed) setIsCollapsed(false);
    toggleOpen(!isOpen);
  };

  const renderSection = (title, icon, isOpen, toggleOpen, elements, themeClass, iconColor) => (
    <div className="mb-2">
      <button 
        onClick={() => handleSectionClick(isOpen, toggleOpen)} 
        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer ${isOpen ? 'bg-slate-800/80 shadow-inner border border-slate-700/50' : 'bg-transparent hover:bg-slate-800/40 border border-transparent'}`}
      >
        <div className="flex items-center gap-3.5">
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isOpen ? themeClass.iconBg : 'bg-slate-800/50 text-slate-400'} transition-colors`}>
            <i className={`bi ${icon} text-[15px] ${isOpen ? iconColor : ''}`}></i>
          </div>
          {!isCollapsed && <span className={`text-sm font-bold tracking-wide ${isOpen ? 'text-white' : 'text-slate-300'}`}>{title}</span>}
        </div>
        {!isCollapsed && (
          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180 bg-slate-700 text-white' : 'text-slate-500'}`}>
            <i className="bi bi-chevron-down text-[10px]"></i>
          </div>
        )}
      </button>
      
      {isOpen && !isCollapsed && (
        <div className="mt-2 mb-4 px-2">
          {/* ✨ UX FIX: Using a clean grid instead of flex-wrap for perfectly aligned tags */}
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {elements.map(tag => (
              <button 
                key={tag} 
                onClick={() => onAddItem(tag)} 
                className={`flex items-center justify-center py-2 px-1 font-mono font-bold text-[11px] rounded-lg border transition-all cursor-pointer shadow-sm active:scale-95 ${themeClass.btn}`}
              >
                &lt;{tag}&gt;
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <aside className={`fixed top-0 left-0 z-40 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 ${isCollapsed ? 'w-[72px]' : 'w-72'} flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.4)]`}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)} 
        className="absolute top-6 -right-3.5 z-50 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-indigo-500 rounded-full w-7 h-7 flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-pointer transition-all"
      >
        <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'} text-xs font-bold`}></i>
      </button>

      <div className={`h-16 flex items-center border-b border-slate-800 shrink-0 transition-all ${isCollapsed ? 'justify-center px-0' : 'px-6 gap-3'}`}>
        <div className="bg-indigo-600 text-white w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(79,70,229,0.5)]">
          <i className="bi bi-lightning-charge-fill text-lg"></i>
        </div>
        {!isCollapsed && <span className="font-extrabold text-white text-lg tracking-tight drop-shadow-md truncate">EmTeeCanvas</span>}
      </div>

      <nav className="flex-1 px-3 py-5 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {!isCollapsed && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Structure Elements</div>}
        
        {/* Dynamic Element Sections matching dark neon theme with upgraded CSS classes */}
        {renderSection("Containers", "bi-bounding-box", isContainersOpen, setIsContainersOpen, containerElements, 
          { iconBg: 'bg-indigo-500/20', btn: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-400 hover:text-indigo-200 hover:shadow-[0_0_10px_rgba(79,70,229,0.2)]' }, 
          'text-indigo-400 drop-shadow-[0_0_5px_rgba(79,70,229,0.8)]'
        )}
        
        {renderSection("Forms & Inputs", "bi-ui-radios", isFormsOpen, setIsFormsOpen, formElements, 
          { iconBg: 'bg-pink-500/20', btn: 'text-pink-300 bg-pink-500/10 border-pink-500/30 hover:bg-pink-500/20 hover:border-pink-400 hover:text-pink-200 hover:shadow-[0_0_10px_rgba(236,72,153,0.2)]' }, 
          'text-pink-400 drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]'
        )}
        
        {renderSection("Media & Embeds", "bi-image", isMediaOpen, setIsMediaOpen, mediaElements, 
          { iconBg: 'bg-emerald-500/20', btn: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400 hover:text-emerald-200 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]' }, 
          'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]'
        )}
        
        {renderSection("Lists & Tables", "bi-list-ul", isListsOpen, setIsListsOpen, listElements, 
          { iconBg: 'bg-amber-500/20', btn: 'text-amber-300 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400 hover:text-amber-200 hover:shadow-[0_0_10px_rgba(251,191,36,0.2)]' }, 
          'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]'
        )}
        
        {renderSection("Text Nodes", "bi-code", isElementsOpen, setIsElementsOpen, textElements, 
          { iconBg: 'bg-slate-700/50', btn: 'text-slate-300 bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white hover:border-slate-500 shadow-sm' }, 
          'text-slate-300'
        )}
      </nav>

      <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-950/50">
        <button 
          onClick={onOpenWorkspaces} 
          className={`flex items-center justify-center gap-3 w-full py-3 rounded-xl transition-all cursor-pointer font-bold text-sm shadow-sm ${isCollapsed ? 'bg-slate-800 text-slate-300 hover:text-white hover:bg-indigo-600 px-0' : 'text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-3'}`}
          title="My Projects"
        >
          <i className="bi bi-folder2-open text-[16px]"></i>
          {!isCollapsed && <span>My Projects</span>}
        </button>
      </div>
    </aside>
  );
}