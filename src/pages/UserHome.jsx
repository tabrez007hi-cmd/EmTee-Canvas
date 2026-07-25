import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { ref, onValue, set, update } from 'firebase/database';

import AccountModal from '../components/AccountModal';
import WorkspaceSettingsModal from '../components/WorkspaceSettingsModal'; 
import DashboardWorkspaces from '../components/DashboardWorkspaces';
import DashboardTemplates from '../components/DashboardTemplates';
import DashboardExplore from '../components/DashboardExplore';
import NotificationBell from '../components/NotificationBell';

import { generateCanvasHtml } from '../utils/templates'; 
import { systemTemplates } from '../utils/systemTemplates'; 

const generateProjectSlug = (name) => {
  const cleanName = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const uniqueId = Math.random().toString(36).substr(2, 6);
  return `${cleanName}_${uniqueId}`;
};

export default function UserHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/').pop() || 'home'; 

  const [workspaces, setWorkspaces] = useState([]);
  const [globalTemplates, setGlobalTemplates] = useState([]); 
  const [exploreWorkspaces, setExploreWorkspaces] = useState([]);

  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState('normal'); 
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [workspaceSettingsTarget, setWorkspaceSettingsTarget] = useState(null);
  
  const [previewItem, setPreviewItem] = useState(null);
  const [previewMode, setPreviewMode] = useState('preview'); 
  
  const [pendingClone, setPendingClone] = useState(null);
  const [workspaceToReplace, setWorkspaceToReplace] = useState('');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { navigate('/authentication'); return; }

    const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.toLowerCase().trim()) : [];
    const isHardcodedDev = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim());

    const profileRef = ref(db, `users/${user.uid}/profile`);
    onValue(profileRef, (snapshot) => {
      if (snapshot.exists()) {
         const data = snapshot.val();
         setUserProfile(data);
         setUserRole(isHardcodedDev ? 'admin' : (data.role || 'normal'));
      }
    });

    onValue(ref(db, `users/${user.uid}/workspaces`), (snapshot) => {
      if (snapshot.exists()) {
        setWorkspaces(Object.values(snapshot.val()).sort((a, b) => b.updatedAt - a.updatedAt));
      } else { setWorkspaces([]); }
      setLoading(false);
    });

    onValue(ref(db, 'templates'), (snapshot) => {
      if (snapshot.exists()) setGlobalTemplates(Object.values(snapshot.val()).sort((a, b) => b.createdAt - a.createdAt));
      else setGlobalTemplates([]);
    });

    onValue(ref(db, 'publicWorkspaces'), (snapshot) => {
      if (snapshot.exists()) {
        const publicItems = Object.values(snapshot.val());
        const formattedItems = publicItems.map(ws => ({
          ...ws,
          likeCount: ws.likes ? Object.keys(ws.likes).length : 0,
          isLikedByMe: ws.likes ? !!ws.likes[user.uid] : false
        }));
        formattedItems.sort((a, b) => b.updatedAt - a.updatedAt);
        setExploreWorkspaces(formattedItems);
      } else {
        setExploreWorkspaces([]);
      }
    });
  }, [navigate]);

  const atWorkspaceLimit = (userRole === 'normal' && workspaces.length >= 3) || (userRole === 'pro' && workspaces.length >= 10);

  const handleInitiateClone = (item, defaultName = 'New Project') => {
     setPreviewItem(item); 
  };

  const confirmCloneExecution = () => {
      const layoutsStr = typeof previewItem.layouts === 'string' ? previewItem.layouts : JSON.stringify(previewItem.layouts || []);
      const defaultName = previewItem.name || 'Imported Project';

      if (atWorkspaceLimit) {
         setPreviewItem(null);
         setPendingClone({ layouts: layoutsStr, name: defaultName });
         return;
      }
      executeCloneSave(layoutsStr, defaultName);
  };

  const executeCloneSave = (layoutsStr, defaultName, replaceId = null) => {
    const user = auth.currentUser;
    const newId = generateProjectSlug(defaultName);
    
    const privateCount = workspaces.filter(w => !w.isPublic && w.id !== replaceId).length;
    const forcePublic = userRole === 'normal' && privateCount >= 1;

    const newWS = { 
      id: newId, name: defaultName, layouts: layoutsStr, 
      isPublic: forcePublic, allowCodeView: false, allowDomView: false, 
      createdAt: Date.now(), updatedAt: Date.now() 
    };

    const dbUpdates = {};
    if (replaceId) {
       dbUpdates[`users/${user.uid}/workspaces/${replaceId}`] = null;
       dbUpdates[`publicWorkspaces/${replaceId}`] = null; 
    }
    
    dbUpdates[`users/${user.uid}/workspaces/${newId}`] = newWS;
    
    if (forcePublic) {
       dbUpdates[`publicWorkspaces/${newId}`] = { 
         ...newWS, authorId: user.uid, authorName: userProfile?.username || 'Unknown', 
         authorPhoto: userProfile?.photoURL || null, authorRole: userRole 
       };
    }

    update(ref(db), dbUpdates).then(() => {
       navigate(`/builder?u=${userProfile?.username || 'user'}&ws=${newId}`);
    });
  };

  const handleToggleLike = async (e, workspaceId, authorId, isLikedByMe) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) return;
    
    const updates = {};
    if (isLikedByMe) {
      updates[`users/${authorId}/workspaces/${workspaceId}/likes/${user.uid}`] = null;
      updates[`publicWorkspaces/${workspaceId}/likes/${user.uid}`] = null;
    } else {
      updates[`users/${authorId}/workspaces/${workspaceId}/likes/${user.uid}`] = true;
      updates[`publicWorkspaces/${workspaceId}/likes/${user.uid}`] = true;
    }
    await update(ref(db), updates);
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to permanently delete this template?')) await set(ref(db, `templates/${templateId}`), null);
  };

  const handleSaveWorkspaceSettings = async (id, updates, swapId = null) => {
    const user = auth.currentUser;
    const match = workspaces.find(w => w.id === id);
    if (!match) return;

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

    if (swapId) {
      const swapMatch = workspaces.find(w => w.id === swapId);
      if (swapMatch) {
        const swappedWS = { ...swapMatch, isPublic: true, updatedAt: Date.now() };
        dbUpdates[`users/${user.uid}/workspaces/${swapId}`] = swappedWS;
        dbUpdates[`publicWorkspaces/${swapId}`] = { 
          ...swappedWS, authorId: user.uid, authorName: userProfile?.username || 'Unknown', 
          authorPhoto: userProfile?.photoURL || null, authorRole: userRole 
        };
      }
    }

    try {
      await update(ref(db), dbUpdates);
      setWorkspaceSettingsTarget(null);
    } catch (err) {
      alert("Error saving settings.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-950 flex overflow-hidden font-sans text-slate-200">
      
      {/* ✨ FIX: Increased z-[60] to prevent the button from hiding under the top navigation */}
      <aside className={`relative h-full bg-slate-900 border-r border-slate-800 hidden md:flex flex-col z-[60] shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-[72px]' : 'w-72'}`}>
        
        {/* Collapse Toggle Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          className="absolute top-5 -right-3.5 z-50 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-indigo-500 rounded-full w-7 h-7 flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-pointer transition-all"
        >
          <i className={`bi ${isSidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'} text-xs font-bold`}></i>
        </button>

        <div className={`h-16 flex items-center border-b border-slate-800 shrink-0 transition-all ${isSidebarCollapsed ? 'justify-center px-0' : 'px-6 gap-3'}`}>
           <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.4)] shrink-0">
             <i className="bi bi-lightning-charge-fill text-white text-lg"></i>
           </div>
           {!isSidebarCollapsed && <span className="font-extrabold text-white tracking-tight text-lg drop-shadow-md truncate">EmTeeCanvas</span>}
        </div>
        
        <div className="p-3 space-y-2 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar mt-2">
           {!isSidebarCollapsed && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-3">Main Menu</div>}
           
           <button onClick={() => navigate('/user/home')} className={`w-full flex items-center py-3 rounded-xl transition-colors cursor-pointer border ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-3.5'} ${activeTab === 'home' ? 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_10px_rgba(79,70,229,0.1)]' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white border-transparent'}`} title={isSidebarCollapsed ? "My Workspaces" : ""}>
              <i className="bi bi-grid-1x2-fill text-[15px]"></i>
              {!isSidebarCollapsed && <span className="font-bold text-sm">My Workspaces</span>}
           </button>

           <button onClick={() => navigate('/user/templates')} className={`w-full flex items-center py-3 rounded-xl transition-colors cursor-pointer border ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-3.5'} ${activeTab === 'templates' ? 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_10px_rgba(79,70,229,0.1)]' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white border-transparent'}`} title={isSidebarCollapsed ? "Browse Templates" : ""}>
              <i className="bi bi-layout-wtf text-[15px]"></i>
              {!isSidebarCollapsed && <span className="font-bold text-sm truncate">Browse Templates</span>}
           </button>

           <button onClick={() => navigate('/user/explore')} className={`w-full flex items-center py-3 rounded-xl transition-colors cursor-pointer border ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-3.5'} ${activeTab === 'explore' ? 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_10px_rgba(79,70,229,0.1)]' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white border-transparent'}`} title={isSidebarCollapsed ? "Explore Works" : ""}>
              <i className="bi bi-compass text-[15px]"></i>
              {!isSidebarCollapsed && <span className="font-bold text-sm truncate">Explore Works</span>}
           </button>
           
           <div className="mt-8"></div>
           {!isSidebarCollapsed && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-3">Account Status</div>}

           {userRole !== 'admin' && (
             <button onClick={() => navigate('/join-membership')} className={`w-full flex items-center py-3 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-colors cursor-pointer shadow-sm ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-3.5'}`} title={isSidebarCollapsed ? "Upgrade Plan" : ""}>
                <i className="bi bi-star-fill text-[15px] drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]"></i>
                {!isSidebarCollapsed && <span className="font-bold text-sm truncate">Upgrade Plan</span>}
             </button>
           )}

           {auth.currentUser?.email && ["tabrez007hi@gmail.com", "admin@gmail.com"].includes(auth.currentUser.email.toLowerCase()) && (
             <button onClick={() => navigate('/admin-dashboard')} className={`w-full flex items-center py-3 mt-2 text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 rounded-xl transition-colors cursor-pointer shadow-sm ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-3.5'}`} title={isSidebarCollapsed ? "Admin Panel" : ""}>
                <i className="bi bi-shield-lock-fill text-[15px] drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]"></i>
                {!isSidebarCollapsed && <span className="font-bold text-sm truncate">Admin Panel</span>}
             </button>
           )}

           <div className={`mt-6 ${isSidebarCollapsed ? 'flex justify-center' : 'px-3'}`}>
              <div className={`flex items-center justify-center font-bold rounded-lg border ${isSidebarCollapsed ? 'w-10 h-10' : 'px-3 py-2.5 gap-2'} ${userRole === 'admin' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' : userRole === 'developer' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : userRole === 'pro' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'}`} title={`${userRole.toUpperCase()} PLAN`}>
                
                {userRole === 'admin' ? <i className="bi bi-shield-lock-fill text-[15px]"></i> : userRole === 'developer' ? <i className="bi bi-code-square text-[15px]"></i> : userRole === 'pro' ? <i className="bi bi-star-fill text-[15px]"></i> : <i className="bi bi-person text-[15px]"></i>}
                {!isSidebarCollapsed && <span className="text-[11px] tracking-widest">{userRole.toUpperCase()} PLAN</span>}
              </div>
           </div>
        </div>

        {(userRole === 'developer' || userRole === 'admin') && (
          <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-950/50">
            <button onClick={() => navigate('/deploy-template')} className={`flex items-center justify-center text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.3)] w-full py-3 ${isSidebarCollapsed ? 'px-0' : 'px-3 gap-2'}`} title={isSidebarCollapsed ? "Deploy Template" : ""}>
              <i className="bi bi-cloud-arrow-up-fill text-lg"></i>
              {!isSidebarCollapsed && <span className="font-bold text-sm tracking-wide">Deploy Template</span>}
            </button>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-950 transition-all duration-300">
        <nav className="relative h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 z-50 shadow-md md:shadow-none">
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.4)]"><i className="bi bi-lightning-charge-fill text-white"></i></div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
             <div className="font-bold text-white text-lg">Dashboard</div>
             <div className="h-4 w-px bg-slate-700"></div>
             <div className="text-sm font-semibold text-slate-400 capitalize">{activeTab === 'home' ? 'Workspaces' : activeTab}</div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <NotificationBell />
            <div className="w-px h-6 bg-slate-800"></div>
            <button onClick={() => setIsAccountModalOpen(true)} className="flex items-center gap-2 hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-700">
              <span className="text-sm font-semibold text-slate-300 hidden lg:block">{userProfile?.username || 'Developer'}</span>
              {userProfile?.photoURL && !imgError ? (
                <img src={userProfile.photoURL} alt="User" onError={() => setImgError(true)} className="h-8 w-8 rounded-full object-cover border border-slate-700" />
              ) : (
                <div className="h-8 w-8 bg-slate-800 rounded-full flex items-center justify-center text-indigo-400 border border-slate-700 shadow-sm"><i className="bi bi-person-fill text-lg mt-1"></i></div>
              )}
            </button>
            <div className="w-px h-6 bg-slate-800 hidden sm:block"></div>
            <button onClick={handleLogout} className="px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-xs font-bold rounded-md transition-all cursor-pointer shadow-sm">Logout</button>
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto w-full custom-scrollbar relative">
          <div className="max-w-6xl mx-auto p-6 sm:p-10 relative z-10">
             {activeTab === 'home' && <DashboardWorkspaces workspaces={workspaces} handleCreateProject={() => executeCloneSave('[]', 'New Project')} atWorkspaceLimit={atWorkspaceLimit} setWorkspaceSettingsTarget={setWorkspaceSettingsTarget} navigate={navigate} userProfile={userProfile} />}
             {activeTab === 'templates' && <DashboardTemplates allTemplates={[...systemTemplates, ...globalTemplates]} handleClone={handleInitiateClone} handleDeleteTemplate={handleDeleteTemplate} currentUid={auth.currentUser?.uid} navigate={navigate} />}
             {activeTab === 'explore' && <DashboardExplore exploreWorkspaces={exploreWorkspaces} handleToggleLike={handleToggleLike} handleClone={handleInitiateClone} navigate={navigate} />}
          </div>
        </main>
      </div>

      {previewItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 animate-fade-in">
          <div className="bg-slate-900 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full h-full max-w-6xl flex flex-col overflow-hidden relative border border-slate-800">
            <div className="h-16 px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
              <div className="font-bold flex items-center gap-3">
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                   <button onClick={() => setPreviewMode('preview')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${previewMode === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white cursor-pointer'}`}><i className="bi bi-eye"></i> View</button>
                   <button onClick={() => setPreviewMode('code')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${previewMode === 'code' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white cursor-pointer'}`}><i className="bi bi-code-slash"></i> Code</button>
                </div>
                <span className="hidden sm:inline text-sm text-slate-300 ml-2">{previewItem.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={confirmCloneExecution} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                  <i className="bi bi-magic"></i> Clone to Workspace
                </button>
                <div className="w-px h-6 bg-slate-800"></div>
                <button onClick={() => {setPreviewItem(null); setPreviewMode('preview');}} className="w-9 h-9 flex items-center justify-center bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all border border-slate-700 hover:border-red-500/50 cursor-pointer"><i className="bi bi-x-lg"></i></button>
              </div>
            </div>
            <div className="flex-1 bg-slate-950 overflow-hidden relative flex items-center justify-center p-4 md:p-8">
               {previewMode === 'preview' ? (
                 <iframe srcDoc={generateCanvasHtml(typeof previewItem.layouts === 'string' ? JSON.parse(previewItem.layouts) : previewItem.layouts)} className="w-full h-full bg-white rounded-xl shadow-2xl border border-slate-800" title="Preview" />
               ) : (
                 <textarea value={generateCanvasHtml(typeof previewItem.layouts === 'string' ? JSON.parse(previewItem.layouts) : previewItem.layouts)} readOnly className="w-full h-full bg-slate-900 text-emerald-400 font-mono text-[11px] p-6 rounded-xl border border-slate-800 focus:outline-none resize-none shadow-inner custom-scrollbar" />
               )}
            </div>
          </div>
        </div>
      )}

      {pendingClone && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
           <div className="bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-800">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-2xl flex items-center justify-center text-xl mb-4"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h2 className="text-xl font-bold text-white mb-2">Workspace Limit Reached</h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">As a Normal user, you are limited to 3 workspaces. Please select an existing workspace to replace with <strong className="text-slate-200">{pendingClone.name}</strong>.</p>
              
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                 {workspaces.map(ws => (
                    <label key={ws.id} className="flex items-center gap-3 p-3 border border-slate-800 rounded-xl hover:bg-indigo-500/10 hover:border-indigo-500/50 cursor-pointer transition-colors group">
                       <input type="radio" name="replaceWs" value={ws.id} onChange={(e) => setWorkspaceToReplace(e.target.value)} className="w-4 h-4 text-indigo-500 cursor-pointer bg-slate-950 border-slate-700" />
                       <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-300 text-sm truncate group-hover:text-indigo-400 transition-colors">{ws.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">{ws.id}</div>
                       </div>
                    </label>
                 ))}
              </div>

              <div className="flex items-center gap-3">
                 <button onClick={() => {setPendingClone(null); setWorkspaceToReplace('');}} className="flex-1 py-3 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl transition-colors cursor-pointer">Cancel</button>
                 <button 
                   disabled={!workspaceToReplace}
                   onClick={() => { executeCloneSave(pendingClone.layouts, pendingClone.name, workspaceToReplace); setPendingClone(null); setWorkspaceToReplace(''); }} 
                   className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                 >
                   Overwrite
                 </button>
              </div>
           </div>
        </div>
      )}

      <AccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} userProfile={userProfile} />
      <WorkspaceSettingsModal isOpen={!!workspaceSettingsTarget} onClose={() => setWorkspaceSettingsTarget(null)} workspace={workspaceSettingsTarget} onSave={handleSaveWorkspaceSettings} userRole={userRole} workspaces={workspaces} />
    </div>
  );
}