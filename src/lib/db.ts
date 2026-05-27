console.log('Current Sync URL:', import.meta.env.VITE_ELECTRIC_URL);

import { createCollection } from '@tanstack/react-db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { QueryClient } from '@tanstack/react-query';

// --- 1. QueryClient Configuration ---
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: true,
    },
  },
});

// --- 2. Infrastructure Constants ---
const ELECTRIC_URL = import.meta.env.VITE_ELECTRIC_URL || 'http://localhost:3000';
const BASE_SHAPE_URL = `${ELECTRIC_URL}/v1/shape`;

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

// --- 3. Individual Table Definitions (Legacy Compatibility) ---
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

// --- 4. Unified Registry (Repository Pattern) ---
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

// --- 5. Sync Actuation (Used by SyncEngine) ---
export const syncAll = async () => {
  // 1. Detect if the Electric URL is configured and is not default localhost
  const isLocalOrUnset = !import.meta.env.VITE_ELECTRIC_URL || 
                          import.meta.env.VITE_ELECTRIC_URL.includes('localhost') || 
                          import.meta.env.VITE_ELECTRIC_URL.includes('127.0.0.1');

  const tables = Object.keys(db) as TableName[];

  if (isLocalOrUnset) {
    console.info('[DB] Operating in Client-Side Local Vault mode (No Electric Sync Service configured). Skipping HTTP sync fetches.');
    return tables.map(table => ({ table, success: true, localOnly: true }));
  }

  console.log('[DB] Actuating sync for all tables against remote service:', ELECTRIC_URL);
  
  // 2. Perform a lightweight single ping probe to check if the remote host is reachable
  // to avoid spawning multiple parallel fetch errors if the network/tunnel is dead.
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    // Use no-cors mode and HEAD method to minimize bandwidth and bypass simple CORS issues
    await fetch(ELECTRIC_URL, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
    clearTimeout(timeoutId);
  } catch (err) {
    console.warn('[DB] Sync service host is unreachable or the tunnel is inactive. Operating in Offline mode with local cache.');
    return tables.map(table => ({ table, success: true, offline: true }));
  }

  // 3. Fallback to reading from local collections when fetch fails on individual tables
  return Promise.all(tables.map(async (tableName) => {
    try {
      const response = await fetch(`${BASE_SHAPE_URL}?table=${tableName}`);
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      return { table: tableName, success: true };
    } catch (e) {
      console.warn(`[DB] Sync fetch bypassed/failed for '${tableName}'. Operating from local cache.`, e);
      return { table: tableName, success: false };
    }
  }));
};