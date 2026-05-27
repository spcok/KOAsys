import { db, TableName, queryClient } from '../lib/db';
import { useOutboxStore } from '../store/outboxStore';

export const repository = {
  /**
   * Unified Read: Safely pulls data from the local vault (offline failover).
   * Notice the <T,> - the comma prevents JSX parsing errors in .tsx files.
   */
  read: async <T,>(table: TableName): Promise<T[]> => {
    const collection = db[table];
    if (!collection) return [];
    
    const values = Array.from(collection.values());
    return (values || []) as T[];
  },

  /**
   * Unified Write: Pushes to local vault immediately, invalidates UI cache, 
   * and queues to the Outbox for remote sync.
   */
  write: async <T extends { id?: string | null }>(table: TableName, payload: T): Promise<void> => {
    const collection = db[table];
    if (!collection) throw new Error(`[Repository] Table ${table} not registered.`);

    // Enforce ID generation to maintain relational integrity
    const recordId = payload.id || crypto.randomUUID();
    const finalPayload = {
      ...payload,
      id: recordId,
      updated_at: new Date().toISOString(),
    };

    // 1. Commit to Local Vault
    await collection.upsert(finalPayload);

    // 2. Sync UI state
    await queryClient.invalidateQueries({ queryKey: [table] });

    // 3. Queue for Server Uplink
    useOutboxStore.getState().addMutation({
      id: crypto.randomUUID(),
      table,
      payload: finalPayload as Record<string, unknown>,
      created_at: new Date().toISOString(),
    });
  },

  /**
   * Unified Delete: Handles soft-deletes or hard-deletes universally.
   */
  remove: async (table: TableName, id: string): Promise<void> => {
    const collection = db[table];
    if (!collection) return;
    
    // Convert to a soft-delete write operation
    await repository.write(table, { id, is_deleted: true } as any);
  }
};