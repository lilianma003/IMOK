import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDiwcwDdezMSAHhT-Bj3zIl0iue4ltDGT8",
  authDomain: "imok-tentative.firebaseapp.com",
  projectId: "imok-tentative",
  storageBucket: "imok-tentative.firebasestorage.app",
  messagingSenderId: "384147725074",
  appId: "1:384147725074:web:cbf319f4cae02f38f5f1cb",
  measurementId: "G-DTJ1CQXRLF"
};

const app: FirebaseApp = initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export { firebaseConfig };