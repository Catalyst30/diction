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

const field = 'rounded-md bg-primary px-lg py-sm text-lg text-primary border border-primary min-h-[56px] w-full';
const label = 'flex flex-col gap-xs text-sm font-medium text-secondary';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<'in' | 'up'>('up');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-md p-lg">
        <h1 className="text-3xl font-semibold text-primary">Diction</h1>
        <p className="text-lg text-secondary">Earn and spend wisely, without going broke.</p>
        <div className="flex gap-sm">
          {(['up', 'in'] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(''); setInfo(''); }}
              className={`flex-1 rounded-lg border min-h-[56px] text-lg font-semibold ${mode === m ? 'bg-brand-solid text-primary-on-brand border-transparent' : 'bg-primary text-secondary border-primary'}`}>
              {m === 'up' ? 'Create account' : 'Sign in'}
            </button>
          ))}
        </div>
        <label className={label}>Email<input className={field} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className={label}>Password (8 or more characters)<input className={field} type="password" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {mode === 'up' && (
          <>
            <label className={label}>Your name<input className={field} value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label className={label}>Country
              <select className={field} value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="">Choose your country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            {country && (
              <p className="text-sm text-secondary">
                Estimated tax rate for {country}: <b className="text-primary">{taxFor(country)}%</b>{hasRate(country) ? '' : ' (a general estimate, as we have no figure for this country)'}. This is set for you automatically.
              </p>
            )}
            <label className={label}>Gender
              <select className={field} value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Choose one</option>
                <option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option>
              </select>
            </label>
            <label className={label}>Age<input className={field} type="number" min={13} max={120} value={age} onChange={(e) => setAge(e.target.value)} /></label>
            <label className={label}>The work you do<input className={field} placeholder="For example: graphic designer" value={work} onChange={(e) => setWork(e.target.value)} /></label>
            {under18 && (
              <div className="rounded-lg border border-secondary bg-secondary p-md text-lg text-primary">
                You are under 18. Please talk to a parent or guardian before using Diction to make money decisions.
                <label className="mt-sm flex items-start gap-sm">
                  <input type="checkbox" className="mt-1 size-5" checked={parent} onChange={(e) => setParent(e.target.checked)} />
                  <span>A parent or guardian knows I am using Diction.</span>
                </label>
              </div>
            )}
          </>
        )}
        {error && <p className="text-lg font-semibold" style={{ color: 'var(--color-text-error-primary, #B42318)' }}>{error}</p>}
        {info && <p className="text-lg text-primary">{info}</p>}
        <button onClick={submit} disabled={busy} className="rounded-lg bg-brand-solid px-lg py-sm min-h-[56px] text-lg font-semibold text-primary-on-brand disabled:opacity-60">
          {busy ? 'Please wait...' : mode === 'up' ? 'Create my account' : 'Sign in'}
        </button>
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
      <button onClick={() => supabase.auth.signOut()} className="fixed bottom-20 left-4 z-40 rounded-lg border border-primary bg-primary px-lg py-sm min-h-[48px] text-sm font-semibold text-secondary shadow-xs">
        Sign out
      </button>
    </Ctx.Provider>
  );
}
