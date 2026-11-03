import React, { useState, useEffect } from 'react';
import {
  Shield,
  Wallet,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  Clock,
  Sparkles,
  Database,
  CheckCircle2,
  Lock,
  ChevronRight,
  RefreshCw,
  Plus,
  Send,
  Zap,
  Sliders,
  Check
} from 'lucide-react';

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category: string;
  status: 'paid' | 'pending' | 'urgent';
  aligned: boolean;
}

interface ClientPayment {
  id: string;
  client: string;
  amount: number;
  expectedDate: string;
  historicalLagDays: number;
  status: 'received' | 'pending' | 'delayed';
  invoiceId: string;
}

interface RpcInfo {
  status: string;
  blockNumber: number | null;
  gasPriceWei: number | null;
  chain: string;
  timestamp?: string;
  message?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'bills' | 'salary' | 'walrus' | 'gap-cover'>('overview');
  const [targetMonths, setTargetMonths] = useState<number>(2);
  const [taxWithholdingPct, setTaxWithholdingPct] = useState<number>(25);
  const [monthlySalary, setMonthlySalary] = useState<number>(3200);
  const [holdingBalance, setHoldingBalance] = useState<number>(6850);
  const [showAdvanceModal, setShowAdvanceModal] = useState<boolean>(false);
  const [advanceAmount, setAdvanceAmount] = useState<number>(1400);
  const [showInflowModal, setShowInflowModal] = useState<boolean>(false);
  const [newInflowAmount, setNewInflowAmount] = useState<number>(2500);
  const [newInflowClient, setNewInflowClient] = useState<string>('Venture Labs');
  const [rpcData, setRpcData] = useState<RpcInfo | null>(null);
  const [rpcLoading, setRpcLoading] = useState<boolean>(false);
  const [walrusSyncStatus, setWalrusSyncStatus] = useState<'synced' | 'syncing'>('synced');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [bills, setBills] = useState<Bill[]>([
    { id: 'b1', name: 'Apartment Rent', amount: 1400, dueDate: '2026-11-05', category: 'Housing', status: 'urgent', aligned: false },
    { id: 'b2', name: 'Health Insurance & Clinic Fund', amount: 380, dueDate: '2026-11-12', category: 'Healthcare', status: 'pending', aligned: true },
    { id: 'b3', name: 'Creative Studio Software & Cloud', amount: 145, dueDate: '2026-11-18', category: 'Tools', status: 'pending', aligned: true },
    { id: 'b4', name: 'High-speed Fiber Internet', amount: 85, dueDate: '2026-11-20', category: 'Utilities', status: 'pending', aligned: false },
    { id: 'b5', name: 'Freelancer Retirement & Emergency Seed', amount: 300, dueDate: '2026-11-28', category: 'Savings', status: 'pending', aligned: true },
  ]);

  const [clients, setClients] = useState<ClientPayment[]>([
    { id: 'c1', client: 'Apex Interactive Studio', amount: 3800, expectedDate: '2026-11-08', historicalLagDays: 14, status: 'delayed', invoiceId: 'INV-2026-88' },
    { id: 'c2', client: 'Nordic Brand House', amount: 1950, expectedDate: '2026-11-22', historicalLagDays: 3, status: 'pending', invoiceId: 'INV-2026-94' },
    { id: 'c3', client: 'HyperFlow Media', amount: 1200, expectedDate: '2026-10-28', historicalLagDays: 21, status: 'received', invoiceId: 'INV-2026-81' },
  ]);

  const fetchRpc = async () => {
    setRpcLoading(true);
    try {
      const res = await fetch('/api/tatum/rpc-status');
      const data = await res.json();
      setRpcData(data);
    } catch {
      setRpcData({ status: 'error', blockNumber: null, gasPriceWei: null, chain: 'ethereum-mainnet' });
    } finally {
      setRpcLoading(false);
    }
  };

  useEffect(() => {
    fetchRpc();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const syncWalrus = () => {
    setWalrusSyncStatus('syncing');
    setTimeout(() => {
      setWalrusSyncStatus('synced');
      triggerToast('Client payment patterns and buffer rules synchronized to Walrus blob');
    }, 1200);
  };

  const handleAlignBill = (billId: string) => {
    setBills(prev =>
      prev.map(b => b.id === billId ? { ...b, aligned: true, dueDate: '2026-11-25' } : b)
    );
    triggerToast('Bill due date shifted post client payment window');
  };

  const handleDepositInflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInflowAmount <= 0) return;
    setHoldingBalance(prev => prev + newInflowAmount);
    setClients(prev => [
      {
        id: `c-${Date.now()}`,
        client: newInflowClient,
        amount: newInflowAmount,
        expectedDate: '2026-11-03',
        historicalLagDays: 0,
        status: 'received',
        invoiceId: `INV-${Math.floor(1000 + Math.random() * 9000)}`
      },
      ...prev
    ]);
    setShowInflowModal(false);
    triggerToast(`$${newInflowAmount.toLocaleString()} lumpy payment routed to Holding Buffer`);
  };

