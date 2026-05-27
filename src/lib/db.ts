import { createCollection } from '@tanstack/react-db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { QueryClient } from '@tanstack/react-query';

// --- THE LOCAL-FIRST HYDRATION ENGINE ---
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 1. The Heartbeat: Poll the local memory collections every 1.5s
      // This catches ElectricSQL background syncs automatically.
      refetchInterval: 1500,
      
      // 2. Offline-First Strictness: Force cache reads, prevent network retries
      staleTime: 0, 
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      retry: false, 
    },
  },
});

const ELECTRIC_URL = import.meta.env.VITE_ELECTRIC_URL || 'http://localhost:3000';
const BASE_SHAPE_URL = `${ELECTRIC_URL}/v1/shape`;

// Helper to standardise collection creation
const createTable = (tableName: string) => 
  createCollection(electricCollectionOptions({ 
    id: tableName, 
    getKey: (row: any) => row.id, 
    shapeOptions: { url: BASE_SHAPE_URL, params: { table: tableName } } 
  }));

// CORE HUSBANDRY
export const animalsCollection = createTable('animals');
export const dailyLogsCollection = createTable('daily_logs');
export const dailyRoundsCollection = createTable('daily_rounds');
export const feedingSchedulesCollection = createTable('feeding_schedules');
export const operationalListsCollection = createTable('operational_lists');

// LOGISTICS (Phase 1 Integration)
export const internalMovementsCollection = createTable('internal_movements');
export const externalTransfersCollection = createTable('external_transfers');

// CLINICAL
export const clinicalRecordsCollection = createTable('clinical_records');
export const clinicalAttachmentsCollection = createTable('clinical_attachments');
export const clinicalScheduleCollection = createTable('clinical_schedule');
export const medicationLogsCollection = createTable('medication_logs');
export const isolationLogsCollection = createTable('isolation_logs');

// SAFETY & COMPLIANCE
export const incidentsCollection = createTable('incidents');
export const firstAidLogsCollection = createTable('first_aid_logs');
export const safetyDrillsCollection = createTable('safety_drills');
export const maintenanceTicketsCollection = createTable('maintenance_tickets');

// STAFF & ADMIN
export const usersCollection = createTable('users');
export const shiftsCollection = createTable('shifts');
export const shiftPatternsCollection = createTable('shift_patterns');
export const leaveRequestsCollection = createTable('leave_requests');
export const tasksCollection = createTable('tasks');
export const timesheetsCollection = createTable('timesheets');
export const zlaDocumentsCollection = createTable('zla_documents');
export const organisationsCollection = createTable('organisations');
export const rolePermissionsCollection = createTable('role_permissions');