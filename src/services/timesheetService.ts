import { baseService } from './baseService';
import { timesheetsCollection, usersCollection } from '../lib/db';
import type { Timesheet, User } from '../types/schema';

export const timesheetService = {
  saveEntry: async (data: Partial<Timesheet>, userId: string): Promise<void> => {
    const payload = { ...data, staff_id: userId, updated_at: new Date().toISOString() };
    await baseService.upsertCollection(timesheetsCollection, payload);
    await baseService.upsert({
      table: 'timesheets',
      payload,
      queryKey: ['timesheets']
    });
  },

  getTimesheets: async (): Promise<Timesheet[]> => {
    return Array.from(timesheetsCollection.values()) as Timesheet[];
  },

  getStaffMembers: async (): Promise<User[]> => {
    return Array.from(usersCollection.values()) as User[];
  },

  getActiveShift: async (userId: string): Promise<Timesheet | undefined> => {
    const list = Array.from(timesheetsCollection.values()) as Timesheet[];
    return list.find(t => t.user_id === userId && !t.clock_out_time);
  },

  clockIn: async (userId: string): Promise<void> => {
    const payload: Partial<Timesheet> = {
      id: crypto.randomUUID(),
      user_id: userId,
      shift_date: new Date().toISOString().split('T')[0],
      clock_in_time: new Date().toISOString(),
      status: 'ACTIVE',
      updated_at: new Date().toISOString()
    };
    await baseService.upsertCollection(timesheetsCollection, payload);
    await baseService.upsert({
      table: 'timesheets',
      payload,
      queryKey: ['active_shift', userId]
    });
  },

  clockOut: async (activeShift: Timesheet, userId: string): Promise<void> => {
    const payload = {
      ...activeShift,
      clock_out_time: new Date().toISOString(),
      status: 'COMPLETED',
      updated_at: new Date().toISOString()
    };
    await baseService.upsertCollection(timesheetsCollection, payload);
    await baseService.upsert({
      table: 'timesheets',
      payload,
      queryKey: ['active_shift', userId]
    });
  }
};