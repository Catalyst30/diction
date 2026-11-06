import React, { useEffect, useState } from 'react';

const GRAD = 'linear-gradient(145deg, #312E81 0%, #4F46E5 60%, #818CF8 100%)';
const usd = (n: number) => '$' + Math.round(n).toLocaleString();
const ord = (n: number) => (n === 31 ? 'last day' : n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'));

function nextPayday(day: number) {
  const now = new Date();
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const at = (y: number, m: number) => new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
  let d = at(t.getFullYear(), t.getMonth());
  if (d < t) d = at(t.getFullYear(), t.getMonth() + 1);
  return { d, left: Math.round((d.getTime() - t.getTime()) / 864e5) };
}

export default function PaycheckPage({ target, setTarget, day, setDay, funded, showToast, onPay }: {
  target: number; setTarget: (n: number) => void; day: number; setDay: (n: number) => void; funded: number; showToast: (m: string) => void; onPay: () => void;
}) {
  const [amt, setAmt] = useState(String(target));
  const [pd, setPd] = useState(day);
  useEffect(() => setAmt(String(target)), [target]);
  useEffect(() => setPd(day), [day]);
  const { d, left } = nextPayday(day);
  const pct = target > 0 ? Math.min(100, Math.round((funded / target) * 100)) : 0;
  const changed = Number(amt) !== target || pd !== day;
  const field = 'w-full rounded-lg border border-primary bg-primary px-lg py-sm min-h-[56px] text-lg text-primary';
  return (
    <div className="space-y-xl">
      <div>
        <h2 className="text-heading-sm font-semibold text-primary">My Personal Paycheck</h2>
        <p className="text-md text-tertiary">Your buffer turns irregular lump sums into a steady salary, paid on the same day every month.</p>
      </div>
      <div className="grid gap-lg lg:grid-cols-2">
        <section className="flex flex-col gap-lg rounded-xl p-xl shadow-xs" style={{ background: GRAD, color: '#fff' }}>
          <div>
            <p className="text-sm font-semibold uppercase" style={{ opacity: 0.8 }}>Your next paycheck</p>
            <p className="text-5xl font-bold">{usd(target)}</p>
            <p className="text-lg" style={{ opacity: 0.9 }}>{d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {left === 0 ? 'today' : `in ${left} day${left === 1 ? '' : 's'}`}</p>
          </div>
          <div>
            <div className="mb-xs flex justify-between text-sm font-semibold"><span>Set aside so far</span><span>{usd(Math.min(funded, target))} of {usd(target)} ({pct}%)</span></div>
            <div className="h-3 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,.25)' }}><div className="h-3 rounded-full" style={{ width: pct + '%', background: '#fff' }} /></div>
          </div>
          <button onClick={onPay} className="min-h-[56px] rounded-lg px-lg py-sm text-lg font-semibold" style={{ background: '#fff', color: '#312E81' }}>Pay yourself now</button>
          <p className="text-sm" style={{ opacity: 0.75 }}>Prepares the transfer in your own wallet. Diction never moves money on its own.</p>
        </section>

        <section className="flex flex-col gap-md rounded-xl border border-secondary bg-primary p-xl shadow-xs">
          <h3 className="text-xl font-semibold text-primary">Paycheck settings</h3>
          <label className="flex flex-col gap-xs text-sm font-semibold text-secondary">Monthly amount
            <span className="relative block">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-secondary">$</span>
              <input className={field + ' pl-10'} type="number" min="0" value={amt} onChange={(e) => setAmt(e.target.value)} />
            </span>
          </label>
          <div className="flex flex-wrap gap-sm">
            {[500, 1000, 2000, 3000, 5000].map((v) => (
              <button key={v} onClick={() => setAmt(String(v))} className="min-h-[44px] rounded-full border border-primary px-lg text-lg font-semibold text-primary" style={Number(amt) === v ? { background: '#4F46E5', color: '#fff', borderColor: '#4F46E5' } : {}}>{usd(v)}</button>
            ))}
          </div>
          <label className="flex flex-col gap-xs text-sm font-semibold text-secondary">Payday
            <select className={field} value={pd} onChange={(e) => setPd(Number(e.target.value))}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{ord(n)} of the month</option>)}
              <option value={31}>Last day of the month</option>
            </select>
          </label>
          <p className="text-lg text-secondary">Diction will keep {usd(Number(amt) || 0)} ready so you can pay yourself on the {ord(pd)} of each month.</p>
          <button
            disabled={!changed || !(Number(amt) >= 0)}
            onClick={() => { setTarget(Number(amt) || 0); setDay(pd); showToast('Paycheck rules saved.'); }}
            className="min-h-[56px] rounded-lg px-lg py-sm text-lg font-semibold disabled:opacity-50"
            style={{ background: '#4F46E5', color: '#fff' }}
          >
            {changed ? 'Save paycheck rules' : 'Saved'}
          </button>
        </section>
      </div>
    </div>
  );
}
