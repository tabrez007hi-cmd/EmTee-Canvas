import React, { useState, useEffect } from 'react';

// CSS Translation Engine
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

  if (isMinimized) {
    return (
      <button onClick={() => setIsMinimized(false)} className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-slate-900 border border-slate-700 text-indigo-400 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center justify-center hover:scale-105 hover:bg-slate-800 transition-all cursor-pointer">
        <i className="bi bi-sliders text-base"></i>
      </button>
    );
  }

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
      text: pendingText,
      styles: finalStyles,
      tabletStyles: finalTablet,
      mobileStyles: finalMobile,
      customId: pendingCustomId,
      parentId: pendingParentId,
      src: pendingSrc,
      href: pendingHref,
      rawHtml: pendingRawHtml
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-fade-in text-slate-200">
      
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
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

      <div className="flex-1 p-4 space-y-6 overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-900">
        {!activeItemData ? (
          <div className="text-center py-12 text-xs text-slate-500 space-y-2">
            <i className="bi bi-diagram-3 text-4xl text-indigo-500/30 block mb-4"></i>
            <p className="font-bold text-slate-400">Builder Node Inspector</p>
            <p className="text-[10px] px-2 leading-relaxed">Select a layer from the DOM Tree or click an element dynamically.</p>
          </div>
        ) : (
          <>
            {pendingRawHtml && !isRawVirtualNode && editorMode !== 'html' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2 mb-4 animate-fade-in">
                <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                  <i className="bi bi-exclamation-triangle-fill"></i> Full HTML Mode Active
                </div>
                <p className="text-[10px] text-amber-500/80 leading-tight">
                  Visual settings are currently being ignored because custom HTML is overriding this element block.
                </p>
                <button onClick={() => setPendingRawHtml('')} className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 text-[10px] font-bold py-1.5 px-2 rounded-lg transition-colors w-full cursor-pointer">
                  Clear Custom HTML & Reset
                </button>
              </div>
            )}

            {isRawVirtualNode && editorMode === 'visual' && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 space-y-1.5 mb-4 animate-fade-in">
                <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  <i className="bi bi-unlock-fill drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]"></i> Deep Node Unlocked
                </div>
                <p className="text-[10px] text-emerald-300/80 leading-tight">
                  You are inspecting a nested template element. You can now freely edit its text, ID, and styles directly!
                </p>
              </div>
            )}

            <div className="space-y-3 bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50 overflow-hidden">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5"><i className="bi bi-link-45deg text-sm"></i> Structure Tree</h4>
              <div>
                <label className="text-[11px] text-slate-400 mb-1 font-bold flex justify-between">
                  Unique Custom ID
                  {isRawVirtualNode && <span className="text-[9px] text-amber-500 font-bold"><i className="bi bi-lock-fill"></i> Locked</span>}
                </label>
                <input type="text" value={pendingCustomId} onChange={(e) => setPendingCustomId(e.target.value)} className={`w-full border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono bg-slate-950 focus:outline-none focus:border-indigo-500 transition-colors ${isRawVirtualNode ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''}`} placeholder="e.g. hero-container" />
              </div>
              {!isRawVirtualNode && (
                <>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block font-bold">Assign Parent Container</label>
                    <select value={pendingParentId || ''} onChange={(e) => setPendingParentId(e.target.value || null)} className="w-full border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 bg-slate-950 transition-colors cursor-pointer truncate">
                      <option value="">[Root Document Base]</option>
                      {availableContainers.map(container => (
                        <option key={container.id} value={container.id}>{container.customId ? `<${container.type}> #${container.customId}` : `<${container.type}> (${container.id.substring(0, 10)})`}</option>
                      ))}
                    </select>
                  </div>
                  {siblings.length > 1 && (
                    <div className="pt-3 mt-3 border-t border-slate-700">
                      <label className="text-[11px] text-slate-400 mb-2 block font-bold">Element Position (Order)</label>
                      <div className="flex items-center gap-2">
                        <button onClick={() => onMoveItem(selectedElementId, 'up')} className="flex-1 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white shadow-sm active:scale-95 transition-all cursor-pointer"><i className="bi bi-arrow-up"></i> Up</button>
                        <button onClick={() => onMoveItem(selectedElementId, 'down')} className="flex-1 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white shadow-sm active:scale-95 transition-all cursor-pointer"><i className="bi bi-arrow-down"></i> Down</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 3-Way Mode Switcher */}
            <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
              <button onClick={() => handleModeSwitch('visual')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${editorMode === 'visual' ? 'bg-indigo-600 shadow-sm text-white' : 'text-slate-500 hover:text-white cursor-pointer'}`}>
                <i className="bi bi-palette"></i> Visual
              </button>
              <button onClick={() => handleModeSwitch('code')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${editorMode === 'code' ? 'bg-indigo-600 shadow-sm text-white' : 'text-slate-500 hover:text-white'}`}>
                <i className="bi bi-filetype-css"></i> CSS
              </button>
              <button disabled={isRawVirtualNode} onClick={() => handleModeSwitch('html')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${isRawVirtualNode ? 'opacity-40 cursor-not-allowed text-slate-600' : (editorMode === 'html' ? 'bg-indigo-600 shadow-sm text-white' : 'text-slate-500 hover:text-white cursor-pointer')}`}>
                <i className="bi bi-code-slash"></i> HTML
              </button>
            </div>

            {/* Editing Views */}
            {editorMode === 'html' ? (
              <div className="space-y-3 animate-fade-in">
                <p className="text-[10px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                  <i className="bi bi-info-circle-fill text-indigo-500 mr-1"></i> Write raw HTML. This completely overrides the visual editor and child elements for this specific node.
                </p>
                <textarea 
                  value={pendingRawHtml} onChange={(e) => setPendingRawHtml(e.target.value)}
                  className="w-full h-80 bg-slate-950 text-emerald-400 font-mono text-[11px] p-4 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 leading-relaxed custom-scrollbar shadow-inner transition-colors" spellCheck="false"
                />
              </div>
            ) : editorMode === 'code' ? (
              <div className="space-y-3 animate-fade-in">
                <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 mb-2 shrink-0">
                  <button onClick={() => setBreakpoint('desktop')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${breakpoint==='desktop'?'bg-slate-800 shadow text-indigo-400':'text-slate-500 hover:text-white'}`}>Base</button>
                  <button onClick={() => setBreakpoint('tablet')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${breakpoint==='tablet'?'bg-slate-800 shadow text-indigo-400':'text-slate-500 hover:text-white'}`}>Tablet</button>
                  <button onClick={() => setBreakpoint('mobile')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${breakpoint==='mobile'?'bg-slate-800 shadow text-indigo-400':'text-slate-500 hover:text-white'}`}>Mobile</button>
                </div>
                <textarea 
                  value={rawCss} onChange={(e) => setRawCss(e.target.value)}
                  className="w-full h-80 bg-slate-950 text-pink-400 font-mono text-[11px] p-4 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 leading-relaxed custom-scrollbar shadow-inner transition-colors" spellCheck="false"
                />
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in opacity-100">
                <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 mb-2 shrink-0">
                  <button onClick={() => setBreakpoint('desktop')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${breakpoint==='desktop'?'bg-slate-800 shadow text-indigo-400 border border-slate-700':'text-slate-500 hover:text-white'}`}>Base</button>
                  <button onClick={() => setBreakpoint('tablet')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${breakpoint==='tablet'?'bg-slate-800 shadow text-indigo-400 border border-slate-700':'text-slate-500 hover:text-white'}`}>Tablet</button>
                  <button onClick={() => setBreakpoint('mobile')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${breakpoint==='mobile'?'bg-slate-800 shadow text-indigo-400 border border-slate-700':'text-slate-500 hover:text-white'}`}>Mobile</button>
                </div>

                <div className="space-y-6">
                  {/* Content Attributes */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Content</h4>
                    {!isMedia && (!isContainer || isRawVirtualNode) && (
                      <div>
                        <label className="text-[11px] text-slate-400 mb-1 block font-bold">Inner Display Label / Text</label>
                        <textarea 
                          value={pendingText} 
                          onChange={(e) => setPendingText(e.target.value)} 
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 min-h-[40px] custom-scrollbar transition-colors" 
                        />
                      </div>
                    )}
                    {isMedia && (
                      <div>
                        <label className="text-[11px] text-slate-400 mb-1 block font-bold">Media / Embed URL (src)</label>
                        <input type="text" value={pendingSrc} onChange={(e) => setPendingSrc(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors" placeholder="https://..." />
                      </div>
                    )}
                    {isLink && (
                      <div>
                        <label className="text-[11px] text-slate-400 mb-1 block font-bold">Link Destination (href)</label>
                        <input type="text" value={pendingHref} onChange={(e) => setPendingHref(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors" placeholder="https://..." />
                      </div>
                    )}
                  </div>

                  <hr className="border-slate-800" />

                  {/* Size & Space */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Size & Space</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 mb-1 block font-bold">Width</label>
                        <input type="text" value={getStyleVal('width')} onChange={(e) => handleStyleFieldChange('width', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-emerald-400 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none" placeholder="auto, 100%" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 mb-1 block font-bold">Height</label>
                        <input type="text" value={getStyleVal('height')} onChange={(e) => handleStyleFieldChange('height', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-emerald-400 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none" placeholder="auto, 100px" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 mb-1 block font-bold">Padding</label>
                        <input type="text" value={getStyleVal('padding')} onChange={(e) => handleStyleFieldChange('padding', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-emerald-400 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none" placeholder="10px 20px" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 mb-1 block font-bold">Margin</label>
                        <input type="text" value={getStyleVal('margin')} onChange={(e) => handleStyleFieldChange('margin', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-emerald-400 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none" placeholder="0 auto" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 mb-1 block font-bold">Overflow</label>
                        <select value={getStyleVal('overflow')} onChange={(e) => handleStyleFieldChange('overflow', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-emerald-300 rounded-lg px-3 py-2 text-xs font-bold focus:border-indigo-500 outline-none cursor-pointer">
                          <option value="">Inherit</option><option value="visible">Visible</option><option value="hidden">Hidden</option><option value="scroll">Scroll</option><option value="auto">Auto</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-800" />

                  {/* Display Engine */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Display</h4>
                    <div>
                      <select value={getStyleVal('display')} onChange={(e) => handleStyleFieldChange('display', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-indigo-300 rounded-lg px-3 py-2 text-xs font-bold focus:border-indigo-500 outline-none cursor-pointer">
                        <option value="">Inherit Display</option>
                        <option value="block">Block</option>
                        <option value="inline-block">Inline Block</option>
                        <option value="flex">Flexbox</option>
                        <option value="grid">Grid Layout</option>
                        <option value="none">Hidden (None)</option>
                      </select>
                    </div>

                    {(getStyleVal('display') === 'flex' || getStyleVal('display') === 'grid' || (!getStyleVal('display') && pendingStyles.display === 'flex')) && (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-400 mb-1 block font-bold">Direction</label>
                            <select value={getStyleVal('flexDirection')} onChange={(e) => handleStyleFieldChange('flexDirection', e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1.5 text-xs outline-none cursor-pointer">
                              <option value="">Inherit</option><option value="row">Row →</option><option value="column">Column ↓</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-indigo-400 mb-1 block font-bold">Gap</label>
                            <input type="text" value={getStyleVal('gap')} onChange={(e) => handleStyleFieldChange('gap', e.target.value)} className="w-full bg-slate-900 border border-indigo-500/50 text-indigo-300 rounded px-2 py-1.5 text-xs font-mono outline-none focus:border-indigo-400" placeholder="16px" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-400 mb-1 block font-bold">Justify (X)</label>
                            <select value={getStyleVal('justifyContent')} onChange={(e) => handleStyleFieldChange('justifyContent', e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1.5 text-xs outline-none cursor-pointer">
                              <option value="">Inherit</option><option value="flex-start">Start</option><option value="center">Center</option><option value="space-between">Space Between</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 mb-1 block font-bold">Align (Y)</label>
                            <select value={getStyleVal('alignItems')} onChange={(e) => handleStyleFieldChange('alignItems', e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1.5 text-xs outline-none cursor-pointer">
                              <option value="">Inherit</option><option value="flex-start">Start</option><option value="center">Center</option><option value="stretch">Stretch</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <hr className="border-slate-800" />

                  {/* Positioning */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Positioning</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 mb-1 block font-bold">Flow Strategy</label>
                        <select value={getStyleVal('position')} onChange={(e) => handleStyleFieldChange('position', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 cursor-pointer">
                          <option value="">Inherit</option><option value="static">Static</option><option value="relative">Relative</option><option value="absolute">Absolute</option><option value="fixed">Fixed</option><option value="sticky">Sticky</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-indigo-400 mb-1 block font-bold">Z-Index</label>
                        <input type="number" value={getStyleVal('zIndex')} onChange={(e) => handleStyleFieldChange('zIndex', e.target.value)} className="w-full bg-slate-950 border border-indigo-500/50 text-indigo-300 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-indigo-400" placeholder="auto" />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-800" />

                  {/* Typography */}
                  {isTextElement && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Typography</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 mb-1 block font-bold">Font Size</label>
                          <input type="text" value={getStyleVal('fontSize')} onChange={(e) => handleStyleFieldChange('fontSize', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-pink-400 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500" placeholder="16px" />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 mb-1 block font-bold">Line Height</label>
                          <input type="text" value={getStyleVal('lineHeight')} onChange={(e) => handleStyleFieldChange('lineHeight', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-pink-400 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500" placeholder="1.5" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-slate-400 mb-1 block font-bold">Text Color</label>
                          <div className="flex items-center gap-2">
                             <input type="color" value={getStyleVal('color') || '#ffffff'} onChange={(e) => handleStyleFieldChange('color', e.target.value)} className="w-8 h-8 rounded bg-slate-950 border border-slate-700 p-0.5 cursor-pointer shrink-0" />
                             <input type="text" value={getStyleVal('color')} onChange={(e) => handleStyleFieldChange('color', e.target.value)} className="flex-1 min-w-0 bg-slate-950 border border-slate-700 text-pink-400 rounded-lg px-2 py-2 text-xs font-mono outline-none focus:border-indigo-500" placeholder="inherit" />
                          </div>
                        </div>
                        <div className="col-span-2 grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-400 mb-1 block font-bold">Weight</label>
                            <select value={getStyleVal('fontWeight')} onChange={(e) => handleStyleFieldChange('fontWeight', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-pink-300 rounded-lg px-2 py-2 text-xs font-bold focus:border-indigo-500 outline-none cursor-pointer">
                              <option value="">Inherit</option><option value="normal">Normal</option><option value="medium">Medium</option><option value="bold">Bold</option><option value="900">Black</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 mb-1 block font-bold">Align</label>
                            <select value={getStyleVal('textAlign')} onChange={(e) => handleStyleFieldChange('textAlign', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-pink-300 rounded-lg px-2 py-2 text-xs font-bold focus:border-indigo-500 outline-none cursor-pointer">
                              <option value="">Inherit</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justify</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 mb-1 block font-bold">Transform</label>
                            <select value={getStyleVal('textTransform')} onChange={(e) => handleStyleFieldChange('textTransform', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-pink-300 rounded-lg px-2 py-2 text-xs font-bold focus:border-indigo-500 outline-none cursor-pointer">
                              <option value="">None</option><option value="uppercase">UPPERCASE</option><option value="lowercase">lowercase</option><option value="capitalize">Capitalize</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 mb-1 block font-bold">Spacing</label>
                            <input type="text" value={getStyleVal('letterSpacing')} onChange={(e) => handleStyleFieldChange('letterSpacing', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-pink-400 rounded-lg px-2 py-2 text-xs font-mono outline-none focus:border-indigo-500" placeholder="normal" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isTextElement && <hr className="border-slate-800" />}

                  {/* Visual Effects */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Visual Effects</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 mb-1 block font-bold">Background Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={getStyleVal('backgroundColor') || '#000000'} onChange={(e) => handleStyleFieldChange('backgroundColor', e.target.value)} className="w-8 h-8 rounded bg-slate-950 border border-slate-700 p-0.5 cursor-pointer shrink-0" />
                          <input type="text" value={getStyleVal('backgroundColor')} onChange={(e) => handleStyleFieldChange('backgroundColor', e.target.value)} className="flex-1 min-w-0 bg-slate-950 border border-slate-700 text-amber-400 rounded-lg px-2 py-2 text-xs font-mono outline-none focus:border-indigo-500" placeholder="transparent" />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 mb-1 block font-bold">Border Details</label>
                        <input type="text" value={getStyleVal('border')} onChange={(e) => handleStyleFieldChange('border', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-amber-400 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500" placeholder="1px solid #000" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 mb-1 block font-bold">Border Radius</label>
                        <input type="text" value={getStyleVal('borderRadius')} onChange={(e) => handleStyleFieldChange('borderRadius', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-amber-400 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500" placeholder="8px, 50%" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 mb-1 block font-bold">Opacity</label>
                        <input type="text" value={getStyleVal('opacity')} onChange={(e) => handleStyleFieldChange('opacity', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-amber-400 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500" placeholder="1 (0 to 1)" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 mb-1 block font-bold">Box Shadow</label>
                        <input type="text" value={getStyleVal('boxShadow')} onChange={(e) => handleStyleFieldChange('boxShadow', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-amber-400 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500" placeholder="0 4px 6px rgba(0,0,0,0.1)" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 mb-1 block font-bold">Filters</label>
                        <input type="text" value={getStyleVal('filter')} onChange={(e) => handleStyleFieldChange('filter', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-amber-400 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500" placeholder="blur(4px)" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 mb-1 block font-bold">Transforms</label>
                        <input type="text" value={getStyleVal('transform')} onChange={(e) => handleStyleFieldChange('transform', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-amber-400 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500" placeholder="scale(1.1)" />
                      </div>
                    </div>
                    {isContainer && (
                      <div className="pt-2">
                        <label className="text-[10px] text-slate-400 mb-1 block font-bold">Background Image URL</label>
                        <input type="text" value={getStyleVal('backgroundImage')} onChange={(e) => handleStyleFieldChange('backgroundImage', e.target.value.includes('url') ? e.target.value : `url('${e.target.value}')`)} className="w-full bg-slate-950 border border-slate-700 text-amber-400 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500" placeholder="url('https://...')" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {activeItemData && (
        <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0 z-50 relative">
          <button onClick={handleExecute} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2">
            <i className="bi bi-save-fill text-lg"></i> Execute Engine
          </button>
        </div>
      )}
    </div>
  );
}