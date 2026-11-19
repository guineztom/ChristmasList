export interface Person {
  id: string;
  name: string;
  relation?: string;
  budgetLimit?: number | null;
  createdAt: string;
}

export type GiftPhotoKey = 'fashion' | 'book' | 'coffee' | 'candle';

export interface GiftItem {
  id: string;
  personId: string;
  title: string;
  price: number;
  url?: string;
  note?: string;
  photoKey?: GiftPhotoKey;
  purchased: boolean;
  createdAt: string;
}

export interface WishlistState {
  globalBudget: number | null;
  people: Person[];
  gifts: GiftItem[];
  activeShares?: ActiveShareMeta[];
}

export interface ActiveShareMeta {
  id: string;
  title: string;
  scope: 'all' | 'person';
  personId?: string;
  updatedAt: string;
}

export interface SharedWishlist {
  id: string;
  title: string;
  ownerLabel?: string;
  scope: 'all' | 'person';
  personId?: string;
  people: Person[];
  gifts: GiftItem[];
  createdAt: string;
  updatedAt: string;
}

export type WorkspaceTab = 'gifts' | 'shopping' | 'budgets';
export type GiftStatusFilter = 'all' | 'pending' | 'purchased';
export type GiftSortOption = 'recent' | 'price-asc' | 'price-desc' | 'person' | 'status';

export const STORAGE_KEY = 'atelier-noel-wishlist-v1';

export function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatEuro(amount: number): string {
  if (!Number.isFinite(amount)) return euroFormatter.format(0);
  return euroFormatter.format(amount);
}

export function parsePriceInput(raw: string): number {
  const cleaned = raw.replace(/\s+/g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100) / 100;
}

export function normalizeUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  // Reject dangerous schemes explicitly
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return undefined;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function extractHostname(rawUrl?: string): string {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return rawUrl;
  }
}

export const INITIAL_SAMPLE_STATE: WishlistState = {
  globalBudget: 450,
  people: [
    {
      id: 'person_camille',
      name: 'Camille',
      budgetLimit: 150,
      createdAt: '2026-11-10T10:00:00.000Z',
    },
    {
      id: 'person_lucas',
      name: 'Lucas',
      budgetLimit: 180,
      createdAt: '2026-11-10T10:05:00.000Z',
    },
    {
      id: 'person_maman',
      name: 'Maman',
      budgetLimit: 120,
      createdAt: '2026-11-10T10:10:00.000Z',
    },
  ],
  gifts: [
    {
      id: 'gift_1',
      personId: 'person_camille',
      title: 'Écharpe en laine mérinos côtelée',
      price: 68,
      url: 'https://www.sezane.com',
      note: 'Coloris vert forêt ou écru',
      purchased: true,
      createdAt: '2026-11-11T09:00:00.000Z',
    },
    {
      id: 'gift_2',
      personId: 'person_camille',
      title: 'Beau livre — Architecture Scandinave',
      price: 44.5,
      url: 'https://www.fnac.com',
      note: 'Édition reliée grand format',
      purchased: false,
      createdAt: '2026-11-11T09:15:00.000Z',
    },
    {
      id: 'gift_3',
      personId: 'person_lucas',
      title: 'Moulin à café manuel commandante',
      price: 139,
      url: 'https://www.maxicoffee.com',
      note: 'Modèle noyer foncé',
      purchased: false,
      createdAt: '2026-11-12T14:20:00.000Z',
    },
    {
      id: 'gift_4',
      personId: 'person_lucas',
      title: 'Paquet de café de spécialité Éthiopie',
      price: 18.5,
      url: 'https://www.terresdecafe.com',
      note: 'En grains, 250g',
      purchased: true,
      createdAt: '2026-11-12T14:25:00.000Z',
    },
    {
      id: 'gift_5',
      personId: 'person_maman',
      title: 'Théière en grès artisanal',
      price: 64,
      url: 'https://www.maisondumonde.com',
      note: 'Avec filtre inox inclus',
      purchased: false,
      createdAt: '2026-11-13T11:30:00.000Z',
    },
    {
      id: 'gift_6',
      personId: 'person_maman',
      title: 'Coffret bougie cèdre & ambre',
      price: 38,
      url: 'https://www.diptyqueparis.com',
      note: 'Format 190g',
      purchased: true,
      createdAt: '2026-11-13T11:40:00.000Z',
    },
  ],
};

export function buildCsvContent(state: WishlistState): string {
  const personMap = new Map(state.people.map((p) => [p.id, p]));
  const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;

  const headers = ['Personne', 'Relation', 'Cadeau', 'Prix (EUR)', 'Statut', 'Lien', 'Notes'];
  const rows = state.gifts.map((gift) => {
    const person = personMap.get(gift.personId);
    return [
      escapeCsv(person?.name ?? 'Inconnu'),
      escapeCsv(person?.relation ?? ''),
      escapeCsv(gift.title),
      gift.price.toFixed(2).replace('.', ','),
      escapeCsv(gift.purchased ? 'Acheté' : 'À acheter'),
      escapeCsv(gift.url ?? ''),
      escapeCsv(gift.note ?? ''),
    ].join(';');
  });

  return '\uFEFF' + [headers.join(';'), ...rows].join('\n');
}

export function buildShoppingSummaryText(state: WishlistState): string {
  const totalPlanned = state.gifts.reduce((sum, g) => sum + g.price, 0);
  const totalPurchased = state.gifts
    .filter((g) => g.purchased)
    .reduce((sum, g) => sum + g.price, 0);
  const remaining = totalPlanned - totalPurchased;

  const lines: string[] = [
    'LISTE DE NOËL — RÉSUMÉ',
    `Total prévu : ${formatEuro(totalPlanned)} | Déjà acheté : ${formatEuro(totalPurchased)} | Reste à prévoir : ${formatEuro(remaining)}`,
    '',
  ];

  for (const person of state.people) {
    const personGifts = state.gifts.filter((g) => g.personId === person.id);
    if (personGifts.length === 0) continue;
    const personTotal = personGifts.reduce((s, g) => s + g.price, 0);
    lines.push(
      `${person.name}${person.relation ? ` (${person.relation})` : ''} — ${formatEuro(personTotal)}`
    );
    for (const g of personGifts) {
      const box = g.purchased ? '[x]' : '[ ]';
      const linkPart = g.url ? ` — ${g.url}` : '';
      lines.push(`  ${box} ${g.title} (${formatEuro(g.price)})${linkPart}`);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}
