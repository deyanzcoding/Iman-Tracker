/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { PRAYERS, NamazData, PrayerKey, NamazState } from '../types';
import { weekDates, monthDates, thisYear, thisMonth, MONTH_FULL, DAYS_SHORT, MONTHS, today } from '../utils/date';
import { Clock, SquarePen, Home, Check, X, AlertTriangle } from 'lucide-react';

interface NamazTrackerProps {
  namaz: NamazData;
  onCycleCell: (date: string, prayer: PrayerKey) => void;
  filter: 'weekly' | 'monthly' | 'yearly';
  onFilterChange: (f: 'weekly' | 'monthly' | 'yearly') => void;
  goal: number;
  onOpenGoalSheet: () => void;
  weeklyCompletionPct: number;
}

export default function NamazTracker({
  namaz,
  onCycleCell,
  filter,
  onFilterChange,
  goal,
  onOpenGoalSheet,
  weeklyCompletionPct
}: NamazTrackerProps) {
  const tday = today();

  const getCellState = (date: string, prayer: PrayerKey): NamazState => {
    return namaz[date]?.[prayer] ?? 0;
  };

  // WEEKLY RENDER
  const renderWeeklyGrid = () => {
    const dates = weekDates();
    return (
      <div className="w-full overflow-x-auto no-scrollbar rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="py-2 px-2 text-left text-[10px] font-black text-[var(--text3)] uppercase tracking-wider min-w-[65px]">
                PRAYER
              </th>
              {dates.map((d, i) => {
                const isToday = d === tday;
                const dateNum = parseInt(d.split('-')[2]);
                return (
                  <th
                    key={d}
                    className={`py-2 px-0.5 text-center font-extrabold ${
                      isToday ? 'text-[#12956a]' : 'text-[var(--text3)]'
                    }`}
                  >
                    <div className="uppercase tracking-wider text-[9px]">{DAYS_SHORT[i]}</div>
                    <div className={`text-[11px] font-black mt-0.5 ${isToday ? 'text-[#12956a]' : 'text-[var(--text)]'}`}>
                      {dateNum}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {PRAYERS.map((p) => (
              <tr key={p.k} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface2)]/50 transition-colors">
                <td className="py-2 px-2">
                  <div className="font-extrabold text-[13px] text-[var(--text)] leading-tight">{p.label}</div>
                  <div className="text-[9px] text-[var(--text3)] font-medium leading-none mt-0.5">{p.sub}</div>
                </td>
                {dates.map((d) => {
                  const s = getCellState(d, p.k);
                  const isToday = d === tday;
                  
                  return (
                    <td key={d} className="py-1.5 px-0.5 text-center">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => onCycleCell(d, p.k)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-[10px] inline-flex items-center justify-center cursor-pointer border-2 transition-all ${
                          s === 1
                            ? 'bg-[#12956a] border-[#12956a] text-white shadow-md shadow-emerald-500/20'
                            : s === 2
                            ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/20'
                            : 'bg-[var(--surface2)] border-[var(--border)] text-[var(--text3)]'
                        } ${isToday ? 'ring-2 ring-[#12956a] ring-offset-1 ring-offset-[var(--surface)]' : ''}`}
                      >
                        {s === 1 ? (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3.5px]" />
                        ) : s === 2 ? (
                          <X className="w-3.5 h-3.5 text-white stroke-[3.5px]" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--text3)] opacity-50" />
                        )}
                      </motion.button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // MONTHLY RENDER
  const renderMonthlyGrid = () => {
    const y = thisYear();
    const m = thisMonth();
    const dates = monthDates(y, m);
    return (
      <div className="flex flex-col gap-2">
        <div className="text-xs font-bold text-[var(--text2)] mb-1 px-1">
          {MONTH_FULL[m - 1]} {y}
        </div>
        <div className="w-full overflow-x-auto no-scrollbar rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--surface2)] border-b border-[var(--border)]">
                <th className="py-3 px-4 text-left text-xs font-bold text-[var(--text3)] uppercase tracking-wider min-w-[85px]">
                  Prayer
                </th>
                {dates.map((d) => {
                  const isToday = d === tday;
                  const dateNum = parseInt(d.split('-')[2]);
                  return (
                    <th key={d} className={`py-3 px-1 text-center text-xs font-bold min-w-[28px] ${isToday ? 'text-[#12956a]' : 'text-[var(--text3)]'}`}>
                      {dateNum}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {PRAYERS.map((p) => (
                <tr key={p.k} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface2)]/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-sm text-[var(--text)]">{p.label}</div>
                  </td>
                  {dates.map((d) => {
                    const s = getCellState(d, p.k);
                    const isToday = d === tday;
                    let bgClass = 'bg-[var(--surface2)] border-[var(--border)]';
                    if (s === 1) bgClass = 'bg-[#12956a] border-[#12956a]';
                    if (s === 2) bgClass = 'bg-red-500 border-red-500';

                    return (
                      <td key={d} className="py-1 px-0.5 text-center">
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => onCycleCell(d, p.k)}
                          className={`w-[26px] h-[26px] rounded-lg inline-flex items-center justify-center cursor-pointer border transition-all ${bgClass} ${
                            isToday ? 'ring-2 ring-[#12956a] ring-offset-0.5 ring-offset-[var(--surface)]' : ''
                          }`}
                        >
                          {s === 1 ? (
                            <Check className="w-3 h-3 text-white stroke-[3.5px]" />
                          ) : s === 2 ? (
                            <X className="w-3 h-3 text-white stroke-[4px]" />
                          ) : (
                            <div className="w-1 h-1 rounded-full bg-[var(--border2)]" />
                          )}
                        </motion.button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // YEARLY OVERVIEW RENDER
  const renderYearlyGrid = () => {
    const y = thisYear();
    const curM = thisMonth();
    
    return (
      <div className="flex flex-col gap-2">
        <div className="text-xs font-bold text-[var(--text2)] mb-1 px-1">
          {y} Overview
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((mn, mi) => {
            const m = mi + 1;
            const dates = monthDates(y, m);
            let done = 0;
            let total = 0;

            dates.forEach((d) => {
              PRAYERS.forEach((p) => {
                total++;
                if (getCellState(d, p.k) === 1) done++;
              });
            });

            const pct = total ? Math.round((done / total) * 100) : 0;
            const circ = 2 * Math.PI * 18;
            const fill = (circ * pct) / 100;
            const isBest = m <= curM && pct >= goal;

            return (
              <div
                key={mn}
                className={`rounded-xl p-3 border text-center transition-all bg-[var(--surface2)] ${
                  isBest ? 'border-[#12956a] bg-emerald-50/10' : 'border-[var(--border)]'
                }`}
              >
                <div className="text-[11px] font-bold text-[var(--text2)] mb-2">{mn}</div>
                <div className="relative w-12 h-12 mx-auto mb-1">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                    <circle className="fill-none stroke-[var(--border)] stroke-[4px]" cx="22" cy="22" r="18" />
                    <circle
                      className="fill-none stroke-[#12956a] stroke-[4px] stroke-linecap-round transition-[stroke-dasharray] duration-500"
                      cx="22"
                      cy="22"
                      r="18"
                      strokeDasharray={`${fill} ${circ}`}
                      style={{
                        stroke: pct >= goal ? '#12956a' : pct > 0 ? '#eab308' : 'var(--border)'
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-[var(--text)]">
                    {pct}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // QADHA LIST (MISSED LIST FOR WEEK)
  const renderMissedSection = () => {
    if (filter !== 'weekly') return null;
    const dates = weekDates();
    const tday = today();
    const missedList: { prayer: string; day: string }[] = [];

    dates.forEach((d, di) => {
      if (d > tday) return;
      PRAYERS.forEach((p) => {
        if (getCellState(d, p.k) === 2) {
          missedList.push({ prayer: p.label, day: DAYS_SHORT[di] });
        }
      });
    });

    if (missedList.length === 0) return null;

    return (
      <div className="mt-2 p-4 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs mb-3">
          <AlertTriangle className="w-4 h-4 text-red-500 stroke-[2.5]" />
          {missedList.length} missed prayer{missedList.length > 1 ? 's' : ''} this week
        </div>
        <div className="flex flex-wrap gap-1.5">
          {missedList.map((m, idx) => (
            <div
              key={`${m.prayer}-${m.day}-${idx}`}
              className="py-1 px-2.5 rounded-lg text-[10px] font-bold bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/10"
            >
              {m.prayer} · {m.day}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-red-500/80 font-medium mt-2.5 leading-relaxed">
          Please make up missed prayers (Qadha) as soon as possible to keep your spiritual logs clean.
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Title Bar with Green Home Icon & Segmented Control */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-[#12956a] stroke-[2.5]" />
          <span className="font-extrabold text-xl text-[var(--text)] tracking-tight">Prayer Tracker</span>
        </div>

        <div className="flex gap-0.5 bg-[var(--surface2)] rounded-xl p-1 border border-[var(--border)]">
          {(['weekly', 'monthly', 'yearly'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => onFilterChange(opt)}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                filter === opt
                  ? 'bg-[#12956a] text-white shadow-sm'
                  : 'text-[var(--text2)] hover:text-[var(--text)]'
              }`}
            >
              {opt === 'weekly' ? 'W' : opt === 'monthly' ? 'M' : 'Y'}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Goal Card */}
      <div className="rounded-[16px] p-2.5 border border-[#12956a]/20 bg-[#12956a]/5 dark:bg-[#12956a]/10 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#12956a] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Clock className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-[var(--text2)]">Monthly Goal</div>
            <div className="text-xl font-black text-[var(--text)] leading-tight mt-0">{goal}%</div>
            <div className="text-[9px] font-bold text-[var(--text3)] mt-0.5 flex items-center gap-1">
              <span>Current: {weeklyCompletionPct}%</span>
              <span>·</span>
              <span>🕌 {weeklyCompletionPct > 0 ? 'In progress' : 'Start tracking'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenGoalSheet}
          className="w-9 h-9 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text2)] hover:bg-[var(--surface2)] flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          <SquarePen className="w-4 h-4" />
        </button>
      </div>

      {/* Main Grid Table */}
      {filter === 'weekly' && renderWeeklyGrid()}
      {filter === 'monthly' && renderMonthlyGrid()}
      {filter === 'yearly' && renderYearlyGrid()}

      {/* Legend below table */}
      <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400 px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#12956a]" />
            Prayed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            Missed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
            Not set
          </span>
        </div>
        <span className="text-[10px] text-gray-400 font-semibold">Tap to cycle</span>
      </div>

      {/* Missed prayers warning (Qadha helper) */}
      {renderMissedSection()}
    </div>
  );
}
