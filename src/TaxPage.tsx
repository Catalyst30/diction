import React, { useEffect, useState } from 'react';
import { taxFor } from './taxRates';

const GRAD = 'linear-gradient(145deg, #312E81 0%, #4F46E5 60%, #818CF8 100%)';
const usd = (n: number) => '$' + Math.round(n).toLocaleString();

export default function TaxPage({ taxRate, setTaxRate, taxSetAside, country, showToast }: {
  taxRate: number; setTaxRate: (n: number) => void; taxSetAside: number; country: string; showToast: (m: string) => void;
}) {
  const [draft, setDraft] = useState(taxRate);
  useEffect(() => setDraft(taxRate), [taxRate]);
  const def = taxFor(country);
  const chip = (on: boolean) => ({ background: on ? '#4F46E5' : 'transparent', color: on ? '#fff' : undefined, borderColor: on ? '#4F46E5' : undefined });
  return (
    <div className="space-y-xl">
      <div>
        <h2 className="text-heading-sm font-semibold text-primary">Tax Set Aside</h2>
        <p className="text-md text-tertiary">We take your estimated tax out of every payment as it lands, so you are never surprised.</p>
      </div>
      <div className="grid gap-lg lg:grid-cols-2">
        <section className="flex flex-col justify-between gap-lg rounded-xl p-xl shadow-xs" style={{ background: GRAD, color: '#fff' }}>
          <div>
            <p className="text-sm font-semibold uppercase" style={{ opacity: 0.8 }}>Set aside for taxes</p>
            <p className="text-5xl font-bold">{usd(taxSetAside)}</p>
            <span className="mt-sm inline-block rounded-full px-lg py-xs text-sm font-semibold" style={{ background: 'rgba(255,255,255,.2)' }}>{taxRate}% of every payment</span>
          </div>
          <div className="rounded-lg p-md" style={{ background: 'rgba(255,255,255,.14)' }}>
            <p className="text-sm" style={{ opacity: 0.85 }}>On a $1,000 payment</p>
            <p className="text-lg font-semibold">{usd(10 * taxRate)} goes to tax · {usd(1000 - 10 * taxRate)} is yours</p>
          </div>
          <p className="text-sm" style={{ opacity: 0.75 }}>Estimate only, not tax advice.</p>
        </section>

        <section className="flex flex-col gap-md rounded-xl border border-secondary bg-primary p-xl shadow-xs">
          <h3 className="text-xl font-semibold text-primary">Your tax rate</h3>
          <p className="text-lg text-secondary">Move the slider or pick a quick rate. Future payments follow it.</p>
          <p className="text-center text-6xl font-bold" style={{ color: '#4F46E5' }}>{draft}%</p>
          <input type="range" min={0} max={50} value={draft} onChange={(e) => setDraft(Number(e.target.value))} className="w-full" style={{ accentColor: '#4F46E5' }} aria-label="Tax rate" />
          <div className="flex flex-wrap gap-sm">
            {[5, 10, 15, 20, 25, 30].map((r) => (
              <button key={r} onClick={() => setDraft(r)} className="min-h-[44px] rounded-full border border-primary px-lg text-lg font-semibold text-primary" style={chip(draft === r)}>{r}%</button>
            ))}
          </div>
          <button onClick={() => setDraft(def)} className="w-fit text-lg font-semibold underline" style={{ color: '#4F46E5' }}>Use the {country || 'country'} estimate ({def}%)</button>
          <button
            disabled={draft === taxRate}
            onClick={() => { setTaxRate(draft); showToast('Tax rate saved.'); }}
            className="min-h-[56px] rounded-lg px-lg py-sm text-lg font-semibold disabled:opacity-50"
            style={{ background: '#4F46E5', color: '#fff' }}
          >
            {draft === taxRate ? 'Saved' : 'Save tax rate'}
          </button>
        </section>
      </div>
    </div>
  );
}
