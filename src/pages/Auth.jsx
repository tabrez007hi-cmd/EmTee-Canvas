import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, db } from '../firebase';
import { ref, set, get } from 'firebase/database';
// ✨ Back to signInWithPopup, but implemented safely
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, onAuthStateChanged } from 'firebase/auth';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const generateAccountNo = () => 'emtee_' + Math.random().toString(36).substr(2, 9).toUpperCase();

  // Listen for existing active sessions (prevents getting stuck if already logged in)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/user/home', { replace: true });
      } else {
        setIsInitializing(false);
      }
    });
    return () => unsubscribe();
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

  // ✨ THE FIX: The Popup must be the absolute FIRST thing that happens. No state changes before this!
  const handleGoogleSignIn = async () => {
    try {
      // 1. OPEN POPUP INSTANTLY (Bypasses the "Popup Blocked" error)
      const userCred = await signInWithPopup(auth, googleProvider);
      
      // 2. NOW we can safely update the UI to show a loading state
      setIsInitializing(true);
      
      // 3. Verify or Create Profile
      const userRef = ref(db, `users/${userCred.user.uid}/profile`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        await set(userRef, {
          username: userCred.user.displayName || 'Google User',
          email: userCred.user.email,
          accountNumber: generateAccountNo(),
          photoURL: userCred.user.photoURL || '',
          role: 'normal'
        });
      }
      
      // 4. Send to Dashboard
      navigate('/user/home', { replace: true });

    } catch (err) {
      // Ignore if the user just manually closed the popup window
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message.replace('Firebase: ', ''));
        setIsInitializing(false);
      }
    }
  };

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