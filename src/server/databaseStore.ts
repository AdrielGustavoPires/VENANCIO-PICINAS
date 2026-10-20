import fs from 'fs';
import path from 'path';

export interface DatabaseSnapshot {
  clients: any[];
  pools: any[];
  services: any[];
  appointments: any[];
  records: any[];
  payments: any[];
  expenses: any[];
  settings: any;
  feedback: any[];
  notifications: any[];
  accounts?: any[];
  deletedClientIds?: string[];
  deletedEntityIds?: string[];
  updatedAt: string;
  version: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.error('Error creating data directory:', e);
    }
  }
}

// In-memory cache for fast read/write with disk persistence
let cachedDb: DatabaseSnapshot | null = null;

export function readServerDatabase(): DatabaseSnapshot | null {
  ensureDataDir();
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      cachedDb = data;
      return data;
    }
  } catch (e) {
    console.error('Error reading database file:', e);
  }
  return cachedDb;
}

export function writeServerDatabase(data: DatabaseSnapshot): DatabaseSnapshot {
  ensureDataDir();
  try {
    cachedDb = {
      ...data,
      accounts: Array.isArray(data.accounts) ? data.accounts : [],
      deletedClientIds: Array.isArray(data.deletedClientIds) ? data.deletedClientIds : [],
      deletedEntityIds: Array.isArray(data.deletedEntityIds) ? data.deletedEntityIds : [],
      updatedAt: new Date().toISOString(),
      version: (data.version || 0) + 1,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(cachedDb, null, 2), 'utf-8');
    return cachedDb;
  } catch (e) {
    console.error('Error writing to database file:', e);
    cachedDb = data;
    return data;
  }
}

function mergeEntitiesById<T extends { id?: string; client_id?: string; updated_at?: string; created_at?: string }>(
  serverList: T[] = [],
  incomingList: T[] = [],
  deletedClientSet: Set<string>,
  deletedEntitySet: Set<string>
): T[] {
  const map = new Map<string, T>();

  const addOrUpdate = (item: T, isIncoming: boolean) => {
    if (!item || !item.id) return;
    if (deletedClientSet.has(item.id) || deletedEntitySet.has(item.id)) return;
    if (item.client_id && deletedClientSet.has(item.client_id)) return;

    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      return;
    }

    if (isIncoming) {
      const existingTime = existing.updated_at || existing.created_at || '';
      const incomingTime = item.updated_at || item.created_at || '';
      if (!existingTime || !incomingTime || incomingTime >= existingTime) {
        map.set(item.id, { ...existing, ...item });
      }
    }
  };

  if (Array.isArray(serverList)) {
    serverList.forEach(item => addOrUpdate(item, false));
  }
  if (Array.isArray(incomingList)) {
    incomingList.forEach(item => addOrUpdate(item, true));
  }

  return Array.from(map.values());
}

