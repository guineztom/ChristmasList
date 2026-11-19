'use client';

import React, {useMemo, useState} from 'react';
import Image from 'next/image';
import {
  Check,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Share2,
  Trash2,
} from 'lucide-react';
import {
  GiftItem,
  Person,
  extractHostname,
  formatEuro,
} from '@/lib/wishlist-types';
import {HERO_PRESENT_IMAGE, resolveGiftPhoto} from '@/lib/gift-photos';
import {VisualBudgetBar} from '@/components/visual-budget-bar';

interface DiscoverViewProps {
  globalBudget: number | null;
  people: Person[];
  gifts: GiftItem[];
  selectedPersonId: string | null;
  onSelectPerson: (personId: string | null) => void;
  onTogglePurchased: (giftId: string) => void;
  onOpenGiftModal: (personId?: string, gift?: GiftItem) => void;
  onDeleteGift: (giftId: string) => void;
  onOpenPersonModal: () => void;
  onDeletePerson: (person: Person) => void;
  onOpenShareModal: () => void;
}

export function DiscoverView({
  globalBudget,
  people,
  gifts,
  selectedPersonId,
  onSelectPerson,
  onTogglePurchased,
  onOpenGiftModal,
  onDeleteGift,
  onOpenPersonModal,
  onDeletePerson,
  onOpenShareModal,
}: DiscoverViewProps) {
  const [search, setSearch] = useState('');
  const [openMenuGiftId, setOpenMenuGiftId] = useState<string | null>(null);

  const personMap = useMemo(
    () => new Map(people.map((p) => [p.id, p])),
    [people]
  );

  const filteredGifts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return gifts.filter((g) => {
      if (selectedPersonId && g.personId !== selectedPersonId) return false;
      if (!q) return true;
      const p = personMap.get(g.personId);
      return (
        g.title.toLowerCase().includes(q) ||
        (g.note ?? '').toLowerCase().includes(q) ||
        (p?.name ?? '').toLowerCase().includes(q)
      );
    });
  }, [gifts, selectedPersonId, search, personMap]);

  const totalPurchased = gifts
    .filter((g) => g.purchased)
    .reduce((s, g) => s + g.price, 0);
  const totalPending = gifts
    .filter((g) => !g.purchased)
    .reduce((s, g) => s + g.price, 0);
  const totalPlanned = totalPurchased + totalPending;
  const boughtCount = gifts.filter((g) => g.purchased).length;

  return (
    <div className="space-y-6">
      {/* Hero Banner Card */}
      <section className="relative rounded-[28px] overflow-hidden shadow-[0_12px_36px_rgba(190,24,93,0.12)] min-h-[200px] sm:min-h-[225px] flex items-end sm:items-center">
        <Image
          src={HERO_PRESENT_IMAGE}
          alt="Coffret cadeau de Noël avec ruban satiné rose"
          priority
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#3A102B]/90 via-[#54193E]/65 to-[#54193E]/25" />

        <div className="relative z-10 w-full p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-lg">
            <div className="text-xs font-semibold text-pink-200 tabular-nums">
              {boughtCount}/{gifts.length}{' '}
              {gifts.length > 1 ? 'achetés' : 'acheté'} ·{' '}
              {formatEuro(totalPlanned)}
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white text-balance">
              Vos cadeaux de Noël
            </h1>
          </div>

          {/* Actions neatly inside Hero card */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {people.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    onOpenGiftModal(selectedPersonId ?? undefined)
                  }
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#EC4899] to-[#A855F7] shadow-[0_6px_18px_rgba(236,72,153,0.4)] hover:opacity-95 active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau cadeau
                </button>
                <button
                  type="button"
                  onClick={onOpenShareModal}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-white bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  <Share2 className="w-4 h-4" />
                  Partager
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenPersonModal}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-[#EC4899] to-[#A855F7] shadow-[0_6px_18px_rgba(236,72,153,0.4)] hover:opacity-95 transition-opacity whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Ajouter une personne
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filter & Visual Summary Bar Card */}
      <section className="bg-white/95 border border-pink-100 rounded-[28px] p-5 sm:p-6 shadow-[0_8px_30px_rgba(219,39,119,0.05)] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Wrapping Person Filter Tabs (NO horizontal scrollbar!) */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-pink-100/70 pb-1">
            <button
              type="button"
              onClick={() => onSelectPerson(null)}
              className={`pb-2 text-sm font-bold border-b-2 transition-colors ${
                selectedPersonId === null
                  ? 'border-[#EC4899] text-[#DB2777]'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Tous
            </button>
            {people.map((person) => {
              const active = selectedPersonId === person.id;
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => onSelectPerson(person.id)}
                  className={`pb-2 text-sm font-bold border-b-2 transition-colors ${
                    active
                      ? 'border-[#EC4899] text-[#DB2777]'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  {person.name}
                </button>
              );
            })}
          </div>

          {/* Search Pill + Optional Delete Selected Person */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <div className="relative flex-1 md:w-60">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                aria-label="Rechercher un cadeau"
                className="w-full min-h-[40px] pl-10 pr-3.5 py-2 text-base sm:text-sm bg-[#FDF2F8]/60 border border-pink-100 rounded-full text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-[#EC4899] focus:outline-none transition-colors"
              />
            </div>

            {selectedPersonId && personMap.get(selectedPersonId) && (
              <button
                type="button"
                onClick={() => {
                  const person = personMap.get(selectedPersonId);
                  if (person) onDeletePerson(person);
                }}
                title={`Supprimer ${personMap.get(selectedPersonId)?.name}`}
                aria-label={`Supprimer ${personMap.get(selectedPersonId)?.name}`}
                className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-rose-50/90 hover:bg-rose-100 text-rose-600 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <VisualBudgetBar
          purchased={totalPurchased}
          pending={totalPending}
          budget={globalBudget}
          compact
        />
      </section>

      {/* Illustrated Gift Cards Grid (Minimal buttons inside card footer) */}
      {filteredGifts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGifts.map((gift) => {
            const person = personMap.get(gift.personId);
            const photo = resolveGiftPhoto(gift);
            const menuOpen = openMenuGiftId === gift.id;

            return (
              <article
                key={gift.id}
                className={`relative bg-white/95 border rounded-[28px] p-5 shadow-[0_8px_30px_rgba(219,39,119,0.06)] flex flex-col justify-between gap-4 transition-all ${
                  gift.purchased
                    ? 'border-emerald-200/80 bg-white/80'
                    : 'border-pink-100 hover:shadow-[0_12px_34px_rgba(219,39,119,0.1)]'
                }`}
              >
                <div className="text-center space-y-3">
                  {/* Circular Studio Product Photo */}
                  <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden ring-4 ring-[#FDF2F8] shadow-sm bg-pink-50">
                    <Image
                      src={photo}
                      alt={gift.title}
                      className={`w-full h-full object-cover transition-opacity ${
                        gift.purchased ? 'opacity-65' : ''
                      }`}
                    />
                  </div>

                  <div className="space-y-1 px-1">
                    <h3
                      className={`font-display text-base font-bold leading-snug line-clamp-2 ${
                        gift.purchased
                          ? 'line-through text-neutral-400'
                          : 'text-neutral-900'
                      }`}
                    >
                      {gift.title}
                    </h3>

                    <p className="text-xs font-medium text-neutral-500 truncate">
                      {person?.name ?? 'Inconnu'}
                      {gift.note ? ` · ${gift.note}` : ''}
                    </p>

                    {gift.url && (
                      <a
                        href={gift.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#BE185D] hover:underline"
                      >
                        <span className="max-w-[140px] truncate">
                          {extractHostname(gift.url)}
                        </span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    )}
                  </div>

                  <div className="font-display text-xl font-extrabold text-[#DB2777] tabular-nums">
                    {formatEuro(gift.price)}
                  </div>
                </div>

                {/* Clean Card Footer: 1 Primary CTA + 1 Overflow Menu */}
                <div className="pt-3 border-t border-pink-100/70 flex items-center gap-2 relative">
                  <button
                    type="button"
                    onClick={() => onTogglePurchased(gift.id)}
                    aria-pressed={gift.purchased}
                    className={`flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold active:scale-[0.97] transition-all whitespace-nowrap ${
                      gift.purchased
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-gradient-to-r from-[#EC4899] to-[#A855F7] text-white shadow-[0_4px_12px_rgba(236,72,153,0.28)] hover:opacity-95'
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

                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuGiftId(menuOpen ? null : gift.id)
                      }
                      className="w-10 h-10 inline-flex items-center justify-center rounded-2xl bg-neutral-100/80 hover:bg-neutral-200 text-neutral-600 transition-colors"
                      aria-label={`Options pour ${gift.title}`}
                      aria-expanded={menuOpen}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {menuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setOpenMenuGiftId(null)}
                        />
                        <div className="absolute right-0 bottom-12 w-40 bg-white border border-pink-100 rounded-2xl shadow-xl py-1.5 z-30 text-xs font-semibold text-neutral-700">
                          {gift.url && (
                            <a
                              href={gift.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpenMenuGiftId(null)}
                              className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-[#FDF2F8] hover:text-[#BE185D]"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Voir l&apos;article
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuGiftId(null);
                              onOpenGiftModal(gift.personId, gift);
                            }}
                            className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-[#FDF2F8] hover:text-[#BE185D] text-left"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuGiftId(null);
                              onDeleteGift(gift.id);
                            }}
                            className="w-full px-3.5 py-2 flex items-center gap-2 text-rose-600 hover:bg-rose-50 text-left"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Supprimer
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/95 border border-pink-100 rounded-[28px] p-10 text-center space-y-3 shadow-[0_8px_30px_rgba(219,39,119,0.05)]">
          <p className="font-display text-lg font-bold text-neutral-900">
            Aucun cadeau pour le moment
          </p>
          {people.length > 0 ? (
            <button
              type="button"
              onClick={() => onOpenGiftModal(selectedPersonId ?? undefined)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#EC4899] to-[#A855F7] rounded-2xl"
            >
              <Plus className="w-4 h-4" />
              Ajouter un cadeau
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenPersonModal}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#EC4899] to-[#A855F7] rounded-2xl"
            >
              <Plus className="w-4 h-4" />
              Ajouter une personne
            </button>
          )}
        </div>
      )}
    </div>
  );
}
