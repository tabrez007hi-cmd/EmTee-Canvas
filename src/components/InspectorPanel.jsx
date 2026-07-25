import React, { useState, useEffect } from 'react';

// --- CSS Translation Engines ---
const objToCss = (obj) => {
  if (!obj) return '';
  return Object.entries(obj)
    .filter(([_, val]) => val !== '' && val != null)
    .map(([key, val]) => {
      const cssKey = key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
      return `${cssKey}: ${val};`;
    }).join('\n');
};

const cssToObj = (cssString) => {
  const obj = {};
  cssString.split(';').forEach(rule => {
    const [key, ...valParts] = rule.split(':');
    if (key && valParts.length > 0) {
      const camelKey = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
      obj[camelKey] = valParts.join(':').trim();
    }
  });
  return obj;
};

// --- UI Components (Extracted to maintain React Focus) ---
const PropField = ({ label, propName, placeholder = '', value, onChange }) => (
  <div>
    <label className="text-[9px] text-slate-400 mb-1 block font-bold truncate pr-1" title={label}>{label}</label>
    <input type="text" value={value || ''} onChange={(e) => onChange(propName, e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-md px-2 py-1.5 text-xs font-mono outline-none focus:border-indigo-500 transition-colors" placeholder={placeholder} />
  </div>
);

const PropColor = ({ label, propName, value, onChange }) => (
  <div className="col-span-2">
    <label className="text-[9px] text-slate-400 mb-1 block font-bold">{label}</label>
    <div className="flex items-center gap-2">
      <input type="color" value={value || '#000000'} onChange={(e) => onChange(propName, e.target.value)} className="w-6 h-6 rounded bg-slate-950 border border-slate-700 p-0.5 cursor-pointer shrink-0" />
      <input type="text" value={value || ''} onChange={(e) => onChange(propName, e.target.value)} className="flex-1 min-w-0 bg-slate-950 border border-slate-700 text-slate-200 rounded-md px-2 py-1.5 text-xs font-mono outline-none focus:border-indigo-500" placeholder="transparent, #fff" />
    </div>
  </div>
);

const PropSelect = ({ label, propName, options, value, onChange }) => (
  <div>
    <label className="text-[9px] text-slate-400 mb-1 block font-bold truncate pr-1" title={label}>{label}</label>
    <select value={value || ''} onChange={(e) => onChange(propName, e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-md px-2 py-1.5 text-[11px] font-bold outline-none focus:border-indigo-500 cursor-pointer transition-colors custom-scrollbar">
      <option value="">Inherit / Default</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const AccordionGroup = ({ id, title, icon, isOpen, onToggle, children, searchTerm, keywords = '' }) => {
  // Search logic for dynamic accordions
  const term = searchTerm?.toLowerCase() || '';
  const isMatch = !term || title.toLowerCase().includes(term) || keywords.toLowerCase().includes(term);

  if (!isMatch) return null;

  // Auto-expand if actively searching
  const actuallyOpen = term ? true : isOpen;

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden mb-2 bg-slate-900/50 transition-all">
      <button onClick={() => onToggle(id)} className="w-full px-3 py-2.5 flex items-center justify-between bg-slate-800/30 hover:bg-slate-800/80 transition-colors cursor-pointer text-left">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
          <i className={`bi ${icon} text-indigo-400 text-sm`}></i> {title}
        </span>
        <i className={`bi bi-chevron-down text-xs text-slate-500 transition-transform ${actuallyOpen ? 'rotate-180' : ''}`}></i>
      </button>
      {actuallyOpen && <div className="p-3 border-t border-slate-800/50 space-y-3">{children}</div>}
    </div>
  );
};

export default function InspectorPanel({ 
  isInspectMode, setIsInspectMode, selectedElementId, layoutItems, 
  onApplyChanges, isMinimized, setIsMinimized, onMoveItem 
}) {
  const [pendingText, setPendingText] = useState('');
  const [pendingCustomId, setPendingCustomId] = useState('');
  const [pendingParentId, setPendingParentId] = useState(null);
  const [pendingSrc, setPendingSrc] = useState('');
  const [pendingHref, setPendingHref] = useState('');

  const [breakpoint, setBreakpoint] = useState('desktop'); 
  const [pendingStyles, setPendingStyles] = useState({});
  const [pendingTabletStyles, setPendingTabletStyles] = useState({});
  const [pendingMobileStyles, setPendingMobileStyles] = useState({});

  const [editorMode, setEditorMode] = useState('visual'); 
  const [rawCss, setRawCss] = useState('');
  const [pendingRawHtml, setPendingRawHtml] = useState('');

  // ✨ NEW: Smart Search Engine State
  const [searchTerm, setSearchTerm] = useState('');

  // Manage all 13 Inspector Accordions
  const [accState, setAccState] = useState({
    structure: true, content: true, boxModel: true, typography: false, 
    layout: false, flexbox: false, grid: false, backgrounds: false, 
    effects: false, animation: false, lists: false, ui: false, logical: false
  });

  const toggleAcc = (sec) => setAccState(prev => ({ ...prev, [sec]: !prev[sec] }));

  const activeItemData = layoutItems.find(item => item.id === selectedElementId);
  const displayTitle = activeItemData ? `Properties: <${activeItemData.type}>` : 'Visual Inspector';
  
  const isRawVirtualNode = activeItemData?.isRawChild || false;

  const elemType = activeItemData?.type || '';
  const isContainer = ['div', 'section', 'article', 'form', 'nav', 'header', 'aside', 'footer', 'ul', 'ol', 'table', 'tbody', 'thead', 'tr'].includes(elemType);
  const isMedia = ['img', 'video', 'iframe', 'canvas', 'svg'].includes(elemType);
  const isInput = ['input', 'textarea', 'select'].includes(elemType);
  const isTextElement = !isContainer && !isMedia && !isInput;
  const isLink = elemType === 'a';

  const availableContainers = layoutItems.filter(item => 
    ['div', 'section', 'article', 'form', 'nav', 'header', 'aside', 'footer', 'ul', 'ol', 'table', 'tbody', 'thead', 'tr'].includes(item.type) && item.id !== selectedElementId
  );
  const siblings = activeItemData ? layoutItems.filter(i => i.parentId === activeItemData.parentId) : [];

  useEffect(() => {
    if (activeItemData) {
      setPendingText(activeItemData.text || '');
      setPendingCustomId(activeItemData.customId || '');
      setPendingParentId(activeItemData.parentId || null);
      setPendingSrc(activeItemData.src || '');
      setPendingHref(activeItemData.href || '');
      setPendingStyles(activeItemData.styles || {});
      setPendingTabletStyles(activeItemData.tabletStyles || {});
      setPendingMobileStyles(activeItemData.mobileStyles || {});
      setPendingRawHtml(activeItemData.rawHtml || '');
      
      setEditorMode(activeItemData.rawHtml && !activeItemData.isRawChild ? 'html' : 'visual'); 
    } else {
      setPendingText(''); setPendingCustomId(''); setPendingParentId(null);
      setPendingSrc(''); setPendingHref('');
      setPendingStyles({}); setPendingTabletStyles({}); setPendingMobileStyles({});
      setPendingRawHtml('');
    }
  }, [selectedElementId, activeItemData]);

  useEffect(() => {
    if (editorMode === 'code') {
      let currentObj = {};
      if (breakpoint === 'desktop') currentObj = pendingStyles;
      else if (breakpoint === 'tablet') currentObj = pendingTabletStyles;
      else if (breakpoint === 'mobile') currentObj = pendingMobileStyles;
      
      setRawCss(objToCss(currentObj));
    }
  }, [editorMode, breakpoint, pendingStyles, pendingTabletStyles, pendingMobileStyles]); 

  const syncRawToState = (cssStr = rawCss) => {
    const parsed = cssToObj(cssStr);
    if (breakpoint === 'desktop') setPendingStyles(parsed);
    else if (breakpoint === 'tablet') setPendingTabletStyles(parsed);
    else if (breakpoint === 'mobile') setPendingMobileStyles(parsed);
    return parsed;
  };

  const generateHtmlStub = () => {
    let tag = activeItemData.type;
    if (tag === 'navbar') tag = 'nav'; if (tag === 'sidebar') tag = 'aside'; if (tag === 'footer') tag = 'footer';
    const idStr = pendingCustomId ? ` id="${pendingCustomId}"` : '';
    const srcStr = pendingSrc ? ` src="${pendingSrc}"` : '';
    const hrefStr = pendingHref ? ` href="${pendingHref}"` : '';
    return `<${tag}${idStr}${srcStr}${hrefStr} class="transition-all relative">\n  ${pendingText}\n</${tag}>`;
  };

  const handleModeSwitch = (mode) => {
    if (mode === 'visual' && editorMode === 'code') syncRawToState(); 
    if (mode === 'html' && !pendingRawHtml && !isRawVirtualNode) setPendingRawHtml(generateHtmlStub());
    setEditorMode(mode);
  };

  const handleStyleFieldChange = (prop, val) => {
    if (breakpoint === 'desktop') setPendingStyles(prev => ({ ...prev, [prop]: val }));
    else if (breakpoint === 'tablet') setPendingTabletStyles(prev => ({ ...prev, [prop]: val }));
    else if (breakpoint === 'mobile') setPendingMobileStyles(prev => ({ ...prev, [prop]: val }));
  };

  const getStyleVal = (prop) => {
    if (breakpoint === 'desktop') return pendingStyles[prop] || '';
    if (breakpoint === 'tablet') return pendingTabletStyles[prop] || '';
    return pendingMobileStyles[prop] || '';
  };

  const handleExecute = () => {
    let finalStyles = pendingStyles;
    let finalTablet = pendingTabletStyles;
    let finalMobile = pendingMobileStyles;

    if (editorMode === 'code') {
       const parsed = syncRawToState(rawCss);
       if (breakpoint === 'desktop') finalStyles = parsed;
       if (breakpoint === 'tablet') finalTablet = parsed;
       if (breakpoint === 'mobile') finalMobile = parsed;
    }

    onApplyChanges(selectedElementId, {
      text: pendingText, styles: finalStyles, tabletStyles: finalTablet,
      mobileStyles: finalMobile, customId: pendingCustomId, parentId: pendingParentId,
      src: pendingSrc, href: pendingHref, rawHtml: pendingRawHtml
    });
  };

  // --- ✨ FIX: Real-Time Field Filtering Logic ---
  const matchesSearch = (label, propName) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return label.toLowerCase().includes(term) || (propName && propName.toLowerCase().includes(term));
  };
  const showManual = (str) => !searchTerm || str.toLowerCase().includes(searchTerm.toLowerCase());

  const _F = (label, prop, placeholder = '') => matchesSearch(label, prop) ? <PropField key={prop} label={label} propName={prop} placeholder={placeholder} value={getStyleVal(prop)} onChange={handleStyleFieldChange} /> : null;
  const _C = (label, prop) => matchesSearch(label, prop) ? <PropColor key={prop} label={label} propName={prop} value={getStyleVal(prop)} onChange={handleStyleFieldChange} /> : null;
  const _S = (label, prop, options) => matchesSearch(label, prop) ? <PropSelect key={prop} label={label} propName={prop} options={options} value={getStyleVal(prop)} onChange={handleStyleFieldChange} /> : null;

  if (isMinimized) {
    return (
      <button onClick={() => setIsMinimized(false)} className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-slate-900 border border-slate-700 text-indigo-400 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center justify-center hover:scale-105 hover:bg-slate-800 transition-all cursor-pointer">
        <i className="bi bi-sliders text-base"></i>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[350px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-fade-in text-slate-200">
      
      {/* Header */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsInspectMode(!isInspectMode)} className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-all border cursor-pointer shadow-sm ${isInspectMode ? 'bg-indigo-600 text-white border-indigo-500 animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`} title="Select Element Tool">
            <i className="bi bi-cursor-fill text-xs"></i>
          </button>
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide truncate max-w-[180px]">
            {displayTitle}
          </span>
        </div>
        <button onClick={() => setIsMinimized(true)} className="w-8 h-8 shrink-0 text-slate-500 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg flex items-center justify-center cursor-pointer transition-colors"><i className="bi bi-dash-lg"></i></button>
      </div>

      <div className="flex-1 p-3 overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-900 relative">
        {!activeItemData ? (
          <div className="text-center py-12 text-xs text-slate-500 space-y-2">
            <i className="bi bi-diagram-3 text-4xl text-indigo-500/30 block mb-4"></i>
            <p className="font-bold text-slate-400">Builder Node Inspector</p>
            <p className="text-[10px] px-2 leading-relaxed">Select a layer from the DOM Tree or click an element dynamically to view its CSS architecture.</p>
          </div>
        ) : (
          <div className="pb-4">
            {pendingRawHtml && !isRawVirtualNode && editorMode !== 'html' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2 mb-4 animate-fade-in">
                <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-wider"><i className="bi bi-exclamation-triangle-fill"></i> Full HTML Mode Active</div>
                <p className="text-[10px] text-amber-500/80 leading-tight">Visual settings are currently overridden by custom HTML.</p>
                <button onClick={() => setPendingRawHtml('')} className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 text-[10px] font-bold py-1.5 px-2 rounded-lg transition-colors w-full cursor-pointer">Clear HTML Override</button>
              </div>
            )}

            {isRawVirtualNode && editorMode === 'visual' && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 space-y-1.5 mb-4 animate-fade-in">
                <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider"><i className="bi bi-unlock-fill drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]"></i> Deep Node Unlocked</div>
                <p className="text-[10px] text-emerald-300/80 leading-tight">Inspecting nested template element.</p>
              </div>
            )}

            <AccordionGroup id="structure" title="Structure Tree" icon="bi-diagram-3-fill" isOpen={accState.structure} onToggle={toggleAcc} searchTerm={searchTerm} keywords="unique custom id assign parent container element position order up down">
              {showManual('unique custom id') && (
                <div>
                  <label className="text-[10px] text-slate-400 mb-1 font-bold flex justify-between">Unique Custom ID {isRawVirtualNode && <span className="text-[9px] text-amber-500 font-bold"><i className="bi bi-lock-fill"></i> Locked</span>}</label>
                  <input type="text" value={pendingCustomId} onChange={(e) => setPendingCustomId(e.target.value)} className={`w-full border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono bg-slate-950 focus:outline-none focus:border-indigo-500 transition-colors ${isRawVirtualNode ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''}`} placeholder="hero-container" />
                </div>
              )}
              {!isRawVirtualNode && (
                <>
                  {showManual('assign parent container') && (
                    <div>
                      <label className="text-[10px] text-slate-400 mb-1 block font-bold">Assign Parent Container</label>
                      <select value={pendingParentId || ''} onChange={(e) => setPendingParentId(e.target.value || null)} className="w-full border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-indigo-500 bg-slate-950 transition-colors cursor-pointer truncate">
                        <option value="">[Root Document Base]</option>
                        {availableContainers.map(container => (<option key={container.id} value={container.id}>{container.customId ? `<${container.type}> #${container.customId}` : `<${container.type}> (${container.id.substring(0, 10)})`}</option>))}
                      </select>
                    </div>
                  )}
                  {siblings.length > 1 && showManual('element position order up down') && (
                    <div className="pt-2 mt-2 border-t border-slate-800 flex gap-2">
                      <button onClick={() => onMoveItem(selectedElementId, 'up')} className="flex-1 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white shadow-sm cursor-pointer"><i className="bi bi-arrow-up"></i> Up</button>
                      <button onClick={() => onMoveItem(selectedElementId, 'down')} className="flex-1 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white shadow-sm cursor-pointer"><i className="bi bi-arrow-down"></i> Down</button>
                    </div>
                  )}
                </>
              )}
            </AccordionGroup>

            {/* 3-Way Mode Switcher */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4 shrink-0">
              <button onClick={() => handleModeSwitch('visual')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${editorMode === 'visual' ? 'bg-indigo-600 shadow-sm text-white' : 'text-slate-500 hover:text-white cursor-pointer'}`}>Visual</button>
              <button onClick={() => handleModeSwitch('code')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${editorMode === 'code' ? 'bg-indigo-600 shadow-sm text-white' : 'text-slate-500 hover:text-white'}`}>CSS</button>
              <button disabled={isRawVirtualNode} onClick={() => handleModeSwitch('html')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${isRawVirtualNode ? 'opacity-40 cursor-not-allowed text-slate-600' : (editorMode === 'html' ? 'bg-indigo-600 shadow-sm text-white' : 'text-slate-500 hover:text-white cursor-pointer')}`}>HTML</button>
            </div>

            {/* View Renders */}
            {editorMode === 'html' ? (
              <textarea value={pendingRawHtml} onChange={(e) => setPendingRawHtml(e.target.value)} className="w-full h-96 bg-slate-950 text-emerald-400 font-mono text-[11px] p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 custom-scrollbar shadow-inner" spellCheck="false" />
            ) : editorMode === 'code' ? (
              <div className="space-y-3">
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {['desktop', 'tablet', 'mobile'].map(bp => (
                    <button key={bp} onClick={() => setBreakpoint(bp)} className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer capitalize ${breakpoint === bp ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-white'}`}>{bp}</button>
                  ))}
                </div>
                <textarea value={rawCss} onChange={(e) => setRawCss(e.target.value)} className="w-full h-80 bg-slate-950 text-pink-400 font-mono text-[11px] p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 custom-scrollbar shadow-inner" spellCheck="false" />
              </div>
            ) : (
              <div className="space-y-1 opacity-100 relative">
                
                {/* ✨ FIX: Sticky Visual Toolbar with Real-Time Search */}
                <div className="space-y-2 sticky top-0 z-20 bg-slate-900 pb-2 pt-1 border-b border-slate-800 mb-3">
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {['desktop', 'tablet', 'mobile'].map(bp => (
                      <button key={bp} onClick={() => setBreakpoint(bp)} className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer capitalize ${breakpoint === bp ? 'bg-slate-800 text-indigo-400 border border-slate-700 shadow-sm' : 'text-slate-500 hover:text-white border border-transparent'}`}>{bp}</button>
                    ))}
                  </div>
                  <div className="relative">
                    <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                    <input 
                      type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                      placeholder="Search CSS properties..." 
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-[11px] focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-600 shadow-inner"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer">
                        <i className="bi bi-x-circle-fill text-xs"></i>
                      </button>
                    )}
                  </div>
                </div>

                <AccordionGroup id="content" title="Content Attributes" icon="bi-input-cursor-text" isOpen={accState.content} onToggle={toggleAcc} searchTerm={searchTerm} keywords="inner text label source url src link destination href">
                  {showManual('inner text label') && !isMedia && (!isContainer || isRawVirtualNode) && (
                    <div><label className="text-[10px] text-slate-400 mb-1 block font-bold">Inner Text</label><textarea value={pendingText} onChange={(e) => setPendingText(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500 min-h-[40px] custom-scrollbar transition-colors" /></div>
                  )}
                  {showManual('source url src') && isMedia && (<div><label className="text-[10px] text-slate-400 mb-1 block font-bold">Source URL (src)</label><input type="text" value={pendingSrc} onChange={(e) => setPendingSrc(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500" /></div>)}
                  {showManual('link destination href') && isLink && (<div><label className="text-[10px] text-slate-400 mb-1 block font-bold">Link (href)</label><input type="text" value={pendingHref} onChange={(e) => setPendingHref(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500" /></div>)}
                </AccordionGroup>

                <AccordionGroup id="boxModel" title="Box Model & Sizing" icon="bi-bounding-box" isOpen={accState.boxModel} onToggle={toggleAcc} searchTerm={searchTerm} keywords="width height minwidth maxwidth minheight maxheight padding margin top right bottom left boxsizing overflow x y">
                  <div className="grid grid-cols-2 gap-2">
                    {_F('Width', 'width', 'auto')}
                    {_F('Height', 'height', 'auto')}
                    {_F('Min Width', 'minWidth')}
                    {_F('Max Width', 'maxWidth')}
                    {_F('Min Height', 'minHeight')}
                    {_F('Max Height', 'maxHeight')}
                    {_F('Padding', 'padding', '10px')}
                    {_F('Margin', 'margin', '10px auto')}
                    {_F('Pad Top', 'paddingTop')}
                    {_F('Marg Top', 'marginTop')}
                    {_F('Pad Right', 'paddingRight')}
                    {_F('Marg Right', 'marginRight')}
                    {_F('Pad Bottom', 'paddingBottom')}
                    {_F('Marg Bottom', 'marginBottom')}
                    {_F('Pad Left', 'paddingLeft')}
                    {_F('Marg Left', 'marginLeft')}
                    {_S('Box Sizing', 'boxSizing', ['border-box', 'content-box'])}
                    {_S('Overflow', 'overflow', ['visible', 'hidden', 'scroll', 'auto', 'clip'])}
                    {_S('Overflow X', 'overflowX', ['visible', 'hidden', 'scroll', 'auto'])}
                    {_S('Overflow Y', 'overflowY', ['visible', 'hidden', 'scroll', 'auto'])}
                  </div>
                </AccordionGroup>

                <AccordionGroup id="layout" title="Layout & Position" icon="bi-layers" isOpen={accState.layout} onToggle={toggleAcc} searchTerm={searchTerm} keywords="display position top right bottom left zindex float clear visibility objectfit objectposition verticalalign clippath">
                  <div className="grid grid-cols-2 gap-2">
                    {_S('Display', 'display', ['block', 'inline-block', 'inline', 'flex', 'grid', 'none'])}
                    {_S('Position', 'position', ['static', 'relative', 'absolute', 'fixed', 'sticky'])}
                    {_F('Top', 'top')}
                    {_F('Right', 'right')}
                    {_F('Bottom', 'bottom')}
                    {_F('Left', 'left')}
                    {_F('Z-Index', 'zIndex')}
                    {_S('Float', 'float', ['left', 'right', 'none'])}
                    {_S('Clear', 'clear', ['left', 'right', 'both', 'none'])}
                    {_S('Visibility', 'visibility', ['visible', 'hidden', 'collapse'])}
                    {_S('Object Fit', 'objectFit', ['fill', 'contain', 'cover', 'none', 'scale-down'])}
                    {_F('Object Pos.', 'objectPosition', 'center')}
                    {_S('Vertical Align', 'verticalAlign', ['baseline', 'top', 'middle', 'bottom'])}
                    {_F('Clip Path', 'clipPath', 'circle(50%)')}
                  </div>
                </AccordionGroup>

                <AccordionGroup id="flexbox" title="Flexbox Engine" icon="bi-columns-gap" isOpen={accState.flexbox} onToggle={toggleAcc} searchTerm={searchTerm} keywords="flex direction flexdirection wrap flexwrap justifycontent alignitems aligncontent flexgrow flexshrink flexbasis alignself order">
                  <div className="grid grid-cols-2 gap-2">
                    {_F('Flex (Shorthand)', 'flex', '1 1 auto')}
                    {_S('Direction', 'flexDirection', ['row', 'row-reverse', 'column', 'column-reverse'])}
                    {_S('Wrap', 'flexWrap', ['nowrap', 'wrap', 'wrap-reverse'])}
                    {_S('Justify Content', 'justifyContent', ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'])}
                    {_S('Align Items', 'alignItems', ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'])}
                    {_S('Align Content', 'alignContent', ['stretch', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around'])}
                    {_F('Flex Grow', 'flexGrow', '0')}
                    {_F('Flex Shrink', 'flexShrink', '1')}
                    {_F('Flex Basis', 'flexBasis', 'auto')}
                    {_S('Align Self', 'alignSelf', ['auto', 'stretch', 'flex-start', 'flex-end', 'center', 'baseline'])}
                    {_F('Order', 'order', '0')}
                  </div>
                </AccordionGroup>

                <AccordionGroup id="grid" title="Grid Layout" icon="bi-grid-3x3" isOpen={accState.grid} onToggle={toggleAcc} searchTerm={searchTerm} keywords="grid template columns rows areas gap rowgap columngap gridcolumn gridrow gridarea justifyitems placeitems justifyself placeself">
                  <div className="grid grid-cols-2 gap-2">
                    {_F('Grid (Shorthand)', 'grid')}
                    {_F('Template Cols', 'gridTemplateColumns', '1fr 1fr')}
                    {_F('Template Rows', 'gridTemplateRows')}
                    {_F('Template Areas', 'gridTemplateAreas')}
                    {_F('Gap', 'gap', '16px')}
                    {_F('Row Gap', 'rowGap')}
                    {_F('Column Gap', 'columnGap')}
                    {_F('Grid Column', 'gridColumn', '1 / -1')}
                    {_F('Grid Row', 'gridRow')}
                    {_F('Grid Area', 'gridArea')}
                    {_S('Justify Items', 'justifyItems', ['stretch', 'start', 'end', 'center'])}
                    {_S('Place Items', 'placeItems', ['center', 'stretch'])}
                    {_S('Justify Self', 'justifySelf', ['stretch', 'start', 'end', 'center'])}
                    {_S('Place Self', 'placeSelf', ['center', 'stretch'])}
                  </div>
                </AccordionGroup>

                <AccordionGroup id="typography" title="Typography" icon="bi-type" isOpen={accState.typography} onToggle={toggleAcc} searchTerm={searchTerm} keywords="fontfamily fontsize fontweight fontstyle color lineheight letterspacing wordspacing textalign texttransform textdecoration textindent textshadow textoverflow whitespace wordbreak writingmode fontvariant">
                  <div className="grid grid-cols-2 gap-2">
                    {_F('Font Family', 'fontFamily', 'sans-serif')}
                    {_F('Font Size', 'fontSize', '16px')}
                    {_S('Font Weight', 'fontWeight', ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'])}
                    {_S('Font Style', 'fontStyle', ['normal', 'italic', 'oblique'])}
                    {_C('Color', 'color')}
                    {_F('Line Height', 'lineHeight', '1.5')}
                    {_F('Letter Spacing', 'letterSpacing', 'normal')}
                    {_F('Word Spacing', 'wordSpacing')}
                    {_S('Text Align', 'textAlign', ['left', 'right', 'center', 'justify'])}
                    {_S('Text Transform', 'textTransform', ['none', 'capitalize', 'uppercase', 'lowercase'])}
                    {_S('Text Decoration', 'textDecoration', ['none', 'underline', 'overline', 'line-through'])}
                    {_F('Text Indent', 'textIndent')}
                    {_F('Text Shadow', 'textShadow', '1px 1px 2px #000')}
                    {_S('Text Overflow', 'textOverflow', ['clip', 'ellipsis'])}
                    {_S('White Space', 'whiteSpace', ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line'])}
                    {_S('Word Break', 'wordBreak', ['normal', 'break-all', 'keep-all', 'break-word'])}
                    {_S('Writing Mode', 'writingMode', ['horizontal-tb', 'vertical-rl', 'vertical-lr'])}
                    {_S('Font Variant', 'fontVariant', ['normal', 'small-caps'])}
                  </div>
                </AccordionGroup>

                <AccordionGroup id="backgrounds" title="Backgrounds & Borders" icon="bi-paint-bucket" isOpen={accState.backgrounds} onToggle={toggleAcc} searchTerm={searchTerm} keywords="backgroundcolor backgroundimage background backgroundrepeat backgroundattachment backgroundposition backgroundsize backgroundclip backgroundblendmode border borderradius borderwidth borderstyle bordercolor bordertop borderright borderbottom borderleft borderimage outline outlineoffset outlinestyle outlinewidth outlinecolor">
                  <div className="grid grid-cols-2 gap-2">
                    {_C('Background Color', 'backgroundColor')}
                    {_F('Background Image', 'backgroundImage', 'url(...)')}
                    {_F('Background (Short)', 'background')}
                    {_S('Bg Repeat', 'backgroundRepeat', ['repeat', 'no-repeat', 'repeat-x', 'repeat-y'])}
                    {_S('Bg Attachment', 'backgroundAttachment', ['scroll', 'fixed', 'local'])}
                    {_F('Bg Position', 'backgroundPosition', 'center')}
                    {_F('Bg Size', 'backgroundSize', 'cover, contain')}
                    {_S('Bg Clip', 'backgroundClip', ['border-box', 'padding-box', 'content-box', 'text'])}
                    {_S('Bg Blend Mode', 'backgroundBlendMode', ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge'])}
                    {_F('Border (Shorthand)', 'border', '1px solid #000')}
                    {_F('Border Radius', 'borderRadius', '8px')}
                    {_F('Border Width', 'borderWidth')}
                    {_S('Border Style', 'borderStyle', ['none', 'solid', 'dashed', 'dotted', 'double'])}
                    {_C('Border Color', 'borderColor')}
                    {_F('Border Top', 'borderTop')}
                    {_F('Border Right', 'borderRight')}
                    {_F('Border Bottom', 'borderBottom')}
                    {_F('Border Left', 'borderLeft')}
                    {_F('Border Image', 'borderImage')}
                    {_F('Outline', 'outline', 'none')}
                    {_F('Outline Offset', 'outlineOffset', '2px')}
                    {_S('Outline Style', 'outlineStyle', ['none', 'solid', 'dashed', 'dotted'])}
                    {_F('Outline Width', 'outlineWidth')}
                    {_C('Outline Color', 'outlineColor')}
                  </div>
                </AccordionGroup>

                <AccordionGroup id="effects" title="Visual Effects" icon="bi-magic" isOpen={accState.effects} onToggle={toggleAcc} searchTerm={searchTerm} keywords="boxshadow opacity filter backdropfilter mixblendmode isolation">
                  <div className="grid grid-cols-2 gap-2">
                    {_F('Box Shadow', 'boxShadow', '0 4px 6px rgba(0,0,0,0.1)')}
                    {_F('Opacity', 'opacity', '1')}
                    {_F('Filter', 'filter', 'blur(4px)')}
                    {_F('Backdrop Filter', 'backdropFilter', 'blur(10px)')}
                    {_S('Mix Blend Mode', 'mixBlendMode', ['normal', 'multiply', 'screen', 'overlay', 'darken'])}
                    {_S('Isolation', 'isolation', ['auto', 'isolate'])}
                  </div>
                </AccordionGroup>

                <AccordionGroup id="animation" title="Animations & Transforms" icon="bi-camera-reels" isOpen={accState.animation} onToggle={toggleAcc} searchTerm={searchTerm} keywords="transition transitionproperty transitionduration transitiontimingfunction transitiondelay transform transformorigin transformstyle perspective backfacevisibility animation animationname animationduration animationtimingfunction animationdelay animationiterationcount animationdirection animationfillmode animationplaystate">
                  <div className="grid grid-cols-2 gap-2">
                    {_F('Transition (Short)', 'transition', 'all 0.3s ease')}
                    {_F('Trans. Property', 'transitionProperty', 'all, transform')}
                    {_F('Trans. Duration', 'transitionDuration', '0.3s')}
                    {_F('Trans. Timing', 'transitionTimingFunction', 'ease, linear')}
                    {_F('Trans. Delay', 'transitionDelay', '0s')}
                    {_F('Transform', 'transform', 'scale(1.1) rotate(45deg)')}
                    {_F('Transform Origin', 'transformOrigin', 'center')}
                    {_S('Transform Style', 'transformStyle', ['flat', 'preserve-3d'])}
                    {_F('Perspective', 'perspective', '1000px')}
                    {_S('Backface Visibility', 'backfaceVisibility', ['visible', 'hidden'])}
                    {_F('Animation (Short)', 'animation', 'spin 1s linear infinite')}
                    {_F('Anim. Name', 'animationName')}
                    {_F('Anim. Duration', 'animationDuration')}
                    {_F('Anim. Timing', 'animationTimingFunction')}
                    {_F('Anim. Delay', 'animationDelay')}
                    {_F('Anim. Count', 'animationIterationCount', 'infinite')}
                    {_S('Anim. Direction', 'animationDirection', ['normal', 'reverse', 'alternate', 'alternate-reverse'])}
                    {_S('Anim. Fill Mode', 'animationFillMode', ['none', 'forwards', 'backwards', 'both'])}
                    {_S('Anim. Play State', 'animationPlayState', ['running', 'paused'])}
                  </div>
                </AccordionGroup>

                <AccordionGroup id="lists" title="Lists & Tables" icon="bi-list-task" isOpen={accState.lists} onToggle={toggleAcc} searchTerm={searchTerm} keywords="liststyle liststyletype liststyleposition liststyleimage bordercollapse borderspacing tablelayout emptycells captionside">
                  <div className="grid grid-cols-2 gap-2">
                    {_F('List Style (Short)', 'listStyle')}
                    {_S('List Style Type', 'listStyleType', ['disc', 'circle', 'square', 'decimal', 'none'])}
                    {_S('List Position', 'listStylePosition', ['inside', 'outside'])}
                    {_F('List Image', 'listStyleImage', 'url(...)')}
                    {_S('Border Collapse', 'borderCollapse', ['collapse', 'separate'])}
                    {_F('Border Spacing', 'borderSpacing')}
                    {_S('Table Layout', 'tableLayout', ['auto', 'fixed'])}
                    {_S('Empty Cells', 'emptyCells', ['show', 'hide'])}
                    {_S('Caption Side', 'captionSide', ['top', 'bottom'])}
                  </div>
                </AccordionGroup>

                <AccordionGroup id="ui" title="UI & Miscellaneous" icon="bi-mouse" isOpen={accState.ui} onToggle={toggleAcc} searchTerm={searchTerm} keywords="cursor pointerevents userselect resize content scrollbehavior scrollsnaptype scrollmargin scrollpadding caretcolor accentcolor">
                  <div className="grid grid-cols-2 gap-2">
                    {_S('Cursor', 'cursor', ['auto', 'pointer', 'text', 'grab', 'not-allowed'])}
                    {_S('Pointer Events', 'pointerEvents', ['auto', 'none'])}
                    {_S('User Select', 'userSelect', ['auto', 'none', 'text', 'all'])}
                    {_S('Resize', 'resize', ['none', 'both', 'horizontal', 'vertical'])}
                    {_F('Content (Pseudo)', 'content', "''")}
                    {_S('Scroll Behavior', 'scrollBehavior', ['auto', 'smooth'])}
                    {_S('Scroll Snap Type', 'scrollSnapType', ['none', 'x mandatory', 'y mandatory'])}
                    {_F('Scroll Margin', 'scrollMargin')}
                    {_F('Scroll Padding', 'scrollPadding')}
                    {_C('Caret Color', 'caretColor')}
                    {_C('Accent Color', 'accentColor')}
                  </div>
                </AccordionGroup>
                
                <AccordionGroup id="logical" title="Logical Properties" icon="bi-globe" isOpen={accState.logical} onToggle={toggleAcc} searchTerm={searchTerm} keywords="blocksize inlinesize marginblock margininline paddingblock paddinginline borderblock borderinline inset">
                  <div className="grid grid-cols-2 gap-2">
                    {_F('Block Size', 'blockSize')}
                    {_F('Inline Size', 'inlineSize')}
                    {_F('Margin Block', 'marginBlock')}
                    {_F('Margin Inline', 'marginInline')}
                    {_F('Padding Block', 'paddingBlock')}
                    {_F('Padding Inline', 'paddingInline')}
                    {_F('Border Block', 'borderBlock')}
                    {_F('Border Inline', 'borderInline')}
                    {_F('Inset', 'inset')}
                  </div>
                </AccordionGroup>

              </div>
            )}
          </div>
        )}
      </div>

      {activeItemData && (
        <div className="p-3 border-t border-slate-800 bg-slate-950 shrink-0 z-20">
          <button onClick={handleExecute} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2">
            <i className="bi bi-save-fill text-[15px]"></i> Execute Style Engine
          </button>
        </div>
      )}
    </div>
  );
}