import type {StaticImageData} from 'next/image';
import heroRosePresent from '@/src/assets/images/hero_rose_present_1795119660100.jpg';
import giftFashion from '@/src/assets/images/gift_card_fashion_1795119659470.jpg';
import giftBook from '@/src/assets/images/gift_card_book_1795119659817.jpg';
import giftCoffee from '@/src/assets/images/gift_card_coffee_1795119660056.jpg';
import giftCandle from '@/src/assets/images/gift_card_candle_1795119659573.jpg';
import type {GiftItem, GiftPhotoKey} from '@/lib/wishlist-types';

export const HERO_PRESENT_IMAGE = heroRosePresent;

export const GIFT_PHOTO_OPTIONS: {
  key: GiftPhotoKey;
  label: string;
  image: StaticImageData;
}[] = [
  {key: 'fashion', label: 'Mode & Textile', image: giftFashion},
  {key: 'book', label: 'Livres & Papeterie', image: giftBook},
  {key: 'coffee', label: 'Maison & Gourmet', image: giftCoffee},
  {key: 'candle', label: 'Bien-être & Tech', image: giftCandle},
];

const PHOTO_MAP: Record<GiftPhotoKey, StaticImageData> = {
  fashion: giftFashion,
  book: giftBook,
  coffee: giftCoffee,
  candle: giftCandle,
};

export function resolveGiftPhoto(gift: GiftItem): StaticImageData {
  if (gift.photoKey && PHOTO_MAP[gift.photoKey]) {
    return PHOTO_MAP[gift.photoKey];
  }
  const text = `${gift.title} ${gift.note ?? ''}`.toLowerCase();
  if (/(écharpe|echarpe|pull|laine|vêtement|vetement|manteau|sac|bijou|robe|chemise)/.test(text)) {
    return giftFashion;
  }
  if (/(livre|roman|bd|album|carnet|papeterie|architecture|agenda)/.test(text)) {
    return giftBook;
  }
  if (/(café|cafe|thé|the|théière|theiere|moulin|tasse|cuisine|vaisselle|vin|chocolat)/.test(text)) {
    return giftCoffee;
  }
  if (/(bougie|parfum|casque|audio|enceinte|lampe|soin|coffret)/.test(text)) {
    return giftCandle;
  }
  // Deterministic fallback based on id/title hash
  let hash = 0;
  for (let i = 0; i < gift.id.length; i++) {
    hash = (hash * 31 + gift.id.charCodeAt(i)) | 0;
  }
  const keys: GiftPhotoKey[] = ['fashion', 'book', 'coffee', 'candle'];
  return PHOTO_MAP[keys[Math.abs(hash) % keys.length]];
}
