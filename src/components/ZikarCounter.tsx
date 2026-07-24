/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Zikar } from '../types';
import { Plus, Trash2, Edit2, RotateCcw, Sparkles } from 'lucide-react';

interface ZikarCounterProps {
  duas: Zikar[];
  onAddDuaClick: () => void;
  onEditDuaClick: (idx: number) => void;
  onDeleteDuaClick: (idx: number) => void;
  onIncrementDua: (idx: number, delta: number) => void;
  onResetDua: (idx: number) => void;
  onAddRecommendation: (rec: { name: string; arabic: string; translation: string; target: number; daily: number }) => void;
}

const RECOMMENDATIONS = [
  { name: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّه', translation: 'I seek forgiveness from Allah', target: 100, daily: 1 },
  { name: 'Darood Shareef', arabic: 'صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ', translation: 'Blessings upon Prophet Muhammad', target: 11, daily: 3 },
  { name: 'SubhanAllahi wa Bihamdihi', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', translation: 'Glory be to Allah and Praise', target: 33, daily: 3 },
  { name: 'La Ilaha Illallah', arabic: 'لَا إِلٰهَ إِلَّا اللّٰه', translation: 'There is no god but Allah', target: 100, daily: 1 }
];

export default function ZikarCounter({
  duas,
  onAddDuaClick,
  onEditDuaClick,
  onDeleteDuaClick,
  onIncrementDua,
  onResetDua,
  onAddRecommendation
}: ZikarCounterProps) {
  
  // Helpers to safely extract session information
  const getSessionsList = (d: Zikar): number[] => {
    const need = Math.max(1, d.daily);
    const s = Array.isArray(d.sessions) ? [...d.sessions] : [];
    while (s.length < need) s.push(0);
    return s.slice(0, need);
  };

  const completedSessionsCount = (d: Zikar): number => {
    return getSessionsList(d).filter((c) => c >= d.target).length;
  };

  const isDuaFullyCompleted = (d: Zikar): boolean => {
    return completedSessionsCount(d) >= Math.max(1, d.daily);
  };

  const activeSessionIndex = (d: Zikar): number => {
    if (typeof d.currentSession === 'number') return d.currentSession;
    const s = getSessionsList(d);
    const first = s.findIndex((c) => c < d.target);
    return first === -1 ? s.length - 1 : first;
  };

  // Filter recommendations to show only ones that aren't already tracked actively
  const activeNames = duas.map((d) => d.name.toLowerCase());
  const filteredRecs = RECOMMENDATIONS.filter((r) => !activeNames.includes(r.name.toLowerCase()));

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Title & Add Button Row */}
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-bold text-[var(--text)] uppercase tracking-widest flex items-center gap-1.5">
          Zikar Counter
          <span className="font-arabic text-brand-500 text-lg font-normal ml-1">ذِكْر</span>
        </div>
      </div>

      <p className="text-xs text-[var(--text2)] leading-relaxed mb-1">
        Zikar (ذِكْر) means "remembrance of Allah". Use this counter to log your daily supplications and spiritual targets.
      </p>

      {/* Primary Add Button - Clean Minimalism Flat Style */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onAddDuaClick}
        className="w-full py-3.5 rounded-2xl bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-gray-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        Add Custom Zikar
      </motion.button>

      {/* Duas Active List */}
      <div className="flex flex-col gap-3">
        {duas.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface2)]/40">
            <div className="text-4xl mb-3">🤲</div>
            <div className="font-bold text-sm text-[var(--text)]">No active Zikar counters</div>
            <div className="text-xs text-[var(--text3)] mt-1">Add a custom Zikar or select one from the recommendations below.</div>
          </div>
        ) : (
          duas.map((d, idx) => {
            const sessions = getSessionsList(d);
            const daily = sessions.length;
            const curIdx = Math.max(0, Math.min(activeSessionIndex(d), daily - 1));
            const curCount = sessions[curIdx] ?? 0;
            const allDone = isDuaFullyCompleted(d);
            const doneSessions = completedSessionsCount(d);

            return (
              <div
                key={d.id}
                className={`rounded-3xl border p-5 shadow-sm flex flex-col gap-4 transition-all bg-[var(--surface)] ${
                  allDone ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20' : 'border-[var(--border)]'
                }`}
              >
                {/* Zikar Header Info */}
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                      allDone
                        ? 'bg-brand-500/10 border-brand-500/20 text-brand-600'
                        : 'bg-[var(--surface2)] border-[var(--border)] text-[var(--text2)]'
                    }`}
                  >
                    Session {allDone ? daily : curIdx + 1} of {daily}
                  </span>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditDuaClick(idx)}
                      className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text2)] hover:text-brand-500 flex items-center justify-center transition-all active:scale-90"
                      title="Edit parameters"
                    >
                      <Edit2 className="w-3.5 h-3.5 stroke-[2.2]" />
                    </button>
                    <button
                      onClick={() => onDeleteDuaClick(idx)}
                      className="w-8 h-8 rounded-lg border border-red-500/10 bg-red-500/5 text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-all active:scale-90"
                      title="Move to Recycle Bin"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                    </button>
                  </div>
                </div>

                {/* Zikar Arabic Text & Translation */}
                <div className="text-center py-2">
                  <div className="font-arabic text-3xl font-bold leading-normal text-brand-700 dark:text-brand-400 mb-1" dir="rtl">
                    {d.arabic || d.name}
                  </div>
                  {d.translation && (
                    <div className="text-xs text-[var(--text2)] font-medium italic mt-1 leading-relaxed px-4">
                      "{d.translation}"
                    </div>
                  )}
                  {!d.arabic && (
                    <div className="text-sm font-bold text-[var(--text)] mt-1">{d.name}</div>
                  )}
                </div>

                {/* Counter Visualizers */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-[var(--surface2)] rounded-2xl border border-[var(--border)] text-center">
                  <div className="border-r border-[var(--border)] flex flex-col justify-center py-0.5">
                    <div className="text-lg font-black text-[var(--text)]">
                      {allDone ? d.target : curCount}/{d.target}
                    </div>
                    <div className="text-[9px] font-bold text-[var(--text3)] uppercase tracking-wider mt-0.5">
                      Session Count
                    </div>
                  </div>
                  <div className="flex flex-col justify-center py-0.5">
                    <div className="text-lg font-black text-[var(--text)]">
                      {doneSessions}/{daily}
                    </div>
                    <div className="text-[9px] font-bold text-[var(--text3)] uppercase tracking-wider mt-0.5">
                      Daily Sessions
                    </div>
                  </div>
                </div>

                {/* Buttons controls */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onResetDua(idx)}
                    className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-[var(--text2)] bg-[var(--surface2)] hover:bg-[var(--surface3)] border border-[var(--border)] active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                  <button
                    disabled={allDone}
                    onClick={() => onIncrementDua(idx, 1)}
                    className={`flex-[2] py-3 px-4 rounded-xl text-xs font-extrabold text-white shadow-sm flex items-center justify-center transition-all ${
                      allDone
                        ? 'bg-[var(--border2)] text-[var(--text3)] cursor-not-allowed opacity-60'
                        : 'bg-brand-500 hover:bg-brand-600 active:scale-95 cursor-pointer shadow-sm'
                    }`}
                  >
                    + Count
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Recommended Items Section */}
      <div className="mt-4 p-4 rounded-2xl bg-[var(--surface2)] border border-[var(--border)]">
        <div className="text-brand-700 dark:text-brand-400 text-xs font-black flex items-center gap-1.5 mb-1">
          <Sparkles className="w-4 h-4 text-brand-500" />
          Recommended Masnoon Zikar
        </div>
        <p className="text-[10px] text-[var(--text3)] font-semibold mb-4">
          Quickly add standard daily supplications to your logging tracker.
        </p>

        <div className="flex flex-col gap-2">
          {filteredRecs.length === 0 ? (
            <p className="text-[10px] text-[var(--text3)] italic text-center py-2">
              All recommended supplications have been added to your board!
            </p>
          ) : (
            filteredRecs.map((r) => (
              <div
                key={r.name}
                className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-extrabold text-xs text-[var(--text)]">{r.name}</span>
                    <span className="font-arabic text-sm text-brand-500 font-bold leading-none" dir="rtl">
                      {r.arabic}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text2)] font-medium leading-normal mt-0.5 max-w-[200px] truncate">
                    {r.translation}
                  </div>
                  <div className="text-[9px] text-brand-600 font-bold mt-1 uppercase tracking-wider">
                    Target: {r.target} × {r.daily}/day
                  </div>
                </div>
                <button
                  onClick={() => onAddRecommendation(r)}
                  className="py-1.5 px-3 rounded-lg text-[10px] font-black bg-brand-50 text-brand-600 border border-brand-500/10 hover:bg-brand-500 hover:text-white transition-all active:scale-95"
                >
                  + Add
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
