import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, db } from '../firebase';
import { ref, set, get } from 'firebase/database';
// Strictly using signInWithRedirect and getRedirectResult
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithRedirect, getRedirectResult, updateProfile, onAuthStateChanged } from 'firebase/auth';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ✨ NEW: Initializing state to prevent the "stuck" feeling while Firebase processes the redirect
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const generateAccountNo = () => 'emtee_' + Math.random().toString(36).substr(2, 9).toUpperCase();

  useEffect(() => {
    let isMounted = true;

    const processAuth = async () => {
      try {
        // 1. Check if we just returned from Google Redirect
        const result = await getRedirectResult(auth);
        
        if (result && result.user) {
          const userRef = ref(db, `users/${result.user.uid}/profile`);
          const snapshot = await get(userRef);
          
          // Create database profile if this is a first-time Google login
          if (!snapshot.exists()) {
            await set(userRef, {
              username: result.user.displayName || 'Google User',
              email: result.user.email,
              accountNumber: generateAccountNo(),
              photoURL: result.user.photoURL || '',
              role: 'normal' // Enforce default normal role
            });
          }
          if (isMounted) navigate('/user/home', { replace: true });
          return; // Stop execution, redirect successful
        }
      } catch (err) {
        if (isMounted) setError(err.message.replace('Firebase: ', ''));
      }

      // 2. If no redirect result, check if they are already logged in via active session
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user && isMounted) {
          navigate('/user/home', { replace: true });
        } else if (isMounted) {
          // Only show the login form if we are 100% sure NO user is logged in
          setIsInitializing(false);
        }
      });

      return () => unsubscribe();
    };

    processAuth();

    return () => { isMounted = false; };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        navigate('/user/home', { replace: true });
      } else {
        if (formData.password !== formData.confirmPassword) throw new Error("Passwords do not match");
        
        const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCred.user, { displayName: formData.username });

        await set(ref(db, `users/${userCred.user.uid}/profile`), {
          username: formData.username,
          email: formData.email,
          accountNumber: generateAccountNo(),
          photoURL: '',
          role: 'normal'
        });
        navigate('/user/home', { replace: true });
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError('');
    // Trigger the loading screen before redirecting to Google
    setIsInitializing(true);
    signInWithRedirect(auth, googleProvider);
  };

  // ✨ NEW: Show a spinner while Firebase processes the Google Redirect in the background
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse text-sm">Authenticating securely...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <i className="bi bi-lightning-charge-fill text-xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{isLogin ? 'Sign in to EmTeeCanvas' : 'Create your account'}</h2>
        </div>

        {error && <div className="mb-6 p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-lg text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">USERNAME</label>
              <input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full border rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">EMAIL</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full border rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">PASSWORD</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full border rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">CONFIRM PASSWORD</label>
              <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="w-full border rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-sm hover:bg-indigo-700 mt-2 disabled:opacity-50 cursor-pointer transition-colors">
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <button 
          onClick={handleGoogleSignIn} 
          disabled={loading}
          className="w-full mt-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
        >
          <i className="bi bi-google text-red-500"></i> Continue with Google
        </button>

        <p className="text-center text-xs text-gray-500 mt-8">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-indigo-600 font-bold hover:underline cursor-pointer">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}