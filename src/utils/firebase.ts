import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
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
    setLogLevel('silent');
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    // Enable Firestore persistent offline caching via IndexedDB (multi-tab support)
    const configAny = firebaseConfig as any;
    const dbId = (configAny.firestoreDatabaseId && configAny.firestoreDatabaseId !== '(default)') 
      ? configAny.firestoreDatabaseId 
      : undefined;

    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      }, dbId);
    } catch (cacheErr) {
      console.warn('Firestore persistent offline cache setup fallback:', cacheErr);
      db = dbId ? getFirestore(app, dbId) : getFirestore(app);
    }

    // Handle redirect result if redirected from Google Auth
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        saveUserProfile(result.user);
      }
    }).catch(() => {});
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
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    await saveUserProfile(cred.user);
    return cred.user;
  } catch (error: any) {
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectErr) {
        throw error;
      }
    }
    throw error;
  }
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

export async function updateUserProfileDetails(displayName?: string, photoURL?: string) {
  if (!auth || !auth.currentUser) throw new Error('No user logged in');
  const user = auth.currentUser;
  const updates: { displayName?: string; photoURL?: string } = {};
  if (displayName !== undefined) updates.displayName = displayName;
  if (photoURL !== undefined) updates.photoURL = photoURL;
  
  await updateProfile(user, updates);
  await saveUserProfile(auth.currentUser);
  return auth.currentUser;
}

export async function deleteUserAccount() {
  if (!auth || !auth.currentUser) throw new Error('No user logged in');
  const user = auth.currentUser;
  if (db) {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'data', 'appState'));
      await deleteDoc(doc(db, 'users', user.uid));
    } catch (e) {
      console.warn('Could not remove Firestore documents on delete account:', e);
    }
  }
  await deleteUser(user);
}

export async function saveUserProfile(user: User) {
  if (!db || !user || !auth?.currentUser || auth.currentUser.uid !== user.uid) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    const nowIso = new Date().toISOString();
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Believer',
      photoURL: user.photoURL || '',
      lastLoginAt: nowIso,
      updatedAt: nowIso
    }, { merge: true });
  } catch (e) {
    console.warn('Notice: Firestore profile sync skipped or failed:', e);
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
  if (!db || !userId || !auth?.currentUser || auth.currentUser.uid !== userId) return;
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
    console.warn('Notice: Failed to save file metadata to Firestore:', e);
  }
}

