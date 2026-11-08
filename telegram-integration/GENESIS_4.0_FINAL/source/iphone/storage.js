/* GENESIS IndexedDB durability layer. Local-only: this module never performs network requests. */
(() => {
  const DB_NAME = 'genesis-private-local';
  const DB_VERSION = 2;
  const SNAPSHOTS = 'snapshots';
  const LEGACY_OUTBOX = 'outbox';

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('INDEXEDDB_UNAVAILABLE'));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(SNAPSHOTS)) {
          database.createObjectStore(SNAPSHOTS, { keyPath: 'key' });
        }
        if (database.objectStoreNames.contains(LEGACY_OUTBOX)) {
          database.deleteObjectStore(LEGACY_OUTBOX);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('INDEXEDDB_OPEN_FAILED'));
      request.onblocked = () => reject(new Error('INDEXEDDB_UPGRADE_BLOCKED'));
    });
  }

  function normalizeWriteError(error) {
    const name = error && error.name;
    if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED' || (error && error.code === 22)) {
      const quotaError = new Error('STORAGE_QUOTA_EXCEEDED');
      quotaError.code = 'STORAGE_QUOTA_EXCEEDED';
      return quotaError;
    }
    return error || new Error('INDEXEDDB_WRITE_FAILED');
  }

  async function persist(data) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      let settled = false;
      const tx = database.transaction(SNAPSHOTS, 'readwrite');
      const now = new Date().toISOString();
      tx.objectStore(SNAPSHOTS).put({ key: 'current', v: 1, data, updatedAt: now });
      tx.oncomplete = () => {
        settled = true;
        database.close();
        resolve(true);
      };
      tx.onerror = () => {
        if (settled) return;
        settled = true;
        const error = normalizeWriteError(tx.error);
        database.close();
        reject(error);
      };
      tx.onabort = () => {
        if (settled) return;
        settled = true;
        const error = normalizeWriteError(tx.error);
        database.close();
        reject(error);
      };
    });
  }

  async function restore() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(SNAPSHOTS, 'readonly');
      const request = tx.objectStore(SNAPSHOTS).get('current');
      request.onsuccess = () => {
        const record = request.result;
        resolve(record ? (record.v === 1 ? record.data : record.data ?? null) : null);
      };
      request.onerror = () => reject(request.error || new Error('INDEXEDDB_READ_FAILED'));
      tx.oncomplete = () => database.close();
      tx.onerror = () => { database.close(); reject(tx.error || new Error('INDEXEDDB_READ_FAILED')); };
    });
  }

  async function clear() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(SNAPSHOTS, 'readwrite');
      tx.objectStore(SNAPSHOTS).clear();
      tx.oncomplete = () => { database.close(); resolve(true); };
      tx.onerror = () => { database.close(); reject(tx.error || new Error('INDEXEDDB_CLEAR_FAILED')); };
      tx.onabort = () => { database.close(); reject(tx.error || new Error('INDEXEDDB_CLEAR_ABORTED')); };
    });
  }

  window.GenesisStorage = Object.freeze({ persist, restore, clear });
})();
