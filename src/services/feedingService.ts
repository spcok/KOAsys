import { baseService } from './baseService';
import { feedingSchedulesCollection } from '../lib/db';
import type { FeedingSchedule } from '../types/schema';

export const feedingService = {
  saveSchedule: async (data: Partial<FeedingSchedule>, userId: string): Promise<void> => {
    const payload = { ...data, created_by: userId, updated_at: new Date().toISOString() };
    await baseService.upsertCollection(feedingSchedulesCollection, payload as unknown as any);
    await baseService.upsert({
      table: 'feeding_schedules',
      payload,
      queryKey: ['feeding_schedules']
    });
  },

  bulkCreateSchedules: async (schedules: Partial<FeedingSchedule>[], userId: string): Promise<void> => {
    for (const data of schedules) {
      const payload = { 
        ...data, 
        created_by: userId, 
        updated_at: new Date().toISOString(),
        id: data.id || crypto.randomUUID()
      };
      await baseService.upsertCollection(feedingSchedulesCollection, payload as unknown as any);
      await baseService.upsert({
        table: 'feeding_schedules',
        payload,
        queryKey: ['feeding_schedules']
      });
    }
  },

  getSchedulesForDashboard: async (date?: string): Promise<FeedingSchedule[]> => {
    let list = Array.from(feedingSchedulesCollection.values()) as unknown as FeedingSchedule[];
    
    // Filter out soft-deleted records before returning to UI
    list = list.filter(s => !s.is_deleted);
    
    if (date) {
      list = list.filter(s => s.scheduled_date === date);
    }
    return list;
  },

  deleteSchedule: async (id: string, userId?: string): Promise<void> => {
    const payload = { 
      id, 
      is_deleted: true,
      updated_at: new Date().toISOString() 
    };
    
    // Optimistic Local Vault Update: Sets is_deleted to true so the UI hides it instantly
    await baseService.upsertCollection(feedingSchedulesCollection, payload as unknown as any);
    
    // Deterministic Cloud Update: Will catch in the OutboxStore if the keeper is offline
    await baseService.upsert({
      table: 'feeding_schedules',
      payload,
      queryKey: ['feeding_schedules']
    });
  }
};