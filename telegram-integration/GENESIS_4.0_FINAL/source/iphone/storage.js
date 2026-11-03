/* GENESIS IndexedDB durability layer. Local-only: this module never performs network requests. */
(() => {
  const DB_NAME = 'genesis-private-local';
  const DB_VERSION = 1;
  const SNAPSHOTS = 'snapshots';
  const OUTBOX = 'outbox';

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('INDEXEDDB_UNAVAILABLE'));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(SNAPSHOTS)) database.createObjectStore(SNAPSHOTS, { keyPath: 'key' });
        if (!database.objectStoreNames.contains(OUTBOX)) database.createObjectStore(OUTBOX, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('INDEXEDDB_OPEN_FAILED'));
    });
  }

  async function persist(data, syncOptIn = false) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = database.transaction([SNAPSHOTS, OUTBOX], 'readwrite');
      const now = new Date().toISOString();
      tx.objectStore(SNAPSHOTS).put({ key: 'current', data, updatedAt: now });
      if (syncOptIn) {
        const outbox = tx.objectStore(OUTBOX);
        outbox.put({ id: crypto.randomUUID(), type: 'SNAPSHOT_UPSERT', createdAt: now, status: 'queued', payload: data });
        const cursorRequest = outbox.openCursor(null, 'prev');
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) return;
          let count = 0;
          const prune = cursor => {
            if (!cursor) return;
            if (++count > 50) cursor.delete();
            cursor.continue();
          };
          prune(cursor);
        };
      }
      tx.oncomplete = () => { database.close(); resolve(true); };
      tx.onerror = () => { database.close(); reject(tx.error || new Error('INDEXEDDB_WRITE_FAILED')); };
      tx.onabort = () => { database.close(); reject(tx.error || new Error('INDEXEDDB_WRITE_ABORTED')); };
    });
  }

  async function restore() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(SNAPSHOTS, 'readonly');
      const request = tx.objectStore(SNAPSHOTS).get('current');
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error || new Error('INDEXEDDB_READ_FAILED'));
      tx.oncomplete = () => database.close();
      tx.onerror = () => { database.close(); reject(tx.error || new Error('INDEXEDDB_READ_FAILED')); };
    });
  }

  async function clearOutbox() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(OUTBOX, 'readwrite');
      tx.objectStore(OUTBOX).clear();
      tx.oncomplete = () => { database.close(); resolve(true); };
      tx.onerror = () => { database.close(); reject(tx.error || new Error('INDEXEDDB_OUTBOX_CLEAR_FAILED')); };
    });
  }

  async function clear() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = database.transaction([SNAPSHOTS, OUTBOX], 'readwrite');
      tx.objectStore(SNAPSHOTS).clear();
      tx.objectStore(OUTBOX).clear();
      tx.oncomplete = () => { database.close(); resolve(true); };
      tx.onerror = () => { database.close(); reject(tx.error || new Error('INDEXEDDB_CLEAR_FAILED')); };
    });
  }

  async function outboxCount() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(OUTBOX, 'readonly');
      const request = tx.objectStore(OUTBOX).count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('INDEXEDDB_COUNT_FAILED'));
      tx.oncomplete = () => database.close();
    });
  }

  window.GenesisStorage = Object.freeze({ persist, restore, clear, clearOutbox, outboxCount });
})();
