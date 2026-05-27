import { db, TableName, queryClient } from '../lib/db';
import { useOutboxStore } from '../store/outboxStore';

export const repository = {
  /**
   * Unified Read: Safely pulls data from the local vault (offline failover).
   */
  read: async <T,>(table: TableName): Promise<T[]> => {
    const collection = db[table];
    if (!collection) return [];
    
    return (Array.from(collection.values()) || []) as T[];
  },

  /**
   * Unified Write: Queues to the Outbox for remote sync, and optimistically 
   * updates the UI cache instantly without mutating the read-only shape stream.
   */
  write: async <T extends { id?: string | null }>(table: TableName, payload: T): Promise<void> => {
    if (!db[table]) throw new Error(`[Repository] Table ${table} not registered.`);

    // Enforce ID generation to maintain relational integrity
    const recordId = payload.id || crypto.randomUUID();
    const finalPayload = {
      ...payload,
      id: recordId,
      updated_at: new Date().toISOString(),
    };

    // 1. Queue for Server Uplink FIRST (Guarantees offline failover safety)
    useOutboxStore.getState().addMutation({
      id: crypto.randomUUID(),
      table,
      action: 'upsert',
      payload: finalPayload as Record<string, unknown>,
      created_at: new Date().toISOString(),
    });

    // 2. Optimistic UI Update (TanStack Query Cache) - The Safe Way
    // This instantly updates the UI without illegally mutating the Electric stream
    queryClient.setQueryData([table], (old: any[] = []) => {
      const index = old.findIndex((item) => item.id === recordId);
      if (index > -1) {
        const next = [...old];
        next[index] = finalPayload;
        return next;
      }
      return [finalPayload, ...old];
    });
  },

  /**
   * Unified Delete: Handles soft-deletes or hard-deletes universally.
   */
  remove: async (table: TableName, id: string): Promise<void> => {
    // Convert to a soft-delete write operation
    await repository.write(table, { id, is_deleted: true } as any);
  }
};