import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { COUNTRIES } from './countries';
import { taxFor, hasRate } from './taxRates';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase = url && anon ? createClient(url, anon) : null;

if (supabase && typeof window !== 'undefined') {
  const orig = window.fetch.bind(window);
  window.fetch = async (input: any, init: any = {}) => {
    const u = typeof input === 'string' ? input : input?.url || '';
    if (u.startsWith('/api/')) {
      const { data } = await supabase.auth.getSession();
      const t = data.session?.access_token;
      if (t) { const h = new Headers(init.headers || {}); h.set('Authorization', `Bearer ${t}`); init = { ...init, headers: h }; }
    }
    return orig(input, init);
  };
}

export type Profile = { name: string; country: string; gender: string; age: number; work: string; taxRate: number; email: string };
const Ctx = createContext<Profile | null>(null);
export const useProfile = () => useContext(Ctx);
export const signOut = () => supabase?.auth.signOut();

const GRADIENT = 'linear-gradient(145deg, #312E81 0%, #4F46E5 55%, #818CF8 100%)';
const input = 'w-full rounded-xl border border-secondary bg-secondary px-lg py-sm min-h-[56px] text-lg text-primary';
const label = 'flex flex-col gap-xs text-sm font-semibold text-primary';

function Logo({ onDark }: { onDark?: boolean }) {
  return (
    <div className="flex items-center gap-sm">
      <span className="flex size-12 items-center justify-center rounded-full" style={{ background: onDark ? '#fff' : '#4F46E5' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={onDark ? '#4F46E5' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        </svg>
      </span>
      <span className="text-3xl font-bold" style={{ color: onDark ? '#fff' : undefined }}>Diction</span>
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<'in' | 'up'>('up');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [work, setWork] = useState('');
  const [parent, setParent] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    setError(''); setInfo('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Please enter a valid email address.');
    if (password.length < 8) return setError('Please use a password of at least 8 characters.');
    const a = Number(age);
    if (mode === 'up') {
      if (!name.trim() || !country || !gender || !work.trim()) return setError('Please fill in every field.');
      if (!Number.isFinite(a) || a < 13 || a > 120) return setError('Diction is for people aged 13 and over. Please enter your real age.');
      if (a < 18 && !parent) return setError('Please confirm that a parent or guardian knows you are using Diction.');
    }
    setBusy(true);
    const res = mode === 'up'
      ? await supabase!.auth.signUp({ email, password, options: { data: { name: name.trim(), country, gender, age: a, work: work.trim() } } })
      : await supabase!.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (res.error) return setError(res.error.message);
    if (mode === 'up' && !res.data.session) setInfo('Account created. Check your email to confirm it, then sign in.');
  };

  if (!ready) return <p className="p-xl text-lg text-secondary">Loading...</p>;
  if (!supabase) return <p className="p-xl text-lg text-primary">Sign-in is not set up yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel, then redeploy.</p>;

  if (!user) {
    const under18 = mode === 'up' && Number(age) >= 13 && Number(age) < 18;
    const steps = ['Create your account', 'Tell us about your work', 'Connect your wallet'];
    return (
      <main className="grid min-h-screen bg-primary lg:grid-cols-2">
        <aside className="flex flex-col justify-between gap-xl p-xl" style={{ background: GRADIENT, color: '#fff' }}>
          <Logo onDark />
          <div className="flex flex-col gap-sm">
            <span className="w-fit rounded-full px-lg py-xs text-sm font-semibold" style={{ background: 'rgba(255,255,255,.2)' }}>Built for freelancers</span>
            <h1 className="text-4xl font-semibold lg:text-5xl">Start your journey</h1>
            <p className="text-lg" style={{ opacity: 0.9 }}>Earn and spend wisely, without going broke.</p>
          </div>
          <div className="hidden gap-sm lg:grid lg:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s} className="flex min-h-[130px] flex-col justify-between rounded-xl p-md" style={i === 0 ? { background: '#fff', color: '#312E81' } : { background: 'rgba(255,255,255,.18)' }}>
                <span className="flex size-8 items-center justify-center rounded-full text-sm font-bold" style={i === 0 ? { background: '#4F46E5', color: '#fff' } : { border: '1px solid rgba(255,255,255,.7)' }}>{i + 1}</span>
                <span className="text-lg font-semibold">{s}</span>
              </div>
            ))}
          </div>
        </aside>
        <section className="flex items-center justify-center p-lg">
          <div className="flex w-full max-w-md flex-col gap-md">
            <h2 className="text-center text-3xl font-semibold text-primary">{mode === 'up' ? 'Join Diction' : 'Welcome back'}</h2>
            <label className={label}>Email<input className={input} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className={label}>Password
              <span className="relative block">
                <input className={input} type={show ? 'text' : 'password'} autoComplete={mode === 'up' ? 'new-password' : 'current-password'} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-secondary">{show ? 'Hide' : 'Show'}</button>
              </span>
            </label>
            {mode === 'up' && (
              <>
                <div className="grid gap-md sm:grid-cols-2">
                  <label className={label}>Your name<input className={input} value={name} onChange={(e) => setName(e.target.value)} /></label>
                  <label className={label}>Age<input className={input} type="number" min={13} max={120} value={age} onChange={(e) => setAge(e.target.value)} /></label>
                </div>
                <label className={label}>Country
                  <select className={input} value={country} onChange={(e) => setCountry(e.target.value)}>
                    <option value="">Choose your country</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                {country && (
                  <p className="-mt-sm text-sm text-secondary">Estimated tax rate for {country}: <b className="text-primary">{taxFor(country)}%</b>{hasRate(country) ? '' : ' (a general estimate)'}. Set automatically.</p>
                )}
                <div className="grid gap-md sm:grid-cols-2">
                  <label className={label}>Gender
                    <select className={input} value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="">Choose one</option>
                      <option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option>
                    </select>
                  </label>
                  <label className={label}>The work you do<input className={input} placeholder="e.g. Motion designer" value={work} onChange={(e) => setWork(e.target.value)} /></label>
                </div>
                {under18 && (
                  <div className="rounded-xl border border-secondary bg-secondary p-md text-lg text-primary">
                    You are under 18. Please talk to a parent or guardian before using Diction to make money decisions.
                    <label className="mt-sm flex items-start gap-sm">
                      <input type="checkbox" className="mt-1 size-5" checked={parent} onChange={(e) => setParent(e.target.checked)} />
                      <span>A parent or guardian knows I am using Diction.</span>
                    </label>
                  </div>
                )}
              </>
            )}
            {error && <p className="text-lg font-semibold" style={{ color: '#B42318' }}>{error}</p>}
            {info && <p className="text-lg text-primary">{info}</p>}
            <button onClick={submit} disabled={busy} className="min-h-[56px] rounded-xl px-lg py-sm text-lg font-semibold disabled:opacity-60" style={{ background: '#4F46E5', color: '#fff' }}>
              {busy ? 'Please wait...' : mode === 'up' ? 'Create my account' : 'Sign in'}
            </button>
            <p className="text-center text-lg text-secondary">
              {mode === 'up' ? 'Already have an account? ' : 'New to Diction? '}
              <button className="font-semibold underline" style={{ color: '#4F46E5' }} onClick={() => { setMode(mode === 'up' ? 'in' : 'up'); setError(''); setInfo(''); }}>
                {mode === 'up' ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </div>
        </section>
      </main>
    );
  }

  const m = user.user_metadata || {};
  const profile: Profile = { name: m.name || user.email, country: m.country || 'United States', gender: m.gender || '', age: Number(m.age) || 0, work: m.work || '', taxRate: taxFor(m.country), email: user.email };
  return (
    <Ctx.Provider value={profile}>
      {profile.age > 0 && profile.age < 18 && (
        <div className="bg-secondary p-md text-center text-lg text-primary">Under 18? Please ask a parent or guardian before making money decisions with Diction.</div>
      )}
      {children}
    </Ctx.Provider>
  );
}
