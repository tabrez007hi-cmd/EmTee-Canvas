import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import CanvasContainer from '../components/CanvasContainer';
import InspectorPanel from '../components/InspectorPanel';
import AccountModal from '../components/AccountModal'; 
import SettingsModal from '../components/SettingsModel';
import WorkspacesModal from '../components/WorkspacesModal'; 
import WorkspaceSettingsModal from '../components/WorkspaceSettingsModal'; 
import ExportModal from '../components/ExportModal'; 
import { generateCanvasHtml } from '../utils/templates';
import { auth, db } from '../firebase';
import { ref, get, set, onValue } from 'firebase/database';

const generateProjectSlug = (name) => {
  const cleanName = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const uniqueId = Math.random().toString(36).substr(2, 6);
  return `${cleanName}_${uniqueId}`;
};

export default function Builder() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const iframeRef = useRef(null);

  const [isInspectMode, setIsInspectMode] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [selectionNonce, setSelectionNonce] = useState(0); 
  const [isInspectorMinimized, setIsInspectorMinimized] = useState(true);

  const [layoutItems, setLayoutItems] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isWorkspacesModalOpen, setIsWorkspacesModalOpen] = useState(false); 
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [workspaceSettingsTarget, setWorkspaceSettingsTarget] = useState(null); 

  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [loadedWorkspaceId, setLoadedWorkspaceId] = useState(null);
  
  const [sharedViewData, setSharedViewData] = useState(null);
  const [userRole, setUserRole] = useState('normal');

  const [autoSave, setAutoSave] = useState(() => {
    const cachedPreference = localStorage.getItem('emtee_autosave_preference');
    return cachedPreference !== null ? JSON.parse(cachedPreference) : true;
  });

  useEffect(() => {
    localStorage.setItem('emtee_autosave_preference', JSON.stringify(autoSave));
  }, [autoSave]);

  // ==========================================
  // ✨ ENGINE: HTML Parser for Custom User Edits
  // ==========================================
  const handleApplyCodeChanges = (newHtml) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(newHtml, 'text/html');
    
    // Attempt to extract just the main component area so we don't destroy Navbars/Sidebars
    const mainEl = doc.querySelector('main');
    let newContentHtml = mainEl ? mainEl.innerHTML : doc.body.innerHTML;
    
    // Keep App Shell (Navbar, Sidebar, Footer)
    const preservedItems = layoutItems.filter(item => ['navbar', 'sidebar', 'footer'].includes(item.type));
    const rootNodeId = `element_${Date.now()}_root`;
    
    // Wrap the edited HTML as a builder-compatible root layout block
    const newLayout = [
      ...preservedItems,
      {
        id: rootNodeId,
        type: 'div',
        customId: `custom-code-${Math.random().toString(36).substr(2, 5)}`,
        parentId: null,
        text: '',
        styles: { width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column' },
        tabletStyles: {}, mobileStyles: {},
        rawHtml: newContentHtml.trim(),
        isRawChild: false
      }
    ];
    
    setLayoutItems(newLayout);
    alert("Code modifications applied successfully! DOM Tree updated. 🚀");
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlOwner = queryParams.get('owner');
    const urlParamId = queryParams.get('ws');
    const user = auth.currentUser;

    // Block non-logged-in users UNLESS they are viewing a shared link
    if (!user && !urlOwner) {
      navigate('/authentication', { replace: true });
      return;
    }

    // 🌐 GUEST / SHARED LINK HANDLER
    if (urlOwner && urlOwner !== user?.uid && urlParamId) {
      const sharedRef = ref(db, `users/${urlOwner}/workspaces/${urlParamId}`);
      get(sharedRef).then(snap => {
        if (snap.exists()) {
          const sharedWs = snap.val();
          if (!sharedWs.isPublic && !sharedWs.isShareable) {
            alert('Access Denied 🔒\nThis workspace is private.');
            navigate(user ? '/user/home' : '/authentication', { replace: true });
          } else {
            setSharedViewData({ owner: urlOwner, ...sharedWs });
            setIsDataLoaded(true); // ✅ Critical: Allow the UI to render for guests
          }
        } else {
          alert('Error ❌\nShared workspace not found.');
          navigate(user ? '/user/home' : '/authentication', { replace: true });
        }
      });
    }
  }, [navigate]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return; // Guests stop here, they don't have workspaces!

    const HARDCODED_DEVS = ["tabrez007hi@gmail.com", "admin@gmail.com"];
    const isHardcodedDev = user.email && HARDCODED_DEVS.includes(user.email.toLowerCase().trim());

    const profileRef = ref(db, `users/${user.uid}/profile`);
    onValue(profileRef, (snapshot) => {
      if (snapshot.exists()) {
         setUserProfile(snapshot.val());
         setUserRole(isHardcodedDev ? 'developer' : (snapshot.val().role || 'normal'));
      }
    });

    const workspacesRef = ref(db, `users/${user.uid}/workspaces`);
    onValue(workspacesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.values(data);
        setWorkspaces(list);

        setActiveWorkspaceId(prevActiveId => {
          if (prevActiveId && data[prevActiveId]) return prevActiveId;
          const queryParams = new URLSearchParams(window.location.search);
          const urlParamId = queryParams.get('ws');
          if (urlParamId && data[urlParamId]) return urlParamId;
          return list[0].id;
        });
        setIsDataLoaded(true);
      } else {
        // If they have no workspaces, send to dashboard
        navigate('/user/home', { replace: true });
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (!activeWorkspaceId || !userProfile || sharedViewData) return;
    const currentParams = new URLSearchParams(location.search);
    const targetUser = userProfile.username || 'user';
    
    if (currentParams.get('ws') !== activeWorkspaceId || currentParams.get('u') !== targetUser) {
      navigate(`${location.pathname}?u=${targetUser}&ws=${activeWorkspaceId}`, { replace: true });
    }
  }, [activeWorkspaceId, location.pathname, location.search, navigate, userProfile, sharedViewData]);

  useEffect(() => {
    if (!activeWorkspaceId || workspaces.length === 0 || sharedViewData) return;
    const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    
    if (currentWorkspace) {
      try {
        const remoteString = typeof currentWorkspace.layouts === 'string' ? currentWorkspace.layouts : JSON.stringify(currentWorkspace.layouts || []);
        const parsedRemote = JSON.parse(remoteString);
        const canonicalRemote = JSON.stringify(parsedRemote);

        setLayoutItems(prevItems => {
          if (JSON.stringify(prevItems) !== canonicalRemote) {
            return parsedRemote;
          }
          return prevItems;
        });
        
        setLoadedWorkspaceId(activeWorkspaceId);
      } catch (e) {
        console.error("Failed to parse layout JSON", e);
      }
    }
  }, [activeWorkspaceId, workspaces, sharedViewData]);

  useEffect(() => {
    if (isDataLoaded && auth.currentUser && activeWorkspaceId && autoSave && loadedWorkspaceId === activeWorkspaceId && !sharedViewData) {
      const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
      if (!currentWorkspace) return;

      const currentLocalString = JSON.stringify(layoutItems);
      
      let canonicalRemote = '[]';
      try {
        const remoteStr = typeof currentWorkspace.layouts === 'string' ? currentWorkspace.layouts : JSON.stringify(currentWorkspace.layouts || []);
        canonicalRemote = JSON.stringify(JSON.parse(remoteStr));
      } catch (e) {}

      if (canonicalRemote === currentLocalString) return;

      const updatedProject = {
        ...currentWorkspace,
        layouts: currentLocalString,
        updatedAt: Date.now()
      };
      
      set(ref(db, `users/${auth.currentUser.uid}/workspaces/${activeWorkspaceId}`), updatedProject);
    }
  }, [layoutItems, isDataLoaded, activeWorkspaceId, autoSave, workspaces, loadedWorkspaceId, sharedViewData]);

  const handleSaveWorkspaceExplicitly = () => {
    const user = auth.currentUser;
    if (!user || !activeWorkspaceId) return;

    const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    const updatedProject = {
      ...currentWorkspace,
      id: activeWorkspaceId,
      name: currentWorkspace?.name || 'My Project Workspace',
      layouts: JSON.stringify(layoutItems),
      updatedAt: Date.now()
    };

    set(ref(db, `users/${user.uid}/workspaces/${activeWorkspaceId}`), updatedProject).then(() => {
      alert('Workspace sync complete! Project changes committed to cloud database successfully.');
    });
  };

  const handleCreateWorkspace = () => {
    if (userRole === 'normal' && workspaces.length >= 3) {
      alert('Free Plan Limit: You can only have 3 active workspaces. Please upgrade to Pro or Developer to create more.');
      return;
    }
    if (userRole === 'pro' && workspaces.length >= 10) {
      alert('Pro Plan Limit: You can only have 10 active workspaces.'); return;
    }

    const name = prompt('Enter name for the new project:', 'New Component Project');
    if (!name || !name.trim()) return;

    // ✨ Enforce Privacy Limit on creation
    const privateCount = workspaces.filter(w => !w.isPublic).length;
    const forcePublic = userRole === 'normal' && privateCount >= 1;

    const user = auth.currentUser;
    const newId = generateProjectSlug(name);
    const newWS = { id: newId, name: name.trim(), layouts: '[]', isPublic: forcePublic, allowCodeView: false, allowDomView: false, createdAt: Date.now(), updatedAt: Date.now() };
    
    set(ref(db, `users/${user.uid}/workspaces/${newId}`), newWS).then(() => {
      setActiveWorkspaceId(newId);
    });
  };

  const handleDeleteWorkspace = (id) => {
    if (workspaces.length <= 1) return;
    if (!window.confirm('Are you absolutely sure you want to drop this workspace project permanently? 🚨')) return;
    const user = auth.currentUser;
    set(ref(db, `users/${user.uid}/workspaces/${id}`), null);
  };

  const handleSaveWorkspaceSettings = (id, updates) => {
    const user = auth.currentUser;
    const match = workspaces.find(w => w.id === id);
    if (match) {
      const newId = updates.name !== match.name ? generateProjectSlug(updates.name) : id;
      const updatedWS = { 
        ...match, 
        id: newId, 
        name: updates.name, 
        isPublic: updates.isPublic, 
        allowCodeView: updates.allowCodeView,
        allowDomView: updates.allowDomView,
        updatedAt: Date.now() 
      };
      
      set(ref(db, `users/${user.uid}/workspaces/${newId}`), updatedWS).then(() => {
        if (id !== newId) {
          set(ref(db, `users/${user.uid}/workspaces/${id}`), null);
          if (activeWorkspaceId === id) setActiveWorkspaceId(newId);
        }
      });
    }
  };

  const handleDuplicateWorkspace = (id) => {
    if (userRole === 'normal' && workspaces.length >= 3) {
      alert('Free Plan Limit: You can only have 3 active workspaces. Please upgrade to Pro or Developer to duplicate projects.');
      return;
    }
    if (userRole === 'pro' && workspaces.length >= 10) {
      alert('Pro Plan Limit: You can only have 10 active workspaces.'); return;
    }

    const match = workspaces.find(w => w.id === id);
    if (!match) return;

    // ✨ Enforce Privacy Limit on duplication
    const privateCount = workspaces.filter(w => !w.isPublic).length;
    const forcePublic = userRole === 'normal' && privateCount >= 1;

    const user = auth.currentUser;
    const copyId = generateProjectSlug(`${match.name} Copy`);
    const clonedWS = {
      ...match,
      id: copyId,
      name: `${match.name} (Copy)`,
      isPublic: forcePublic, allowCodeView: false, allowDomView: false,
      createdAt: Date.now(), updatedAt: Date.now()
    };
    set(ref(db, `users/${user.uid}/workspaces/${copyId}`), clonedWS);
  };

  const activeWorkspaceName = workspaces.find(w => w.id === activeWorkspaceId)?.name || 'Loading Project...';
  const currentCompiledCode = generateCanvasHtml(layoutItems);

  const handleSelectElement = (id) => {
    setSelectedElementId(id);
    setSelectionNonce(prev => prev + 1); 
    setIsInspectorMinimized(false); 
  };

  const handleAddItem = (type) => {
    const newItems = [];
    const parentId = `element_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    if (type === 'navbar') {
      newItems.push({
        id: parentId, type: 'navbar', customId: '', parentId: null, text: 'Brand Name',
        styles: { backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', minHeight: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: '12px 24px', position: 'sticky', top: '0', zIndex: '30' },
        tabletStyles: {}, mobileStyles: {}, rawHtml: '' 
      });
      const linkContainerId = `element_${Date.now()}_links`;
      newItems.push({
        id: linkContainerId, type: 'div', parentId: parentId, customId: '', text: '',
        styles: { display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' },
        tabletStyles: {}, mobileStyles: {}, rawHtml: ''
      });
      ['Home', 'Features', 'Pricing'].forEach((txt, i) => {
        newItems.push({
          id: `element_${Date.now()}_link${i}`, type: 'a', parentId: linkContainerId, text: txt, href: '#',
          styles: { fontSize: '14px', color: '#4b5563', textDecoration: 'none', fontWeight: '500' },
          tabletStyles: {}, mobileStyles: {}, rawHtml: ''
        });
      });
    } else if (type === 'sidebar') {
      newItems.push({
        id: parentId, type: 'sidebar', customId: '', parentId: null, text: '',
        styles: { backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb', width: '256px', maxWidth: '100%', height: '100vh', display: 'flex', flexDirection: 'column', padding: '16px', transition: 'all 0.3s ease', overflow: 'hidden' },
        tabletStyles: {}, mobileStyles: {}, rawHtml: ''
      });
      ['Dashboard', 'Messages', 'Settings'].forEach((txt, i) => {
        newItems.push({
          id: `element_${Date.now()}_btn${i}`, type: 'button', parentId: parentId, text: txt,
          styles: { display: 'flex', alignItems: 'center', width: '100%', padding: '12px 16px', marginBottom: '8px', backgroundColor: i === 0 ? '#eef2ff' : 'transparent', color: i === 0 ? '#4f46e5' : '#4b5563', borderRadius: '8px', border: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
          tabletStyles: {}, mobileStyles: {}, rawHtml: ''
        });
      });
    } else if (type === 'footer') {
      newItems.push({
        id: parentId, type: 'footer', parentId: null, text: '© 2026 EmTeeCanvas Workspace.',
        styles: { backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', color: '#9ca3af', fontSize: '14px', marginTop: 'auto' },
        tabletStyles: {}, mobileStyles: {}, rawHtml: ''
      });
    }  else {
      // ✨ SMART GENERATOR FOR ALL HTML ELEMENTS
      const isContainer = ['div', 'section', 'article', 'form', 'nav', 'header', 'aside', 'footer'].includes(type);
      const isInput = ['input', 'textarea', 'select'].includes(type);
      const isMedia = ['img', 'video', 'iframe', 'canvas', 'svg'].includes(type);
      const isImg = type === 'img'; // ✨ FIX: Added the missing isImg definition here!
      const isList = ['ul', 'ol', 'table', 'tr'].includes(type);
      const isListItem = ['li', 'td', 'th'].includes(type);
      const isLink = type === 'a';
      const isBtn = type === 'button';
      const isLabel = type === 'label';

      newItems.push({
        id: parentId, type: type, customId: '', parentId: null,  
        text: (isMedia || isInput || isContainer || isList || isListItem) ? '' : isLink ? 'Click Here' : isBtn ? 'Submit' : isLabel ? 'Label Text' : `${type.toUpperCase()} Text`,
        src: type === 'img' ? 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=400&q=80' : type === 'iframe' ? 'https://example.com' : null,
        href: isLink ? '#' : null,
        
        // Custom Input Attributes
        placeholder: isInput ? 'Enter text here...' : null,
        inputType: type === 'input' ? 'text' : null,

        styles: isContainer ? { minHeight: '100px', width: '100%', padding: '20px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px', boxSizing: 'border-box' } 
        : isImg ? { width: '100%', maxWidth: '300px', height: 'auto', borderRadius: '8px', objectFit: 'cover' } 
        : isInput ? { width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem', backgroundColor: '#ffffff' }
        : isBtn ? { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-block' }
        : isList ? { paddingLeft: '20px', marginBottom: '1rem', width: '100%' }
        : { fontSize: '16px', color: '#1f2937', transition: 'all 0.2s ease', wordWrap: 'break-word' },
        tabletStyles: {}, mobileStyles: {}, rawHtml: ''
      });
    }

    setLayoutItems(prev => [...prev, ...newItems]);
  };

  const handleRemoveItem = (id) => {
    const idsToRemove = new Set([id]);
    let foundNew = true;
    while(foundNew) {
      foundNew = false;
      layoutItems.forEach(item => {
        if (item.parentId && idsToRemove.has(item.parentId) && !idsToRemove.has(item.id)) {
          idsToRemove.add(item.id);
          foundNew = true;
        }
      });
    }
    setLayoutItems(prev => prev.filter(item => !idsToRemove.has(item.id)));
    if (selectedElementId && (idsToRemove.has(selectedElementId) || selectedElementId.startsWith(id))) {
      setSelectedElementId(null);
    }
  };

  const handleDuplicateItem = (targetId) => {
    const itemIndex = layoutItems.findIndex(i => i.id === targetId);
    if (itemIndex === -1) return;

    const itemToCopy = layoutItems[itemIndex];
    const newItems = [];
    const idMap = new Map();

    const baseCustomId = itemToCopy.customId || itemToCopy.type;
    let count = 1;
    while (layoutItems.some(i => i.customId === `${baseCustomId}_copy${count}`)) {
      count++;
    }
    const newRootCustomId = `${baseCustomId}_copy${count}`;

    const duplicateRecursive = (item, parentId, isRoot = false) => {
      const newId = `element_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      idMap.set(item.id, newId);

      newItems.push({
        ...item,
        id: newId,
        parentId: parentId, 
        customId: isRoot ? newRootCustomId : (item.customId ? `${item.customId}_copy` : '')
      });

      const children = layoutItems.filter(child => child.parentId === item.id);
      children.forEach(child => duplicateRecursive(child, newId));
    };

    duplicateRecursive(itemToCopy, itemToCopy.parentId, true);

    let lastDescendantIndex = itemIndex;
    const allCopiedIds = new Set(idMap.keys());
    for (let i = itemIndex; i < layoutItems.length; i++) {
      if (allCopiedIds.has(layoutItems[i].id) || layoutItems[i].parentId === targetId) {
        lastDescendantIndex = i;
      }
    }
    setLayoutItems(prev => {
      const nextArr = [...prev];
      nextArr.splice(lastDescendantIndex + 1, 0, ...newItems);
      return nextArr;
    });
  };

  const handleMoveItem = (id, direction) => {
    setLayoutItems(prev => {
      const itemIndex = prev.findIndex(item => item.id === id);
      if (itemIndex === -1) return prev;
      
      const item = prev[itemIndex];
      const siblings = prev.filter(i => i.parentId === item.parentId);
      const siblingIndex = siblings.findIndex(i => i.id === id);
      
      if (direction === 'up' && siblingIndex > 0) {
        const prevSibling = siblings[siblingIndex - 1];
        const prevIndex = prev.findIndex(i => i.id === prevSibling.id);
        const nextArr = [...prev];
        nextArr[itemIndex] = prevSibling;
        nextArr[prevIndex] = item;
        return nextArr;
      }
      
      if (direction === 'down' && siblingIndex < siblings.length - 1) {
        const nextSibling = siblings[siblingIndex + 1];
        const nextIndex = prev.findIndex(i => i.id === nextSibling.id);
        const nextArr = [...prev];
        nextArr[itemIndex] = nextSibling;
        nextArr[nextIndex] = item;
        return nextArr;
      }
      return prev;
    });
  };

  window.handleDuplicateItemExternal = handleDuplicateItem;
  window.handleRemoveItemExternal = handleRemoveItem;

  // ==========================================
  // ✨ ENGINE FIX: Dynamic HTML Sub-Node Picker 
  // ==========================================
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleIframeInteraction = () => {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const body = doc?.body;
      if (!doc || !body) return;

      if (isInspectMode) body?.classList?.add('inspect-mode');
      else body?.classList?.remove('inspect-mode');

      const handleMouseOver = (e) => {
        if (!isInspectMode) return;
        
        // Target the ACTUAL element being hovered, skipping .closest() wrapper checks.
        // This ensures inner HTML children of raw template chunks can be uniquely mapped.
        const target = e.target;
        if (!target || target === body || target.tagName === 'HTML' || target.id === 'canvas-sidebar') return;
        e.stopPropagation(); 
        
        doc.querySelectorAll('*').forEach(el => {
          if (el?.style && el.id !== 'emtee-element-toolbelt' && !el.closest('#emtee-element-toolbelt')) { 
            el.style.outline = ''; el.style.outlineOffset = ''; el.style.cursor = ''; 
          }
        });

        if (target?.style) {
          target.style.outline = '2px dashed #3b82f6';
          target.style.outlineOffset = '-2px';
          target.style.cursor = 'crosshair';
        }
      };

      const handleMouseOut = (e) => {
        if (!isInspectMode) return;
        const target = e.target;
        if (target?.style) { 
          target.style.outline = ''; target.style.outlineOffset = ''; target.style.cursor = ''; 
        }
      };

      const handleElementClick = (e) => {
        if (!isInspectMode) return;
        const targetElement = e.target; 
        if (!targetElement || targetElement === body || targetElement.tagName === 'HTML' || targetElement.id === 'canvas-sidebar') return;

        e.preventDefault(); e.stopPropagation();

        if (targetElement?.style) {
          targetElement.style.outline = ''; targetElement.style.outlineOffset = ''; targetElement.style.cursor = '';
        }

        let targetId = targetElement.getAttribute('data-id');
        let customId = targetElement.getAttribute('id');
        let needsStateUpdate = false;
        let parentDataIdToUpdate = null;
        let updatedHtml = null;

        if (!targetId && !customId) {
          customId = `emtee_${Math.random().toString(36).substr(2, 6)}`;
          targetElement.setAttribute('id', customId);
          
          const rootRawNode = targetElement.closest('[data-id]');
          if (rootRawNode) {
            parentDataIdToUpdate = rootRawNode.getAttribute('data-id');
            updatedHtml = rootRawNode.outerHTML; 
            needsStateUpdate = true;
          }
        }

        if (!targetId && customId) {
          targetId = `raw_${customId}`;
          setLayoutItems(prev => {
            let nextState = [...prev];
            if (needsStateUpdate && parentDataIdToUpdate) {
              nextState = nextState.map(item => item.id === parentDataIdToUpdate ? { ...item, rawHtml: updatedHtml } : item);
            }
            if (!nextState.find(item => item.id === targetId)) {
              nextState.push({
                id: targetId,
                type: targetElement.tagName.toLowerCase(),
                customId: customId,
                parentId: parentDataIdToUpdate || null, 
                isRawChild: true,
                styles: {}, tabletStyles: {}, mobileStyles: {}, rawHtml: ''
              });
            }
            return nextState;
          });
        }

        handleSelectElement(targetId || customId); 
        setIsInspectMode(false); 
      };

      doc.addEventListener('mouseover', handleMouseOver, true);
      doc.addEventListener('mouseout', handleMouseOut, true);
      doc.addEventListener('click', handleElementClick, true);

      return () => {
        doc.removeEventListener('mouseover', handleMouseOver, true);
        doc.removeEventListener('mouseout', handleMouseOut, true);
        doc.removeEventListener('click', handleElementClick, true);
      };
    };

    iframe.addEventListener('load', handleIframeInteraction);
    const innerCleanup = handleIframeInteraction();

    return () => {
      iframe.removeEventListener('load', handleIframeInteraction);
      if (innerCleanup) innerCleanup();
    };
  }, [currentCompiledCode, isInspectMode]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    const body = doc?.body;
    if (!doc || !body) return;

    const oldControls = doc.getElementById('emtee-element-toolbelt');
    if (oldControls) oldControls.remove();
    const oldOutline = doc.getElementById('emtee-selection-outline');
    if (oldOutline) oldOutline.remove();
    const oldResizers = doc.getElementById('emtee-element-resizers');
    if (oldResizers) oldResizers.remove();

    doc.querySelectorAll('.selected-element').forEach(el => el?.classList?.remove('selected-element'));

    if (selectedElementId) {
      const item = layoutItems.find(i => i.id === selectedElementId);
      let targetNode = null;

      if (item && item.isRawChild) {
         targetNode = doc.querySelector(`#${item.customId}`);
      } else {
         targetNode = doc.querySelector(`[data-id="${selectedElementId}"]`);
      }

      if (targetNode) {
        targetNode?.classList?.add('selected-element');

        const rect = targetNode.getBoundingClientRect();
        const scrollX = iframe.contentWindow.scrollX || doc.documentElement.scrollLeft;
        const scrollY = iframe.contentWindow.scrollY || doc.documentElement.scrollTop;
        
        let toolbeltTop = rect.top + scrollY - 32;
        if (toolbeltTop < scrollY) {
           toolbeltTop = rect.top + scrollY + 6; 
        }

        const toolbelt = doc.createElement('div');
        toolbelt.id = 'emtee-element-toolbelt';
        Object.assign(toolbelt.style, {
          position: 'absolute', 
          top: `${toolbeltTop}px`, 
          left: `${Math.max(0, rect.left + scrollX)}px`,
          zIndex: '99999', display: 'flex', alignItems: 'center', gap: '5px',
          backgroundColor: '#1e1b4b', padding: '4px 6px', borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
        });
        
        toolbelt.innerHTML = `
          <span style="font-family: monospace; font-size: 9px; color: #a5b4fc; font-weight: bold; padding: 0 4px; text-transform: uppercase;">${item?.type || 'tag'}</span>
          <button id="toolbelt-dup-action" style="background: #ffffff; border: none; color: #4f46e5; padding: 4px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 22px; height: 24px;" title="Duplicate Element">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
          </button>
          <button id="toolbelt-del-action" style="background: #ef4444; border: none; color: #ffffff; padding: 4px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 22px; height: 24px;" title="Delete Element">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-16v1a1 1 0 001 1h3m-10 0H4m11 0h1.5M9 7h6"></path></svg>
          </button>
        `;
        doc.body.appendChild(toolbelt);
        toolbelt.querySelector('#toolbelt-dup-action').onclick = (e) => { e.stopPropagation(); window.handleDuplicateItemExternal(selectedElementId); };
        toolbelt.querySelector('#toolbelt-del-action').onclick = (e) => { e.stopPropagation(); window.handleRemoveItemExternal(selectedElementId); };

        const outline = doc.createElement('div');
        outline.id = 'emtee-selection-outline';
        Object.assign(outline.style, {
          position: 'absolute', top: `${rect.top + scrollY}px`, left: `${rect.left + scrollX}px`,
          width: `${rect.width}px`, height: `${rect.height}px`, border: '2px solid #4f46e5',
          pointerEvents: 'none', zIndex: '99997'
        });
        doc.body.appendChild(outline);

        const resizersContainer = doc.createElement('div');
        resizersContainer.id = 'emtee-element-resizers';
        doc.body.appendChild(resizersContainer);

        const createAnchorSquare = (cursor) => {
          const sq = doc.createElement('div');
          Object.assign(sq.style, {
            position: 'absolute', width: '8px', height: '8px', backgroundColor: '#ffffff',
            border: '1.5px solid #4f46e5', borderRadius: '2px', cursor: cursor,
            zIndex: '99998', boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
          });
          resizersContainer.appendChild(sq);
          return sq;
        };

        const squareE = createAnchorSquare('ew-resize');
        const squareS = createAnchorSquare('ns-resize');
        const squareSE = createAnchorSquare('nwse-resize');

        const syncAnchors = (w, h) => {
          squareE.style.top = `${rect.top + scrollY + h / 2 - 4}px`;
          squareE.style.left = `${rect.left + scrollX + w - 4}px`;
          squareS.style.top = `${rect.top + scrollY + h - 4}px`;
          squareS.style.left = `${rect.left + scrollX + w / 2 - 4}px`;
          squareSE.style.top = `${rect.top + scrollY + h - 4}px`;
          squareSE.style.left = `${rect.left + scrollX + w - 4}px`;
        };
        syncAnchors(rect.width, rect.height);

        let isStretching = false;
        let activeHandle = '';
        let startMouseX = 0, startMouseY = 0;
        let startW = 0, startH = 0;

        const initStretch = (handleType, e) => {
          e.preventDefault(); e.stopPropagation();
          isStretching = true;
          activeHandle = handleType;
          startMouseX = e.clientX;
          startMouseY = e.clientY;
          startW = targetNode.offsetWidth;
          startH = targetNode.offsetHeight;

          doc.addEventListener('mousemove', processStretch);
          doc.addEventListener('mouseup', endStretch);
        };

        const processStretch = (moveEvent) => {
          if (!isStretching) return;
          const deltaX = moveEvent.clientX - startMouseX;
          const deltaY = moveEvent.clientY - startMouseY;

          let currentW = startW;
          let currentH = startH;

          if (activeHandle === 'E' || activeHandle === 'SE') {
            currentW = Math.max(25, startW + deltaX);
            if (targetNode?.style) targetNode.style.width = `${currentW}px`;
            outline.style.width = `${currentW}px`;
          }
          if (activeHandle === 'S' || activeHandle === 'SE') {
            currentH = Math.max(25, startH + deltaY);
            if (targetNode?.style) targetNode.style.height = `${currentH}px`;
            outline.style.height = `${currentH}px`;
          }

          // ✨ Keep toolbelt attached properly during resizing!
          let newToolbeltTop = rect.top + scrollY - 32;
          if (newToolbeltTop < scrollY) newToolbeltTop = rect.top + scrollY + 6;
          
          toolbelt.style.left = `${Math.max(0, rect.left + scrollX)}px`;
          toolbelt.style.top = `${newToolbeltTop}px`;
          
          syncAnchors(currentW, currentH);
        };

        const endStretch = () => {
          if (!isStretching) return;
          isStretching = false;
          doc.removeEventListener('mousemove', processStretch);
          doc.removeEventListener('mouseup', endStretch);

          const finalWidth = targetNode?.style?.width;
          const finalHeight = targetNode?.style?.height;
          const iframeWidth = doc.documentElement.clientWidth || iframe.contentWindow.innerWidth;
          
          setLayoutItems(prev => prev.map(item => {
            if (item.id === selectedElementId) {
              let updatedStyles = { ...item.styles };
              let updatedTablet = { ...item.tabletStyles };
              let updatedMobile = { ...item.mobileStyles };

              if (iframeWidth <= 640) {
                if (finalWidth) updatedMobile.width = finalWidth;
                if (finalHeight) updatedMobile.height = finalHeight;
              } else if (iframeWidth <= 1024) {
                if (finalWidth) updatedTablet.width = finalWidth;
                if (finalHeight) updatedTablet.height = finalHeight;
              } else {
                if (finalWidth) updatedStyles.width = finalWidth;
                if (finalHeight) updatedStyles.height = finalHeight;
              }

              return {
                ...item,
                styles: updatedStyles,
                tabletStyles: updatedTablet,
                mobileStyles: updatedMobile
              };
            }
            return item;
          }));
        };

        squareE.onmousedown = (e) => initStretch('E', e);
        squareS.onmousedown = (e) => initStretch('S', e);
        squareSE.onmousedown = (e) => initStretch('SE', e);
      }
    }
  }, [selectedElementId, currentCompiledCode, layoutItems, selectionNonce]);

  const handleApplyStyleChanges = (id, updates) => {
    const safeParentId = updates.parentId === '' ? null : updates.parentId;
    if (id === safeParentId) return;

    setLayoutItems(prev => prev.map(item => {
      if (item.id === id) {
        return { 
          ...item, 
          text: updates.text, 
          styles: updates.styles, 
          tabletStyles: updates.tabletStyles,
          mobileStyles: updates.mobileStyles,
          customId: updates.customId, 
          parentId: safeParentId,
          src: updates.src !== undefined ? updates.src : item.src,
          href: updates.href !== undefined ? updates.href : item.href,
          rawHtml: updates.rawHtml !== undefined ? updates.rawHtml : item.rawHtml
        };
      }
      return item;
    }));
  };

  if (sharedViewData) {
    const sharedLayouts = typeof sharedViewData.layouts === 'string' ? JSON.parse(sharedViewData.layouts) : (sharedViewData.layouts || []);
    const sharedCode = generateCanvasHtml(sharedLayouts);

    const handleImportShared = () => {
      const user = auth.currentUser;
      if (!user) {
        alert("Please sign in or create a free account to clone this amazing project to your own dashboard! 🚀");
        navigate('/authentication');
        return;
      }
      const sharedLayoutsStr = typeof sharedViewData.layouts === 'string' ? sharedViewData.layouts : JSON.stringify(sharedViewData.layouts || []);
      

      if (userRole === 'normal' && workspaces.length >= 3) {
         alert('Free Plan Limit: You can only have 3 active workspaces. Please delete an existing workspace from your Dashboard before importing this one.');
         return;
      }
      if (userRole === 'pro' && workspaces.length >= 10) {
         alert('Pro Plan Limit: 10 active workspaces. Please delete an existing workspace before importing.'); return;
      }

      const privateCount = workspaces.filter(w => !w.isPublic).length;
      const forcePublic = userRole === 'normal' && privateCount >= 1;

      const newId = generateProjectSlug(sharedViewData.name);
      const importedProject = {
        ...sharedViewData,
        id: newId,
        name: `${sharedViewData.name} (Imported)`,
        isPublic: forcePublic, allowCodeView: false, allowDomView: false,
        createdAt: Date.now(), updatedAt: Date.now()
      };
      
      set(ref(db, `users/${user.uid}/workspaces/${newId}`), importedProject).then(() => {
        setSharedViewData(null);
        setActiveWorkspaceId(newId);
        navigate(`/builder?u=${userProfile?.username}&ws=${newId}`, { replace: true });
      });
    };

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
        <nav className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white shrink-0 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg"><i className="bi bi-lightning-charge-fill text-white"></i></div>
            <div>
              <div className="font-bold text-sm tracking-wide text-slate-100">{sharedViewData.name}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Author: @{new URLSearchParams(location.search).get('u') || 'user'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Public link copied to clipboard!'); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 cursor-pointer">
              <i className="bi bi-share"></i> Share Link
            </button>
            <button onClick={handleImportShared} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20 cursor-pointer">
              <i className="bi bi-cloud-download"></i> Clone to My Workspace
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            <button onClick={() => { setSharedViewData(null); navigate('/user/home'); }} className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all border border-slate-700 hover:border-red-500/50 cursor-pointer" title="Exit Viewer">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </nav>
        <main className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col relative w-full">
          <CanvasContainer 
            code={sharedCode} 
            layoutItems={sharedLayouts}
            allowCodeView={sharedViewData.allowCodeView}
            allowDomView={sharedViewData.allowDomView}
            selectedElementId={null}
            onSelectElementId={()=>{}} onRemoveItem={()=>{}} onDuplicateItem={()=>{}}
            onApplyCodeChanges={null} 
          />
        </main>
      </div>
    );
  }

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} layoutItems={layoutItems} onAddItem={handleAddItem} onOpenWorkspaces={() => setIsWorkspacesModalOpen(true)} />
      
      <div className="flex flex-col flex-1 transition-all duration-300" style={{ paddingLeft: isCollapsed ? '4rem' : '16rem' }}>
        <Navbar 
          isCollapsed={isCollapsed} userProfile={userProfile} 
          activeWorkspaceName={activeWorkspaceName} onSaveWorkspace={handleSaveWorkspaceExplicitly} 
          onOpenExport={() => setIsExportModalOpen(true)}
          onGoHome={() => navigate('/user/home')}
          onOpenAccount={() => setIsAccountModalOpen(true)} 
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />
        
        <main className="p-2 mt-16 max-w-[1600px] w-full mx-auto flex flex-col flex-1 relative">
          <CanvasContainer 
            code={currentCompiledCode} 
            iframeRef={iframeRef} 
            layoutItems={layoutItems} 
            selectedElementId={selectedElementId} 
            onSelectElementId={handleSelectElement} 
            onRemoveItem={handleRemoveItem} 
            onDuplicateItem={handleDuplicateItem}
            onApplyCodeChanges={handleApplyCodeChanges} 
          />
          <InspectorPanel isInspectMode={isInspectMode} setIsInspectMode={setIsInspectMode} selectedElementId={selectedElementId} layoutItems={layoutItems} onApplyChanges={handleApplyStyleChanges} isMinimized={isInspectorMinimized} setIsMinimized={setIsInspectorMinimized} onMoveItem={handleMoveItem} />
        </main>
      </div>

      <AccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} userProfile={userProfile} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} autoSave={autoSave} onToggleAutoSave={() => setAutoSave(prev => !prev)} />
      
      <WorkspacesModal 
        isOpen={isWorkspacesModalOpen} onClose={() => setIsWorkspacesModalOpen(false)} 
        workspaces={workspaces} activeWorkspaceId={activeWorkspaceId}
        userRole={userRole}
        currentUserUid={auth.currentUser?.uid} currentUsername={userProfile?.username || 'user'} 
        onCreateWorkspace={handleCreateWorkspace} onSelectWorkspace={setActiveWorkspaceId} onDeleteWorkspace={handleDeleteWorkspace}
        onOpenWorkspaceSettings={setWorkspaceSettingsTarget} onDuplicateWorkspace={handleDuplicateWorkspace}
      />

      <WorkspaceSettingsModal isOpen={!!workspaceSettingsTarget} onClose={() => setWorkspaceSettingsTarget(null)} workspace={workspaceSettingsTarget} onSave={handleSaveWorkspaceSettings} userRole={userRole} workspaces={workspaces} />
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} code={currentCompiledCode} projectName={activeWorkspaceName} />
    </div>
  );
}