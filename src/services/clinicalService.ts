import { baseService } from './baseService';
import { clinicalRecordsCollection, animalsCollection, usersCollection } from '../lib/db';
import type { ClinicalRecord, Animal, User } from '../types/schema';

export const clinicalService = {
  saveRecord: async (data: Partial<ClinicalRecord>, userId: string): Promise<void> => {
    const payload = { 
      ...data, 
      created_by: userId, 
      updated_at: new Date().toISOString() 
    };
    
    // Optimistic write to Local Vault
    await baseService.upsertCollection(clinicalRecordsCollection, payload);
    
    // Cloud Strike + Outbox Failover
    await baseService.upsert({
      table: 'clinical_records',
      payload,
      queryKey: ['clinical_records']
    });
  },

  saveClinicalRecord: async (data: Partial<ClinicalRecord>, userId: string): Promise<void> => {
    return clinicalService.saveRecord(data, userId);
  },

  getClinicalRecords: async (): Promise<ClinicalRecord[]> => {
    return Array.from(clinicalRecordsCollection.values()) as unknown as ClinicalRecord[];
  },

  getAnimals: async (): Promise<Animal[]> => {
    return Array.from(animalsCollection.values()) as unknown as Animal[];
  },

  getStaffMembers: async (): Promise<User[]> => {
    return Array.from(usersCollection.values()) as unknown as User[];
  }
};