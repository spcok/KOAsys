import { baseService } from './baseService';
import { zlaDocumentsCollection, operationalListsCollection, organisationsCollection } from '../lib/db';
import { supabase } from '../lib/supabase';
import type { Organisation, ZLADocument, OperationalList } from '../types/schema';

export const settingsService = {
  // We use baseService to ensure the write is caught in the Outbox if the user is offline
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
    return Array.from(zlaDocumentsCollection.values()) as ZLADocument[];
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
    await zlaDocumentsCollection.delete(id);
    try {
      await supabase.from('zla_documents').delete().eq('id', id);
    } catch (e) {
      console.error('Failed to remote-delete ZLA document, keeping local delete state', e);
    }
  },

  getOperationalLists: async (): Promise<OperationalList[]> => {
    return Array.from(operationalListsCollection.values()) as OperationalList[];
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
    await operationalListsCollection.delete(id);
    try {
      await supabase.from('operational_lists').delete().eq('id', id);
    } catch (e) {
      console.error('Failed to remote delete operational list item, keeping local state', e);
    }
  },

  uploadPublicFile: async (file: File, bucket: string, folder?: string): Promise<string> => {
    const path = `${folder ? folder + '/' : ''}${crypto.randomUUID()}-${file.name}`;
    const { data, error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
  }
};