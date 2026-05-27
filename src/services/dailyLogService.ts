import { DailyLog, DailyLogSchema } from '../types/schema';
import { baseService } from './baseService';
import { dailyLogsCollection } from '../lib/db';

export const dailyLogService = {
  getDashboardLogs: async (date: string): Promise<{ todaysLogs: DailyLog[]; lastFeeds: DailyLog[] }> => {
    const logs = Array.from(dailyLogsCollection.values()) as DailyLog[];
    const todaysLogs = logs.filter(l => l.log_date?.startsWith(date));
    const lastFeeds = logs.filter(l => l.log_type === 'FEED');
    return { todaysLogs, lastFeeds };
  },

  getLogsByDate: async (date?: string, category?: string): Promise<DailyLog[]> => {
    let logs = Array.from(dailyLogsCollection.values()) as DailyLog[];
    if (date) {
      logs = logs.filter(l => l.log_date?.startsWith(date));
    }
    if (category) {
      logs = logs.filter(l => l.log_type === category);
    }
    return logs;
  },

  getLogsByAnimal: async (animalId: string): Promise<DailyLog[]> => {
    const logs = Array.from(dailyLogsCollection.values()) as DailyLog[];
    return logs.filter(l => l.animal_id === animalId);
  },

  saveLog: async (data: Partial<DailyLog>, userId: string): Promise<void> => {
    const payload = DailyLogSchema.parse({
      ...data,
      id: data.id || crypto.randomUUID(),
      created_by: userId,
      modified_by: userId,
      updated_at: new Date().toISOString(),
      created_at: data.created_at || new Date().toISOString()
    });

    await baseService.upsertCollection(dailyLogsCollection, payload);

    await baseService.upsert({
      table: 'daily_logs',
      payload,
      queryKey: ['daily_logs']
    });
  }
};