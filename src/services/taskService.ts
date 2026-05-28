import { baseService } from './baseService';
import { tasksCollection } from '../lib/db';
import type { Task } from '../types/schema';

export const taskService = {
  saveTask: async (data: Partial<Task>, userId: string): Promise<void> => {
    const payload = { ...data, created_by: userId, updated_at: new Date().toISOString() };
    await baseService.upsertCollection(tasksCollection, payload as unknown as any);
    await baseService.upsert({
      table: 'tasks',
      payload,
      queryKey: ['tasks']
    });
  },

  getTasks: async (): Promise<Task[]> => {
    const list = Array.from(tasksCollection.values()) as unknown as Task[];
    return list.filter(t => !t.is_deleted);
  },

  getPendingTasks: async (): Promise<Task[]> => {
    const list = Array.from(tasksCollection.values()) as unknown as Task[];
    return list.filter(t => t.status !== 'completed' && t.status !== 'COMPLETED' && !t.is_deleted);
  }
};