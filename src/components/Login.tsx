import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Shield, FileText, Sparkles, UserCircle, Phone, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { signInWithGoogle, signInAsGuest, auth, RecaptchaVerifier, signInWithPhoneNumber } from '../firebase';
import { ConfirmationResult } from 'firebase/auth';

interface LoginProps {
  theme?: 'zinc' | 'slate' | 'stone' | 'indigo';
}

export default function Login({ theme = 'zinc' }: LoginProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGuestLoading, setIsGuestLoading] = React.useState(false);
  const [isPhoneLoading, setIsPhoneLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const [showPhoneInput, setShowPhoneInput] = React.useState(false);
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [verificationCode, setVerificationCode] = React.useState('');
  const [confirmationResult, setConfirmationResult] = React.useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = React.useState<RecaptchaVerifier | null>(null);

  const setupRecaptcha = () => {
    if (!recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('Recaptcha resolved');
        }
      });
      setRecaptchaVerifier(verifier);
      return verifier;
    }
    return recaptchaVerifier;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;

    setIsPhoneLoading(true);
    setError(null);
    try {
      const verifier = setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(result);
    } catch (err: any) {
      console.error('Phone sign-in error:', err);
      if (err.code === 'auth/admin-restricted-operation') {
        setError('⚠️ Security Restriction: Phone authentication or user creation is disabled in your Firebase Console. Please enable "Phone" in Sign-in methods and check "Enable create" in Settings > User actions.');
      } else {
        setError(err.message || 'Failed to send verification code. Check number format (e.g., +1234567890).');
      }
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        setRecaptchaVerifier(null);
      }
    } finally {
      setIsPhoneLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || !confirmationResult) return;

    setIsPhoneLoading(true);
    setError(null);
    try {
      await confirmationResult.confirm(verificationCode);
    } catch (err: any) {
      console.error('Code verification error:', err);
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsPhoneLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    console.log('Attempting guest login...');
    setIsGuestLoading(true);
    setError(null);
    try {
      const result = await signInAsGuest();
      console.log('Guest login successful:', result.user.uid);
    } catch (err: any) {
      console.error('Guest login error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Guest login (Anonymous Authentication) is not enabled in the Firebase Console. Please enable it in the Authentication settings.');
      } else if (err.code === 'auth/admin-restricted-operation') {
        setError('⚠️ Security Restriction: New user creation is disabled in your Firebase Console. To fix this: Go to Authentication > Settings > User actions and check "Enable create (sign-up)".');
      } else {
        setError(err.message || 'Failed to sign in as guest. Please try again.');
      }
    } finally {
      setIsGuestLoading(false);
    }
  };

  const themeClasses = {
    zinc: 'bg-zinc-950 text-zinc-100',
    slate: 'bg-slate-950 text-slate-100',
    stone: 'bg-stone-950 text-stone-100',
    indigo: 'bg-indigo-950 text-indigo-100',
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${themeClasses[theme]}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-20 ${
          theme === 'indigo' ? 'bg-indigo-500' : 'bg-zinc-500'
        }`} />
        <div className={`absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20 ${
          theme === 'indigo' ? 'bg-indigo-500' : 'bg-zinc-500'
        }`} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative w-full max-w-md p-8 rounded-3xl border shadow-2xl backdrop-blur-xl ${
          theme === 'slate' ? 'bg-slate-900/50 border-slate-800' : 'bg-white/5 border-zinc-800'
        }`}
      >
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className={`p-4 rounded-2xl ${
              theme === 'indigo' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-100/10 text-zinc-100'
            }`}>
              <Shield className="w-12 h-12" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">PDF Vault</h1>
            <p className="text-zinc-400 text-sm">
              Your intelligent, student-friendly university exam preparation AI.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 py-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Secure Storage</p>
                <p className="text-xs text-zinc-500">Organize your study materials</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">AI Enhancement</p>
                <p className="text-xs text-zinc-500">Exam-ready answers from your PDFs</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div id="recaptcha-container"></div>

          <AnimatePresence mode="wait">
            {!showPhoneInput ? (
              <motion.div
                key="main-options"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                <button
                  onClick={handleLogin}
                  disabled={isLoading || isGuestLoading || isPhoneLoading}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-xl ${
                    theme === 'indigo'
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40'
                      : 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-zinc-950/40'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Sign in with Google
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowPhoneInput(true)}
                  disabled={isLoading || isGuestLoading || isPhoneLoading}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 border ${
                    theme === 'slate'
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Phone className="w-5 h-5" />
                  Sign in with Phone
                </button>

                <button
                  onClick={handleGuestLogin}
                  disabled={isLoading || isGuestLoading || isPhoneLoading}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 border ${
                    theme === 'slate'
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isGuestLoading ? (
                    <div className={`w-5 h-5 border-2 ${theme === 'slate' ? 'border-slate-700 border-t-slate-300' : 'border-zinc-800 border-t-zinc-400'} rounded-full animate-spin`} />
                  ) : (
                    <>
                      <UserCircle className="w-5 h-5" />
                      Continue as Guest
                    </>
                  )}
                </button>
              </motion.div>
            ) : !confirmationResult ? (
              <motion.div
                key="phone-input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <button 
                    onClick={() => setShowPhoneInput(false)}
                    className="p-2 rounded-lg hover:bg-white/5 text-zinc-400"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <span className="font-semibold">Phone Authentication</span>
                </div>
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-white/5 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      required
                    />
                    <p className="text-[10px] text-zinc-500 px-1">
                      Include country code (e.g., +91 for India)
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isPhoneLoading}
                    className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-xl ${
                      theme === 'indigo'
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-white text-zinc-950 hover:bg-zinc-200'
                    } disabled:opacity-50`}
                  >
                    {isPhoneLoading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Send Verification Code'
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp-input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <button 
                    onClick={() => setConfirmationResult(null)}
                    className="p-2 rounded-lg hover:bg-white/5 text-zinc-400"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <span className="font-semibold">Verify Code</span>
                </div>
                <form onSubmit={handleCodeSubmit} className="space-y-4">
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full bg-white/5 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-center tracking-[0.5em] font-mono"
                      maxLength={6}
                      required
                    />
                    <p className="text-[10px] text-zinc-500 px-1 text-center">
                      Enter the 6-digit code sent to {phoneNumber}
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isPhoneLoading}
                    className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-xl ${
                      theme === 'indigo'
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-white text-zinc-950 hover:bg-zinc-200'
                    } disabled:opacity-50`}
                  >
                    {isPhoneLoading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Verify & Sign In
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
            Strictly for University Exam Preparation
          </p>
        </div>
      </motion.div>
    </div>
  );
}
