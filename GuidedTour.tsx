import React, { useEffect, useState } from 'react';
import { Sparkles, Home, PlusCircle, CalendarDays, Percent, Banknote, Brain, Wallet, MessageCircle, Rocket } from 'lucide-react';

type Step = { title: string; text: string; icon: React.ComponentType<any>; tab?: string };

const STEPS: Step[] = [
  { icon: Sparkles, title: 'Welcome to Diction', text: 'Diction answers one question: how much can I safely spend today? This quick tour shows you around in under a minute.' },
  { icon: Home, tab: 'home', title: 'Your safe-to-spend number', text: 'The big card on Home is what you can spend after your bills, tax and your own paycheck are covered. Below it you see your buffer, upcoming bills and tax set aside.' },
  { icon: PlusCircle, tab: 'home', title: 'Log a payment', text: 'When a client pays you, tap Log payment. Diction sets your tax aside straight away and adds the rest to your buffer.' },
  { icon: CalendarDays, tab: 'bills', title: 'Add your bills', text: 'Add rent, subscriptions and anything else you must pay. Bills due before your next payday are reserved first, and Diction warns you before they land.' },
  { icon: Percent, tab: 'taxes', title: 'Tax, set automatically', text: 'Your tax rate comes from your country. You can change it any time with the slider. It is an estimate, not tax advice.' },
  { icon: Banknote, tab: 'paycheck', title: 'Pay yourself on a fixed day', text: 'Choose a monthly amount and a payday. Diction keeps that paycheck ready, so a late client does not make your rent late.' },
  { icon: Brain, tab: 'learned', title: 'It learns who pays late', text: 'Add your clients and record when they pay. Diction lowers its trust in late payers and counts their expected money for less. These memories are stored on Walrus.' },
  { icon: Wallet, title: 'Connect a Sui wallet', text: 'Tap the wallet button at the top to see every asset in your wallet and watch money come in and go out live. Diction only reads, it never moves your money.' },
  { icon: MessageCircle, title: 'Ask Diction', text: 'The purple button at the bottom right is your assistant. Try asking "Can I spend $200?" and it answers with your real numbers.' },
  { icon: Rocket, title: 'You are ready', text: 'Start by adding a bill or logging a payment. You can replay this tour any time from Settings.' },
];

const uid = () => { try { return localStorage.getItem('diction_uid') || 'guest'; } catch { return 'guest'; } };
const key = () => `diction:${uid()}:tour_seen`;
export const tourSeen = () => { try { return localStorage.getItem(key()) === '1'; } catch { return true; } };
export const markTourSeen = () => { try { localStorage.setItem(key(), '1'); } catch {} };

export default function GuidedTour({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (tab: string) => void }) {
  const [i, setI] = useState(0);
  useEffect(() => { if (open) setI(0); }, [open]);
  useEffect(() => { if (open && STEPS[i].tab) onNavigate(STEPS[i].tab as string); }, [i, open]);
  if (!open) return null;
  const s = STEPS[i];
  const Icon = s.icon;
  const last = i === STEPS.length - 1;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-md sm:items-center" role="dialog" aria-modal="true" aria-label="Diction tour">
      <div className="fixed inset-0" style={{ background: 'rgba(12,10,40,.6)' }} onClick={onClose} />
      <div key={i} className="slide-in relative flex w-full max-w-md flex-col gap-md rounded-3xl border border-secondary bg-primary p-xl shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-solid"><Icon className="size-7 text-fg-white" /></span>
          <span className="text-sm font-semibold text-tertiary">{i + 1} of {STEPS.length}</span>
        </div>
        <h2 className="text-heading-xs font-semibold text-primary">{s.title}</h2>
        <p className="text-lg text-secondary">{s.text}</p>
        <div className="flex justify-center gap-xs" aria-hidden="true">
          {STEPS.map((_, n) => <span key={n} className="h-1.5 rounded-full transition-all" style={{ width: n === i ? 24 : 8, background: n === i ? '#4832E7' : 'rgba(120,120,140,.35)' }} />)}
        </div>
        <div className="flex items-center gap-sm">
          {i > 0 ? <button onClick={() => setI(i - 1)} className="min-h-[52px] rounded-xl border border-primary px-lg text-lg font-semibold text-secondary">Back</button> : <button onClick={onClose} className="min-h-[52px] px-md text-lg font-semibold text-tertiary underline">Skip</button>}
          <button onClick={() => (last ? onClose() : setI(i + 1))} className="min-h-[52px] flex-1 rounded-xl bg-brand-solid px-lg text-lg font-semibold text-primary-on-brand hover:bg-brand-solid-hover">{last ? 'Start using Diction' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}
