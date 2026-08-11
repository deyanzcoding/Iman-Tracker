import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const isFirebaseConfigured = !!(firebaseConfig && firebaseConfig.apiKey);

let app: any;
let auth: any;
let db: any;
let googleProvider: any;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    // Support named Firestore database if specified in config
    const configAny = firebaseConfig as any;
    if (configAny.firestoreDatabaseId && configAny.firestoreDatabaseId !== '(default)') {
      db = getFirestore(app, configAny.firestoreDatabaseId);
    } else {
      db = getFirestore(app);
    }
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export { app, auth, db, googleProvider };

// ─── AUTH HELPER FUNCTIONS ───

export async function signUpWithEmail(email: string, pass: string, name: string) {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && cred.user) {
    await updateProfile(cred.user, { displayName: name });
  }
  await saveUserProfile(cred.user);
  return cred.user;
}

export async function signInWithEmail(email: string, pass: string) {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  await saveUserProfile(cred.user);
  return cred.user;
}

export async function signInWithGoogle() {
  if (!auth || !googleProvider) throw new Error('Firebase Auth is not initialized');
  const cred = await signInWithPopup(auth, googleProvider);
  await saveUserProfile(cred.user);
  return cred.user;
}

export async function signOutUser() {
  if (!auth) return;
  await signOut(auth);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// ─── FIRESTORE PROFILE & USER DATA ───

export async function saveUserProfile(user: User) {
  if (!db || !user) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    const nowIso = new Date().toISOString();
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Believer',
      lastLoginAt: nowIso,
      updatedAt: nowIso
    }, { merge: true });
  } catch (e) {
    console.warn('Notice: Firestore profile sync skipped or failed (Ensure Firestore Database is created in your Firebase Console):', e);
  }
}

// ─── FIRESTORE FILE METADATA ───

export interface FileMetadataRecord {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  paraNumber?: number;
}

export async function saveUserFileMetadata(userId: string, metadata: Omit<FileMetadataRecord, 'id'>) {
  if (!db || !userId) return;
  try {
    const filesCol = collection(db, 'users', userId, 'files');
    const docRef = doc(filesCol);
    const record: FileMetadataRecord = {
      id: docRef.id,
      ...metadata,
      uploadDate: metadata.uploadDate || new Date().toISOString()
    };
    await setDoc(docRef, record);
    return record;
  } catch (e) {
    console.error('Failed to save file metadata to Firestore:', e);
    throw e;
  }
}

export async function getUserFilesMetadata(userId: string): Promise<FileMetadataRecord[]> {
  if (!db || !userId) return [];
  try {
    const filesCol = collection(db, 'users', userId, 'files');
    const q = query(filesCol, orderBy('uploadDate', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => docSnap.data() as FileMetadataRecord);
  } catch (e) {
    console.error('Failed to fetch user files metadata:', e);
    return [];
  }
}

export async function deleteUserFileMetadata(userId: string, fileId: string) {
  if (!db || !userId || !fileId) return;
  try {
    const fileDoc = doc(db, 'users', userId, 'files', fileId);
    await deleteDoc(fileDoc);
  } catch (e) {
    console.error('Failed to delete file metadata:', e);
    throw e;
  }
}

// ─── FIRESTORE APP STATE SYNC ───

export async function saveUserAppData(userId: string, stateData: any) {
  if (!db || !userId) return;
  try {
    const stateDocRef = doc(db, 'users', userId, 'data', 'appState');
    await setDoc(stateDocRef, {
      state: stateData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.error('Failed to save app state to Firestore:', e);
  }
}

export async function getUserAppData(userId: string): Promise<any | null> {
  if (!db || !userId) return null;
  try {
    const stateDocRef = doc(db, 'users', userId, 'data', 'appState');
    const snap = await getDoc(stateDocRef);
    if (snap.exists()) {
      return snap.data().state;
    }
    return null;
  } catch (e) {
    console.error('Failed to fetch app state from Firestore:', e);
    return null;
  }
}
