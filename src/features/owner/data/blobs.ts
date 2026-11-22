/**
 * Where the local owner store keeps uploaded files. In the browser that is IndexedDB (localStorage is far too
 * small for pictures and films); the unit tests use memory. Both lose their files when the browser's site data
 * is cleared: the local backend is for testing only.
 */
export interface BlobStore {
  put(key: string, blob: Blob): Promise<void>
  get(key: string): Promise<Blob | null>
}

export function memoryBlobs(): BlobStore {
  const m = new Map<string, Blob>()
  return { put: async (k, b) => void m.set(k, b), get: async (k) => m.get(k) ?? null }
}

const DB_NAME = 'storytime-local-media'
const STORE = 'files'

export function indexedDbBlobs(): BlobStore {
  let open: Promise<IDBDatabase> | null = null
  const db = () =>
    (open ??= new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(STORE)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => {
        open = null
        reject(req.error)
      }
    }))
  const run = <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) =>
    db().then(
      (d) =>
        new Promise<T>((resolve, reject) => {
          const tx = d.transaction(STORE, mode)
          const req = fn(tx.objectStore(STORE))
          tx.oncomplete = () => resolve(req.result)
          tx.onerror = () => reject(tx.error ?? req.error)
          tx.onabort = () => reject(tx.error ?? req.error)
        }),
    )
  return {
    put: async (k, b) => void (await run('readwrite', (s) => s.put(b, k))),
    get: async (k) => ((await run('readonly', (s) => s.get(k))) as Blob | undefined) ?? null,
  }
}
