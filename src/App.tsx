import React, { useState, useEffect } from 'react';
import WalletPanel, { ThemeToggle } from './WalletPanel';
import { COUNTRIES } from './countries';
import {
  Shield,
  Wallet,
  Calendar,
  AlertTriangle,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  Lock,
  ChevronRight,
  Plus,
  Send,
  X,
  MessageCircle,
  Trash2,
  Settings,
  HelpCircle,
  ChevronDown,
  Home
} from 'lucide-react';

   import { useLearning } from './learning';
   import LearningPanel, { MemoryFeed } from './LearningPanel';

import BecauseOfMemory from './BecauseOfMemory';


   import { useProfile } from './auth';
   import AccountMenu from './AccountMenu';
   import AddBillModal from './AddBillModal';
   import TaxPage from './TaxPage';
   import PaycheckPage from './PaycheckPage';
   import WhoPaid from './WhoPaid';
   import GuidedTour from './GuidedTour';

   import AlertsBanner from './AlertsBanner';

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  recurring: 'monthly' | 'one-time';
}

interface ClientPayment {
  id: string;
  client: string;
  amount: number;
  expectedDate: string;
  historicalLagDays: number;
  reliabilityScore: number;
  status: 'received' | 'pending';
}

interface PaymentBreakdown {
  total: number;
  client: string;
  tax: number;
  bills: number;
  paycheck: number;
  buffer: number;
  safeSpend: number;
}

interface MemoryItem {
  id: string;
  type: string;
  text: string;
  createdAt: string;
  status: string;
  blobId?: string;
}

  const COUNTRIES_OLD = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Netherlands',
  'Singapore',
  'Japan',
  'Brazil',
  'India',
  'Other'
];

