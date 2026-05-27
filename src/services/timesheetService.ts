import { baseService } from './baseService';
import { timesheetsCollection, usersCollection } from '../lib/db';
import { queryClient } from '../lib/db';
import type { Timesheet, User } from '../types/schema';

export const timesheetService = {
  saveEntry: async (data: Partial<Timesheet>, userId: string): Promise<void> => {
    const payload = { ...data, staff_id: userId, updated_at: new Date().toISOString() };
    await baseService.upsertCollection(timesheetsCollection, payload as any);
    await baseService.upsert({
      table: 'timesheets',
      payload,
      queryKey: ['timesheets']
    });
  },

  getTimesheets: async (): Promise<Timesheet[]> => {
    const list = Array.from(timesheetsCollection.values()) as Timesheet[];
    return list.filter(t => !t.is_deleted);
  },

  getStaffMembers: async (): Promise<User[]> => {
    const list = Array.from(usersCollection.values()) as User[];
    return list.filter(user => !user.is_deleted);
  },

  getActiveShift: async (userId: string): Promise<Timesheet | null> => {
    const list = Array.from(timesheetsCollection.values()) as Timesheet[];
    const shift = list.find(t => t.user_id === userId && !t.clock_out_time && !t.is_deleted);
    
    // CRITICAL FIX: TanStack Query throws if returning undefined. We must coerce to null.
    return shift || null; 
  },

  clockIn: async (userId: string): Promise<void> => {
    const payload = {
      id: crypto.randomUUID(),
      user_id: userId,
      shift_date: new Date().toISOString().split('T')[0],
      clock_in_time: new Date().toISOString(),
      status: 'ACTIVE',
      updated_at: new Date().toISOString()
    };
    
    await baseService.upsertCollection(timesheetsCollection, payload as any);

    // 1. Safely update the master array list via baseService
    await baseService.upsert({
      table: 'timesheets',
      payload,
      queryKey: ['timesheets']
    });

    // 2. Safely inject the single object directly into the active_shift cache
    queryClient.setQueryData(['active_shift', userId], payload);
  },

  clockOut: async (activeShift: Timesheet, userId: string): Promise<void> => {
    const payload = {
      ...activeShift,
      clock_out_time: new Date().toISOString(),
      status: 'COMPLETED',
      updated_at: new Date().toISOString()
    };
    
    await baseService.upsertCollection(timesheetsCollection, payload as any);

    // 1. Safely update the master array list via baseService
    await baseService.upsert({
      table: 'timesheets',
      payload,
      queryKey: ['timesheets']
    });

    // 2. Clear the specific singleton cache for active shift
    queryClient.setQueryData(['active_shift', userId], null);
  }
};