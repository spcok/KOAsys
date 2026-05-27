import { baseService } from './baseService';
import { externalTransfersCollection, internalMovementsCollection } from '../lib/db';
import type { InternalMovement, ExternalTransfer } from '../types/schema';

export const logisticsService = {
  saveInternalMovement: async (data: Partial<InternalMovement>, userId: string): Promise<void> => {
    const payload = { ...data, moved_by: userId, updated_at: new Date().toISOString() };
    
    // Update local DB collection immediately
    await baseService.upsertCollection(internalMovementsCollection, payload);
    
    // Fire the standardized upsert
    await baseService.upsert({
      table: 'internal_movements',
      payload,
      queryKey: ['internal_movements']
    });
  },

  saveExternalTransfer: async (data: Partial<ExternalTransfer>, userId: string): Promise<void> => {
    const payload = { ...data, authorized_by: userId, updated_at: new Date().toISOString() };
    
    await baseService.upsertCollection(externalTransfersCollection, payload);
    
    await baseService.upsert({
      table: 'external_transfers',
      payload,
      queryKey: ['external_transfers']
    });
  }
};