import { createOfflineCardPayload, parseOfflineCardPayload } from "./model";
import type { OfflineCardIdentification, OfflineCardPayload } from "./model";

const databaseName = "vuyela-offline";
const databaseVersion = 1;
const storeName = "card-identification";
const payloadKey = "current";

export async function saveOfflineCards(cards: OfflineCardIdentification[]): Promise<void> {
  const database = await openDatabase();

  try {
    await requestToPromise(
      database
        .transaction(storeName, "readwrite")
        .objectStore(storeName)
        .put({
          key: payloadKey,
          payload: createOfflineCardPayload(cards)
        })
    );
  } finally {
    database.close();
  }
}

export async function readOfflineCards(): Promise<OfflineCardPayload | null> {
  const database = await openDatabase();

  try {
    const result = await requestToPromise<unknown>(
      database.transaction(storeName, "readonly").objectStore(storeName).get(payloadKey)
    );

    if (!isRecord(result)) {
      return null;
    }

    return parseOfflineCardPayload(result.payload);
  } finally {
    database.close();
  }
}

export async function clearOfflineCards(): Promise<void> {
  const database = await openDatabase();

  try {
    await requestToPromise(
      database.transaction(storeName, "readwrite").objectStore(storeName).delete(payloadKey)
    );
  } finally {
    database.close();
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Offline database unavailable"));
    request.onblocked = () => reject(new Error("Offline database update blocked"));
  });
}

function requestToPromise<T = IDBValidKey>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Offline storage request failed"));
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
