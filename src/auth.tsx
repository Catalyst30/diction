import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { COUNTRIES } from './countries';
import { taxFor, hasRate } from './taxRates';
import { ThemeToggle } from './WalletPanel';
import {
  Shield,
  Mail,
  Lock,
  User,
  Calendar,
  Briefcase,
  Globe,
  Wallet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  ChevronRight,
  Coins
} from 'lucide-react';

const metaEnv = (import.meta as any).env || {};
const url = metaEnv.VITE_SUPABASE_URL as string | undefined;
const anon = metaEnv.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase = url && anon ? createClient(url, anon) : null;

if (supabase && typeof window !== 'undefined') {
  const orig = window.fetch.bind(window);
  window.fetch = async (input: any, init: any = {}) => {
    const u = typeof input === 'string' ? input : input?.url || '';
    if (u.startsWith('/api/')) {
      const { data } = await supabase.auth.getSession();
      const t = data.session?.access_token;
      if (t) {
        const h = new Headers(init.headers || {});
        h.set('Authorization', `Bearer ${t}`);
        init = { ...init, headers: h };
      }
    }
    return orig(input, init);
  };
}

export type Profile = {
  name: string;
  country: string;
  gender: string;
  age: number;
  work: string;
  taxRate: number;
  email: string;
  targetPaycheck?: number;
  walletAddress?: string;
};

const Ctx = createContext<Profile | null>(null);
export const useProfile = () => useContext(Ctx);

export const signOut = async () => {
  if (supabase) {
    await supabase.auth.signOut();
  }
  try {
    localStorage.removeItem('diction_demo_profile');
  } catch {}
  window.location.reload();
};

const POPULAR_WORK_TAGS = [
  'UI/UX Designer',
  'Frontend Developer',
  'Web3 / Sui Dev',
  'Motion Designer',
  'Copywriter',
  '3D Artist',
  'Content Creator'
];

