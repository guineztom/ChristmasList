'use client';

import React, {useEffect, useMemo, useState} from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  RefreshCw,
  Share2,
  X,
} from 'lucide-react';
import {motion} from 'motion/react';
import {
  ActiveShareMeta,
  GiftItem,
  Person,
  SharedWishlist,
  createId,
} from '@/lib/wishlist-types';
import {
  getFirestoreShare,
  upsertFirestoreShare,
} from '@/lib/firestore-wishlist';

interface ShareModalProps {
  open: boolean;
  userId?: string | null;
  initialPersonId?: string | null;
  people: Person[];
  gifts: GiftItem[];
  activeShares: ActiveShareMeta[];
  onClose: () => void;
  onShareSaved: (meta: ActiveShareMeta) => void;
  onSyncFromServer: (share: SharedWishlist) => void;
  onToast: (msg: string) => void;
}

export function ShareModal(props: ShareModalProps) {
  if (!props.open) return null;
  return (
    <ShareModalBody
      key={`${props.userId ?? 'guest'}-${props.initialPersonId ?? 'share-all'}`}
      userId={props.userId}
      initialPersonId={props.initialPersonId}
      people={props.people}
      gifts={props.gifts}
      activeShares={props.activeShares}
      onClose={props.onClose}
      onShareSaved={props.onShareSaved}
      onSyncFromServer={props.onSyncFromServer}
      onToast={props.onToast}
    />
  );
}

