import React, { useEffect, useState } from 'react';

type W = { type: 'Sui' | 'EVM'; address: string };
type Item = { id: string; dir: 'in' | 'out'; amount: number; coin: string; ts: number; wallet: string };
const short = (a: string) => a.slice(0, 6) + '...' + a.slice(-4);
const money = (n: number) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
const load = (): W[] => { try { return JSON.parse(localStorage.getItem('diction_wallets') || '[]'); } catch { return []; } };

export default function LiveFeed({ safeToSpend, onBalance }: { safeToSpend: number; onBalance: (n: number) => void }) {
  const [wallets, setWallets] = useState<W[]>(load);
  const [feed, setFeed] = useState<Item[]>([]);
  const [bals, setBals] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState('');
  const [suiWallets, setSuiWallets] = useState<any[]>([]);

  useEffect(() => {
    import('@mysten/wallet-standard').then((m) => {
      const api = m.getWallets();
      const find = () => setSuiWallets(api.get().filter((w: any) => w.features['standard:connect'] && Object.keys(w.features).some((k) => k.startsWith('sui:'))));
      find();
      api.on('register', find);
    }).catch(() => {});
  }, []);

  const add = (w: W) => {
    setWallets((prev) => {
      const next = prev.some((p) => p.address === w.address) ? prev : [...prev, w];
      try { localStorage.setItem('diction_wallets', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const connectSui = async (w: any) => {
    try { const r = await w.features['standard:connect'].connect(); add({ type: 'Sui', address: r.accounts[0].address }); setMsg(''); }
    catch (e: any) { setMsg('Could not connect: ' + (e?.message || 'cancelled')); }
  };
  const connectEvm = async () => {
    const eth = (window as any).ethereum;
    if (!eth) { setMsg('No EVM wallet found. If Diction is inside a preview frame, open it in its own tab.'); return; }
    try { const a = await eth.request({ method: 'eth_requestAccounts' }); add({ type: 'EVM', address: a[0] }); setMsg(''); }
    catch (e: any) { setMsg('Could not connect: ' + (e?.message || 'cancelled')); }
  };
  const remove = (addr: string) => {
    const next = wallets.filter((w) => w.address !== addr);
    setWallets(next);
    try { localStorage.setItem('diction_wallets', JSON.stringify(next)); } catch {}
  };

  useEffect(() => {
    if (!wallets.length) { setFeed([]); return; }
    let live = true;
    const poll = async () => {
      const items: Item[] = []; const b: Record<string, number> = {}; let err = '';
      for (const w of wallets) {
        try {
          const r = await fetch(`/api/wallet/${w.type.toLowerCase()}-activity`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: w.address }) });
          const d = await r.json();
          if (!d.success) { err = d.error; continue; }
          b[w.address] = d.balance;
          items.push(...d.feed.map((f: any) => ({ ...f, wallet: w.address })));
        } catch { err = 'Could not reach the server.'; }
      }
      if (!live) return;
      setBals(b); setFeed(items.sort((x, y) => y.ts - x.ts)); setMsg(err);
      if (Object.keys(b).length) onBalance(Object.values(b).reduce((s, n) => s + n, 0));
    };
    poll();
    const t = setInterval(poll, 15000);
    return () => { live = false; clearInterval(t); };
  }, [wallets]);

  const weekAgo = Date.now() - 7 * 864e5;
  const weekOut = feed.filter((f) => f.dir === 'out' && f.ts > weekAgo).reduce((s, f) => s + f.amount, 0);
  const over = weekOut > safeToSpend && weekOut > 0;
  const btn = 'inline-flex items-center rounded-lg border border-primary bg-primary px-lg py-sm min-h-[56px] text-sm font-semibold text-secondary';

  return (
    <section className="rounded-lg border border-secondary bg-primary p-lg shadow-xs flex flex-col gap-md">
      <h2 className="text-xl font-semibold text-primary">Your wallet, live</h2>
      {over && (
        <div style={{ background: '#FEF3F2', color: '#B42318', border: '1px solid #FDA29B' }} className="rounded-lg p-md font-semibold">
          Careful: you spent {money(weekOut)} from your wallet in the last 7 days, but only {money(safeToSpend)} is safe to spend. This may put your bills or paycheck at risk.
        </div>
      )}
      <div className="flex flex-wrap gap-sm">
        {suiWallets.map((w) => <button key={w.name} className={btn} onClick={() => connectSui(w)}>Connect {w.name} (Sui)</button>)}
        {!suiWallets.length && <span className="text-sm text-secondary self-center">No Sui wallet detected in this browser.</span>}
        <button className={btn} onClick={connectEvm}>Connect EVM wallet</button>
      </div>
      {msg && <p className="text-sm" style={{ color: '#B42318' }}>{msg}</p>}
      {wallets.map((w) => (
        <div key={w.address} className="flex items-center justify-between text-sm">
          <span>{w.type} {short(w.address)}: <b>{bals[w.address] === undefined ? 'loading...' : money(bals[w.address])}</b></span>
          <button className="text-secondary underline" onClick={() => remove(w.address)}>Disconnect</button>
        </div>
      ))}
      {wallets.length > 0 && (
        <ul className="flex flex-col gap-xs text-sm">
          {feed.length === 0 && <li className="text-secondary">No recent stablecoin transactions found.</li>}
          {feed.slice(0, 8).map((f) => (
            <li key={f.id} className="flex justify-between border-t border-secondary pt-xs">
              <span>{f.dir === 'in' ? 'Money in' : 'Money out'} · {new Date(f.ts).toLocaleString()}</span>
              <b style={{ color: f.dir === 'in' ? '#067647' : '#B42318' }}>{f.dir === 'in' ? '+' : '-'}{money(f.amount)} {f.coin}</b>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-secondary">Diction only watches. Your money stays in your wallet. Updates every 15 seconds.</p>
    </section>
  );
}
