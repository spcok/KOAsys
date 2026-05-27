import { baseService } from './baseService';
import { firstAidLogsCollection, usersCollection } from '../lib/db';
import { useAuthStore } from '../store/authStore';
import type { FirstAidLog, User } from '../types/schema';

export const firstAidService = {
  saveLog: async (data: Partial<FirstAidLog>, userId?: string): Promise<void> => {
    const finalUserId = userId || useAuthStore.getState().user?.id || 'system';
    const payload = { ...data, treated_by: finalUserId, updated_at: new Date().toISOString() };
    await baseService.upsertCollection(firstAidLogsCollection, payload as any);
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
    const list = Array.from(firstAidLogsCollection.values()) as FirstAidLog[];
    return list.filter(log => !log.is_deleted);
  },

  getStaffMembers: async (): Promise<User[]> => {
    const list = Array.from(usersCollection.values()) as User[];
    return list.filter(user => !user.is_deleted); // Defensively filter out inactive staff
  }
};