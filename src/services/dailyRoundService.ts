import { baseService } from './baseService';
import { dailyRoundsCollection } from '../lib/db';
import type { DailyRound } from '../types/schema';

export const dailyRoundService = {
  saveRound: async (data: Partial<DailyRound>, userId: string): Promise<void> => {
    const payload = { ...data, completed_by: userId, updated_at: new Date().toISOString() };
    await baseService.upsertCollection(dailyRoundsCollection, payload);
    await baseService.upsert({
      table: 'daily_rounds',
      payload,
      queryKey: ['daily_rounds']
    });
  },

  getDailyRounds: async (date?: string, shift?: string): Promise<DailyRound[]> => {
    let rounds = Array.from(dailyRoundsCollection.values()) as DailyRound[];
    if (date) {
      rounds = rounds.filter(r => r.date === date);
    }
    if (shift) {
      rounds = rounds.filter(r => r.shift === shift);
    }
    return rounds;
  },

  bulkSaveRound: async (rounds: Partial<DailyRound>[], userId: string): Promise<void> => {
    for (const data of rounds) {
      const payload = { 
        ...data, 
        completed_by: userId, 
        updated_at: new Date().toISOString(),
        id: data.id || crypto.randomUUID()
      };
      await baseService.upsertCollection(dailyRoundsCollection, payload);
      await baseService.upsert({
        table: 'daily_rounds',
        payload,
        queryKey: ['daily_rounds']
      });
    }
  }
};