export default function App() {
  const [navTab, setNavTab] = useState<'home' | 'bills' | 'taxes' | 'paycheck' | 'learned' | 'settings'>('home');

  const [isSetupDone, setIsSetupDone] = useState<boolean>(true);
  const [setupStep, setSetupStep] = useState<number>(1);
  const [userName, setUserName] = useState<string>('Alex');
  const [country, setCountry] = useState<string>('United States');
  const [taxRate, setTaxRate] = useState<number>(25);
  const [targetPaycheck, setTargetPaycheck] = useState<number>(3500);
  const [paydayDay, setPaydayDay] = useState<number>(1);
  const [showTour, setShowTour] = useState<boolean>(false);

  const profile = useProfile();
  useEffect(() => {
    if (!profile) return;
    setUserName(profile.name);
    setCountry(profile.country);
    setTaxRate(profile.taxRate);
    if (profile.targetPaycheck) setTargetPaycheck(profile.targetPaycheck);
    setIsSetupDone(true);
  }, [profile?.email, profile?.country, profile?.targetPaycheck]);

  // Open guided tour automatically on login unless the user selected "Do not ask again"
  useEffect(() => {
    try {
      const doNotAsk = localStorage.getItem('diction_do_not_ask_again') === 'true';
      if (!doNotAsk) {
        const timer = setTimeout(() => setShowTour(true), 400);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  
   const [bufferBalance, setBufferBalance] = useState<number>(0);
   const [showAccount, setShowAccount] = useState(false);
   const [showAddBill, setShowAddBill] = useState(false);
  const [taxSetAside, setTaxSetAside] = useState<number>(0);
  const [paycheckFunded, setPaycheckFunded] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

     const [bills, setBills] = useState<Bill[]>([]);

    const [clients, setClients] = useState<ClientPayment[]>([]);

  const [showLogPayment, setShowLogPayment] = useState<boolean>(false);
  const [logAmount, setLogAmount] = useState<number>(1000);
  const [logClientName, setLogClientName] = useState<string>('');
  const [recentBreakdown, setRecentBreakdown] = useState<PaymentBreakdown | null>(null);

  const [connectedWallets, setConnectedWallets] = useState<Array<{ address: string; type: 'Sui' | 'EVM'; balance: number }>>([
    
  ]);
  const [showConnectWallet, setShowConnectWallet] = useState<boolean>(false);
  const [walletCount, setWalletCount] = useState<number>(0);
  const [newWalletAddress, setNewWalletAddress] = useState<string>('');
  const [newWalletType, setNewWalletType] = useState<'Sui' | 'EVM'>('Sui');

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [memoryInput, setMemoryInput] = useState<string>('');
  const [adminBlobProof, setAdminBlobProof] = useState<Array<{ timestamp: string; blobId: string; status: string }>>([]);
  const [showAdminProofs, setShowAdminProofs] = useState<boolean>(false);

  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [chatLog, setChatLog] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    { sender: 'assistant', text: `Hello Alex! I am your Diction guide. You can ask me anytime if you can afford to spend, or tap any of the quick questions below.` }
  ]);
  const [chatQuestion, setChatQuestion] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    fetch('/api/tatum/memories')
      .then(res => res.json())
      .then(data => {
        if (data.memories) setMemories(data.memories);
      })
      .catch(() => {});

    fetch('/api/tatum/admin/audit-blobs')
      .then(res => res.json())
      .then(data => {
        if (data.auditLog) setAdminBlobProof(data.auditLog);
      })
      .catch(() => {});
  }, []);

    useEffect(() => {
    if (!showAdminProofs) return;
    fetch('/api/tatum/admin/audit-blobs')
      .then(res => res.json())
      .then(data => {
        if (data.auditLog) setAdminBlobProof(data.auditLog);
      })
      .catch(() => {});
  }, [showAdminProofs, memories]);
  const learning = useLearning(clients, setClients, memories, setMemories);
  const billsDueBeforePayday = bills.reduce((acc, b) => acc + b.amount, 0);

  const pendingIncome = learning.clients.filter(c => c.status === 'pending');
  const conservativeExpectedIncome = pendingIncome.reduce(
    (acc, c) => acc + Math.round(c.amount * c.reliabilityScore),
    0
  );

  const rawSafeToSpend = bufferBalance - billsDueBeforePayday - taxSetAside - targetPaycheck + conservativeExpectedIncome;
  const safeToSpend = Math.max(0, rawSafeToSpend);
  const isGapAlert = rawSafeToSpend < 0;

  const processNewPayment = (amount: number, clientName: string) => {
       learning.record(clientName, new Date().toISOString().slice(0, 10));
    const taxPart = Math.round(amount * (taxRate / 100));
    let remaining = amount - taxPart;

    const billsNeeded = Math.max(0, billsDueBeforePayday - (bufferBalance * 0.3));
    const billsPart = Math.min(remaining, Math.round(billsNeeded * 0.5));
    remaining -= billsPart;

    const paycheckNeeded = Math.max(0, targetPaycheck - paycheckFunded);
    const paycheckPart = Math.min(remaining, paycheckNeeded);
    remaining -= paycheckPart;

    const bufferPart = Math.round(remaining * 0.6);
    const safeSpendPart = remaining - bufferPart;

    setTaxSetAside(prev => prev + taxPart);
       setBufferBalance(prev => prev + amount);
    setPaycheckFunded(prev => prev + paycheckPart);

    const breakdown: PaymentBreakdown = {
      total: amount,
      client: clientName,
      tax: taxPart,
      bills: billsPart,
      paycheck: paycheckPart,
      buffer: bufferPart,
      safeSpend: safeSpendPart
    };

    setRecentBreakdown(breakdown);

    fetch('/api/tatum/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'payment_received',
        text: `Received $${amount.toLocaleString()} from ${clientName}. Tax set aside: $${taxPart}. Added to buffer: $${bufferPart}.`
      })
    })
      .then(res => res.json())
      .then(d => {
        if (d?.memory) setMemories(prev => [d.memory, ...prev]);
      })
      .catch(() => {});

    showToast(`Payment of $${amount.toLocaleString()} received and sorted safely.`);
  };

  const handleAskAssistant = async (queryText: string) => {
    if (!queryText.trim()) return;
    const userQ = queryText.trim();
    setChatLog(prev => [...prev, { sender: 'user', text: userQ }]);
    setChatQuestion('');

    try {
      const res = await fetch('/api/tatum/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQ,
          userContext: {
            safeToSpend,
            buffer: bufferBalance,
            upcomingBills: billsDueBeforePayday,
            nextPaycheck: targetPaycheck,
                       userName,
            clients: learning.stats.map((s) => ({ name: s.name, seen: s.n, avgLag: s.avgLag, before: s.before, trust: s.after })),
            nextBill: [...bills].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
          }
        })
      });
      const data = await res.json();
      setChatLog(prev => [...prev, { sender: 'assistant', text: data.answer || 'I am here to help you budget safely.' }]);
    } catch {
      setChatLog(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: `You have $${safeToSpend.toLocaleString()} safe to spend today. All your upcoming bills and paycheck are covered. (Estimate only)`
        }
      ]);
    }
  };

  const deleteMemory = (id: string) => {
    fetch(`/api/tatum/memories/${id}`, { method: 'DELETE' });
    setMemories(prev => prev.filter(m => m.id !== id));
    showToast('Memory removed.');
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'bills', label: 'Bills', icon: Calendar },
    { id: 'taxes', label: 'Taxes', icon: DollarSign },
    { id: 'paycheck', label: 'Paycheck', icon: Wallet },
        { id: 'learned', label: 'Memory', icon: Sparkles },
  ] as const;

  return (
    <div className="min-h-screen bg-secondary text-primary font-sans flex flex-col text-lg">
      {/* 1. Toast Recipe: bg-primary, border-secondary, shadow-lg, rounded-lg, text-fg-success-primary icon */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-start gap-sm rounded-lg border border-secondary bg-primary p-lg shadow-lg max-w-md">
          <CheckCircle2 className="mt-xxs size-6 shrink-0 text-fg-success-primary" />
          <p className="text-md font-semibold text-secondary">{toastMessage}</p>
        </div>
      )}

      {/* Slim Luxury Header */}
      <header className="border-b border-secondary bg-primary/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-lg py-md flex items-center justify-between gap-md">
          <div className="flex items-center gap-md min-w-0">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-indigo-600 shadow-md shadow-indigo-600/25 shrink-0 glow-btn">
              <Shield className="size-6 text-white" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-heading-sm font-bold tracking-tight">Diction</span>
              <span className="hidden sm:flex size-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
            </div>
            <p className="hidden md:block text-xs text-secondary font-medium pl-2 border-l border-secondary">
              Earn and spend wisely, without going broke.
            </p>
          </div>

          <div className="flex items-center gap-sm shrink-0">
            <button
              onClick={() => setShowTour(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-indigo-200/90 bg-indigo-50/90 px-3.5 py-2 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-100 hover:border-indigo-400 dark:border-indigo-800/80 dark:bg-indigo-950/70 dark:text-indigo-300 dark:hover:bg-indigo-900 transition-all glow-btn"
              title="Site Guide & Navigation Tour"
            >
              <Sparkles className="size-3.5 text-indigo-500 animate-pulse" />
              <span className="hidden sm:inline">Guide & Tour</span>
              <span className="sm:hidden">Guide</span>
            </button>
            <ThemeToggle />
            <button
              onClick={() => setShowConnectWallet(true)}
              className="relative inline-flex size-11 items-center justify-center rounded-2xl bg-primary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring glow-btn"
              title="Wallets"
            >
              <Wallet className="size-5 text-brand-primary" />
              {walletCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-brand-solid text-xs font-bold text-fg-white">
                  {walletCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowAccount(true)}
              className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring glow-btn"
              title="Settings"
            >
              <Settings className="size-5 text-secondary" />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop tabs (hidden on phones) */}
      <nav className="hidden md:block bg-primary border-b border-secondary">
        <div className="max-w-7xl mx-auto px-xl flex items-center gap-lg">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setNavTab(item.id)}
              className={`min-h-[56px] px-md text-lg font-semibold whitespace-nowrap border-b-2 transition-colors ${
                navTab === item.id
                  ? 'border-brand text-brand-primary'
                  : 'border-transparent text-tertiary hover:text-secondary focus-visible:ring-2 focus-visible:ring-focus-ring'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-primary border-t border-secondary">
        <div className="flex justify-around py-sm">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = navTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setNavTab(item.id)}
                className={`flex flex-col items-center gap-xxs px-md py-xs text-xs font-semibold ${
                  active ? 'text-brand-primary' : 'text-tertiary'
                }`}
              >
                <Icon className="size-6" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-lg md:px-xl py-xl md:py-2xl pb-28 md:pb-2xl space-y-xl md:space-y-2xl">
        {/* Setup Flow Modal / Overlay if not done */}
        {!isSetupDone && (
          /* Card Recipe: rounded-xl border border-secondary bg-primary p-xl */
          <section className="rounded-xl border border-secondary bg-primary p-2xl shadow-xs space-y-xl">
            <div className="flex items-center justify-between border-b border-secondary pb-lg">
              <div>
                <h2 className="text-heading-sm font-semibold text-primary">Let's set up your personal budget</h2>
                <p className="text-md text-tertiary">Step {setupStep} of 5</p>
              </div>
              {/* Progress Bar Recipe: track bg-tertiary rounded-full, fill bg-brand-solid */}
              <div className="w-48 h-3 rounded-full bg-secondary overflow-hidden flex">
                <div
                  style={{ width: `${(setupStep / 5) * 100}%` }}
                  className="h-full bg-brand-solid rounded-full transition-all"
                />
              </div>
            </div>

            {setupStep === 1 && (
              /* Input & Field Recipe: label text-sm font-medium text-secondary, input bg-primary border-primary rounded-md */
              <div className="flex flex-col gap-sm max-w-xl">
                <label className="text-lg font-medium text-secondary">What is your first name?</label>
                <input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="rounded-md bg-primary px-lg py-sm text-lg text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring min-h-[56px]"
                  placeholder="e.g. Alex"
                />
                <button
                  onClick={() => setSetupStep(2)}
                  className="mt-md inline-flex items-center justify-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm min-h-[56px] text-lg font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  Continue
                </button>
              </div>
            )}

            {setupStep === 2 && (
              /* Select Recipe: rounded-md bg-primary border-primary */
              <div className="flex flex-col gap-sm max-w-xl">
                <label className="text-lg font-medium text-secondary">Which country are you based in?</label>
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="rounded-md bg-primary px-lg py-sm text-lg text-primary border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring min-h-[56px]"
                >
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="flex gap-md mt-md">
                  <button
                    onClick={() => setSetupStep(1)}
                    className="inline-flex items-center justify-center gap-sm rounded-lg bg-primary px-lg py-sm min-h-[56px] text-lg font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setSetupStep(3)}
                    className="inline-flex items-center justify-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm min-h-[56px] text-lg font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {setupStep === 3 && (
              <div className="flex flex-col gap-sm max-w-xl">
                <label className="text-lg font-medium text-secondary">
                  What percent of your income goes to tax?
                </label>
                <p className="text-xs text-tertiary">
                  Type a number. This is an estimate you can change anytime.
                </p>
                <div className="flex items-center gap-sm">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={taxRate}
                    onChange={e => setTaxRate(Number(e.target.value))}
                    className="rounded-md bg-primary px-lg py-sm text-lg font-semibold text-primary border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring w-40 min-h-[56px]"
                  />
                  <span className="text-heading-xs font-bold text-primary">%</span>
                </div>
                <div className="flex gap-md mt-md">
                  <button
                    onClick={() => setSetupStep(2)}
                    className="inline-flex items-center justify-center gap-sm rounded-lg bg-primary px-lg py-sm min-h-[56px] text-lg font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setSetupStep(4)}
                    className="inline-flex items-center justify-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm min-h-[56px] text-lg font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {setupStep === 4 && (
              <div className="flex flex-col gap-sm max-w-xl">
                <label className="text-lg font-medium text-secondary">
                  What monthly paycheck would you like to receive?
                </label>
                <input
                  type="number"
                  value={targetPaycheck}
                  onChange={e => setTargetPaycheck(Number(e.target.value))}
                  className="rounded-md bg-primary px-lg py-sm text-lg font-semibold text-primary border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring min-h-[56px]"
                />
                <label className="text-lg font-medium text-secondary mt-md">
                  Which day of the month is your payday?
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={paydayDay}
                  onChange={e => setPaydayDay(Number(e.target.value))}
                  className="rounded-md bg-primary px-lg py-sm text-lg font-semibold text-primary border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring w-40 min-h-[56px]"
                />
                <div className="flex gap-md mt-md">
                  <button
                    onClick={() => setSetupStep(3)}
                    className="inline-flex items-center justify-center gap-sm rounded-lg bg-primary px-lg py-sm min-h-[56px] text-lg font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setSetupStep(5)}
                    className="inline-flex items-center justify-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm min-h-[56px] text-lg font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {setupStep === 5 && (
              <div className="flex flex-col gap-sm max-w-xl">
                <h3 className="text-lg font-semibold text-primary">Your baseline monthly bills are ready:</h3>
                <ul className="space-y-sm text-md text-secondary">
                  {bills.map(b => (
                    <li key={b.id} className="flex justify-between border-b border-secondary py-xs">
                      <span>{b.name} (Due {b.dueDate})</span>
                      <span className="font-bold text-primary">${b.amount}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-md pt-md">
                  <button
                    onClick={() => setSetupStep(4)}
                    className="inline-flex items-center justify-center gap-sm rounded-lg bg-primary px-lg py-sm min-h-[56px] text-lg font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      setIsSetupDone(true);
                      showToast('Setup saved! Welcome to Diction.');
                    }}
                    className="inline-flex items-center justify-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm min-h-[56px] text-lg font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Finish Setup & Start
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================= SECTION C: HOME SCREEN ================= */}
        {navTab === 'home' && isSetupDone && (
          <div className="space-y-2xl">
               <AlertsBanner bills={bills} buffer={bufferBalance} />
            {/* 3. Alert Recipe: rounded-xl bg-utility-error-50 p-xl, text-utility-error-600 icon and title */}
            {isGapAlert && (
              <div className="flex gap-lg rounded-xl bg-utility-error-50 p-xl border border-error-subtle">
                <AlertTriangle className="mt-xxs size-6 shrink-0 text-utility-error-600" aria-hidden="true" />
                <div>
                  <p className="text-lg font-semibold text-utility-error-600">Gap Alert: Bills exceed available funds</p>
                  <p className="mt-xxs text-md text-tertiary">
                    Your bills due before payday (${billsDueBeforePayday.toLocaleString()}) are more than your current buffer balance. Hold off on any extra spending until your next invoice arrives.
                  </p>
                </div>
              </div>
            )}

            {/* Hero: Safe to Spend with Mind-blowing gradient & glowing stroke */}
            <section
              className="relative overflow-hidden rounded-3xl p-6 sm:p-10 shadow-2xl text-white border border-indigo-400/25"
              style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)'
              }}
            >
              <div className="absolute -top-24 -right-24 size-72 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-200 border border-white/15">
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                      Safe to Spend Today
                    </span>
                    <span className="text-xs text-indigo-200/80 hidden sm:inline">Guaranteed Liquid</span>
                  </div>

                  <button
                    onClick={() => setShowLogPayment(true)}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-slate-900 shadow-lg hover:bg-slate-50 transition-all glow-btn self-start sm:self-auto"
                  >
                    <Plus className="size-4 shrink-0 text-indigo-600" />
                    <span>Log client payment</span>
                  </button>
                </div>

                <div>
                  <p className="text-5xl sm:text-6xl font-black tracking-tight drop-shadow-sm">
                    ${safeToSpend.toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm sm:text-base text-indigo-100/90 font-medium max-w-xl">
                    After your taxes ({taxRate}%), upcoming bills (${billsDueBeforePayday.toLocaleString()}), and monthly paycheck (${targetPaycheck.toLocaleString()}) are fully reserved.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/10">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white border border-white/10">
                    <span className="size-2 rounded-full bg-emerald-400" />
                    {isGapAlert ? 'Hold off on non-essential spending' : safeToSpend < 1000 ? 'Caution: buffer is tight' : "Financially healthy · Safe to spend"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs text-indigo-200 border border-white/5">
                    Buffer: ${bufferBalance.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs text-indigo-200 border border-white/5">
                    Taxes Quarantined: ${taxSetAside.toLocaleString()}
                  </span>
                </div>
              </div>
            </section>

            {/* Four Smaller Metric Cards with glowing stroke hover */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-md md:gap-xl">
              {/* 1. Your Buffer */}
              <section className="rounded-3xl border border-secondary bg-primary p-5 sm:p-6 shadow-xs glow-card flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-tertiary">Your Buffer</p>
                  <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Wallet className="size-5 shrink-0" />
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl sm:text-3xl font-black text-primary">
                    ${bufferBalance.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-tertiary">All income lands here first</p>
                </div>
              </section>

              {/* 2. Bills Coming Up */}
              <section className="rounded-3xl border border-secondary bg-primary p-5 sm:p-6 shadow-xs glow-card flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-tertiary">Bills Coming Up</p>
                  <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <Calendar className="size-5 shrink-0" />
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl sm:text-3xl font-black text-primary">
                    ${billsDueBeforePayday.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-tertiary">Due before next payday</p>
                </div>
              </section>

              {/* 3. Tax Set Aside */}
              <section className="rounded-3xl border border-secondary bg-primary p-5 sm:p-6 shadow-xs glow-card flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-tertiary">Tax Set Aside</p>
                  <span className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                    <Lock className="size-5 shrink-0" />
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl sm:text-3xl font-black text-primary">
                    ${taxSetAside.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-tertiary">{taxRate}% auto-quarantined</p>
                </div>
              </section>

              {/* 4. Next Paycheck */}
              <section className="rounded-3xl border border-secondary bg-primary p-5 sm:p-6 shadow-xs glow-card flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-tertiary">Next Paycheck</p>
                  <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="size-5 shrink-0" />
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl sm:text-3xl font-black text-primary">
                    ${paycheckFunded.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-tertiary">Payday on the {paydayDay}st</p>
                </div>
              </section>
            </div>

            {/* Alert / Tinted Callout Recipe for Friendly Summary */}
           
            {recentBreakdown && (
              <div className="flex gap-lg rounded-xl bg-utility-brand-50 p-xl border border-utility-brand-200">
                <Sparkles className="mt-xxs size-6 shrink-0 text-utility-brand-600" />
                <div className="space-y-sm">
                  <p className="text-lg font-semibold text-utility-brand-600">
                    Friendly Payment Summary
                  </p>
                  <p className="text-md text-primary leading-relaxed">
                    You received ${recentBreakdown.total.toLocaleString()} from {recentBreakdown.client}. We set aside ${recentBreakdown.tax.toLocaleString()} for tax, ${recentBreakdown.bills.toLocaleString()} for bills, ${recentBreakdown.paycheck.toLocaleString()} for your paycheck, and ${recentBreakdown.buffer.toLocaleString()} into your buffer.
                  </p>
                  <button
                    onClick={() => setRecentBreakdown(null)}
                    className="text-sm font-semibold text-brand-primary hover:underline"
                  >
                    Dismiss summary
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

            {/* ================= SECTION: BILLS ================= */}
        {navTab === 'bills' && (
          <div className="space-y-xl">
            <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-heading-sm font-semibold text-primary">Upcoming Bills</h2>
                <p className="text-md text-tertiary">Everything due before your next payday is reserved in full.</p>
              </div>
              <button
                onClick={() => setShowAddBill(true)}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition-all glow-btn sm:shrink-0"
              >
                <Plus className="size-5 shrink-0 text-white" />
                <span>Add a bill</span>
              </button>
            </div>

            {bills.length === 0 && (
              <div className="rounded-xl border border-secondary bg-primary p-xl text-center text-md text-tertiary">
                No bills yet. Tap "Add a bill" to add your first one.
              </div>
            )}

            {bills.length > 0 && (
              <>
                {/* Phone: one card per bill */}
                <div className="space-y-sm md:hidden">
                  {bills.map(b => (
                    <div key={b.id} className="rounded-xl border border-secondary bg-primary p-lg shadow-xs space-y-sm">
                      <div className="flex items-start justify-between gap-md">
                        <p className="min-w-0 truncate text-lg font-semibold text-primary">{b.name}</p>
                        <p className="shrink-0 text-lg font-bold text-primary">${b.amount.toLocaleString()}</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-sm text-md text-tertiary">
                        <span>Due {b.dueDate} · <span className="capitalize">{b.recurring}</span></span>
                        <span className="inline-flex items-center rounded-full border border-utility-success-200 bg-utility-success-50 px-md py-xxs text-xs font-medium text-utility-success-700">
                          Covered by Buffer
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Laptop and tablet: table */}
                <div className="hidden overflow-hidden rounded-xl border border-secondary bg-primary md:block">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 z-10 bg-secondary">
                      <tr className="border-b border-secondary">
                        <th className="px-3xl py-md text-sm font-semibold text-quaternary">Bill Name</th>
                        <th className="px-3xl py-md text-sm font-semibold text-quaternary">Amount</th>
                        <th className="px-3xl py-md text-sm font-semibold text-quaternary">Due Date</th>
                        <th className="px-3xl py-md text-sm font-semibold text-quaternary">Frequency</th>
                        <th className="px-3xl py-md text-sm font-semibold text-quaternary text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.map(b => (
                        <tr key={b.id} className="border-b border-secondary hover:bg-secondary-hover">
                          <td className="px-3xl py-xl text-md text-primary font-medium">{b.name}</td>
                          <td className="px-3xl py-xl text-md text-primary font-bold">${b.amount.toLocaleString()}</td>
                          <td className="px-3xl py-xl text-md text-tertiary">{b.dueDate}</td>
                          <td className="px-3xl py-xl text-md text-tertiary capitalize">{b.recurring}</td>
                          <td className="px-3xl py-xl text-md text-right">
                            <span className="inline-flex items-center gap-xs rounded-full border border-utility-success-200 bg-utility-success-50 px-md py-xxs text-xs font-medium text-utility-success-700">
                              Covered by Buffer
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
        {/* ================= SECTION: TAXES ================= */}
           {navTab === 'taxes' && <TaxPage taxRate={taxRate} setTaxRate={setTaxRate} taxSetAside={taxSetAside} country={country} showToast={showToast} />}
        {false && (
          <div className="space-y-xl">
            <div>
              <h2 className="text-heading-sm font-semibold text-primary">Tax Set Aside</h2>
              <p className="text-md text-tertiary">
                We take your estimated tax percentage out of every single payment as it lands, so you are never surprised.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-lg">
                <p className="text-sm font-medium text-tertiary">Currently Quarantined for Taxes</p>
                <p className="text-heading-xl font-semibold text-primary">
                  ${taxSetAside.toLocaleString()}
                </p>
                <div className="rounded-md bg-secondary p-lg border border-secondary text-md text-secondary">
                  <span className="font-semibold text-primary">Your Tax Rate: {taxRate}%</span>
                  <p className="mt-xs text-xs text-tertiary">Estimate only, not tax advice.</p>
                </div>
              </section>

              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-lg">
                <p className="text-heading-xs font-semibold text-primary">Adjust Your Estimated Rate</p>
                <p className="text-sm text-tertiary">
                  Change your rate anytime. Future payments will automatically follow this percentage.
                </p>
                <div className="flex items-center gap-md">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={taxRate}
                    onChange={e => setTaxRate(Number(e.target.value))}
                    className="rounded-md bg-primary px-lg py-sm text-lg font-semibold text-primary border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring w-40 min-h-[56px]"
                  />
                  <span className="text-heading-xs font-bold text-primary">%</span>
                </div>
                <button
                  onClick={() => showToast('Tax rate updated.')}
                  className="inline-flex items-center gap-sm rounded-lg bg-primary px-lg py-sm min-h-[56px] text-lg font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  Save Tax Rate
                </button>
              </section>
            </div>
          </div>
        )}

        {/* ================= SECTION: MY PAYCHECK ================= */}
           {navTab === 'paycheck' && <PaycheckPage target={targetPaycheck} setTarget={setTargetPaycheck} day={paydayDay} setDay={setPaydayDay} funded={paycheckFunded} showToast={showToast} onPay={() => showToast('Paycheck transfer prepared for your connected wallet to approve.')} />}
        {false && (
          <div className="space-y-xl">
            <div>
              <h2 className="text-heading-sm font-semibold text-primary">My Personal Paycheck</h2>
              <p className="text-md text-tertiary">
                Your buffer turns irregular lump sums into a calm, steady salary paid on the same day every month.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-lg">
                <p className="text-sm font-medium text-tertiary">Pay Yourself Card</p>
                <p className="text-heading-xl font-semibold text-success-primary">
                  ${paycheckFunded.toLocaleString()}
                </p>
                <p className="text-md text-secondary">
                  Scheduled for payday on the {paydayDay}st of the month.
                </p>
                <button
                  onClick={() => {
                    showToast('Paycheck transfer prepared for your connected wallet to approve.');
                  }}
                  className="inline-flex items-center justify-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm min-h-[56px] text-lg font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring w-full"
                >
                  <TrendingUp className="size-6 shrink-0 text-fg-white" />
                  <span>Pay yourself now</span>
                </button>
                <p className="text-xs text-tertiary text-center">
                  Prepares the transfer in your own wallet. Diction never moves money on its own.
                </p>
              </section>

              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-lg">
                <p className="text-heading-xs font-semibold text-primary">Monthly Paycheck Settings</p>
                <div className="flex flex-col gap-xs">
                  <label className="text-sm font-medium text-secondary">
                    Target Monthly Amount ($)
                  </label>
                  <input
                    type="number"
                    value={targetPaycheck}
                    onChange={e => setTargetPaycheck(Number(e.target.value))}
                    className="rounded-md bg-primary px-lg py-sm text-lg font-semibold text-primary border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring w-full min-h-[56px]"
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-sm font-medium text-secondary">
                    Payday Day of Month (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={paydayDay}
                    onChange={e => setPaydayDay(Number(e.target.value))}
                    className="rounded-md bg-primary px-lg py-sm text-lg font-semibold text-primary border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring w-40 min-h-[56px]"
                  />
                </div>
                <button
                  onClick={() => showToast('Paycheck rules saved.')}
                  className="inline-flex items-center gap-sm rounded-lg bg-primary px-lg py-sm min-h-[56px] text-lg font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  Save Paycheck Rules
                </button>
              </section>
            </div>
          </div>
        )}

        {/* ================= SECTION H: WHAT DICTION LEARNED ================= */}
        {navTab === 'learned' && (
          <div className="space-y-xl">
            <div className="flex items-start justify-between gap-md">
              <div>
                              <h2 className="text-heading-sm font-semibold text-primary">Your Memory</h2>
                <p className="mt-xs text-md text-tertiary">
                  Payment habits and notes Diction remembers about your clients, saved to Walrus. Remove anything anytime.
                </p>
              </div>
              <button
                onClick={() => setShowAdminProofs(!showAdminProofs)}
                className="shrink-0 text-xs font-semibold text-tertiary hover:text-primary"
              >
                {showAdminProofs ? 'Hide audit proof' : 'Audit proof'}
              </button>
            </div>

            {/* Hidden admin proof section */}
            {showAdminProofs && (
              <div className="rounded-2xl border border-secondary bg-primary p-lg shadow-xs space-y-md">
                <p className="text-sm font-semibold text-primary">Audit Log of Confirmed Storage Writes</p>
                <div className="space-y-xs text-sm font-mono text-secondary max-h-48 overflow-y-auto">
                  {adminBlobProof.length === 0 ? (
                    <p className="text-tertiary text-xs">No audit entries yet.</p>
                  ) : (
                    adminBlobProof.map((log, i) => (
                      <div key={i} className="flex justify-between gap-sm border-b border-secondary py-xs">
                        <span>{log.timestamp}</span>
                        <span className="truncate">{log.blobId}</span>
                        <span className="text-success-primary">{log.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Teach Diction */}
            <div className="rounded-2xl border border-secondary bg-primary p-lg shadow-xs flex flex-col gap-md sm:flex-row sm:items-center">
              <input
                type="text"
                value={memoryInput}
                onChange={e => setMemoryInput(e.target.value)}
                placeholder="Teach Diction something, e.g. Apex Studio pays on Fridays"
                className="rounded-xl bg-primary px-lg py-sm text-md text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring w-full min-w-0 sm:flex-1 min-h-[52px]"
              />
              <button
                onClick={() => {
                  if (!memoryInput.trim()) return;
                  fetch('/api/tatum/memories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'user_note', text: memoryInput.trim() })
                  })
                    .then(r => r.json())
                    .then(d => {
                      if (d?.memory) setMemories(prev => [d.memory, ...prev]);
                      setMemoryInput('');
                      showToast('Saved to memory.');
                    });
                }}
                className="inline-flex w-full items-center justify-center gap-sm rounded-xl border border-transparent bg-brand-solid px-lg py-sm min-h-[52px] text-md font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring sm:w-auto shrink-0"
              >
                Save memory
              </button>
            </div>

            <LearningPanel learning={learning} />

            <MemoryFeed memories={memories} onDelete={deleteMemory} />
          </div>
        )}

        {/* ================= SECTION: SETTINGS ================= */}
        {navTab === 'settings' && (
          <div className="space-y-xl max-w-2xl">
            <div>
              <h2 className="text-heading-sm font-semibold text-primary">Your Profile & Settings</h2>
              <p className="text-md text-tertiary">Edit your personal setup anytime.</p>
            </div>

            <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-lg">
              <div className="flex flex-col gap-xs">
                <label className="text-sm font-medium text-secondary">Your Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="rounded-md bg-primary px-lg py-sm text-lg text-primary border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring w-full min-h-[56px]"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-sm font-medium text-secondary">Country</label>
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="rounded-md bg-primary px-lg py-sm text-lg text-primary border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring w-full min-h-[56px]"
                >
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-sm font-medium text-secondary">Tax Rate (%)</label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={e => setTaxRate(Number(e.target.value))}
                  className="rounded-md bg-primary px-lg py-sm text-lg text-primary border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring w-40 min-h-[56px]"
                />
              </div>

              <button
                onClick={() => showToast('Profile settings saved.')}
                className="inline-flex items-center justify-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm min-h-[56px] text-lg font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                Save all changes
              </button>
            </section>
          </div>
        )}
      </main>

      {/* ================= 7. Dialog / Modal Recipe: fixed inset-0 bg-overlay opacity-70 + centered max-w-lg rounded-lg bg-primary shadow-2xl ================= */}
      {false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="fixed inset-0 bg-overlay opacity-70" onClick={() => setShowConnectWallet(false)} />
          <div className="relative flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-lg bg-primary shadow-2xl border border-secondary">
            <header className="flex items-start justify-between gap-lg border-b border-secondary p-xl">
              <h2 className="text-lg font-semibold text-primary">Connect your wallet</h2>
              <button
                onClick={() => setShowConnectWallet(false)}
                className="text-tertiary hover:text-primary p-xs"
              >
                <X className="size-6" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-xl text-sm text-secondary space-y-lg">
              {/* Alert Tinted Callout Recipe inside Modal */}
              <div className="flex gap-lg rounded-xl bg-utility-brand-50 p-xl border border-utility-brand-200">
                <Shield className="mt-xxs size-5 shrink-0 text-utility-brand-600" />
                <p className="text-sm font-semibold text-utility-brand-600 leading-relaxed">
                  Diction watches your wallet. Your money stays with you. We never hold or move your funds, and we never ask for your recovery phrase or private keys.
                </p>
              </div>

              <div className="space-y-sm">
                <label className="text-sm font-medium text-secondary">Connected Wallets</label>
                {connectedWallets.map((w, idx) => (
                  <div key={idx} className="flex items-center justify-between p-md rounded-md border border-secondary bg-secondary">
                    <div>
                      <div className="text-md font-semibold text-primary">{w.type} Wallet</div>
                      <div className="text-xs font-mono text-tertiary">{w.address}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-md font-bold text-success-primary">${w.balance.toLocaleString()}</div>
                      <div className="text-xs text-tertiary">USDC / USDT</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-sm border-t border-secondary pt-md">
                <label className="text-sm font-medium text-secondary">Add another wallet address</label>
                <div className="flex gap-sm">
                  <select
                    value={newWalletType}
                    onChange={e => setNewWalletType(e.target.value as 'Sui' | 'EVM')}
                    className="rounded-md bg-primary px-lg py-sm text-sm text-primary border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring min-h-[56px]"
                  >
                    <option value="Sui">Sui Wallet</option>
                    <option value="EVM">EVM (MetaMask / Ethereum)</option>
                  </select>
                  <input
                    type="text"
                    value={newWalletAddress}
                    onChange={e => setNewWalletAddress(e.target.value)}
                    placeholder="Paste public wallet address (0x...)"
                    className="rounded-md bg-primary px-lg py-sm text-sm text-primary border border-primary flex-1 min-h-[56px] focus-visible:ring-2 focus-visible:ring-focus-ring"
                  />
                </div>
              </div>
            </div>

            <footer className="flex justify-end gap-sm border-t border-secondary p-xl">
              <button
                onClick={() => setShowConnectWallet(false)}
                className="inline-flex items-center gap-sm rounded-lg bg-primary px-lg py-sm min-h-[56px] text-sm font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (!newWalletAddress.trim()) return;
                  const newW = {
                    address: newWalletAddress.trim().slice(0, 8) + '...' + newWalletAddress.trim().slice(-4),
                    type: newWalletType,
                    balance:0
                  };
                  setConnectedWallets(prev => [...prev, newW]);
                  
                  setNewWalletAddress('');
                  showToast(`${newWalletType} wallet connected and watching.`);
                }}
                className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm min-h-[56px] text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                Watch wallet
              </button>
            </footer>
          </div>
        </div>
      )}
         <WalletPanel open={showConnectWallet} onClose={() => setShowConnectWallet(false)} safeToSpend={safeToSpend} onBalance={setBufferBalance} onCount={setWalletCount} />
         <AccountMenu open={showAccount} onClose={() => setShowAccount(false)} taxRate={taxRate} onOpenTour={() => setShowTour(true)} />
   <AddBillModal open={showAddBill} onClose={() => setShowAddBill(false)} onSave={(b) => { setBills(prev => [...prev, { id: 'b_' + Date.now(), name: b.name, amount: b.amount, dueDate: b.dueDate, recurring: (b.recurring === 'one-time' ? 'one-time' : 'monthly') }]); showToast('Bill added.'); }} />
         <GuidedTour open={showTour} onClose={() => setShowTour(false)} onNavigateTab={(t) => setNavTab(t)} />
      {/* Modal: Log a Payment */}
      {showLogPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="fixed inset-0 bg-overlay opacity-70" onClick={() => setShowLogPayment(false)} />
          <div className="relative flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-lg bg-primary shadow-2xl border border-secondary">
            <header className="flex items-start justify-between gap-lg border-b border-secondary p-xl">
              <h2 className="text-lg font-semibold text-primary">New payment received</h2>
              <button
                onClick={() => setShowLogPayment(false)}
                className="text-tertiary hover:text-primary p-xs"
              >
                <X className="size-6" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-xl text-sm text-secondary space-y-lg">
              <p className="text-sm text-tertiary">
                Record a payment received in cash, bank deposit, or external wallet.
              </p>

              <div className="flex flex-col gap-sm">
                  <WhoPaid names={clients.map((c) => c.client)} value={logClientName} onChange={setLogClientName} /> 
               
              </div>

              <div className="flex flex-col gap-sm">
                <label className="text-sm font-medium text-secondary">Payment Amount ($)</label>
                <input
                  type="number"
                  value={logAmount}
                  onChange={e => setLogAmount(Number(e.target.value))}
                  className="rounded-md bg-primary px-lg py-sm text-sm font-semibold text-primary border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring w-full min-h-[56px]"
                />
              </div>
            </div>

            <footer className="flex justify-end gap-sm border-t border-secondary p-xl">
              <button
                onClick={() => setShowLogPayment(false)}
                className="inline-flex items-center gap-sm rounded-lg bg-primary px-lg py-sm min-h-[56px] text-sm font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  processNewPayment(logAmount, logClientName || 'Other client');
                  setShowLogPayment(false);
                }}
                className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm min-h-[56px] text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                Sort payment into buffer
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Floating round button: Ask Diction */}
     <button
  onClick={() => setIsAssistantOpen(true)}
  aria-label="Ask Diction"
  className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-40 flex size-14 items-center justify-center rounded-full bg-brand-solid text-primary-on-brand shadow-lg hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring md:size-auto md:gap-sm md:px-lg md:py-md md:font-semibold"
>
  <MessageCircle className="size-6 shrink-0 text-fg-white" />
  <span className="hidden md:inline text-lg">Ask Diction</span>
</button>

      {/* Assistant Chat Panel */}
      {isAssistantOpen && (
        <div className="fixed bottom-40 md:bottom-24 left-4 right-4 md:left-auto md:right-6 z-50 md:w-full md:max-w-md bg-primary border border-secondary rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
          <header className="bg-secondary p-lg border-b border-secondary flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <Sparkles className="size-5 text-brand-primary shrink-0" />
              <span className="text-md font-semibold text-primary">Ask Diction</span>
            </div>
            <button
              onClick={() => setIsAssistantOpen(false)}
              className="text-tertiary hover:text-primary p-xs"
            >
              <X className="size-5" />
            </button>
          </header>

          <div className="p-md bg-secondary border-b border-secondary space-y-xs">
            <span className="text-xs font-semibold text-tertiary uppercase tracking-wider block">Quick questions</span>
            <div className="flex flex-col gap-xs">
              <button
                onClick={() => handleAskAssistant('Can I spend $200?')}
                className="text-left text-xs font-semibold text-brand-primary hover:underline"
              >
                • Can I afford to spend $200?
              </button>
              <button
                onClick={() => handleAskAssistant('Why is my safe-to-spend this number?')}
                className="text-left text-xs font-semibold text-brand-primary hover:underline"
              >
                • Why is my safe-to-spend this number?
              </button>
              <button
                onClick={() => handleAskAssistant('Which bill is due next?')}
                className="text-left text-xs font-semibold text-brand-primary hover:underline"
              >
                • Which bill is due next?
              </button>
            </div>
          </div>

          <div className="p-lg overflow-y-auto flex-1 space-y-md text-sm">
            {chatLog.map((c, i) => (
              <div
                key={i}
                className={`p-md rounded-md ${
                  c.sender === 'assistant'
                    ? 'bg-secondary text-primary border border-secondary'
                    : 'bg-brand-solid text-primary-on-brand font-medium ml-auto max-w-[85%]'
                }`}
              >
                {c.text}
              </div>
            ))}
          </div>

          <div className="p-md border-t border-secondary bg-primary flex gap-sm">
            <input
              type="text"
              value={chatQuestion}
              onChange={e => setChatQuestion(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAskAssistant(chatQuestion);
              }}
              placeholder="Ask anything about your money..."
              className="rounded-md bg-secondary px-lg py-sm text-sm text-primary placeholder:text-placeholder border border-primary flex-1 focus-visible:ring-2 focus-visible:ring-focus-ring"
            />
            <button
              onClick={() => handleAskAssistant(chatQuestion)}
              className="rounded-md bg-brand-solid text-primary-on-brand px-lg py-sm font-semibold flex items-center justify-center shrink-0 hover:bg-brand-solid-hover"
            >
              <Send className="size-4 text-fg-white" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-secondary bg-primary mt-auto py-lg text-center text-md text-secondary">
        Diction
      </footer>
    </div>
  );
}
