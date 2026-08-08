import React, { useState, useEffect } from 'react';
import { getAttributesForTag } from '../utils/htmlAttributes'; 

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

// --- Professional Figma/Webflow Style UI Components ---
const PropField = ({ label, propName, placeholder = '', value, onChange }) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase truncate">{label}</label>
    <input 
      type="text" value={value || ''} onChange={(e) => onChange(propName, e.target.value)} 
      className="w-full bg-[#0a0a0a]/50 border border-white/10 hover:border-white/20 focus:border-indigo-500 rounded px-2 py-1.5 text-[11px] font-mono text-slate-200 outline-none transition-all shadow-inner" 
      placeholder={placeholder} 
    />
  </div>
);

const PropColor = ({ label, propName, value, onChange }) => (
  <div className="flex flex-col gap-1 col-span-2">
    <label className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase truncate">{label}</label>
    <div className="flex items-center gap-2 bg-[#0a0a0a]/50 border border-white/10 hover:border-white/20 focus-within:border-indigo-500 rounded p-1 transition-all shadow-inner">
      <div className="relative w-5 h-5 rounded overflow-hidden shrink-0 border border-white/20">
        <input 
          type="color" value={value || '#000000'} onChange={(e) => onChange(propName, e.target.value)} 
          className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer p-0 m-0 border-0" 
        />
      </div>
      <input 
        type="text" value={value || ''} onChange={(e) => onChange(propName, e.target.value)} 
        className="flex-1 min-w-0 bg-transparent text-[11px] font-mono text-slate-200 outline-none" 
        placeholder="transparent" 
      />
    </div>
  </div>
);

const PropSelect = ({ label, propName, options, value, onChange }) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase truncate">{label}</label>
    <div className="relative">
      <select 
        value={value || ''} onChange={(e) => onChange(propName, e.target.value)} 
        className="w-full bg-[#0a0a0a]/50 border border-white/10 hover:border-white/20 focus:border-indigo-500 rounded px-2 py-1.5 text-[11px] text-slate-200 outline-none appearance-none cursor-pointer transition-all shadow-inner"
      >
        <option value="">Inherit</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <i className="bi bi-chevron-expand absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none"></i>
    </div>
  </div>
);

