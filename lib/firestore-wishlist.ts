import {User} from 'firebase/auth';
import {
  Timestamp,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import {OperationType, handleFirestoreError} from '@/lib/firestore-errors';
import {
  ActiveShareMeta,
  GiftItem,
  INITIAL_SAMPLE_STATE,
  Person,
  SharedWishlist,
  WishlistState,
} from '@/lib/wishlist-types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    }
    return out as T;
  }
  return value;
}

function toIsoString(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string' && val.length > 0) {
    return val;
  }
  return new Date().toISOString();
}

export async function syncUserProfileToFirestore(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const payload = stripUndefinedDeep({
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? undefined,
      photoURL: user.photoURL ?? undefined,
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'users', user.uid), payload, {merge: true});
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUserWishlist(
  userId: string,
  seedState: WishlistState,
  onData: (state: WishlistState) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${userId}/wishlists/main`;
  const ref = doc(db, 'users', userId, 'wishlists', 'main');
  let seeded = false;

  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        if (!seeded) {
          seeded = true;
          const initial = seedState.people.length > 0 ? seedState : INITIAL_SAMPLE_STATE;
          void saveUserWishlist(userId, initial).catch((err) => {
            onError?.(err instanceof Error ? err : new Error(String(err)));
          });
        }
        return;
      }

      const data = snapshot.data();
      onData({
        globalBudget:
          typeof data.globalBudget === 'number' ? data.globalBudget : null,
        people: Array.isArray(data.people) ? (data.people as Person[]) : [],
        gifts: Array.isArray(data.gifts) ? (data.gifts as GiftItem[]) : [],
        activeShares: Array.isArray(data.activeShares)
          ? (data.activeShares as ActiveShareMeta[])
          : [],
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError?.(
          wrapped instanceof Error ? wrapped : new Error(String(wrapped))
        );
      }
    }
  );
}

export async function saveUserWishlist(
  userId: string,
  state: WishlistState
): Promise<void> {
  const path = `users/${userId}/wishlists/main`;
  try {
    const payload = stripUndefinedDeep({
      ownerUid: userId,
      globalBudget: state.globalBudget ?? null,
      people: state.people,
      gifts: state.gifts,
      activeShares: state.activeShares ?? [],
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'users', userId, 'wishlists', 'main'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertFirestoreShare(params: {
  shareId: string;
  ownerUid: string;
  title: string;
  scope: 'all' | 'person';
  personId?: string;
  people: Person[];
  gifts: GiftItem[];
}): Promise<SharedWishlist> {
  const path = `shares/${params.shareId}`;
  const ref = doc(db, 'shares', params.shareId);

  try {
    const existingSnap = await getDoc(ref);
    const existingData = existingSnap.exists() ? existingSnap.data() : null;
    const existingPurchasedMap = new Map<string, boolean>();
    if (existingData && Array.isArray(existingData.gifts)) {
      for (const g of existingData.gifts as GiftItem[]) {
        if (g && typeof g.id === 'string') {
          existingPurchasedMap.set(g.id, Boolean(g.purchased));
        }
      }
    }

    const sanitizedPeople = params.people.map((p) =>
      stripUndefinedDeep({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt,
      })
    );

    const sanitizedGifts = params.gifts.map((g) =>
      stripUndefinedDeep({
        id: g.id,
        personId: g.personId,
        title: g.title,
        price: g.price,
        url: g.url,
        note: g.note,
        photoKey: g.photoKey,
        purchased: existingPurchasedMap.has(g.id)
          ? Boolean(existingPurchasedMap.get(g.id))
          : Boolean(g.purchased),
        createdAt: g.createdAt,
      })
    );

    const payload = stripUndefinedDeep({
      id: params.shareId,
      ownerUid: params.ownerUid,
      title: params.title,
      scope: params.scope,
      personId: params.scope === 'person' ? params.personId : undefined,
      people: sanitizedPeople,
      gifts: sanitizedGifts,
      createdAt: existingData?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(ref, payload);

    const nowIso = new Date().toISOString();
    return {
      id: params.shareId,
      title: params.title,
      scope: params.scope,
      personId: params.scope === 'person' ? params.personId : undefined,
      people: sanitizedPeople,
      gifts: sanitizedGifts,
      createdAt: toIsoString(existingData?.createdAt),
      updatedAt: nowIso,
    };
  } catch (error) {
    return handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getFirestoreShare(
  shareId: string
): Promise<SharedWishlist | null> {
  const path = `shares/${shareId}`;
  try {
    const snap = await getDoc(doc(db, 'shares', shareId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: String(data.id ?? shareId),
      title: String(data.title ?? 'Liste de Noël'),
      scope: data.scope === 'person' ? 'person' : 'all',
      personId:
        typeof data.personId === 'string' ? data.personId : undefined,
      people: Array.isArray(data.people) ? (data.people as Person[]) : [],
      gifts: Array.isArray(data.gifts) ? (data.gifts as GiftItem[]) : [],
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
    };
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function toggleFirestoreShareGift(
  shareId: string,
  currentGifts: GiftItem[],
  giftId: string,
  purchased: boolean
): Promise<GiftItem[]> {
  const path = `shares/${shareId}`;
  const updatedGifts = currentGifts.map((g) =>
    g.id === giftId ? stripUndefinedDeep({...g, purchased}) : stripUndefinedDeep(g)
  );
  try {
    await updateDoc(doc(db, 'shares', shareId), {
      gifts: updatedGifts,
      updatedAt: serverTimestamp(),
    });
    return updatedGifts;
  } catch (error) {
    return handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
