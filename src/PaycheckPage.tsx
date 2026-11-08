import React, { useEffect, useState } from 'react';
import { Wallet, Calendar, TrendingUp, Sparkles, Check, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react';

const usd = (n: number) => '$' + Math.round(n).toLocaleString();
const ord = (n: number) =>
  n === 31 ? 'last day' : n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');

function nextPayday(day: number) {
  const now = new Date();
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const at = (y: number, m: number) => new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
  let d = at(t.getFullYear(), t.getMonth());
  if (d < t) d = at(t.getFullYear(), t.getMonth() + 1);
  return { d, left: Math.round((d.getTime() - t.getTime()) / 864e5) };
}

export default function PaycheckPage({
  target,
  setTarget,
  day,
  setDay,
  funded,
  showToast,
  onPay
}: {
  target: number;
  setTarget: (n: number) => void;
  day: number;
  setDay: (n: number) => void;
  funded: number;
  showToast: (m: string) => void;
  onPay: () => void;
}) {
  const [amt, setAmt] = useState(String(target));
  const [pd, setPd] = useState(day);

  useEffect(() => setAmt(String(target)), [target]);
  useEffect(() => setPd(day), [day]);

  const { d, left } = nextPayday(day);
  const pct = target > 0 ? Math.min(100, Math.round((funded / target) * 100)) : 0;
  const changed = Number(amt) !== target || pd !== day;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 mb-2">
            <TrendingUp className="size-3.5" />
            <span>Salary Smoothing Engine</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Personal Paycheck
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Turn irregular lump sums into a calm, steady salary paid on the exact same day every month.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-xs">
          <Calendar className="size-5 text-indigo-500" />
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Next Scheduled Payday</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {left === 0 ? 'Today' : `in ${left} day${left === 1 ? '' : 's'}`} ({ord(day)})
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Scheduled Paycheck Card */}
        <section
          className="lg:col-span-5 flex flex-col justify-between gap-6 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)'
          }}
        >
          <div className="absolute -top-16 -right-16 size-48 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xs">
                <Wallet className="size-6 text-white" />
              </span>
              <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold">
                {pct}% Funded
              </span>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Monthly Target Paycheck</p>
              <p className="text-4xl sm:text-5xl font-black tracking-tight mt-1">
                {usd(target)}
              </p>
              <p className="text-xs text-emerald-100 mt-1">
                Next payday: {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Funded Progress Bar */}
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/15 space-y-2">
              <div className="flex justify-between text-xs font-bold text-emerald-100">
                <span>Buffer Funding Progress</span>
                <span>{usd(Math.min(funded, target))} / {usd(target)}</span>
              </div>
              <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Pay Yourself Now Button with Glowing Hover */}
            <button
              onClick={onPay}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white text-slate-900 py-4 px-6 text-sm font-black shadow-lg hover:bg-slate-50 glow-btn"
            >
              <span>Pay Yourself Now</span>
              <ArrowRight className="size-4" />
            </button>
          </div>

          <p className="relative z-10 text-[11px] text-emerald-100/80">
            * Diction never moves money on its own. This prepares the transfer approval safely inside your connected wallet.
          </p>
        </section>

        {/* Right Column: Settings */}
        <section className="lg:col-span-7 flex flex-col justify-between gap-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Paycheck Settings</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Configure how much you want to pay yourself and on which day each month.
              </p>
            </div>

            {/* Monthly Amount Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Target Monthly Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={amt}
                  onChange={(e) => setAmt(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 py-3.5 text-base font-bold text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white min-h-[52px]"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Quick Presets
              </p>
              <div className="flex flex-wrap gap-2">
                {[1500, 2500, 3500, 5000, 7500].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmt(String(v))}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      Number(amt) === v
                        ? 'bg-emerald-600 text-white shadow-md glow-btn'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                    }`}
                  >
                    {usd(v)}
                  </button>
                ))}
              </div>
            </div>

            {/* Payday Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Day of the Month
              </label>
              <select
                value={pd}
                onChange={(e) => setPd(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base font-semibold text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white min-h-[52px]"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {ord(n)} of each month
                  </option>
                ))}
                <option value={31}>Last day of each month</option>
              </select>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={!changed || !(Number(amt) >= 0)}
              onClick={() => {
                setTarget(Number(amt) || 0);
                setDay(pd);
                showToast('Paycheck settings updated successfully.');
              }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 disabled:opacity-50 transition-all glow-btn"
            >
              {changed ? (
                <>
                  <span>Save Paycheck Rules</span>
                  <ArrowRight className="size-4" />
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  <span>Rules Saved</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
