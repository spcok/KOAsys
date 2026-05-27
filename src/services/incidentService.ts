import { baseService } from './baseService';
import { incidentsCollection } from '../lib/db';
import { useAuthStore } from '../store/authStore';
import type { Incident } from '../types/schema';

export const incidentService = {
  saveIncident: async (data: Partial<Incident>, userId?: string): Promise<void> => {
    const finalUserId = userId || useAuthStore.getState().user?.id || 'system';
    const payload = { ...data, reported_by: finalUserId, updated_at: new Date().toISOString() };
    
    await baseService.upsertCollection(incidentsCollection, payload);
    
    await baseService.upsert({
      table: 'incidents',
      payload,
      queryKey: ['incidents']
    });
  },

  getIncidents: async (): Promise<Incident[]> => {
    return Array.from(incidentsCollection.values()) as Incident[];
  }
};