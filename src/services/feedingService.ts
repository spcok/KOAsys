import { baseService } from './baseService';
import { feedingSchedulesCollection } from '../lib/db';
import { supabase } from '../lib/supabase';
import type { FeedingSchedule } from '../types/schema';

export const feedingService = {
  saveSchedule: async (data: Partial<FeedingSchedule>, userId: string): Promise<void> => {
    const payload = { ...data, created_by: userId, updated_at: new Date().toISOString() };
    await baseService.upsertCollection(feedingSchedulesCollection, payload);
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
      await baseService.upsertCollection(feedingSchedulesCollection, payload);
      await baseService.upsert({
        table: 'feeding_schedules',
        payload,
        queryKey: ['feeding_schedules']
      });
    }
  },

  getSchedulesForDashboard: async (date?: string): Promise<FeedingSchedule[]> => {
    let list = Array.from(feedingSchedulesCollection.values()) as FeedingSchedule[];
    if (date) {
      list = list.filter(s => s.scheduled_date === date);
    }
    return list;
  },

  deleteSchedule: async (id: string, userId?: string): Promise<void> => {
    await feedingSchedulesCollection.delete(id);
    try {
      await supabase.from('feeding_schedules').delete().eq('id', id);
    } catch (e) {
      console.error('Failed to remote delete schedule, keeping local delete state', e);
    }
  }
};