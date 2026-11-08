import React, { useState } from 'react';
import { useProfile, signOut } from './auth';

export default function AccountMenu({ open, onClose, taxRate, onOpenTour }: { open: boolean; onClose: () => void; taxRate: number; onOpenTour?: () => void }) {
  const profile = useProfile();
  const [view, setView] = useState<'menu' | 'profile'>('menu');
  if (!open) return null;
  let wallets: { type: string; address: string }[] = [];
  try { wallets = JSON.parse(localStorage.getItem('diction_wallets') || '[]'); } catch {}
  const close = () => { setView('menu'); onClose(); };
  const btn = 'w-full rounded-2xl border border-secondary bg-primary px-lg py-sm min-h-[52px] text-left text-base font-semibold text-primary hover:bg-primary-hover transition-all glow-card';
  const rows: [string, string][] = [
    ['Name', profile?.name || '-'], ['Email', profile?.email || '-'], ['Country', profile?.country || '-'],
    ['Tax rate', `${taxRate}%`], ['Work', profile?.work || '-'],
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-md">
      <div className="fixed inset-0 bg-overlay opacity-70" onClick={close} />
      <div className="relative flex w-full flex-col gap-md overflow-y-auto rounded-lg border border-secondary bg-primary p-lg shadow-2xl sm:max-w-md" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary">{view === 'menu' ? 'Settings' : 'My profile'}</h2>
          <button onClick={close} aria-label="Close" className="min-h-[48px] min-w-[48px] rounded-lg text-xl text-secondary">×</button>
        </div>
        {view === 'menu' ? (
          <>
            <button className={btn} onClick={() => setView('profile')}>My profile</button>
            {onOpenTour && (
              <button
                className={btn}
                onClick={() => {
                  close();
                  onOpenTour();
                }}
              >
                Launch interactive guide
              </button>
            )}
            <button className={btn} style={{ color: '#B42318' }} onClick={async () => { await signOut(); close(); }}>Sign out</button>
          </>
        ) : (
          <>
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-md border-t border-secondary py-sm text-lg">
                <span className="text-secondary">{k}</span><b className="text-right text-primary">{v}</b>
              </div>
            ))}
            <div className="border-t border-secondary py-sm text-lg">
              <span className="text-secondary">Wallets connected</span>
              {wallets.length === 0 && <p className="font-semibold text-primary">None yet</p>}
              {wallets.map((w) => <p key={w.address} className="font-semibold text-primary">{w.type}: {w.address.slice(0, 8)}...{w.address.slice(-6)}</p>)}
            </div>
            <button className={btn} onClick={() => setView('menu')}>Back</button>
          </>
        )}
      </div>
    </div>
  );
}
