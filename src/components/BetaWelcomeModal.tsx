import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X } from 'lucide-react';

interface BetaWelcomeModalProps {
  theme: 'zinc' | 'slate' | 'stone' | 'indigo';
}

export default function BetaWelcomeModal({ theme }: BetaWelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('pdf-vault-beta-welcome-seen');
    if (!hasSeen) {
      setIsOpen(true);
      localStorage.setItem('pdf-vault-beta-welcome-seen', 'true');
    }
  }, []);

  if (!isOpen) return null;

  const currentTheme = {
    zinc: { bg: 'bg-white', text: 'text-zinc-900', border: 'border-zinc-200', textMuted: 'text-zinc-500' },
    slate: { bg: 'bg-slate-900', text: 'text-slate-100', border: 'border-slate-800', textMuted: 'text-slate-400' },
    stone: { bg: 'bg-white', text: 'text-stone-900', border: 'border-stone-200', textMuted: 'text-stone-500' },
    indigo: { bg: 'bg-white', text: 'text-indigo-900', border: 'border-indigo-100', textMuted: 'text-indigo-500' },
  }[theme];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`w-full max-w-md ${currentTheme.bg} rounded-2xl shadow-2xl overflow-hidden border ${currentTheme.border}`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${theme === 'slate' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                  <Info className="w-6 h-6" />
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-2 rounded-lg hover:bg-black/5 transition-colors ${currentTheme.textMuted}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h2 className={`text-xl font-bold ${currentTheme.text} mb-2`}>
                Welcome to PDF Vault Beta!
              </h2>
              <p className={`text-sm ${currentTheme.textMuted} leading-relaxed mb-6`}>
                You are experiencing an early access Beta version of PDF Vault. We are still actively developing features and refining the experience. 
                <br /><br />
                If you encounter any bugs or have feature requests, please let us know using the <strong>Feedback</strong> button in the top navigation.
              </p>
              
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
              >
                Got it, let's explore!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
