/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zikar } from '../types';
import { 
  Moon, Target, Trash2, ArrowRight, RotateCcw, ChevronDown
} from 'lucide-react';

interface SettingsProps {
  dark: boolean;
  onToggleDark: () => void;
  goal: number;
  onOpenGoalSheet: () => void;
  deletedDuas: Zikar[];
  onRestoreZikar: (idx: number) => void;
  onPermanentDeleteZikar: (idx: number) => void;
  onPurgeRecycleBin: () => void;
  onClearData: (target: 'namaz' | 'zikar' | 'both') => void;
}

export default function Settings({
  dark,
  onToggleDark,
  goal,
  onOpenGoalSheet,
  deletedDuas,
  onRestoreZikar,
  onPermanentDeleteZikar,
  onPurgeRecycleBin,
  onClearData
}: SettingsProps) {
  const [isBinOpen, setIsBinOpen] = useState(false);
  const [clearTarget, setClearTarget] = useState<'namaz' | 'zikar' | 'both'>('namaz');

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

      {/* 2. Goal Configurations */}
      <div className="flex flex-col gap-2">
        <h4 className="text-[10px] font-black text-[var(--text3)] uppercase tracking-wider px-1">
          Goals
        </h4>
        <div
          onClick={onOpenGoalSheet}
          className="flex items-center justify-between p-4 bg-[var(--surface2)] border border-[var(--border)] rounded-2xl cursor-pointer hover:bg-[var(--surface3)]/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Target className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--text)]">Monthly Prayer Goal</div>
              <div className="text-[10px] font-semibold text-[var(--text3)]">Currently set to {goal}% completion</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-brand-500 hover:text-brand-600">
            Edit
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
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

      {/* 4. Selective Clear Data */}
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
              onChange={(e) => setClearTarget(e.target.value as 'namaz' | 'zikar' | 'both')}
              className="flex-1 py-3 px-4 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs font-bold outline-none cursor-pointer focus:border-red-500"
            >
              <option value="namaz">🕌 Namaz records only</option>
              <option value="zikar">📿 Zikar records only</option>
              <option value="both">⚠️ Full Hard Reset (All data)</option>
            </select>
            <button
              onClick={() => onClearData(clearTarget)}
              className="py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-red-500 hover:bg-red-600 flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-red-500/10 active:scale-95 transition-transform"
            >
              Clear Data
            </button>
          </div>
        </div>
      </div>

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
