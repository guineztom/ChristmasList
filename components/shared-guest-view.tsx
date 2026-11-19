'use client';

import React, {useMemo, useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Check,
  ExternalLink,
  Gift,
  Lock,
} from 'lucide-react';
import {
  SharedWishlist,
  extractHostname,
  formatEuro,
} from '@/lib/wishlist-types';
import {resolveGiftPhoto} from '@/lib/gift-photos';
import {toggleFirestoreShareGift} from '@/lib/firestore-wishlist';

interface SharedGuestViewProps {
  initialShare: SharedWishlist;
  source?: 'firestore' | 'local';
}

export function SharedGuestView({
  initialShare,
  source = 'local',
}: SharedGuestViewProps) {
  const [share, setShare] = useState<SharedWishlist>(initialShare);
  const [updatingGiftId, setUpdatingGiftId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const total = share.gifts.reduce((s, g) => s + g.price, 0);
    const bought = share.gifts
      .filter((g) => g.purchased)
      .reduce((s, g) => s + g.price, 0);
    const boughtCount = share.gifts.filter((g) => g.purchased).length;
    return {
      total,
      bought,
      remaining: total - bought,
      boughtCount,
      totalCount: share.gifts.length,
    };
  }, [share.gifts]);

  const handleToggleGift = async (giftId: string, nextPurchased: boolean) => {
    setErrorMsg(null);
    setUpdatingGiftId(giftId);

    const previous = share;
    setShare((curr) => ({
      ...curr,
      gifts: curr.gifts.map((g) =>
        g.id === giftId ? {...g, purchased: nextPurchased} : g
      ),
    }));

    try {
      if (source === 'firestore') {
        const updatedGifts = await toggleFirestoreShareGift(
          share.id,
          previous.gifts,
          giftId,
          nextPurchased
        );
        setShare((curr) => ({
          ...curr,
          gifts: updatedGifts,
        }));
      } else {
        const res = await fetch(`/api/shares/${share.id}`, {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({giftId, purchased: nextPurchased}),
        });
        const payload = (await res.json()) as {
          share?: SharedWishlist;
          error?: string;
        };
        if (!res.ok || !payload.share) {
          setShare(previous);
          setErrorMsg(payload.error ?? 'Action impossible.');
          return;
        }
        setShare(payload.share);
      }
    } catch {
      setShare(previous);
      setErrorMsg('Erreur réseau.');
    } finally {
      setUpdatingGiftId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F9] via-[#FDFBFF] to-[#F3EFFE] text-neutral-900">
      <header className="bg-white/85 backdrop-blur-md border-b border-pink-100/80 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 whitespace-nowrap"
          >
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#A855F7] text-white flex items-center justify-center shadow-[0_4px_10px_rgba(236,72,153,0.28)]">
              <Gift className="w-4 h-4" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight bg-gradient-to-r from-[#DB2777] to-[#9333EA] bg-clip-text text-transparent">
              ChristmasList
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FDF2F8] hover:bg-[#FCE7F3] text-xs font-semibold text-[#BE185D] transition-colors whitespace-nowrap"
          >
            Créer ma liste
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <section className="bg-white/95 border border-pink-100 rounded-[28px] p-5 sm:p-6 shadow-[0_8px_30px_rgba(219,39,119,0.06)] space-y-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DB2777]">
              <Lock className="w-3.5 h-3.5" />
              <span>Lecture seule</span>
            </div>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
              {share.title}
            </h1>
          </div>

          <div className="pt-4 border-t border-pink-100/70 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs font-medium text-neutral-500">Achetés</div>
              <div className="mt-0.5 font-display tabular-nums text-lg sm:text-xl font-bold text-emerald-600">
                {metrics.boughtCount}/{metrics.totalCount}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-neutral-500">Total</div>
              <div className="mt-0.5 font-display tabular-nums text-lg sm:text-xl font-bold text-[#DB2777]">
                {formatEuro(metrics.total)}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-neutral-500">Reste</div>
              <div className="mt-0.5 font-display tabular-nums text-lg sm:text-xl font-bold text-neutral-900">
                {formatEuro(metrics.remaining)}
              </div>
            </div>
          </div>
        </section>

        {errorMsg && (
          <div
            role="alert"
            className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-rose-600"
          >
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          {share.people.map((person) => {
            const pGifts = share.gifts.filter((g) => g.personId === person.id);
            return (
              <section
                key={person.id}
                className="bg-white/95 border border-pink-100 rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgba(219,39,119,0.06)]"
              >
                <div className="px-5 py-4 sm:px-6 border-b border-pink-100/70 flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold tracking-tight text-neutral-900">
                    {person.name}
                  </h2>
                </div>

                {pGifts.length > 0 ? (
                  <div className="divide-y divide-pink-100/60">
                    {pGifts.map((gift) => {
                      const isBusy = updatingGiftId === gift.id;
                      const thumb = resolveGiftPhoto(gift);
                      return (
                        <div
                          key={gift.id}
                          className={`px-5 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            gift.purchased ? 'bg-[#FDF2F8]/40' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-pink-50 shrink-0 relative">
                              <Image
                                src={thumb}
                                alt={gift.title}
                                className={`w-full h-full object-cover ${
                                  gift.purchased ? 'opacity-50' : ''
                                }`}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div
                                className={`text-sm sm:text-[15px] font-semibold ${
                                  gift.purchased
                                    ? 'line-through text-neutral-400'
                                    : 'text-neutral-900'
                                }`}
                              >
                                {gift.title}
                              </div>
                              {gift.note && (
                                <div className="text-xs text-neutral-500 mt-0.5">
                                  {gift.note}
                                </div>
                              )}
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
                                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FDF2F8] hover:bg-[#FCE7F3] text-xs font-semibold text-[#BE185D] transition-colors whitespace-nowrap"
                              >
                                <span className="max-w-[110px] truncate">
                                  {extractHostname(gift.url)}
                                </span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleToggleGift(gift.id, !gift.purchased)
                              }
                              aria-pressed={gift.purchased}
                              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all whitespace-nowrap ${
                                gift.purchased
                                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                  : 'bg-gradient-to-r from-[#EC4899] to-[#A855F7] text-white shadow-[0_4px_14px_rgba(236,72,153,0.28)] hover:opacity-95'
                              }`}
                            >
                              {gift.purchased ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  Acheté
                                </>
                              ) : (
                                'Marquer acheté'
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-6 py-5 text-sm text-neutral-500">
                    Aucun cadeau.
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
