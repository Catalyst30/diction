import React, { useState } from 'react';

const trustColor = (t: number) => (t >= 0.8 ? '#12B76A' : t >= 0.5 ? '#F79009' : '#F04438');

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
  const [addNote, setAddNote] = useState('');
  const [recNote, setRecNote] = useState('');
  const field = 'rounded-xl bg-primary px-lg py-sm text-base text-primary border border-primary min-h-[52px] w-full';
  const lab = 'flex flex-col gap-xs text-xs font-bold uppercase tracking-wider text-secondary';
  const primary = 'inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-lg py-sm min-h-[52px] text-base font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 disabled:opacity-60 transition-all glow-btn';

  const addClient = () => {
    const a = Number(cAmount);

    if (!cName.trim()) { setAddNote('Please enter the client or company name.'); return; }
    if (!(a > 0)) { setAddNote('Please enter an amount above zero.'); return; }
    if (!cDue) { setAddNote('Please pick a valid due date. Check the day exists, for example November has only 30 days.'); return; }

    learning.add({ client: cName.trim(), amount: a, expectedDate: cDue, duration: cDur });
    setCName(''); setCAmount(''); setCDue(''); setAddNote('Client added.');
  };

  const record = async () => {
    const who = name || names[0];
    if (!who) { setRecNote('Add a client first.'); return; }
    setBusy(true); setRecNote('');
    const s = await learning.record(who, received, expected || undefined);
    setRecNote(s === 'confirmed' ? 'Saved to Walrus. Diction has updated how much it trusts this client.' : s === 'skipped' ? 'Pick a client and a date first.' : s.startsWith('error') ? 'Could not save: ' + s.slice(7) : 'Recorded. It will finish saving to Walrus shortly.');
    setBusy(false);
  };

  const lateText = (s: any) =>
    s.n === 0 && !s.avgLag ? 'no payment history yet'
      : s.avgLag > 0 ? `usually ${s.avgLag} days late`
      : s.avgLag < 0 ? `usually ${-s.avgLag} days early`
      : 'usually on time';

  return (
    <div className="flex flex-col gap-md">
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
          {addNote && <p className="text-lg text-secondary">{addNote}</p>}
        </div>
      </section>

      <section className="rounded-lg border border-secondary bg-primary p-lg shadow-xs flex flex-col gap-md">
        <h3 className="text-xl font-semibold text-primary">Your clients</h3>

        {names.length === 0 && <p className="text-lg text-secondary">No clients yet. Add your first client above.</p>}

        {names.length > 0 && (
          <>
            <div className="flex flex-col gap-sm">
              {learning.stats.map((s: any) => {
                const t = s.after as number;
                const color = trustColor(t);
                return (
                  <div key={s.name} className="rounded-lg border border-secondary bg-secondary p-md flex flex-col gap-sm">
                    <div className="flex items-start justify-between gap-md">
                      <div className="min-w-0">
                        <p className="truncate text-xl font-semibold text-primary">{s.name}</p>
                        <p className="text-lg text-secondary">{s.n} payment{s.n === 1 ? '' : 's'} seen · {lateText(s)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-2xl font-bold" style={{ color }}>{Math.round(t * 100)}%</p>
                        <p className="text-sm text-secondary">trust</p>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'rgba(127,127,127,.25)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.round(t * 100)}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-secondary pt-md flex flex-col gap-sm">
              <p className="text-lg font-semibold text-primary">Record a payment</p>
              <div className="grid gap-sm sm:grid-cols-3">
                <label className={lab}>Client
                  <select className={field} value={name || names[0]} onChange={(e) => setName(e.target.value)}>{names.map((n) => <option key={n}>{n}</option>)}</select>
                </label>
                <label className={lab}>Date it was due (optional)<input type="date" className={field} value={expected} onChange={(e) => setExpected(e.target.value)} /></label>
                <label className={lab}>Date it was paid<input type="date" className={field} value={received} onChange={(e) => setReceived(e.target.value)} /></label>
              </div>
              <button onClick={record} disabled={busy} className={primary}>{busy ? 'Saving to Walrus...' : 'Record payment timing'}</button>
              {recNote && <p className="rounded-lg bg-secondary px-lg py-sm text-lg text-secondary">{recNote}</p>}
            </div>
          </>
        )}
      </section>
    </div>
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