function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-600 shadow-md shadow-indigo-600/30">
        <Shield className="size-6 text-white" />
      </span>
      <div className="flex flex-col">
        <span
          className={`text-2xl font-black tracking-tight ${
            onDark ? 'text-white' : 'text-slate-900 dark:text-white'
          }`}
        >
          Diction
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-widest ${
            onDark ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'
          }`}
        >
          Freelancer Financial OS
        </span>
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<'in' | 'up'>('up');

  // Step state for signup: 1: Account, 2: Work Profile, 3: Sui Wallet
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');

  // Step 1: Account Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [parent, setParent] = useState(false);

  // Step 2: Work Profile
  const [country, setCountry] = useState('United States');
  const [gender, setGender] = useState('Prefer not to say');
  const [work, setWork] = useState('');
  const [targetPaycheck, setTargetPaycheck] = useState('3500');

  // Step 3: Sui Wallet Connection
  const [suiWallets, setSuiWallets] = useState<any[]>([]);
  const [connectedSuiAddress, setConnectedSuiAddress] = useState<string>('');
  const [manualSuiAddress, setManualSuiAddress] = useState<string>('');
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);

  // Status & Feedback
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  // Initialize Auth & Detect Sui Wallets
  useEffect(() => {
    // Check local demo profile
    try {
      const demoSaved = localStorage.getItem('diction_demo_profile');
      if (demoSaved) {
        setUser(JSON.parse(demoSaved));
      }
    } catch {}

    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          setUser(data.session.user);
        }
        setReady(true);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        if (s?.user) setUser(s.user);
      });
      return () => sub.subscription.unsubscribe();
    } else {
      setReady(true);
    }
  }, []);

  // Detect Sui Wallets Standard
  useEffect(() => {
    import('@mysten/wallet-standard')
      .then((m) => {
        const api = m.getWallets();
        const find = () => {
          const list = api
            .get()
            .filter(
              (w: any) =>
                w.features['standard:connect'] &&
                Object.keys(w.features).some((k) => k.startsWith('sui:'))
            );
          setSuiWallets(list);
        };
        find();
        api.on('register', find);
      })
      .catch(() => {});
  }, []);

  // Connect Sui Wallet Extension
  const handleConnectSuiExtension = async (walletInstance: any) => {
    setIsWalletConnecting(true);
    setError('');
    try {
      const res = await walletInstance.features['standard:connect'].connect();
      if (res.accounts && res.accounts.length > 0) {
        const addr = res.accounts[0].address;
        setConnectedSuiAddress(addr);
      }
    } catch (err: any) {
      setError('Could not connect Sui wallet: ' + (err?.message || 'Cancelled by user'));
    } finally {
      setIsWalletConnecting(false);
    }
  };

  // Step 1 Validation -> Proceed to Step 2
  const handleContinueToStep2 = () => {
    setError('');
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return setError('Please enter a valid email address.');
    }
    if (password.length < 8) {
      return setError('Please choose a password with at least 8 characters.');
    }
    if (!name.trim()) {
      return setError('Please enter your full name or nickname.');
    }
    const a = Number(age);
    if (!Number.isFinite(a) || a < 13 || a > 120) {
      return setError('Diction is designed for individuals aged 13 and above.');
    }
    if (a < 18 && !parent) {
      return setError('Please confirm that a parent or guardian knows you are using Diction.');
    }

    setSlideDirection('forward');
    setStep(2);
  };

  // Step 2 Validation -> Proceed to Step 3
  const handleContinueToStep3 = () => {
    setError('');
    if (!work.trim()) {
      return setError('Please share the work you do or select one from the suggestions below.');
    }
    if (!country) {
      return setError('Please choose your country for accurate tax estimation.');
    }

    setSlideDirection('forward');
    setStep(3);
  };

  // Go Back a Step
  const handleGoBack = (targetStep: 1 | 2) => {
    setError('');
    setSlideDirection('backward');
    setStep(targetStep);
  };

  // Final Signup Submission
  const handleFinalSignup = async (skipWallet = false) => {
    setError('');
    setInfo('');
    setBusy(true);

    const a = Number(age) || 20;
    const effectiveWallet = !skipWallet
      ? connectedSuiAddress || manualSuiAddress.trim()
      : '';

    // If wallet provided, save to localStorage diction_wallets
    if (effectiveWallet) {
      try {
        const existingWallets = JSON.parse(localStorage.getItem('diction_wallets') || '[]');
        if (!existingWallets.some((w: any) => w.address === effectiveWallet)) {
          existingWallets.push({ type: 'Sui', address: effectiveWallet });
          localStorage.setItem('diction_wallets', JSON.stringify(existingWallets));
        }
      } catch {}
    }

    const calculatedTaxRate = taxFor(country);
    const paycheckTargetNum = Number(targetPaycheck) || 3500;

    const metadata = {
      name: name.trim(),
      country,
      gender,
      age: a,
      work: work.trim(),
      taxRate: calculatedTaxRate,
      targetPaycheck: paycheckTargetNum,
      walletAddress: effectiveWallet
    };

    if (supabase) {
      const res = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: metadata }
      });
      setBusy(false);
      if (res.error) {
        return setError(res.error.message);
      }
      if (!res.data.session) {
        setInfo('Account created! Please check your email to confirm, then sign in.');
        setMode('in');
        setStep(1);
        return;
      }
      setUser(res.data.session.user);
    } else {
      // Demo / fallback mode for local development
      setTimeout(() => {
        const demoUser = {
          id: 'demo_' + Date.now(),
          email: email.trim(),
          user_metadata: metadata
        };
        try {
          localStorage.setItem('diction_demo_profile', JSON.stringify(demoUser));
        } catch {}
        setUser(demoUser);
        setBusy(false);
      }, 500);
    }
  };

  // Sign In Submission
  const handleSignIn = async () => {
    setError('');
    setInfo('');
    if (!email.trim() || !password) {
      return setError('Please enter both email and password.');
    }
    setBusy(true);

    if (supabase) {
      const res = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (res.error) {
        return setError(res.error.message);
      }
      setUser(res.data.user);
    } else {
      // Local fallback sign-in
      setTimeout(() => {
        const demoUser = {
          id: 'demo_' + Date.now(),
          email: email.trim(),
          user_metadata: {
            name: email.split('@')[0],
            country: 'United States',
            gender: 'Prefer not to say',
            age: 25,
            work: 'Freelancer',
            taxRate: 25,
            targetPaycheck: 3500
          }
        };
        try {
          localStorage.setItem('diction_demo_profile', JSON.stringify(demoUser));
        } catch {}
        setUser(demoUser);
        setBusy(false);
      }, 400);
    }
  };

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s += 1;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) s += 1;
    return s;
  };
  const pwStrength = getPasswordStrength();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Loading Diction...</p>
        </div>
      </div>
    );
  }

  // Not signed in: Render Modern 3-Stage Signup / Sign-in
  if (!user) {
    const under18 = mode === 'up' && step === 1 && Number(age) >= 13 && Number(age) < 18;

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
        {/* Mobile Header */}
        <header className="lg:hidden border-b border-slate-200/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3.5 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Stepper Bar for Sign Up */}
          {mode === 'up' && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  Stage {step} of 3:
                </span>
                <span>
                  {step === 1 && 'Account Credentials'}
                  {step === 2 && 'Work & Taxes'}
                  {step === 3 && 'Sui Wallet'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>
          )}
        </header>

        {/* Main Grid: Desktop Split vs Mobile Card */}
        <main className="flex-1 grid lg:grid-cols-12 max-w-7xl w-full mx-auto">
          {/* Left Branded Showcase Panel (Desktop) */}
          <aside
            className="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 xl:p-14 text-white relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)'
            }}
          >
            {/* Ambient Lighting Orbs */}
            <div className="absolute -top-24 -left-24 size-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 size-80 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <Logo onDark />
                <ThemeToggle />
              </div>

              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/15">
                  <Sparkles className="size-3.5 text-indigo-300" />
                  <span>Fintech for Freelancers & Web3</span>
                </div>
                <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight">
                  Earn, budget, & spend without going broke.
                </h1>
                <p className="text-base text-indigo-100/90 leading-relaxed font-normal">
                  Diction auto-quarantines taxes, covers upcoming bills, and shields your income with non-custodial Sui wallet intelligence.
                </p>
              </div>

              {/* Desktop 3-Stage Interactive Stepper */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  Onboarding Stages
                </p>

                {/* Step 1 Card */}
                <div
                  className={`flex items-center gap-4 rounded-2xl p-4 transition-all duration-300 border ${
                    step === 1 && mode === 'up'
                      ? 'bg-white text-slate-900 border-white shadow-xl shadow-black/10'
                      : step > 1 && mode === 'up'
                      ? 'bg-white/15 text-white border-white/20'
                      : 'bg-white/5 text-indigo-200 border-white/10'
                  }`}
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-black transition-colors ${
                      step === 1 && mode === 'up'
                        ? 'bg-indigo-600 text-white'
                        : step > 1 && mode === 'up'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {step > 1 && mode === 'up' ? <Check className="size-5" /> : '1'}
                  </span>
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        step === 1 && mode === 'up'
                          ? 'text-slate-900'
                          : 'text-white'
                      }`}
                    >
                      Create your account
                    </p>
                    <p
                      className={`text-xs ${
                        step === 1 && mode === 'up'
                          ? 'text-slate-500'
                          : 'text-indigo-200'
                      }`}
                    >
                      {step > 1 && mode === 'up'
                        ? `Saved as ${email || 'Verified'}`
                        : 'Your email, secure password & basic info'}
                    </p>
                  </div>
                </div>

                {/* Step 2 Card */}
                <div
                  className={`flex items-center gap-4 rounded-2xl p-4 transition-all duration-300 border ${
                    step === 2 && mode === 'up'
                      ? 'bg-white text-slate-900 border-white shadow-xl shadow-black/10'
                      : step > 2 && mode === 'up'
                      ? 'bg-white/15 text-white border-white/20'
                      : 'bg-white/5 text-indigo-200 border-white/10'
                  }`}
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-black transition-colors ${
                      step === 2 && mode === 'up'
                        ? 'bg-indigo-600 text-white'
                        : step > 2 && mode === 'up'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {step > 2 && mode === 'up' ? <Check className="size-5" /> : '2'}
                  </span>
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        step === 2 && mode === 'up'
                          ? 'text-slate-900'
                          : 'text-white'
                      }`}
                    >
                      Tell us about your work
                    </p>
                    <p
                      className={`text-xs ${
                        step === 2 && mode === 'up'
                          ? 'text-slate-500'
                          : 'text-indigo-200'
                      }`}
                    >
                      {step > 2 && mode === 'up'
                        ? `${work || 'Profession'} · ${taxFor(country)}% Tax`
                        : 'Niche, country tax rates & monthly target'}
                    </p>
                  </div>
                </div>

                {/* Step 3 Card */}
                <div
                  className={`flex items-center gap-4 rounded-2xl p-4 transition-all duration-300 border ${
                    step === 3 && mode === 'up'
                      ? 'bg-white text-slate-900 border-white shadow-xl shadow-black/10'
                      : 'bg-white/5 text-indigo-200 border-white/10'
                  }`}
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-black transition-colors ${
                      step === 3 && mode === 'up'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    3
                  </span>
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        step === 3 && mode === 'up'
                          ? 'text-slate-900'
                          : 'text-white'
                      }`}
                    >
                      Connect your Sui wallet
                    </p>
                    <p
                      className={`text-xs ${
                        step === 3 && mode === 'up'
                          ? 'text-slate-500'
                          : 'text-indigo-200'
                      }`}
                    >
                      {connectedSuiAddress
                        ? `${connectedSuiAddress.slice(0, 6)}...${connectedSuiAddress.slice(-4)}`
                        : 'Watch balances and real-time on-chain feeds'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Bottom Insight */}
            <div className="relative z-10 pt-6">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/15">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-300 shrink-0">
                    <Shield className="size-4" />
                  </div>
                  <p className="text-xs text-indigo-100 font-medium">
                    {step === 1 &&
                      'Zero-custody security: Your private keys never touch Diction servers.'}
                    {step === 2 &&
                      `Instant Tax Quarantine: Automates a ${taxFor(country)}% reserve from incoming payments.`}
                    {step === 3 &&
                      'Sui Network Ready: Monitor live Sui coins, staking, and safe-to-spend on-chain.'}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Form Container (Desktop & Mobile) */}
          <section className="lg:col-span-7 flex flex-col justify-center px-4 py-8 sm:px-10 lg:px-12 xl:px-16">
            <div className="w-full max-w-lg mx-auto">
              {/* Mode Toggle Header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {mode === 'up' ? (
                      step === 1 ? 'Create your account' : step === 2 ? 'Tell us about your work' : 'Connect your Sui wallet'
                    ) : (
                      'Welcome back'
                    )}
                  </h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                    {mode === 'up'
                      ? step === 1
                        ? 'Step 1 of 3: Enter your details to get started'
                        : step === 2
                        ? 'Step 2 of 3: Tailor Diction to your freelance niche'
                        : 'Step 3 of 3: Link your wallet or skip for later'
                      : 'Log in to access your safe-to-spend dashboard'}
                  </p>
                </div>

                {/* Desktop Mini Step Indicator */}
                {mode === 'up' && (
                  <span className="hidden sm:inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 px-3 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Stage {step} / 3
                  </span>
                )}
              </div>

              {/* Error & Info Banners */}
              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 p-4 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-sm font-medium">
                  <AlertCircle className="size-5 shrink-0 mt-0.5 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {info && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-4 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                  <CheckCircle2 className="size-5 shrink-0 mt-0.5 text-emerald-500" />
                  <span>{info}</span>
                </div>
              )}

              {/* ============================================================== */}
              {/* SIGN UP: 3-STAGE FLOW WITH SLIDE TRANSITIONS */}
              {/* ============================================================== */}
              {mode === 'up' ? (
                <div className="space-y-6">
                  {/* STAGE 1: ACCOUNT CREDENTIALS */}
                  {step === 1 && (
                    <div
                      className={`space-y-5 ${
                        slideDirection === 'forward'
                          ? 'animate-slide-in-right'
                          : 'animate-slide-in-left'
                      }`}
                    >
                      {/* Email Field */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                          <input
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-base font-medium text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 min-h-[52px]"
                          />
                        </div>
                      </div>

                      {/* Password Field */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Password
                          </label>
                          <span className="text-xs text-slate-400">At least 8 characters</span>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 py-3.5 text-base font-medium text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 min-h-[52px]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            aria-label="Toggle password view"
                          >
                            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                          </button>
                        </div>

                        {/* Password Strength Meter */}
                        {password.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="flex gap-1.5 h-1.5">
                              <div
                                className={`flex-1 rounded-full transition-all ${
                                  pwStrength >= 1
                                    ? pwStrength === 1
                                      ? 'bg-rose-500'
                                      : pwStrength === 2
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                    : 'bg-slate-200 dark:bg-slate-800'
                                }`}
                              />
                              <div
                                className={`flex-1 rounded-full transition-all ${
                                  pwStrength >= 2
                                    ? pwStrength === 2
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                    : 'bg-slate-200 dark:bg-slate-800'
                                }`}
                              />
                              <div
                                className={`flex-1 rounded-full transition-all ${
                                  pwStrength >= 3 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                                }`}
                              />
                            </div>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              {pwStrength === 1 && 'Weak password'}
                              {pwStrength === 2 && 'Good password'}
                              {pwStrength >= 3 && 'Strong password'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Name & Age Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Your Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Alex Rivers"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-base font-medium text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 min-h-[52px]"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Age
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                            <input
                              type="number"
                              min={13}
                              max={120}
                              placeholder="25"
                              value={age}
                              onChange={(e) => setAge(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-base font-medium text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 min-h-[52px]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Under 18 Consent */}
                      {under18 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 space-y-2">
                          <p className="font-semibold">
                            You are under 18. Please consult a parent or guardian before making independent financial decisions.
                          </p>
                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={parent}
                              onChange={(e) => setParent(e.target.checked)}
                              className="mt-0.5 size-4 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="font-medium">
                              A parent or guardian knows and approves of my Diction setup.
                            </span>
                          </label>
                        </div>
                      )}

                      {/* Stage 1 CTA Button */}
                      <button
                        type="button"
                        onClick={handleContinueToStep2}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 px-6 text-base font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.99] transition-all min-h-[54px]"
                      >
                        <span>Continue to Work Profile</span>
                        <ArrowRight className="size-5" />
                      </button>
                    </div>
                  )}

                  {/* ========================================================== */}
                  {/* STAGE 2: TELL US ABOUT YOUR WORK */}
                  {/* ========================================================== */}
                  {step === 2 && (
                    <div
                      className={`space-y-5 ${
                        slideDirection === 'forward'
                          ? 'animate-slide-in-right'
                          : 'animate-slide-in-left'
                      }`}
                    >
                      {/* Work / Profession */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          The Work You Do
                        </label>
                        <div className="relative">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="e.g. Motion Designer, UI/UX Designer"
                            value={work}
                            onChange={(e) => setWork(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-base font-medium text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 min-h-[52px]"
                          />
                        </div>

                        {/* Quick Suggestion Pills */}
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {POPULAR_WORK_TAGS.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setWork(tag)}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                                work === tag
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Country & Auto Tax Estimation */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Country of Residence
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                          <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-10 py-3.5 text-base font-medium text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 min-h-[52px] appearance-none"
                          >
                            <option value="">Select your country</option>
                            {COUNTRIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 rotate-90 pointer-events-none" />
                        </div>

                        {country && (
                          <div className="flex items-center gap-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30">
                            <Sparkles className="size-3.5 text-indigo-500 shrink-0" />
                            <span>
                              Estimated tax for <b>{country}</b>: <b>{taxFor(country)}%</b>
                              {hasRate(country) ? ' (regional benchmark)' : ' (standard freelance baseline)'}. Set automatically.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Gender & Monthly Income Target */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Gender
                          </label>
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base font-medium text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 min-h-[52px]"
                          >
                            <option>Female</option>
                            <option>Male</option>
                            <option>Non-binary</option>
                            <option>Prefer not to say</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Monthly Target ($)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={100}
                            placeholder="3500"
                            value={targetPaycheck}
                            onChange={(e) => setTargetPaycheck(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base font-medium text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 min-h-[52px]"
                          />
                        </div>
                      </div>

                      {/* Stage 2 Action Buttons */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => handleGoBack(1)}
                          className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 min-h-[54px]"
                        >
                          <ArrowLeft className="size-4" />
                          <span>Back</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleContinueToStep3}
                          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 px-6 text-base font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.99] transition-all min-h-[54px]"
                        >
                          <span>Continue to Connect Wallet</span>
                          <ArrowRight className="size-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ========================================================== */}
                  {/* STAGE 3: CONNECT SUI WALLET */}
                  {/* ========================================================== */}
                  {step === 3 && (
                    <div
                      className={`space-y-5 ${
                        slideDirection === 'forward'
                          ? 'animate-slide-in-right'
                          : 'animate-slide-in-left'
                      }`}
                    >
                      {/* Sui Feature Banner Card */}
                      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-sky-500/15 via-indigo-500/10 to-transparent border border-sky-200/60 dark:border-sky-800/40">
                        <div className="flex items-center gap-4">
                          <div className="size-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/30 shrink-0">
                            <Coins className="size-7" />
                          </div>
                          <div>
                            <span className="inline-block rounded-full bg-sky-100 dark:bg-sky-950 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">
                              Sui Network Standard
                            </span>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                              Connect Your Sui Wallet
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Sync on-chain crypto income directly into your safe-to-spend buffer.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Detected Sui Wallets Extension */}
                      {suiWallets.length > 0 && !connectedSuiAddress && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Detected Extensions in Your Browser
                          </p>
                          <div className="space-y-2">
                            {suiWallets.map((w, idx) => (
                              <button
                                key={idx}
                                type="button"
                                disabled={isWalletConnecting}
                                onClick={() => handleConnectSuiExtension(w)}
                                className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-600 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
                              >
                                <div className="flex items-center gap-3">
                                  {w.icon ? (
                                    <img
                                      src={w.icon}
                                      alt={w.name}
                                      className="size-8 rounded-xl object-contain"
                                    />
                                  ) : (
                                    <div className="size-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                                      S
                                    </div>
                                  )}
                                  <div className="text-left">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                      {w.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Click to connect standard Sui wallet
                                    </p>
                                  </div>
                                </div>
                                <span className="rounded-xl bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                  Connect
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Connected Wallet State Badge */}
                      {connectedSuiAddress ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 className="size-4" />
                              Sui Wallet Connected
                            </span>
                            <button
                              type="button"
                              onClick={() => setConnectedSuiAddress('')}
                              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                            >
                              Disconnect
                            </button>
                          </div>
                          <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                            {connectedSuiAddress}
                          </p>
                        </div>
                      ) : (
                        /* Manual Sui Address Input or Simulated */
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Or Paste Sui Address Manually
                          </label>
                          <div className="relative">
                            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="0x..."
                              value={manualSuiAddress}
                              onChange={(e) => setManualSuiAddress(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 min-h-[52px]"
                            />
                          </div>

                          <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                            <span>Non-custodial. Watch-only tracking.</span>
                            <button
                              type="button"
                              onClick={() => {
                                setManualSuiAddress(
                                  '0x3d7b89f2a41c881023a890e71928374a81273948b89e7'
                                );
                              }}
                              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                            >
                              Fill sample address
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Stage 3 Action Buttons */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleGoBack(2)}
                            className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 min-h-[54px]"
                          >
                            <ArrowLeft className="size-4" />
                            <span>Back</span>
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleFinalSignup(false)}
                            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 px-6 text-base font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.99] transition-all min-h-[54px] disabled:opacity-60"
                          >
                            {busy ? (
                              <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              <>
                                <span>Complete & Enter Diction</span>
                                <Sparkles className="size-5" />
                              </>
                            )}
                          </button>
                        </div>

                        {/* Skip Wallet Option */}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleFinalSignup(true)}
                          className="w-full text-center text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 py-2 transition-colors"
                        >
                          I'll connect my wallet later →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Toggle to Sign In */}
                  <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('in');
                        setError('');
                        setInfo('');
                      }}
                      className="font-bold text-indigo-600 hover:underline dark:text-indigo-400 ml-1"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              ) : (
                /* ============================================================== */
                /* SIGN IN FORM */
                /* ============================================================== */
                <div className="space-y-5 animate-slide-in-right">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-base font-medium text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 min-h-[52px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 py-3.5 text-base font-medium text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 min-h-[52px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        aria-label="Toggle password view"
                      >
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleSignIn}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 px-6 text-base font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.99] transition-all min-h-[54px] disabled:opacity-60"
                  >
                    {busy ? (
                      <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <span>Sign In to Diction</span>
                        <ArrowRight className="size-5" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
                    New to Diction?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('up');
                        setStep(1);
                        setError('');
                        setInfo('');
                      }}
                      className="font-bold text-indigo-600 hover:underline dark:text-indigo-400 ml-1"
                    >
                      Create an account (3-step setup)
                    </button>
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-200/60 dark:border-slate-800/60 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
          © Diction · Autonomous Financial Safety for Freelancers & Web3 Builders
        </footer>
      </div>
    );
  }

  // User is authenticated: inject Profile context
  const m = user.user_metadata || {};
  const profile: Profile = {
    name: m.name || user.email?.split('@')[0] || 'Freelancer',
    country: m.country || 'United States',
    gender: m.gender || '',
    age: Number(m.age) || 0,
    work: m.work || 'Freelancer',
    taxRate: taxFor(m.country),
    email: user.email || '',
    targetPaycheck: Number(m.targetPaycheck) || 3500,
    walletAddress: m.walletAddress || ''
  };

  return (
    <Ctx.Provider value={profile}>
      {profile.age > 0 && profile.age < 18 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-2.5 px-4 text-center text-xs font-semibold text-amber-700 dark:text-amber-300">
          Under 18 Alert: Please ensure a parent or guardian oversees your money and contract decisions.
        </div>
      )}
      {children}
    </Ctx.Provider>
  );
}
