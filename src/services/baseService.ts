import { queryClient } from '../lib/db';
import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';

export interface UpsertAction {
  table: string;
  payload: any;
  queryKey?: any[];
}

export const baseService = {
  async upsertCollection<T extends { id?: any }>(collection: any, payload: T): Promise<void> {
    const key = payload.id;
    if (key && collection.has(key)) {
      await collection.update(key, (draft: any) => {
        Object.assign(draft, payload);
      });
    } else {
      await collection.insert(payload);
    }
  },

  async upsert(action: UpsertAction): Promise<void> {
    // Force metadata injection to ensure Deterministic Schema compliance
    const payload = {
      ...action.payload,
      updated_at: new Date().toISOString()
    };

    // 1. Optimistic UI update (TanStack Query RAM)
    if (action.queryKey) {
      queryClient.setQueryData(action.queryKey, (old: any[] = []) => {
        const index = old.findIndex((item) => item.id === payload.id);
        if (index > -1) {
          const next = [...old];
          next[index] = payload;
          return next;
        }
        return [payload, ...old];
      });
    }

    // 2. Cloud Strike + Outbox Failover
    try {
      const { error } = await supabase.from(action.table).upsert(payload);
      if (error) throw error;
    } catch (error) {
      useOutboxStore.getState().addMutation({
        id: crypto.randomUUID(),
        table: action.table,
        action: 'upsert',
        payload
      });
    }
  }
};