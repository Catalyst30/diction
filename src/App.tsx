import React, { useState, useEffect } from 'react';
import WalletPanel from './WalletPanel';
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
   import LearningPanel from './LearningPanel';

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

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'bills', label: 'Bills', icon: Calendar },
    { id: 'taxes', label: 'Taxes', icon: DollarSign },
    { id: 'paycheck', label: 'Paycheck', icon: Wallet },
    { id: 'learned', label: 'Learned', icon: Sparkles },
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

      {/* Slim Header */}
      <header className="border-b border-secondary bg-primary sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-lg py-md flex items-center justify-between gap-md">
          <div className="flex items-center gap-md min-w-0">
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-solid shrink-0">
              <Shield className="size-6 text-fg-white" />
            </span>
            <span className="text-heading-sm font-bold tracking-tight">Diction</span>
            <p className="hidden md:block text-md text-secondary font-medium">
              Earn and spend wisely, without going broke.
            </p>
          </div>

          <div className="flex items-center gap-sm shrink-0">
            <button
              onClick={() => setShowConnectWallet(true)}
