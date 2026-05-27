import { baseService } from './baseService';
import { maintenanceTicketsCollection, usersCollection } from '../lib/db';
import type { MaintenanceTicket, User } from '../types/schema';

export const maintenanceService = {
  saveTicket: async (data: Partial<MaintenanceTicket>, userId: string): Promise<void> => {
    const payload = { ...data, created_by: userId, updated_at: new Date().toISOString() };
    await baseService.upsertCollection(maintenanceTicketsCollection, payload);
    await baseService.upsert({
      table: 'maintenance_tickets',
      payload,
      queryKey: ['maintenance_tickets']
    });
  },

  getTickets: async (): Promise<MaintenanceTicket[]> => {
    return Array.from(maintenanceTicketsCollection.values()) as MaintenanceTicket[];
  },

  getStaffMembers: async (): Promise<User[]> => {
    return Array.from(usersCollection.values()) as User[];
  }
};