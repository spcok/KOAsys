import { baseService } from './baseService';
import { timesheetsCollection } from '../lib/db';
import type { Timesheet } from '../types/schema';

export const staffService = {
  saveTimesheet: async (data: Partial<Timesheet>, userId: string): Promise<void> => {
    const payload = { ...data, staff_id: userId, updated_at: new Date().toISOString() };
    await baseService.upsertCollection(timesheetsCollection, payload);
    await baseService.upsert({
      table: 'timesheets',
      payload,
      queryKey: ['timesheets']
    });
  }
};