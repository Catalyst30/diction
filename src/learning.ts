import { useMemo } from 'react';

const TAG = /PAYMENT_LAG client=(.+?) expected=(\d{4}-\d{2}-\d{2}) received=(\d{4}-\d{2}-\d{2}) lag=(-?\d+)/;
const key = (s: string) => s.trim().toLowerCase();
const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

function score(lags: number[]) {
  const avg = lags.reduce((s, l) => s + l, 0) / lags.length;
  const onTime = lags.filter((l) => l <= 2).length / lags.length;
  return { avg: Math.round(avg), score: Math.min(0.95, Math.max(0.2, onTime * 0.7 + 0.3 * Math.max(0, 1 - avg / 30))) };
}

export function useLearning(base: any[], setBase: (f: (p: any[]) => any[]) => void, memories: any[], setMemories: (f: (p: any[]) => any[]) => void) {
  const seen = new Set<string>();
  const obs: { client: string; lag: number }[] = [];
  for (const m of memories) {
    const x = TAG.exec(m.text || '');
    const id = m.blobId || m.id;
    if (!x || m.status === 'failed' || seen.has(id)) continue;
    seen.add(id);
    obs.push({ client: x[1], lag: Number(x[4]) });
  }

  const clients = useMemo(() => base.map((c) => {
    const lags = obs.filter((o) => key(o.client) === key(c.client)).map((o) => o.lag);
    if (!lags.length) return c;
    const r = score(lags);
    const w = Math.min(1, lags.length / 3); // trust the evidence more as it builds up
    return { ...c, historicalLagDays: r.avg, reliabilityScore: Math.round((c.reliabilityScore * (1 - w) + r.score * w) * 100) / 100 };
  }), [base, memories]);

  const stats = base.map((c, i) => {
    const lags = obs.filter((o) => key(o.client) === key(c.client)).map((o) => o.lag);
    return { name: c.client, n: lags.length, avgLag: lags.length ? score(lags).avg : c.historicalLagDays, before: c.reliabilityScore, after: clients[i].reliabilityScore, amount: c.amount };
  });

  const record = async (name: string, received: string, expected?: string): Promise<string> => {
    const c = base.find((x) => key(x.client) === key(name));
    const exp = expected || c?.expectedDate;
    if (!exp) return 'skipped';
    const lag = days(exp, received);
    const when = lag > 0 ? `${lag} days late` : lag < 0 ? `${-lag} days early` : 'on time';
    const text = `Client payment: ${name} paid ${when}. PAYMENT_LAG client=${name} expected=${exp} received=${received} lag=${lag}`;
    setBase((p) => p.map((x) => (key(x.client) === key(name) ? { ...x, status: 'received' } : x)));
    try {
      const r = await fetch('/api/tatum/memories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'client_lag', text }) });
      const d = await r.json();
      if (d?.memory) setMemories((p) => [d.memory, ...p]);
           return d?.memory?.status || (d?.error ? 'error: ' + d.error : 'unknown');
    } catch { return 'failed'; }
  };

    const add = (c: { client: string; amount: number; expectedDate: string; duration: string }) =>
    setBase((p) => [...p, { id: 'c_' + Date.now(), ...c, historicalLagDays: 0, reliabilityScore: 0.7, status: 'pending' }]);

  return { clients, stats, record, add };
}
