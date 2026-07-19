import React, { useState } from 'react';

export default function Sidebar({ isCollapsed, setIsCollapsed, layoutItems, onAddItem, onOpenWorkspaces }) {
  const [isComponentsOpen, setIsComponentsOpen] = useState(false);
  const [isContainersOpen, setIsContainersOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isElementsOpen, setIsElementsOpen] = useState(false);

  const majorComponents = [
    { type: 'navbar', icon: 'bi-segmented-nav', label: 'Navbar Layout' },
    { type: 'sidebar', icon: 'bi-layout-sidebar-inset', label: 'Sidebar Panel' },
    { type: 'footer', icon: 'bi-layout-text-window-reverse', label: 'Footer Base' },
  ];
  
  const containerElements = ['div', 'section'];
  const interactiveElements = ['a', 'img', 'button'];
  const textElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'p', 'i', 'b', 'em', 'small', 'strong', 'sub', 'sup', 'ins', 'del', 'mark'];

  return (
    <aside className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col`}>
      <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute top-5 -right-3 z-50 bg-white border border-gray-200 text-gray-500 rounded-full w-6 h-6 flex items-center justify-center shadow-xs hover:bg-gray-50 cursor-pointer">
        <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'} text-xs`}></i>
      </button>

      <div className="h-16 flex items-center px-4 border-b border-gray-200 gap-3 overflow-hidden shrink-0">
        <div className="bg-indigo-600 text-white p-2 rounded-lg flex items-center justify-center min-w-[2.25rem]"><i className="bi bi-lightning-charge-fill"></i></div>
        {!isCollapsed && <span className="font-bold text-base text-gray-800 tracking-tight">EmTeeCanvas</span>}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto custom-scrollbar">
        {/* Components */}
        <div>
          <button onClick={() => { if(isCollapsed) setIsCollapsed(false); setIsComponentsOpen(!isComponentsOpen); }} className="w-full flex items-center justify-between px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
            <div className="flex items-center gap-3"><i className="bi bi-box-seam text-base"></i>{!isCollapsed && <span>Components</span>}</div>
            {!isCollapsed && <i className={`bi bi-chevron-down text-xs transition-transform ${isComponentsOpen ? 'rotate-180' : ''}`}></i>}
          </button>
          {isComponentsOpen && !isCollapsed && (
            <div className="mt-1 ml-4 pl-2 border-l border-gray-100 space-y-1">
              {majorComponents.map(item => {
                const isAlreadyAdded = layoutItems.some(layoutItem => layoutItem.type === item.type);
                return (
                  <div key={item.type} className="flex items-center justify-between p-1 hover:bg-gray-50/50 rounded-md">
                    <span className={`text-xs flex items-center gap-2 ${isAlreadyAdded ? 'text-gray-400' : 'text-gray-500'}`}><i className={`bi ${item.icon}`}></i>{item.label}</span>
                    <button onClick={() => !isAlreadyAdded && onAddItem(item.type)} disabled={isAlreadyAdded} className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${isAlreadyAdded ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 cursor-pointer'}`}>
                      {isAlreadyAdded ? 'Added' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Containers */}
        <div>
          <button onClick={() => { if(isCollapsed) setIsCollapsed(false); setIsContainersOpen(!isContainersOpen); }} className="w-full flex items-center justify-between px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
            <div className="flex items-center gap-3"><i className="bi bi-bounding-box text-base"></i>{!isCollapsed && <span>Containers</span>}</div>
            {!isCollapsed && <i className={`bi bi-chevron-down text-xs transition-transform ${isContainersOpen ? 'rotate-180' : ''}`}></i>}
          </button>
          {isContainersOpen && !isCollapsed && (
            <div className="mt-1 ml-4 pl-2 border-l border-gray-100 flex gap-2 overflow-y-auto p-1">
              {containerElements.map(tag => (
                <button key={tag} onClick={() => onAddItem(tag)} className="flex-1 px-2 py-2 font-mono font-bold text-center text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md hover:bg-indigo-100 cursor-pointer shadow-xs">
                  &lt;{tag}&gt; Block
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Media */}
        <div>
          <button onClick={() => { if(isCollapsed) setIsCollapsed(false); setIsMediaOpen(!isMediaOpen); }} className="w-full flex items-center justify-between px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
            <div className="flex items-center gap-3"><i className="bi bi-image text-base"></i>{!isCollapsed && <span>Media & Links</span>}</div>
            {!isCollapsed && <i className={`bi bi-chevron-down text-xs transition-transform ${isMediaOpen ? 'rotate-180' : ''}`}></i>}
          </button>
          {isMediaOpen && !isCollapsed && (
            <div className="mt-1 ml-4 pl-2 border-l border-gray-100 flex gap-2 overflow-y-auto p-1">
              {interactiveElements.map(tag => (
                <button key={tag} onClick={() => onAddItem(tag)} className="flex-1 px-2 py-2 font-mono font-bold text-center text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md hover:bg-emerald-100 cursor-pointer shadow-xs">
                  &lt;{tag}&gt;
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Nodes */}
        <div>
          <button onClick={() => { if(isCollapsed) setIsCollapsed(false); setIsElementsOpen(!isElementsOpen); }} className="w-full flex items-center justify-between px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
            <div className="flex items-center gap-3"><i className="bi bi-code text-base"></i>{!isCollapsed && <span>Text Nodes</span>}</div>
            {!isCollapsed && <i className={`bi bi-chevron-down text-xs transition-transform ${isElementsOpen ? 'rotate-180' : ''}`}></i>}
          </button>
          {isElementsOpen && !isCollapsed && (
            <div className="mt-1 ml-4 pl-2 border-l border-gray-100 grid grid-cols-2 gap-1 max-h-40 overflow-y-auto p-1">
              {textElements.map(tag => (
                <button key={tag} onClick={() => onAddItem(tag)} className="px-2 py-1 text-left font-mono text-[11px] text-gray-600 bg-gray-50 border border-gray-100 rounded-md hover:border-indigo-300 hover:text-indigo-600 cursor-pointer transition-colors">
                  &lt;{tag}&gt; +
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ✨ NEW: Permanent Bottom Workspace Portal section */}
      <div className="p-3 border-t border-gray-100 shrink-0 bg-gray-50/50">
        <button 
          onClick={onOpenWorkspaces} 
          className="w-full flex items-center gap-3 px-3 py-2.5 text-indigo-600 bg-indigo-100 hover:bg-indigo-50 border border-indigo-100/50 rounded-xl transition-all cursor-pointer font-bold text-xs shadow-xs"
        >
          <i className="bi bi-folder2-open text-base"></i>
          {!isCollapsed && <span>My Projects</span>}
        </button>
      </div>
    </aside>
  );
}