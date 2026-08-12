/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Bell, Quote, BookOpen, Book, CheckCircle2 } from 'lucide-react';
import { IslamicBannerAlertData } from '../utils/reminders';

interface IslamicBannerAlertProps {
  onNavigateTab: (tab: 'namaz' | 'dua' | 'quran') => void;
}

export default function IslamicBannerAlert({ onNavigateTab }: IslamicBannerAlertProps) {
  const [alert, setAlert] = useState<IslamicBannerAlertData | null>(null);

  useEffect(() => {
    const handleShowAlert = (e: Event) => {
      const customEvent = e as CustomEvent<IslamicBannerAlertData>;
      if (customEvent.detail) {
        setAlert(customEvent.detail);
      }
    };

    const handleOpenTab = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab: 'namaz' | 'dua' | 'quran' }>;
      if (customEvent.detail?.tab) {
        onNavigateTab(customEvent.detail.tab);
        setAlert(null);
      }
    };

    window.addEventListener('show_islamic_banner_alert', handleShowAlert);
    window.addEventListener('open_islamic_tab', handleOpenTab);

    return () => {
      window.removeEventListener('show_islamic_banner_alert', handleShowAlert);
      window.removeEventListener('open_islamic_tab', handleOpenTab);
    };
  }, [onNavigateTab]);

  if (!alert) return null;

  const getThemeStyles = () => {
    switch (alert.type) {
      case 'zikar':
        return {
          bg: 'from-blue-600 via-indigo-600 to-blue-700',
          border: 'border-blue-400/40',
          badgeBg: 'bg-blue-400/20 text-blue-200',
          btnBg: 'bg-white text-blue-700 hover:bg-blue-50',
          label: 'Zikar & Dua Reminder',
          tabName: 'Zikar'
        };
      case 'quran':
        return {
          bg: 'from-purple-600 via-fuchsia-600 to-purple-700',
          border: 'border-purple-400/40',
          badgeBg: 'bg-purple-400/20 text-purple-200',
          btnBg: 'bg-white text-purple-800 hover:bg-purple-50',
          label: 'Quran Recitation Reminder',
          tabName: 'Quran'
        };
      default:
        return {
          bg: 'from-emerald-600 via-teal-600 to-emerald-700',
          border: 'border-emerald-400/40',
          badgeBg: 'bg-emerald-400/20 text-emerald-200',
          btnBg: 'bg-white text-emerald-800 hover:bg-emerald-50',
          label: 'Namaz Prayer Alert',
          tabName: 'Namaz'
        };
    }
  };

  const theme = getThemeStyles();

  const handleBannerClick = () => {
    onNavigateTab(alert.tab);
    setAlert(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -100, opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="fixed top-3 left-3 right-3 z-[9999] max-w-md mx-auto"
      >
        <div
          onClick={handleBannerClick}
          className={`p-4 rounded-2xl bg-gradient-to-r ${theme.bg} border ${theme.border} text-white shadow-2xl backdrop-blur-xl cursor-pointer hover:scale-[1.01] transition-all relative overflow-hidden`}
        >
          {/* Background Decorative Glow */}
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

          {/* Header Bar */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${theme.badgeBg}`}>
              <Bell className="w-3 h-3 stroke-[2.5]" />
              <span>{theme.label}</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setAlert(null);
              }}
              className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-colors"
              title="Close Banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Title & Main Alert Message */}
          <h3 className="text-sm font-black tracking-wide text-white mb-1">
            {alert.title}
          </h3>
          <p className="text-xs font-medium text-white/90 leading-snug mb-3">
            {alert.body}
          </p>

          {/* Islamic Motivational Quote Callout */}
          {alert.quote && (
            <div className="p-2.5 bg-black/25 rounded-xl border border-white/10 mb-3 flex items-start gap-2 text-xs italic text-amber-200">
              <Quote className="w-4 h-4 shrink-0 text-amber-300 not-italic opacity-80 mt-0.5" />
              <span className="leading-relaxed font-serif">"{alert.quote}"</span>
            </div>
          )}

          {/* Action Button to Jump to Tab */}
          <div className="flex items-center justify-between pt-1 border-t border-white/15">
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
              Tap anywhere to view
            </span>
            <button
              onClick={handleBannerClick}
              className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all ${theme.btnBg} active:scale-95`}
            >
              <span>Go to {theme.tabName}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
