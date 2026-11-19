'use client';

import {useCallback, useSyncExternalStore} from 'react';
import {
  INITIAL_SAMPLE_STATE,
  STORAGE_KEY,
  WishlistState,
} from '@/lib/wishlist-types';

let cachedRaw: string | null | undefined = undefined;
let cachedState: WishlistState = INITIAL_SAMPLE_STATE;

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function readStateFromStorage(): WishlistState {
  if (typeof window === 'undefined') return INITIAL_SAMPLE_STATE;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedState;
    }
    cachedRaw = raw;
    if (!raw) {
      cachedState = INITIAL_SAMPLE_STATE;
      return cachedState;
    }
    const parsed = JSON.parse(raw) as Partial<WishlistState>;
    if (Array.isArray(parsed.people) && Array.isArray(parsed.gifts)) {
      cachedState = {
        globalBudget:
          typeof parsed.globalBudget === 'number' ? parsed.globalBudget : null,
        people: parsed.people,
        gifts: parsed.gifts,
        activeShares: Array.isArray(parsed.activeShares)
          ? parsed.activeShares
          : [],
      };
      return cachedState;
    }
  } catch {
    // Fallback safely to current/default state if JSON or storage fails
  }
  return cachedState;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cachedRaw = undefined;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function getServerSnapshot(): WishlistState {
  return INITIAL_SAMPLE_STATE;
}

const emptySubscribe = () => () => {};

export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function useWishlistStore() {
  const state = useSyncExternalStore(
    subscribe,
    readStateFromStorage,
    getServerSnapshot
  );

  const setState = useCallback(
    (updater: WishlistState | ((prev: WishlistState) => WishlistState)) => {
      const current = readStateFromStorage();
      const next = typeof updater === 'function' ? updater(current) : updater;
      const serialized = JSON.stringify(next);
      cachedRaw = serialized;
      cachedState = next;
      try {
        window.localStorage.setItem(STORAGE_KEY, serialized);
      } catch {
        // Ignore quota errors
      }
      emitChange();
    },
    []
  );

  return [state, setState] as const;
}
