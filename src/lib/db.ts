import { createCollection } from '@tanstack/react-db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minute stable cache
      refetchOnWindowFocus: true, // Server-first: attempt fresh sync on focus
    },
  },
});

const ELECTRIC_URL = import.meta.env.VITE_ELECTRIC_URL || 'http://localhost:3000';
const BASE_SHAPE_URL = `${ELECTRIC_URL}/v1/shape`;

// Type-safe id extractor to obey the strict Type Law
const getKey = (row: unknown): string => {
  if (row && typeof row === 'object' && 'id' in row) {
    return String((row as { id: unknown }).id);
  }
  return crypto.randomUUID(); 
};

const createTable = (tableName: string) => 
  createCollection(electricCollectionOptions({ 
    id: tableName, 
    getKey, 
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: tableName } } 
  }));

// 1. Explicit Individual Exports (Maintains backward compatibility for legacy modules)
export const animalsCollection = createTable('animals');
export const dailyLogsCollection = createTable('daily_logs');
export const dailyRoundsCollection = createTable('daily_rounds');
export const feedingSchedulesCollection = createTable('feeding_schedules');
export const operationalListsCollection = createTable('operational_lists');
export const internalMovementsCollection = createTable('internal_movements');
export const externalTransfersCollection = createTable('external_transfers');
export const clinicalRecordsCollection = createTable('clinical_records');
export const clinicalAttachmentsCollection = createTable('clinical_attachments');
export const clinicalScheduleCollection = createTable('clinical_schedule');
export const medicationLogsCollection = createTable('medication_logs');
export const isolationLogsCollection = createTable('isolation_logs');
export const incidentsCollection = createTable('incidents');
export const firstAidLogsCollection = createTable('first_aid_logs');
export const safetyDrillsCollection = createTable('safety_drills');
export const maintenanceTicketsCollection = createTable('maintenance_tickets');
export const usersCollection = createTable('users');
export const shiftsCollection = createTable('shifts');
export const shiftPatternsCollection = createTable('shift_patterns');
export const leaveRequestsCollection = createTable('leave_requests');
export const tasksCollection = createTable('tasks');
export const timesheetsCollection = createTable('timesheets');
export const zlaDocumentsCollection = createTable('zla_documents');
export const organisationsCollection = createTable('organisations');
export const rolePermissionsCollection = createTable('role_permissions');

// 2. The Unified Registry (For the new Repository architecture)
export const db = {
  animals: animalsCollection,
  daily_logs: dailyLogsCollection,
  daily_rounds: dailyRoundsCollection,
  feeding_schedules: feedingSchedulesCollection,
  operational_lists: operationalListsCollection,
  internal_movements: internalMovementsCollection,
  external_transfers: externalTransfersCollection,
  clinical_records: clinicalRecordsCollection,
  clinical_attachments: clinicalAttachmentsCollection,
  clinical_schedule: clinicalScheduleCollection,
  medication_logs: medicationLogsCollection,
  isolation_logs: isolationLogsCollection,
  incidents: incidentsCollection,
  first_aid_logs: firstAidLogsCollection,
  safety_drills: safetyDrillsCollection,
  maintenance_tickets: maintenanceTicketsCollection,
  users: usersCollection,
  shifts: shiftsCollection,
  shift_patterns: shiftPatternsCollection,
  leave_requests: leaveRequestsCollection,
  tasks: tasksCollection,
  timesheets: timesheetsCollection,
  zla_documents: zlaDocumentsCollection,
  organisations: organisationsCollection,
  role_permissions: rolePermissionsCollection,
} as const;

export type TableName = keyof typeof db;