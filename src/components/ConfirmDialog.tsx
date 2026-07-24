/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  icon?: string;
  confirmStyle?: 'danger' | 'primary';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  icon = '⚠️',
  confirmStyle = 'danger'
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-xs overflow-hidden rounded-2xl bg-[var(--surface)] p-6 text-center shadow-2xl border border-[var(--border)] z-10"
          >
            <div className="text-4xl mb-3">{icon}</div>
            <h3 className="text-lg font-bold text-[var(--text)] mb-2">{title}</h3>
            <p className="text-xs text-[var(--text2)] leading-relaxed mb-6">{message}</p>
            
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-[var(--text2)] bg-[var(--surface2)] hover:bg-[var(--surface3)] border border-[var(--border)] active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white active:scale-95 transition-transform ${
                  confirmStyle === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20'
                    : 'bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/20'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
