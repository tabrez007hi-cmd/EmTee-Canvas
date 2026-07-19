const serializeStyles = (styles = {}) => {
  return Object.entries(styles)
    .filter(([_, val]) => val !== '' && val !== null && val !== undefined)
    .map(([key, val]) => {
      const cssProperty = key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
      return `${cssProperty}: ${val};`;
    })
    .join(' ');
};

const generateDynamicCSS = (layoutItems) => {
  let baseCSS = '';
  let tabletCSS = '';
  let mobileCSS = '';

  layoutItems.forEach(item => {
    // ✨ Target raw HTML children by their #ID, standard elements by [data-id]
    const selector = item.isRawChild ? `#${item.customId}` : `[data-id="${item.id}"]`;

    if (item.styles && Object.keys(item.styles).length > 0) {
      baseCSS += `${selector} { ${serializeStyles(item.styles)} }\n`;
    }
    if (item.tabletStyles && Object.keys(item.tabletStyles).length > 0) {
      tabletCSS += `@media (max-width: 1024px) { ${selector} { ${serializeStyles(item.tabletStyles)} } }\n`;
    }
    if (item.mobileStyles && Object.keys(item.mobileStyles).length > 0) {
      mobileCSS += `@media (max-width: 640px) { ${selector} { ${serializeStyles(item.mobileStyles)} } }\n`;
    }
  });

  return `
    ${baseCSS}
    ${tabletCSS}
    ${mobileCSS}
  `;
};

export function generateCanvasHtml(layoutItems) {
  const navItem = layoutItems.find(item => item.type === 'navbar');
  const sideItem = layoutItems.find(item => item.type === 'sidebar');
  const footItem = layoutItems.find(item => item.type === 'footer');
  
  const buildNodeHtml = (item) => {
    // Skip HTML generation for raw children since they already exist inside their parent's rawHtml
    if (!item || item.isRawChild) return '';

    // ✨ FIX: Bullet-proof data-id injection that ignores spaces and comments
    if (item.rawHtml && item.rawHtml.trim() !== '') {
      let injectedHtml = item.rawHtml;
      if (!injectedHtml.includes(`data-id=`)) {
        injectedHtml = injectedHtml.replace(/(<[a-zA-Z0-9\-]+)([^>]*>)/, `$1 data-id="${item.id}"$2`);
      }
      return injectedHtml;
    }
    
    const children = layoutItems.filter(child => child.parentId === item.id);
    const childrenHtml = children.map(child => buildNodeHtml(child)).join('\n');
    
    const idAttr = item.customId ? `id="${item.customId}"` : '';
    let tag = item.type;
    if (tag === 'navbar') tag = 'nav';
    if (tag === 'sidebar') tag = 'aside';
    if (tag === 'footer') tag = 'footer';
    
    if (tag === 'img') return `<img data-id="${item.id}" ${idAttr} src="${item.src || 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=500&q=80'}" class="transition-all relative mb-1" alt="Image"/>`;
    if (tag === 'a') return `<a data-id="${item.id}" ${idAttr} href="${item.href || '#'}" target="_blank" class="transition-all relative inline-block">${item.text || ''}${childrenHtml}</a>`;
    if (tag === 'button') return `<button data-id="${item.id}" ${idAttr} class="transition-all relative">${item.text || ''}${childrenHtml}</button>`;

    let extraContent = '';
    if (item.type === 'navbar') {
      if (sideItem) {
        extraContent = `
          <div class="flex items-center gap-2 mr-6 shrink-0">
            <button onclick="document.getElementById('canvas-sidebar').classList.toggle('force-toggle')" class="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md cursor-pointer transition-colors border-none bg-transparent flex items-center">
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <span class="font-bold text-gray-800 tracking-tight text-lg truncate">${item.text || 'EmTeeCanvas'}</span>
          </div>
        `;
      } else {
        extraContent = `<div class="font-bold text-gray-800 tracking-tight text-lg mr-6 shrink-0">${item.text || 'EmTeeCanvas'}</div>`;
      }
    }

    let cssClasses = "transition-all relative";
    if (item.type === 'sidebar') return `<${tag} id="canvas-sidebar" data-id="${item.id}" ${idAttr} class="${cssClasses} custom-scrollbar">${item.text || ''}${childrenHtml}</${tag}>`;
    if (item.type === 'navbar') return `<${tag} data-id="${item.id}" ${idAttr} class="${cssClasses}">${extraContent} ${childrenHtml}</${tag}>`;

    return `<${tag} data-id="${item.id}" ${idAttr} class="${cssClasses}">${item.text || ''}${childrenHtml}</${tag}>`;
  };

  const canvasRootItems = layoutItems.filter(item => 
    !['navbar', 'sidebar', 'footer'].includes(item.type) && item.parentId === null && !item.isRawChild
  );
  
  const componentContentHtml = canvasRootItems.map(item => buildNodeHtml(item)).join('\n');

  const innerWorkspaceContent = componentContentHtml || `
    <div class="bg-white border border-gray-200 rounded-2xl p-8 shadow-xs max-w-xl mx-auto w-full my-auto text-center border-dashed pointer-events-none">
        <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-xl">
            <i class="bi bi-window-plus"></i>
        </div>
        <h2 class="text-lg font-bold text-gray-900 mb-1">Canvas Playground Empty</h2>
        <p class="text-gray-400 text-xs">Add a container DIV, Buttons, Links, or Text to begin structuring.</p>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Live Context Builder View</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        * { box-sizing: border-box; }
        html, body { overflow-x: hidden; width: 100%; margin: 0; padding: 0; }
        [data-id] { transition: outline 0.1s ease-in-out, background-color 0.2s; }
        .selected-element { outline: 2px solid #4f46e5 !important; outline-offset: -2px; }
        img[data-id] { object-fit: cover; max-width: 100%; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .main-wrapper { display: flex; flex: 1; overflow-x: hidden; position: relative; width: 100%; max-width: 100%; flex-direction: row; }
        #canvas-sidebar { position: absolute !important; top: 0; left: 0; bottom: 0; height: 100% !important; z-index: 40; background-color: #ffffff; box-shadow: 4px 0 15px rgba(0,0,0,0.05); }
        @media (min-width: 641px) { #canvas-sidebar { display: flex; } #canvas-sidebar.force-toggle { display: none !important; } main { width: 100%; max-width: 100%; } }
        @media (max-width: 640px) { .main-wrapper { flex-direction: column; overflow-y: auto; overflow-x: hidden; } nav { padding: 12px 16px !important; flex-wrap: wrap; gap: 12px; height: auto !important; min-height: 64px; } main { padding: 16px !important; overflow-y: visible !important; overflow-x: hidden; width: 100%; max-width: 100%; } #canvas-sidebar { display: none !important; width: 280px !important; border-right: 1px solid #e5e7eb !important; border-bottom: none !important; } #canvas-sidebar.force-toggle { display: flex !important; } }
        ${generateDynamicCSS(layoutItems)}
    </style>
</head>
<body class="bg-gray-50 text-gray-800 antialiased m-0 p-0 selection:bg-indigo-100 min-h-screen">
    <div class="min-h-screen flex flex-col">
        ${navItem ? buildNodeHtml(navItem) : ''}
        <div class="main-wrapper">
            ${sideItem ? buildNodeHtml(sideItem) : ''}
            <main class="flex-1 p-8 flex flex-col overflow-y-auto min-h-[70vh] bg-cover bg-center bg-no-repeat relative w-full">
                ${innerWorkspaceContent}
            </main>
        </div>
        ${footItem ? buildNodeHtml(footItem) : ''}
    </div>
</body>
</html>`;
}