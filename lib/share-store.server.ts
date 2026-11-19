import {promises as fs} from 'fs';
import path from 'path';
import crypto from 'crypto';
import {GiftItem, Person, SharedWishlist} from '@/lib/wishlist-types';

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'shares.json');

declare global {
  var __atelierNoelShares: Map<string, SharedWishlist> | undefined;
  var __atelierNoelSharesLoaded: boolean | undefined;
  var __atelierNoelWriteQueue: Promise<void> | undefined;
}

function getStore(): Map<string, SharedWishlist> {
  if (!globalThis.__atelierNoelShares) {
    globalThis.__atelierNoelShares = new Map<string, SharedWishlist>();
  }
  return globalThis.__atelierNoelShares;
}

async function ensureLoaded(): Promise<Map<string, SharedWishlist>> {
  const store = getStore();
  if (globalThis.__atelierNoelSharesLoaded) {
    return store;
  }
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, SharedWishlist>;
    if (parsed && typeof parsed === 'object') {
      for (const [key, value] of Object.entries(parsed)) {
        if (value && typeof value.id === 'string') {
          store.set(key, value);
        }
      }
    }
  } catch {
    // File may not exist yet on first run
  }
  globalThis.__atelierNoelSharesLoaded = true;
  return store;
}

async function persistStore(store: Map<string, SharedWishlist>): Promise<void> {
  const serialized = JSON.stringify(Object.fromEntries(store.entries()), null, 2);
  const runWrite = async () => {
    await fs.mkdir(DATA_DIR, {recursive: true});
    await fs.writeFile(DATA_FILE, serialized, 'utf8');
  };
  globalThis.__atelierNoelWriteQueue = (
    globalThis.__atelierNoelWriteQueue ?? Promise.resolve()
  ).then(runWrite, runWrite);
  await globalThis.__atelierNoelWriteQueue;
}

function generateShareId(): string {
  return crypto.randomBytes(6).toString('base64url');
}

export async function getShareById(id: string): Promise<SharedWishlist | null> {
  const cleanId = id.trim();
  if (!cleanId || cleanId.length > 64) return null;
  const store = await ensureLoaded();
  return store.get(cleanId) ?? null;
}

export async function upsertShare(input: {
  shareId?: string;
  title: string;
  ownerLabel?: string;
  scope: 'all' | 'person';
  personId?: string;
  people: Person[];
  gifts: GiftItem[];
}): Promise<SharedWishlist> {
  const store = await ensureLoaded();
  const now = new Date().toISOString();

  const existing = input.shareId ? store.get(input.shareId) : undefined;
  const id = existing ? existing.id : generateShareId();

  // Preserve guest-marked purchases when refreshing an existing share
  const existingPurchased = new Map<string, boolean>();
  if (existing) {
    for (const g of existing.gifts) {
      existingPurchased.set(g.id, Boolean(g.purchased));
    }
  }

  const sanitizedPeople: Person[] = input.people.slice(0, 100).map((p) => ({
    id: String(p.id),
    name: String(p.name).slice(0, 80),
    relation: p.relation ? String(p.relation).slice(0, 50) : undefined,
    budgetLimit: null, // Do not expose private budget ceilings to gift recipients
    createdAt: p.createdAt || now,
  }));

  const allowedPersonIds = new Set(sanitizedPeople.map((p) => p.id));

  const sanitizedGifts: GiftItem[] = input.gifts
    .filter((g) => allowedPersonIds.has(g.personId))
    .slice(0, 300)
    .map((g) => ({
      id: String(g.id),
      personId: String(g.personId),
      title: String(g.title).slice(0, 160),
      price:
        typeof g.price === 'number' && Number.isFinite(g.price) && g.price >= 0
          ? Math.round(g.price * 100) / 100
          : 0,
      url: g.url ? String(g.url).slice(0, 500) : undefined,
      note: g.note ? String(g.note).slice(0, 160) : undefined,
      purchased: Boolean(g.purchased || existingPurchased.get(g.id)),
      createdAt: g.createdAt || now,
    }));

  const record: SharedWishlist = {
    id,
    title: input.title.trim().slice(0, 100) || 'Liste de Noël',
    ownerLabel: input.ownerLabel?.trim().slice(0, 60) || undefined,
    scope: input.scope === 'person' ? 'person' : 'all',
    personId: input.scope === 'person' ? input.personId : undefined,
    people: sanitizedPeople,
    gifts: sanitizedGifts,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  store.set(id, record);
  await persistStore(store);
  return record;
}

export async function toggleSharedGiftPurchased(
  shareId: string,
  giftId: string,
  purchased: boolean
): Promise<SharedWishlist | null> {
  const store = await ensureLoaded();
  const existing = store.get(shareId);
  if (!existing) return null;

  let found = false;
  const updatedGifts = existing.gifts.map((gift) => {
    if (gift.id === giftId) {
      found = true;
      return {...gift, purchased: Boolean(purchased)};
    }
    return gift;
  });

  if (!found) return null;

  const updated: SharedWishlist = {
    ...existing,
    gifts: updatedGifts,
    updatedAt: new Date().toISOString(),
  };

  store.set(shareId, updated);
  await persistStore(store);
  return updated;
}
