import { baseService } from './baseService';
import { animalsCollection } from '../lib/db';
import { supabase } from '../lib/supabase';
import type { Animal } from '../types/schema';

export const animalService = {
  saveAnimal: async (
    data: Partial<Animal>,
    userId?: string,
    imageFile?: File,
    mapFile?: File
  ): Promise<void> => {
    let logoUrl = data.image_url;
    let mapUrl = data.distribution_map_url;

    if (imageFile) {
      const path = `animals/${crypto.randomUUID()}-${imageFile.name}`;
      const { data: uploadData, error } = await supabase.storage.from('public').upload(path, imageFile);
      if (!error && uploadData) {
        const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(uploadData.path);
        logoUrl = publicUrl;
      }
    }

    if (mapFile) {
      const path = `maps/${crypto.randomUUID()}-${mapFile.name}`;
      const { data: uploadData, error } = await supabase.storage.from('public').upload(path, mapFile);
      if (!error && uploadData) {
        const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(uploadData.path);
        mapUrl = publicUrl;
      }
    }

    const payload = { 
      ...data, 
      image_url: logoUrl,
      distribution_map_url: mapUrl,
      updated_at: new Date().toISOString() 
    };
    
    // Optimistic: Update local IndexedDB
    await baseService.upsertCollection(animalsCollection, payload);
    
    // Deterministic: Cloud strike + Outbox failover
    await baseService.upsert({
      table: 'animals',
      payload,
      queryKey: ['animals']
    });
  },

  getAnimals: async (): Promise<Animal[]> => {
    return Array.from(animalsCollection.values()) as unknown as Animal[];
  }
};