import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { repository } from '../../services/repository';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface TimesheetRecord {
  id?: string;
  user_id: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string | null;
  is_deleted?: boolean;
}

export default function Timesheets() {
  // 1. Universal Offline-Safe Read
  const { data: rawTimesheets = [], isLoading } = useQuery<TimesheetRecord[]>({
    queryKey: ['timesheets'],
    queryFn: () => repository.read<TimesheetRecord>('timesheets'),
  });

  // 2. Component-Level Logic (Replacing the dead service layer)
  const activeRecords = useMemo(() => {
    return rawTimesheets
      .filter((t) => !t.is_deleted)
      .sort((a, b) => {
        // Sort newest first, safely handling null clock_in values
        const dateA = a.clock_in ? new Date(a.clock_in).getTime() : 0;
        const dateB = b.clock_in ? new Date(b.clock_in).getTime() : 0;
        return dateB - dateA;
      });
  }, [rawTimesheets]);

  if (isLoading) {
    return <div className="p-6 text-slate-500 uppercase tracking-widest text-xs font-bold">Loading vault records...</div>;
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans p-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">Timesheets</h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            Local Vault Ledger
          </p>
        </div>
      </div>

      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden relative">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0A0B0E] border-b border-slate-800/80 text-slate-500 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Staff ID</th>
                <th className="px-6 py-5">Clock In</th>
                <th className="px-6 py-5">Clock Out</th>
                <th className="px-6 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {activeRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0A0B0E] border border-slate-800/80 mb-4 shadow-inner">
                      <Clock size={24} className="text-slate-600" />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">No Records Found</h3>
                    <p className="text-xs font-bold text-slate-500 mt-2">The local ledger is currently empty.</p>
                  </td>
                </tr>
              ) : (
                activeRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-[#0A0B0E] transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-slate-300 truncate max-w-[150px]">
                      {record.user_id}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-emerald-400">
                      {record.clock_in ? new Date(record.clock_in).toLocaleString() : '--'}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                      {record.clock_out ? new Date(record.clock_out).toLocaleString() : 'ACTIVE SHIFT'}
                    </td>
                    <td className="px-6 py-4">
                      {record.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                          <CheckCircle2 size={12} /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20">
                          <AlertCircle size={12} /> {record.status || 'PENDING'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}