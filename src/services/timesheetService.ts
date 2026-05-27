import { repository } from './repository';
import type { Timesheet } from '../types/schema';

/**
 * Timesheet Service: Unified data-access layer for timesheets.
 * Maps strictly to verified database schema.
 */
export const timesheetService = {
  /**
   * Get all timesheet records from the local repository vault.
   */
  getTimesheets: async (): Promise<Timesheet[]> => {
    return await repository.read<Timesheet>('timesheets');
  },

  /**
   * Get the active shift for a specific user.
   */
  getActiveShift: async (userId: string): Promise<Timesheet | null> => {
    const all = await repository.read<Timesheet>('timesheets');
    return all.find(t => t.user_id === userId && !t.clock_out_time && !t.is_deleted) || null;
  },

  /**
   * Clock In: Create a new timesheet record.
   */
  clockIn: async (userId: string): Promise<void> => {
    const payload: Timesheet = {
      user_id: userId,
      shift_date: new Date().toISOString().split('T')[0],
      clock_in_time: new Date().toISOString(),
      clock_out_time: null,
      status: 'ACTIVE',
      notes: null,
      auto_clocked_out: false,
      is_deleted: false,
    };
    await repository.write('timesheets', payload);
  },

  /**
   * Clock Out: Update the active shift record with clock_out_time.
   */
  clockOut: async (activeShift: Timesheet): Promise<void> => {
    const payload = {
      ...activeShift,
      clock_out_time: new Date().toISOString(),
      status: 'COMPLETED',
    };
    await repository.write('timesheets', payload);
  }
};