// src/features/settings/SystemHealth.tsx
import React, { useState } from 'react';
import { RefreshCw, Activity, AlertCircle, CheckCircle2, Server } from 'lucide-react';
import { animalsCollection, dailyLogsCollection } from '../../lib/db';

export default function SystemHealth() {
  const [report, setReport] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    setReport(['Initializing deep pipeline diagnostic...']);

    try {
      // 1. Connection Check
      const electricUrl = import.meta.env.VITE_ELECTRIC_URL;
      setReport(prev => [...prev, `Pipeline URL: ${electricUrl || 'NOT SET'}`]);

      // 2. Collection Hydration Check
      const collections = { animals: animalsCollection, logs: dailyLogsCollection };
      for (const [name, coll] of Object.entries(collections)) {
        const data = Array.from(coll.values());
        setReport(prev => [...prev, `[${name.toUpperCase()}] Hydrated: ${data.length} records.`]);
        if (data.length === 0) {
          setReport(prev => [...prev, `[${name.toUpperCase()}] CRITICAL: No data found in local memory.`]);
        }
      }

      // 3. Sync State Check
      const outbox = localStorage.getItem('vetaura-outbox');
      setReport(prev => [...prev, `Outbox status: ${outbox ? 'Pending items found' : 'Outbox empty'}`]);
      
    } catch (err: any) {
      setReport(prev => [...prev, `PIPELINE FAILURE: ${err.message}`]);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6">
      <button onClick={runDiagnostics} className="bg-emerald-600 px-4 py-2 rounded text-white text-xs">Run Diagnostic</button>
      <div className="bg-black text-green-500 font-mono p-4 rounded overflow-auto h-64 text-[10px]">
        {report.map((r, i) => <div key={i}>{r}</div>)}
      </div>
    </div>
  );
}