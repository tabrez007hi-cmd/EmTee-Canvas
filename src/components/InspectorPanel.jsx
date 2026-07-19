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

  const availableContainers = layoutItems.filter(item => 
    ['div', 'section', 'navbar', 'sidebar', 'footer'].includes(item.type) && item.id !== selectedElementId
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
      
      // Do not lock out visual mode! Allow visual mode by default unless the block explicitly has raw HTML
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
      <button onClick={() => setIsMinimized(false)} className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-white border border-gray-200 text-indigo-600 rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-all cursor-pointer">
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

  const isTextElement = activeItemData && !['navbar', 'sidebar', 'footer', 'div', 'img'].includes(activeItemData.type);
  const isLayoutBlock = activeItemData && ['div', 'section', 'navbar', 'sidebar', 'footer'].includes(activeItemData.type);
  const isLink = activeItemData && activeItemData.type === 'a';
  const isImg = activeItemData && activeItemData.type === 'img';

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[340px] max-h-[calc(100vh-8rem)] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
      
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsInspectMode(!isInspectMode)} className={`w-7 h-7 rounded-md flex items-center justify-center transition-all border cursor-pointer ${isInspectMode ? 'bg-blue-600 text-white border-blue-600 animate-pulse' : 'bg-white border-gray-200 text-gray-500'}`} title="Select Element Tool">
            <i className="bi bi-cursor-fill text-xs"></i>
          </button>
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide truncate max-w-[160px]">
            {displayTitle}
          </span>
        </div>
        <button onClick={() => setIsMinimized(true)} className="w-6 h-6 text-gray-400 hover:bg-gray-200 rounded flex items-center justify-center cursor-pointer"><i className="bi bi-dash-lg"></i></button>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar bg-white">
        {!activeItemData ? (
          <div className="text-center py-12 text-xs text-gray-400 space-y-2">
            <i className="bi bi-diagram-3 text-3xl text-indigo-200 block mb-3"></i>
            <p className="font-semibold text-gray-500">Builder Node Inspector</p>
            <p className="text-[10px] px-2 leading-relaxed">Select a layer from the DOM Tree or click an element dynamically.</p>
          </div>
        ) : (
          <>
            {/* Visual Overridden Safety Warning - Hide if it is just a Virtual Child! */}
            {pendingRawHtml && !isRawVirtualNode && editorMode !== 'html' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 space-y-2 mb-4 animate-fade-in">
                <div className="flex items-center gap-1.5 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                  <i className="bi bi-exclamation-triangle-fill"></i> Full HTML Mode Active
                </div>
                <p className="text-[10px] text-amber-600 leading-tight">
                  Visual settings are currently being ignored because custom HTML is overriding this element block.
                </p>
                <button onClick={() => setPendingRawHtml('')} className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold py-1 px-2 rounded transition-colors w-full cursor-pointer">
                  Clear Custom HTML & Reset
                </button>
              </div>
            )}

            {/* Info block for Virtual Nodes */}
            {isRawVirtualNode && editorMode === 'visual' && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 space-y-1.5 mb-4 animate-fade-in">
                <div className="flex items-center gap-1.5 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                  <i className="bi bi-info-circle-fill"></i> Deep Template Node
                </div>
                <p className="text-[10px] text-blue-600 leading-tight">
                  You are visually styling an element inside a template block. You can change its colors, spacing, and sizing, but to modify its text or structure, you must edit the parent's HTML.
                </p>
              </div>
            )}

            <div className="space-y-3 bg-indigo-50/40 p-3 rounded-lg border border-indigo-50">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5"><i className="bi bi-link-45deg"></i> Structure & Relational Tree</h4>
              <div>
                <label className="text-[11px] text-gray-600 mb-0.5 block font-medium flex justify-between">
                  Unique Custom ID
                  {isRawVirtualNode && <span className="text-[9px] text-amber-500 font-bold"><i className="bi bi-lock-fill"></i> Locked</span>}
                </label>
                <input type="text" value={pendingCustomId} disabled={isRawVirtualNode} onChange={(e) => setPendingCustomId(e.target.value)} className={`w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-700 font-mono bg-white focus:outline-none focus:border-indigo-500 ${isRawVirtualNode ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`} placeholder="e.g. hero-container" />
              </div>
              {!isRawVirtualNode && (
                <>
                  <div>
                    <label className="text-[11px] text-gray-600 mb-0.5 block font-medium">Assign Parent Container</label>
                    <select value={pendingParentId || ''} onChange={(e) => setPendingParentId(e.target.value || null)} className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-indigo-500 bg-white">
                      <option value="">[Root Document Base]</option>
                      {availableContainers.map(container => (
                        <option key={container.id} value={container.id}>{container.customId ? `<${container.type}> #${container.customId}` : `<${container.type}> (${container.id.substring(0, 10)})`}</option>
                      ))}
                    </select>
                  </div>
                  {siblings.length > 1 && (
                    <div className="pt-3 mt-2 border-t border-indigo-100">
                      <label className="text-[11px] text-gray-600 mb-1 block font-medium">Element Position (Order)</label>
                      <div className="flex items-center gap-2">
                        <button onClick={() => onMoveItem(selectedElementId, 'up')} className="flex-1 py-1.5 bg-white border border-gray-200 rounded-md text-xs text-gray-600 hover:bg-gray-50 shadow-sm active:scale-95 transition-all cursor-pointer"><i className="bi bi-arrow-up"></i> Move Up</button>
                        <button onClick={() => onMoveItem(selectedElementId, 'down')} className="flex-1 py-1.5 bg-white border border-gray-200 rounded-md text-xs text-gray-600 hover:bg-gray-50 shadow-sm active:scale-95 transition-all cursor-pointer"><i className="bi bi-arrow-down"></i> Move Down</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 3-Way Mode Switcher */}
            <div className="flex bg-indigo-50 p-1 rounded-lg">
              <button 
                onClick={() => handleModeSwitch('visual')} 
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${editorMode === 'visual' ? 'bg-white shadow-sm text-indigo-700' : 'text-indigo-400 hover:text-indigo-600 cursor-pointer'}`}
              >
                <i className="bi bi-palette"></i> Visual
              </button>
              <button 
                onClick={() => handleModeSwitch('code')} 
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${editorMode === 'code' ? 'bg-white shadow-sm text-indigo-700' : 'text-indigo-400 hover:text-indigo-600'}`}
              >
                <i className="bi bi-filetype-css"></i> CSS
              </button>
              <button 
                disabled={isRawVirtualNode}
                onClick={() => handleModeSwitch('html')} 
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${isRawVirtualNode ? 'opacity-40 cursor-not-allowed text-indigo-300' : (editorMode === 'html' ? 'bg-white shadow-sm text-indigo-700' : 'text-indigo-400 hover:text-indigo-600 cursor-pointer')}`}
              >
                <i className="bi bi-code-slash"></i> HTML
              </button>
            </div>

            {/* Editing Views */}
            {editorMode === 'html' ? (
              <div className="space-y-2 animate-fade-in">
                <p className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 leading-relaxed">
                  <i className="bi bi-info-circle-fill text-indigo-400 mr-1"></i> Write raw HTML. This completely overrides the visual editor and child elements for this specific node.
                </p>
                <textarea 
                  value={pendingRawHtml}
                  onChange={(e) => setPendingRawHtml(e.target.value)}
                  className="w-full h-80 bg-slate-900 text-blue-400 font-mono text-[11px] p-3 rounded-lg border-2 border-slate-700 focus:outline-none focus:border-indigo-500 leading-relaxed custom-scrollbar shadow-inner"
                  spellCheck="false"
                  placeholder={`<div class="custom-card">\n  <h1>Hello World</h1>\n</div>`}
                />
              </div>
            ) : editorMode === 'code' ? (
              <div className="space-y-2 animate-fade-in">
                <div className="flex bg-gray-100 p-1 rounded-lg mb-2">
                  <button onClick={() => setBreakpoint('desktop')} className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${breakpoint==='desktop'?'bg-white shadow text-indigo-600':'text-gray-500 hover:text-gray-700'}`}>Base</button>
                  <button onClick={() => setBreakpoint('tablet')} className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${breakpoint==='tablet'?'bg-white shadow text-indigo-600':'text-gray-500 hover:text-gray-700'}`}>Tablet</button>
                  <button onClick={() => setBreakpoint('mobile')} className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${breakpoint==='mobile'?'bg-white shadow text-indigo-600':'text-gray-500 hover:text-gray-700'}`}>Mobile</button>
                </div>
                <p className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                  <i className="bi bi-info-circle-fill text-indigo-400 mr-1"></i> Edit raw CSS for the <strong>{breakpoint}</strong> breakpoint.
                </p>
                <textarea 
                  value={rawCss}
                  onChange={(e) => setRawCss(e.target.value)}
                  className="w-full h-80 bg-slate-900 text-green-400 font-mono text-[11px] p-3 rounded-lg border-2 border-slate-700 focus:outline-none focus:border-indigo-500 leading-relaxed custom-scrollbar shadow-inner"
                  spellCheck="false"
                  placeholder={`/* Add CSS here */\ncolor: red;\npadding: 20px;`}
                />
              </div>
            ) : (
              // 🎨 Visual Editor Layout
              <div className="space-y-6 animate-fade-in opacity-100">
                <div className="flex bg-gray-100 p-1 rounded-lg mb-2">
                  <button onClick={() => setBreakpoint('desktop')} className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${breakpoint==='desktop'?'bg-white shadow text-indigo-600':'text-gray-500 hover:text-gray-700'}`}>Base View</button>
                  <button onClick={() => setBreakpoint('tablet')} className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${breakpoint==='tablet'?'bg-white shadow text-indigo-600':'text-gray-500 hover:text-gray-700'}`}>Tablet View</button>
                  <button onClick={() => setBreakpoint('mobile')} className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${breakpoint==='mobile'?'bg-white shadow text-indigo-600':'text-gray-500 hover:text-gray-700'}`}>Mobile View</button>
                </div>

                <div className="space-y-6">
                  {/* Content Attributes */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Content Attributes</h4>
                    {!isImg && (
                      <div>
                        <label className="text-[11px] text-gray-500 mb-0.5 block flex justify-between">
                          Inner Display Label / Text
                          {isRawVirtualNode && <span className="text-[9px] text-amber-500 font-bold"><i className="bi bi-lock-fill"></i> Locked by HTML</span>}
                        </label>
                        <textarea 
                          value={pendingText} 
                          onChange={(e) => setPendingText(e.target.value)} 
                          disabled={isRawVirtualNode}
                          className={`w-full border border-gray-200 rounded-md px-2 py-2 text-xs text-gray-700 focus:outline-none min-h-[40px] ${isRawVirtualNode ? 'bg-gray-100 opacity-50 cursor-not-allowed' : ''}`} 
                          placeholder="Content..." 
                        />
                      </div>
                    )}
                    {isImg && (
                      <div>
                        <label className="text-[11px] text-gray-500 mb-0.5 block flex justify-between">
                          Image Source URL
                          {isRawVirtualNode && <span className="text-[9px] text-amber-500 font-bold"><i className="bi bi-lock-fill"></i> Locked</span>}
                        </label>
                        <input type="text" value={pendingSrc} onChange={(e) => setPendingSrc(e.target.value)} disabled={isRawVirtualNode} className={`w-full border border-gray-200 rounded-md p-1.5 text-xs text-gray-700 focus:outline-none ${isRawVirtualNode ? 'bg-gray-100 opacity-50 cursor-not-allowed' : ''}`} placeholder="https://..." />
                      </div>
                    )}
                    {isLink && (
                      <div>
                        <label className="text-[11px] text-gray-500 mb-0.5 block flex justify-between">
                          Link Destination (href)
                          {isRawVirtualNode && <span className="text-[9px] text-amber-500 font-bold"><i className="bi bi-lock-fill"></i> Locked</span>}
                        </label>
                        <input type="text" value={pendingHref} onChange={(e) => setPendingHref(e.target.value)} disabled={isRawVirtualNode} className={`w-full border border-gray-200 rounded-md p-1.5 text-xs text-gray-700 focus:outline-none ${isRawVirtualNode ? 'bg-gray-100 opacity-50 cursor-not-allowed' : ''}`} placeholder="https://google.com" />
                      </div>
                    )}
                  </div>

                  <hr className="border-gray-100" />

                  {/* Layout Box Model */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Size & Space</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-500 mb-0.5 block">Width</label>
                        <input type="text" value={getStyleVal('width')} onChange={(e) => handleStyleFieldChange('width', e.target.value)} className="w-full border border-gray-200 rounded-md p-1.5 text-xs text-gray-700 font-mono" placeholder="auto, 100%" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 mb-0.5 block">Height</label>
                        <input type="text" value={getStyleVal('height')} onChange={(e) => handleStyleFieldChange('height', e.target.value)} className="w-full border border-gray-200 rounded-md p-1.5 text-xs text-gray-700 font-mono" placeholder="auto, 100px" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 mb-0.5 block">Max Width</label>
                        <input type="text" value={getStyleVal('maxWidth')} onChange={(e) => handleStyleFieldChange('maxWidth', e.target.value)} className="w-full border border-gray-200 rounded-md p-1.5 text-xs text-gray-700 font-mono" placeholder="100%, 800px" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 mb-0.5 block">Min Height</label>
                        <input type="text" value={getStyleVal('minHeight')} onChange={(e) => handleStyleFieldChange('minHeight', e.target.value)} className="w-full border border-gray-200 rounded-md p-1.5 text-xs text-gray-700 font-mono" placeholder="100vh" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-500 mb-0.5 block">Padding (Inner)</label>
                        <input type="text" value={getStyleVal('padding')} onChange={(e) => handleStyleFieldChange('padding', e.target.value)} className="w-full border border-gray-200 rounded-md p-1.5 text-xs text-gray-700 font-mono" placeholder="10px 20px" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 mb-0.5 block">Margin (Outer)</label>
                        <input type="text" value={getStyleVal('margin')} onChange={(e) => handleStyleFieldChange('margin', e.target.value)} className="w-full border border-gray-200 rounded-md p-1.5 text-xs text-gray-700 font-mono" placeholder="0 auto" />
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Display Engine */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Display & Align</h4>
                    <div>
                      <select value={getStyleVal('display')} onChange={(e) => handleStyleFieldChange('display', e.target.value)} className="w-full border border-gray-200 rounded-md p-1.5 text-xs text-gray-700 font-bold bg-gray-50">
                        <option value="">Inherit Display</option>
                        <option value="block">Block</option>
                        <option value="inline-block">Inline Block</option>
                        <option value="flex">Flexbox</option>
                        <option value="grid">Grid Layout</option>
                        <option value="none">Hidden (None)</option>
                      </select>
                    </div>

                    {(getStyleVal('display') === 'flex' || getStyleVal('display') === 'grid' || (!getStyleVal('display') && pendingStyles.display === 'flex')) && (
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-500 mb-0.5 block">Direction</label>
                            <select value={getStyleVal('flexDirection')} onChange={(e) => handleStyleFieldChange('flexDirection', e.target.value)} className="w-full border border-gray-200 rounded p-1 text-xs">
                              <option value="">Inherit</option><option value="row">Row →</option><option value="column">Column ↓</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 mb-0.5 block">Wrap Content</label>
                            <select value={getStyleVal('flexWrap')} onChange={(e) => handleStyleFieldChange('flexWrap', e.target.value)} className="w-full border border-gray-200 rounded p-1 text-xs">
                              <option value="">Inherit</option><option value="nowrap">No Wrap</option><option value="wrap">Wrap</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-500 mb-0.5 block">Justify (X)</label>
                            <select value={getStyleVal('justifyContent')} onChange={(e) => handleStyleFieldChange('justifyContent', e.target.value)} className="w-full border border-gray-200 rounded p-1 text-xs">
                              <option value="">Inherit</option><option value="flex-start">Start</option><option value="center">Center</option><option value="space-between">Space Between</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 mb-0.5 block">Align (Y)</label>
                            <select value={getStyleVal('alignItems')} onChange={(e) => handleStyleFieldChange('alignItems', e.target.value)} className="w-full border border-gray-200 rounded p-1 text-xs">
                              <option value="">Inherit</option><option value="flex-start">Start</option><option value="center">Center</option><option value="stretch">Stretch</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <hr className="border-gray-100" />

                  {/* Position Offsets */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Positioning</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-500 mb-0.5 block">Flow Strategy</label>
                        <select value={getStyleVal('position')} onChange={(e) => handleStyleFieldChange('position', e.target.value)} className="w-full border border-gray-200 rounded p-1 text-xs">
                          <option value="">Inherit</option><option value="static">Static (Default)</option><option value="relative">Relative</option><option value="absolute">Absolute</option><option value="fixed">Fixed</option><option value="sticky">Sticky</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-indigo-500 mb-0.5 block font-bold">Z-Index</label>
                        <input type="number" value={getStyleVal('zIndex')} onChange={(e) => handleStyleFieldChange('zIndex', e.target.value)} className="w-full border border-indigo-200 rounded p-1 text-xs font-mono" placeholder="auto, 10, 50" />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div><input type="text" value={getStyleVal('top')} onChange={(e) => handleStyleFieldChange('top', e.target.value)} className="w-full border rounded p-1 text-[10px] text-center" placeholder="Top" /></div>
                      <div><input type="text" value={getStyleVal('right')} onChange={(e) => handleStyleFieldChange('right', e.target.value)} className="w-full border rounded p-1 text-[10px] text-center" placeholder="Right" /></div>
                      <div><input type="text" value={getStyleVal('bottom')} onChange={(e) => handleStyleFieldChange('bottom', e.target.value)} className="w-full border rounded p-1 text-[10px] text-center" placeholder="Bottom" /></div>
                      <div><input type="text" value={getStyleVal('left')} onChange={(e) => handleStyleFieldChange('left', e.target.value)} className="w-full border rounded p-1 text-[10px] text-center" placeholder="Left" /></div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Typography */}
                  {isTextElement && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Typography</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500 mb-0.5 block">Font Size</label>
                          <input type="text" value={getStyleVal('fontSize')} onChange={(e) => handleStyleFieldChange('fontSize', e.target.value)} className="w-full border border-gray-200 rounded p-1.5 text-xs font-mono" placeholder="16px" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 mb-0.5 block">Text Color</label>
                          <input type="color" value={getStyleVal('color')} onChange={(e) => handleStyleFieldChange('color', e.target.value)} className="w-full h-8 border border-gray-200 rounded bg-white p-0.5 cursor-pointer" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 mb-0.5 block">Line Height</label>
                          <input type="text" value={getStyleVal('lineHeight')} onChange={(e) => handleStyleFieldChange('lineHeight', e.target.value)} className="w-full border border-gray-200 rounded p-1.5 text-xs font-mono" placeholder="1.5" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 mb-0.5 block">Letter Spacing</label>
                          <input type="text" value={getStyleVal('letterSpacing')} onChange={(e) => handleStyleFieldChange('letterSpacing', e.target.value)} className="w-full border border-gray-200 rounded p-1.5 text-xs font-mono" placeholder="1px" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500 mb-0.5 block">Align</label>
                          <select value={getStyleVal('textAlign')} onChange={(e) => handleStyleFieldChange('textAlign', e.target.value)} className="w-full border border-gray-200 rounded p-1.5 text-xs">
                            <option value="">Inherit</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 mb-0.5 block">Weight</label>
                          <select value={getStyleVal('fontWeight')} onChange={(e) => handleStyleFieldChange('fontWeight', e.target.value)} className="w-full border border-gray-200 rounded p-1.5 text-xs">
                            <option value="">Inherit</option><option value="normal">Normal</option><option value="bold">Bold</option><option value="800">800</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 mb-0.5 block">Transform</label>
                          <select value={getStyleVal('textTransform')} onChange={(e) => handleStyleFieldChange('textTransform', e.target.value)} className="w-full border border-gray-200 rounded p-1.5 text-xs">
                            <option value="">None</option><option value="uppercase">UPPER</option><option value="lowercase">lower</option><option value="capitalize">Capitalize</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {isTextElement && <hr className="border-gray-100" />}

                  {/* Visuals & FX */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Visual Effects</h4>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-500 mb-0.5 block">Background Color</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={getStyleVal('backgroundColor')} onChange={(e) => handleStyleFieldChange('backgroundColor', e.target.value)} className="w-6 h-6 border rounded cursor-pointer shrink-0" />
                              <input type="text" value={getStyleVal('backgroundColor')} onChange={(e) => handleStyleFieldChange('backgroundColor', e.target.value)} className="flex-1 border rounded p-1 text-[10px] font-mono" placeholder="transparent" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 mb-0.5 block">Opacity (0 to 1)</label>
                            <input type="text" value={getStyleVal('opacity')} onChange={(e) => handleStyleFieldChange('opacity', e.target.value)} className="w-full border border-gray-200 rounded p-1.5 text-xs font-mono" placeholder="1" />
                          </div>
                        </div>

                        {isLayoutBlock && (
                          <div>
                            <label className="text-[10px] text-gray-500 mb-0.5 block">Background Image URL</label>
                            <input type="text" value={getStyleVal('backgroundImage')} onChange={(e) => handleStyleFieldChange('backgroundImage', e.target.value.includes('url') ? e.target.value : `url('${e.target.value}')`)} className="w-full border border-gray-200 rounded-md p-1.5 text-xs font-mono" placeholder="url('https://...')" />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-500 mb-0.5 block">Border Details</label>
                            <input type="text" value={getStyleVal('border')} onChange={(e) => handleStyleFieldChange('border', e.target.value)} className="w-full border border-gray-200 rounded-md p-1.5 text-xs font-mono" placeholder="1px solid #000" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 mb-0.5 block">Border Radius</label>
                            <input type="text" value={getStyleVal('borderRadius')} onChange={(e) => handleStyleFieldChange('borderRadius', e.target.value)} className="w-full border border-gray-200 rounded-md p-1.5 text-xs font-mono" placeholder="8px" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 mb-0.5 block">Box Shadow</label>
                            <input type="text" value={getStyleVal('boxShadow')} onChange={(e) => handleStyleFieldChange('boxShadow', e.target.value)} className="w-full border border-gray-200 rounded-md p-1.5 text-xs font-mono" placeholder="0px 4px 10px rgba(0,0,0,0.1)" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 mb-0.5 block">Filters (Blur, etc)</label>
                            <input type="text" value={getStyleVal('filter')} onChange={(e) => handleStyleFieldChange('filter', e.target.value)} className="w-full border border-gray-200 rounded-md p-1.5 text-xs font-mono" placeholder="blur(4px)" />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-gray-500 mb-0.5 block">Transforms (Scale, Rotate)</label>
                          <input type="text" value={getStyleVal('transform')} onChange={(e) => handleStyleFieldChange('transform', e.target.value)} className="w-full border border-gray-200 rounded-md p-1.5 text-xs font-mono" placeholder="scale(1.1) rotate(5deg)" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {activeItemData && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 shrink-0 z-50 relative">
              <button onClick={handleExecute} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-[13px] tracking-wide rounded-lg shadow-sm cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2">
                <i className="bi bi-save-fill"></i> Execute Engine
              </button>
            </div>
          )}
        </div>
      );
    }