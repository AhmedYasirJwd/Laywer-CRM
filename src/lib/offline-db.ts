// Minimal IndexedDB helper. No external dependency — the app only needs
// "put a bunch of records", "get all records", "get one record", so wrapping
// the native API directly is simpler than pulling in a library for it.
//
// Stores:
//   cases        — every case from GET /api/cases, keyed by id
//   hearings     — every hearing from GET /api/hearings, keyed by id
//   tasks        — every task from GET /api/tasks, keyed by id
//   documents    — document metadata per case (NOT the files), keyed by id,
//                  populated only once a case detail has actually been opened
//   meta         — last-successful-sync timestamp per resource, so the UI
//                  can say *when* the offline data is from

const DB_NAME = "lexcase-offline";
const DB_VERSION = 1;
const STORES = ["cases", "hearings", "tasks", "documents", "meta"] as const;
type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: name === "meta" ? "key" : "id" });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, mode);
    const request = fn(transaction.objectStore(store));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Replace the entire contents of a store with a fresh list (used for the
 *  three full-collection resources: cases, hearings, tasks). */
export async function replaceAll<T extends { id: string }>(store: StoreName, records: T[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(store, "readwrite");
    const os = transaction.objectStore(store);
    os.clear();
    for (const record of records) os.put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  await setMeta(store, Date.now());
}

/** Upsert a single record without touching the rest of the store (used for
 *  per-case documents, and for updating one case/hearing/task in place). */
export async function put<T extends { id: string }>(store: StoreName, record: T): Promise<void> {
  await tx(store, "readwrite", (s) => s.put(record));
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  try {
    return await tx(store, "readonly", (s) => s.getAll());
  } catch {
    return [];
  }
}

export async function getOne<T>(store: StoreName, id: string): Promise<T | undefined> {
  try {
    return await tx(store, "readonly", (s) => s.get(id));
  } catch {
    return undefined;
  }
}

export async function getManyByIndex<T extends Record<string, unknown>>(
  store: StoreName,
  matchKey: string,
  matchValue: string
): Promise<T[]> {
  const all = await getAll<T>(store);
  return all.filter((r) => r[matchKey] === matchValue);
}

/** Swap out just the records belonging to one key (e.g. one case's
 *  documents) without touching records that belong to other keys — a plain
 *  `replaceAll` would wipe out every other case's cached documents too. */
export async function replaceForKey<T extends { id: string }>(
  store: StoreName,
  keyField: string,
  keyValue: string,
  records: T[]
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(store, "readwrite");
    const os = transaction.objectStore(store);
    const cursorReq = os.openCursor();
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        const value = cursor.value as Record<string, unknown>;
        if (value[keyField] === keyValue) cursor.delete();
        cursor.continue();
      } else {
        for (const record of records) os.put(record);
      }
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function setMeta(key: string, syncedAt: number): Promise<void> {
  try {
    await tx("meta", "readwrite", (s) => s.put({ key, syncedAt }));
  } catch {
    // Non-fatal — worst case the "last synced" label just doesn't show.
  }
}

export async function getSyncedAt(key: string): Promise<number | undefined> {
  const row = await getOne<{ key: string; syncedAt: number }>("meta", key);
  return row?.syncedAt;
}
