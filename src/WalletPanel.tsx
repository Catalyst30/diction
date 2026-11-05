import React, { useEffect, useRef, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

type W = { type: 'Sui' | 'EVM'; address: string };
type Asset = { symbol: string; amount: number; usd: number | null };
type Item = { id: string; dir: 'in' | 'out'; amount: number; coin: string; ts: number };
type Data = { assets: Asset[]; total: number; feed: Item[] };

const short = (a: string) => a.slice(0, 6) + '...' + a.slice(-4);
const usd = (n: number) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 4 });
const load = (): W[] => { try { return JSON.parse(localStorage.getItem('diction_wallets') || '[]'); } catch { return []; } };
const bad = { color: 'var(--color-text-error-primary, #B42318)' };
const good = { color: 'var(--color-text-success-primary, #067647)' };

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    try { const s = localStorage.getItem('diction_theme'); return s ? s === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    try { localStorage.setItem('diction_theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Toggle dark mode"
      onClick={() => setDark(!dark)}
      className="relative inline-flex h-11 w-[76px] shrink-0 items-center rounded-full border border-primary bg-secondary shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring"
    >
      <Sun className="absolute left-3 size-4 text-tertiary" />
      <Moon className="absolute right-3 size-4 text-tertiary" />
      <span
        className={`absolute left-1 top-[5px] flex size-8 items-center justify-center rounded-full bg-brand-solid shadow-md transition-transform duration-200 ${
          dark ? 'translate-x-[34px]' : 'translate-x-0'
        }`}
      >
        {dark ? <Moon className="size-4 text-fg-white" /> : <Sun className="size-4 text-fg-white" />}
      </span>
    </button>
  );
}

export default function WalletPanel({ open, onClose, safeToSpend, onBalance, onCount }: {
  open: boolean; onClose: () => void; safeToSpend: number; onBalance: (n: number) => void; onCount: (n: number) => void;
}) {
  const [wallets, setWallets] = useState<W[]>(load);
  const [data, setData] = useState<Record<string, Data>>({});
  const [msg, setMsg] = useState('');
  const [suiWallets, setSuiWallets] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
    const [pick, setPick] = useState<'' | 'sui' | 'evm'>('sui');
  const [evmWallets, setEvmWallets] = useState<any[]>([]);
  useEffect(() => {
    const on = (e: any) => setEvmWallets((l) => (l.some((x) => x.info.uuid === e.detail.info.uuid) ? l : [...l, e.detail]));
    window.addEventListener('eip6963:announceProvider', on);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    return () => window.removeEventListener('eip6963:announceProvider', on);
  }, []);
    const prev = useRef<Record<string, number>>({});
  const [seen, setSeen] = useState<Item[]>([]);

  useEffect(() => {
    import('@mysten/wallet-standard').then((m) => {
      const api = m.getWallets();
      const find = () => setSuiWallets(api.get().filter((w: any) => w.features['standard:connect'] && Object.keys(w.features).some((k) => k.startsWith('sui:'))));
      find();
      api.on('register', find);
    }).catch(() => {});
  }, []);

  const save = (next: W[]) => { setWallets(next); try { localStorage.setItem('diction_wallets', JSON.stringify(next)); } catch {} };
  const add = (w: W) => { if (!wallets.some((p) => p.address === w.address)) save([...wallets, w]); setAdding(false); setPick(''); setMsg(''); };
  const connectSui = async (w: any) => {
    try { const r = await w.features['standard:connect'].connect(); add({ type: 'Sui', address: r.accounts[0].address }); }
    catch (e: any) { setMsg('Could not connect: ' + (e?.message || 'cancelled')); }
  };
    const connectEvm = async (provider?: any) => {
    const eth = provider || (window as any).ethereum;
    if (!eth) { setMsg('No EVM wallet found in this browser. Install MetaMask or Rabby, refresh, and try again.'); return; }
    try { const a = await eth.request({ method: 'eth_requestAccounts' }); add({ type: 'EVM', address: a[0] }); }
    catch (e: any) { setMsg('Could not connect: ' + (e?.message || 'cancelled')); }
  };

  useEffect(() => {
    onCount(wallets.length);
    if (!wallets.length) { setData({}); return; }
    let live = true;
    const poll = async () => {
      const next: Record<string, Data> = {}; let err = '';
      for (const w of wallets) {
        try {
          const r = await fetch(`/api/wallet/${w.type.toLowerCase()}-activity`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: w.address }) });
          const d = await r.json();
          if (d.success) {
            next[w.address] = d; if (d.note) err = d.note;
            const fresh: Item[] = []; const held = new Set<string>();
            for (const a of d.assets) {
              const k = w.address + '|' + a.symbol; held.add(k); const p = prev.current[k];
              if (p !== undefined && Math.abs(a.amount - p) > 1e-9) fresh.push({ id: k + Date.now(), dir: a.amount > p ? 'in' : 'out', amount: Math.abs(a.amount - p), coin: a.symbol, ts: Date.now() });
              prev.current[k] = a.amount;
            }
            for (const k of Object.keys(prev.current)) {
              if (k.startsWith(w.address + '|') && !held.has(k) && prev.current[k] > 0) { fresh.push({ id: k + Date.now(), dir: 'out', amount: prev.current[k], coin: k.split('|')[1], ts: Date.now() }); prev.current[k] = 0; }
            }
            if (fresh.length) setSeen((s) => [...fresh, ...s].slice(0, 30));
          } else err = d.error;
        } catch { err = 'Could not reach the server.'; }
      }
      if (!live) return;
      setData(next); setMsg(err);
      const vals = Object.values(next);
      if (vals.length) onBalance(vals.reduce((s, d) => s + d.total, 0));
    };
    poll();
    const t = setInterval(poll, 15000);
    return () => { live = false; clearInterval(t); };
  }, [wallets]);

  const all = Object.values(data);
  const total = all.reduce((s, d) => s + d.total, 0);
    const feed = [...seen, ...all.flatMap((d) => d.feed)].sort((a, b) => b.ts - a.ts);
  const weekOut = feed.filter((f) => f.dir === 'out' && f.ts > Date.now() - 7 * 864e5 && ['USDC', 'USDT', 'DAI'].includes(f.coin)).reduce((s, f) => s + f.amount, 0);
  const over = weekOut > safeToSpend && weekOut > 0;
  const btn = 'flex-1 min-w-[140px] rounded-lg border border-primary bg-primary px-lg py-md min-h-[64px] text-lg font-semibold text-primary shadow-xs hover:bg-primary-hover';
  const chooser = !wallets.length || adding;

  return (
    <>
      
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-md">
          <div className="fixed inset-0 bg-overlay opacity-70" onClick={onClose} />
          <div className="relative flex w-full flex-col overflow-hidden rounded-lg border border-secondary bg-primary shadow-2xl sm:max-w-lg" style={{ maxHeight: '92vh' }}>
            <header className="flex items-center justify-between border-b border-secondary p-lg">
              <h2 className="text-xl font-semibold text-primary">{chooser ? 'Connect a wallet' : 'Your wallets'}</h2>
              <button onClick={onClose} aria-label="Close" className="min-h-[48px] min-w-[48px] rounded-lg text-xl text-secondary hover:bg-primary-hover">×</button>
            </header>
            <div className="flex flex-col gap-md overflow-y-auto p-lg">
              {msg && <p className="text-sm font-semibold" style={bad}>{msg}</p>}
              {chooser && (
                <>
                  <p className="text-lg text-secondary">Choose the kind of wallet you use. Diction only reads it. Your money stays with you.</p>
                  <div className="flex flex-wrap gap-sm">
                    <button className={btn} onClick={() => setPick('sui')}>Sui wallet</button>
                
                  </div>
                  {pick === 'sui' && (
                    <div className="flex flex-col gap-sm">
                      {suiWallets.map((w) => <button key={w.name} className={btn} onClick={() => connectSui(w)}>{w.name}</button>)}
                      {!suiWallets.length && <p className="text-lg text-secondary">No Sui wallet found in this browser. Install Slush or Backpack, refresh, and try again.</p>}
                    </div>
                  )}
                                    {pick === 'evm' && (
                    <div className="flex flex-col gap-sm">
                      {evmWallets.map((w) => <button key={w.info.uuid} className={btn} onClick={() => connectEvm(w.provider)}>{w.info.name}</button>)}
                      {!evmWallets.length && (window as any).ethereum && <button className={btn} onClick={() => connectEvm()}>Browser wallet</button>}
                      {!evmWallets.length && !(window as any).ethereum && <p className="text-lg text-secondary">No EVM wallet found in this browser. Install MetaMask or Rabby, refresh, and try again.</p>}
                    </div>
                  )}
                  {adding && <button className="text-lg text-secondary underline" onClick={() => { setAdding(false); setPick(''); }}>Back to my wallets</button>}
                </>
              )}
              {!chooser && (
                <>
                  <div className="rounded-lg border border-secondary bg-secondary p-lg">
                    <p className="text-sm font-medium text-secondary">Total value in your wallets</p>
                    <p className="text-5xl font-semibold text-primary">{usd(total)}</p>
                  </div>
                  {over && (
                    <div className="rounded-lg p-md text-lg font-semibold" style={{ background: 'var(--color-bg-error-primary, #FEF3F2)', ...bad }}>
                      Careful: you spent {usd(weekOut)} in stablecoins in the last 7 days, but only {usd(safeToSpend)} is safe to spend.
                    </div>
                  )}
                  {wallets.map((w) => (
                    <div key={w.address} className="rounded-lg border border-secondary p-md">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-primary">{w.type} wallet · {short(w.address)}</span>
                        <button className="text-sm text-secondary underline" onClick={() => save(wallets.filter((x) => x.address !== w.address))}>Disconnect</button>
                      </div>
                      {!data[w.address] && <p className="text-lg text-secondary">Loading your assets...</p>}
                      {data[w.address]?.assets.length === 0 && <p className="text-lg text-secondary">No assets found.</p>}
                      {data[w.address]?.assets.map((a) => (
                        <div key={a.symbol} className="flex items-center justify-between border-t border-secondary py-sm text-lg">
                          <span className="font-semibold text-primary">{a.symbol}</span>
                          <span className="text-right text-secondary">{num(a.amount)}<br /><b className="text-primary">{a.usd == null ? 'price unavailable' : usd(a.usd)}</b></span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <button className={btn} onClick={() => setAdding(true)}>Add another wallet</button>
                  <h3 className="text-lg font-semibold text-primary">Live activity</h3>
                  <ul className="flex flex-col text-lg">
                    {feed.length === 0 && <li className="text-secondary">No recent transactions found.</li>}
                    {feed.slice(0, 10).map((f) => (
                      <li key={f.id} className="flex items-center justify-between border-t border-secondary py-sm">
                        <span className="text-secondary">{f.dir === 'in' ? 'Money in' : 'Money out'}<br /><small>{new Date(f.ts).toLocaleString()}</small></span>
                        <b style={f.dir === 'in' ? good : bad}>{f.dir === 'in' ? '+' : '-'}{num(f.amount)} {f.coin}</b>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-secondary">Updates every 15 seconds. Dollar values are estimates.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
