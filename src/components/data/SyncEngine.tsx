import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useOutboxStore } from '../../store/outboxStore';
import { queryClient } from '../../lib/db';
import { CloudOff, CloudUpload, Loader2 } from 'lucide-react';

export function SyncEngine() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  
  const mutations = useOutboxStore((s) => s.mutations);
  const removeMutation = useOutboxStore((s) => s.removeMutation);

  // --- 1. THE MISSING INBOUND ENGINE (Restored) ---
  // This forces TanStack Query to officially recognize inbound ElectricSQL shapes
  useEffect(() => {
    let isMounted = true;

    const hydrateLocalVault = async () => {
      if (!navigator.onLine) {
        setIsHydrating(false);
        return;
      }

      setIsHydrating(true);
      try {
        // In a production ElectricSQL v2 + TanStack DB environment, shapes take a few 
        // milliseconds to establish over HTTP. Once the connection stabilizes, 
        // we officially invalidate the TanStack Query cache. This forces the UI 
        // to re-read the newly populated local memory vault without any network overhead.
        
        // Give the background shapes a brief moment to stream the initial dataset
        await new Promise(resolve => setTimeout(resolve, 800)); 
        
        if (isMounted) {
          // Officially recognized TanStack cache sweep
          await queryClient.invalidateQueries();
        }
      } catch (error) {
        console.error('[SyncEngine] Hydration pipeline failed:', error);
      } finally {
        if (isMounted) setIsHydrating(false);
      }
    };

    // Run hydration on boot and whenever Wi-Fi is restored
    hydrateLocalVault();

    return () => {
      isMounted = false;
    };
  }, [isOnline]);

  // --- 2. THE OUTBOX DRAINER (Untouched) ---
  const processOutbox = useCallback(async () => {
    if (isSyncing || mutations.length === 0 || !navigator.onLine) return;
    
    setIsSyncing(true);

    const queue = [...mutations].sort((a, b) => 
      new Date((a.payload as any).created_at || 0).getTime() - new Date((b.payload as any).created_at || 0).getTime()
    );

    for (const item of queue) {
      try {
        const { error } = await supabase.from(item.table).upsert(item.payload);
        if (error) throw error;
        removeMutation(item.id);
      } catch (error) {
        console.warn(`[SyncEngine] Drain halted at ${item.table}. Connection unstable.`, error);
        break; 
      }
    }

    setIsSyncing(false);
  }, [isSyncing, mutations, removeMutation]);

  // --- 3. NETWORK EVENT LISTENERS ---
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOutbox();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine && mutations.length > 0 && !isSyncing) {
      processOutbox();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [mutations.length, processOutbox]);

  // --- 4. TELEMETRY UI ---
  if (isOnline && mutations.length === 0 && !isSyncing && !isHydrating) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 animate-in slide-in-from-bottom-4 fade-in duration-300">
      
      {!isOnline && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 backdrop-blur-md px-4 py-2.5 rounded-full shadow-2xl">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </div>
          <CloudOff size={14} className="text-rose-400" />
          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
            Offline Mode
          </span>
        </div>
      )}

      {(mutations.length > 0 || isHydrating) && (
        <div className="flex items-center gap-3 bg-[#0A0B0E]/90 border border-slate-800/80 backdrop-blur-md px-4 py-2.5 rounded-full shadow-2xl">
          {(isSyncing || isHydrating) ? (
            <Loader2 size={14} className="text-blue-500 animate-spin" />
          ) : isOnline ? (
             <CloudUpload size={14} className="text-amber-500 animate-pulse" />
          ) : (
            <CloudUpload size={14} className="text-slate-600" />
          )}
          
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            {isHydrating ? 'Hydrating Vault...' : isSyncing ? 'Syncing...' : 'Pending Sync'}
            {mutations.length > 0 && (
              <span className="ml-2 text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded text-[9px]">
                {mutations.length}
              </span>
            )}
          </span>
        </div>
      )}

    </div>
  );
}