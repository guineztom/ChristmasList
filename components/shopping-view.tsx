'use client';

import React, {useMemo} from 'react';
import Image from 'next/image';
import {Check, ExternalLink, ShoppingBag} from 'lucide-react';
import {
  GiftItem,
  Person,
  extractHostname,
  formatEuro,
} from '@/lib/wishlist-types';
import {resolveGiftPhoto} from '@/lib/gift-photos';

interface ShoppingViewProps {
  people: Person[];
  gifts: GiftItem[];
  onTogglePurchased: (giftId: string) => void;
}

export function ShoppingView({
  people,
  gifts,
  onTogglePurchased,
}: ShoppingViewProps) {
  const personMap = useMemo(
    () => new Map(people.map((p) => [p.id, p])),
    [people]
  );

  const pendingGifts = useMemo(
    () => gifts.filter((g) => !g.purchased),
    [gifts]
  );

  const remainingTotal = useMemo(
    () => pendingGifts.reduce((s, g) => s + g.price, 0),
    [pendingGifts]
  );

  return (
    <section className="bg-white/95 border border-pink-100 rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgba(219,39,119,0.06)]">
      {/* Header inside card */}
      <div className="px-5 py-5 sm:px-6 border-b border-pink-100/70 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-neutral-900">
            Reste à acheter
          </h2>
          <p className="text-xs font-medium text-neutral-500 mt-0.5 tabular-nums">
            {pendingGifts.length}{' '}
            {pendingGifts.length > 1 ? 'articles restants' : 'article restant'}
          </p>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-semibold text-neutral-400">
            Total à prévoir
          </div>
          <div className="font-display text-xl sm:text-2xl font-extrabold text-[#DB2777] tabular-nums">
            {formatEuro(remainingTotal)}
          </div>
        </div>
      </div>

      {pendingGifts.length > 0 ? (
        <div className="divide-y divide-pink-100/60">
          {pendingGifts.map((gift) => {
            const person = personMap.get(gift.personId);
            const thumb = resolveGiftPhoto(gift);

            return (
              <div
                key={gift.id}
                className="px-5 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-[#FDF2F8]/30 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-pink-50 shrink-0 relative">
                    <Image
                      src={thumb}
                      alt={gift.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm sm:text-[15px] font-semibold text-neutral-900 truncate">
                      {gift.title}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5 truncate">
                      Pour {person?.name ?? 'Inconnu'}
                      {gift.note ? ` · ${gift.note}` : ''}
                    </div>
                    <div className="mt-1 font-display text-base font-bold text-[#DB2777] tabular-nums">
                      {formatEuro(gift.price)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0">
                  {gift.url && (
                    <a
                      href={gift.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FDF2F8] hover:bg-[#FCE7F3] text-xs font-semibold text-[#BE185D] transition-colors whitespace-nowrap"
                    >
                      <span className="max-w-[120px] truncate">
                        {extractHostname(gift.url)}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => onTogglePurchased(gift.id)}
                    className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#EC4899] to-[#A855F7] shadow-[0_4px_12px_rgba(236,72,153,0.25)] hover:opacity-95 active:scale-[0.97] transition-all whitespace-nowrap"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    Acheter
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-6 py-12 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="font-display text-base font-bold text-neutral-900">
            Tout est acheté !
          </p>
        </div>
      )}
    </section>
  );
}
