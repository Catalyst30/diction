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

const GRADIENT = 'linear-gradient(150deg, #1B1366 0%, #3424B8 40%, #4832E7 72%, #8B7DF7 100%)';
const field = 'w-full rounded-xl border border-secondary bg-secondary px-lg py-sm min-h-[56px] text-lg text-primary';
const lab = 'flex flex-col gap-xs text-sm font-semibold text-primary';
const primaryBtn = 'inline-flex w-full items-center justify-center rounded-xl bg-brand-solid px-lg py-sm min-h-[56px] text-lg font-semibold text-primary-on-brand hover:bg-brand-solid-hover disabled:opacity-60';
const ghostBtn = 'inline-flex w-full items-center justify-center rounded-xl border border-primary bg-primary px-lg py-sm min-h-[56px] text-lg font-semibold text-secondary hover:bg-secondary';
const STEPS = ['Create your account', 'Tell us about your work', 'Connect your wallet'];
const err = { color: 'var(--color-text-error-primary, #B42318)' };

const saveWallet = (address: string) => {
  try {
    const cur = JSON.parse(localStorage.getItem('diction_wallets') || '[]');
    if (!cur.some((w: any) => w.address === address)) cur.push({ type: 'Sui', address });
    localStorage.setItem('diction_wallets', JSON.stringify(cur));
  } catch {}
};

