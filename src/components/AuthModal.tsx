import React, { useState } from 'react';
import { Lock, Mail, User, Briefcase, Building, Eye, EyeOff, X, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { RiskoraLogo } from './RiskoraLogo';
import { authApi } from '../services/api';
import { signInWithGoogle } from '../services/firebase';
import { UserProfile } from '../types/fraud';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      const profile: UserProfile = {
        id: fbUser.uid,
        name: fbUser.displayName || 'SOC Intelligence Officer',
        email: fbUser.email || '',
        title: 'Senior Fraud Operations Lead',
        organization: 'Riskora Autonomous SOC Unit',
        sessionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        token: `fb_token_${fbUser.uid}`
      };
      onSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setError(err.message || 'Google Sign-in was cancelled or failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const { user } = await authApi.login(email, password);
        onSuccess(user);
        onClose();
      } else {
        if (!name.trim()) throw new Error('Full Name is required');
        const { user } = await authApi.signup(name, email, password, title, organization);
        onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const { user } = await authApi.login(demoEmail, demoPass);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#0e0e0e] shadow-[0_0_50px_rgba(229,9,20,0.15)] overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 sm:p-8 space-y-5">
          {/* Brand Header - Riskora Logo */}
          <div className="flex justify-center pb-1">
            <RiskoraLogo 
              size="large" 
              layout="stacked" 
              subtitle="intelligent risk detection"
            />
          </div>

          {/* Firebase Google Sign In Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs shadow-md transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
            >
              {googleLoading ? (
                <div className="h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{googleLoading ? 'Connecting to Google...' : 'Sign in with Google (Firebase)'}</span>
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-400/90 font-mono">
              <ShieldCheck className="h-3 w-3" />
              <span>Firebase Auth & Firestore Persistent Storage</span>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#0e0e0e] px-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
              or credentials
            </span>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); }}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                tab === 'login' 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('signup'); setError(null); }}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                tab === 'signup' 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {tab === 'signup' && (
              <>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Job Title</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Lead Analyst"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Organization</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        value={organization}
                        onChange={e => setOrganization(e.target.value)}
                        placeholder="Acme Financial"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-300 font-medium mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="analyst@fraudshield.internal"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(229,9,20,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <span>{tab === 'login' ? 'Authenticate Session' : 'Create SOC Account'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins for effortless testing */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="text-[10px] font-mono uppercase text-slate-500 font-semibold">
              Instant Demo Access (1-Click)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('analyst@fraudshield.internal', 'analyst123')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left text-slate-300 hover:text-white transition-all group"
              >
                <div className="font-bold text-[11px] text-white group-hover:text-red-400">Lead Analyst</div>
                <div className="text-[9px] text-slate-500 font-mono">Jane Doe</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@fraudshield.internal', 'admin123')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left text-slate-300 hover:text-white transition-all group"
              >
                <div className="font-bold text-[11px] text-white group-hover:text-red-400">SOC Engineer</div>
                <div className="text-[9px] text-slate-500 font-mono">Alan Turing</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
