import React, { useState } from 'react';

export default function LearningPanel({ learning }: { learning: any }) {
  const names: string[] = learning.stats.map((s: any) => s.name);
  const today = new Date().toISOString().slice(0, 10);
  const [cName, setCName] = useState('');
  const [cAmount, setCAmount] = useState('');
  const [cDue, setCDue] = useState('today');
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
      if (!cName.trim()) { setNote('Please enter the client or company name.'); return; }
     if (!(a > 0)) { setNote('Please enter an amount above zero.'); return; }
     if (!cDue) { setNote('Please pick a valid due date. Check the day exists, for example November has only 30 days.'); return; };
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

const pretty = (d: string) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export function MemoryFeed({ memories, onDelete }: { memories: any[]; onDelete: (id: string) => void }) {
  const items = memories || [];
  return (
    <section className="flex flex-col gap-md">
      <h3 className="text-xl font-semibold text-primary">Saved memories ({items.length})</h3>
      {items.length === 0 && (
        <div className="rounded-lg border border-secondary bg-primary p-lg text-center text-lg text-secondary">
          No memories saved yet. Log payments and teach Diction your client habits.
        </div>
      )}
      {items.map((m) => {
        const lag = /PAYMENT_LAG client=(.+?) expected=(\d{4}-\d{2}-\d{2}) received=(\d{4}-\d{2}-\d{2}) lag=(-?\d+)/.exec(m.text || '');
        const clean = (m.text || '').replace(/^\[[^\]]*\]\s*/, '');
        const n = lag ? Number(lag[4]) : 0;
        const title = lag ? `${lag[1]} paid ${n > 0 ? n + ' days late' : n < 0 ? -n + ' days early' : 'on time'}.` : clean;
        const saved = m.status === 'confirmed';
        return (
          <div key={m.id} className="flex items-start justify-between gap-md rounded-lg border border-secondary bg-primary p-lg">
            <div className="flex flex-col gap-xs">
              <div className="flex flex-wrap items-center gap-sm text-sm text-secondary">
                <span className="rounded-full border border-secondary px-md py-xs font-semibold">{lag ? 'Payment timing' : 'Your note'}</span>
                {m.createdAt && <span>{pretty(String(m.createdAt).slice(0, 10))}</span>}
                <span className="rounded-full px-md py-xs font-semibold" style={saved ? { background: '#ECFDF3', color: '#067647' } : { background: '#FFFAEB', color: '#B54708' }}>
                  {saved ? 'Saved' : m.status === 'failed' ? 'Not saved' : 'Saving...'}
                </span>
              </div>
              <p className="text-lg font-semibold text-primary">{title}</p>
              {lag && <p className="text-sm text-secondary">Due {pretty(lag[2])} · Paid {pretty(lag[3])}</p>}
            </div>
            <button onClick={() => onDelete(m.id)} className="min-h-[44px] rounded-lg px-md text-sm font-semibold text-secondary hover:bg-primary-hover">Remove</button>
          </div>
        );
      })}
    </section>
  );
}
