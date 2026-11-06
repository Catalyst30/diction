import React, { useState } from 'react';

export default function LearningPanel({ learning }: { learning: any }) {
  const names: string[] = learning.stats.map((s: any) => s.name);
  const today = new Date().toISOString().slice(0, 10);
  const [cName, setCName] = useState('');
  const [cAmount, setCAmount] = useState('');
  const [cDue, setCDue] = useState('');
  const [cDur, setCDur] = useState('One-time');
  const [name, setName] = useState('');
  const [expected, setExpected] = useState('');
  const [received, setReceived] = useState(today);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const field = 'rounded-md bg-primary px-lg py-sm text-lg text-primary border border-primary min-h-[56px] w-full';
  const lab = 'flex flex-col gap-xs text-sm font-medium text-secondary';
  const primary = 'inline-flex items-center justify-center rounded-lg bg-brand-solid px-lg py-sm min-h-[56px] text-lg font-semibold text-primary-on-brand disabled:opacity-60';

  const addClient = () => {
    const a = Number(cAmount);
    if (!cName.trim() || !(a > 0) || !cDue) { setNote('Enter the client name, an amount above zero and the due date.'); return; }
    learning.add({ client: cName.trim(), amount: a, expectedDate: cDue, duration: cDur });
    setCName(''); setCAmount(''); setCDue(''); setNote('Client added.');
  };
  const record = async () => {
    const who = name || names[0];
    if (!who) { setNote('Add a client first.'); return; }
    setBusy(true); setNote('');
    const s = await learning.record(who, received, expected || undefined);
    setNote(s === 'confirmed' ? 'Saved to Walrus. Diction has updated how much it trusts this client.' : s === 'skipped' ? 'Pick a client and a date first.' : s.startsWith('error') ? 'Could not save: ' + s.slice(7) : 'Recorded. It will finish saving to Walrus shortly.');
    setBusy(false);
  };

  return (
    <section className="rounded-lg border border-secondary bg-primary p-lg shadow-xs flex flex-col gap-md">
      <h3 className="text-xl font-semibold text-primary">How Diction is learning your clients</h3>
      <p className="text-lg text-secondary">Every payment timing is saved to Walrus. It changes how much expected income counts toward your safe-to-spend number.</p>

      <div className="rounded-lg border border-secondary bg-secondary p-md flex flex-col gap-sm">
        <p className="text-lg font-semibold text-primary">Add a client</p>
        <div className="grid gap-sm sm:grid-cols-2">
          <label className={lab}>Client or company name<input className={field} value={cName} onChange={(e) => setCName(e.target.value)} /></label>
          <label className={lab}>Amount ($)<input className={field} type="number" min="0" value={cAmount} onChange={(e) => setCAmount(e.target.value)} /></label>
          <label className={lab}>Due date<input className={field} type="date" value={cDue} onChange={(e) => setCDue(e.target.value)} /></label>
          <label className={lab}>How often they pay you
            <select className={field} value={cDur} onChange={(e) => setCDur(e.target.value)}><option>One-time</option><option>Weekly</option><option>Monthly</option></select>
          </label>
        </div>
        <button onClick={addClient} className={primary}>Add client</button>
      </div>

      {names.length === 0 && <p className="text-lg text-secondary">No clients yet. Add your first client above.</p>}
      {names.length > 0 && (
        <>
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
          <p className="text-lg font-semibold text-primary">Record when a client paid</p>
          <div className="grid gap-sm sm:grid-cols-3">
            <label className={lab}>Client
              <select className={field} value={name || names[0]} onChange={(e) => setName(e.target.value)}>{names.map((n) => <option key={n}>{n}</option>)}</select>
            </label>
            <label className={lab}>Date it was due (optional)<input type="date" className={field} value={expected} onChange={(e) => setExpected(e.target.value)} /></label>
            <label className={lab}>Date it was paid<input type="date" className={field} value={received} onChange={(e) => setReceived(e.target.value)} /></label>
          </div>
          <button onClick={record} disabled={busy} className={primary}>{busy ? 'Saving to Walrus...' : 'Record payment timing'}</button>
        </>
      )}
      {note && <p className="text-lg text-secondary">{note}</p>}
    </section>
  );
}
