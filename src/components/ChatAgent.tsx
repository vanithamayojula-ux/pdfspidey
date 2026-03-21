import React from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleAiRequest } from '../services/aiService';

import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAgentProps {
  theme?: 'zinc' | 'slate' | 'stone' | 'indigo';
}

export default function ChatAgent({ theme = 'zinc' }: ChatAgentProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([
    { role: 'assistant', content: '👋 **Hi there!** I\'m your powerful and friendly **PDF Vault Assistant**. \n\nI\'m here to help you organize your documents, solve problems, or even teach you something new! How can I make your day more productive? 🚀' }
  ]);
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const aiResponse = await handleAiRequest(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse || 'I encountered an issue processing that request.' }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop for closing when clicking outside */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/5 z-40"
          />
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-zinc-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              className="relative"
            >
              <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-24 right-6 w-[calc(100vw-3rem)] sm:w-[400px] h-[min(600px,calc(100vh-8rem))] ${
              theme === 'slate' ? 'bg-slate-900 border-slate-700' : 'bg-white border-zinc-200'
            } rounded-3xl shadow-2xl border flex flex-col overflow-hidden z-50 transition-colors duration-300`}
          >
            {/* Header */}
            <div className={`p-4 border-b ${theme === 'slate' ? 'border-slate-800 bg-slate-950' : 'border-zinc-100 bg-zinc-900'} text-white flex items-center justify-between transition-colors duration-300`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Vault Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className={`flex-1 overflow-y-auto p-4 space-y-4 ${theme === 'slate' ? 'bg-slate-900/50' : 'bg-zinc-50/50'}`}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? (theme === 'slate' ? 'bg-slate-700 text-white rounded-tr-none' : 'bg-zinc-900 text-white rounded-tr-none')
                        : (theme === 'slate' ? 'bg-slate-800 border-slate-700 text-slate-100 rounded-tl-none shadow-sm' : 'bg-white border border-zinc-200 text-zinc-900 rounded-tl-none shadow-sm')
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="markdown-content prose prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className={`p-3 rounded-2xl rounded-tl-none shadow-sm ${theme === 'slate' ? 'bg-slate-800 border-slate-700' : 'bg-white border border-zinc-200'}`}>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className={`p-4 border-t ${theme === 'slate' ? 'border-slate-800 bg-slate-950' : 'border-zinc-100 bg-white'} transition-colors duration-300`}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className={`w-full pl-4 pr-12 py-3 border-none rounded-2xl text-sm focus:ring-2 transition-all ${
                    theme === 'slate' 
                      ? 'bg-slate-800 text-white placeholder-slate-500 focus:ring-slate-700' 
                      : 'bg-zinc-100 text-zinc-900 placeholder-zinc-400 focus:ring-zinc-900/5'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl disabled:opacity-50 transition-colors ${
                    theme === 'slate' ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 text-center mt-3">
                Powered by Gemini AI • Can manage folders and categories
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
