import React, { useState, useMemo } from 'react';
import { LogOut, Play, Square, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { useOutboxStore } from '../../store/outboxStore';
import { repository } from '../../services/repository'; 
import type { Timesheet } from '../../types/schema';

export function Header() {
  const signOut = useAuthStore((s) => s.signOut);
  const session = useAuthStore((s) => s.session);
  const [isProcessing, setIsProcessing] = useState(false);
  const pendingMutations = useOutboxStore((s) => s.mutations.length);

  const { data: allTimesheets = [], isLoading: checkingShift } = useQuery<Timesheet[]>({
    queryKey: ['timesheets'],
    queryFn: () => repository.read<Timesheet>('timesheets'),
    enabled: !!session?.user?.id,
  });

  const activeShift = useMemo(() => {
    if (!session?.user?.id || !allTimesheets.length) return null;
    return allTimesheets.find(
      (t) => t.user_id === session.user.id && !t.clock_out_time && !t.is_deleted
    ) || null;
  }, [allTimesheets, session?.user?.id]);

  const handleClockAction = async () => {
    if (!session?.user?.id) return;
    setIsProcessing(true);
    try {
      if (activeShift) {
        // USE CORRECT DB COLUMN NAMES
        await repository.write('timesheets', {
          ...activeShift,
          clock_out_time: new Date().toISOString(),
          status: 'COMPLETED'
        });
      } else {
        // USE CORRECT DB COLUMN NAMES
        await repository.write('timesheets', {
          id: session.user.id,
          shift_date: new Date().toISOString().split('T')[0],
          clock_in_time: new Date().toISOString(),
          status: 'ACTIVE',
        });
      }
    } catch (error) {
      console.error("Failed to update timesheet", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <header className="h-16 bg-[#0F1117] border-b border-slate-800/80 flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        {session?.user?.id && (
          <button 
            onClick={handleClockAction}
            disabled={isProcessing || checkingShift}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeShift ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={14} /> : activeShift ? <Square size={14} /> : <Play size={14} />}
            {activeShift ? 'Clock Out' : 'Clock In'}
          </button>
        )}
      </div>
      <button onClick={() => signOut()} className="text-slate-500 hover:text-white text-xs font-black uppercase">Log Out</button>
    </header>
  );
}