function ShareModalBody({
  userId,
  initialPersonId,
  people,
  gifts,
  activeShares,
  onClose,
  onShareSaved,
  onSyncFromServer,
  onToast,
}: Omit<ShareModalProps, 'open'>) {
  const [scope, setScope] = useState<'all' | 'person'>(
    initialPersonId ? 'person' : 'all'
  );
  const [personId, setPersonId] = useState<string>(
    initialPersonId ?? people[0]?.id ?? ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const matchingExistingShare = useMemo(() => {
    return activeShares.find((s) =>
      scope === 'all'
        ? s.scope === 'all'
        : s.scope === 'person' && s.personId === personId
    );
  }, [activeShares, scope, personId]);

  const [generatedShareId, setGeneratedShareId] = useState<string | null>(
    matchingExistingShare?.id ?? null
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const activeShareId = generatedShareId ?? matchingExistingShare?.id ?? null;

  const shareUrl = useMemo(() => {
    if (!activeShareId || typeof window === 'undefined') return '';
    return `${window.location.origin}/share/${activeShareId}`;
  }, [activeShareId]);

  const selectedPerson = people.find((p) => p.id === personId);
  const shareTitle =
    scope === 'person' && selectedPerson
      ? `Liste de ${selectedPerson.name}`
      : 'Ma liste de Noël';

  const handleGenerateOrUpdateLink = async () => {
    setError('');
    const targetPeople =
      scope === 'person'
        ? people.filter((p) => p.id === personId)
        : people;

    if (targetPeople.length === 0) {
      setError('Ajoutez une personne avant de partager.');
      return;
    }

    const allowedIds = new Set(targetPeople.map((p) => p.id));
    const targetGifts = gifts.filter((g) => allowedIds.has(g.personId));

    setIsSubmitting(true);
    try {
      if (userId) {
        const shareId = activeShareId ?? createId('share');
        const saved = await upsertFirestoreShare({
          shareId,
          ownerUid: userId,
          title: shareTitle,
          scope,
          personId: scope === 'person' ? personId : undefined,
          people: targetPeople,
          gifts: targetGifts,
        });

        setGeneratedShareId(saved.id);
        onShareSaved({
          id: saved.id,
          title: saved.title,
          scope: saved.scope,
          personId: saved.personId,
          updatedAt: saved.updatedAt,
        });
        onToast(activeShareId ? 'Lien mis à jour' : 'Lien créé');
      } else {
        const res = await fetch('/api/shares', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            shareId: activeShareId ?? undefined,
            title: shareTitle,
            scope,
            personId: scope === 'person' ? personId : undefined,
            people: targetPeople,
            gifts: targetGifts,
          }),
        });

        const payload = (await res.json()) as {
          share?: SharedWishlist;
          error?: string;
        };

        if (!res.ok || !payload.share) {
          setError(payload.error ?? 'Impossible de créer le lien.');
          return;
        }

        setGeneratedShareId(payload.share.id);
        onShareSaved({
          id: payload.share.id,
          title: payload.share.title,
          scope: payload.share.scope,
          personId: payload.share.personId,
          updatedAt: payload.share.updatedAt,
        });
        onToast(activeShareId ? 'Lien mis à jour' : 'Lien créé');
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      onToast('Lien copié');
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      onToast('Copie impossible');
    }
  };

  const handleSyncPurchases = async () => {
    if (!activeShareId) return;
    setIsSyncing(true);
    setError('');
    try {
      if (userId) {
        const remote = await getFirestoreShare(activeShareId);
        if (!remote) {
          setError('Lien introuvable.');
          return;
        }
        onSyncFromServer(remote);
        onToast('Achats synchronisés');
      } else {
        const res = await fetch(`/api/shares/${activeShareId}`);
        const payload = (await res.json()) as {
          share?: SharedWishlist;
          error?: string;
        };
        if (!res.ok || !payload.share) {
          setError(payload.error ?? 'Lien introuvable.');
          return;
        }
        onSyncFromServer(payload.share);
        onToast('Achats synchronisés');
      }
    } catch {
      setError('Synchronisation impossible.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2E1025]/35 backdrop-blur-xs sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
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
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FDF2F8] text-[#DB2777] flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="share-modal-title"
                className="font-display text-lg font-bold tracking-tight text-neutral-900"
              >
                Partager par lien
              </h2>
              <p className="text-xs text-neutral-500">
                Lecture seule · Achat cochable
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl bg-neutral-100/70 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#FDF2F8] rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setScope('all');
                setGeneratedShareId(null);
              }}
              className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
                scope === 'all'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Toute la liste
            </button>
            <button
              type="button"
              onClick={() => {
                setScope('person');
                setGeneratedShareId(null);
              }}
              disabled={people.length === 0}
              className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all disabled:opacity-40 ${
                scope === 'person'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Une personne
            </button>
          </div>

          {scope === 'person' && people.length > 0 && (
            <select
              value={personId}
              onChange={(e) => {
                setPersonId(e.target.value);
                setGeneratedShareId(null);
              }}
              aria-label="Personne à partager"
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-neutral-50 border border-pink-100 rounded-2xl text-neutral-900 focus:bg-white focus:border-[#EC4899] focus:outline-none"
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleGenerateOrUpdateLink}
            disabled={isSubmitting || people.length === 0}
            className="w-full h-11 inline-flex items-center justify-center gap-2 px-4 text-sm font-semibold text-white bg-gradient-to-r from-[#EC4899] to-[#A855F7] rounded-2xl shadow-[0_4px_14px_rgba(236,72,153,0.3)] hover:opacity-95 disabled:opacity-50 transition-opacity"
          >
            <Link2 className="w-4 h-4" />
            {isSubmitting
              ? 'Génération...'
              : activeShareId
              ? 'Mettre à jour le lien'
              : 'Générer le lien'}
          </button>

          {error && (
            <p className="text-xs font-semibold text-rose-600" role="alert">
              {error}
            </p>
          )}

          {activeShareId && shareUrl && (
            <div className="pt-4 border-t border-pink-100/80 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  aria-label="Lien de partage"
                  className="flex-1 min-w-0 px-3 py-2.5 text-xs font-sans font-medium bg-neutral-50 border border-pink-100 rounded-2xl text-neutral-700 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#EC4899] to-[#A855F7] rounded-2xl hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copier
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSyncPurchases}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FDF2F8] text-xs font-semibold text-[#BE185D] hover:bg-[#FCE7F3] transition-colors"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
                  />
                  Actualiser les achats
                </button>

                <a
                  href={`/share/${activeShareId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#DB2777] hover:underline"
                >
                  Ouvrir
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
