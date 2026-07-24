/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, Zikar, PrayerKey, PRAYERS } from './types';
import { today, weekDates } from './utils/date';
import NamazTracker from './components/NamazTracker';
import ZikarCounter from './components/ZikarCounter';
import QuranReader from './components/QuranReader';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import BottomSheet from './components/BottomSheet';
import ConfirmDialog from './components/ConfirmDialog';
import { Home, BookOpen, Book, BarChart2, Settings as SettingsIcon } from 'lucide-react';
import appLogo from './assets/images/favicon_1784528732122.jpg';

export default function App() {
  // ─── LOCAL STORAGE PERSISTENCE LAZY INITIALIZER ───
  const [state, setState] = useState<AppState>(() => {
    const tday = today();
    const defaults: AppState = {
      namaz: {},
      duas: [
        {
          id: 1,
          name: 'SubhanAllah',
          arabic: 'سُبْحَانَ اللَّه',
          translation: 'Glory be to Allah',
          target: 33,
          daily: 3,
          sessions: [0, 0, 0],
          currentSession: 0,
          completedDates: []
        },
        {
          id: 2,
          name: 'Alhamdulillah',
          arabic: 'الْحَمْدُ لِلَّه',
          translation: 'All praise is due to Allah',
          target: 33,
          daily: 3,
          sessions: [0, 0, 0],
          currentSession: 0,
          completedDates: []
        },
        {
          id: 3,
          name: 'AllahuAkbar',
          arabic: 'اللَّهُ أَكْبَر',
          translation: 'Allah is the Greatest',
          target: 34,
          daily: 3,
          sessions: [0, 0, 0],
          currentSession: 0,
          completedDates: []
        }
      ],
      deletedDuas: [],
      goal: 90,
      bestStreak: 0,
      dark: false,
      lastActiveDate: tday,
      pendingSyncQueue: []
    };

    try {
      const raw = localStorage.getItem('namaztrack_pro');
      if (raw) {
        const parsed = JSON.parse(raw);
        
        // Ensure necessary top-level fields are populated
        if (!parsed.namaz) parsed.namaz = {};
        if (!parsed.duas) parsed.duas = [];
        if (!parsed.deletedDuas) parsed.deletedDuas = [];
        if (typeof parsed.goal !== 'number') parsed.goal = 90;
        if (typeof parsed.bestStreak !== 'number') parsed.bestStreak = 0;
        if (typeof parsed.dark !== 'boolean') parsed.dark = false;
        if (!parsed.pendingSyncQueue) parsed.pendingSyncQueue = [];
        
        // Date transition check: Reset daily zikar sessions if day shifted
        if (!parsed.lastActiveDate) parsed.lastActiveDate = tday;
        if (parsed.lastActiveDate !== tday) {
          parsed.duas = parsed.duas.map((d: Zikar) => ({
            ...d,
            sessions: Array.from({ length: Math.max(1, d.daily) }, () => 0),
            currentSession: 0
          }));
          parsed.lastActiveDate = tday;
        }

        return parsed;
      }
    } catch (e) {
      console.error('Error loading localStorage state:', e);
    }

    return defaults;
  });

  // ─── NAV STATE ───
  const [activeTab, setActiveTab] = useState<'namaz' | 'dua' | 'quran' | 'progress' | 'settings'>('namaz');
  const [namazFilter, setNamazFilter] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Swipe Recognition logic for seamless Tab Transitions
  const swipeStartX = React.useRef<number | null>(null);
  const swipeStartY = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null || swipeStartY.current === null) return;

    const diffX = e.changedTouches[0].clientX - swipeStartX.current;
    const diffY = e.changedTouches[0].clientY - swipeStartY.current;

    const minSwipeDistance = 50; // minimum required slide swipe in px
    // We confirm it is a horizontal swipe rather than a vertical scrolling gesture
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
      const target = e.target as HTMLElement;
      // Do not trigger tab switching when swiping horizontal-scrolling grids, selects, PDF embeds, buttons, etc.
      if (
        target.closest('.overflow-x-auto') || 
        target.closest('object') || 
        target.closest('embed') || 
        target.closest('button') || 
        target.closest('input') || 
        target.closest('select') ||
        target.closest('.no-swipe')
      ) {
        return;
      }

      const tabs: ('namaz' | 'dua' | 'quran' | 'progress' | 'settings')[] = ['namaz', 'dua', 'quran', 'progress', 'settings'];
      const currentIndex = tabs.indexOf(activeTab);

      if (diffX > 0) {
        // Swipe Left-to-Right -> Switch to Previous Tab
        if (currentIndex > 0) {
          setActiveTab(tabs[currentIndex - 1]);
        }
      } else {
        // Swipe Right-to-Left -> Switch to Next Tab
        if (currentIndex < tabs.length - 1) {
          setActiveTab(tabs[currentIndex + 1]);
        }
      }
    }

    swipeStartX.current = null;
    swipeStartY.current = null;
  };

  // ─── TOAST NOTIFICATION ENGINE ───
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const showToast = (msg: string) => {
    setToast({ message: msg, visible: true });
  };
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // ─── DARK THEME SYNCHRONIZATION ───
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.dark ? 'dark' : 'light');
  }, [state.dark]);

  // Save state to localStorage on every state mutate
  useEffect(() => {
    localStorage.setItem('namaztrack_pro', JSON.stringify(state));
  }, [state]);

  // ─── CORE WEEKLY STATS CALCULATIONS FOR APP HEADER ───
  const weeklyCompletionMetrics = useMemo(() => {
    const dates = weekDates();
    let prayedCount = 0;
    let missedCount = 0;
    const totalPossible = dates.length * 5;

    dates.forEach((d) => {
      PRAYERS.forEach((p) => {
        const status = state.namaz[d]?.[p.k] ?? 0;
        if (status === 1) prayedCount++;
        if (status === 2) missedCount++;
      });
    });

    const percentage = totalPossible ? Math.round((prayedCount / totalPossible) * 100) : 0;
    return { prayedCount, missedCount, percentage };
  }, [state.namaz]);

  // ─── NAMAZ CYCLING CONTROLS ───
  const handleCycleCell = (date: string, prayer: PrayerKey) => {
    const currentVal = state.namaz[date]?.[prayer] ?? 0;
    const newVal = ((currentVal + 1) % 3) as 0 | 1 | 2;

    setState((prev) => {
      const updatedNamaz = { ...prev.namaz };
      if (!updatedNamaz[date]) {
        updatedNamaz[date] = {};
      }
      updatedNamaz[date] = {
        ...updatedNamaz[date],
        [prayer]: newVal
      };

      // Live calculate streak to check if best is updated
      let maxBest = prev.bestStreak;
      let curStreak = 0;
      const now = new Date();
      for (let i = 0; i < 365; i++) {
        const dd = new Date(now);
        dd.setDate(now.getDate() - i);
        const ds = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
        
        const allPrayed = PRAYERS.every((p) => (updatedNamaz[ds]?.[p.k] ?? 0) === 1);
        if (allPrayed) {
          curStreak++;
          if (curStreak > maxBest) maxBest = curStreak;
        } else {
          break;
        }
      }

      return {
        ...prev,
        namaz: updatedNamaz,
        bestStreak: maxBest
      };
    });
  };

  // ─── ZIKAR CONTROLS ───
  const handleIncrementZikar = (idx: number, delta: number) => {
    setState((prev) => {
      const updatedDuas = [...prev.duas];
      const d = updatedDuas[idx];
      const sessions = Array.isArray(d.sessions) ? [...d.sessions] : [];
      const daily = Math.max(1, d.daily);

      // Pad or trim sessions list
      while (sessions.length < daily) sessions.push(0);
      const activeIdx = Math.max(0, Math.min(d.currentSession, daily - 1));

      const oldCount = sessions[activeIdx];
      const newCount = Math.max(0, Math.min(oldCount + delta, d.target));
      if (oldCount === newCount) return prev;

      sessions[activeIdx] = newCount;
      d.sessions = sessions;

      const finishedSession = oldCount < d.target && newCount >= d.target;
      if (finishedSession) {
        // Find next incomplete session index
        const nextIncomplete = sessions.findIndex((c, sIdx) => sIdx > activeIdx && c < d.target);
        if (nextIncomplete !== -1) {
          d.currentSession = nextIncomplete;
          showToast(`Session ${activeIdx + 1} Done! → Session ${nextIncomplete + 1}`);
        } else {
          const allCompleted = sessions.every((c) => c >= d.target);
          if (allCompleted) {
            showToast('🎉 Zikar complete for today!');
            const tday = today();
            if (!d.completedDates) d.completedDates = [];
            if (!d.completedDates.includes(tday)) {
              d.completedDates = [...d.completedDates, tday];
            }
          } else {
            d.currentSession = activeIdx;
            showToast(`Session ${activeIdx + 1} Done! 🌿`);
          }
        }
      } else {
        d.currentSession = activeIdx;
      }

      updatedDuas[idx] = d;
      return { 
        ...prev, 
        duas: updatedDuas
      };
    });
  };

  const handleResetZikar = (idx: number) => {
    setState((prev) => {
      const updatedDuas = [...prev.duas];
      const d = updatedDuas[idx];
      const daily = Math.max(1, d.daily);
      
      d.sessions = Array.from({ length: daily }, () => 0);
      d.currentSession = 0;
      
      const tday = today();
      if (d.completedDates && d.completedDates.includes(tday)) {
        d.completedDates = d.completedDates.filter((x) => x !== tday);
      }
      
      updatedDuas[idx] = d;
      showToast(`Counter reset for ${d.name}`);
      return { ...prev, duas: updatedDuas };
    });
  };

  const handleAddRecommendation = (rec: { name: string; arabic: string; translation: string; target: number; daily: number }) => {
    setState((prev) => {
      const isDuplicate = prev.duas.some((d) => d.name.toLowerCase() === rec.name.toLowerCase());
      if (isDuplicate) return prev;

      const newDua: Zikar = {
        id: Date.now(),
        name: rec.name,
        arabic: rec.arabic,
        translation: rec.translation,
        target: rec.target,
        daily: rec.daily,
        sessions: Array.from({ length: rec.daily }, () => 0),
        currentSession: 0,
        completedDates: []
      };

      showToast(`✅ Added ${rec.name} 🤲`);
      return {
        ...prev,
        duas: [...prev.duas, newDua]
      };
    });
  };

  // ─── RECYCLE BIN PIPELINE ───
  const handleSoftDeleteZikar = (idx: number) => {
    setState((prev) => {
      const updatedDuas = [...prev.duas];
      const [removed] = updatedDuas.splice(idx, 1);
      const updatedDeleted = [...(prev.deletedDuas || []), removed];
      
      showToast(`Zikar moved to Recycle Bin`);
      return {
        ...prev,
        duas: updatedDuas,
        deletedDuas: updatedDeleted
      };
    });
  };

  const handleRestoreZikar = (idx: number) => {
    setState((prev) => {
      const updatedDeleted = [...prev.deletedDuas];
      const [restored] = updatedDeleted.splice(idx, 1);
      const updatedDuas = [...prev.duas, restored];

      showToast(`🌿 "${restored.name}" restored successfully`);
      return {
        ...prev,
        duas: updatedDuas,
        deletedDuas: updatedDeleted
      };
    });
  };

  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);
  const handlePermanentDeleteZikar = (idx: number) => {
    setDeleteConfirmIdx(idx);
    setConfirmType('permanent_delete');
  };

  const executePermanentDelete = () => {
    if (deleteConfirmIdx === null) return;
    setState((prev) => {
      const updatedDeleted = [...prev.deletedDuas];
      const [removed] = updatedDeleted.splice(deleteConfirmIdx, 1);
      showToast(`❌ "${removed.name}" destroyed permanently`);
      return {
        ...prev,
        deletedDuas: updatedDeleted
      };
    });
    setDeleteConfirmIdx(null);
  };

  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState(false);
  const handlePurgeRecycleBin = () => {
    setIsPurgeConfirmOpen(true);
    setConfirmType('purge_bin');
  };

  const executePurgeBin = () => {
    setState((prev) => ({
      ...prev,
      deletedDuas: []
    }));
    showToast('🗑️ Recycle Bin completely emptied');
    setIsPurgeConfirmOpen(false);
  };

  // ─── CLEAR DATA PIPELINE ───
  const [clearTarget, setClearTarget] = useState<'namaz' | 'zikar' | 'both' | null>(null);
  const handleRequestClearData = (target: 'namaz' | 'zikar' | 'both') => {
    setClearTarget(target);
    setConfirmType('clear_data');
  };

  const executeClearData = () => {
    if (!clearTarget) return;

    setState((prev) => {
      let updatedNamaz = { ...prev.namaz };
      let updatedDuas = [...prev.duas];
      let updatedDeleted = [...prev.deletedDuas];
      let maxBest = prev.bestStreak;

      if (clearTarget === 'namaz' || clearTarget === 'both') {
        updatedNamaz = {};
        maxBest = 0;
      }
      if (clearTarget === 'zikar' || clearTarget === 'both') {
        if (clearTarget === 'both') {
          updatedDuas = [
            {
              id: 1,
              name: 'SubhanAllah',
              arabic: 'سُبْحَانَ اللَّه',
              translation: 'Glory be to Allah',
              target: 33,
              daily: 3,
              sessions: [0, 0, 0],
              currentSession: 0,
              completedDates: []
            },
            {
              id: 2,
              name: 'Alhamdulillah',
              arabic: 'الْحَمْدُ لِلَّه',
              translation: 'All praise is due to Allah',
              target: 33,
              daily: 3,
              sessions: [0, 0, 0],
              currentSession: 0,
              completedDates: []
            },
            {
              id: 3,
              name: 'AllahuAkbar',
              arabic: 'اللَّهُ أَكْبَر',
              translation: 'Allah is the Greatest',
              target: 34,
              daily: 3,
              sessions: [0, 0, 0],
              currentSession: 0,
              completedDates: []
            }
          ];
          updatedDeleted = [];
        } else {
          updatedDuas = updatedDuas.map((d) => ({
            ...d,
            sessions: Array.from({ length: Math.max(1, d.daily) }, () => 0),
            currentSession: 0,
            completedDates: []
          }));
          updatedDeleted = [];
        }
      }

      return {
        ...prev,
        namaz: updatedNamaz,
        duas: updatedDuas,
        deletedDuas: updatedDeleted,
        bestStreak: maxBest
      };
    });

    const msgs = {
      namaz: '🕌 Namaz records cleared',
      zikar: '📿 Zikar records cleared',
      both: '🗑️ All data reset successfully'
    };
    showToast(msgs[clearTarget]);
    setClearTarget(null);
  };

  // ─── POPUP OVERLAYS ENGINE ───
  const [confirmType, setConfirmType] = useState<'permanent_delete' | 'purge_bin' | 'clear_data' | null>(null);
  const [isGoalSheetOpen, setIsGoalSheetOpen] = useState(false);
  const [goalInputValue, setGoalInputValue] = useState<number>(state.goal);

  const handleOpenGoalSheet = () => {
    setGoalInputValue(state.goal);
    setIsGoalSheetOpen(true);
  };

  const handleSaveGoal = () => {
    if (goalInputValue < 1 || goalInputValue > 100) {
      showToast('Enter a valid percentage (1-100)');
      return;
    }
    setState((prev) => ({ ...prev, goal: goalInputValue }));
    setIsGoalSheetOpen(false);
    showToast(`🎯 Monthly goal set to ${goalInputValue}%`);
  };

  const [isZikarSheetOpen, setIsZikarSheetOpen] = useState(false);
  const [zikarEditIdx, setZikarEditIdx] = useState<number | null>(null);
  const [zkName, setZkName] = useState('');
  const [zkArabic, setZkArabic] = useState('');
  const [zkTrans, setZkTrans] = useState('');
  const [zkTarget, setZkTarget] = useState(33);
  const [zkDaily, setZkDaily] = useState(3);

  const handleOpenAddZikar = () => {
    setZikarEditIdx(null);
    setZkName('');
    setZkArabic('');
    setZkTrans('');
    setZkTarget(33);
    setZkDaily(3);
    setIsZikarSheetOpen(true);
  };

  const handleOpenEditZikar = (idx: number) => {
    const d = state.duas[idx];
    setZikarEditIdx(idx);
    setZkName(d.name);
    setZkArabic(d.arabic ?? '');
    setZkTrans(d.translation ?? '');
    setZkTarget(d.target);
    setZkDaily(d.daily);
    setIsZikarSheetOpen(true);
  };

  const handleSaveZikarForm = () => {
    const trimmedName = zkName.trim();
    if (!trimmedName) {
      showToast('Please provide a Zikar name');
      return;
    }
    const safeTarget = Math.max(1, zkTarget);
    const safeDaily = Math.max(1, zkDaily);

    setState((prev) => {
      const updatedDuas = [...prev.duas];
      
      if (zikarEditIdx !== null) {
        // Edit Mode
        const old = updatedDuas[zikarEditIdx];
        const sessions = Array.isArray(old.sessions) ? [...old.sessions] : [];
        while (sessions.length < safeDaily) sessions.push(0);
        
        updatedDuas[zikarEditIdx] = {
          ...old,
          name: trimmedName,
          arabic: zkArabic.trim() || undefined,
          translation: zkTrans.trim() || undefined,
          target: safeTarget,
          daily: safeDaily,
          sessions: sessions.slice(0, safeDaily),
          currentSession: Math.min(old.currentSession, safeDaily - 1)
        };
        showToast('✏️ Zikar parameters updated');
      } else {
        // Add Mode
        updatedDuas.push({
          id: Date.now(),
          name: trimmedName,
          arabic: zkArabic.trim() || undefined,
          translation: zkTrans.trim() || undefined,
          target: safeTarget,
          daily: safeDaily,
          sessions: Array.from({ length: safeDaily }, () => 0),
          currentSession: 0,
          completedDates: []
        });
        showToast('✅ Custom Zikar added 🤲');
      }

      return {
        ...prev,
        duas: updatedDuas
      };
    });

    setIsZikarSheetOpen(false);
  };

  // STREAK RETRIEVER
  const { streakCount } = useMemo(() => {
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const dd = new Date(now);
      dd.setDate(now.getDate() - i);
      const ds = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
      
      const allPrayed = PRAYERS.every((p) => (state.namaz[ds]?.[p.k] ?? 0) === 1);
      if (allPrayed) streak++;
      else break;
    }
    return { streakCount: streak };
  }, [state.namaz]);

  return (
    <div className="min-h-screen bg-[var(--bg)] flex justify-center py-0 md:py-6 text-[var(--text)] transition-colors duration-250 select-none">
      {/* 430px Responsive Native Mobile Container with Clean Bezel and Premium Drop Shadow */}
      <div className="w-full max-w-[430px] h-screen md:h-[850px] md:max-h-[920px] md:rounded-[48px] md:border-[12px] md:border-[#1A1A1A] bg-[var(--surface)] flex flex-col relative overflow-hidden md:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)]">
        
        {/* APP SPLASH SCREEN */}
        <AnimatePresence>
          {showSplash && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-br from-[#12956a] to-[#1dbf87] z-[100] flex flex-col items-center justify-between p-12 text-white"
            >
              <div /> {/* Spacer */}
              
              <div className="flex flex-col items-center gap-6">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                  className="w-28 h-28 rounded-[28px] overflow-hidden shadow-2xl border-4 border-white/20 bg-white"
                >
                  <img 
                    src={appLogo} 
                    alt="Iman Tracker Logo" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
                
                <div className="text-center">
                  <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-black tracking-wide"
                  >
                    Iman Tracker
                  </motion.h1>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xs uppercase tracking-[0.2em] text-white/80 font-bold mt-1.5"
                  >
                    Islamic Prayer Journal
                  </motion.p>
                </div>
              </div>

              {/* Progress loader at the bottom */}
              <div className="flex flex-col items-center gap-3 w-full max-w-[180px]">
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.0, ease: 'easeInOut' }}
                    className="h-full bg-white"
                  />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/70">
                  Loading Your Journal...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SCROLLABLE MAIN CONTENT AREA */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex-1 overflow-y-auto no-scrollbar flex flex-col pb-24"
        >
          {/* APP HEADER */}
          <div className="relative overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#12956a] to-[#1dbf87] p-3 pb-4 text-white mb-2">
            {/* Subtle Decorative Circular Shapes */}
            <div className="absolute -right-10 -top-10 w-44 h-44 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-black/10 rounded-full blur-xl pointer-events-none" />

            {/* Brand header bar */}
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div>
                  <h1 className="font-sans font-extrabold text-[22px] tracking-wide leading-none text-white">Iman Tracker</h1>
                  <div className="text-[9px] uppercase font-bold tracking-widest text-white/80 mt-1">ISLAMIC PRAYER JOURNAL</div>
                </div>
              </div>

              {/* Streak Tracker Badge - Glassmorphism Card */}
              <div className="rounded-2xl py-1.5 px-3 text-center bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-sm min-w-[70px]">
                <div className="text-2xl font-black leading-none">{streakCount}</div>
                <div className="text-[8px] font-extrabold uppercase mt-1 tracking-wider text-white/90">Day Streak</div>
              </div>
            </div>

            {/* Quick Header Stats Cards - Beautiful Glassmorphism Cards */}
            <div className="grid grid-cols-3 gap-2 mt-3 relative z-10">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[14px] py-2 px-2 text-center">
                <div className="text-lg font-black leading-none text-white">{weeklyCompletionMetrics.prayedCount}</div>
                <div className="text-[8px] font-bold text-white/90 mt-1 tracking-wider uppercase">Prayed</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[14px] py-2 px-2 text-center">
                <div className="text-lg font-black leading-none text-white">{weeklyCompletionMetrics.missedCount}</div>
                <div className="text-[8px] font-bold text-white/90 mt-1 tracking-wider uppercase">Missed</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[14px] py-2 px-2 text-center">
                <div className="text-lg font-black leading-none text-white">{state.bestStreak}</div>
                <div className="text-[8px] font-bold text-white/90 mt-1 tracking-wider uppercase">Best</div>
              </div>
            </div>

            {/* Weekly progress Bar */}
            <div className="mt-3 relative z-10">
              <div className="text-[10px] font-bold text-white/85 uppercase tracking-wider mb-1.5">Weekly Completion</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-white/25 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${weeklyCompletionMetrics.percentage}%` }}
                  />
                </div>
                <div className="text-xs font-black text-white min-w-[32px] text-right">
                  {weeklyCompletionMetrics.percentage}%
                </div>
              </div>
            </div>
          </div>

          {/* PAGE CONTENT WINDOW */}
          <div className="px-4">
            {activeTab === 'namaz' && (
            <NamazTracker
              namaz={state.namaz}
              onCycleCell={handleCycleCell}
              filter={namazFilter}
              onFilterChange={setNamazFilter}
              goal={state.goal}
              onOpenGoalSheet={handleOpenGoalSheet}
              weeklyCompletionPct={weeklyCompletionMetrics.percentage}
            />
          )}

          {activeTab === 'dua' && (
            <ZikarCounter
              duas={state.duas}
              onAddDuaClick={handleOpenAddZikar}
              onEditDuaClick={handleOpenEditZikar}
              onDeleteDuaClick={handleSoftDeleteZikar}
              onIncrementDua={handleIncrementZikar}
              onResetDua={handleResetZikar}
              onAddRecommendation={handleAddRecommendation}
            />
          )}

          {activeTab === 'quran' && (
            <QuranReader isOnline={true} showToast={showToast} />
          )}

          {activeTab === 'progress' && (
            <Analytics namaz={state.namaz} duas={state.duas} goal={state.goal} />
          )}

          {activeTab === 'settings' && (
            <Settings
              dark={state.dark}
              onToggleDark={() => setState((prev) => ({ ...prev, dark: !prev.dark }))}
              goal={state.goal}
              onOpenGoalSheet={handleOpenGoalSheet}
              deletedDuas={state.deletedDuas || []}
              onRestoreZikar={handleRestoreZikar}
              onPermanentDeleteZikar={handlePermanentDeleteZikar}
              onPurgeRecycleBin={handlePurgeRecycleBin}
              onClearData={handleRequestClearData}
            />
          )}
          </div>
        </div>

        {/* PERSISTENT BOTTOM NAVIGATION BAR */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-[var(--surface)] border-t border-[var(--border)] flex items-stretch z-40 transition-colors duration-250 px-3">
          <button
            onClick={() => setActiveTab('namaz')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-bold tracking-wider relative transition-colors ${
              activeTab === 'namaz' ? 'text-brand-500' : 'text-[var(--text3)] hover:text-[var(--text2)] opacity-60 hover:opacity-100'
            }`}
          >
            <Home className={`w-[20px] h-[20px] transition-transform ${activeTab === 'namaz' ? 'scale-110 text-brand-500' : ''}`} />
            <span>Namaz</span>
            {activeTab === 'namaz' && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-500" />}
          </button>
          <button
            onClick={() => setActiveTab('dua')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-bold tracking-wider relative transition-colors ${
              activeTab === 'dua' ? 'text-brand-500' : 'text-[var(--text3)] hover:text-[var(--text2)] opacity-60 hover:opacity-100'
            }`}
          >
            <BookOpen className={`w-[20px] h-[20px] transition-transform ${activeTab === 'dua' ? 'scale-110 text-brand-500' : ''}`} />
            <span>Zikar</span>
            {activeTab === 'dua' && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-500" />}
          </button>
          <button
            onClick={() => setActiveTab('quran')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-bold tracking-wider relative transition-colors ${
              activeTab === 'quran' ? 'text-brand-500' : 'text-[var(--text3)] hover:text-[var(--text2)] opacity-60 hover:opacity-100'
            }`}
          >
            <Book className={`w-[20px] h-[20px] transition-transform ${activeTab === 'quran' ? 'scale-110 text-brand-500' : ''}`} />
            <span>Quran</span>
            {activeTab === 'quran' && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-500" />}
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-bold tracking-wider relative transition-colors ${
              activeTab === 'progress' ? 'text-brand-500' : 'text-[var(--text3)] hover:text-[var(--text2)] opacity-60 hover:opacity-100'
            }`}
          >
            <BarChart2 className={`w-[20px] h-[20px] transition-transform ${activeTab === 'progress' ? 'scale-110 text-brand-500' : ''}`} />
            <span>Progress</span>
            {activeTab === 'progress' && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-500" />}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-bold tracking-wider relative transition-colors ${
              activeTab === 'settings' ? 'text-brand-500' : 'text-[var(--text3)] hover:text-[var(--text2)] opacity-60 hover:opacity-100'
            }`}
          >
            <SettingsIcon className={`w-[20px] h-[20px] transition-transform ${activeTab === 'settings' ? 'scale-110 text-brand-500' : ''}`} />
            <span>Settings</span>
            {activeTab === 'settings' && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-500" />}
          </button>
        </div>

        {/* ─── OVERLAYS & SHEETS ─── */}

        {/* Goal Set Bottom Sheet */}
        <BottomSheet isOpen={isGoalSheetOpen} onClose={() => setIsGoalSheetOpen(false)} title="Set Monthly Goal">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold text-[var(--text2)] uppercase tracking-wider block mb-1.5">
                Target Completion Percentage
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={goalInputValue || ''}
                onChange={(e) => setGoalInputValue(parseInt(e.target.value) || 0)}
                placeholder="e.g. 90"
                className="w-full p-3.5 border-2 border-[var(--border)] rounded-xl bg-[var(--surface2)] text-[var(--text)] text-sm font-bold outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            <p className="text-[10px] text-[var(--text3)] leading-relaxed mt-[-4px]">
              This goal is evaluated against completing all 5 primary prayers throughout the entire month.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setIsGoalSheetOpen(false)}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-[var(--text2)] bg-[var(--surface2)] hover:bg-[var(--surface3)] border border-[var(--border)] transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoal}
                className="flex-1 py-3.5 rounded-xl text-sm font-black text-white bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/15 transition-colors active:scale-95"
              >
                Set Goal
              </button>
            </div>
          </div>
        </BottomSheet>

        {/* Zikar Add/Edit Bottom Sheet */}
        <BottomSheet
          isOpen={isZikarSheetOpen}
          onClose={() => setIsZikarSheetOpen(false)}
          title={zikarEditIdx !== null ? 'Edit Zikar Parameters' : 'Add Custom Zikar'}
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold text-[var(--text2)] uppercase tracking-wider block mb-1.5">
                Zikar Name
              </label>
              <input
                type="text"
                maxLength={50}
                value={zkName}
                onChange={(e) => setZkName(e.target.value)}
                placeholder="e.g. SubhanAllah"
                className="w-full p-3.5 border-2 border-[var(--border)] rounded-xl bg-[var(--surface2)] text-[var(--text)] text-sm font-bold outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[var(--text2)] uppercase tracking-wider block mb-1.5">
                Arabic text (optional)
              </label>
              <input
                type="text"
                maxLength={80}
                value={zkArabic}
                onChange={(e) => setZkArabic(e.target.value)}
                placeholder="e.g. سبحان الله"
                dir="rtl"
                className="w-full p-3.5 border-2 border-[var(--border)] rounded-xl bg-[var(--surface2)] text-[var(--text)] text-lg font-arabic font-bold outline-none focus:border-brand-500 transition-colors text-right"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[var(--text2)] uppercase tracking-wider block mb-1.5">
                Translation (optional)
              </label>
              <input
                type="text"
                maxLength={100}
                value={zkTrans}
                onChange={(e) => setZkTrans(e.target.value)}
                placeholder="e.g. Glory be to Allah"
                className="w-full p-3.5 border-2 border-[var(--border)] rounded-xl bg-[var(--surface2)] text-[var(--text)] text-sm font-medium outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-[var(--text2)] uppercase tracking-wider block mb-1.5">
                  Count Per Session
                </label>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={zkTarget || ''}
                  onChange={(e) => setZkTarget(parseInt(e.target.value) || 0)}
                  placeholder="33"
                  className="w-full p-3.5 border-2 border-[var(--border)] rounded-xl bg-[var(--surface2)] text-[var(--text)] text-sm font-bold outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text2)] uppercase tracking-wider block mb-1.5">
                  Sessions Per Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={zkDaily || ''}
                  onChange={(e) => setZkDaily(parseInt(e.target.value) || 0)}
                  placeholder="3"
                  className="w-full p-3.5 border-2 border-[var(--border)] rounded-xl bg-[var(--surface2)] text-[var(--text)] text-sm font-bold outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <p className="text-[10px] text-[var(--text3)] mt-[-4px] leading-relaxed">
              Example: 33 target count × 3 daily sessions = 99 total counts per day.
            </p>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setIsZikarSheetOpen(false)}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-[var(--text2)] bg-[var(--surface2)] hover:bg-[var(--surface3)] border border-[var(--border)] transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveZikarForm}
                className="flex-1 py-3.5 rounded-xl text-sm font-black text-white bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/15 transition-colors active:scale-95"
              >
                Save Zikar
              </button>
            </div>
          </div>
        </BottomSheet>

        {/* Double Confirmation Dialog Box */}
        <ConfirmDialog
          isOpen={confirmType !== null}
          onClose={() => setConfirmType(null)}
          onConfirm={() => {
            if (confirmType === 'permanent_delete') executePermanentDelete();
            if (confirmType === 'purge_bin') executePurgeBin();
            if (confirmType === 'clear_data') executeClearData();
          }}
          title={
            confirmType === 'permanent_delete'
              ? 'Permanently Delete?'
              : confirmType === 'purge_bin'
              ? 'Empty Recycle Bin?'
              : 'Clear Selected Logs?'
          }
          message={
            confirmType === 'permanent_delete'
              ? 'Are you absolutely sure you want to delete this supplication permanently? All associated configuration data will be lost.'
              : confirmType === 'purge_bin'
              ? 'Are you sure you want to empty the Recycle Bin? All deleted configurations inside will be permanently destroyed.'
              : 'This action is permanent and cannot be undone. Are you sure you want to proceed with clearing the selected logs?'
          }
          confirmText={
            confirmType === 'permanent_delete'
              ? 'Delete Permanently'
              : confirmType === 'purge_bin'
              ? 'Empty Bin'
              : 'Clear Data'
          }
          icon={confirmType === 'permanent_delete' ? '⚠️' : confirmType === 'purge_bin' ? '🗑️' : '🔥'}
        />

        {/* TOAST SYSTEM POPUP OVERLAY */}
        <div
          className={`absolute bottom-24 left-1/2 -translate-x-1/2 z-50 py-2.5 px-5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold rounded-full shadow-lg pointer-events-none transition-all duration-200 ${
            toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          {toast.message}
        </div>

      </div>
    </div>
  );
}
