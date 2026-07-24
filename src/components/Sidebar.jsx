import React, { useState } from 'react';

export default function Sidebar({ isCollapsed, setIsCollapsed, layoutItems, onAddItem, onOpenWorkspaces }) {
  const [isContainersOpen, setIsContainersOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isElementsOpen, setIsElementsOpen] = useState(false);
  const [isFormsOpen, setIsFormsOpen] = useState(false); 
  const [isListsOpen, setIsListsOpen] = useState(false); 

  const containerElements = ['div', 'section', 'article', 'header', 'aside', 'footer', 'nav'];
  const mediaElements = ['img', 'video', 'iframe', 'canvas', 'svg'];
  const textElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'p', 'span', 'a', 'b', 'strong', 'i', 'em', 'blockquote', 'code', 'pre'];
  const formElements = ['form', 'input', 'textarea', 'select', 'button', 'label'];
  const listElements = ['ul', 'ol', 'li', 'table', 'tr', 'td', 'th'];

  const renderSection = (title, icon, isOpen, toggleOpen, elements, elementClass) => (
    <div>
      <button onClick={() => { if(isCollapsed) setIsCollapsed(false); toggleOpen(!isOpen); }} className="w-full flex items-center justify-between px-3 py-2 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white cursor-pointer text-sm transition-colors">
        <div className="flex items-center gap-3"><i className={`bi ${icon} text-base text-slate-400`}></i>{!isCollapsed && <span>{title}</span>}</div>
        {!isCollapsed && <i className={`bi bi-chevron-down text-xs text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>}
      </button>
      {isOpen && !isCollapsed && (
        <div className="mt-1 ml-4 pl-2 border-l border-slate-800 flex flex-wrap gap-2 overflow-y-auto p-1 max-h-40 custom-scrollbar">
          {elements.map(tag => (
            <button key={tag} onClick={() => onAddItem(tag)} className={elementClass}>
              &lt;{tag}&gt;
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <aside className={`fixed top-0 left-0 z-40 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.3)]`}>
      <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute top-5 -right-3 z-50 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg cursor-pointer transition-colors">
        <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'} text-xs font-bold`}></i>
      </button>

      <div className="h-16 flex items-center px-4 border-b border-slate-800 gap-3 overflow-hidden shrink-0">
        <div className="bg-indigo-600 text-white p-2 rounded-lg flex items-center justify-center min-w-[2.25rem] shadow-[0_0_15px_rgba(79,70,229,0.4)]"><i className="bi bi-lightning-charge-fill"></i></div>
        {!isCollapsed && <span className="font-extrabold text-white text-base tracking-tight drop-shadow-md">EmTeeCanvas</span>}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* Dynamic Element Sections matching dark neon theme */}
        {renderSection("Containers", "bi-bounding-box", isContainersOpen, setIsContainersOpen, containerElements, "flex-1 min-w-[70px] px-2 py-2 font-mono font-bold text-center text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/20 cursor-pointer transition-colors shadow-sm")}
        {renderSection("Forms & Inputs", "bi-ui-radios", isFormsOpen, setIsFormsOpen, formElements, "flex-1 min-w-[60px] px-2 py-1.5 font-mono font-bold text-center text-xs text-pink-400 bg-pink-500/10 border border-pink-500/30 rounded-lg hover:bg-pink-500/20 cursor-pointer transition-colors shadow-sm")}
        {renderSection("Media & Embeds", "bi-image", isMediaOpen, setIsMediaOpen, mediaElements, "flex-1 min-w-[60px] px-2 py-1.5 font-mono font-bold text-center text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 cursor-pointer transition-colors shadow-sm")}
        {renderSection("Lists & Tables", "bi-list-ul", isListsOpen, setIsListsOpen, listElements, "flex-1 min-w-[40px] px-2 py-1 font-mono text-center text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 cursor-pointer transition-colors shadow-sm")}
        {renderSection("Text Nodes", "bi-code", isElementsOpen, setIsElementsOpen, textElements, "px-2 py-1 flex-1 min-w-[40px] text-center font-mono text-[11px] font-bold text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:border-indigo-500/50 hover:text-indigo-400 cursor-pointer transition-colors shadow-sm")}
      </nav>

      <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-900/50">
        <button onClick={onOpenWorkspaces} className="w-full flex items-center gap-3 px-3 py-2.5 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition-all cursor-pointer font-bold text-xs shadow-sm">
          <i className="bi bi-folder2-open text-base"></i>
          {!isCollapsed && <span>My Projects</span>}
        </button>
      </div>
    </aside>
  );
}