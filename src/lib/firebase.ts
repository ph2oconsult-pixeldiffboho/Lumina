import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signIn = async () => {
  console.log("Attempting to sign in...");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Sign in successful:", result);
    return result;
  } catch (error) {
    console.error("Sign in failed:", error);
    throw error;
  }
};
export const logOut = () => signOut(auth);
