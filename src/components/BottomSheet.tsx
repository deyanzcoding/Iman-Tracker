/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  // Handle click on backdrop to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          {/* Bottom Sheet Box */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className="relative w-full max-w-[430px] rounded-t-3xl bg-[var(--surface)] px-5 pt-4 pb-10 shadow-2xl border-t border-[var(--border)] z-10 max-h-[88dvh] overflow-y-auto no-scrollbar"
          >
            {/* Sheet Handle Accent */}
            <div className="w-10 h-1 bg-[var(--border2)] rounded-full mx-auto mb-5 cursor-pointer" onClick={onClose} />

            {/* Title */}
            <h3 className="text-xl font-extrabold text-[var(--text)] mb-5 px-1">{title}</h3>

            {/* Sheet Content */}
            <div className="px-1 text-sm text-[var(--text)]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