export async function getUserFilesMetadata(userId: string): Promise<FileMetadataRecord[]> {
  if (!db || !userId || !auth?.currentUser || auth.currentUser.uid !== userId) return [];
  try {
    const filesCol = collection(db, 'users', userId, 'files');
    const q = query(filesCol, orderBy('uploadDate', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => docSnap.data() as FileMetadataRecord);
  } catch (e) {
    console.warn('Notice: Failed to fetch user files metadata:', e);
    return [];
  }
}

export async function deleteUserFileMetadata(userId: string, fileId: string) {
  if (!db || !userId || !fileId || !auth?.currentUser || auth.currentUser.uid !== userId) return;
  try {
    const fileDoc = doc(db, 'users', userId, 'files', fileId);
    await deleteDoc(fileDoc);
  } catch (e) {
    console.warn('Notice: Failed to delete file metadata:', e);
  }
}

// ─── FIRESTORE APP STATE SYNC ───

export async function saveUserAppData(userId: string, stateData: any) {
  if (!db || !userId || !auth?.currentUser || auth.currentUser.uid !== userId) return;
  try {
    const stateDocRef = doc(db, 'users', userId, 'data', 'appState');
    await setDoc(stateDocRef, {
      state: stateData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.warn('Notice: Failed to save app state to Firestore:', e);
  }
}

export async function getUserAppData(userId: string): Promise<any | null> {
  if (!db || !userId || !auth?.currentUser || auth.currentUser.uid !== userId) return null;
  try {
    const stateDocRef = doc(db, 'users', userId, 'data', 'appState');
    const snap = await getDoc(stateDocRef);
    if (snap.exists()) {
      return snap.data().state;
    }
    return null;
  } catch (e) {
    console.warn('Notice: Failed to fetch app state from Firestore:', e);
    return null;
  }
}

// ─── GUEST DATA MERGE ON AUTHENTICATION ───

export function mergeGuestDataWithCloudState(guestState: any, cloudState: any): any {
  if (!guestState) return cloudState;
  if (!cloudState) return guestState;

  // 1. Merge Namaz logs
  const mergedNamaz: Record<string, any> = { ...(cloudState.namaz || {}) };
  if (guestState.namaz) {
    Object.keys(guestState.namaz).forEach((date) => {
      if (!mergedNamaz[date]) {
        mergedNamaz[date] = guestState.namaz[date];
      } else {
        mergedNamaz[date] = { ...mergedNamaz[date] };
        Object.keys(guestState.namaz[date]).forEach((prayerKey) => {
          const guestVal = guestState.namaz[date][prayerKey];
          // Guest non-zero logs take precedence or preserve existing logs
          if (guestVal !== undefined && guestVal !== 0) {
            mergedNamaz[date][prayerKey] = guestVal;
          }
        });
      }
    });
  }

  // 2. Merge Duas (Zikar items)
  const cloudDuas: any[] = Array.isArray(cloudState.duas) ? [...cloudState.duas] : [];
  const guestDuas: any[] = Array.isArray(guestState.duas) ? guestState.duas : [];

  guestDuas.forEach((gDua) => {
    const existingIdx = cloudDuas.findIndex(
      (cDua) => cDua.id === gDua.id || (cDua.name && cDua.name.toLowerCase() === gDua.name?.toLowerCase())
    );
    if (existingIdx !== -1) {
      const cDua = cloudDuas[existingIdx];
      const maxDaily = Math.max(cDua.daily || 1, gDua.daily || 1);
      const mergedSessions = Array.from(
        { length: maxDaily },
        (_, i) => Math.max(cDua.sessions?.[i] || 0, gDua.sessions?.[i] || 0)
      );
      const mergedCompletedDates = Array.from(
        new Set([...(cDua.completedDates || []), ...(gDua.completedDates || [])])
      );
      cloudDuas[existingIdx] = {
        ...cDua,
        sessions: mergedSessions,
        completedDates: mergedCompletedDates,
        currentSession: Math.max(cDua.currentSession || 0, gDua.currentSession || 0)
      };
    } else {
      cloudDuas.push(gDua);
    }
  });

  // 3. Merge Deleted Duas
  const cloudDeleted: any[] = Array.isArray(cloudState.deletedDuas) ? [...cloudState.deletedDuas] : [];
  const guestDeleted: any[] = Array.isArray(guestState.deletedDuas) ? guestState.deletedDuas : [];
  const mergedDeletedMap = new Map();
  [...cloudDeleted, ...guestDeleted].forEach((item) => {
    const key = item.id || item.name;
    if (key) mergedDeletedMap.set(key, item);
  });

  // 4. Merge Best Streaks & Goals
  const bestStreak = Math.max(cloudState.bestStreak || 0, guestState.bestStreak || 0);
  const goal = guestState.goal || cloudState.goal || 90;
  const zikarGoal = guestState.zikarGoal || cloudState.zikarGoal || 90;
  const quranGoal = guestState.quranGoal || cloudState.quranGoal || 90;
  const quranDailyTargetMins = guestState.quranDailyTargetMins || cloudState.quranDailyTargetMins || 30;

  return {
    ...cloudState,
    namaz: mergedNamaz,
    duas: cloudDuas,
    deletedDuas: Array.from(mergedDeletedMap.values()),
    bestStreak,
    goal,
    zikarGoal,
    quranGoal,
    quranDailyTargetMins,
    dark: guestState.dark !== undefined ? guestState.dark : cloudState.dark
  };
}

export async function handleAuthLoginMerge(user: User, localGuestState: any): Promise<{ mergedState: any; mergedData: boolean }> {
  if (!user) return { mergedState: localGuestState, mergedData: false };

  try {
    const cloudState = await getUserAppData(user.uid);
    let mergedState: any;
    let didMergeGuestData = false;

    if (localGuestState && Object.keys(localGuestState).length > 0 && localGuestState.namaz) {
      if (cloudState) {
        mergedState = mergeGuestDataWithCloudState(localGuestState, cloudState);
      } else {
        mergedState = localGuestState;
      }
      didMergeGuestData = true;
    } else {
      mergedState = cloudState || localGuestState;
    }

    if (mergedState) {
      await saveUserAppData(user.uid, mergedState);
      await saveUserProfile(user);
      
      // Clear temporary local guest state after merging into Firestore
      try {
        localStorage.removeItem('namaztrack_pro');
      } catch (e) {
        console.warn('Could not remove temporary local guest state:', e);
      }
    }

    return { mergedState, mergedData: didMergeGuestData };
  } catch (err) {
    console.error('Error merging guest state with cloud state:', err);
    return { mergedState: localGuestState, mergedData: false };
  }
}

