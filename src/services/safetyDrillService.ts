import { baseService } from './baseService';
import { safetyDrillsCollection, usersCollection, timesheetsCollection } from '../lib/db';
import type { SafetyDrill, User, Timesheet } from '../types/schema';

export const safetyDrillService = {
  saveDrill: async (data: Partial<SafetyDrill>, userId: string): Promise<void> => {
    const payload = { ...data, logged_by: userId, updated_at: new Date().toISOString() };
    await baseService.upsertCollection(safetyDrillsCollection, payload);
    await baseService.upsert({
      table: 'safety_drills',
      payload,
      queryKey: ['safety_drills']
    });
  },

  getDrills: async (): Promise<SafetyDrill[]> => {
    return Array.from(safetyDrillsCollection.values()) as SafetyDrill[];
  },

  getStaffMembers: async (): Promise<User[]> => {
    return Array.from(usersCollection.values()) as User[];
  },

  getActiveTimesheets: async (): Promise<Timesheet[]> => {
    return Array.from(timesheetsCollection.values()) as Timesheet[];
  }
};