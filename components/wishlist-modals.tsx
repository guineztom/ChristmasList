'use client';

import React, {useEffect, useState} from 'react';
import Image from 'next/image';
import {X, AlertTriangle} from 'lucide-react';
import {motion} from 'motion/react';
import {
  GiftItem,
  GiftPhotoKey,
  Person,
  normalizeUrl,
  parsePriceInput,
} from '@/lib/wishlist-types';
import {GIFT_PHOTO_OPTIONS} from '@/lib/gift-photos';

interface PersonModalProps {
  open: boolean;
  initialPerson?: Person | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    relation?: string;
    budgetLimit: number | null;
  }) => void;
}

export function PersonModal(props: PersonModalProps) {
  if (!props.open) return null;
  return (
    <PersonModalBody
      key={props.initialPerson?.id ?? 'new-person'}
      initialPerson={props.initialPerson}
      onClose={props.onClose}
      onSave={props.onSave}
    />
  );
}

function PersonModalBody({
  initialPerson,
  onClose,
  onSave,
}: Omit<PersonModalProps, 'open'>) {
  const [name, setName] = useState(initialPerson?.name ?? '');
  const [budgetStr, setBudgetStr] = useState(
    initialPerson?.budgetLimit != null ? String(initialPerson.budgetLimit) : ''
  );
  const [error, setError] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Veuillez saisir un prénom.');
      return;
    }

    let budgetLimit: number | null = null;
    if (budgetStr.trim() !== '') {
      const parsed = parsePriceInput(budgetStr);
      if (parsed < 0) {
        setError('Le budget doit être positif.');
        return;
      }
      budgetLimit = parsed > 0 ? parsed : null;
    }

    onSave({
      name: trimmedName,
      budgetLimit,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2E1025]/35 backdrop-blur-xs sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-modal-title"
    >
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.18, ease: [0.16, 1, 0.3, 1]}}
        className="w-full sm:max-w-md bg-white border border-pink-100 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-pink-200" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-pink-100/80">
          <h2
            id="person-modal-title"
            className="font-display text-lg font-bold tracking-tight text-neutral-900"
          >
            {initialPerson ? 'Modifier' : 'Nouvelle personne'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-neutral-400 hover:text-neutral-800 rounded-xl bg-neutral-100/70 hover:bg-neutral-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="person-name"
              className="block text-xs font-semibold text-neutral-700 mb-1.5"
            >
              Prénom <span className="text-[#DB2777]">*</span>
            </label>
            <input
              id="person-name"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ex. Camille, Papa..."
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-neutral-50 border border-pink-100 rounded-2xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-[#EC4899] focus:outline-none"
              maxLength={60}
            />
          </div>

          <div>
            <label
              htmlFor="person-budget"
              className="block text-xs font-semibold text-neutral-700 mb-1.5"
            >
              Budget (€)
            </label>
            <input
              id="person-budget"
              type="text"
              inputMode="decimal"
              value={budgetStr}
              onChange={(e) => setBudgetStr(e.target.value)}
              placeholder="150"
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm font-display font-bold tabular-nums bg-neutral-50 border border-pink-100 rounded-2xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-[#EC4899] focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-sm font-semibold text-neutral-700 bg-neutral-100 rounded-2xl hover:bg-neutral-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#EC4899] to-[#A855F7] rounded-2xl shadow-[0_4px_14px_rgba(236,72,153,0.3)] hover:opacity-95 transition-opacity"
            >
              {initialPerson ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

interface GiftModalProps {
  open: boolean;
  people: Person[];
  defaultPersonId?: string;
  initialGift?: GiftItem | null;
  onClose: () => void;
  onSave: (data: {
    personId: string;
    title: string;
    price: number;
    url?: string;
    note?: string;
    photoKey?: GiftPhotoKey;
    purchased: boolean;
  }) => void;
}

export function GiftModal(props: GiftModalProps) {
  if (!props.open) return null;
  return (
    <GiftModalBody
      key={props.initialGift?.id ?? `new-gift-${props.defaultPersonId ?? 'any'}`}
      people={props.people}
      defaultPersonId={props.defaultPersonId}
      initialGift={props.initialGift}
      onClose={props.onClose}
      onSave={props.onSave}
    />
  );
}

function GiftModalBody({
  people,
  defaultPersonId,
  initialGift,
  onClose,
  onSave,
}: Omit<GiftModalProps, 'open'>) {
  const [personId, setPersonId] = useState(
    initialGift?.personId ?? defaultPersonId ?? people[0]?.id ?? ''
  );
  const [title, setTitle] = useState(initialGift?.title ?? '');
  const [priceStr, setPriceStr] = useState(
    initialGift != null ? String(initialGift.price).replace('.', ',') : ''
  );
  const [url, setUrl] = useState(initialGift?.url ?? '');
  const [note, setNote] = useState(initialGift?.note ?? '');
  const [photoKey, setPhotoKey] = useState<GiftPhotoKey | undefined>(
    initialGift?.photoKey
  );
  const [purchased, setPurchased] = useState(initialGift?.purchased ?? false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId) {
      setError('Veuillez choisir un destinataire.');
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Veuillez indiquer le nom du cadeau.');
      return;
    }

    const price = priceStr.trim() ? parsePriceInput(priceStr) : 0;
    let normalizedUrl: string | undefined = undefined;
    if (url.trim()) {
      normalizedUrl = normalizeUrl(url);
      if (!normalizedUrl) {
        setError('URL invalide (ex. https://...).');
        return;
      }
    }

    onSave({
      personId,
      title: trimmedTitle,
      price,
      url: normalizedUrl,
      note: note.trim() || undefined,
      photoKey,
      purchased,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2E1025]/35 backdrop-blur-xs sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-modal-title"
    >
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.18, ease: [0.16, 1, 0.3, 1]}}
        className="w-full sm:max-w-lg bg-white border border-pink-100 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-pink-200" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-pink-100/80">
          <h2
            id="gift-modal-title"
            className="font-display text-lg font-bold tracking-tight text-neutral-900"
          >
            {initialGift ? 'Modifier le cadeau' : 'Nouveau cadeau'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-neutral-400 hover:text-neutral-800 rounded-xl bg-neutral-100/70 hover:bg-neutral-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="gift-person"
                className="block text-xs font-semibold text-neutral-700 mb-1.5"
              >
                Pour qui <span className="text-[#DB2777]">*</span>
              </label>
              <select
                id="gift-person"
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-neutral-50 border border-pink-100 rounded-2xl text-neutral-900 focus:bg-white focus:border-[#EC4899] focus:outline-none"
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="gift-price"
                className="block text-xs font-semibold text-neutral-700 mb-1.5"
              >
                Prix (€)
              </label>
              <input
                id="gift-price"
                type="text"
                inputMode="decimal"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                placeholder="49,90"
                className="w-full min-h-[44px] px-3.5 py-2.5 text-sm font-display font-bold tabular-nums bg-neutral-50 border border-pink-100 rounded-2xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-[#EC4899] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="gift-title"
              className="block text-xs font-semibold text-neutral-700 mb-1.5"
            >
              Nom du cadeau <span className="text-[#DB2777]">*</span>
            </label>
            <input
              id="gift-title"
              type="text"
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ex. Écharpe en laine, Casque audio..."
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-neutral-50 border border-pink-100 rounded-2xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-[#EC4899] focus:outline-none"
              maxLength={140}
            />
          </div>

          <div>
            <label
              htmlFor="gift-url"
              className="block text-xs font-semibold text-neutral-700 mb-1.5"
            >
              Lien vers l&apos;article
            </label>
            <input
              id="gift-url"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError('');
              }}
              placeholder="https://..."
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-neutral-50 border border-pink-100 rounded-2xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-[#EC4899] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="gift-note"
              className="block text-xs font-semibold text-neutral-700 mb-1.5"
            >
              Précisions (taille, couleur...)
            </label>
            <input
              id="gift-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex. Taille M, rose poudré"
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-neutral-50 border border-pink-100 rounded-2xl text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-[#EC4899] focus:outline-none"
              maxLength={120}
            />
          </div>

          {/* Photo Illustration Picker */}
          <div>
            <span className="block text-xs font-semibold text-neutral-700 mb-2">
              Illustration de la carte
            </span>
            <div className="grid grid-cols-4 gap-2">
              {GIFT_PHOTO_OPTIONS.map((opt) => {
                const selected = photoKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() =>
                      setPhotoKey(selected ? undefined : opt.key)
                    }
                    className={`p-1.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                      selected
                        ? 'border-[#EC4899] bg-[#FDF2F8]'
                        : 'border-transparent bg-neutral-50 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden relative">
                      <Image
                        src={opt.image}
                        alt={opt.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-600 truncate w-full text-center">
                      {opt.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-3 pt-1 cursor-pointer select-none min-h-[40px]">
            <input
              type="checkbox"
              checked={purchased}
              onChange={(e) => setPurchased(e.target.checked)}
              className="w-4 h-4 rounded border-pink-300 text-[#EC4899] focus:ring-[#EC4899]"
            />
            <span className="text-sm font-semibold text-neutral-800">
              Déjà acheté
            </span>
          </label>

          {error && (
            <p className="text-xs font-semibold text-rose-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-sm font-semibold text-neutral-700 bg-neutral-100 rounded-2xl hover:bg-neutral-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#EC4899] to-[#A855F7] rounded-2xl shadow-[0_4px_14px_rgba(236,72,153,0.3)] hover:opacity-95 transition-opacity"
            >
              {initialGift ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  destructive = true,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2E1025]/35 backdrop-blur-xs sm:p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <motion.div
        initial={{opacity: 0, y: 16}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.16, ease: [0.16, 1, 0.3, 1]}}
        className="w-full sm:max-w-md bg-white border border-pink-100 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-[#FDF2F8] text-[#DB2777] shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="confirm-modal-title"
              className="font-display text-lg font-bold tracking-tight text-neutral-900"
            >
              {title}
            </h3>
            <p className="mt-1 text-sm text-neutral-600 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-4 py-2 text-sm font-semibold text-neutral-700 bg-neutral-100 rounded-2xl hover:bg-neutral-200 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`min-h-[44px] px-4 py-2 text-sm font-semibold text-white rounded-2xl transition-opacity ${
              destructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-gradient-to-r from-[#EC4899] to-[#A855F7] hover:opacity-95'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
