import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0jLiawN_C2FQyzDqCcGl83NC1qNp8nes",
    authDomain: "ez-play-01.firebaseapp.com",
    databaseURL: "https://ez-play-01-default-rtdb.firebaseio.com",
    projectId: "ez-play-01",
    storageBucket: "ez-play-01.firebasestorage.app",
    messagingSenderId: "486678085182",
    appId: "1:486678085182:web:71a80ef0f9ca483dee5b6f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);
export const storage = getStorage(app);