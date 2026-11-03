import React, { useState, useEffect } from 'react';
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
  ChevronDown
} from 'lucide-react';

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

const COUNTRIES = [
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
  const [targetPaycheck, setTargetPaycheck] = useState<number>(3200);
  const [paydayDay, setPaydayDay] = useState<number>(1);

  const [bufferBalance, setBufferBalance] = useState<number>(6850);
  const [taxSetAside, setTaxSetAside] = useState<number>(1712);
  const [paycheckFunded, setPaycheckFunded] = useState<number>(3200);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [bills, setBills] = useState<Bill[]>([
    { id: 'b1', name: 'Apartment Rent', amount: 1400, dueDate: '2026-11-05', recurring: 'monthly' },
    { id: 'b2', name: 'Health Insurance', amount: 380, dueDate: '2026-11-12', recurring: 'monthly' },
    { id: 'b3', name: 'Software & Tools', amount: 145, dueDate: '2026-11-18', recurring: 'monthly' },
    { id: 'b4', name: 'Fiber Internet', amount: 85, dueDate: '2026-11-20', recurring: 'monthly' },
  ]);

  const [clients, setClients] = useState<ClientPayment[]>([
    { id: 'c1', client: 'Apex Studio', amount: 3800, expectedDate: '2026-11-08', historicalLagDays: 14, reliabilityScore: 0.65, status: 'pending' },
    { id: 'c2', client: 'Nordic Brand House', amount: 1950, expectedDate: '2026-11-22', historicalLagDays: 3, reliabilityScore: 0.90, status: 'pending' },
    { id: 'c3', client: 'HyperFlow Media', amount: 1200, expectedDate: '2026-10-28', historicalLagDays: 21, reliabilityScore: 0.70, status: 'received' },
  ]);

  const [showLogPayment, setShowLogPayment] = useState<boolean>(false);
  const [logAmount, setLogAmount] = useState<number>(1000);
  const [logClientName, setLogClientName] = useState<string>('Apex Studio');
  const [recentBreakdown, setRecentBreakdown] = useState<PaymentBreakdown | null>(null);

  const [connectedWallets, setConnectedWallets] = useState<Array<{ address: string; type: 'Sui' | 'EVM'; balance: number }>>([
    { address: '0x3a4f...89e1', type: 'Sui', balance: 2450 },
    { address: '0x71C...a42B', type: 'EVM', balance: 1800 }
  ]);
  const [showConnectWallet, setShowConnectWallet] = useState<boolean>(false);
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

  const billsDueBeforePayday = bills.reduce((acc, b) => acc + b.amount, 0);

  const pendingIncome = clients.filter(c => c.status === 'pending');
  const conservativeExpectedIncome = pendingIncome.reduce(
    (acc, c) => acc + Math.round(c.amount * c.reliabilityScore),
    0
  );

  const rawSafeToSpend = bufferBalance - billsDueBeforePayday - taxSetAside - targetPaycheck + conservativeExpectedIncome;
  const safeToSpend = Math.max(0, rawSafeToSpend);
  const isGapAlert = rawSafeToSpend < 0;

  const processNewPayment = (amount: number, clientName: string) => {
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
    setBufferBalance(prev => prev + bufferPart + billsPart);
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
            userName
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

  return (
    <div className="min-h-screen bg-secondary text-primary font-sans flex flex-col text-lg">
      {/* 1. Toast Recipe: bg-primary, border-secondary, shadow-lg, rounded-lg, text-fg-success-primary icon */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-start gap-sm rounded-lg border border-secondary bg-primary p-lg shadow-lg max-w-md">
          <CheckCircle2 className="mt-xxs size-6 shrink-0 text-fg-success-primary" />
          <p className="text-md font-semibold text-secondary">{toastMessage}</p>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-secondary bg-primary sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-xl py-lg flex items-center justify-between">
          <div className="flex items-center gap-lg">
            {/* Featured Icon Recipe: rounded-full bg-brand-solid size-14 */}
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-solid text-primary-on-brand shadow-xs shrink-0">
              <Shield className="size-8 shrink-0 text-fg-white" />
            </span>
            <div>
              <span className="text-heading-md font-bold tracking-tight">Diction</span>
              <p className="text-md text-secondary font-medium">Earn and spend wisely, without going broke.</p>
            </div>
          </div>

          <div className="flex items-center gap-md">
            {/* Button Recipe (Secondary): rounded-lg bg-primary px-lg py-sm font-semibold text-secondary border border-primary shadow-xs */}
            <button
              onClick={() => setShowConnectWallet(true)}
              className="inline-flex items-center gap-sm rounded-lg bg-primary px-lg py-sm min-h-[56px] text-lg font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <Wallet className="size-6 text-brand-primary shrink-0" />
              <span>Wallets ({connectedWallets.length})</span>
            </button>
            <button
              onClick={() => setNavTab('settings')}
              className="inline-flex items-center gap-sm rounded-lg bg-primary px-lg py-sm min-h-[56px] text-lg font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
              title="Settings"
            >
              <Settings className="size-6 text-secondary shrink-0" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Tabs Recipe: baseline divider border-b border-secondary, selected tab border-b-2 border-brand text-brand-primary */}
      <nav className="bg-primary border-b border-secondary">
        <div className="max-w-7xl mx-auto px-xl flex items-center gap-lg overflow-x-auto">
          <button
            onClick={() => setNavTab('home')}
            className={`min-h-[56px] px-md py-sm text-lg font-semibold border-b-2 transition-colors flex items-center gap-sm ${
              navTab === 'home'
                ? 'border-brand text-brand-primary'
                : 'border-transparent text-tertiary hover:text-secondary focus-visible:ring-2 focus-visible:ring-focus-ring'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setNavTab('bills')}
            className={`min-h-[56px] px-md py-sm text-lg font-semibold border-b-2 transition-colors flex items-center gap-sm ${
              navTab === 'bills'
                ? 'border-brand text-brand-primary'
                : 'border-transparent text-tertiary hover:text-secondary focus-visible:ring-2 focus-visible:ring-focus-ring'
            }`}
          >
            Bills
          </button>
          <button
            onClick={() => setNavTab('taxes')}
            className={`min-h-[56px] px-md py-sm text-lg font-semibold border-b-2 transition-colors flex items-center gap-sm ${
              navTab === 'taxes'
                ? 'border-brand text-brand-primary'
                : 'border-transparent text-tertiary hover:text-secondary focus-visible:ring-2 focus-visible:ring-focus-ring'
            }`}
          >
            Taxes
          </button>
          <button
            onClick={() => setNavTab('paycheck')}
            className={`min-h-[56px] px-md py-sm text-lg font-semibold border-b-2 transition-colors flex items-center gap-sm ${
              navTab === 'paycheck'
                ? 'border-brand text-brand-primary'
                : 'border-transparent text-tertiary hover:text-secondary focus-visible:ring-2 focus-visible:ring-focus-ring'
            }`}
          >
            My Paycheck
          </button>
          <button
            onClick={() => setNavTab('learned')}
            className={`min-h-[56px] px-md py-sm text-lg font-semibold border-b-2 transition-colors flex items-center gap-sm ${
              navTab === 'learned'
                ? 'border-brand text-brand-primary'
                : 'border-transparent text-tertiary hover:text-secondary focus-visible:ring-2 focus-visible:ring-focus-ring'
            }`}
          >
            What Diction Learned
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-xl py-2xl space-y-2xl">
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

            {/* Status Banner */}
            <div
              className={`rounded-xl p-lg flex items-center justify-between border ${
                isGapAlert
                  ? 'bg-utility-error-50 border-error-subtle text-utility-error-600'
                  : safeToSpend < 1000
                  ? 'bg-utility-warning-50 border-utility-warning-200 text-utility-warning-700'
                  : 'bg-utility-success-50 border-utility-success-200 text-utility-success-700'
              }`}
            >
              <div className="flex items-center gap-md">
                <span className="size-4 rounded-full bg-current" />
                <span className="text-lg font-bold">
                  {isGapAlert
                    ? 'Hold off on spending'
                    : safeToSpend < 1000
                    ? 'Be careful'
                    : "You're doing well"}
                </span>
              </div>
              {/* Primary Button Recipe */}
              <button
                onClick={() => setShowLogPayment(true)}
                className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm min-h-[56px] text-lg font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <Plus className="size-6 shrink-0 text-fg-white" />
                <span>Log a payment</span>
              </button>
            </div>

            {/* 4. Large Card Recipe: rounded-xl border border-secondary bg-primary p-xl shadow-xs */}
            <section className="rounded-xl border border-secondary bg-primary p-2xl shadow-xs text-center md:text-left">
              <p className="text-sm font-semibold text-tertiary uppercase tracking-wider mb-sm">
                Safe to Spend
              </p>
              <p className="text-heading-2xl font-bold text-success-primary tracking-tight">
                ${safeToSpend.toLocaleString()}
              </p>
              <p className="mt-md text-xl text-secondary font-medium">
                This is after your bills, taxes and your paycheck are covered.
              </p>
            </section>

            {/* Four Smaller Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-xl">
              {/* 1. Your Buffer */}
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-tertiary">Your Buffer</p>
                  <Wallet className="size-6 text-brand-primary shrink-0" />
                </div>
                <p className="mt-md text-heading-xs font-semibold text-primary">
                  ${bufferBalance.toLocaleString()}
                </p>
                <p className="mt-xxs text-xs text-tertiary">All income lands here first</p>
              </section>

              {/* 2. Bills Coming Up */}
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-tertiary">Bills Coming Up</p>
                  <Calendar className="size-6 text-warning-primary shrink-0" />
                </div>
                <p className="mt-md text-heading-xs font-semibold text-primary">
                  ${billsDueBeforePayday.toLocaleString()}
                </p>
                <p className="mt-xxs text-xs text-tertiary">Due before next payday</p>
              </section>

              {/* 3. Tax Set Aside */}
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-tertiary">Tax Set Aside</p>
                  <Lock className="size-6 text-brand-primary shrink-0" />
                </div>
                <p className="mt-md text-heading-xs font-semibold text-primary">
                  ${taxSetAside.toLocaleString()}
                </p>
                <p className="mt-xxs text-xs text-tertiary">Estimate only, not tax advice</p>
              </section>

              {/* 4. Next Paycheck */}
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-tertiary">Next Paycheck</p>
                  <TrendingUp className="size-6 text-success-primary shrink-0" />
                </div>
                <p className="mt-md text-heading-xs font-semibold text-primary">
                  ${paycheckFunded.toLocaleString()}
                </p>
                <p className="mt-xxs text-xs text-tertiary">Payday on the {paydayDay}st</p>
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-heading-sm font-semibold text-primary">Upcoming Bills</h2>
                <p className="text-md text-tertiary">Everything due before your next payday is reserved in full.</p>
              </div>
              <button
                onClick={() => {
                  const billName = prompt('Enter bill name:');
                  const amount = prompt('Enter bill amount:');
                  if (billName && amount) {
                    setBills(prev => [
                      ...prev,
                      {
                        id: 'b_' + Date.now(),
                        name: billName,
                        amount: Number(amount),
                        dueDate: '2026-11-25',
                        recurring: 'monthly'
                      }
                    ]);
                    showToast('Bill added.');
                  }
                }}
                className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm min-h-[56px] text-lg font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <Plus className="size-6 shrink-0 text-fg-white" />
                <span>Add a bill</span>
              </button>
            </div>

            {/* 5. Table Recipe: overflow-hidden rounded-xl border border-secondary bg-primary, thead bg-secondary, th px-3xl py-md text-sm font-semibold text-quaternary, td px-3xl py-xl text-md text-tertiary */}
            <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
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
                        {/* 6. Badge Recipe: inline-flex items-center gap-xs rounded-full border border-utility-success-200 bg-utility-success-50 px-md py-xxs text-xs font-medium text-utility-success-700 */}
                        <span className="inline-flex items-center gap-xs rounded-full border border-utility-success-200 bg-utility-success-50 px-md py-xxs text-xs font-medium text-utility-success-700">
                          Covered by Buffer
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= SECTION: TAXES ================= */}
        {navTab === 'taxes' && (
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
        {navTab === 'paycheck' && (
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
              <div>
                <h2 className="text-heading-sm font-semibold text-primary">What Diction Learned</h2>
                <p className="text-md text-tertiary">
                  Every pattern, payment habit, and forecast rule stored in your personal memory. You can remove any item anytime.
                </p>
              </div>
              <button
                onClick={() => setShowAdminProofs(!showAdminProofs)}
                className="text-xs font-semibold text-tertiary hover:text-primary"
              >
                {showAdminProofs ? 'Hide audit proof' : 'Audit proof'}
              </button>
            </div>

            {/* Hidden admin proof section */}
            {showAdminProofs && (
              <div className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                <p className="text-sm font-semibold text-primary">Audit Log of Confirmed Storage Writes</p>
                <div className="space-y-xs text-sm font-mono text-secondary max-h-48 overflow-y-auto">
                  {adminBlobProof.length === 0 ? (
                    <p className="text-tertiary text-xs">No audit entries yet.</p>
                  ) : (
                    adminBlobProof.map((log, i) => (
                      <div key={i} className="flex justify-between border-b border-secondary py-xs">
                        <span>{log.timestamp}</span>
                        <span>{log.blobId}</span>
                        <span className="text-success-primary">{log.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Add custom memory */}
            <div className="rounded-xl border border-secondary bg-primary p-xl shadow-xs flex gap-md items-center">
              <input
                type="text"
                value={memoryInput}
                onChange={e => setMemoryInput(e.target.value)}
                placeholder="Teach Diction something (e.g. Apex Studio usually pays on Friday)..."
                className="rounded-md bg-primary px-lg py-sm text-lg text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring flex-1 min-h-[56px]"
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
                className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm min-h-[56px] text-lg font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring shrink-0"
              >
                Save memory
              </button>
            </div>

            {/* List of learned memories */}
            <div className="space-y-md">
              {memories.length === 0 ? (
                <div className="rounded-xl border border-secondary bg-primary p-2xl text-center text-secondary">
                  No memories saved yet. Log payments and teach Diction your client habits.
                </div>
              ) : (
                memories.map(m => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-secondary bg-primary p-xl shadow-xs flex items-center justify-between gap-lg hover:bg-secondary-hover"
                  >
                    <div>
                      <p className="text-lg font-semibold text-primary">{m.text}</p>
                      <div className="flex items-center gap-md mt-xs text-sm text-secondary">
                        <span className="text-tertiary">{new Date(m.createdAt).toLocaleDateString()}</span>
                        <span className="inline-flex items-center gap-xs rounded-full border border-utility-success-200 bg-utility-success-50 px-md py-xxs text-xs font-medium text-utility-success-700">
                          {m.status === 'confirmed' ? 'Saved' : 'Will save shortly'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMemory(m.id)}
                      className="text-tertiary hover:text-error-primary p-md rounded-md"
                      title="Delete this memory"
                    >
                      <Trash2 className="size-6" />
                    </button>
                  </div>
                ))
              )}
            </div>
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
      {showConnectWallet && (
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
                    balance: 1500
                  };
                  setConnectedWallets(prev => [...prev, newW]);
                  setBufferBalance(prev => prev + 1500);
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
                <label className="text-sm font-medium text-secondary">Who paid you?</label>
                <select
                  value={logClientName}
                  onChange={e => setLogClientName(e.target.value)}
                  className="rounded-md bg-primary px-lg py-sm text-sm text-primary border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring w-full min-h-[56px]"
                >
                  <option value="Apex Studio">Apex Studio</option>
                  <option value="Nordic Brand House">Nordic Brand House</option>
                  <option value="HyperFlow Media">HyperFlow Media</option>
                  <option value="Other Client">Other Client / New Client</option>
                </select>
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
                  processNewPayment(logAmount, logClientName);
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
        className="fixed bottom-6 right-6 z-40 rounded-full bg-brand-solid text-primary-on-brand shadow-lg hover:bg-brand-solid-hover p-lg flex items-center gap-sm min-h-[56px] font-semibold text-lg focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <MessageCircle className="size-7 shrink-0 text-fg-white" />
        <span className="pr-xs">Ask Diction</span>
      </button>

      {/* Assistant Chat Panel */}
      {isAssistantOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-md bg-primary border border-secondary rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[600px]">
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
