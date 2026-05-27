import { baseService } from './baseService';
import { isolationLogsCollection, animalsCollection, usersCollection } from '../lib/db';
import type { IsolationLog, Animal, User } from '../types/schema';

export const isolationService = {
  saveLog: async (data: Partial<IsolationLog>, userId: string): Promise<void> => {
    const payload = { ...data, authorized_by: userId, updated_at: new Date().toISOString() };
    await baseService.upsertCollection(isolationLogsCollection, payload);
    await baseService.upsert({
      table: 'isolation_logs',
      payload,
      queryKey: ['isolation_logs']
    });
  },

  saveIsolation: async (data: Partial<IsolationLog>, userId: string): Promise<void> => {
    return isolationService.saveLog(data, userId);
  },

  getActiveIsolations: async (): Promise<IsolationLog[]> => {
    const logs = Array.from(isolationLogsCollection.values()) as IsolationLog[];
    return logs.filter(l => !l.is_deleted && (!l.end_date || new Date(l.end_date) > new Date()));
  },

  getAllIsolations: async (): Promise<IsolationLog[]> => {
    return Array.from(isolationLogsCollection.values()) as IsolationLog[];
  },

  getAnimals: async (): Promise<Animal[]> => {
    return Array.from(animalsCollection.values()) as Animal[];
  },

  getStaffMembers: async (): Promise<User[]> => {
    return Array.from(usersCollection.values()) as User[];
  }
};