function Logo({ onDark }: { onDark?: boolean }) {
  return (
    <div className="flex items-center gap-sm">
      <span className="flex size-11 items-center justify-center rounded-full" style={{ background: onDark ? '#fff' : '#4832E7' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={onDark ? '#4832E7' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        </svg>
      </span>
      <span className="text-2xl font-bold" style={{ color: onDark ? '#fff' : undefined }}>Diction</span>
    </div>
  );
}

const Tick = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<'in' | 'up'>('up');
  const [stage, setStage] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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
  const [wallets, setWallets] = useState<any[]>([]);
  const [linked, setLinked] = useState('');
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    import('@mysten/wallet-standard').then((m) => {
      const api = m.getWallets();
      const find = () => setWallets(api.get().filter((w: any) => w.features['standard:connect'] && Object.keys(w.features).some((k) => k.startsWith('sui:'))));
      find();
      api.on('register', find);
    }).catch(() => {});
  }, []);

  const go = (s: 1 | 2) => { setStage(s); setError(''); setInfo(''); };

  const next = () => {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Please enter a valid email address.');
    if (password.length < 8) return setError('Please use a password of at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');
    go(2);
  };

  const signIn = async () => {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email) || !password) return setError('Enter your email and password.');
    setBusy(true);
    const res = await supabase!.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (res.error) setError(res.error.message);
  };

  const createAccount = async () => {
    setError('');
    const a = Number(age);
    if (!name.trim() || !country || !gender || !work.trim()) return setError('Please fill in every field.');
    if (!Number.isFinite(a) || a < 13 || a > 120) return setError('Diction is for people aged 13 and over. Please enter your real age.');
    if (a < 18 && !parent) return setError('Please confirm that a parent or guardian knows you are using Diction.');
    setBusy(true);
    const res = await supabase!.auth.signUp({ email, password, options: { data: { name: name.trim(), country, gender, age: a, work: work.trim() } } });
    setBusy(false);
    if (res.error) return setError(res.error.message);
    if (!res.data.session) { setMode('in'); setInfo('Account created. Check your email to confirm it, then sign in.'); }
  };

  const connect = async (w: any) => {
    setError('');
    try {
      const r = await w.features['standard:connect'].connect();
      const addr = r.accounts?.[0]?.address;
      if (addr) { saveWallet(addr); setLinked(addr); }
    } catch (e: any) { setError(e?.message || 'Connection cancelled.'); }
  };

  const finish = async () => {
    setBusy(true);
    try { await supabase!.auth.updateUser({ data: { onboarded: true } }); } catch {}
    setBusy(false);
    setFinished(true);
  };

  if (!ready) return <p className="p-xl text-lg text-secondary">Loading...</p>;
  if (!supabase) return <p className="p-xl text-lg text-primary">Sign-in is not set up yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel, then redeploy.</p>;

  const m = user?.user_metadata || {};
  if (user && (m.onboarded === true || finished)) {
    try { localStorage.setItem('diction_uid', user.id); } catch {}
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

  const current = user ? 3 : mode === 'up' ? stage : 0;
  const under18 = Number(age) >= 13 && Number(age) < 18;
  const heading = current === 0 ? 'Welcome back' : 'Start your journey';
  const sub = current === 0 ? 'Pick up where you left off.' : 'Earn and spend wisely, without going broke.';

  return (
    <main className="min-h-screen bg-primary lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="hidden flex-col justify-between gap-2xl p-2xl lg:flex" style={{ background: GRADIENT, color: '#fff' }}>
        <Logo onDark />
        <div className="flex flex-col gap-md">
          <span className="w-fit rounded-full px-lg py-xs text-sm font-semibold" style={{ background: 'rgba(255,255,255,.18)' }}>Built for freelancers</span>
          <h1 className="text-5xl font-semibold">{heading}</h1>
          <p className="text-xl" style={{ opacity: 0.9 }}>{sub}</p>
        </div>
        <ol className="grid grid-cols-3 gap-sm">
          {STEPS.map((s, i) => {
            const n = i + 1, done = current > n, active = current === n;
            return (
              <li key={s} className="flex min-h-[140px] flex-col justify-between rounded-2xl p-md" style={active ? { background: '#fff', color: '#1B1366' } : { background: 'rgba(255,255,255,.14)', opacity: done || current === 0 ? 0.9 : 0.7 }}>
                <span className="flex size-8 items-center justify-center rounded-full text-sm font-bold" style={active ? { background: '#4832E7', color: '#fff' } : done ? { background: '#12B76A', color: '#fff' } : { border: '1px solid rgba(255,255,255,.7)' }}>{done ? <Tick /> : n}</span>
                <span className="text-lg font-semibold">{s}</span>
              </li>
            );
          })}
        </ol>
      </aside>

      <header className="px-lg pb-3xl pt-lg lg:hidden" style={{ background: GRADIENT, color: '#fff', borderRadius: '0 0 28px 28px' }}>
        <Logo onDark />
        <p className="mt-lg text-2xl font-semibold">{current === 0 ? 'Welcome back' : STEPS[current - 1]}</p>
        {current > 0 && (
          <>
            <p className="mt-xxs text-sm" style={{ opacity: 0.85 }}>Step {current} of 3</p>
            <div className="mt-md flex gap-xs">
              {[1, 2, 3].map((n) => <span key={n} className="h-1.5 flex-1 rounded-full" style={{ background: n <= current ? '#fff' : 'rgba(255,255,255,.3)' }} />)}
            </div>
          </>
        )}
      </header>

      <section className="flex justify-center px-lg pb-2xl lg:items-center lg:p-2xl">
        <div className="w-full max-w-md rounded-3xl border border-secondary bg-primary p-lg shadow-lg sm:p-xl lg:border-0 lg:p-0 lg:shadow-none" style={{ marginTop: -28 }}>
          <div key={current} className="slide-in flex flex-col gap-md">
            {current === 0 && (
              <>
                <h2 className="hidden text-3xl font-semibold text-primary lg:block">Sign in</h2>
                <label className={lab}>Email<input className={field} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                <label className={lab}>Password
                  <span className="relative block">
                    <input className={field} type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && signIn()} />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-secondary">{show ? 'Hide' : 'Show'}</button>
                  </span>
                </label>
                {error && <p className="text-lg font-semibold" style={err}>{error}</p>}
                {info && <p className="text-lg text-primary">{info}</p>}
                <button onClick={signIn} disabled={busy} className={primaryBtn}>{busy ? 'Please wait...' : 'Sign in'}</button>
                <p className="text-center text-lg text-secondary">New to Diction? <button className="font-semibold text-brand-primary underline" onClick={() => { setMode('up'); go(1); }}>Create an account</button></p>
              </>
            )}

            {current === 1 && (
              <>
                <h2 className="hidden text-3xl font-semibold text-primary lg:block">Create your account</h2>
                <label className={lab}>Email<input className={field} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                <label className={lab}>Password
                  <span className="relative block">
                    <input className={field} type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-secondary">{show ? 'Hide' : 'Show'}</button>
                  </span>
                </label>
                <label className={lab}>Confirm password<input className={field} type={show ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && next()} /></label>
                {error && <p className="text-lg font-semibold" style={err}>{error}</p>}
                <button onClick={next} className={primaryBtn}>Continue</button>
                <p className="text-center text-lg text-secondary">Already have an account? <button className="font-semibold text-brand-primary underline" onClick={() => { setMode('in'); setError(''); setInfo(''); }}>Sign in</button></p>
              </>
            )}

            {current === 2 && (
              <>
                <h2 className="hidden text-3xl font-semibold text-primary lg:block">Tell us about your work</h2>
                <div className="grid gap-md sm:grid-cols-2">
                  <label className={lab}>Your name<input className={field} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></label>
                  <label className={lab}>Age<input className={field} type="number" inputMode="numeric" min={13} max={120} value={age} onChange={(e) => setAge(e.target.value)} /></label>
                </div>
                <label className={lab}>Country
                  <select className={field} value={country} onChange={(e) => setCountry(e.target.value)}>
                    <option value="">Choose your country</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                {country && <p className="-mt-sm text-sm text-secondary">Estimated tax rate for {country}: <b className="text-primary">{taxFor(country)}%</b>{hasRate(country) ? '' : ' (a general estimate)'}. Set automatically.</p>}
                <div className="grid gap-md sm:grid-cols-2">
                  <label className={lab}>Gender
                    <select className={field} value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="">Choose one</option>
                      <option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option>
                    </select>
                  </label>
                  <label className={lab}>The work you do<input className={field} placeholder="e.g. Motion designer" value={work} onChange={(e) => setWork(e.target.value)} /></label>
                </div>
                {under18 && (
                  <div className="rounded-xl border border-secondary bg-secondary p-md text-lg text-primary">
                    You are under 18. Please talk to a parent or guardian before using Diction to make money decisions.
                    <label className="mt-sm flex items-start gap-sm"><input type="checkbox" className="mt-1 size-5" checked={parent} onChange={(e) => setParent(e.target.checked)} /><span>A parent or guardian knows I am using Diction.</span></label>
                  </div>
                )}
                {error && <p className="text-lg font-semibold" style={err}>{error}</p>}
                <button onClick={createAccount} disabled={busy} className={primaryBtn}>{busy ? 'Creating your account...' : 'Create my account'}</button>
                <button onClick={() => go(1)} className="text-center text-lg font-semibold text-secondary underline">Back</button>
              </>
            )}

            {current === 3 && (
              <>
                <h2 className="hidden text-3xl font-semibold text-primary lg:block">Connect your Sui wallet</h2>
                <p className="text-lg text-secondary">Diction reads your balance and shows money coming in and going out. It never holds your money and never asks you to sign anything.</p>
                {wallets.map((w) => (
                  <button key={w.name} onClick={() => connect(w)} className={ghostBtn}>
                    {w.icon && <img src={w.icon} alt="" className="mr-sm size-7 rounded-lg" />}Connect {w.name}
                  </button>
                ))}
                {wallets.length === 0 && <p className="rounded-xl bg-secondary p-md text-lg text-secondary">No Sui wallet found in this browser. Install Slush or Backpack, refresh, and come back, or continue without one for now.</p>}
                {linked && (
                  <p className="flex items-center gap-sm rounded-xl p-md text-lg font-semibold" style={{ background: 'rgba(18,183,106,.12)', color: '#12B76A' }}><Tick />Connected {linked.slice(0, 8)}...{linked.slice(-6)}</p>
                )}
                {error && <p className="text-lg font-semibold" style={err}>{error}</p>}
                <button onClick={finish} disabled={busy} className={linked ? primaryBtn : ghostBtn}>{busy ? 'Please wait...' : linked ? 'Finish and start' : 'I\u2019ll connect later'}</button>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
