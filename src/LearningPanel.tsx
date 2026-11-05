import React, { useState } from 'react';

export default function LearningPanel({ learning }: { learning: any }) {
  const names: string[] = learning.stats.map((s: any) => s.name);
  const [name, setName] = useState(names[0] || '');
  const [expected, setExpected] = useState('');
  const [received, setReceived] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const field = 'rounded-md bg-primary px-lg py-sm text-lg text-primary border border-primary min-h-[56px] w-full';

  const save = async () => {
    setBusy(true); setNote('');
    const s = await learning.record(name, received, expected || undefined);
    setNote(s === 'confirmed' ? 'Saved to Walrus. Diction has updated how much it trusts this client.' : s === 'skipped' ? 'Pick a client and a date first.' : 'Recorded. It will finish saving to Walrus shortly.');
    setBusy(false);
  };

  return (
    <section className="rounded-lg border border-secondary bg-primary p-lg shadow-xs flex flex-col gap-md">
      <h3 className="text-xl font-semibold text-primary">How Diction is learning your clients</h3>
      <p className="text-lg text-secondary">Every payment timing is saved to Walrus. It changes how much expected income counts toward your safe-to-spend number.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-lg">
          <thead><tr className="text-sm text-secondary"><th className="py-sm pr-md">Client</th><th className="pr-md">Payments seen</th><th className="pr-md">Usually late by</th><th>Trust</th></tr></thead>
          <tbody>
            {learning.stats.map((s: any) => (
              <tr key={s.name} className="border-t border-secondary">
                <td className="py-sm pr-md font-semibold text-primary">{s.name}</td>
                <td className="pr-md text-secondary">{s.n}</td>
                <td className="pr-md text-secondary">{s.avgLag} days</td>
                <td className="font-semibold text-primary">{Math.round(s.before * 100)}% → {Math.round(s.after * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-sm sm:grid-cols-3">
        <label className="flex flex-col gap-xs text-sm font-medium text-secondary">Client
          <select className={field} value={name} onChange={(e) => setName(e.target.value)}>{names.map((n) => <option key={n}>{n}</option>)}</select>
        </label>
        <label className="flex flex-col gap-xs text-sm font-medium text-secondary">Date it was due (optional)
          <input type="date" className={field} value={expected} onChange={(e) => setExpected(e.target.value)} />
        </label>
        <label className="flex flex-col gap-xs text-sm font-medium text-secondary">Date it was paid
          <input type="date" className={field} value={received} onChange={(e) => setReceived(e.target.value)} />
        </label>
      </div>
      <button onClick={save} disabled={busy} className="inline-flex items-center justify-center rounded-lg bg-brand-solid px-lg py-sm min-h-[56px] text-lg font-semibold text-primary-on-brand hover:bg-brand-solid-hover disabled:opacity-60">
        {busy ? 'Saving to Walrus...' : 'Record payment timing'}
      </button>
      {note && <p className="text-lg text-secondary">{note}</p>}
    </section>
  );
}
