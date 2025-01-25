import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBQDcDky1LCXjZfNFoN_8Jfb06gm9P0aKA",
  authDomain: "online-e7f15.firebaseapp.com",
  projectId: "online-e7f15",
  storageBucket: "online-e7f15.firebasestorage.app",
  messagingSenderId: "220640658600",
  appId: "1:220640658600:web:005c665f7f3793796b2e9d",
  measurementId: "G-WR0J4B586V"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);