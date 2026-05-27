import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useOutboxStore } from '../../store/outboxStore';
import { CloudOff, CloudUpload, Loader2 } from 'lucide-react';

export function SyncEngine() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Strict Zustand selectors
  const mutations = useOutboxStore((s) => s.mutations);
  const removeMutation = useOutboxStore((s) => s.removeMutation);

  const processOutbox = useCallback(async () => {
    if (isSyncing || mutations.length === 0 || !navigator.onLine) return;
    
    setIsSyncing(true);

    const queue = [...mutations].sort((a, b) => 
      new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );

    for (const item of queue) {
      try {
        const { error } = await supabase.from(item.table).upsert(item.payload);
        if (error) throw error;
        removeMutation(item.id);
      } catch (error) {
        console.warn(`[SyncEngine] Pipeline halted at ${item.table}. Resuming on next heartbeat.`, error);
        break; 
      }
    }

    setIsSyncing(false);
  }, [isSyncing, mutations, removeMutation]);

  useEffect(() => {
    let isMounted = true;

    const handleOnline = () => { if (isMounted) setIsOnline(true); };
    const handleOffline = () => { if (isMounted) setIsOnline(false); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine && mutations.length > 0 && !isSyncing) {
      processOutbox();
    }

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [mutations.length, processOutbox, isSyncing]);

  if (isOnline && mutations.length === 0 && !isSyncing) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none">
      {!isOnline && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 backdrop-blur-md px-4 py-2.5 rounded-full shadow-2xl pointer-events-auto">
          <CloudOff size={14} className="text-rose-400" />
          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Offline Failover Active</span>
        </div>
      )}
      {mutations.length > 0 && (
        <div className="flex items-center gap-3 bg-[#0A0B0E]/90 border border-slate-800/80 backdrop-blur-md px-4 py-2.5 rounded-full shadow-2xl pointer-events-auto">
          {isSyncing ? <Loader2 size={14} className="text-blue-500 animate-spin" /> : <CloudUpload size={14} className="text-amber-500 animate-pulse" />}
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            {isSyncing ? 'Synchronizing...' : 'Pending Sync'}
            <span className="ml-2 text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded text-[9px]">{mutations.length}</span>
          </span>
        </div>
      )}
    </div>
  );
}