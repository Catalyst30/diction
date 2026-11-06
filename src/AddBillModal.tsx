import React, { useState } from 'react';

const today = () => new Date().toISOString().slice(0, 10);

export default function AddBillModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (b: { name: string; amount: number; dueDate: string; recurring: string }) => void }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [due, setDue] = useState(today());
  const [freq, setFreq] = useState('monthly');
  const [err, setErr] = useState('');
  if (!open) return null;
  const field = 'w-full rounded-lg border border-primary bg-primary px-lg py-sm min-h-[56px] text-lg text-primary';
  const lab = 'flex flex-col gap-xs text-sm font-semibold text-secondary';
  const save = () => {
    const a = Number(amount);
    if (!name.trim()) return setErr('Please enter the bill name.');
    if (!(a > 0)) return setErr('Please enter an amount above zero.');
    if (!due) return setErr('Please pick a valid due date. Check that the day exists, for example November has only 30 days.');
    onSave({ name: name.trim(), amount: a, dueDate: due, recurring: freq });
    setName(''); setAmount(''); setDue(today()); setFreq('monthly'); setErr(''); onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-md">
      <div className="fixed inset-0 bg-overlay opacity-70" onClick={onClose} />
      <div className="relative flex w-full flex-col gap-md rounded-lg border border-secondary bg-primary p-lg shadow-2xl sm:max-w-md">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary">Add a bill</h2>
          <button onClick={onClose} aria-label="Close" className="min-h-[48px] min-w-[48px] rounded-lg text-xl text-secondary">×</button>
        </div>
        <label className={lab}>Bill name<input className={field} placeholder="e.g. Rent" value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} /></label>
        <label className={lab}>Amount ($)<input className={field} type="number" min="0" value={amount} onChange={(e) => { setAmount(e.target.value); setErr(''); }} /></label>
        <label className={lab}>Due date<input className={field} type="date" value={due} onChange={(e) => { setDue(e.target.value); setErr(''); }} /></label>
        <label className={lab}>Frequency
          <select className={field} value={freq} onChange={(e) => setFreq(e.target.value)}>
            <option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="yearly">Yearly</option><option value="one-time">One time</option>
          </select>
        </label>
        {err && <p className="text-lg font-semibold" style={{ color: '#B42318' }}>{err}</p>}
        <button onClick={save} className="min-h-[56px] rounded-lg bg-brand-solid px-lg py-sm text-lg font-semibold text-primary-on-brand">Save bill</button>
      </div>
    </div>
  );
}
