import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Builder from './pages/Builder';
import UserHome from './pages/UserHome';
import SharedWorkspace from './pages/SharedWorkspace';
import DeployTemplate from './pages/DeployTemplate';
import JoinMembership from './pages/JoinMembership';
import AdminDashboard from './pages/AdminDashboard';
import { UIProvider } from './contexts/UIContext';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <UIProvider>
      <Router>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/user/home" /> : <Home user={user} />} />
          <Route path="/authentication" element={!user ? <Auth /> : <Navigate to="/user/home" />} />
          
        <Route path="/user/home" element={user ? <UserHome /> : <Navigate to="/authentication" />} />
        <Route path="/user/templates" element={user ? <UserHome /> : <Navigate to="/authentication" />} />
        <Route path="/user/explore" element={user ? <UserHome /> : <Navigate to="/authentication" />} />
        <Route path="/share" element={<SharedWorkspace />} />
        <Route path="/join-membership" element={user ? <JoinMembership /> : <Navigate to="/authentication" />} />
        <Route path="/admin-dashboard" element={user ? <AdminDashboard /> : <Navigate to="/authentication" />} />
        
        <Route path="/deploy-template" element={user ? <DeployTemplate /> : <Navigate to="/authentication" />} />
        
        <Route path="/builder" element={<Builder />} />
      </Routes>
     </Router>
    </UIProvider>
  );
}