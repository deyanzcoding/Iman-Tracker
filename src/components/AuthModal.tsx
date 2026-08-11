import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  LogOut, 
  ShieldCheck, 
  FileText, 
  CloudCheck, 
  X, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2,
  Calendar,
  CheckCircle2,
  Upload,
  UserPlus,
  LogIn
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  signUpWithEmail, 
  signInWithEmail, 
  signInWithGoogle, 
  signOutUser, 
  getUserFilesMetadata, 
  deleteUserFileMetadata, 
  saveUserFileMetadata,
  FileMetadataRecord 
} from '../utils/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  showToast: (msg: string) => void;
}

export default function AuthModal({ isOpen, onClose, currentUser, showToast }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User Files metadata loaded from Firestore
  const [userFiles, setUserFiles] = useState<FileMetadataRecord[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Load user files when logged in
  useEffect(() => {
    if (currentUser) {
      loadFiles();
    } else {
      setUserFiles([]);
    }
  }, [currentUser]);

  const loadFiles = async () => {
    if (!currentUser) return;
    setLoadingFiles(true);
    try {
      const files = await getUserFilesMetadata(currentUser.uid);
      setUserFiles(files);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!email || !password || !displayName) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }
        await signUpWithEmail(email, password, displayName);
        showToast(`Welcome, ${displayName}! Account created successfully 🎉`);
      } else {
        if (!email || !password) {
          setError('Please enter both email and password');
          setLoading(false);
          return;
        }
        await signInWithEmail(email, password);
        showToast('Logged in successfully! Welcome back 👋');
      }
      setEmail('');
      setPassword('');
      setDisplayName('');
      onClose();
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Authentication failed. Please check your details.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errMsg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = 'An account with this email already exists.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errMsg = 'Email/Password sign-in is currently disabled in Firebase Console. Please enable "Email/Password" under Firebase Console > Authentication > Sign-in method.';
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      showToast('Logged in with Google successfully!');
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-in is currently disabled in your Firebase Console. Please enable "Google" under Firebase Console > Authentication > Sign-in method.');
      } else {
        setError(err.message || 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      showToast('Logged out safely');
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFileRecord = async (fileId: string) => {
    if (!currentUser) return;
    try {
      await deleteUserFileMetadata(currentUser.uid, fileId);
      setUserFiles(prev => prev.filter(f => f.id !== fileId));
      showToast('File record removed from database');
    } catch (err) {
      console.error(err);
      showToast('Failed to remove file record');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border2)]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[var(--text)] leading-tight">
                  {currentUser ? 'User Account & Security' : mode === 'signin' ? 'Sign In to Account' : 'Create New Account'}
                </h3>
                <p className="text-[11px] font-medium text-[var(--text3)]">
                  {currentUser ? 'Manage cloud profile & stored files' : 'Sync your data securely across all devices'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 no-scrollbar pt-4 flex flex-col gap-5">
            {currentUser ? (
              /* LOGGED IN ACCOUNT VIEW */
              <div className="flex flex-col gap-5">
                {/* User Info Card */}
                <div className="bg-[var(--surface2)] border border-[var(--border2)] rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-emerald-400 text-white font-black text-lg flex items-center justify-center shadow-md">
                      {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="text-sm font-extrabold text-[var(--text)] truncate">
                        {currentUser.displayName || 'Believer'}
                      </div>
                      <div className="text-xs font-medium text-[var(--text2)] truncate">
                        {currentUser.email}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Protected & Synced
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border2)] text-[10px] text-[var(--text3)]">
                    <div>
                      <span className="font-semibold block">Account ID (UID):</span>
                      <span className="font-mono truncate block text-[9px] text-[var(--text2)]">{currentUser.uid.substring(0, 14)}...</span>
                    </div>
                    <div>
                      <span className="font-semibold block">Creation Date:</span>
                      <span className="text-[10px] text-[var(--text2)] font-medium">
                        {currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'Today'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Database Stored Files Section */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text)]">
                      <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>User Files & Metadata</span>
                    </div>
                    <span className="text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                      {userFiles.length} Saved
                    </span>
                  </div>

                  {loadingFiles ? (
                    <div className="p-4 text-center text-xs text-[var(--text3)]">Loading files...</div>
                  ) : userFiles.length === 0 ? (
                    <div className="p-4 bg-[var(--surface2)] border border-[var(--border2)] rounded-2xl text-center text-xs text-[var(--text3)] flex flex-col items-center gap-1">
                      <span>No custom files uploaded yet.</span>
                      <span className="text-[10px] opacity-75">Upload Para PDFs in the Quran tab to track file metadata.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {userFiles.map((f) => (
                        <div key={f.id} className="p-3 bg-[var(--surface2)] border border-[var(--border2)] rounded-xl flex items-center justify-between gap-3">
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-[var(--text)] truncate">{f.fileName}</span>
                            <div className="flex items-center gap-2 text-[10px] text-[var(--text3)] mt-0.5">
                              {f.paraNumber && <span className="font-semibold text-purple-500">Para {f.paraNumber}</span>}
                              <span>{(f.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                              <span>• {new Date(f.uploadDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteFileRecord(f.id)}
                            className="p-1.5 text-[var(--text3)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Remove file record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Logout Action */}
                <button
                  onClick={handleLogout}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              /* AUTH FORM (SIGN IN / SIGN UP) */
              <div className="flex flex-col gap-4">
                {/* Mode Selector Tabs */}
                <div className="flex p-1 bg-[var(--surface2)] rounded-2xl border border-[var(--border2)]">
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(null); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      mode === 'signin' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text3)]'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" /> Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(null); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      mode === 'signup' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text3)]'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Create Account
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs font-medium">
                    {error}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
                  {mode === 'signup' && (
                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text3)] block mb-1">
                        Full Name
                      </label>
                      <div className="relative flex items-center">
                        <UserIcon className="w-4 h-4 text-[var(--text3)] absolute left-3.5 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. Ahmad Khan"
                          className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface2)] border border-[var(--border2)] rounded-xl text-xs font-medium text-[var(--text)] outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text3)] block mb-1">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-[var(--text3)] absolute left-3.5 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface2)] border border-[var(--border2)] rounded-xl text-xs font-medium text-[var(--text)] outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text3)] block mb-1">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-[var(--text3)] absolute left-3.5 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-[var(--surface2)] border border-[var(--border2)] rounded-xl text-xs font-medium text-[var(--text)] outline-none focus:border-brand-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-[var(--text3)] hover:text-[var(--text)]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 mt-2 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span>Processing...</span>
                    ) : mode === 'signin' ? (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[var(--border2)]"></div>
                  <span className="flex-shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text3)]">OR</span>
                  <div className="flex-grow border-t border-[var(--border2)]"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-2.5 bg-[var(--surface2)] hover:bg-[var(--surface2)]/80 border border-[var(--border2)] text-[var(--text)] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