const AccordionGroup = ({ id, title, isOpen, onToggle, children, searchTerm, keywords = '' }) => {
  const term = searchTerm?.toLowerCase() || '';
  const isMatch = !term || title.toLowerCase().includes(term) || keywords.toLowerCase().includes(term);

  if (!isMatch) return null;
  const actuallyOpen = term ? true : isOpen;

  return (
    <div className="border-b border-white/5 last:border-0">
      <button 
        onClick={() => onToggle(id)} 
        className="w-full py-2.5 flex items-center justify-between group cursor-pointer text-left focus:outline-none"
      >
        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 group-hover:text-white transition-colors">
          {title}
        </span>
        <i className={`bi bi-chevron-down text-[10px] text-slate-600 transition-transform duration-300 ${actuallyOpen ? 'rotate-180 text-indigo-400' : 'group-hover:text-white'}`}></i>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${actuallyOpen ? 'max-h-[3000px] opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
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
  const [pendingAttributes, setPendingAttributes] = useState({});
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

  // Breakpoints & Hover
  const [breakpoint, setBreakpoint] = useState('desktop'); 
  const [pseudoState, setPseudoState] = useState('normal'); 

  // CSS States
  const [pendingStyles, setPendingStyles] = useState({});
  const [pendingTabletStyles, setPendingTabletStyles] = useState({});
  const [pendingMobileStyles, setPendingMobileStyles] = useState({});
  
  const [pendingHoverStyles, setPendingHoverStyles] = useState({});
  const [pendingTabletHoverStyles, setPendingTabletHoverStyles] = useState({});
  const [pendingMobileHoverStyles, setPendingMobileHoverStyles] = useState({});

  // Code Tabs
  const [editorMode, setEditorMode] = useState('css-props'); 
  const [codeTab, setCodeTab] = useState('css'); 
  const [rawCss, setRawCss] = useState('');
  const [pendingRawHtml, setPendingRawHtml] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Accordion Controller
  const [accState, setAccState] = useState({
    structure: false, attributes: false, content: false, 
    layout: false, spacing: false, flexbox: false, grid: false, typography: false, 
    backgrounds: false, borders: false, effects: false, animation: false, 
    lists: false, ui: false, svg: false
  });

  // ✨ FIX: Auto-collapse all accordions when a NEW element is selected
  useEffect(() => {
    setAccState({
      structure: false, attributes: false, content: false, 
      layout: false, spacing: false, flexbox: false, grid: false, typography: false, 
      backgrounds: false, borders: false, effects: false, animation: false, 
      lists: false, ui: false, svg: false
    });
  }, [selectedElementId]);

  const toggleAcc = (sec) => setAccState(prev => ({ ...prev, [sec]: !prev[sec] }));

  const activeItemData = layoutItems.find(item => item.id === selectedElementId);
  const displayTitle = activeItemData ? `<${activeItemData.type.toUpperCase()}>` : 'NO SELECTION';
  
  const isRawVirtualNode = activeItemData?.isRawChild || false;

  const elemType = activeItemData?.type || '';
  const isContainer = ['div', 'section', 'article', 'form', 'nav', 'header', 'aside', 'footer', 'ul', 'ol', 'table', 'tbody', 'thead', 'tr'].includes(elemType);
  const isMedia = ['img', 'video', 'iframe', 'canvas', 'svg'].includes(elemType);
  const isInput = ['input', 'textarea', 'select'].includes(elemType);
  const isLink = elemType === 'a';

  const availableContainers = layoutItems.filter(item => 
    ['div', 'section', 'article', 'form', 'nav', 'header', 'aside', 'footer', 'ul', 'ol', 'table', 'tbody', 'thead', 'tr'].includes(item.type) && item.id !== selectedElementId
  );
  const siblings = activeItemData ? layoutItems.filter(i => i.parentId === activeItemData.parentId) : [];
  const applicableAttributes = elemType ? getAttributesForTag(elemType) : [];

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
      
      setPendingHoverStyles(activeItemData.hoverStyles || {});
      setPendingTabletHoverStyles(activeItemData.tabletHoverStyles || {});
      setPendingMobileHoverStyles(activeItemData.mobileHoverStyles || {});

      setPendingRawHtml(activeItemData.rawHtml || '');
      setPendingAttributes(activeItemData.attributes || {});
      
      // ✨ FIX: Smart Tab Router Prevents Panel Freezes!
      setEditorMode(prev => {
          if (activeItemData.rawHtml && !activeItemData.isRawChild) return 'code';
          if (activeItemData.isRawChild && prev === 'code') return 'css-props';
          return prev;
      });
      setCodeTab(prev => {
          if (activeItemData.rawHtml && !activeItemData.isRawChild) return 'html';
          if (activeItemData.isRawChild && prev === 'html') return 'css';
          return prev;
      });

    } else {
      setPendingText(''); setPendingCustomId(''); setPendingParentId(null);
      setPendingSrc(''); setPendingHref('');
      setPendingStyles({}); setPendingTabletStyles({}); setPendingMobileStyles({});
      setPendingHoverStyles({}); setPendingTabletHoverStyles({}); setPendingMobileHoverStyles({});
      setPendingRawHtml(''); setPendingAttributes({});
    }
  }, [selectedElementId, activeItemData]);

  useEffect(() => {
    if (editorMode === 'code' && codeTab === 'css') {
      let currentObj = {};
      if (pseudoState === 'hover') {
        if (breakpoint === 'desktop') currentObj = pendingHoverStyles;
        else if (breakpoint === 'tablet') currentObj = pendingTabletHoverStyles;
        else if (breakpoint === 'mobile') currentObj = pendingMobileHoverStyles;
      } else {
        if (breakpoint === 'desktop') currentObj = pendingStyles;
        else if (breakpoint === 'tablet') currentObj = pendingTabletStyles;
        else if (breakpoint === 'mobile') currentObj = pendingMobileStyles;
      }
      setRawCss(objToCss(currentObj));
    }
  }, [editorMode, codeTab, breakpoint, pseudoState, pendingStyles, pendingTabletStyles, pendingMobileStyles, pendingHoverStyles, pendingTabletHoverStyles, pendingMobileHoverStyles]); 

  const syncRawToState = (cssStr = rawCss) => {
    const parsed = cssToObj(cssStr);
    if (pseudoState === 'hover') {
      if (breakpoint === 'desktop') setPendingHoverStyles(parsed);
      else if (breakpoint === 'tablet') setPendingTabletHoverStyles(parsed);
      else if (breakpoint === 'mobile') setPendingMobileHoverStyles(parsed);
    } else {
      if (breakpoint === 'desktop') setPendingStyles(parsed);
      else if (breakpoint === 'tablet') setPendingTabletStyles(parsed);
      else if (breakpoint === 'mobile') setPendingMobileStyles(parsed);
    }
    return parsed;
  };

  const generateHtmlStub = () => {
    let tag = activeItemData.type;
    const idStr = pendingCustomId ? ` id="${pendingCustomId}"` : '';
    return `<${tag}${idStr} class="transition-all relative">\n  ${pendingText}\n</${tag}>`;
  };

  const handleModeSwitch = (mode) => {
    if (editorMode === 'code' && codeTab === 'css' && mode !== 'code') syncRawToState(); 
    if (mode === 'code' && codeTab === 'html' && !pendingRawHtml && !isRawVirtualNode) setPendingRawHtml(generateHtmlStub());
    setEditorMode(mode);
  };

  const handleCodeTabSwitch = (tab) => {
     if (codeTab === 'css' && tab === 'html') {
        syncRawToState();
        if (!pendingRawHtml && !isRawVirtualNode) setPendingRawHtml(generateHtmlStub());
     }
     setCodeTab(tab);
  };

  const handleStyleFieldChange = (prop, val) => {
    if (pseudoState === 'hover') {
      if (breakpoint === 'desktop') setPendingHoverStyles(prev => ({ ...prev, [prop]: val }));
      else if (breakpoint === 'tablet') setPendingTabletHoverStyles(prev => ({ ...prev, [prop]: val }));
      else if (breakpoint === 'mobile') setPendingMobileHoverStyles(prev => ({ ...prev, [prop]: val }));
    } else {
      if (breakpoint === 'desktop') setPendingStyles(prev => ({ ...prev, [prop]: val }));
      else if (breakpoint === 'tablet') setPendingTabletStyles(prev => ({ ...prev, [prop]: val }));
      else if (breakpoint === 'mobile') setPendingMobileStyles(prev => ({ ...prev, [prop]: val }));
    }
  };

  const getStyleVal = (prop) => {
    if (pseudoState === 'hover') {
      if (breakpoint === 'desktop') return pendingHoverStyles[prop] || '';
      if (breakpoint === 'tablet') return pendingTabletHoverStyles[prop] || '';
      return pendingMobileHoverStyles[prop] || '';
    } else {
      if (breakpoint === 'desktop') return pendingStyles[prop] || '';
      if (breakpoint === 'tablet') return pendingTabletStyles[prop] || '';
      return pendingMobileStyles[prop] || '';
    }
  };

  const handleAddAttribute = () => {
    if (!newAttrName.trim()) return;
    setPendingAttributes(prev => ({ ...prev, [newAttrName.trim()]: newAttrValue }));
    setNewAttrName('');
    setNewAttrValue('');
  };

  const handleUpdateAttribute = (key, val) => { setPendingAttributes(prev => ({ ...prev, [key]: val })); };
  const handleRemoveAttribute = (key) => { setPendingAttributes(prev => { const copy = { ...prev }; delete copy[key]; return copy; }); };

  const handleExecute = () => {
    let finalStyles = pendingStyles;
    let finalTablet = pendingTabletStyles;
    let finalMobile = pendingMobileStyles;
    
    let finalHoverStyles = pendingHoverStyles;
    let finalTabletHover = pendingTabletHoverStyles;
    let finalMobileHover = pendingMobileHoverStyles;

    if (editorMode === 'code' && codeTab === 'css') {
       const parsed = syncRawToState(rawCss);
       if (pseudoState === 'hover') {
         if (breakpoint === 'desktop') finalHoverStyles = parsed;
         if (breakpoint === 'tablet') finalTabletHover = parsed;
         if (breakpoint === 'mobile') finalMobileHover = parsed;
       } else {
         if (breakpoint === 'desktop') finalStyles = parsed;
         if (breakpoint === 'tablet') finalTablet = parsed;
         if (breakpoint === 'mobile') finalMobile = parsed;
       }
    }

    onApplyChanges(selectedElementId, {
      text: pendingText, styles: finalStyles, tabletStyles: finalTablet, mobileStyles: finalMobile,
      hoverStyles: finalHoverStyles, tabletHoverStyles: finalTabletHover, mobileHoverStyles: finalMobileHover, 
      customId: pendingCustomId, parentId: pendingParentId, src: pendingSrc, href: pendingHref, 
      rawHtml: pendingRawHtml, attributes: pendingAttributes 
    });
  };

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
      <button onClick={() => setIsMinimized(false)} className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-[#12141c]/90 backdrop-blur-xl border border-white/10 text-indigo-400 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center hover:scale-105 hover:bg-[#1a1d27] transition-all cursor-pointer">
        <i className="bi bi-sliders text-lg"></i>
      </button>
    );
  }

  return (
    <div className="fixed top-20 bottom-6 right-6 z-50 w-[320px] bg-[#12141c]/95 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-fade-in text-slate-200">
      
      {/* 🚀 HEADER */}
      <div className="h-12 px-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsInspectMode(!isInspectMode)} className={`bg-[#12141c] w-6 h-6 shrink-0 rounded flex items-center justify-center transition-all cursor-pointer ${isInspectMode ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.6)] animate-pulse' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} title="Select Element in Canvas">
            <i className="bi bi-cursor-fill text-[11px]"></i>
          </button>
          <div className="flex items-center gap-1.5">
             <div className={`w-1.5 h-1.5 rounded-full ${activeItemData ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-slate-600'}`}></div>
             <span className="text-[10px] font-bold font-mono tracking-widest text-slate-300">
               {displayTitle}
             </span>
          </div>
        </div>
        <button onClick={() => setIsMinimized(true)} className="w-6 h-6 shrink-0 text-slate-500 hover:text-white hover:bg-white/10 rounded flex items-center justify-center cursor-pointer transition-colors"><i className="bi bi-dash-lg"></i></button>
      </div>

      {/* 🎛️ SEGMENTED MASTER TABS */}
      <div className="p-2 border-b border-white/5 shrink-0 bg-black/20">
        <div className="flex p-0.5 bg-black/40 rounded-lg border border-white/5 shadow-inner">
          <button onClick={() => handleModeSwitch('html-props')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${editorMode === 'html-props' ? 'bg-[#1e212b] text-white shadow-sm border border-white/10' : 'text-slate-500 hover:text-slate-300 cursor-pointer'}`}>HTML</button>
          <button onClick={() => handleModeSwitch('css-props')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${editorMode === 'css-props' ? 'bg-[#1e212b] text-white shadow-sm border border-white/10' : 'text-slate-500 hover:text-slate-300 cursor-pointer'}`}>Style</button>
          <button onClick={() => handleModeSwitch('code')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${editorMode === 'code' ? 'bg-[#1e212b] text-white shadow-sm border border-white/10' : 'text-slate-500 hover:text-slate-300 cursor-pointer'}`}>Code</button>
        </div>
      </div>

      {/* 🗂️ BODY CONTAINER */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        
        {!activeItemData ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#0a0a0a]/30">
            <div className="relative mb-6">
               <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
               <button 
                 onClick={() => setIsInspectMode(true)} 
                 className={`relative w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-2xl cursor-pointer ${isInspectMode ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_30px_rgba(99,102,241,0.6)]' : 'bg-[#12141c] border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/20 hover:scale-105 hover:border-indigo-400'}`}
               >
                 <i className={`bi bi-cursor-fill text-3xl ${isInspectMode ? 'animate-bounce' : ''}`}></i>
               </button>
            </div>
            <h3 className="text-xs font-extrabold text-white tracking-widest uppercase mb-2">Target Element</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-[220px]">
              {isInspectMode ? "Click any element on the canvas to inspect its properties." : "Click the target button above to activate the inspector tool."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto custom-scrollbar relative px-4 pt-2 pb-6">
              
              {editorMode !== 'code' && pendingRawHtml && !isRawVirtualNode && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <i className="bi bi-exclamation-triangle-fill text-amber-500 text-[10px] mt-0.5"></i>
                  <div>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">HTML Override</p>
                    <p className="text-[9px] text-amber-500/70 mt-0.5 mb-2 leading-tight">Visual properties are hidden.</p>
                    <button onClick={() => setPendingRawHtml('')} className="bg-amber-500 text-[#12141c] text-[9px] font-bold uppercase px-2 py-1 rounded cursor-pointer hover:bg-amber-400 transition-colors">Clear Override</button>
                  </div>
                </div>
              )}

              {isRawVirtualNode && editorMode !== 'code' && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <i className="bi bi-unlock-fill text-emerald-500 text-[10px] mt-0.5"></i>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Deep Node</p>
                    <p className="text-[9px] text-emerald-500/70 mt-0.5 leading-tight">Inspecting nested custom HTML.</p>
                  </div>
                </div>
              )}

              {/* ⚙️ TAB 1: HTML Setup */}
              {editorMode === 'html-props' && (
                <div className="space-y-1 animate-fade-in">
                  <AccordionGroup id="structure" title="Structure" isOpen={accState.structure} onToggle={toggleAcc}>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase flex justify-between mb-1">Custom ID {isRawVirtualNode && <i className="bi bi-lock-fill text-amber-500"></i>}</label>
                        <input type="text" value={pendingCustomId} onChange={(e) => setPendingCustomId(e.target.value)} className={`w-full bg-[#0a0a0a]/50 border border-white/10 rounded px-2 py-1.5 text-[11px] font-mono text-white focus:border-indigo-500 outline-none transition-all ${isRawVirtualNode ? 'opacity-50' : ''}`} placeholder="e.g. hero-section" />
                      </div>
                      {!isRawVirtualNode && (
                        <>
                          <div>
                            <label className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase mb-1 block">Parent Container</label>
                            <select value={pendingParentId || ''} onChange={(e) => setPendingParentId(e.target.value || null)} className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded px-2 py-1.5 text-[11px] text-white focus:border-indigo-500 outline-none appearance-none cursor-pointer">
                              <option value="">[Root Document Base]</option>
                              {availableContainers.map(c => (<option key={c.id} value={c.id}>{c.customId ? `<${c.type}> #${c.customId}` : `<${c.type}>`}</option>))}
                            </select>
                          </div>
                          {siblings.length > 1 && (
                            <div className="flex gap-2">
                              <button onClick={() => onMoveItem(selectedElementId, 'up')} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold text-slate-300 transition-colors cursor-pointer border border-white/5"><i className="bi bi-arrow-up"></i> Up</button>
                              <button onClick={() => onMoveItem(selectedElementId, 'down')} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold text-slate-300 transition-colors cursor-pointer border border-white/5"><i className="bi bi-arrow-down"></i> Down</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </AccordionGroup>

                  <AccordionGroup id="content" title="Content" isOpen={accState.content} onToggle={toggleAcc}>
                    <div className="space-y-3">
                      {!isMedia && (!isContainer || isRawVirtualNode) && (
                        <div><label className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase mb-1 block">Inner Text</label><textarea value={pendingText} onChange={(e) => setPendingText(e.target.value)} className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded px-2 py-1.5 text-[11px] text-white focus:border-indigo-500 outline-none min-h-[60px] custom-scrollbar transition-all" /></div>
                      )}
                      {isMedia && (<div><label className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase mb-1 block">Image / Media URL</label><input type="text" value={pendingSrc} onChange={(e) => setPendingSrc(e.target.value)} className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded px-2 py-1.5 text-[11px] text-white focus:border-indigo-500 outline-none" /></div>)}
                      {isLink && (<div><label className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase mb-1 block">Link Target (href)</label><input type="text" value={pendingHref} onChange={(e) => setPendingHref(e.target.value)} className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded px-2 py-1.5 text-[11px] text-white focus:border-indigo-500 outline-none" /></div>)}
                    </div>
                  </AccordionGroup>

                  <AccordionGroup id="attributes" title="Attributes & ARIA" isOpen={accState.attributes} onToggle={toggleAcc}>
                    <div className="space-y-3">
                      {Object.entries(pendingAttributes).map(([key, val]) => (
                        <div key={key} className="flex gap-2 group relative">
                           <input type="text" value={key} readOnly className="w-1/3 bg-transparent text-[10px] text-slate-500 font-mono outline-none" title={key} />
                           <input type="text" value={val} onChange={(e) => handleUpdateAttribute(key, e.target.value)} className="flex-1 bg-[#0a0a0a]/50 border border-white/10 rounded px-2 py-1.5 text-[10px] font-mono text-white focus:border-indigo-500 outline-none transition-all" />
                           <button onClick={() => handleRemoveAttribute(key)} className="w-6 h-6 opacity-0 group-hover:opacity-100 bg-red-500/10 text-red-500 rounded flex items-center justify-center cursor-pointer hover:bg-red-500 hover:text-white transition-all shrink-0"><i className="bi bi-trash-fill text-[10px]"></i></button>
                        </div>
                      ))}
                      {Object.keys(pendingAttributes).length === 0 && (<p className="text-[9px] text-slate-500 uppercase tracking-widest">No attributes assigned</p>)}

                      <div className="pt-3 border-t border-white/5 space-y-2">
                         <div className="flex gap-2">
                           <input list="html-attr-list" value={newAttrName} onChange={(e) => setNewAttrName(e.target.value)} placeholder="Name (e.g. aria-label)" className="w-1/2 bg-[#0a0a0a]/50 border border-white/10 rounded px-2 py-1.5 text-[10px] font-mono text-white focus:border-indigo-500 outline-none" />
                           <datalist id="html-attr-list">{applicableAttributes.map(attr => <option key={attr} value={attr} />)}</datalist>
                           <input type="text" value={newAttrValue} onChange={(e) => setNewAttrValue(e.target.value)} placeholder="Value" className="w-1/2 bg-[#0a0a0a]/50 border border-white/10 rounded px-2 py-1.5 text-[10px] font-mono text-white focus:border-indigo-500 outline-none" onKeyDown={(e) => { if (e.key === 'Enter') handleAddAttribute(); }} />
                         </div>
                         <button onClick={handleAddAttribute} disabled={!newAttrName.trim()} className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded transition-all cursor-pointer disabled:opacity-50"><i className="bi bi-plus"></i> Add Attribute</button>
                      </div>
                    </div>
                  </AccordionGroup>
                </div>
              )}

              {/* 🎨 TAB 2: CSS Styles */}
              {editorMode === 'css-props' && (
                <div className="flex flex-col h-full animate-fade-in relative -mt-2">
                  
                  {/* ✨ CSS CONTROL HEADER */}
                  <div className="sticky top-0 z-30 bg-[#1b1d25] pt-2 pb-3 px-1 border-b border-white/10 shadow-md">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex flex-1 bg-black/50 p-1 rounded-lg border border-white/5 shadow-inner">
                        <button onClick={() => setBreakpoint('desktop')} className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer capitalize ${breakpoint === 'desktop' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><i className="bi bi-pc-display"></i> Desk</button>
                        <button onClick={() => setBreakpoint('tablet')} className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer capitalize ${breakpoint === 'tablet' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><i className="bi bi-tablet"></i> Tab</button>
                        <button onClick={() => setBreakpoint('mobile')} className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer capitalize ${breakpoint === 'mobile' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><i className="bi bi-phone"></i> Mob</button>
                      </div>
                      
                      {/* ✨ FIX: Corrected Hover toggle logic */}
                      <button 
                        onClick={() => setPseudoState(p => p === 'normal' ? 'hover' : 'normal')} 
                        className={`px-3 py-1 h-[26px] rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${pseudoState === 'hover' ? 'bg-pink-600 text-white border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.4)]' : 'bg-black/50 text-slate-500 border-white/5 hover:text-white hover:bg-white/5'}`}
                      >
                         <i className="bi bi-cursor-fill"></i> Hover
                      </button>
                    </div>

                    <div className="relative">
                      <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]"></i>
                      <input 
                        type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                        placeholder="Search css properties..." 
                        className="w-full bg-[#0a0a0a]/80 border border-white/10 text-slate-200 rounded-lg pl-8 pr-8 py-1.5 text-[11px] focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                      />
                      {searchTerm && (<button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"><i className="bi bi-x-circle-fill text-[10px]"></i></button>)}
                    </div>
                  </div>

                  {/* MASSIVE 130+ CSS Accordions List */}
                  <div className="space-y-0.5 pt-2">
                    <AccordionGroup id="layout" title="Layout & Position" isOpen={accState.layout} onToggle={toggleAcc} searchTerm={searchTerm} keywords="display position top right bottom left zindex float clear visibility overflow boxsizing clippath objectfit isolation">
                      <div className="grid grid-cols-2 gap-3">
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
                        {_S('Overflow', 'overflow', ['visible', 'hidden', 'scroll', 'auto', 'clip'])}
                        {_S('Overflow X', 'overflowX', ['visible', 'hidden', 'scroll', 'auto'])}
                        {_S('Overflow Y', 'overflowY', ['visible', 'hidden', 'scroll', 'auto'])}
                        {_S('Box Sizing', 'boxSizing', ['border-box', 'content-box'])}
                        {_F('Clip Path', 'clipPath', 'circle(50%)')}
                        {_S('Object Fit', 'objectFit', ['fill', 'contain', 'cover', 'none', 'scale-down'])}
                        {_F('Object Position', 'objectPosition', 'center')}
                        {_S('Isolation', 'isolation', ['auto', 'isolate'])}
                      </div>
                    </AccordionGroup>

                    <AccordionGroup id="spacing" title="Spacing & Size" isOpen={accState.spacing} onToggle={toggleAcc} searchTerm={searchTerm} keywords="width height minwidth maxwidth minheight maxheight padding margin">
                      <div className="grid grid-cols-2 gap-3">
                        {_F('Width', 'width', 'auto')}
                        {_F('Height', 'height', 'auto')}
                        {_F('Min W', 'minWidth')}
                        {_F('Max W', 'maxWidth')}
                        {_F('Min H', 'minHeight')}
                        {_F('Max H', 'maxHeight')}
                        {_F('Pad (All)', 'padding')}
                        {_F('Pad Top', 'paddingTop')}
                        {_F('Pad Right', 'paddingRight')}
                        {_F('Pad Bottom', 'paddingBottom')}
                        {_F('Pad Left', 'paddingLeft')}
                        {_F('Marg (All)', 'margin')}
                        {_F('Marg Top', 'marginTop')}
                        {_F('Marg Right', 'marginRight')}
                        {_F('Marg Bottom', 'marginBottom')}
                        {_F('Marg Left', 'marginLeft')}
                      </div>
                    </AccordionGroup>

                    <AccordionGroup id="flexbox" title="Flexbox Engine" isOpen={accState.flexbox} onToggle={toggleAcc} searchTerm={searchTerm} keywords="flex direction flexdirection wrap flexwrap justifycontent alignitems aligncontent flexgrow flexshrink flexbasis alignself order">
                      <div className="grid grid-cols-2 gap-3">
                        {_S('Direction', 'flexDirection', ['row', 'row-reverse', 'column', 'column-reverse'])}
                        {_S('Wrap', 'flexWrap', ['nowrap', 'wrap', 'wrap-reverse'])}
                        {_S('Justify', 'justifyContent', ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'])}
                        {_S('Align Items', 'alignItems', ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'])}
                        {_S('Align Content', 'alignContent', ['stretch', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around'])}
                        {_F('Gap', 'gap', '10px')}
                        {_F('Flex (Short)', 'flex', '1 1 auto')}
                        {_F('Flex Grow', 'flexGrow', '0')}
                        {_F('Flex Shrink', 'flexShrink', '1')}
                        {_F('Flex Basis', 'flexBasis', 'auto')}
                        {_S('Align Self', 'alignSelf', ['auto', 'stretch', 'flex-start', 'flex-end', 'center', 'baseline'])}
                        {_F('Order', 'order', '0')}
                      </div>
                    </AccordionGroup>

                    <AccordionGroup id="grid" title="Grid Template" isOpen={accState.grid} onToggle={toggleAcc} searchTerm={searchTerm} keywords="grid template columns rows areas gap rowgap columngap gridcolumn gridrow gridarea justifyitems placeitems justifyself placeself">
                      <div className="grid grid-cols-2 gap-3">
                        {_F('Grid (Short)', 'grid')}
                        {_F('Temp Cols', 'gridTemplateColumns', '1fr 1fr')}
                        {_F('Temp Rows', 'gridTemplateRows')}
                        {_F('Auto Cols', 'gridAutoColumns')}
                        {_F('Auto Rows', 'gridAutoRows')}
                        {_S('Auto Flow', 'gridAutoFlow', ['row', 'column', 'dense', 'row dense', 'column dense'])}
                        {_F('Gap', 'gap', '16px')}
                        {_F('Row Gap', 'rowGap')}
                        {_F('Col Gap', 'columnGap')}
                        {_F('Grid Col', 'gridColumn')}
                        {_F('Grid Row', 'gridRow')}
                        {_F('Grid Area', 'gridArea')}
                        {_S('Justify Items', 'justifyItems', ['stretch', 'start', 'end', 'center'])}
                        {_S('Align Items', 'alignItems', ['stretch', 'start', 'end', 'center'])}
                        {_S('Place Items', 'placeItems', ['center', 'stretch'])}
                        {_S('Justify Self', 'justifySelf', ['stretch', 'start', 'end', 'center'])}
                        {_S('Align Self', 'alignSelf', ['stretch', 'start', 'end', 'center'])}
                        {_S('Place Self', 'placeSelf', ['center', 'stretch'])}
                      </div>
                    </AccordionGroup>

                    <AccordionGroup id="typography" title="Typography" isOpen={accState.typography} onToggle={toggleAcc} searchTerm={searchTerm} keywords="fontfamily fontsize fontweight fontstyle color lineheight letterspacing wordspacing textalign texttransform textdecoration textindent textshadow textoverflow whitespace wordbreak writingmode fontvariant">
                      <div className="grid grid-cols-2 gap-3">
                        {_F('Family', 'fontFamily', 'sans-serif')}
                        {_F('Size', 'fontSize', '16px')}
                        {_S('Weight', 'fontWeight', ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'])}
                        {_S('Style', 'fontStyle', ['normal', 'italic', 'oblique'])}
                        {_S('Variant', 'fontVariant', ['normal', 'small-caps'])}
                        {_C('Color', 'color')}
                        {_F('Line Height', 'lineHeight', '1.5')}
                        {_F('Letter Space', 'letterSpacing', 'normal')}
                        {_F('Word Space', 'wordSpacing')}
                        {_S('Align', 'textAlign', ['left', 'right', 'center', 'justify'])}
                        {_S('Transform', 'textTransform', ['none', 'capitalize', 'uppercase', 'lowercase'])}
                        {_S('Decoration', 'textDecoration', ['none', 'underline', 'overline', 'line-through'])}
                        {_C('Decor Color', 'textDecorationColor')}
                        {_S('Decor Style', 'textDecorationStyle', ['solid', 'double', 'dotted', 'dashed', 'wavy'])}
                        {_F('Indent', 'textIndent')}
                        {_F('Shadow', 'textShadow', '1px 1px 2px #000')}
                        {_S('Overflow', 'textOverflow', ['clip', 'ellipsis'])}
                        {_S('White Space', 'whiteSpace', ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line'])}
                        {_S('Word Break', 'wordBreak', ['normal', 'break-all', 'keep-all', 'break-word'])}
                        {_S('Writing Mode', 'writingMode', ['horizontal-tb', 'vertical-rl', 'vertical-lr'])}
                        {_S('Direction', 'direction', ['ltr', 'rtl'])}
                      </div>
                    </AccordionGroup>

                    <AccordionGroup id="backgrounds" title="Backgrounds" isOpen={accState.backgrounds} onToggle={toggleAcc} searchTerm={searchTerm} keywords="backgroundcolor backgroundimage background backgroundrepeat backgroundattachment backgroundposition backgroundsize backgroundclip backgroundblendmode">
                      <div className="grid grid-cols-2 gap-3">
                        {_C('Bg Color', 'backgroundColor')}
                        {_F('Bg Image', 'backgroundImage', 'url(...)')}
                        {_S('Bg Size', 'backgroundSize', ['cover', 'contain', 'auto', '100% 100%'])}
                        {_F('Bg Position', 'backgroundPosition', 'center')}
                        {_S('Bg Repeat', 'backgroundRepeat', ['repeat', 'no-repeat', 'repeat-x', 'repeat-y', 'space', 'round'])}
                        {_S('Bg Attachment', 'backgroundAttachment', ['scroll', 'fixed', 'local'])}
                        {_S('Bg Clip', 'backgroundClip', ['border-box', 'padding-box', 'content-box', 'text'])}
                        {_S('Bg Origin', 'backgroundOrigin', ['border-box', 'padding-box', 'content-box'])}
                        {_S('Blend Mode', 'backgroundBlendMode', ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'])}
                      </div>
                    </AccordionGroup>

                    <AccordionGroup id="borders" title="Borders & Outlines" isOpen={accState.borders} onToggle={toggleAcc} searchTerm={searchTerm} keywords="border borderradius borderwidth borderstyle bordercolor bordertop borderright borderbottom borderleft outline outlineoffset outlinestyle outlinewidth outlinecolor">
                      <div className="grid grid-cols-2 gap-3">
                        {_F('Border (Short)', 'border', '1px solid #000')}
                        {_F('Width', 'borderWidth')}
                        {_S('Style', 'borderStyle', ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'])}
                        {_C('Color', 'borderColor')}
                        {_F('Radius (All)', 'borderRadius', '8px')}
                        {_F('Top', 'borderTop')}
                        {_F('Right', 'borderRight')}
                        {_F('Bottom', 'borderBottom')}
                        {_F('Left', 'borderLeft')}
                        {_F('Outline', 'outline', 'none')}
                        {_F('Outline W.', 'outlineWidth')}
                        {_S('Outline S.', 'outlineStyle', ['none', 'solid', 'dashed', 'dotted'])}
                        {_C('Outline C.', 'outlineColor')}
                        {_F('Out. Offset', 'outlineOffset', '2px')}
                      </div>
                    </AccordionGroup>

                    <AccordionGroup id="effects" title="Effects & Blends" isOpen={accState.effects} onToggle={toggleAcc} searchTerm={searchTerm} keywords="boxshadow opacity filter backdropfilter mixblendmode">
                      <div className="grid grid-cols-2 gap-3">
                        {_F('Opacity', 'opacity', '1')}
                        {_F('Box Shadow', 'boxShadow', '0 4px 6px rgba(0,0,0,0.1)')}
                        {_F('Filter', 'filter', 'blur(4px) drop-shadow(...)')}
                        {_F('Backdrop', 'backdropFilter', 'blur(10px)')}
                        {_S('Mix Blend', 'mixBlendMode', ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'])}
                      </div>
                    </AccordionGroup>

                    <AccordionGroup id="animation" title="Transform & Animation" isOpen={accState.animation} onToggle={toggleAcc} searchTerm={searchTerm} keywords="transition transitionproperty transitionduration transitiontimingfunction transitiondelay transform transformorigin transformstyle perspective backfacevisibility animation">
                      <div className="grid grid-cols-2 gap-3">
                        {_F('Transform', 'transform', 'scale(1.05) rotate(45deg)')}
                        {_F('Origin', 'transformOrigin', 'center')}
                        {_S('Style', 'transformStyle', ['flat', 'preserve-3d'])}
                        {_F('Perspective', 'perspective', '1000px')}
                        {_F('Persp Origin', 'perspectiveOrigin', '50% 50%')}
                        {_S('Backface Vis', 'backfaceVisibility', ['visible', 'hidden'])}
                        {_F('Transition', 'transition', 'all 0.3s ease')}
                        {_F('Tr. Property', 'transitionProperty', 'all')}
                        {_F('Tr. Duration', 'transitionDuration', '0.3s')}
                        {_F('Tr. Timing', 'transitionTimingFunction', 'ease')}
                        {_F('Tr. Delay', 'transitionDelay', '0s')}
                        {_F('Animation', 'animation', 'spin 1s linear infinite')}
                        {_F('Anim Name', 'animationName')}
                        {_F('Anim Dur', 'animationDuration')}
                        {_F('Anim Timing', 'animationTimingFunction')}
                        {_F('Anim Delay', 'animationDelay')}
                        {_F('Anim Count', 'animationIterationCount', 'infinite')}
                        {_S('Anim Dir', 'animationDirection', ['normal', 'reverse', 'alternate', 'alternate-reverse'])}
                        {_S('Anim Fill', 'animationFillMode', ['none', 'forwards', 'backwards', 'both'])}
                        {_S('Anim Play', 'animationPlayState', ['running', 'paused'])}
                      </div>
                    </AccordionGroup>

                    <AccordionGroup id="lists" title="Lists & Tables" isOpen={accState.lists} onToggle={toggleAcc} searchTerm={searchTerm} keywords="liststyle liststyletype liststyleposition liststyleimage bordercollapse borderspacing tablelayout emptycells captionside">
                      <div className="grid grid-cols-2 gap-3">
                        {_F('List Style', 'listStyle')}
                        {_S('Style Type', 'listStyleType', ['disc', 'circle', 'square', 'decimal', 'lower-alpha', 'upper-alpha', 'lower-roman', 'upper-roman', 'none'])}
                        {_S('Position', 'listStylePosition', ['inside', 'outside'])}
                        {_F('Image', 'listStyleImage', 'url(...)')}
                        {_S('B. Collapse', 'borderCollapse', ['collapse', 'separate'])}
                        {_F('B. Spacing', 'borderSpacing')}
                        {_S('T. Layout', 'tableLayout', ['auto', 'fixed'])}
                        {_S('Empty Cells', 'emptyCells', ['show', 'hide'])}
                        {_S('Caption Side', 'captionSide', ['top', 'bottom'])}
                      </div>
                    </AccordionGroup>

                    <AccordionGroup id="ui" title="UI & Interaction" isOpen={accState.ui} onToggle={toggleAcc} searchTerm={searchTerm} keywords="cursor pointerevents userselect resize appearance caretcolor accentcolor scrollbehavior scrollmargin scrollpadding scrollsnaptype">
                      <div className="grid grid-cols-2 gap-3">
                         {_S('Cursor', 'cursor', ['auto', 'pointer', 'text', 'crosshair', 'move', 'not-allowed', 'zoom-in', 'zoom-out'])}
                         {_S('Pointer Events', 'pointerEvents', ['auto', 'none'])}
                         {_S('User Select', 'userSelect', ['auto', 'none', 'text', 'all'])}
                         {_S('Resize', 'resize', ['none', 'both', 'horizontal', 'vertical'])}
                         {_S('Appearance', 'appearance', ['none', 'auto'])}
                         {_C('Caret Color', 'caretColor')}
                         {_C('Accent Color', 'accentColor')}
                         {_S('Scroll Behav', 'scrollBehavior', ['auto', 'smooth'])}
                         {_F('Scroll Marg', 'scrollMargin')}
                         {_F('Scroll Pad', 'scrollPadding')}
                         {_S('Snap Type', 'scrollSnapType', ['none', 'x mandatory', 'y mandatory', 'both mandatory'])}
                         {_S('Snap Align', 'scrollSnapAlign', ['none', 'start', 'end', 'center'])}
                      </div>
                    </AccordionGroup>

                    <AccordionGroup id="svg" title="SVG Properties" isOpen={accState.svg} onToggle={toggleAcc} searchTerm={searchTerm} keywords="fill stroke strokewidth strokedasharray strokelinecap strokelinejoin">
                      <div className="grid grid-cols-2 gap-3">
                         {_C('Fill Color', 'fill')}
                         {_C('Stroke Color', 'stroke')}
                         {_F('Stroke Width', 'strokeWidth')}
                         {_F('Dash Array', 'strokeDasharray')}
                         {_F('Dash Offset', 'strokeDashoffset')}
                         {_S('Line Cap', 'strokeLinecap', ['butt', 'round', 'square'])}
                         {_S('Line Join', 'strokeLinejoin', ['miter', 'round', 'bevel'])}
                      </div>
                    </AccordionGroup>

                  </div>
                </div>
              )}

              {/* 💻 TAB 3: Raw Code Editors */}
              {editorMode === 'code' && (
                <div className="flex flex-col h-full animate-fade-in relative pt-1">
                  <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5 mb-3 shrink-0">
                    <button onClick={() => handleCodeTabSwitch('css')} className={`flex-1 py-1.5 text-[9px] uppercase tracking-widest font-bold rounded transition-all cursor-pointer ${codeTab === 'css' ? 'bg-[#1e212b] text-pink-400 border border-white/10 shadow-sm' : 'text-slate-500 hover:text-white border border-transparent'}`}>CSS Styles</button>
                    <button onClick={() => handleCodeTabSwitch('html')} disabled={isRawVirtualNode} className={`flex-1 py-1.5 text-[9px] uppercase tracking-widest font-bold rounded transition-all ${isRawVirtualNode ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${codeTab === 'html' ? 'bg-[#1e212b] text-emerald-400 border border-white/10 shadow-sm' : 'text-slate-500 hover:text-white border border-transparent'}`}>HTML Override</button>
                  </div>

                  {codeTab === 'css' ? (
                    <div className="flex flex-col flex-1 min-h-0">
                      <div className="flex items-center gap-2 mb-2 bg-black/20 border border-white/5 p-1 rounded-lg shrink-0">
                        <div className="flex-1 flex gap-1">
                          {['desktop', 'tablet', 'mobile'].map(bp => (
                            <button key={bp} onClick={() => setBreakpoint(bp)} className={`flex-1 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${breakpoint === bp ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}>{bp.charAt(0)}</button>
                          ))}
                        </div>
                        <button onClick={() => setPseudoState(p => p === 'normal' ? 'hover' : 'normal')} className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${pseudoState === 'hover' ? 'bg-pink-500 text-white' : 'bg-transparent text-slate-500 hover:text-white'}`}>
                          Hov
                        </button>
                      </div>
                      <textarea value={rawCss} onChange={(e) => setRawCss(e.target.value)} className="w-full flex-1 min-h-[250px] bg-[#0a0a0a] text-pink-400 font-mono text-[11px] p-4 rounded-lg border border-white/10 focus:outline-none focus:border-pink-500 custom-scrollbar shadow-inner" spellCheck="false" placeholder="/* Custom CSS */" />
                    </div>
                  ) : (
                    <textarea value={pendingRawHtml} onChange={(e) => setPendingRawHtml(e.target.value)} className="w-full flex-1 min-h-[300px] bg-[#0a0a0a] text-emerald-400 font-mono text-[11px] p-4 rounded-lg border border-white/10 focus:outline-none focus:border-emerald-500 custom-scrollbar shadow-inner" spellCheck="false" placeholder="<!-- HTML Override -->" />
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 🚀 BOTTOM APPLY BUTTON */}
      {activeItemData && (
        <div className="p-4 bg-gradient-to-t from-[#12141c] to-[#12141c]/80 shrink-0 z-20 border-t border-white/5">
          <button 
            onClick={handleExecute} 
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] uppercase tracking-widest rounded-lg shadow-[0_4px_15px_rgba(79,70,229,0.4)] hover:shadow-[0_4px_25px_rgba(79,70,229,0.6)] cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <i className="bi bi-magic"></i> Apply Changes
          </button>
        </div>
      )}
    </div>
  );
}