import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAWJtTExKTNGUzr9QwGh9Eu1IYt1hr14tE",
  authDomain: "wizflow-app.firebaseapp.com",
  databaseURL: "https://wizflow-app-default-rtdb.firebaseio.com",
  projectId: "wizflow-app",
  storageBucket: "wizflow-app.firebasestorage.app",
  messagingSenderId: "229526987500",
  appId: "1:229526987500:web:fb52ce52f809d142983bc9",
  measurementId: "G-29JV2Z7X1D"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);