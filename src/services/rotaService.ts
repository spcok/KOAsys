import { baseService } from './baseService';
import { shiftsCollection, shiftPatternsCollection, leaveRequestsCollection } from '../lib/db';
import type { Shift, ShiftPattern, LeaveRequest } from '../types/schema';

export const rotaService = {
  saveShift: async (data: Partial<Shift>, userId: string): Promise<void> => {
    const payload = { ...data, updated_at: new Date().toISOString() };
    await baseService.upsertCollection(shiftsCollection, payload);
    await baseService.upsert({
      table: 'shifts',
      payload,
      queryKey: ['shifts']
    });
  },

  saveShiftPattern: async (data: Partial<ShiftPattern>, userId: string): Promise<void> => {
    const payload = { ...data, updated_at: new Date().toISOString() };
    await baseService.upsertCollection(shiftPatternsCollection, payload);
    await baseService.upsert({
      table: 'shift_patterns',
      payload,
      queryKey: ['shift_patterns']
    });
  },

  saveLeaveRequest: async (data: Partial<LeaveRequest>, userId: string): Promise<void> => {
    const payload = { ...data, updated_at: new Date().toISOString() };
    await baseService.upsertCollection(leaveRequestsCollection, payload);
    await baseService.upsert({
      table: 'leave_requests',
      payload,
      queryKey: ['leave_requests']
    });
  }
};