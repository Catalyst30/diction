import React, { useState, useEffect } from 'react';
import {
  Shield,
  Wallet,
  Calendar,
  Lock,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  HelpCircle,
  Coins,
  ChevronRight
} from 'lucide-react';

export interface TourStep {
  id: string;
  tab?: 'home' | 'bills' | 'taxes' | 'paycheck' | 'learned';
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  features: string[];
  illustration: {
    icon: any;
    accentColor: string;
    bgColor: string;
    previewTitle: string;
    previewValue: string;
    previewSub: string;
  };
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'safe-to-spend',
    tab: 'home',
    badge: 'Core Feature',
    title: 'Never Go Broke: Safe-to-Spend',
    subtitle: 'Financial clarity engineered for freelancers',
    description:
      'Bank apps show your raw total, tricking you into overspending. Diction automatically subtracts upcoming bills, tax reserves, and your monthly salary buffer—revealing the exact amount you can spend today with zero guilt.',
    features: [
      'Live Safe-to-Spend calculation updated with every invoice',
      'Real-time buffer shielding you from income drought',
      'Instant spending advice via the "Ask Diction" AI'
    ],
    illustration: {
      icon: Shield,
      accentColor: '#4f46e5',
      bgColor: 'rgba(79, 70, 229, 0.12)',
      previewTitle: 'SAFE TO SPEND TODAY',
      previewValue: '$2,480.00',
      previewSub: 'Bills & taxes completely quarantined'
    }
  },
  {
    id: 'taxes',
    tab: 'taxes',
    badge: 'Automated Shield',
    title: 'Automated Tax Quarantine',
    subtitle: 'Never dread tax season again',
    description:
      'Based on your country, Diction automatically calculates and reserves your estimated tax percentage the instant a payment lands into your buffer. Your tax money is safely segregated and ready.',
    features: [
      'Auto-calculated tax estimates tailored for 50+ countries',
      'Customize your exact tax rate anytime in settings',
      'Clear breakdown for every client payment received'
    ],
    illustration: {
      icon: Lock,
      accentColor: '#0ea5e9',
      bgColor: 'rgba(14, 165, 233, 0.12)',
      previewTitle: 'TAX QUARANTINE',
      previewValue: '25% Auto-Reserved',
      previewSub: '$1,250 set aside safely for tax authority'
    }
  },
  {
    id: 'paycheck-bills',
    tab: 'paycheck',
    badge: 'Income Smoothing',
    title: 'Predictable Paycheck & Bills',
    subtitle: 'Turn irregular lump-sums into a steady salary',
    description:
      'Freelance income fluctuates wildly, but your life expenses don’t. Diction lets you set a monthly salary and payday. Your buffer smooths out erratic payments so you pay yourself like a salaried employee.',
    features: [
      'Scheduled monthly payday (e.g. 1st or 15th of the month)',
      'Upcoming bills calendar prioritized before payday',
      'Early warning gap alerts if incoming cash is lagging'
    ],
    illustration: {
      icon: TrendingUp,
      accentColor: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.12)',
      previewTitle: 'MONTHLY PAYCHECK',
      previewValue: '$3,500 / month',
      previewSub: 'Next payday scheduled on the 1st'
    }
  },
  {
    id: 'smart-memory',
    tab: 'learned',
    badge: 'AI Learning',
    title: 'Smart Client Memory & Walrus Storage',
    subtitle: 'Learns who pays on time and who lags',
    description:
      'Diction tracks the payment patterns of your clients over time. It calculates historical lag days and a reliability score, factoring that directly into your conservative cash flow predictions.',
    features: [
      'Client reliability score based on past payment behavior',
      'Notes and payment habits saved securely to Walrus decentralized storage',
      'Ask the AI guide whether you can afford new equipment'
    ],
    illustration: {
      icon: Sparkles,
      accentColor: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.12)',
      previewTitle: 'CLIENT RELIABILITY',
      previewValue: 'Apex Studio: 94% Trust',
      previewSub: 'Avg payment lag: 2 days (Consistent)'
    }
  },
  {
    id: 'sui-wallet',
    tab: 'home',
    badge: 'Web3 & Multi-chain',
    title: 'Sui Blockchain & Web3 Wallets',
    subtitle: 'Track your crypto earnings and live on-chain assets',
    description:
      'Connect your Sui wallet (Suiet, Sui Wallet, Nightly) or EVM address. Diction monitors your balances, incoming token payments, and updates your safe-to-spend buffer non-custodially without touching your private keys.',
    features: [
      'Seamless Sui Wallet Standard integration',
      'Live activity feed and USD conversion of SUI & tokens',
      'Non-custodial: your keys and funds always stay in your control'
    ],
    illustration: {
      icon: Coins,
      accentColor: '#0284c7',
      bgColor: 'rgba(2, 132, 199, 0.12)',
      previewTitle: 'SUI WALLET CONNECTED',
      previewValue: '1,420.50 SUI',
      previewSub: '0x3f...8a12 • Synced with safe buffer'
    }
  }
];

export default function GuidedTour({
  open,
  onClose,
  onNavigateTab
}: {
  open: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: 'home' | 'bills' | 'taxes' | 'paycheck' | 'learned') => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setStepIndex(0);
    }
  }, [open]);

  if (!open) return null;

  const current = TOUR_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const progressPercent = ((stepIndex + 1) / TOUR_STEPS.length) * 100;
  const Icon = current.illustration.icon;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('diction_tour_completed', 'true');
      onClose();
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      setStepIndex(prev => prev - 1);
    }
  };

  const handleJumpToTab = () => {
    if (current.tab && onNavigateTab) {
      onNavigateTab(current.tab);
    }
    localStorage.setItem('diction_tour_completed', 'true');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('diction_tour_completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={handleSkip}
      />

      {/* Main Tour Card */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 my-auto">
        {/* Top Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Interactive Guide · Step {stepIndex + 1} of {TOUR_STEPS.length}
              </p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                How Diction Works
              </h3>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close tour"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-8 space-y-6">
          {/* Visual Showcase Card */}
          <div
            className="relative overflow-hidden rounded-2xl p-5 sm:p-6 transition-all duration-500 border border-slate-100 dark:border-slate-800"
            style={{
              background: `linear-gradient(135deg, ${current.illustration.bgColor} 0%, rgba(255,255,255,0.02) 100%)`
            }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-sm text-white"
                  style={{ background: current.illustration.accentColor }}
                >
                  <Icon className="size-7" />
                </div>
                <div>
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
                    style={{
                      background: current.illustration.bgColor,
                      color: current.illustration.accentColor
                    }}
                  >
                    {current.badge}
                  </span>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {current.illustration.previewTitle}
                  </p>
                  <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {current.illustration.previewValue}
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 shadow-xs">
                {current.illustration.previewSub}
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-3">
            <h4 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {current.title}
            </h4>
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {current.subtitle}
            </p>
            <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
              {current.description}
            </p>
          </div>

          {/* Key Bullet Highlights */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Key Capabilities
            </p>
            <ul className="space-y-2">
              {current.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/50 sm:px-8">
          <div className="flex items-center gap-2">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStepIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === stepIndex
                    ? 'w-6 bg-indigo-600 dark:bg-indigo-500'
                    : 'w-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {current.tab && (
              <button
                onClick={handleJumpToTab}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 transition-colors mr-2"
              >
                <span>Jump to {current.tab}</span>
                <ChevronRight className="size-3.5" />
              </button>
            )}

            {!isFirst && (
              <button
                onClick={handleBack}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft className="size-4" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
            >
              <span>{isLast ? 'Got It! Start Using Diction' : 'Next Step'}</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
