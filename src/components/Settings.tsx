/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zikar } from '../types';
import { 
  Moon, Target, Trash2, ArrowRight, RotateCcw, ChevronDown, User, ShieldCheck, LogOut, CheckCircle2, AlertTriangle, Edit3, BookOpen, Heart
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { deleteUserAccount } from '../utils/firebase';
import SalahRemindersSettings from './SalahRemindersSettings';
import { SalahSettings } from '../utils/salah';

interface SettingsProps {
  dark: boolean;
  onToggleDark: () => void;
  goal: number;
  zikarGoal?: number;
  quranGoal?: number;
  quranDailyTargetMins?: number;
  onOpenGoalSheet: () => void;
  deletedDuas: Zikar[];
  onRestoreZikar: (idx: number) => void;
  onPermanentDeleteZikar: (idx: number) => void;
  onPurgeRecycleBin: () => void;
  onClearData: (target: 'namaz' | 'zikar' | 'quran' | 'both') => void;
  currentUser?: FirebaseUser | null;
  onOpenAuthModal?: () => void;
  showToast?: (msg: string) => void;
  onSalahSettingsChange?: (newSettings: SalahSettings) => void;
}

export default function Settings({
  dark,
  onToggleDark,
  goal,
  zikarGoal = 90,
  quranGoal = 90,
  quranDailyTargetMins = 30,
  onOpenGoalSheet,
  deletedDuas,
  onRestoreZikar,
  onPermanentDeleteZikar,
  onPurgeRecycleBin,
  onClearData,
  currentUser,
  onOpenAuthModal,
  showToast,
  onSalahSettingsChange
}: SettingsProps) {
  const [isBinOpen, setIsBinOpen] = useState(false);
  const [clearTarget, setClearTarget] = useState<'namaz' | 'zikar' | 'quran' | 'both'>('namaz');

  // Account Deletion States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await deleteUserAccount();
      if (showToast) showToast('Your account and saved data have been permanently deleted.');
      setShowDeleteConfirm(false);
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast('Failed to delete account. Please re-authenticate and try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      {/* Tab Header Title */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-[var(--text)] uppercase tracking-widest">
          Settings
        </div>
      </div>

      {/* 1. Appearance Settings */}
      <div className="flex flex-col gap-2">
        <h4 className="text-[10px] font-black text-[var(--text3)] uppercase tracking-wider px-1">
          Appearance
        </h4>
        <div className="flex items-center justify-between p-4 bg-[var(--surface2)] border border-[var(--border)] rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Moon className="w-5 h-5 fill-purple-500/20 stroke-[2]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--text)]">Dark Theme</div>
              <div className="text-[10px] font-semibold text-[var(--text3)]">Comfortable viewing in low light</div>
            </div>
          </div>
          <button
            onClick={onToggleDark}
            className={`w-11 h-6 rounded-full relative p-0.5 border transition-all ${
              dark ? 'bg-brand-500 border-brand-500' : 'bg-[var(--border2)] border-[var(--border)]'
            }`}
          >
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-[18px] h-[18px] rounded-full bg-white shadow-md"
              style={{ float: dark ? 'right' : 'left' }}
            />
          </button>
        </div>
      </div>

      {/* 2. Salah Reminders & Notifications */}
      <div className="flex flex-col gap-2">
        <h4 className="text-[10px] font-black text-[var(--text3)] uppercase tracking-wider px-1">
          Prayer Reminders
        </h4>
        <SalahRemindersSettings showToast={showToast} onSettingsChange={onSalahSettingsChange} />
      </div>

      {/* 3. Goal Configurations */}
      <div className="flex flex-col gap-2">
        <h4 className="text-[10px] font-black text-[var(--text3)] uppercase tracking-wider px-1">
          Monthly Goal Targets
        </h4>
        <div
          onClick={onOpenGoalSheet}
          className="flex flex-col gap-3 p-4 bg-[var(--surface2)] border border-[var(--border)] rounded-2xl cursor-pointer hover:bg-[var(--surface3)]/40 transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                <Target className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text)]">Configure Monthly Goals</div>
                <div className="text-[10px] font-semibold text-[var(--text3)]">Target completion percentages & daily Quran time</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-brand-500 hover:text-brand-600">
              Edit
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)]">
            <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
              <div className="text-[9px] font-bold text-[var(--text3)] uppercase">Namaz</div>
              <div className="text-sm font-black text-emerald-500 mt-0.5">{goal}%</div>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
              <div className="text-[9px] font-bold text-[var(--text3)] uppercase">Zikar</div>
              <div className="text-sm font-black text-blue-500 mt-0.5">{zikarGoal}%</div>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
              <div className="text-[9px] font-bold text-[var(--text3)] uppercase">Quran ({quranDailyTargetMins}m/d)</div>
              <div className="text-sm font-black text-purple-500 mt-0.5">{quranGoal}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Data Management (Recycle Bin Accordion) */}
      <div className="flex flex-col gap-2">
        <h4 className="text-[10px] font-black text-[var(--text3)] uppercase tracking-wider px-1">
          Data Management
        </h4>

        <div className="border border-[var(--border)] bg-[var(--surface2)] rounded-2xl overflow-hidden shadow-sm">
          {/* Header trigger */}
          <button
            onClick={() => setIsBinOpen(!isBinOpen)}
            className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-[var(--surface3)]/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <Trash2 className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text)]">Recycle Bin</div>
                <div className="text-[10px] font-semibold text-[var(--text3)]">
                  {deletedDuas.length} deleted {deletedDuas.length === 1 ? 'supplication' : 'supplications'} preserved
                </div>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-[var(--text3)] transition-transform duration-200 ${
                isBinOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Accordion Content */}
          <AnimatePresence initial={false}>
            {isBinOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden border-t border-[var(--border)] bg-[var(--surface)]"
              >
                <div className="p-4 flex flex-col gap-3">
                  {/* Purge button if items exist */}
                  {deletedDuas.length > 0 && (
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <div className="text-[10px] font-bold text-[var(--text2)]">Preserved Items</div>
                      <button
                        onClick={onPurgeRecycleBin}
                        className="text-[10px] font-extrabold text-red-500 hover:text-red-600 cursor-pointer p-1 rounded hover:bg-red-500/5 transition-colors"
                      >
                        Empty Bin
                      </button>
                    </div>
                  )}

                  {deletedDuas.length === 0 ? (
                    <p className="text-[11px] text-[var(--text3)] italic text-center py-4">
                      Your Recycle Bin is empty.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2 max-h-56 overflow-y-auto no-scrollbar">
                      {deletedDuas.map((d, idx) => (
                        <li
                          key={`${d.id}-${idx}`}
                          className="p-3 bg-[var(--surface2)] border border-[var(--border)] rounded-xl flex items-center justify-between gap-4 shadow-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[var(--text)] truncate">{d.name}</div>
                            <div className="text-[9px] font-semibold text-[var(--text3)] uppercase mt-0.5">
                              {d.target} count × {d.daily} sessions
                            </div>
                          </div>
                          
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => onRestoreZikar(idx)}
                              className="py-1 px-2 text-[10px] font-black rounded-md text-brand-600 bg-brand-50 border border-brand-500/15 hover:bg-brand-500 hover:text-white transition-all active:scale-95"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => onPermanentDeleteZikar(idx)}
                              className="py-1 px-2 text-[10px] font-black rounded-md text-red-600 bg-red-50 border border-red-500/15 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                            >
                              Destroy
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[9px] text-[var(--text3)] font-medium leading-relaxed">
                    Moving items to the Recycle Bin saves your configurations. Emptying the bin destroys records permanently.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 4. Selective Clear Data & Account Deletion */}
      <div className="flex flex-col gap-2">
        <h4 className="text-[10px] font-black text-[var(--text3)] uppercase tracking-wider px-1">
          Danger Zone
        </h4>
        <div className="p-4 bg-[var(--surface2)] border border-red-500/20 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="text-sm font-bold text-red-500">Destructive Actions</div>
              <div className="text-[10px] font-semibold text-[var(--text3)]">Clear specific logs or hard-reset all parameters</div>
            </div>
          </div>

          <div className="flex gap-2 flex-col xs:flex-row">
            <select
              value={clearTarget}
              onChange={(e) => setClearTarget(e.target.value as 'namaz' | 'zikar' | 'quran' | 'both')}
              className="flex-1 py-3 px-4 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs font-bold outline-none cursor-pointer focus:border-red-500"
            >
              <option value="namaz">Namaz records only</option>
              <option value="zikar">Zikar records only</option>
              <option value="quran">Quran records only</option>
              <option value="both">Full Hard Reset (All data)</option>
            </select>
            <button
              onClick={() => onClearData(clearTarget)}
              className="py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-red-500 hover:bg-red-600 flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-red-500/10 active:scale-95 transition-transform"
            >
              Clear Data
            </button>
          </div>

          {currentUser && (
            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-red-600 dark:text-red-400">Delete Account</div>
                  <div className="text-[10px] font-medium text-[var(--text3)]">Remove user identity & all Firestore records</div>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="py-2 px-3 rounded-xl text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all active:scale-95 shrink-0 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Dialog Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-red-500/30 rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-fade-in flex flex-col gap-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[var(--text)]">Delete Account Permanently?</h3>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Irreversible Action</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text2)] leading-relaxed">
              This action will <span className="font-bold text-red-500">permanently remove your user account</span> and erase all saved cloud data from Firestore (Namaz logs, Zikar count, and Quran reading progress). This cannot be undone.
            </p>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingAccount}
                className="flex-1 py-3 rounded-xl text-xs font-bold text-[var(--text2)] bg-[var(--surface2)] hover:bg-[var(--surface3)] border border-[var(--border)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 py-3 rounded-xl text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                {deletingAccount ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Signature credit line */}
      <div className="text-center py-6 text-[10px] text-[var(--text3)] font-bold flex flex-col gap-2 leading-normal">
        <div className="font-arabic text-brand-600 text-[11px] font-normal" dir="rtl">
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
        </div>
        <div>Made with ❤ by @deyanahmad</div>
      </div>
    </div>
  );
}
