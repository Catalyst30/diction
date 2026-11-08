import React, { useEffect, useState } from 'react';
import { taxFor } from './taxRates';
import { Lock, Sparkles, Shield, Calculator, Check, ArrowRight, TrendingDown } from 'lucide-react';

const usd = (n: number) => '$' + Math.round(n).toLocaleString();

export default function TaxPage({
  taxRate,
  setTaxRate,
  taxSetAside,
  country,
  showToast
}: {
  taxRate: number;
  setTaxRate: (n: number) => void;
  taxSetAside: number;
  country: string;
  showToast: (m: string) => void;
}) {
  const [draft, setDraft] = useState(taxRate);
  const [sampleIncome, setSampleIncome] = useState(1000);
  useEffect(() => setDraft(taxRate), [taxRate]);
  const defaultCountryRate = taxFor(country);

  const sampleTax = Math.round(sampleIncome * (draft / 100));
  const sampleTakeHome = sampleIncome - sampleTax;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40 mb-2">
            <Lock className="size-3.5" />
            <span>Automated Tax Quarantine</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Tax Set Aside
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Diction automatically earmarks your estimated tax percentage the moment client payments land, protecting you from year-end tax debt.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-xs">
          <Shield className="size-5 text-emerald-500" />
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Country</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white">{country || 'Global Standard'}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Current Quarantined Vault Card */}
        <section
          className="lg:col-span-5 flex flex-col justify-between gap-6 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)'
          }}
        >
          <div className="absolute -top-16 -right-16 size-48 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xs">
                <Lock className="size-6 text-white" />
              </span>
              <span className="rounded-full bg-emerald-400/20 border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-300">
                Active Quarantine
              </span>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Total Tax Quarantined</p>
              <p className="text-4xl sm:text-5xl font-black tracking-tight mt-1">
                {usd(taxSetAside)}
              </p>
              <p className="text-xs text-indigo-200 mt-1">
                {taxRate}% reserved from all processed earnings
              </p>
            </div>

            {/* Live Calculation Preview Box */}
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/15 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-200">
                <span>SIMULATOR ({usd(sampleIncome)} INVOICE)</span>
                <Calculator className="size-4" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-[10px] uppercase font-bold text-rose-300">Quarantined Tax</p>
                  <p className="text-lg font-black text-rose-200">-{usd(sampleTax)}</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-[10px] uppercase font-bold text-emerald-300">Safe Take-Home</p>
                  <p className="text-lg font-black text-emerald-200">+{usd(sampleTakeHome)}</p>
                </div>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-[11px] text-indigo-200/80">
            * Estimates for personal financial planning only. Consult a local tax certified professional for statutory filings.
          </p>
        </section>

        {/* Right Column: Rate Adjustment & Benchmarks */}
        <section className="lg:col-span-7 flex flex-col justify-between gap-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Adjust Tax Rate</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Slide or pick a benchmark rate. Future payments will follow this percentage.
                </p>
              </div>

              <div className="flex items-baseline gap-1 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 px-4 py-2 text-indigo-600 dark:text-indigo-400">
                <span className="text-3xl font-black tracking-tight">{draft}</span>
                <span className="text-sm font-bold">%</span>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <input
                type="range"
                min={0}
                max={50}
                value={draft}
                onChange={(e) => setDraft(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                aria-label="Tax rate slider"
              />
              <div className="flex justify-between text-[11px] font-bold text-slate-400">
                <span>0% (Tax Free)</span>
                <span>25% (Standard)</span>
                <span>50% (High Bracket)</span>
              </div>
            </div>

            {/* Quick Benchmark Pills */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Common Freelance Benchmarks
              </p>
              <div className="flex flex-wrap gap-2">
                {[10, 15, 20, 25, 30, 35].map((r) => (
                  <button
                    key={r}
                    onClick={() => setDraft(r)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      draft === r
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 glow-btn'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                    }`}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>

            {/* Use Country Estimate Button */}
            <button
              onClick={() => setDraft(defaultCountryRate)}
              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <Sparkles className="size-3.5" />
              <span>Reset to {country} benchmark ({defaultCountryRate}%)</span>
            </button>
          </div>

          {/* Action Button with Glowing Stroke */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={draft === taxRate}
              onClick={() => {
                setTaxRate(draft);
                showToast('Tax rate updated successfully.');
              }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 disabled:opacity-50 transition-all glow-btn"
            >
              {draft === taxRate ? (
                <>
                  <Check className="size-4" />
                  <span>Current Rate Active ({taxRate}%)</span>
                </>
              ) : (
                <>
                  <span>Save New Rate ({draft}%)</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
