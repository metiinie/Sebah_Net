import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Music, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePageNavigation } from '../hooks/usePageNavigation';
import { useLoading } from '../hooks/useLoading';
import { handleError } from '../lib/errorHandler';
import toast from 'react-hot-toast';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { loading, startLoading, stopLoading } = useLoading(false);
  const { signIn, signUp } = useAuth();
  const { goToChoice } = usePageNavigation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email and password are required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    startLoading();

    try {
      if (isLogin) {
        await signIn(email, password);
        goToChoice();
      } else {
        await signUp(email, password);
        // stay on page or redirect? 
        // If email confirmation is off, it might auto-login.
        // If it returns success, we can try to redirect if session exists.
      }
    } catch (error: any) {
      // The "email already exists" error will be caught here
      handleError(error, isLogin ? 'Login' : 'Signup');
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex items-center justify-center p-4">
      {/* Background Blobs for Modern Look */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[1000px] grid lg:grid-cols-2 gap-0 overflow-hidden bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-slate-700/50 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]"
      >
        {/* Left Side: Visual/Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 border-r border-slate-700/50 relative">
          <div className="relative z-10">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                <Film className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                MediaStream
              </h1>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <h2 className="text-5xl font-bold leading-tight text-white">
                Stream everything, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">anywhere.</span>
              </h2>
              <p className="text-slate-400 text-xl leading-relaxed max-w-sm">
                Join our community and enjoy premium movies and music in one place.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-6 relative z-10"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Join <span className="text-white">10,000+</span> happy streamers
            </p>
          </motion.div>

          {/* Decorative shapes */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/20 rounded-full animate-[ping_3s_linear_infinite]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/10 rounded-full" />
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Welcome back' : 'Get started'}
            </h2>
            <p className="text-slate-400">
              {isLogin ? 'Enter your details to access your account' : 'Create an account to start your journey'}
            </p>
          </div>

          {/* Form Switcher */}
          <div className="flex p-1 bg-slate-800/50 rounded-2xl mb-8 border border-slate-700/50">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${isLogin ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
            >
              <Lock className="w-4 h-4" />
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${!isLogin ? 'bg-pink-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
            >
              <Sparkles className="w-4 h-4" />
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-800/30 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-slate-300">Password</label>
                {isLogin && (
                  <button type="button" className="text-xs text-cyan-400 hover:underline">Forgot?</button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-slate-800/30 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-[10px] text-slate-500 ml-1">Must be at least 8 characters</p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.01, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all ${isLogin
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-900/20'
                : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-pink-900/20'
                } disabled:opacity-50 disabled:cursor-not-allowed text-white mt-4`}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Verification indicator for signup */}
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-start gap-3"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400">
                  By signing up, you agree to our Terms of Service and Privacy Policy. Securely hosted by Supabase.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-8 text-center text-slate-400">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-white hover:text-cyan-400 font-bold transition-colors underline decoration-cyan-500/30 underline-offset-4"
            >
              {isLogin ? 'Sign up for free' : 'Login now'}
            </button>
          </p>
        </div>
      </motion.div>

      {/* Demo helper */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 text-slate-600 text-[10px] uppercase tracking-widest font-bold"
      >
        Secure • Fast • Encrypted
      </motion.div>
    </div>
  );
};
