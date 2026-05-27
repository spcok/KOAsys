import { baseService } from './baseService';
import { firstAidLogsCollection, usersCollection } from '../lib/db';
import { useAuthStore } from '../store/authStore';
import type { FirstAidLog, User } from '../types/schema';

export const firstAidService = {
  saveLog: async (data: Partial<FirstAidLog>, userId?: string): Promise<void> => {
    const finalUserId = userId || useAuthStore.getState().user?.id || 'system';
    const payload = { ...data, treated_by: finalUserId, updated_at: new Date().toISOString() };
    await baseService.upsertCollection(firstAidLogsCollection, payload);
    await baseService.upsert({
      table: 'first_aid_logs',
      payload,
      queryKey: ['first_aid_logs']
    });
  },

  saveFirstAidLog: async (data: Partial<FirstAidLog>, userId?: string): Promise<void> => {
    return firstAidService.saveLog(data, userId);
  },

  getFirstAidLogs: async (): Promise<FirstAidLog[]> => {
    return Array.from(firstAidLogsCollection.values()) as FirstAidLog[];
  },

  getStaffMembers: async (): Promise<User[]> => {
    return Array.from(usersCollection.values()) as User[];
  }
};