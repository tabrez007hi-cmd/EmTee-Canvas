import React, { useState, useMemo } from 'react';

export default function Sidebar({ isCollapsed, setIsCollapsed, layoutItems, onAddItem, onOpenWorkspaces }) {
  const [isContainersOpen, setIsContainersOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isElementsOpen, setIsElementsOpen] = useState(false);
  const [isFormsOpen, setIsFormsOpen] = useState(false); 
  const [isListsOpen, setIsListsOpen] = useState(false); 
  const [isLegacyOpen, setIsLegacyOpen] = useState(false); 

  // ✨ NEW: Search State
  const [tagSearch, setTagSearch] = useState('');

  const containerElements = ['div', 'section', 'article', 'header', 'aside', 'footer', 'nav', 'main', 'details', 'summary', 'dialog', 'figure', 'figcaption', 'hgroup'];
  const textElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'b', 'strong', 'i', 'em', 'u', 's', 'small', 'big', 'mark', 'del', 'ins', 'sub', 'sup', 'code', 'pre', 'kbd', 'samp', 'var', 'blockquote', 'q', 'cite', 'abbr', 'address', 'bdi', 'bdo', 'dfn', 'ruby', 'rt', 'rp', 'br', 'wbr'];
  const formElements = ['form', 'input', 'textarea', 'select', 'option', 'optgroup', 'button', 'label', 'datalist', 'output', 'meter', 'progress', 'fieldset', 'legend'];
  const mediaElements = ['img', 'video', 'audio', 'iframe', 'canvas', 'svg', 'object', 'embed', 'source', 'track', 'area', 'map'];
  const listElements = ['ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'col', 'colgroup', 'caption'];
  const legacyElements = ['acronym', 'applet', 'basefont', 'center', 'dir', 'font', 'frame', 'frameset', 'isindex', 'marquee', 'nobr', 'noembed', 'strike', 'tt', 'xmp', 'keygen', 'bgsound', 'spacer'];

  const handleSectionClick = (isOpen, toggleOpen) => {
    if (isCollapsed) setIsCollapsed(false);
    toggleOpen(!isOpen);
  };

  const renderSection = (title, icon, isOpen, toggleOpen, elements, themeClass, iconColor) => {
    // Filter tags by search term
    const filteredElements = elements.filter(tag => tag.toLowerCase().includes(tagSearch.toLowerCase()));
    
    if (filteredElements.length === 0) return null; // Hide section if no matches
    
    // Auto-open if searching
    const actuallyOpen = tagSearch ? true : isOpen;

    return (
      <div className="mb-2">
        {/* ✨ FIX: Completely removed the background bleed on the button in collapsed mode */}
        <button 
          onClick={() => handleSectionClick(actuallyOpen, toggleOpen)} 
          className={`w-full flex items-center ${isCollapsed ? 'justify-center p-0 mb-3' : 'justify-between px-3 py-3'} rounded-xl transition-all duration-200 cursor-pointer ${actuallyOpen && !isCollapsed ? 'bg-slate-800/80 shadow-inner border border-slate-700/50' : 'bg-transparent hover:bg-slate-800/40 border border-transparent'}`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`flex items-center justify-center ${isCollapsed ? 'w-12 h-12 rounded-2xl' : 'w-8 h-8 rounded-lg'} ${actuallyOpen ? themeClass.iconBg : 'bg-slate-800/50 text-slate-400'} ${isCollapsed && !actuallyOpen ? 'hover:bg-slate-800 hover:text-white' : ''} transition-colors`}>
              <i className={`bi ${icon} ${isCollapsed ? 'text-lg' : 'text-[15px]'} ${actuallyOpen ? iconColor : ''}`}></i>
            </div>
            {!isCollapsed && <span className={`text-sm font-bold tracking-wide ${actuallyOpen ? 'text-white' : 'text-slate-300'}`}>{title}</span>}
          </div>
          {!isCollapsed && (
            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-300 ${actuallyOpen ? 'rotate-180 bg-slate-700 text-white' : 'text-slate-500'}`}>
              <i className="bi bi-chevron-down text-[10px]"></i>
            </div>
          )}
        </button>
        
        {actuallyOpen && !isCollapsed && (
          <div className="mt-2 mb-4 px-2">
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {filteredElements.map(tag => (
                <button 
                  key={tag} 
                  onClick={() => onAddItem(tag)} 
                  className={`flex items-center justify-center py-2 px-1 font-mono font-bold text-[11px] rounded-lg border transition-all cursor-pointer shadow-sm active:scale-95 ${themeClass.btn}`}
                  title={`Insert <${tag}> tag`}
                >
                  &lt;{tag}&gt;
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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

      <nav className="flex-1 py-5 overflow-y-auto overflow-x-hidden custom-scrollbar">
        
        {/* ✨ NEW: Search Bar Injection */}
        <div className="px-3 mb-4">
          {!isCollapsed ? (
            <div className="relative">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
              <input 
                type="text" 
                placeholder="Search tags..." 
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
              />
              {tagSearch && (
                 <button onClick={() => setTagSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"><i className="bi bi-x-circle-fill text-[10px]"></i></button>
              )}
            </div>
          ) : (
            <button onClick={() => setIsCollapsed(false)} className="w-12 h-12 mx-auto bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-colors cursor-pointer">
              <i className="bi bi-search"></i>
            </button>
          )}
        </div>

        <div className="px-3">
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

          {renderSection("Legacy / Obsolete", "bi-exclamation-triangle-fill", isLegacyOpen, setIsLegacyOpen, legacyElements, 
            { iconBg: 'bg-red-500/20', btn: 'text-red-300 bg-red-500/10 border-red-500/30 hover:bg-red-500/20 hover:border-red-400 hover:text-red-200 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]' }, 
            'text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]'
          )}
        </div>
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