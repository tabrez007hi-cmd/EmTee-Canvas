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
    // Target raw HTML children by their #ID, standard elements by [data-id]
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

export function generateCanvasHtml(layoutItems, isExport = false) {
  let hoistedStyles = ''; // ✨ Engine variable to collect <style> blocks

  const buildNodeHtml = (item) => {
    // Skip HTML generation for raw children since they already exist inside their parent's rawHtml
    if (!item || item.isRawChild) return '';

    if (item.rawHtml && item.rawHtml.trim() !== '') {
      let injectedHtml = item.rawHtml;

      // ✨ CSS HOISTING ENGINE: Find <style> tags, extract CSS, and strip from Body
      injectedHtml = injectedHtml.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, cssContent) => {
        hoistedStyles += cssContent + '\n';
        return ''; // Return empty string to delete the tag from the HTML body
      });

      // Bullet-proof data-id injection for raw custom code blocks
      if (!injectedHtml.includes(`data-id=`)) {
        injectedHtml = injectedHtml.replace(/(<[a-zA-Z0-9\-]+)([^>]*>)/, `$1 data-id="${item.id}"$2`);
      }
      return injectedHtml;
    }
    
    const children = layoutItems.filter(child => child.parentId === item.id);
    const childrenHtml = children.map(child => buildNodeHtml(child)).join('\n');
    
    const idAttr = item.customId ? `id="${item.customId}"` : '';
    const tag = item.type;
    
    if (tag === 'img') return `<img data-id="${item.id}" ${idAttr} src="${item.src || 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=500&q=80'}" class="transition-all relative mb-1" alt="Image"/>`;
    if (tag === 'a') return `<a data-id="${item.id}" ${idAttr} href="${item.href || '#'}" target="_blank" class="transition-all relative inline-block">${item.text || ''}${childrenHtml}</a>`;
    if (tag === 'button') return `<button data-id="${item.id}" ${idAttr} class="transition-all relative">${item.text || ''}${childrenHtml}</button>`;

    return `<${tag} data-id="${item.id}" ${idAttr} class="transition-all relative">${item.text || ''}${childrenHtml}</${tag}>`;
  };

  // Only render elements that sit directly on the root of the canvas
  const canvasRootItems = layoutItems.filter(item => item.parentId === null && !item.isRawChild);
  const componentContentHtml = canvasRootItems.map(item => buildNodeHtml(item)).join('\n');

  // A sleek, minimal placeholder if the canvas is utterly empty
  const innerWorkspaceContent = (componentContentHtml || isExport) ? componentContentHtml : `
    <div style="font-family: sans-serif; max-width: 500px; margin: 15vh auto; text-align: center; color: #64748b; pointer-events: none;">
        <svg style="margin: 0 auto 20px auto; width: 64px; height: 64px; opacity: 0.3;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
        </svg>
        <h2 style="font-size: 24px; color: #f8fafc; font-weight: bold; margin-bottom: 8px;">Pure Canvas Environment</h2>
        <p style="font-size: 14px; line-height: 1.6;">Your workspace is a completely blank HTML document. Drag an element from the sidebar to begin structuring your DOM Tree from scratch.</p>
    </div>`;

  // Builder-specific CSS is completely isolated
  const builderCss = isExport ? '' : `
        [data-id] { transition: outline 0.1s ease-in-out, background-color 0.2s; }
        .selected-element { outline: 2px solid #6366f1 !important; outline-offset: -2px; }
        img[data-id] { object-fit: cover; max-width: 100%; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #4f46e5; }
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>EmTeeCanvas Workspace</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        ${!isExport ? 'html, body { min-height: 100vh; background-color: transparent; }' : ''}
        ${builderCss}
        ${generateDynamicCSS(layoutItems)}
        
        /* User Custom CSS (Hoisted) */
        ${hoistedStyles}
    </style>
</head>
<body class="m-0 p-0 ${!isExport ? 'selection:bg-indigo-500/30' : ''}">
${innerWorkspaceContent}
</body>
</html>`;
}