import { baseService } from './baseService';
import { medicationLogsCollection, animalsCollection, usersCollection, clinicalScheduleCollection } from '../lib/db';
import type { MedicationLog, Animal, User, ClinicalSchedule } from '../types/schema';

export const medicationService = {
  saveLog: async (data: Partial<MedicationLog>, userId: string): Promise<void> => {
    const payload = { ...data, administered_by: userId, updated_at: new Date().toISOString() };
    await baseService.upsertCollection(medicationLogsCollection, payload);
    await baseService.upsert({
      table: 'medication_logs',
      payload,
      queryKey: ['medication_logs']
    });
  },

  logDose: async (data: Partial<MedicationLog>, userId: string): Promise<void> => {
    return medicationService.saveLog(data, userId);
  },

  quickAdminister: async (
    data: { animal_id: string; medication_name: string; dosage: string; route: string },
    status: string,
    notes: string,
    userId: string
  ): Promise<void> => {
    const logPayload: Partial<MedicationLog> = {
      id: crypto.randomUUID(),
      animal_id: data.animal_id,
      administered_at: new Date().toISOString(),
      status,
      notes: `${notes} (Quick: ${data.medication_name} - ${data.dosage} - ${data.route})`,
      administered_by: userId,
    };
    await medicationService.saveLog(logPayload, userId);
  },

  getAnimals: async (): Promise<Animal[]> => {
    return Array.from(animalsCollection.values()) as unknown as Animal[];
  },

  getStaffMembers: async (): Promise<User[]> => {
    return Array.from(usersCollection.values()) as unknown as User[];
  },

  getActiveSchedules: async (): Promise<ClinicalSchedule[]> => {
    const schedules = Array.from(clinicalScheduleCollection.values()) as unknown as ClinicalSchedule[];
    return schedules.filter(s => !s.is_deleted && (!s.end_date || new Date(s.end_date) > new Date()));
  },

  getAllSchedules: async (): Promise<ClinicalSchedule[]> => {
    return Array.from(clinicalScheduleCollection.values()) as unknown as ClinicalSchedule[];
  },

  getLogs: async (): Promise<MedicationLog[]> => {
    return Array.from(medicationLogsCollection.values()) as unknown as MedicationLog[];
  }
};