import { baseService } from './baseService';
import { zlaDocumentsCollection, operationalListsCollection, organisationsCollection } from '../lib/db';
import { supabase } from '../lib/supabase';
import type { Organisation, ZLADocument, OperationalList } from '../types/schema';

export const settingsService = {
  updateOrganisation: async (data: Partial<Organisation>): Promise<void> => {
    await baseService.upsert({
      table: 'organisations',
      payload: data,
      queryKey: ['organisations']
    });
  },

  getOrganisation: async (): Promise<Organisation | undefined> => {
    const list = Array.from(organisationsCollection.values()) as Organisation[];
    return list[0];
  },

  getZLADocuments: async (): Promise<ZLADocument[]> => {
    const list = Array.from(zlaDocumentsCollection.values()) as ZLADocument[];
    return list.filter(doc => !doc.is_deleted); // Filter out soft-deleted records
  },

  addZLADocument: async (data: Partial<ZLADocument>): Promise<void> => {
    const payload = {
      ...data,
      id: data.id || crypto.randomUUID(),
      upload_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await baseService.upsertCollection(zlaDocumentsCollection, payload);
    await baseService.upsert({
      table: 'zla_documents',
      payload,
      queryKey: ['zla_documents']
    });
  },

  deleteZLADocument: async (id: string): Promise<void> => {
    const payload = { 
      id, 
      is_deleted: true,
      updated_at: new Date().toISOString() 
    };
    
    // Optimistic Local Vault Update
    await baseService.upsertCollection(zlaDocumentsCollection, payload as any);
    
    // Deterministic Cloud Update
    await baseService.upsert({
      table: 'zla_documents',
      payload,
      queryKey: ['zla_documents']
    });
  },

  getOperationalLists: async (): Promise<OperationalList[]> => {
    const list = Array.from(operationalListsCollection.values()) as OperationalList[];
    return list.filter(item => !item.is_deleted); // Filter out soft-deleted records
  },

  addOperationalListItem: async (data: Partial<OperationalList>, userId?: string): Promise<void> => {
    const finalUserId = userId || 'system';
    const payload = {
      ...data,
      id: data.id || crypto.randomUUID(),
      created_by: finalUserId,
      updated_at: new Date().toISOString()
    };
    await baseService.upsertCollection(operationalListsCollection, payload);
    await baseService.upsert({
      table: 'operational_lists',
      payload,
      queryKey: ['operational_lists']
    });
  },

  deleteOperationalListItem: async (id: string, userId?: string): Promise<void> => {
    const payload = { 
      id, 
      is_deleted: true,
      updated_at: new Date().toISOString() 
    };
    
    // Optimistic Local Vault Update
    await baseService.upsertCollection(operationalListsCollection, payload as any);
    
    // Deterministic Cloud Update
    await baseService.upsert({
      table: 'operational_lists',
      payload,
      queryKey: ['operational_lists']
    });
  },

  // Note: Direct Supabase call retained here as this handles large binary file uploads, 
  // which intentionally bypass the relational Electric Sync engine.
  uploadPublicFile: async (file: File, bucket: string, folder?: string): Promise<string> => {
    const path = `${folder ? folder + '/' : ''}${crypto.randomUUID()}-${file.name}`;
    const { data, error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
  }
};