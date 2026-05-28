import { baseService } from './baseService';
import { maintenanceTicketsCollection, usersCollection } from '../lib/db';
import type { MaintenanceTicket, User } from '../types/schema';

export const maintenanceService = {
  saveTicket: async (data: Partial<MaintenanceTicket>, userId: string): Promise<void> => {
    const payload = { ...data, created_by: userId, updated_at: new Date().toISOString() };
    await baseService.upsertCollection(maintenanceTicketsCollection, payload as unknown as any);
    await baseService.upsert({
      table: 'maintenance_tickets',
      payload,
      queryKey: ['maintenance_tickets']
    });
  },

  getTickets: async (): Promise<MaintenanceTicket[]> => {
    const list = Array.from(maintenanceTicketsCollection.values()) as unknown as MaintenanceTicket[];
    return list.filter(ticket => !ticket.is_deleted);
  },

  getStaffMembers: async (): Promise<User[]> => {
    const list = Array.from(usersCollection.values()) as unknown as User[];
    return list.filter(user => !user.is_deleted);
  }
};