export function mergeDatabaseSnapshots(
  server: DatabaseSnapshot,
  incoming: Partial<DatabaseSnapshot>
): DatabaseSnapshot {
  // Combine deleted client IDs and entity IDs so deleted records never resurrect
  const incomingDeletedClients = Array.isArray(incoming.deletedClientIds) ? incoming.deletedClientIds : [];
  const serverDeletedClients = Array.isArray(server.deletedClientIds) ? server.deletedClientIds : [];
  const deletedClientSet = new Set<string>([...serverDeletedClients, ...incomingDeletedClients]);

  const incomingDeletedEntities = Array.isArray(incoming.deletedEntityIds) ? incoming.deletedEntityIds : [];
  const serverDeletedEntities = Array.isArray(server.deletedEntityIds) ? server.deletedEntityIds : [];
  const deletedEntitySet = new Set<string>([...serverDeletedEntities, ...incomingDeletedEntities]);

  const mergedClients = mergeEntitiesById(
    server.clients,
    incoming.clients,
    deletedClientSet,
    deletedEntitySet
  ).map(c => ({
    ...c,
    whatsapp: c.whatsapp !== undefined && c.whatsapp !== null ? String(c.whatsapp) : '',
    due_date: c.due_date !== undefined && c.due_date !== null ? String(c.due_date) : '',
  }));

  const mergedPools = mergeEntitiesById(
    server.pools,
    incoming.pools,
    deletedClientSet,
    deletedEntitySet
  );

  const mergedServices = mergeEntitiesById(
    server.services,
    incoming.services,
    deletedClientSet,
    deletedEntitySet
  );

  const mergedAppointments = mergeEntitiesById(
    server.appointments,
    incoming.appointments,
    deletedClientSet,
    deletedEntitySet
  );

  const mergedRecords = mergeEntitiesById(
    server.records,
    incoming.records,
    deletedClientSet,
    deletedEntitySet
  );

  const mergedPayments = mergeEntitiesById(
    server.payments,
    incoming.payments,
    deletedClientSet,
    deletedEntitySet
  );

  const mergedExpenses = mergeEntitiesById(
    server.expenses,
    incoming.expenses,
    deletedClientSet,
    deletedEntitySet
  );

  const mergedFeedback = mergeEntitiesById(
    server.feedback,
    incoming.feedback,
    deletedClientSet,
    deletedEntitySet
  );

  const mergedNotifications = mergeEntitiesById(
    server.notifications,
    incoming.notifications,
    deletedClientSet,
    deletedEntitySet
  );

  // Merge registered user accounts by email / id (excluding legacy demo admin)
  const accountMap = new Map<string, any>();
  const addAccount = (acc: any) => {
    if (!acc || !acc.email) return;
    if (acc.id === 'user-venancio' && acc.password === 'admin123') return;
    const key = String(acc.email).trim().toLowerCase();
    accountMap.set(key, { ...(accountMap.get(key) || {}), ...acc });
  };
  if (Array.isArray(server.accounts)) server.accounts.forEach(addAccount);
  if (Array.isArray(incoming.accounts)) incoming.accounts.forEach(addAccount);

  const updated: DatabaseSnapshot = {
    clients: mergedClients,
    pools: mergedPools,
    services: mergedServices,
    appointments: mergedAppointments,
    records: mergedRecords,
    payments: mergedPayments,
    expenses: mergedExpenses,
    settings: incoming.settings ? { ...server.settings, ...incoming.settings } : server.settings,
    feedback: mergedFeedback,
    notifications: mergedNotifications,
    accounts: Array.from(accountMap.values()),
    deletedClientIds: Array.from(deletedClientSet),
    deletedEntityIds: Array.from(deletedEntitySet),
    updatedAt: new Date().toISOString(),
    version: (server.version || 0) + 1,
  };

  return writeServerDatabase(updated);
}

/**
 * Realiza a exclusão definitiva (Hard Delete) de um cliente e de todos os seus vínculos no banco de dados.
 */
export function deleteServerClient(id: string): DatabaseSnapshot | null {
  const db = readServerDatabase();
  if (!db) return null;

  const deletedSet = new Set<string>(Array.isArray(db.deletedClientIds) ? db.deletedClientIds : []);
  deletedSet.add(id);

  // Find records belonging to the deleted client to also cascade delete linked payments
  const removedRecordIds = new Set<string>(
    (db.records || []).filter(r => r && r.client_id === id).map(r => r.id)
  );

  const updated: DatabaseSnapshot = {
    ...db,
    clients: (db.clients || []).filter(c => c && c.id !== id),
    pools: (db.pools || []).filter(p => p && p.client_id !== id),
    appointments: (db.appointments || []).filter(a => a && a.client_id !== id),
    records: (db.records || []).filter(r => r && r.client_id !== id),
    payments: (db.payments || []).filter(
      p => p && p.client_id !== id && !removedRecordIds.has(p.service_record_id)
    ),
    feedback: (db.feedback || []).filter(f => f && f.client_id !== id),
    notifications: (db.notifications || []).filter(n => n && n.client_id !== id),
    deletedClientIds: Array.from(deletedSet),
    updatedAt: new Date().toISOString(),
    version: (db.version || 0) + 1,
  };
  return writeServerDatabase(updated);
}

/**
 * Limpa integralmente todos os clientes e dados de teste (Hard Reset para entrega ao cliente final).
 */
export function clearServerDatabase(defaultServices: any[] = [], defaultSettings: any = {}): DatabaseSnapshot {
  const current = readServerDatabase();
  const emptySnapshot: DatabaseSnapshot = {
    clients: [],
    pools: [],
    services: current?.services?.length ? current.services : defaultServices,
    appointments: [],
    records: [],
    payments: [],
    expenses: [],
    settings: current?.settings || defaultSettings,
    feedback: [],
    notifications: [],
    accounts: current?.accounts || [],
    deletedClientIds: [],
    deletedEntityIds: [],
    updatedAt: new Date().toISOString(),
    version: ((current?.version || 1) + 1),
  };
  return writeServerDatabase(emptySnapshot);
}
