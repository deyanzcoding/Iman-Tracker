import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, CloudUpload, CheckCircle2 } from 'lucide-react';

interface NetworkStatusIndicatorProps {
  hasPendingOfflineChanges?: boolean;
}

export default function NetworkStatusIndicator({ hasPendingOfflineChanges }: NetworkStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnectedMsg, setShowReconnectedMsg] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedMsg(true);
      const timer = setTimeout(() => setShowReconnectedMsg(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedMsg(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnectedMsg) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0, y: -10 }}
        animate={{ height: 'auto', opacity: 1, y: 0 }}
        exit={{ height: 0, opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className="w-full z-30"
      >
        {!isOnline ? (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-3 py-1.5 flex items-center justify-between text-amber-700 dark:text-amber-300 text-[11px] font-bold shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              <span className="truncate">Offline Mode — Changes saved locally & queued</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold bg-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
              <CloudUpload className="w-3 h-3" /> Queued
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-3 py-1.5 flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              <span className="truncate">Back Online — Synced with Firebase Cloud</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold bg-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
              <Wifi className="w-3 h-3 text-emerald-500" /> Synced
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
