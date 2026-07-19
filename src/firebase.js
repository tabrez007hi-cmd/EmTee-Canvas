import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCvlAcHHIENN7mL9K1Q9nZ0Y5YX8JTuUvk",
  authDomain: "emtee-canvas.firebaseapp.com",
  projectId: "emtee-canvas",
  databaseURL: "https://emtee-canvas-default-rtdb.firebaseio.com/",
  storageBucket: "emtee-canvas.firebasestorage.app",
  messagingSenderId: "1051255449793",
  appId: "1:1051255449793:web:ff621342887322db308c40"
  
  
  
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);
export const storage = getStorage(app);