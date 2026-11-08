import React, { useState } from 'react';
import { Calendar, DollarSign, Tag, Clock, X, Plus } from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);

export default function AddBillModal({
  open,
  onClose,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  onSave: (b: { name: string; amount: number; dueDate: string; recurring: 'monthly' | 'one-time' }) => void;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [due, setDue] = useState(today());
  const [freq, setFreq] = useState<'monthly' | 'one-time'>('monthly');
  const [err, setErr] = useState('');

  if (!open) return null;

  const save = () => {
    const a = Number(amount);
    if (!name.trim()) return setErr('Please enter the bill or expense name.');
    if (!(a > 0)) return setErr('Please enter an amount greater than zero.');
    if (!due) return setErr('Please select a valid due date.');

    onSave({ name: name.trim(), amount: a, dueDate: due, recurring: freq });
    setName('');
    setAmount('');
    setDue(today());
    setFreq('monthly');
    setErr('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Calendar className="size-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Upcoming Bill</h3>
              <p className="text-xs text-slate-500">Reserved automatically before your next payday</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 py-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Bill or Expense Name
            </label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Office Rent, Adobe Creative Cloud"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErr('');
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white min-h-[50px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Amount ($)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                min="0"
                step="10"
                placeholder="150"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErr('');
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white min-h-[50px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Due Date
              </label>
              <input
                type="date"
                value={due}
                onChange={(e) => {
                  setDue(e.target.value);
                  setErr('');
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-semibold text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white min-h-[50px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Frequency
              </label>
              <select
                value={freq}
                onChange={(e) => setFreq(e.target.value as 'monthly' | 'one-time')}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-semibold text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white min-h-[50px]"
              >
                <option value="monthly">Monthly Recurring</option>
                <option value="one-time">One-Time Expense</option>
              </select>
            </div>
          </div>

          {err && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/40">
              {err}
            </p>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={save}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 glow-btn"
          >
            <Plus className="size-4" />
            <span>Schedule Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
}
