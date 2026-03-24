"use client";

import { useEffect, useState, useCallback } from "react";
import { scanAPI } from "@/lib/api";
import { Wifi, WifiOff, RotateCcw, Loader2 } from "lucide-react";

const DB_NAME = "parampara_offline";
const STORE_NAME = "pending_scans";
const DB_VERSION = 1;

interface PendingScan {
  id?: number;
  productId: string;
  sig: string;
  location?: string;
  timestamp: string;
  synced: boolean;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        store.createIndex("synced", "synced", { unique: false });
      }
    };
  });
}

async function addPendingScan(scan: Omit<PendingScan, "id">): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).add(scan);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getPendingScans(): Promise<PendingScan[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const index = tx.objectStore(STORE_NAME).index("synced");
  const request = index.getAll(IDBKeyRange.only(0));
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as PendingScan[]);
    request.onerror = () => reject(request.error);
  });
}

async function markSynced(id: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const request = store.get(id);
  request.onsuccess = () => {
    const item = request.result;
    if (item) {
      item.synced = true;
      store.put(item);
    }
  };
}

// Hook for offline scan management
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => { setIsOnline(true); syncPending(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    refreshPendingCount();
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const refreshPendingCount = async () => {
    try {
      const pending = await getPendingScans();
      setPendingCount(pending.length);
    } catch {}
  };

  const saveScanForLater = async (productId: string, sig: string, location?: string) => {
    await addPendingScan({
      productId,
      sig,
      location,
      timestamp: new Date().toISOString(),
      synced: false,
    });
    await refreshPendingCount();
  };

  const syncPending = async () => {
    if (syncing || !navigator.onLine) return;
    setSyncing(true);
    try {
      const pending = await getPendingScans();
      for (const scan of pending) {
        try {
          await scanAPI.scan({ productId: scan.productId, location: scan.location });
          if (scan.id) await markSynced(scan.id);
        } catch {
          // If sync fails, leave for next attempt
          break;
        }
      }
      await refreshPendingCount();
    } catch {}
    setSyncing(false);
  };

  return { isOnline, pendingCount, syncing, saveScanForLater, syncPending };
}

// UI Component showing offline status
export function OfflineIndicator() {
  const { isOnline, pendingCount, syncing, syncPending } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-gray-900/95 border border-white/10 px-4 py-2 shadow-xl backdrop-blur-sm">
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4 text-red-400" />
          <span className="text-xs text-red-400 font-medium">Offline</span>
        </>
      ) : (
        <Wifi className="h-4 w-4 text-emerald-400" />
      )}
      {pendingCount > 0 && (
        <>
          <span className="text-xs text-amber-400">{pendingCount} pending</span>
          {isOnline && (
            <button
              onClick={syncPending}
              disabled={syncing}
              className="ml-1 rounded-full bg-amber-500/20 p-1 hover:bg-amber-500/30 transition-colors"
            >
              {syncing ? (
                <Loader2 className="h-3 w-3 text-amber-400 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3 text-amber-400" />
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
