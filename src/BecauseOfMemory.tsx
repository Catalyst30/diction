import React from 'react';

const down = { color: 'var(--color-text-error-primary, #B42318)' };
const up = { color: 'var(--color-text-success-primary, #067647)' };

export default function BecauseOfMemory({ learning }: { learning: any }) {
  const rows = learning.stats.filter((s: any) => s.n > 0);
  return (
    <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs flex flex-col gap-md">
      <h3 className="text-xl font-semibold text-primary">Because of what Diction remembers</h3>
      {rows.length === 0 && (
        <p className="text-lg text-secondary">Diction hasn't learned anything about your clients yet. When a client pays, record how late or early it was under "What Diction Learned", and this card will show how it changes your forecast.</p>
      )}
      {rows.map((s: any) => {
        const now = Math.round(s.amount * s.after);
        const was = Math.round(s.amount * s.before);
        const lower = s.after < s.before;
        return (
          <div key={s.name} className="rounded-lg border border-secondary bg-secondary p-lg">
            <p className="text-lg font-semibold text-primary">{s.name}</p>
            <p className="text-lg text-secondary">
              On a ${s.amount.toLocaleString()} invoice, Diction now expects{' '}
              <b style={lower ? down : up}>${now.toLocaleString()}</b> instead of ${was.toLocaleString()}, because{' '}
              {s.n} saved {s.n > 1 ? 'memories show' : 'memory shows'} they usually pay {s.avgLag > 2 ? `${s.avgLag} days late` : 'on time'}.
            </p>
            <p className="text-sm text-secondary">Trust: {Math.round(s.before * 100)}% → <b style={lower ? down : up}>{Math.round(s.after * 100)}%</b></p>
          </div>
        );
      })}
      <p className="text-sm text-secondary">These memories are stored on Walrus, so this survives a refresh.</p>
    </section>
  );
}
