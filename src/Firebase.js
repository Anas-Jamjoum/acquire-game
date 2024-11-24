import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyAozRmouFRn0E_UIsyWIX2aIN67rTJ-GBk",
    authDomain: "acquire-6c881.firebaseapp.com",
    projectId: "acquire-6c881",
    storageBucket: "acquire-6c881.firebasestorage.app",
    messagingSenderId: "1095097646258",
    appId: "1:1095097646258:web:fd98b43c3c71c8f66b1dab",
    measurementId: "G-JDXCXB6TZG"
  };

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage , analytics};