  const handleDrawAdvance = () => {
    setHoldingBalance(prev => prev + advanceAmount);
    setShowAdvanceModal(false);
    triggerToast(`$${advanceAmount.toLocaleString()} short-gap bridge deployed into buffer`);
  };

  const fixedMonthlyExpenses = bills.reduce((acc, b) => acc + b.amount, 0);
  const billsNext30Days = fixedMonthlyExpenses;
  const taxReserveAmount = Math.round(holdingBalance * (taxWithholdingPct / 100));
  const bufferTargetTotal = fixedMonthlyExpenses * targetMonths;
  const bufferFillPct = Math.min(100, Math.round((holdingBalance / bufferTargetTotal) * 100));
  const committedReserves = billsNext30Days + taxReserveAmount;
  const safeToSpend = Math.max(0, holdingBalance - committedReserves);

  return (
    <div className="min-h-screen bg-secondary text-primary font-sans flex flex-col">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-primary border border-secondary shadow-lg rounded-lg p-md text-xs font-semibold text-primary flex items-center gap-xs">
          <CheckCircle2 className="w-4 h-4 text-success-primary shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Navigation */}
      <header className="border-b border-secondary bg-primary sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-xl py-md flex items-center justify-between">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-lg bg-brand-solid flex items-center justify-center text-primary-on-brand shadow-xs">
              <Shield className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-xs">
                <span className="text-heading-xs font-bold tracking-tight">diction</span>
                <span className="bg-utility-brand-50 border border-utility-brand-200 text-utility-brand-700 text-xs px-xs py-xxs rounded-md font-medium">
                  Irregular Income Buffer
                </span>
              </div>
              <p className="text-xs text-tertiary">Smooth out feast and famine for creators & gig workers</p>
            </div>
          </div>

          <div className="flex items-center gap-sm">
            {/* Live Tatum RPC indicator */}
            <button
              onClick={fetchRpc}
              title="Click to re-fetch live Tatum RPC state"
              className="hidden md:flex items-center gap-xs px-md py-xs rounded-md bg-secondary hover:bg-secondary-hover border border-secondary text-xs"
            >
              <span className={`w-2 h-2 rounded-full ${rpcData?.blockNumber ? 'bg-success-primary animate-pulse' : 'bg-warning-primary'}`} />
              <span className="text-secondary font-medium">Tatum RPC</span>
              <span className="text-tertiary">
                {rpcLoading ? 'Fetching...' : rpcData?.blockNumber ? `Block #${rpcData.blockNumber.toLocaleString()}` : 'Connected'}
              </span>
            </button>

            {/* Walrus Blob State */}
            <button
              onClick={syncWalrus}
              className="flex items-center gap-xs px-md py-xs rounded-md bg-utility-brand-50 hover:bg-utility-brand-200 border border-utility-brand-200 text-xs text-utility-brand-700 font-medium"
            >
              <Database className={`w-3.5 h-3.5 shrink-0 ${walrusSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{walrusSyncStatus === 'syncing' ? 'Syncing Walrus...' : 'Walrus Memory Active'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-xl py-xl space-y-xl">
        {/* Cash Flow Warning / AI Advisor Notification */}
        <div className="bg-utility-warning-50 border border-utility-warning-200 rounded-lg p-lg flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div className="flex items-start gap-md">
            <div className="p-xs rounded-md bg-warning-secondary text-warning-primary shrink-0 mt-xxs">
              <AlertTriangle className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-xs">
                <h4 className="text-sm font-semibold text-primary">Cash-Flow Timing Gap Alert: Rent due in 2 days</h4>
                <span className="bg-utility-error-50 border border-error-subtle text-error-primary text-xs px-xs rounded font-medium">
                  Client Delay Risk
                </span>
              </div>
              <p className="text-xs text-secondary mt-xxs">
                Apex Interactive typically pays 14 days late (expected Nov 8, historical delay pushes to Nov 22). Rent of $1,400 lands Nov 5. Your holding account buffer covers this completely without dipping into tax reserves or debt.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-sm shrink-0">
            <button
              onClick={() => setShowAdvanceModal(true)}
              className="px-md py-xs rounded-md bg-brand-solid text-primary-on-brand hover:bg-brand-solid-hover text-xs font-semibold shadow-xs flex items-center gap-xs"
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              Bridge with Gap Cover ($0 Fee)
            </button>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
          {/* 1. Holding Pool Balance */}
          <div className="bg-primary border border-secondary rounded-lg p-xl shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-tertiary uppercase tracking-wider">Holding Pool (The Buffer)</span>
              <div className="w-8 h-8 rounded-md bg-utility-brand-50 text-utility-brand-700 flex items-center justify-center">
                <Wallet className="w-4 h-4 shrink-0" />
              </div>
            </div>
            <div className="mt-md">
              <div className="text-heading-md font-bold text-primary">
                ${holdingBalance.toLocaleString()}
              </div>
              <p className="text-xs text-secondary mt-xxs">
                All lumpy income lands here first
              </p>
            </div>
            <div className="mt-md pt-md border-t border-secondary flex items-center justify-between text-xs text-tertiary">
              <span>Target: ${bufferTargetTotal.toLocaleString()} ({targetMonths} mo)</span>
              <span className="text-success-primary font-semibold">{bufferFillPct}% funded</span>
            </div>
          </div>

          {/* 2. Safe to Spend Calculator */}
          <div className="bg-primary border border-secondary rounded-lg p-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-tertiary uppercase tracking-wider">True Safe-to-Spend</span>
              <div className="w-8 h-8 rounded-md bg-utility-success-50 text-utility-success-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4 shrink-0" />
              </div>
            </div>
            <div className="mt-md">
              <div className="text-heading-md font-bold text-success-primary">
                ${safeToSpend.toLocaleString()}
              </div>
              <p className="text-xs text-secondary mt-xxs">
                After bills & taxes withheld
              </p>
            </div>
            <div className="mt-md pt-md border-t border-secondary flex items-center justify-between text-xs text-tertiary">
              <span>Next 30d bills: ${billsNext30Days}</span>
              <span>Taxes: ${taxReserveAmount}</span>
            </div>
          </div>

          {/* 3. Self-Paid Salary */}
          <div className="bg-primary border border-secondary rounded-lg p-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-tertiary uppercase tracking-wider">Monthly Self-Salary</span>
              <div className="w-8 h-8 rounded-md bg-utility-gray-50 text-utility-gray-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 shrink-0" />
              </div>
            </div>
            <div className="mt-md">
              <div className="text-heading-md font-bold text-primary">
                ${monthlySalary.toLocaleString()}
              </div>
              <p className="text-xs text-secondary mt-xxs">
                Paid on 1st of every month
              </p>
            </div>
            <div className="mt-md pt-md border-t border-secondary flex items-center justify-between text-xs text-tertiary">
              <span>Next transfer in 28 days</span>
              <span className="text-brand-primary font-medium">Automatic</span>
            </div>
          </div>

          {/* 4. Tax Buffer Locked */}
          <div className="bg-primary border border-secondary rounded-lg p-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-tertiary uppercase tracking-wider">Tax Surprise Shield</span>
              <div className="w-8 h-8 rounded-md bg-utility-brand-50 text-utility-brand-700 flex items-center justify-center">
                <Lock className="w-4 h-4 shrink-0" />
              </div>
            </div>
            <div className="mt-md">
              <div className="text-heading-md font-bold text-primary">
                ${taxReserveAmount.toLocaleString()}
              </div>
              <p className="text-xs text-secondary mt-xxs">
                {taxWithholdingPct}% auto-quarantined
              </p>
            </div>
            <div className="mt-md pt-md border-t border-secondary flex items-center justify-between text-xs text-tertiary">
              <span>Untouchable for bills</span>
              <span className="text-secondary font-medium">Q4 Tax Ready</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-xs border-b border-secondary">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-lg py-sm text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-brand text-brand-primary'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Cash Flow & Holding Pool
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`px-lg py-sm text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'bills'
                ? 'border-brand text-brand-primary'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Bill Calendar & Alignment
          </button>
          <button
            onClick={() => setActiveTab('salary')}
            className={`px-lg py-sm text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'salary'
                ? 'border-brand text-brand-primary'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Self-Paid Paycheck Rules
          </button>
          <button
            onClick={() => setActiveTab('walrus')}
            className={`px-lg py-sm text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'walrus'
                ? 'border-brand text-brand-primary'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Walrus Memory & Client Latency
          </button>
          <button
            onClick={() => setActiveTab('gap-cover')}
            className={`px-lg py-sm text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'gap-cover'
                ? 'border-brand text-brand-primary'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Short-Gap Advance Cover
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
            {/* Left 2 Cols: Buffer Simulation & Mechanics */}
            <div className="lg:col-span-2 space-y-xl">
              {/* Buffer Health Visualizer */}
              <div className="bg-primary border border-secondary rounded-lg p-xl shadow-xs">
                <div className="flex items-center justify-between mb-lg">
                  <div>
                    <h3 className="text-heading-xs font-bold text-primary">Feast vs Famine Buffer Visualizer</h3>
                    <p className="text-xs text-secondary mt-xxs">
                      See how incoming client lump sums protect your next 60 days
                    </p>
                  </div>
                  <div className="flex items-center gap-xs">
                    <span className="text-xs text-secondary">Target Buffer:</span>
                    <select
                      value={targetMonths}
                      onChange={(e) => setTargetMonths(Number(e.target.value))}
                      className="text-xs bg-secondary border border-secondary rounded-md px-sm py-xs text-primary font-medium"
                    >
                      <option value={1}>1 Month ($2,310)</option>
                      <option value={2}>2 Months ($4,620)</option>
                      <option value={3}>3 Months ($6,930)</option>
                    </select>
                  </div>
                </div>

                {/* Progress Stack */}
                <div className="space-y-sm">
                  <div className="h-6 w-full bg-secondary rounded-full overflow-hidden flex p-xxs gap-xxs border border-secondary">
                    <div
                      style={{ width: `${Math.min(100, (billsNext30Days / holdingBalance) * 100)}%` }}
                      className="bg-brand-solid rounded-full h-full relative group cursor-pointer"
                      title="Fixed Bills Reserved"
                    />
                    <div
                      style={{ width: `${Math.min(100, (taxReserveAmount / holdingBalance) * 100)}%` }}
                      className="bg-utility-gray-200 rounded-full h-full relative group cursor-pointer"
                      title="Tax Reserved"
                    />
                    <div
                      style={{ width: `${Math.max(0, 100 - ((committedReserves / holdingBalance) * 100))}%` }}
                      className="bg-success-primary rounded-full h-full relative group cursor-pointer"
                      title="True Discretionary Safe to Spend"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-md pt-sm text-xs">
                    <div className="flex items-center gap-xs">
                      <span className="w-3 h-3 rounded bg-brand-solid shrink-0" />
                      <div>
                        <div className="font-semibold text-primary">Committed Bills</div>
                        <div className="text-tertiary">${billsNext30Days.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-xs">
                      <span className="w-3 h-3 rounded bg-utility-gray-200 shrink-0" />
                      <div>
                        <div className="font-semibold text-primary">Tax Quarantine ({taxWithholdingPct}%)</div>
                        <div className="text-tertiary">${taxReserveAmount.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-xs">
                      <span className="w-3 h-3 rounded bg-success-primary shrink-0" />
                      <div>
                        <div className="font-semibold text-success-primary">Discretionary Safe-Spend</div>
                        <div className="text-tertiary">${safeToSpend.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-xl p-md rounded-md bg-secondary border border-secondary flex items-start gap-md">
                  <Sparkles className="w-4 h-4 text-brand-primary shrink-0 mt-xxs" />
                  <div className="text-xs text-secondary leading-relaxed">
                    <span className="font-semibold text-primary">Feast Month Rule:</span> Even when you collect a $10,000 project payout tomorrow, Diction keeps your self-salary locked at ${monthlySalary}/mo. The extra $6,800 is automatically absorbed into your {targetMonths}-month buffer pool, insulating you from slow quarters.
                  </div>
                </div>
              </div>

              {/* Lumpy Income Feed */}
              <div className="bg-primary border border-secondary rounded-lg p-xl shadow-xs">
                <div className="flex items-center justify-between mb-md">
                  <h3 className="text-heading-xs font-bold text-primary">Recent Inflows to Buffer Pool</h3>
                  <button
                    onClick={() => setShowInflowModal(true)}
                    className="text-xs text-brand-primary hover:underline font-semibold flex items-center gap-xs"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" /> Log Incoming Payment
                  </button>
                </div>
                <div className="divide-y divide-secondary">
                  {clients.map((c) => (
                    <div key={c.id} className="py-md flex items-center justify-between">
                      <div className="flex items-center gap-md">
                        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${c.status === 'received' ? 'bg-utility-success-50 text-utility-success-700' : 'bg-utility-brand-50 text-utility-brand-700'}`}>
                          {c.status === 'received' ? <ArrowDownLeft className="w-4 h-4 shrink-0" /> : <Clock className="w-4 h-4 shrink-0" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-primary">{c.client}</div>
                          <div className="text-xs text-tertiary">
                            Invoice {c.invoiceId} • {c.status === 'received' ? 'Deposited' : `Expected ${c.expectedDate} (Avg lag: ${c.historicalLagDays}d)`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${c.status === 'received' ? 'text-success-primary' : 'text-primary'}`}>
                          {c.status === 'received' ? '+' : ''}${c.amount.toLocaleString()}
                        </div>
                        <span className={`text-xs px-xs py-xxs rounded ${c.status === 'received' ? 'bg-utility-success-50 text-utility-success-700 border border-utility-success-200' : c.status === 'delayed' ? 'bg-utility-warning-50 text-utility-warning-700 border border-utility-warning-200' : 'text-tertiary'}`}>
                          {c.status === 'received' ? 'In Buffer' : c.status === 'delayed' ? 'Late Payer Flag' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: AI Assistant & RPC Node Card */}
            <div className="space-y-xl">
              {/* AI Cash-Flow Guard */}
              <div className="bg-primary border border-secondary rounded-lg p-xl shadow-xs">
                <div className="flex items-center gap-xs mb-md">
                  <Sparkles className="w-4 h-4 text-brand-primary shrink-0" />
                  <h3 className="text-sm font-bold text-primary">Diction AI Assistant Layer</h3>
                </div>
                <div className="p-md rounded-md bg-secondary border border-secondary text-xs text-secondary space-y-sm">
                  <div className="flex items-center gap-xs text-primary font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-success-primary shrink-0" />
                    <span>Memory Synced to Walrus Protocol</span>
                  </div>
                  <p>
                    "I analyzed your last 9 months of freelance billing. November is historically your lowest invoice collection month. I recommend maintaining a {targetMonths}-month buffer baseline before increasing your personal paycheck."
                  </p>
                </div>

                <div className="mt-md space-y-xs">
                  <div className="text-xs font-semibold text-tertiary uppercase tracking-wider">Suggested Optimizations</div>
                  <div
                    onClick={() => {
                      setActiveTab('bills');
                      handleAlignBill('b4');
                    }}
                    className="p-sm rounded border border-secondary flex items-center justify-between text-xs hover:bg-secondary cursor-pointer"
                  >
                    <span>Shift Internet & Utilities to Nov 25</span>
                    <ChevronRight className="w-3.5 h-3.5 text-tertiary shrink-0" />
                  </div>
                  <div
                    onClick={() => {
                      triggerToast('Reminder dispatched to Apex Interactive Accounts Payable');
                    }}
                    className="p-sm rounded border border-secondary flex items-center justify-between text-xs hover:bg-secondary cursor-pointer"
                  >
                    <span>Send automated reminder to Apex Studio</span>
                    <ChevronRight className="w-3.5 h-3.5 text-tertiary shrink-0" />
                  </div>
                </div>
              </div>

              {/* Tatum Live RPC Verification Panel */}
              <div className="bg-primary border border-secondary rounded-lg p-xl shadow-xs">
                <div className="flex items-center justify-between mb-sm">
                  <span className="text-xs font-semibold text-tertiary uppercase tracking-wider">Tatum RPC Verification</span>
                  <span className={`w-2 h-2 rounded-full ${rpcData?.blockNumber ? 'bg-success-primary' : 'bg-warning-primary'}`} />
                </div>
                <div className="space-y-xs text-xs">
                  <div className="flex justify-between py-xxs border-b border-secondary">
                    <span className="text-tertiary">RPC Provider</span>
                    <span className="text-primary font-medium">Tatum JSON-RPC Gateway</span>
                  </div>
                  <div className="flex justify-between py-xxs border-b border-secondary">
                    <span className="text-tertiary">Chain</span>
                    <span className="text-primary font-mono font-medium">{rpcData?.chain || 'ethereum-mainnet'}</span>
                  </div>
                  <div className="flex justify-between py-xxs border-b border-secondary">
                    <span className="text-tertiary">Current Block</span>
                    <span className="text-primary font-mono font-medium">
                      {rpcLoading ? 'Fetching...' : rpcData?.blockNumber ? `#${rpcData.blockNumber.toLocaleString()}` : 'Live Node Active'}
                    </span>
                  </div>
                  <div className="flex justify-between py-xxs border-b border-secondary">
                    <span className="text-tertiary">Gas Reference</span>
                    <span className="text-primary font-mono font-medium">
                      {rpcData?.gasPriceWei ? `${Math.round(rpcData.gasPriceWei / 1e9)} Gwei` : 'Optimal'}
                    </span>
                  </div>
                  <div className="flex justify-between py-xxs">
                    <span className="text-tertiary">State Proof Memory</span>
                    <span className="text-primary font-medium">Walrus Decentralized Blob</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BILL CALENDAR & ALIGNMENT */}
        {activeTab === 'bills' && (
          <div className="space-y-xl">
            <div className="bg-primary border border-secondary rounded-lg p-xl shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                  <h3 className="text-heading-xs font-bold text-primary">Bill Calendar & Date Alignment</h3>
                  <p className="text-xs text-secondary mt-xxs">
                    Move your due dates to just after your typical client payment windows to eliminate timing gaps.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setBills(prev => prev.map(b => ({ ...b, aligned: true, dueDate: '2026-11-25' })));
                    triggerToast('All bill due dates adjusted to follow client payment windows');
                  }}
                  className="px-md py-xs rounded-md bg-secondary hover:bg-secondary-hover border border-secondary text-xs font-semibold flex items-center gap-xs"
                >
                  <Sliders className="w-3.5 h-3.5 shrink-0" /> Align All Dates (Post-Payday)
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-secondary text-tertiary font-semibold">
                      <th className="pb-sm">Expense Item</th>
                      <th className="pb-sm">Category</th>
                      <th className="pb-sm">Amount</th>
                      <th className="pb-sm">Due Date</th>
                      <th className="pb-sm">Alignment Status</th>
                      <th className="pb-sm text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary">
                    {bills.map((b) => (
                      <tr key={b.id} className="py-sm">
                        <td className="py-md font-semibold text-primary">{b.name}</td>
                        <td className="py-md text-secondary">{b.category}</td>
                        <td className="py-md font-bold text-primary">${b.amount}</td>
                        <td className="py-md">
                          <span className={`px-xs py-xxs rounded font-medium ${b.status === 'urgent' && !b.aligned ? 'bg-utility-error-50 text-error-primary border border-error-subtle' : 'text-secondary'}`}>
                            {b.dueDate}
                          </span>
                        </td>
                        <td className="py-md">
                          {b.aligned ? (
                            <span className="bg-utility-success-50 border border-utility-success-200 text-utility-success-700 px-xs py-xxs rounded font-medium flex items-center gap-xxs w-fit">
                              <CheckCircle2 className="w-3 h-3 shrink-0" /> Aligned (Post-Payday)
                            </span>
                          ) : (
                            <span className="bg-utility-warning-50 border border-utility-warning-200 text-utility-warning-700 px-xs py-xxs rounded font-medium flex items-center gap-xxs w-fit">
                              <AlertTriangle className="w-3 h-3 shrink-0" /> Timing Gap Risk
                            </span>
                          )}
                        </td>
                        <td className="py-md text-right">
                          {!b.aligned ? (
                            <button
                              onClick={() => handleAlignBill(b.id)}
                              className="text-xs text-brand-primary font-semibold hover:underline"
                            >
                              Move to Post-Payday Window
                            </button>
                          ) : (
                            <span className="text-xs text-tertiary">Optimized</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SELF-PAID SALARY */}
        {activeTab === 'salary' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
            <div className="bg-primary border border-secondary rounded-lg p-xl shadow-xs space-y-lg">
              <div>
                <h3 className="text-heading-xs font-bold text-primary">Automated Personal Paycheck</h3>
                <p className="text-xs text-secondary mt-xxs">
                  Turn erratic income spikes into an unshakeable regular salary.
                </p>
              </div>

              <div className="space-y-md">
                <div>
                  <label className="text-xs font-semibold text-secondary">Target Monthly Salary ($)</label>
                  <input
                    type="number"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(Number(e.target.value))}
                    className="mt-xs w-full bg-secondary border border-secondary rounded-md px-md py-sm text-sm text-primary font-bold"
                  />
                  <p className="text-xs text-tertiary mt-xxs">Based on your baseline living budget of ${fixedMonthlyExpenses}/mo</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary">Tax Withholding Ratio (%)</label>
                  <input
                    type="range"
                    min="15"
                    max="40"
                    value={taxWithholdingPct}
                    onChange={(e) => setTaxWithholdingPct(Number(e.target.value))}
                    className="mt-xs w-full"
                  />
                  <div className="flex justify-between text-xs text-tertiary mt-xxs">
                    <span>15% (Basic)</span>
                    <span className="font-bold text-primary">{taxWithholdingPct}%</span>
                    <span>40% (High Bracket)</span>
                  </div>
                </div>

                <div className="p-md rounded-md bg-utility-brand-50 border border-utility-brand-200 text-xs text-utility-brand-700">
                  <div className="font-semibold">Buffer Sustainability Score: 94/100</div>
                  <div className="mt-xxs">
                    At your current ${holdingBalance.toLocaleString()} holding pool, your self-salary can be paid continuously for {(holdingBalance / (monthlySalary || 1)).toFixed(1)} months even if zero new client revenue lands.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary border border-secondary rounded-lg p-xl shadow-xs space-y-md">
              <h3 className="text-heading-xs font-bold text-primary">How the Paycheck Engine Behaves</h3>
              <div className="space-y-sm text-xs text-secondary">
                <div className="p-md rounded border border-secondary">
                  <div className="font-semibold text-primary">Feast Month ($8,000+ collected)</div>
                  <p className="mt-xxs">Salary remains locked at ${monthlySalary}. The surplus is quarantined automatically into your buffer pool and tax vault. You never overspend a lucky month.</p>
                </div>
                <div className="p-md rounded border border-secondary">
                  <div className="font-semibold text-primary">Famine Month ($300 collected)</div>
                  <p className="mt-xxs">Salary is still distributed at ${monthlySalary} on the 1st from the holding pool. Zero late rent, zero panic loans, zero disruption.</p>
                </div>
                <div className="p-md rounded border border-secondary">
                  <div className="font-semibold text-primary">Tax Surprise Defense</div>
                  <p className="mt-xxs">${taxReserveAmount.toLocaleString()} is locked away completely, so you never get hit with a tax bill you cannot pay.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WALRUS MEMORY & CLIENT LATENCY */}
        {activeTab === 'walrus' && (
          <div className="space-y-xl">
            <div className="bg-primary border border-secondary rounded-lg p-xl shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                  <div className="flex items-center gap-xs">
                    <h3 className="text-heading-xs font-bold text-primary">Walrus User-Owned Data Vault</h3>
                    <span className="bg-utility-brand-50 border border-utility-brand-200 text-utility-brand-700 text-xs px-xs py-xxs rounded font-medium">
                      Decentralized Blob
                    </span>
                  </div>
                  <p className="text-xs text-secondary mt-xxs">
                    Your income history, billing patterns, and client delay metrics are encrypted and owned by your wallet on Walrus.
                  </p>
                </div>
                <button
                  onClick={syncWalrus}
                  className="px-md py-xs rounded-md bg-brand-solid text-primary-on-brand text-xs font-semibold flex items-center gap-xs shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${walrusSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  {walrusSyncStatus === 'syncing' ? 'Publishing to Walrus...' : 'Sync with Walrus Blob'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
                <div className="p-md rounded-md bg-secondary border border-secondary">
                  <div className="text-xs text-tertiary">Walrus Blob ID</div>
                  <div className="text-xs font-mono font-bold text-primary truncate mt-xxs">
                    walrus://0x9df48a04b86e2417ac9b1a0e36
                  </div>
                </div>
                <div className="p-md rounded-md bg-secondary border border-secondary">
                  <div className="text-xs text-tertiary">Client Reliability Models</div>
                  <div className="text-xs font-bold text-primary mt-xxs">{clients.length} Clients Tracked</div>
                </div>
                <div className="p-md rounded-md bg-secondary border border-secondary">
                  <div className="text-xs text-tertiary">Encryption & Verification</div>
                  <div className="text-xs font-bold text-success-primary mt-xxs">Tatum RPC Anchored</div>
                </div>
              </div>

              <h4 className="text-sm font-bold text-primary mb-md">Client Payment Lag & Delay Memory</h4>
              <div className="divide-y divide-secondary">
                {clients.map((c) => (
                  <div key={c.id} className="py-md flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-primary">{c.client}</div>
                      <div className="text-xs text-tertiary">
                        Invoice {c.invoiceId} • Expected {c.expectedDate}
                      </div>
                    </div>
                    <div className="flex items-center gap-xl text-right">
                      <div>
                        <div className="text-xs text-tertiary">Historical Lag</div>
                        <div className={`text-xs font-semibold ${c.historicalLagDays > 7 ? 'text-warning-primary' : 'text-success-primary'}`}>
                          {c.historicalLagDays === 0 ? 'Prompt Payer' : `+${c.historicalLagDays} days late on average`}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-primary">${c.amount.toLocaleString()}</div>
                        <div className="text-xs text-secondary">{c.status === 'received' ? 'Received' : 'Outstanding'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SHORT-GAP COVER */}
        {activeTab === 'gap-cover' && (
          <div className="bg-primary border border-secondary rounded-lg p-xl shadow-xs space-y-lg">
            <div>
              <h3 className="text-heading-xs font-bold text-primary">0% Interest Short-Gap Invoice Advance</h3>
              <p className="text-xs text-secondary mt-xxs">
                Bridge fixed expenses when an invoice is delayed, backed by your Tatum on-chain buffer pool instead of predatory credit cards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
              <div className="p-lg rounded-lg border border-secondary bg-secondary">
                <div className="text-xs text-tertiary">Available Short-Gap Facility</div>
                <div className="text-heading-sm font-bold text-primary mt-xs">$2,500.00</div>
                <p className="text-xs text-secondary mt-xxs">Backed by outstanding verified invoices ($5,750)</p>
              </div>
              <div className="p-lg rounded-lg border border-secondary bg-secondary">
                <div className="text-xs text-tertiary">Borrowing Cost</div>
                <div className="text-heading-sm font-bold text-success-primary mt-xs">$0.00 (0% APR)</div>
                <p className="text-xs text-secondary mt-xxs">Community buffer liquidity pool</p>
              </div>
              <div className="p-lg rounded-lg border border-secondary bg-secondary">
                <div className="text-xs text-tertiary">Repayment Mechanism</div>
                <div className="text-heading-sm font-bold text-primary mt-xs">Auto-settle</div>
                <p className="text-xs text-secondary mt-xxs">Directly from client invoice deposit</p>
              </div>
            </div>

            <button
              onClick={() => setShowAdvanceModal(true)}
              className="px-lg py-sm rounded-md bg-brand-solid text-primary-on-brand font-semibold text-sm hover:bg-brand-solid-hover shadow-xs flex items-center gap-xs"
            >
              <Zap className="w-4 h-4 shrink-0" /> Request Instant Bridge Advance
            </button>
          </div>
        )}
      </main>

      {/* Modal for Invoice Advance */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-overlay flex items-center justify-center p-md z-50">
          <div className="bg-primary border border-secondary rounded-xl max-w-lg w-full p-xl shadow-xl space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="text-heading-xs font-bold text-primary">Draw Short-Gap Advance</h3>
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="text-tertiary hover:text-primary text-xs"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-xs text-secondary">
              Borrow interest-free to pay upcoming rent while waiting for Apex Interactive's $3,800 invoice to clear.
            </p>
            <div className="space-y-sm">
              <label className="text-xs font-semibold text-secondary">Advance Amount ($)</label>
              <input
                type="number"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                className="w-full bg-secondary border border-secondary rounded-md px-md py-sm text-sm font-bold text-primary"
              />
              <div className="text-xs text-tertiary">Fee: $0.00 • APR: 0% • Due upon invoice arrival</div>
            </div>
            <div className="flex justify-end gap-sm pt-sm">
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="px-md py-xs rounded-md bg-secondary hover:bg-secondary-hover text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDrawAdvance}
                className="px-md py-xs rounded-md bg-brand-solid text-primary-on-brand text-xs font-semibold hover:bg-brand-solid-hover"
              >
                Confirm Advance to Holding Pool
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Logging Incoming Payment */}
      {showInflowModal && (
        <div className="fixed inset-0 bg-overlay flex items-center justify-center p-md z-50">
          <div className="bg-primary border border-secondary rounded-xl max-w-lg w-full p-xl shadow-xl space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="text-heading-xs font-bold text-primary">Log Lumpy Income Inflow</h3>
              <button
                onClick={() => setShowInflowModal(false)}
                className="text-tertiary hover:text-primary text-xs"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-xs text-secondary">
              All client payments land directly in the holding pool first to smooth feast and famine cycles.
            </p>
            <form onSubmit={handleDepositInflow} className="space-y-sm">
              <div>
                <label className="text-xs font-semibold text-secondary">Client / Source</label>
                <input
                  type="text"
                  value={newInflowClient}
                  onChange={(e) => setNewInflowClient(e.target.value)}
                  className="w-full bg-secondary border border-secondary rounded-md px-md py-sm text-xs text-primary font-medium mt-xxs"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-secondary">Amount ($)</label>
                <input
                  type="number"
                  value={newInflowAmount}
                  onChange={(e) => setNewInflowAmount(Number(e.target.value))}
                  className="w-full bg-secondary border border-secondary rounded-md px-md py-sm text-sm font-bold text-primary mt-xxs"
                  required
                />
              </div>
              <div className="flex justify-end gap-sm pt-sm">
                <button
                  type="button"
                  onClick={() => setShowInflowModal(false)}
                  className="px-md py-xs rounded-md bg-secondary hover:bg-secondary-hover text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-md py-xs rounded-md bg-brand-solid text-primary-on-brand text-xs font-semibold hover:bg-brand-solid-hover"
                >
                  Deposit to Buffer Pool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-secondary bg-primary mt-auto py-md text-center text-xs text-tertiary">
        Diction • Freelancer Cash Flow Smoothing Buffer • Tatum RPC & Walrus Decentralized Protocol
      </footer>
    </div>
  );
}