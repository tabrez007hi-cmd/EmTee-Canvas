import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { ref, onValue, set, update, get } from 'firebase/database';

import AccountModal from '../components/AccountModal';
import WorkspaceSettingsModal from '../components/WorkspaceSettingsModal'; 
// Imported Sub-Views
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
  
  // Modals
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [workspaceSettingsTarget, setWorkspaceSettingsTarget] = useState(null);
  
  // Interactive Cloning & Previews
  const [previewItem, setPreviewItem] = useState(null);
  const [previewMode, setPreviewMode] = useState('preview'); // 'preview' or 'code'
  
  const [pendingClone, setPendingClone] = useState(null);
  const [workspaceToReplace, setWorkspaceToReplace] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { navigate('/authentication'); return; }

    const HARDCODED_DEVS = ["tabrez007hi@gmail.com", "admin@gmail.com"];
    const isHardcodedDev = user.email && HARDCODED_DEVS.includes(user.email.toLowerCase().trim());

    const profileRef = ref(db, `users/${user.uid}/profile`);
    onValue(profileRef, (snapshot) => {
      if (snapshot.exists()) {
         const data = snapshot.val();
         setUserProfile(data);
         setUserRole(isHardcodedDev ? 'developer' : (data.role || 'normal'));
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

    onValue(ref(db, 'users'), (snapshot) => {
      if (snapshot.exists()) {
        const allUsers = snapshot.val();
        const publicItems = [];
        Object.entries(allUsers).forEach(([uid, userData]) => {
          if (userData.workspaces && userData.profile) {
             let authorRole = userData.profile.role || 'normal';
             if (userData.profile.email && HARDCODED_DEVS.includes(userData.profile.email.toLowerCase())) authorRole = 'developer';

             Object.values(userData.workspaces).forEach(ws => {
                if (ws.isPublic) {
                   publicItems.push({
                      ...ws, authorId: uid, authorName: userData.profile.username || 'Unknown', authorPhoto: userData.profile.photoURL || null, authorRole: authorRole,
                      likeCount: ws.likes ? Object.keys(ws.likes).length : 0, isLikedByMe: ws.likes ? !!ws.likes[user.uid] : false
                   });
                }
             });
          }
        });
        publicItems.sort((a, b) => b.createdAt - a.createdAt);
        setExploreWorkspaces(publicItems);
      }
    });
  }, [navigate]);

  const atWorkspaceLimit = (userRole === 'normal' && workspaces.length >= 3) || (userRole === 'pro' && workspaces.length >= 10);

  // ✨ ENGINE: Unified Clone Controller (Handles limits & modal triggers)
  const handleInitiateClone = (item, defaultName = 'New Project') => {
     setPreviewItem(item); // Open the preview modal automatically
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

  // Safe Backend execution
  const executeCloneSave = (layoutsStr, defaultName, replaceId = null) => {
    const user = auth.currentUser;
    const newId = generateProjectSlug(defaultName);
    
    // Normal users can only have 1 private workspace total
    const privateCount = workspaces.filter(w => !w.isPublic && w.id !== replaceId).length;
    const forcePublic = userRole === 'normal' && privateCount >= 1;

    const newWS = { 
      id: newId, name: defaultName, layouts: layoutsStr, 
      isPublic: forcePublic, allowCodeView: false, allowDomView: false, 
      createdAt: Date.now(), updatedAt: Date.now() 
    };

    if (replaceId) {
       set(ref(db, `users/${user.uid}/workspaces/${replaceId}`), null).then(() => {
          set(ref(db, `users/${user.uid}/workspaces/${newId}`), newWS).then(() => {
             navigate(`/builder?u=${userProfile?.username || 'user'}&ws=${newId}`);
          });
       });
    } else {
       set(ref(db, `users/${user.uid}/workspaces/${newId}`), newWS).then(() => {
          navigate(`/builder?u=${userProfile?.username || 'user'}&ws=${newId}`);
       });
    }
  };

  const handleToggleLike = async (e, workspaceId, authorId, isLikedByMe) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) return;
    const likeRef = ref(db, `users/${authorId}/workspaces/${workspaceId}/likes/${user.uid}`);
    if (isLikedByMe) await set(likeRef, null); else await set(likeRef, true);
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to permanently delete this template?')) await set(ref(db, `templates/${templateId}`), null);
  };

  const handleSaveWorkspaceSettings = async (id, updates, swapId = null) => {
    const user = auth.currentUser;
    const match = workspaces.find(w => w.id === id);
    if (!match) return;

    // Generate new ID only if name changed
    const newId = updates.name !== match.name ? generateProjectSlug(updates.name) : id;
    
    // Prepare the updated workspace object
    const updatedWS = { 
      ...match, 
      id: newId, 
      name: updates.name, 
      isPublic: updates.isPublic, 
      isShareable: updates.isShareable, // ✨ New share state
      allowCodeView: updates.allowCodeView, 
      allowDomView: updates.allowDomView, 
      updatedAt: Date.now() 
    };

    // ⚡ Execute Atomic Multi-path Update
    const dbUpdates = {};
    
    // 1. Save the new/updated workspace
    dbUpdates[`users/${user.uid}/workspaces/${newId}`] = updatedWS;
    
    // 2. Delete the old one if the ID changed
    if (id !== newId) {
      dbUpdates[`users/${user.uid}/workspaces/${id}`] = null;
    }

    // 3. Swap Target Logic 🔄 (Make the swapped project Public)
    if (swapId) {
      const swapMatch = workspaces.find(w => w.id === swapId);
      if (swapMatch) {
        dbUpdates[`users/${user.uid}/workspaces/${swapId}`] = {
          ...swapMatch,
          isPublic: true, // Forces it to global public
          updatedAt: Date.now()
        };
      }
    }

    try {
      await update(ref(db), dbUpdates);
      setWorkspaceSettingsTarget(null);
    } catch (err) {
      console.error("Failed to update workspace settings", err);
      alert("Error saving settings.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden font-sans">
      
      {/* Navigation Sidebar */}
      <aside className="w-64 h-full bg-white border-r border-slate-200 hidden md:flex flex-col z-20 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 shrink-0">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md mr-3"><i className="bi bi-lightning-charge-fill text-white"></i></div>
           <span className="font-bold text-slate-800 tracking-tight text-lg">EmTeeCanvas</span>
        </div>
        
        <div className="p-4 space-y-1.5 flex-1 overflow-y-auto">
           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">Main Menu</div>
           <button onClick={() => navigate('/user/home')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer border ${activeTab === 'home' ? 'text-indigo-700 bg-indigo-50/70 border-indigo-100/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-transparent'}`}>
              <i className="bi bi-grid-1x2-fill"></i> My Workspaces
           </button>
           <button onClick={() => navigate('/user/templates')} className={`w-full flex items-center justify-between px-3 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer border ${activeTab === 'templates' ? 'text-indigo-700 bg-indigo-50/70 border-indigo-100/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-transparent'}`}>
              <div className="flex items-center gap-3"><i className="bi bi-layout-wtf"></i> Browse Templates</div>
           </button>
           <button onClick={() => navigate('/user/explore')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer border ${activeTab === 'explore' ? 'text-indigo-700 bg-indigo-50/70 border-indigo-100/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-transparent'}`}>
              <i className="bi bi-compass"></i> Explore Works
           </button>
           {userRole !== 'developer' && (
             <button onClick={() => navigate('/join-membership')} className="w-full flex items-center gap-3 px-3 py-2 mt-4 text-sm font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer shadow-sm">
                <i className="bi bi-star-fill"></i> Upgrade Plan
             </button>
           )}

           {auth.currentUser?.email && ["tabrez007hi@gmail.com", "admin@gmail.com"].includes(auth.currentUser.email.toLowerCase()) && (
             <button onClick={() => navigate('/admin-dashboard')} className="w-full flex items-center gap-3 px-3 py-2 mt-4 text-sm font-bold text-rose-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer shadow-sm">
                <i className="bi bi-shield-lock-fill"></i> Admin Panel
             </button>
           )}

           <div className="mt-8 px-3">
              <div className={`text-[10px] font-bold px-3 py-2 rounded-lg border flex items-center gap-2 ${userRole === 'developer' ? 'bg-purple-50 text-purple-700 border-purple-200' : userRole === 'pro' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {userRole === 'developer' ? <i className="bi bi-code-square"></i> : userRole === 'pro' ? <i className="bi bi-star-fill"></i> : <i className="bi bi-person"></i>}
                {userRole.toUpperCase()} PLAN
              </div>
           </div>
        </div>

        {userRole === 'developer' && (
          <div className="p-4 border-t border-slate-100 shrink-0 space-y-2">
            <button onClick={() => navigate('/deploy-template')} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-white bg-indigo-900 hover:bg-indigo-800 rounded-xl transition-all cursor-pointer font-bold text-sm shadow-md">
              <i className="bi bi-cloud-arrow-up-fill"></i> Deploy Template
            </button>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col h-full min-w-0">
        <nav className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 z-10 shadow-sm md:shadow-none">
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md"><i className="bi bi-lightning-charge-fill text-white"></i></div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
             <div className="font-bold text-slate-800 text-lg">Dashboard</div>
             <div className="h-4 w-px bg-slate-300"></div>
             <div className="text-sm font-semibold text-slate-500 capitalize">{activeTab === 'home' ? 'Workspaces' : activeTab}</div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <NotificationBell />
            <div className="w-px h-6 bg-slate-200"></div>
            <button onClick={() => setIsAccountModalOpen(true)} className="flex items-center gap-2 hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200">
              <span className="text-sm font-semibold text-slate-600 hidden lg:block">{userProfile?.username || 'Developer'}</span>
              {userProfile?.photoURL && !imgError ? (
                <img src={userProfile.photoURL} alt="User" onError={() => setImgError(true)} className="h-8 w-8 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="h-8 w-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-200 shadow-sm"><i className="bi bi-person-fill text-lg mt-1"></i></div>
              )}
            </button>
            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
            <button onClick={handleLogout} className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 text-xs font-bold rounded-md transition-colors cursor-pointer shadow-sm">Logout</button>
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto w-full custom-scrollbar">
          <div className="max-w-6xl mx-auto p-6 sm:p-10">
             {activeTab === 'home' && <DashboardWorkspaces workspaces={workspaces} handleCreateProject={() => executeCloneSave('[]', 'New Project')} atWorkspaceLimit={atWorkspaceLimit} setWorkspaceSettingsTarget={setWorkspaceSettingsTarget} navigate={navigate} userProfile={userProfile} />}
             {activeTab === 'templates' && <DashboardTemplates allTemplates={[...systemTemplates, ...globalTemplates]} handleClone={handleInitiateClone} handleDeleteTemplate={handleDeleteTemplate} currentUid={auth.currentUser?.uid} navigate={navigate} />}
             {activeTab === 'explore' && <DashboardExplore exploreWorkspaces={exploreWorkspaces} handleToggleLike={handleToggleLike} handleClone={handleInitiateClone} navigate={navigate} />}
          </div>
        </main>
      </div>

      {/* ✨ NEW: Dual-Mode Preview & Code Modal for Explore / Templates */}
      {previewItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 sm:p-8 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-6xl flex flex-col overflow-hidden relative border border-slate-700">
            <div className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
              <div className="font-bold flex items-center gap-3">
                <div className="flex bg-slate-800 rounded-lg p-1">
                   <button onClick={() => setPreviewMode('preview')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${previewMode === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white cursor-pointer'}`}><i className="bi bi-eye"></i> View</button>
                   <button onClick={() => setPreviewMode('code')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${previewMode === 'code' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white cursor-pointer'}`}><i className="bi bi-code-slash"></i> Code</button>
                </div>
                <span className="hidden sm:inline text-sm text-slate-300 ml-2">{previewItem.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={confirmCloneExecution} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-900/20">
                  <i className="bi bi-magic"></i> Clone to Workspace
                </button>
                <div className="w-px h-6 bg-slate-700"></div>
                <button onClick={() => {setPreviewItem(null); setPreviewMode('preview');}} className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all border border-slate-700 cursor-pointer"><i className="bi bi-x-lg"></i></button>
              </div>
            </div>
            <div className="flex-1 bg-gray-200 overflow-hidden relative flex items-center justify-center p-4 md:p-8">
               {previewMode === 'preview' ? (
                 <iframe srcDoc={generateCanvasHtml(typeof previewItem.layouts === 'string' ? JSON.parse(previewItem.layouts) : previewItem.layouts)} className="w-full h-full bg-white rounded-xl shadow-xl border border-gray-300" title="Preview" />
               ) : (
                 <textarea value={generateCanvasHtml(typeof previewItem.layouts === 'string' ? JSON.parse(previewItem.layouts) : previewItem.layouts)} readOnly className="w-full h-full bg-slate-900 text-emerald-400 font-mono text-[11px] p-6 rounded-xl border border-slate-700 focus:outline-none resize-none shadow-inner custom-scrollbar" />
               )}
            </div>
          </div>
        </div>
      )}

      {/* ✨ NEW: Workspace Replacement Override Modal */}
      {pendingClone && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xl mb-4"><i className="bi bi-exclamation-triangle-fill"></i></div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Workspace Limit Reached</h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">As a Normal user, you are limited to 3 workspaces. Please select an existing workspace to replace with <strong>{pendingClone.name}</strong>.</p>
              
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                 {workspaces.map(ws => (
                    <label key={ws.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-colors group">
                       <input type="radio" name="replaceWs" value={ws.id} onChange={(e) => setWorkspaceToReplace(e.target.value)} className="w-4 h-4 text-indigo-600 cursor-pointer" />
                       <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-700">{ws.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{ws.id}</div>
                       </div>
                    </label>
                 ))}
              </div>

              <div className="flex items-center gap-3">
                 <button onClick={() => {setPendingClone(null); setWorkspaceToReplace('');}} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors cursor-pointer">Cancel</button>
                 <button 
                   disabled={!workspaceToReplace}
                   onClick={() => { executeCloneSave(pendingClone.layouts, pendingClone.name, workspaceToReplace); setPendingClone(null); setWorkspaceToReplace(''); }} 
                   className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                 >
                   Overwrite & Clone
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