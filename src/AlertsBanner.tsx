import React, { useState } from 'react';

const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const usd = (n: number) => '$' + Math.round(n).toLocaleString();
const pretty = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

function nextDue(b: any, today: Date) {
  let d = parse(b.dueDate);
  const f = b.recurring;
  if (f === 'one-time' || f === 'once') return { d, overdue: d < today };
  let guard = 0;
  while (d < today && guard++ < 600) {
    if (f === 'weekly') d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
    else if (f === 'yearly') d = new Date(d.getFullYear() + 1, d.getMonth(), d.getDate());
    else d = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }
  return { d, overdue: false };
}

type Alert = { id: string; level: 'red' | 'amber'; title: string; text: string };

export function buildAlerts(bills: any[], buffer: number): Alert[] {
  const n = new Date();
  const today = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const out: Alert[] = [];
  let due7 = 0, due30 = 0;
  for (const b of bills || []) {
    if (!b?.dueDate || !(b.amount > 0)) continue;
    const { d, overdue } = nextDue(b, today);
    const days = Math.round((d.getTime() - today.getTime()) / 864e5);
    if (overdue) { due7 += b.amount; due30 += b.amount; out.push({ id: 'o' + b.id, level: 'red', title: `${b.name} is overdue`, text: `${usd(b.amount)} was due on ${pretty(d)}. Pay it as soon as you can.` }); continue; }
    if (days <= 7) due7 += b.amount;
    if (days <= 30) due30 += b.amount;
    if (days === 0) out.push({ id: 't' + b.id, level: 'red', title: `${b.name} is due today`, text: `${usd(b.amount)} is due today.` });
    else if (days <= 3) out.push({ id: 's' + b.id, level: 'amber', title: `${b.name} is due in ${days} day${days === 1 ? '' : 's'}`, text: `${usd(b.amount)} is due on ${pretty(d)}.` });
  }
  if (due7 > 0 && buffer < due7) out.unshift({ id: 'low7', level: 'red', title: 'Your buffer is too low for this week\u2019s bills', text: `You have ${usd(buffer)} but ${usd(due7)} is due in the next 7 days.` });
  else if (due30 > 0 && buffer < due30) out.unshift({ id: 'low30', level: 'amber', title: 'Your buffer won\u2019t cover this month\u2019s bills', text: `You have ${usd(buffer)} and ${usd(due30)} is due in the next 30 days.` });
  return out;
}

export default function AlertsBanner({ bills, buffer }: { bills: any[]; buffer: number }) {
  const [hidden, setHidden] = useState<string[]>([]);
  const alerts = buildAlerts(bills, buffer).filter((a) => !hidden.includes(a.id));
  if (alerts.length === 0) return null;
  return (
    <div className="flex flex-col gap-sm" role="alert">
      {alerts.map((a) => {
        const c = a.level === 'red' ? '#F04438' : '#F79009';
        return (
          <div key={a.id} className="flex items-start justify-between gap-md rounded-lg p-md" style={{ background: a.level === 'red' ? 'rgba(240,68,56,.12)' : 'rgba(247,144,9,.12)', border: `1px solid ${c}` }}>
            <div>
              <p className="text-lg font-semibold" style={{ color: c }}>{a.title}</p>
              <p className="text-md text-secondary">{a.text}</p>
            </div>
            <button onClick={() => setHidden((h) => [...h, a.id])} className="min-h-[44px] shrink-0 rounded-lg px-md text-sm font-semibold text-secondary">Dismiss</button>
          </div>
        );
      })}
    </div>
  );
}
