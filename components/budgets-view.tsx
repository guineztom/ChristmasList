'use client';

import React, {useRef, useState} from 'react';
import {
  Copy,
  Download,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Share2,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  GiftItem,
  Person,
  formatEuro,
  parsePriceInput,
} from '@/lib/wishlist-types';
import {VisualBudgetBar} from '@/components/visual-budget-bar';
import {
  BudgetDonutChart,
  PersonBudgetMetric,
} from '@/components/budget-charts';

interface BudgetsViewProps {
  globalBudget: number | null;
  people: Person[];
  gifts: GiftItem[];
  onUpdateGlobalBudget: (budget: number | null) => void;
  onUpdatePersonBudget: (personId: string, budgetLimit: number | null) => void;
  onAddPerson: () => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (person: Person) => void;
  onSharePerson: (personId: string) => void;
  onOpenPersonGifts: (personId: string) => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onCopySummary: () => void;
  onResetSamples: () => void;
  onClearAll: () => void;
}

function PersonDonutCard({
  metric,
  person,
  giftCount,
  onUpdatePersonBudget,
  onEditPerson,
  onDeletePerson,
  onSharePerson,
  onOpenPersonGifts,
}: {
  metric: PersonBudgetMetric;
  person: Person;
  giftCount: number;
  onUpdatePersonBudget: (personId: string, budgetLimit: number | null) => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (person: Person) => void;
  onSharePerson: (personId: string) => void;
  onOpenPersonGifts: (personId: string) => void;
}) {
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const hasBudget = person.budgetLimit != null && person.budgetLimit > 0;
  const ceiling = person.budgetLimit ?? 0;
  const diff = hasBudget ? ceiling - metric.total : 0;
  const overBudget = hasBudget && diff < 0;
  const initial = person.name.trim().charAt(0).toUpperCase() || '?';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (budgetDraft.trim() === '') {
      onUpdatePersonBudget(person.id, null);
      setEditingBudget(false);
      return;
    }
    const parsed = parsePriceInput(budgetDraft);
    onUpdatePersonBudget(person.id, parsed > 0 ? parsed : null);
    setEditingBudget(false);
  };

  return (
    <section className="bg-white/95 border border-pink-100 rounded-[28px] p-5 sm:p-6 shadow-[0_8px_30px_rgba(219,39,119,0.06)] flex flex-col justify-between gap-5">
      {/* Header: Name + Single Overflow Menu */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpenPersonGifts(person.id)}
          className="flex items-center gap-3 min-w-0 text-left group"
          title={`Voir les cadeaux de ${person.name}`}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#EC4899] to-[#A855F7] text-white font-display font-bold text-base flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(236,72,153,0.25)]">
            {initial}
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold tracking-tight text-neutral-900 group-hover:text-[#DB2777] truncate transition-colors">
              {person.name}
            </h3>
            <div className="text-xs font-medium text-neutral-400 tabular-nums">
              {giftCount} {giftCount > 1 ? 'cadeaux' : 'cadeau'}
            </div>
          </div>
        </button>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="w-9 h-9 inline-flex items-center justify-center rounded-xl bg-neutral-100/80 hover:bg-neutral-200 text-neutral-600 transition-colors"
            aria-label={`Options pour ${person.name}`}
            aria-expanded={menuOpen}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-pink-100 rounded-2xl shadow-xl py-1.5 z-30 text-xs font-semibold text-neutral-700">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenPersonGifts(person.id);
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-[#FDF2F8] hover:text-[#BE185D] text-left"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Voir ses cadeaux
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onSharePerson(person.id);
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-[#FDF2F8] hover:text-[#BE185D] text-left"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Partager
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEditPerson(person);
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-[#FDF2F8] hover:text-[#BE185D] text-left"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Renommer
                </button>
                <div className="my-1 border-t border-pink-100/70" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDeletePerson(person);
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

      {/* Visual Donut + Clean Numeric Breakdown (NO gift list repetition) */}
      <div className="flex items-center gap-5">
        <BudgetDonutChart
          purchased={metric.purchased}
          pending={metric.pending}
          budget={person.budgetLimit}
          size={112}
          strokeWidth={12}
        />

        <div className="flex-1 min-w-0 space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-neutral-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              Acheté
            </span>
            <span className="font-display font-bold text-neutral-900 tabular-nums">
              {formatEuro(metric.purchased)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-neutral-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#EC4899] shrink-0" />
              À acheter
            </span>
            <span className="font-display font-bold text-neutral-900 tabular-nums">
              {formatEuro(metric.pending)}
            </span>
          </div>

          <div className="pt-2 border-t border-pink-100/70 flex items-center justify-between gap-2">
            <span className="text-neutral-500 font-medium">Budget</span>
            {editingBudget ? (
              <form onSubmit={handleSave} className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  value={budgetDraft}
                  onChange={(e) => setBudgetDraft(e.target.value)}
                  placeholder="150"
                  aria-label={`Budget pour ${person.name}`}
                  className="w-16 px-2 py-1 text-xs font-display font-bold tabular-nums bg-neutral-50 border border-pink-200 rounded-lg focus:bg-white focus:border-[#EC4899] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-2 py-1 text-[11px] font-semibold text-white bg-gradient-to-r from-[#EC4899] to-[#A855F7] rounded-lg"
                >
                  OK
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setBudgetDraft(
                    person.budgetLimit != null ? String(person.budgetLimit) : ''
                  );
                  setEditingBudget(true);
                }}
                className="font-display font-bold text-[#DB2777] hover:underline tabular-nums"
              >
                {hasBudget ? formatEuro(ceiling) : 'Définir'}
              </button>
            )}
          </div>

          {hasBudget && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-neutral-500 font-medium">
                {overBudget ? 'Dépassement' : 'Marge'}
              </span>
              <span
                className={`font-display font-bold tabular-nums ${
                  overBudget ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {overBudget
                  ? `+${formatEuro(Math.abs(diff))}`
                  : formatEuro(diff)}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function BudgetsView({
  globalBudget,
  people,
  gifts,
  onUpdateGlobalBudget,
  onUpdatePersonBudget,
  onAddPerson,
  onEditPerson,
  onDeletePerson,
  onSharePerson,
  onOpenPersonGifts,
  onExportCsv,
  onExportJson,
  onImportJson,
  onCopySummary,
  onResetSamples,
  onClearAll,
}: BudgetsViewProps) {
  const [editingGlobal, setEditingGlobal] = useState(false);
  const [globalDraft, setGlobalDraft] = useState(
    globalBudget != null ? String(globalBudget) : ''
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPurchased = gifts
    .filter((g) => g.purchased)
    .reduce((s, g) => s + g.price, 0);
  const totalPending = gifts
    .filter((g) => !g.purchased)
    .reduce((s, g) => s + g.price, 0);
  const totalPlanned = totalPurchased + totalPending;

  const personMetrics: PersonBudgetMetric[] = people.map((person) => {
    const pGifts = gifts.filter((g) => g.personId === person.id);
    const purchased = pGifts
      .filter((g) => g.purchased)
      .reduce((s, g) => s + g.price, 0);
    const pending = pGifts
      .filter((g) => !g.purchased)
      .reduce((s, g) => s + g.price, 0);
    return {
      id: person.id,
      name: person.name,
      purchased,
      pending,
      total: purchased + pending,
      budget: person.budgetLimit ?? null,
    };
  });

  const handleSaveGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalDraft.trim() === '') {
      onUpdateGlobalBudget(null);
      setEditingGlobal(false);
      return;
    }
    const val = parsePriceInput(globalDraft);
    onUpdateGlobalBudget(val > 0 ? val : null);
    setEditingGlobal(false);
  };

  return (
    <div className="space-y-5">
      {/* Global Budget Card with Donut + Multi-Segment Bar + Overflow Options */}
      <section className="bg-white/95 border border-pink-100 rounded-[28px] p-5 sm:p-6 shadow-[0_8px_30px_rgba(219,39,119,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex justify-center sm:justify-start">
            <BudgetDonutChart
              purchased={totalPurchased}
              pending={totalPending}
              budget={globalBudget}
              size={128}
              strokeWidth={14}
              label="Total"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-neutral-500">
                  Budget global
                </div>
                <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
                  <span className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 tabular-nums">
                    {formatEuro(totalPlanned)}
                  </span>

                  {editingGlobal ? (
                    <form
                      onSubmit={handleSaveGlobal}
                      className="inline-flex items-center gap-1.5"
                    >
                      <input
                        type="text"
                        inputMode="decimal"
                        autoFocus
                        value={globalDraft}
                        onChange={(e) => setGlobalDraft(e.target.value)}
                        placeholder="500"
                        aria-label="Budget global"
                        className="w-20 px-2.5 py-1 text-xs font-display font-bold tabular-nums bg-neutral-50 border border-pink-200 rounded-xl focus:bg-white focus:border-[#EC4899] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-gradient-to-r from-[#EC4899] to-[#A855F7] rounded-xl"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingGlobal(false)}
                        className="px-2 py-1 text-xs font-semibold text-neutral-500 bg-neutral-100 rounded-xl"
                      >
                        Annuler
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setGlobalDraft(
                          globalBudget != null ? String(globalBudget) : ''
                        );
                        setEditingGlobal(true);
                      }}
                      className="font-display text-sm sm:text-base font-bold text-[#DB2777] hover:underline tabular-nums"
                    >
                      {globalBudget != null && globalBudget > 0
                        ? `/ ${formatEuro(globalBudget)}`
                        : '+ Définir plafond'}
                    </button>
                  )}
                </div>
              </div>

              {/* Single Clean Overflow Menu for Exports/Data */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="w-9 h-9 inline-flex items-center justify-center rounded-xl bg-neutral-100/80 hover:bg-neutral-200 text-neutral-600 transition-colors"
                  aria-label="Options d'export et sauvegarde"
                  aria-expanded={menuOpen}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-pink-100 rounded-2xl shadow-xl py-1.5 z-30 text-xs font-semibold text-neutral-700">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onCopySummary();
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-2.5 hover:bg-[#FDF2F8] hover:text-[#BE185D] text-left"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copier le résumé
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onExportCsv();
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-2.5 hover:bg-[#FDF2F8] hover:text-[#BE185D] text-left"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Exporter en CSV
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onExportJson();
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-2.5 hover:bg-[#FDF2F8] hover:text-[#BE185D] text-left"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Sauvegarde JSON
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-2.5 hover:bg-[#FDF2F8] hover:text-[#BE185D] text-left"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Importer JSON
                      </button>
                      <div className="my-1 border-t border-pink-100/70" />
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onResetSamples();
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-2.5 hover:bg-neutral-50 text-left"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Charger exemples
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onClearAll();
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 text-left"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Tout vider
                      </button>
                    </div>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onImportJson(file);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>

            <VisualBudgetBar
              purchased={totalPurchased}
              pending={totalPending}
              budget={globalBudget}
            />
          </div>
        </div>
      </section>

      {/* Per-Person Donut Cards Grid (NO gift list repetition!) */}
      {people.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {people.map((person, index) => (
            <PersonDonutCard
              key={person.id}
              person={person}
              metric={personMetrics[index]}
              giftCount={gifts.filter((g) => g.personId === person.id).length}
              onUpdatePersonBudget={onUpdatePersonBudget}
              onEditPerson={onEditPerson}
              onDeletePerson={onDeletePerson}
              onSharePerson={onSharePerson}
              onOpenPersonGifts={onOpenPersonGifts}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white/95 border border-pink-100 rounded-[28px] p-8 text-center space-y-3 shadow-[0_8px_30px_rgba(219,39,119,0.06)]">
          <p className="font-display text-lg font-bold text-neutral-900">
            Aucune personne ajoutée
          </p>
          <button
            type="button"
            onClick={onAddPerson}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#EC4899] to-[#A855F7] rounded-2xl"
          >
            <Plus className="w-4 h-4" />
            Ajouter une personne
          </button>
        </div>
      )}
    </div>
  );
}
