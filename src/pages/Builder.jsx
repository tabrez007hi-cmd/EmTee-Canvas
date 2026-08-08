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
import RoleBadge from '../components/RoleBadge';
import { useUI } from '../contexts/UIContext';
import { generateCanvasHtml } from '../utils/templates';
import { auth, db } from '../firebase';
import { ref, get, set, onValue, update } from 'firebase/database';

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

  const { showToast, showConfirm } = useUI();

  const [autoSave, setAutoSave] = useState(() => {
    const cachedPreference = localStorage.getItem('emtee_autosave_preference');
    return cachedPreference !== null ? JSON.parse(cachedPreference) : true;
  });

  useEffect(() => {
    localStorage.setItem('emtee_autosave_preference', JSON.stringify(autoSave));
  }, [autoSave]);

  const handleApplyCodeChanges = (newHtml) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(newHtml, 'text/html');

    let extractedStyles = '';
    doc.querySelectorAll('style').forEach(styleTag => {
      extractedStyles += styleTag.innerHTML + '\n';
    });

    const cleanedStyles = extractedStyles
      .replace(/\.selected-element\s*\{[^}]+\}/g, '')
      .replace(/::-webkit-scrollbar[^{]*\{[^}]+\}/g, '')
      .replace(/\*\s*\{[^}]+\}/g, '')
      .replace(/html,\s*body\s*\{[^}]+\}/g, '')
      .trim();

    setLayoutItems(prev => {
      let nextItems = JSON.parse(JSON.stringify(prev));

      let globalCssItem = nextItems.find(i => i.id === 'global_custom_css');
      if (cleanedStyles) {
        if (globalCssItem) {
          globalCssItem.rawHtml = `<style>\n${cleanedStyles}\n</style>`;
        } else {
          nextItems.push({
            id: 'global_custom_css', type: 'div', parentId: null, customId: 'emtee_global_css',
            styles: { display: 'none' }, tabletStyles: {}, mobileStyles: {},
            rawHtml: `<style>\n${cleanedStyles}\n</style>`, isRawChild: false
          });
        }
      } else if (globalCssItem) {
        globalCssItem.rawHtml = '';
      }

      nextItems.forEach(item => {
        if (item.id === 'global_custom_css') return;

        if (item.isRawChild) {
          const el = doc.getElementById(item.customId || item.id);
          if (el) item.rawHtml = el.outerHTML.replace(/\s*data-id="[^"]*"/g, '');
        } else {
          const el = doc.getElementById(item.customId || item.id);
          if (el) {
            if (item.type === 'img' && el.getAttribute('src')) item.src = el.getAttribute('src');
            if (item.type === 'a' && el.getAttribute('href')) item.href = el.getAttribute('href');
            if (el.getAttribute('id')) item.customId = el.getAttribute('id');

            const containerTags = ['div', 'section', 'article', 'form', 'nav', 'header', 'aside', 'footer', 'ul', 'ol', 'table', 'tbody', 'thead', 'tr'];
            if (!containerTags.includes(item.type)) {
              let directText = '';
              el.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) directText += node.textContent;
              });
              if (directText.trim() !== '') item.text = directText.trim();
            }
          }
        }
      });

      return nextItems;
    });

    showToast("Code modifications applied successfully! DOM Tree preserved. 🚀", "success");
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlOwner = queryParams.get('owner');
    const urlParamId = queryParams.get('ws');
    const user = auth.currentUser;

    if (!user && !urlOwner) {
      navigate('/authentication', { replace: true });
      return;
    }

    if (urlOwner && urlOwner !== user?.uid && urlParamId) {
      const sharedRef = ref(db, `publicWorkspaces/${urlParamId}`);
      get(sharedRef).then(snap => {
        if (snap.exists()) {
          setSharedViewData({ owner: urlOwner, ...snap.val() });
          setIsDataLoaded(true);
        } else {
          const privateRef = ref(db, `users/${urlOwner}/workspaces/${urlParamId}`);
          get(privateRef).then(privSnap => {
            if (privSnap.exists()) {
              const sharedWs = privSnap.val();
              if (!sharedWs.isPublic) {
                showToast('Access Denied 🔒\nThis workspace is private.', 'error');
                navigate(user ? '/user/home' : '/authentication', { replace: true });
              } else {
                setSharedViewData({ owner: urlOwner, ...sharedWs });
                setIsDataLoaded(true);
              }
            } else {
              showToast('Error ❌\nShared workspace not found.', 'error');
              navigate(user ? '/user/home' : '/authentication', { replace: true });
            }
          });
        }
      });
    }
  }, [navigate]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // ✨ BULLETPROOF FIX: 8-second safety timer to prevent infinite loading screens
    const safetyTimer = setTimeout(() => {
      setIsDataLoaded(true);
    }, 8000);

    const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS
      ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.toLowerCase().trim())
      : [];

    // ✨ FIX: Safe optional chaining to prevent silent crashes if user.email is null
    const isAdmin = user.email && ADMIN_EMAILS.includes(user.email?.toLowerCase().trim());

    const profileRef = ref(db, `users/${user.uid}/profile`);
    onValue(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserProfile(data);
        setUserRole(isAdmin ? 'admin' : (data.role || 'normal'));
      }
    }, (error) => console.error("Profile DB Error:", error));

    const workspacesRef = ref(db, `users/${user.uid}/workspaces`);
    onValue(workspacesRef, (snapshot) => {
      clearTimeout(safetyTimer); // Clear timer when DB responds!
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
        navigate('/user/home', { replace: true });
      }
    }, (error) => {
      clearTimeout(safetyTimer);
      setIsDataLoaded(true);
      showToast("Error connecting to database.", "error");
    });

    return () => clearTimeout(safetyTimer);
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
      } catch (e) { }

      if (canonicalRemote === currentLocalString) return;

      const updatedProject = {
        ...currentWorkspace,
        layouts: currentLocalString,
        updatedAt: Date.now()
      };

      const dbUpdates = {};
      dbUpdates[`users/${auth.currentUser.uid}/workspaces/${activeWorkspaceId}`] = updatedProject;

      if (updatedProject.isPublic) {
        dbUpdates[`publicWorkspaces/${activeWorkspaceId}`] = {
          ...updatedProject, authorId: auth.currentUser.uid, authorName: userProfile?.username || 'Unknown',
          authorPhoto: userProfile?.photoURL || null, authorRole: userRole
        };
      }

      update(ref(db), dbUpdates);
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

    const dbUpdates = {};
    dbUpdates[`users/${user.uid}/workspaces/${activeWorkspaceId}`] = updatedProject;

    if (updatedProject.isPublic) {
      dbUpdates[`publicWorkspaces/${activeWorkspaceId}`] = {
        ...updatedProject, authorId: user.uid, authorName: userProfile?.username || 'Unknown',
        authorPhoto: userProfile?.photoURL || null, authorRole: userRole
      };
    }

    update(ref(db), dbUpdates).then(() => {
      showToast('Workspace sync complete! Saved to cloud.', 'success');
    });
  };

  const handleCreateWorkspace = () => {
    if (userRole === 'normal' && workspaces.length >= 3) {
      showToast('Free Plan Limit: Maximum 3 active workspaces.', 'error');
      return;
    }
    if (userRole === 'pro' && workspaces.length >= 10) {
      showToast('Pro Plan Limit: Maximum 10 active workspaces.', 'error');
      return;
    }

    showConfirm({
      title: 'New Workspace',
      message: 'Enter a name for your new project:',
      isPrompt: true,
      confirmText: 'Create',
      onConfirm: (name) => {
        if (!name || !name.trim()) return;

        const privateCount = workspaces.filter(w => !w.isPublic).length;
        const forcePublic = userRole === 'normal' && privateCount >= 1;

        const user = auth.currentUser;
        const newId = generateProjectSlug(name);
        const newWS = { id: newId, name: name.trim(), layouts: '[]', isPublic: forcePublic, allowCodeView: false, allowDomView: false, createdAt: Date.now(), updatedAt: Date.now() };

        const dbUpdates = {};
        dbUpdates[`users/${user.uid}/workspaces/${newId}`] = newWS;

        if (forcePublic) {
          dbUpdates[`publicWorkspaces/${newId}`] = {
            ...newWS, authorId: user.uid, authorName: userProfile?.username || 'Unknown',
            authorPhoto: userProfile?.photoURL || null, authorRole: userRole
          };
        }

        update(ref(db), dbUpdates).then(() => {
          setActiveWorkspaceId(newId);
          showToast('Workspace created successfully!', 'success');
        });
      }
    });
  };

  const handleDeleteWorkspace = (id) => {
    if (workspaces.length <= 1) return;
    showConfirm({
      title: 'Delete Workspace?',
      message: 'Are you absolutely sure you want to drop this project permanently? 🚨',
      danger: true,
      confirmText: 'Delete',
      onConfirm: () => {
        const user = auth.currentUser;
        const dbUpdates = {};
        dbUpdates[`users/${user.uid}/workspaces/${id}`] = null;
        dbUpdates[`publicWorkspaces/${id}`] = null;
        update(ref(db), dbUpdates);
        showToast('Workspace deleted permanently.', 'success');
      }
    });
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

      const dbUpdates = {};
      dbUpdates[`users/${user.uid}/workspaces/${newId}`] = updatedWS;

      if (id !== newId) {
        dbUpdates[`users/${user.uid}/workspaces/${id}`] = null;
        dbUpdates[`publicWorkspaces/${id}`] = null;
      }

      if (updatedWS.isPublic) {
        dbUpdates[`publicWorkspaces/${newId}`] = {
          ...updatedWS, authorId: user.uid, authorName: userProfile?.username || 'Unknown',
          authorPhoto: userProfile?.photoURL || null, authorRole: userRole
        };
      } else {
        dbUpdates[`publicWorkspaces/${newId}`] = null;
      }

      update(ref(db), dbUpdates).then(() => {
        if (id !== newId && activeWorkspaceId === id) {
          setActiveWorkspaceId(newId);
        }
      });
    }
  };

  const handleDuplicateWorkspace = (id) => {
    if (userRole === 'normal' && workspaces.length >= 3) {
      showToast('Free Plan Limit: You can only have 3 active workspaces. Please upgrade to Pro or Developer to duplicate projects.', 'error');
      return;
    }
    if (userRole === 'pro' && workspaces.length >= 10) {
      showToast('Pro Plan Limit: You can only have 10 active workspaces.', 'error');
      return;
    }

    const match = workspaces.find(w => w.id === id);
    if (!match) return;

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

    const dbUpdates = {};
    dbUpdates[`users/${user.uid}/workspaces/${copyId}`] = clonedWS;

    if (forcePublic) {
      dbUpdates[`publicWorkspaces/${copyId}`] = {
        ...clonedWS, authorId: user.uid, authorName: userProfile?.username || 'Unknown',
        authorPhoto: userProfile?.photoURL || null, authorRole: userRole
      };
    }

    update(ref(db), dbUpdates);
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
    const parentId = `e${Math.random().toString(36).substr(2, 6)}`;

    const isContainer = ['div', 'section', 'article', 'header', 'aside', 'footer', 'nav', 'main', 'details', 'dialog', 'fieldset', 'figure', 'hgroup'].includes(type);
    const isInput = ['input', 'textarea', 'select', 'datalist', 'output', 'meter', 'progress'].includes(type);
    const isMedia = ['img', 'video', 'audio', 'iframe', 'canvas', 'svg', 'object', 'embed'].includes(type);
    const isList = ['ul', 'ol', 'dl'].includes(type);
    const isTable = ['table', 'thead', 'tbody', 'tfoot', 'tr', 'colgroup'].includes(type);
    const isTableCell = ['td', 'th'].includes(type);
    const isListItem = ['li', 'dt', 'dd'].includes(type);
    const isLink = type === 'a';
    const isBtn = type === 'button';
    const hasSrc = ['img', 'video', 'audio', 'iframe', 'embed', 'source', 'track'].includes(type);
    const hasHref = ['a', 'area', 'base', 'link'].includes(type);

    let defaultText = '';
    const emptyElements = ['br', 'wbr', 'hr', 'area', 'col', 'source', 'track', 'img', 'input', 'embed', 'keygen', 'spacer'];
    if (!isMedia && !isInput && !isContainer && !isList && !isTable && !isTableCell && !isListItem && !emptyElements.includes(type)) {
      defaultText = isLink ? 'Link Text' : isBtn ? 'Button' : `${type.toUpperCase()} Element`;
    }

    let defaultStyles = { fontSize: '16px', color: '#1f2937', transition: 'all 0.2s ease', wordWrap: 'break-word' };

    if (isContainer) defaultStyles = { minHeight: '50px', width: '100%', padding: '20px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px', boxSizing: 'border-box' };

    if (isTable) {
      defaultStyles = { width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' };
      if (type === 'table') defaultStyles.backgroundColor = '#ffffff';
    }
    if (isTableCell) {
      defaultStyles = { padding: '12px', border: '1px solid #cbd5e1', textAlign: 'left' };
    }

    if (type === 'h1') defaultStyles = { ...defaultStyles, fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.2' };
    if (type === 'h2') defaultStyles = { ...defaultStyles, fontSize: '2rem', fontWeight: '700', lineHeight: '1.3' };
    if (type === 'h3') defaultStyles = { ...defaultStyles, fontSize: '1.75rem', fontWeight: '700', lineHeight: '1.4' };
    if (type === 'h4') defaultStyles = { ...defaultStyles, fontSize: '1.5rem', fontWeight: '600', lineHeight: '1.5' };
    if (type === 'h5') defaultStyles = { ...defaultStyles, fontSize: '1.25rem', fontWeight: '600' };
    if (type === 'h6') defaultStyles = { ...defaultStyles, fontSize: '1rem', fontWeight: '600' };

    if (type === 'p') defaultStyles = { ...defaultStyles, fontSize: '1rem', lineHeight: '1.6' };
    if (type === 'strong' || type === 'b') defaultStyles = { ...defaultStyles, fontWeight: 'bold' };
    if (type === 'em' || type === 'i') defaultStyles = { ...defaultStyles, fontStyle: 'italic' };
    if (type === 'u' || type === 'ins') defaultStyles = { ...defaultStyles, textDecoration: 'underline' };
    if (type === 's' || type === 'strike' || type === 'del') defaultStyles = { ...defaultStyles, textDecoration: 'line-through' };
    if (type === 'mark') defaultStyles = { ...defaultStyles, backgroundColor: '#fef08a', padding: '0 4px', color: '#000' };
    if (type === 'code' || type === 'pre' || type === 'kbd' || type === 'samp') defaultStyles = { ...defaultStyles, fontFamily: 'monospace', backgroundColor: '#f1f5f9', padding: '4px 6px', borderRadius: '4px' };
    if (type === 'blockquote') defaultStyles = { ...defaultStyles, borderLeft: '4px solid #cbd5e1', paddingLeft: '16px', fontStyle: 'italic', color: '#64748b', margin: '10px 0' };
    if (type === 'a') defaultStyles = { ...defaultStyles, color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' };
    if (type === 'hr') defaultStyles = { width: '100%', borderTop: '1px solid #cbd5e1', margin: '16px 0' };

    if (isBtn) defaultStyles = { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-block' };
    if (isInput) defaultStyles = { width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem', backgroundColor: '#ffffff' };

    if (type === 'img') defaultStyles = { width: '100%', maxWidth: '300px', height: 'auto', borderRadius: '8px', objectFit: 'cover' };
    if (type === 'video' || type === 'iframe' || type === 'canvas' || type === 'object') defaultStyles = { width: '100%', minHeight: '200px', backgroundColor: '#e2e8f0', borderRadius: '8px' };
    if (type === 'audio') defaultStyles = { width: '100%', height: '54px' };
    if (type === 'svg') defaultStyles = { minHeight: '100px', width: '100px', backgroundColor: '#f1f5f9' };

    if (isList) defaultStyles = { paddingLeft: '20px', marginBottom: '1rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' };

    newItems.push({
      id: parentId, type: type, customId: '', parentId: null,
      text: defaultText,
      src: hasSrc ? (type === 'img' ? 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=400&q=80' : type === 'iframe' ? 'https://example.com' : '') : null,
      href: hasHref ? '#' : null,
      placeholder: isInput ? 'Enter data here...' : null,
      inputType: type === 'input' ? 'text' : null,
      styles: defaultStyles,
      tabletStyles: {}, mobileStyles: {},
      hoverStyles: {}, tabletHoverStyles: {}, mobileHoverStyles: {},
      rawHtml: '', attributes: {}
    });

    setLayoutItems(prev => [...prev, ...newItems]);
    showToast(`Added <${type}> to canvas`, 'success');
  };

  const handleRemoveItem = (id) => {
    const idsToRemove = new Set([id]);
    let foundNew = true;
    while (foundNew) {
      foundNew = false;
      layoutItems.forEach(item => {
        if (item.parentId && idsToRemove.has(item.parentId) && !idsToRemove.has(item.id)) {
          idsToRemove.add(item.id);
          foundNew = true;
        }
      });
    }

    setLayoutItems(prev => {
      const nextItems = prev.filter(item => !idsToRemove.has(item.id));

      const itemToDelete = prev.find(i => i.id === id);
      if (itemToDelete && itemToDelete.isRawChild && itemToDelete.parentId) {
        const parentIndex = nextItems.findIndex(i => i.id === itemToDelete.parentId);
        if (parentIndex !== -1) {
          const parent = nextItems[parentIndex];
          if (parent.rawHtml) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(parent.rawHtml, 'text/html');
            const targetEl = doc.getElementById(itemToDelete.customId || itemToDelete.id);
            if (targetEl) {
              targetEl.remove();
              nextItems[parentIndex] = { ...parent, rawHtml: doc.body.innerHTML.replace(/\s*data-id="[^"]*"/g, '') };
            }
          }
        }
      }
      return nextItems;
    });

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
      const newId = `e${Math.random().toString(36).substr(2, 6)}`;
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

      if (itemToCopy.isRawChild && itemToCopy.parentId) {
        const parentIndex = nextArr.findIndex(i => i.id === itemToCopy.parentId);
        if (parentIndex !== -1) {
          const parent = nextArr[parentIndex];
          if (parent.rawHtml) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(parent.rawHtml, 'text/html');
            const targetEl = doc.getElementById(itemToCopy.customId || itemToCopy.id);
            if (targetEl) {
              const cloneEl = targetEl.cloneNode(true);
              cloneEl.id = newRootCustomId;
              targetEl.parentNode.insertBefore(cloneEl, targetEl.nextSibling);
              nextArr[parentIndex] = { ...parent, rawHtml: doc.body.innerHTML.replace(/\s*data-id="[^"]*"/g, '') };
            }
          }
        }
      }

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

        const target = e.target;
        if (!target || target === body || target.tagName === 'HTML' || target.id === 'canvas-sidebar') return;
        e.stopPropagation();

        doc.querySelectorAll('*').forEach(el => {
          if (el?.style && el.id !== 'emtee-element-toolbelt' && !el.closest('#emtee-element-toolbelt')) {
            el.style.outline = ''; el.style.outlineOffset = ''; el.style.cursor = '';
          }
        });

        if (target?.style) {
          target.style.outline = '2px dashed #818cf8';
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

        let targetDataId = targetElement.getAttribute('data-id');

        if (!targetDataId) {
          let targetId = targetElement.getAttribute('id');
          if (!targetId) {
            targetId = `e${Math.random().toString(36).substr(2, 6)}`;
            targetElement.setAttribute('id', targetId);
          }

          const parentNode = targetElement.closest('[data-id]');
          if (parentNode) {
            const pDataId = parentNode.getAttribute('data-id');
            const parentItem = layoutItems.find(i => i.id === pDataId);

            if (parentItem) {
              const newId = targetId;

              setLayoutItems(prev => {
                const next = [...prev];
                const pIndex = next.findIndex(i => i.id === parentItem.id);
                if (pIndex > -1) {
                  const cleanOuterHTML = parentNode.outerHTML.replace(/\s*data-id="[^"]*"/g, '');
                  next[pIndex] = { ...next[pIndex], rawHtml: cleanOuterHTML };
                }
                if (!next.find(i => i.id === newId)) {
                  next.push({
                    id: newId, type: targetElement.tagName.toLowerCase(),
                    customId: targetId, parentId: parentItem.id, isRawChild: true,
                    text: targetElement.innerHTML || '', src: targetElement.getAttribute('src') || '',
                    href: targetElement.getAttribute('href') || '', styles: {}, tabletStyles: {}, mobileStyles: {},
                    hoverStyles: {}, tabletHoverStyles: {}, mobileHoverStyles: {},
                    rawHtml: '', attributes: {}
                  });
                }
                return next;
              });
              handleSelectElement(newId);
            }
          }
        } else {
          handleSelectElement(targetDataId);
        }

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
  }, [currentCompiledCode, isInspectMode, layoutItems]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    const body = doc?.body;
    if (!doc || !body) return;

    if (!isInspectMode) {
      doc.querySelectorAll('*').forEach(el => {
        if (el?.style && el.id !== 'emtee-element-toolbelt' && !el.closest('#emtee-element-toolbelt')) {
          el.style.outline = ''; el.style.outlineOffset = ''; el.style.cursor = '';
        }
      });
      body?.classList?.remove('inspect-mode');
    } else {
      body?.classList?.add('inspect-mode');
    }

    const oldControls = doc.getElementById('emtee-element-toolbelt');
    if (oldControls) oldControls.remove();
    const oldOutline = doc.getElementById('emtee-selection-outline');
    if (oldOutline) oldOutline.remove();

    doc.querySelectorAll('.selected-element').forEach(el => el?.classList?.remove('selected-element'));

    if (selectedElementId) {
      const item = layoutItems.find(i => i.id === selectedElementId);
      let targetNode = null;

      if (item) {
        targetNode = doc.getElementById(item.customId || item.id);
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
          backgroundColor: '#0f172a', padding: '4px 6px', borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', border: '1px solid #334155'
        });

        toolbelt.innerHTML = `
          <span style="font-family: monospace; font-size: 9px; color: #818cf8; font-weight: bold; padding: 0 4px; text-transform: uppercase;">${item?.type || 'tag'}</span>
          <button id="toolbelt-dup-action" style="background: #1e293b; border: 1px solid #334155; color: #818cf8; padding: 4px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 22px; height: 24px;" title="Duplicate Element">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
          </button>
          <button id="toolbelt-del-action" style="background: #1e293b; border: 1px solid #334155; color: #f87171; padding: 4px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 22px; height: 24px;" title="Delete Element">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-16v1a1 1 0 001 1h3m-10 0H4m11 0h1.5M9 7h6"></path></svg>
          </button>
        `;
        doc.body.appendChild(toolbelt);

        toolbelt.querySelector('#toolbelt-dup-action').onclick = (e) => { e.stopPropagation(); handleDuplicateItem(selectedElementId); };
        toolbelt.querySelector('#toolbelt-del-action').onclick = (e) => { e.stopPropagation(); handleRemoveItem(selectedElementId); };

        const outline = doc.createElement('div');
        outline.id = 'emtee-selection-outline';
        Object.assign(outline.style, {
          position: 'absolute', top: `${rect.top + scrollY}px`, left: `${rect.left + scrollX}px`,
          width: `${rect.width}px`, height: `${rect.height}px`, border: '2px solid #6366f1',
          pointerEvents: 'none', zIndex: '99997'
        });
        doc.body.appendChild(outline);
      }
    }
  }, [selectedElementId, currentCompiledCode, layoutItems, selectionNonce, isInspectMode]);

  const handleApplyStyleChanges = (id, updates) => {
    const safeParentId = updates.parentId === '' ? null : updates.parentId;
    if (id === safeParentId) return;

    setLayoutItems(prev => {
      const oldItem = prev.find(item => item.id === id);

      let nextItems = prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            text: updates.text,
            styles: updates.styles,
            tabletStyles: updates.tabletStyles,
            mobileStyles: updates.mobileStyles,
            hoverStyles: updates.hoverStyles,
            tabletHoverStyles: updates.tabletHoverStyles,
            mobileHoverStyles: updates.mobileHoverStyles,
            customId: updates.customId,
            parentId: safeParentId,
            src: updates.src !== undefined ? updates.src : item.src,
            href: updates.href !== undefined ? updates.href : item.href,
            rawHtml: updates.rawHtml !== undefined ? updates.rawHtml : item.rawHtml,
            attributes: updates.attributes !== undefined ? updates.attributes : (item.attributes || {})
          };
        }
        return item;
      });

      if (oldItem && oldItem.isRawChild && oldItem.parentId) {
        const parentIndex = nextItems.findIndex(i => i.id === oldItem.parentId);
        if (parentIndex !== -1) {
          const parent = nextItems[parentIndex];
          if (parent.rawHtml) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(parent.rawHtml, 'text/html');
            const targetEl = doc.getElementById(oldItem.customId || oldItem.id);

            if (targetEl) {
              if (updates.text !== oldItem.text) targetEl.innerHTML = updates.text;
              if (updates.customId !== oldItem.customId) targetEl.id = updates.customId;
              if (updates.src !== undefined && updates.src !== oldItem.src) targetEl.setAttribute('src', updates.src);
              if (updates.href !== undefined && updates.href !== oldItem.href) targetEl.setAttribute('href', updates.href);

              nextItems[parentIndex] = { ...parent, rawHtml: doc.body.innerHTML.replace(/\s*data-id="[^"]*"/g, '') };
            }
          }
        }
      }

      return nextItems;
    });
  };

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} layoutItems={layoutItems} onAddItem={handleAddItem} onOpenWorkspaces={() => setIsWorkspacesModalOpen(true)} />

      <div className="flex flex-col flex-1 transition-all duration-300" style={{ paddingLeft: isCollapsed ? '4.5rem' : '18rem' }}>
        <Navbar
          isCollapsed={isCollapsed} userProfile={userProfile}
          activeWorkspaceName={activeWorkspaceName} onSaveWorkspace={handleSaveWorkspaceExplicitly}
          onOpenExport={() => setIsExportModalOpen(true)}
          onGoHome={() => navigate('/user/home')}
          onOpenAccount={() => setIsAccountModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenWorkspaces={() => setIsWorkspacesModalOpen(true)}
          onOpenWorkspaceSettings={() => setWorkspaceSettingsTarget(workspaces.find(w => w.id === activeWorkspaceId))}
        />

        <main className="p-4 mt-16 max-w-[1600px] w-full mx-auto flex flex-col flex-1 relative">
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

      <WorkspaceSettingsModal
        isOpen={!!workspaceSettingsTarget}
        onClose={() => setWorkspaceSettingsTarget(null)}
        workspace={workspaceSettingsTarget}
        onSave={handleSaveWorkspaceSettings}
        userRole={userRole}
        workspaces={workspaces}
        onDuplicateWorkspace={handleDuplicateWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
      />
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} code={generateCanvasHtml(layoutItems, true)} projectName={activeWorkspaceName} userRole={userRole} />
    </div>
  );
}