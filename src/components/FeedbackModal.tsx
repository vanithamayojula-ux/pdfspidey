import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, CheckCircle2 } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'zinc' | 'slate' | 'stone' | 'indigo';
}

export default function FeedbackModal({ isOpen, onClose, theme }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'other'>('bug');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const currentTheme = {
    zinc: { bg: 'bg-white', text: 'text-zinc-900', border: 'border-zinc-200', textMuted: 'text-zinc-500', inputBg: 'bg-zinc-50', inputBorder: 'border-zinc-200' },
    slate: { bg: 'bg-slate-900', text: 'text-slate-100', border: 'border-slate-800', textMuted: 'text-slate-400', inputBg: 'bg-slate-800', inputBorder: 'border-slate-700' },
    stone: { bg: 'bg-white', text: 'text-stone-900', border: 'border-stone-200', textMuted: 'text-stone-500', inputBg: 'bg-stone-50', inputBorder: 'border-stone-200' },
    indigo: { bg: 'bg-white', text: 'text-indigo-900', border: 'border-indigo-100', textMuted: 'text-indigo-500', inputBg: 'bg-indigo-50/50', inputBorder: 'border-indigo-100' },
  }[theme];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    // Simulate network request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        setIsSuccess(false);
        setMessage('');
        onClose();
      }, 2000);
    }, 1000);
  };

  if (!isOpen) return null;

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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${theme === 'slate' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h2 className={`text-xl font-bold ${currentTheme.text}`}>Send Feedback</h2>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg hover:bg-black/5 transition-colors ${currentTheme.textMuted}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className={`text-lg font-bold ${currentTheme.text} mb-2`}>Thank You!</h3>
                  <p className={`text-sm ${currentTheme.textMuted}`}>Your feedback helps us improve PDF Vault.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className={`block text-xs font-semibold ${currentTheme.textMuted} uppercase tracking-wider mb-2`}>
                      Feedback Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['bug', 'feature', 'other'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFeedbackType(type)}
                          className={`py-2 px-3 rounded-xl text-sm font-medium transition-all border ${
                            feedbackType === type
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : `${currentTheme.inputBg} ${currentTheme.text} ${currentTheme.inputBorder} hover:border-indigo-400`
                          }`}
                        >
                          {type === 'bug' ? 'Bug' : type === 'feature' ? 'Feature' : 'Other'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-semibold ${currentTheme.textMuted} uppercase tracking-wider mb-2`}>
                      Your Thoughts
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you love, what's broken, or what you'd like to see..."
                      className={`w-full h-32 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none ${currentTheme.inputBg} ${currentTheme.text} ${currentTheme.inputBorder} border`}
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Feedback
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
