import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

const tone = (v: number) =>
  v >= 0.75
    ? 'var(--color-text-success-primary, #067647)'
    : v >= 0.5
    ? 'var(--color-text-warning-primary, #B54708)'
    : 'var(--color-text-error-primary, #B42318)';

export default function LearningPanel({ learning }: { learning: any }) {
  const names: string[] = learning.stats.map((s: any) => s.name);
  const [name, setName] = useState(names[0] || '');
  const [expected, setExpected] = useState('');
  const [received, setReceived] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const field =
    'rounded-xl bg-primary px-lg py-sm text-md text-primary border border-primary min-h-[52px] w-full focus-visible:ring-2 focus-visible:ring-focus-ring';

  const save = async () => {
    setBusy(true);
    setNote('');
    const s = await learning.record(name, received, expected || undefined);
     setNote(s === 'confirmed' ? 'Saved to Walrus. Diction has updated how much it trusts this client.' : s === 'skipped' ? 'Pick a client and a date first.' : s.startsWith('error') ? 'Could not save: ' + s.slice(7) : 'Recorded. It will finish saving to Walrus shortly.');
    setBusy(false);
  };

  return (
    <section className="rounded-2xl border border-secondary bg-primary p-lg shadow-xs flex flex-col gap-lg">
      <div>
        <h3 className="text-xl font-semibold text-primary">How Diction is learning your clients</h3>
        <p className="mt-xs text-md text-tertiary">
          Every payment timing is saved to Walrus. It changes how much expected income counts toward your safe-to-spend number.
        </p>
      </div>

      <ul className="flex flex-col gap-sm">
        {learning.stats.map((s: any) => {
          const pct = Math.round(s.after * 100);
          const was = Math.round(s.before * 100);
          return (
            <li key={s.name} className="rounded-xl border border-secondary bg-secondary p-md">
              <div className="flex items-start justify-between gap-md">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-primary">{s.name}</p>
                  <p className="text-sm text-tertiary">
                    {s.n} {s.n === 1 ? 'payment' : 'payments'} seen ·{' '}
                    {s.avgLag > 0 ? `usually ${s.avgLag} days late` : 'usually on time'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xl font-bold leading-none" style={{ color: tone(s.after) }}>{pct}%</p>
                  <p className="mt-xxs text-xs text-tertiary">{was !== pct ? `was ${was}%` : 'trust'}</p>
                </div>
              </div>
              <div className="mt-sm h-2 w-full overflow-hidden rounded-full bg-primary">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.max(4, pct)}%`, background: tone(s.after) }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-secondary pt-lg flex flex-col gap-md">
        <p className="text-md font-semibold text-primary">Record a payment</p>
        <div className="grid gap-md sm:grid-cols-3">
          <label className="flex flex-col gap-xs text-sm font-medium text-secondary">
            Client
            <select className={field} value={name} onChange={(e) => setName(e.target.value)}>
              {names.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-xs text-sm font-medium text-secondary">
            Date it was due (optional)
            <input type="date" className={field} value={expected} onChange={(e) => setExpected(e.target.value)} />
          </label>
          <label className="flex flex-col gap-xs text-sm font-medium text-secondary">
            Date it was paid
            <input type="date" className={field} value={received} onChange={(e) => setReceived(e.target.value)} />
          </label>
        </div>
        <button
          onClick={save}
          disabled={busy}
          className="inline-flex items-center justify-center rounded-xl bg-brand-solid px-lg py-sm min-h-[52px] text-md font-semibold text-primary-on-brand hover:bg-brand-solid-hover disabled:opacity-60"
        >
          {busy ? 'Saving to Walrus...' : 'Record payment timing'}
        </button>
        {note && <p className="rounded-lg bg-secondary p-md text-md text-secondary">{note}</p>}
      </div>
    </section>
  );
}

const LABEL: Record<string, string> = {
  client_lag: 'Payment timing',
  user_note: 'Your note',
  payment_received: 'Payment received',
};

const fmt = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

function tidy(m: any) {
  const raw = String(m.text || '');
  const tag = /^\[([a-z_]+)\]\s*/i.exec(raw);
  const type = tag?.[1] || m.type || 'note';
  let body = raw.replace(/^\[[a-z_]+\]\s*/i, '');
  let detail = '';
  const x = /\s*PAYMENT_LAG client=(.+?) expected=(\d{4}-\d{2}-\d{2}) received=(\d{4}-\d{2}-\d{2}) lag=(-?\d+)\s*$/.exec(body);
  if (x) {
    body = body.slice(0, x.index).trim();
    detail = `Due ${fmt(x[2])} · Paid ${fmt(x[3])}`;
  }
  body = body.replace(/^Client payment:\s*/, '');
  return { type, label: LABEL[type] || type.replace(/_/g, ' '), body, detail };
}

export function MemoryFeed({ memories, onDelete }: { memories: any[]; onDelete: (id: string) => void }) {
  const [all, setAll] = useState(false);
  const shown = all ? memories : memories.slice(0, 5);

  if (memories.length === 0) {
    return (
      <div className="rounded-2xl border border-secondary bg-primary p-xl text-center text-md text-secondary">
        No memories saved yet. Log payments and teach Diction your client habits.
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-md">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">Saved memories ({memories.length})</h3>
      </div>
      <ul className="flex flex-col gap-sm">
        {shown.map((m) => {
          const t = tidy(m);
          const saved = m.status === 'confirmed';
          return (
            <li key={m.id} className="flex items-start gap-md rounded-2xl border border-secondary bg-primary p-lg shadow-xs">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-sm">
                  <span className="rounded-full border border-secondary bg-secondary px-md py-xxs text-xs font-semibold text-secondary">
                    {t.label}
                  </span>
                  <span className="text-xs text-tertiary">{fmt(m.createdAt)}</span>
                  <span
                    className={`inline-flex items-center rounded-full border px-md py-xxs text-xs font-medium ${
                      saved
                        ? 'border-utility-success-200 bg-utility-success-50 text-utility-success-700'
                        : 'border-utility-warning-200 bg-utility-warning-50 text-utility-warning-700'
                    }`}
                  >
                    {saved ? 'Saved' : 'Saving…'}
                  </span>
                </div>
                <p className="mt-sm break-words text-md font-semibold text-primary">{t.body}</p>
                {t.detail && <p className="mt-xxs text-sm text-tertiary">{t.detail}</p>}
              </div>
              <button
                onClick={() => onDelete(m.id)}
                aria-label="Delete this memory"
                title="Delete this memory"
                className="shrink-0 rounded-md p-sm text-tertiary hover:text-error-primary"
              >
                <Trash2 className="size-5" />
              </button>
            </li>
          );
        })}
      </ul>
      {memories.length > 5 && (
        <button
          onClick={() => setAll(!all)}
          className="self-center rounded-full border border-primary bg-primary px-lg py-sm text-sm font-semibold text-secondary shadow-xs hover:bg-primary-hover"
        >
          {all ? 'Show less' : `Show all ${memories.length}`}
        </button>
      )}
    </section>
  );
}
