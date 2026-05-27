import { useEffect, useState } from 'react';
import { syncAll } from '../../lib/db';
import { useAuthStore } from '../../store/authStore'; // Import your auth store

export function SyncEngine() {
  const [status, setStatus] = useState<'IDLE' | 'BOOTING' | 'SYNCING' | 'COMPLETE' | 'ERROR'>('IDLE');
  const session = useAuthStore((s) => s.session); // Observe the session

  useEffect(() => {
    // Only run if we have a session
    if (!session) {
      console.log('[SyncEngine] Waiting for authentication...');
      return;
    }

    async function boot() {
      setStatus('BOOTING');
      try {
        console.log('[SyncEngine] Auth detected. Starting sync...');
        setStatus('SYNCING');
        await syncAll();
        setStatus('COMPLETE');
      } catch (err) {
        console.error('[SyncEngine] Pipeline failure:', err);
        setStatus('ERROR');
      }
    }

    boot();
  }, [session]); // Re-run whenever the session changes

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <div className={`px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 bg-[#0F1117] ${
        status === 'COMPLETE' ? 'border-emerald-500/20 text-emerald-500' : 
        status === 'SYNCING' || status === 'BOOTING' ? 'border-amber-500/20 text-amber-500' : 
        'border-rose-500/20 text-rose-500'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          status === 'SYNCING' || status === 'BOOTING' ? 'animate-ping bg-amber-500' : 
          status === 'COMPLETE' ? 'bg-emerald-500' : 'bg-rose-500'
        }`} />
        PIPELINE: {status}
      </div>
    </div>
  );
}