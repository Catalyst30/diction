import React, { useEffect, useState } from 'react';

const NEW = '__new__';

export default function WhoPaid({ names, value, onChange }: { names: string[]; value: string; onChange: (v: string) => void }) {
  const [isNew, setIsNew] = useState(names.length === 0);
  const sel = isNew ? NEW : names.includes(value) ? value : names[0] || NEW;
  useEffect(() => {
    if (!isNew && names.length && !names.includes(value)) onChange(names[0]);
  }, [names.join('|'), isNew]);
  const field = 'w-full rounded-md border border-primary bg-primary px-lg py-sm min-h-[56px] text-lg text-primary';
  return (
    <div className="flex flex-col gap-sm">
      <label className="text-sm font-medium text-secondary">Who paid you?</label>
      <select
        className={field}
        value={sel}
        onChange={(e) => {
          if (e.target.value === NEW) { setIsNew(true); onChange(''); }
          else { setIsNew(false); onChange(e.target.value); }
        }}
      >
        {names.map((n) => <option key={n} value={n}>{n}</option>)}
        <option value={NEW}>Someone new (type their name)</option>
      </select>
      {isNew && (
        <input className={field} placeholder="Client or company name" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
