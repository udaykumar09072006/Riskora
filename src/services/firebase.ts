import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc,
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore (with custom database ID if specified in config)
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in using Google OAuth via Firebase
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Persist/Update user profile in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      id: user.uid,
      name: user.displayName || 'Authorized Risk Analyst',
      email: user.email || '',
      photoURL: user.photoURL || '',
      role: 'Senior Fraud Operations Lead',
      organization: 'Riskora Autonomous SOC Unit',
      lastLogin: new Date().toISOString(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    return user;
  } catch (error: any) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

/**
 * Sign out user from Firebase Auth
 */
export async function signOutUser() {
  return firebaseSignOut(auth);
}

/**
 * Persist user investigation case in Firestore
 */
export async function saveUserCase(userId: string, caseData: any) {
  try {
    const caseId = caseData.id || `CASE-${Date.now()}`;
    const caseRef = doc(db, 'users', userId, 'cases', caseId);
    await setDoc(caseRef, {
      ...caseData,
      id: caseId,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return caseId;
  } catch (err) {
    console.error('Failed to persist case in Firestore:', err);
    throw err;
  }
}

/**
 * Fetch persisted user cases from Firestore
 */
export async function getUserCases(userId: string) {
  try {
    const casesRef = collection(db, 'users', userId, 'cases');
    const snapshot = await getDocs(casesRef);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Failed to fetch user cases from Firestore:', err);
    return [];
  }
}

/**
 * Persist Chat Session in Firestore
 */
export async function createChatSessionInFirestore(userId: string, session: { id: string; title: string; model: string; role: string }) {
  try {
    const chatRef = doc(db, 'users', userId, 'chats', session.id);
    await setDoc(chatRef, {
      ...session,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not save chat session to Firestore:', err);
  }
}

/**
 * Persist Chat Message in Firestore
 */
export async function addChatMessageToFirestore(userId: string, chatId: string, message: {
  id: string;
  sender: 'user' | 'model' | 'system';
  text: string;
  timestamp: string;
  modelUsed?: string;
  tokens?: number;
}) {
  try {
    const msgRef = doc(db, 'users', userId, 'chats', chatId, 'messages', message.id);
    await setDoc(msgRef, message, { merge: true });

    // Update parent chat timestamp
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    await setDoc(chatRef, { updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Could not save chat message to Firestore:', err);
  }
}

/**
 * Save voice conversation session log in Firestore
 */
export async function logVoiceSession(userId: string, log: {
  id: string;
  sessionStartTime: string;
  durationSeconds: number;
  summary: string;
  model: string;
  transcriptSnippets?: Array<{ speaker: string; text: string }>;
}) {
  try {
    const logRef = doc(db, 'users', userId, 'voiceLogs', log.id);
    await setDoc(logRef, {
      ...log,
      createdAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not log voice session to Firestore:', err);
  }
}

export type { FirebaseUser };
