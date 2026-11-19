'use client';

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Check,
  Gift,
  LogIn,
  LogOut,
  PieChart,
  Plus,
  Share2,
  ShoppingBag,
  UserCheck,
} from 'lucide-react';
import {
  ActiveShareMeta,
  GiftItem,
  GiftPhotoKey,
  INITIAL_SAMPLE_STATE,
  Person,
  SharedWishlist,
  WishlistState,
  WorkspaceTab,
  buildCsvContent,
  buildShoppingSummaryText,
  createId,
  formatEuro,
} from '@/lib/wishlist-types';
import {useIsHydrated, useWishlistStore} from '@/lib/wishlist-store';
import {useAuthSession} from '@/hooks/use-auth';
import {
  saveUserWishlist,
  subscribeUserWishlist,
  syncUserProfileToFirestore,
} from '@/lib/firestore-wishlist';
import {
  ConfirmModal,
  GiftModal,
  PersonModal,
} from '@/components/wishlist-modals';
import {DiscoverView} from '@/components/discover-view';
import {BudgetsView} from '@/components/budgets-view';
import {ShoppingView} from '@/components/shopping-view';
import {ShareModal} from '@/components/share-modal';
import {WelcomeAuthScreen} from '@/components/welcome-auth-screen';
import {PWAInstallButton} from '@/components/pwa-install-button';

export function WishlistApp() {
  const {
    user,
    authLoading,
    guestMode,
    authError,
    signingIn,
    signInWithGoogle,
    enterGuestMode,
    signOutAll,
  } = useAuthSession();

  const [localState, setLocalState] = useWishlistStore();
  const isHydrated = useIsHydrated();

  const [cloudData, setCloudData] = useState<{
    uid: string;
    state: WishlistState;
  } | null>(null);

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('gifts');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [giftModalDefaultPersonId, setGiftModalDefaultPersonId] = useState<
    string | undefined
  >(undefined);
  const [editingGift, setEditingGift] = useState<GiftItem | null>(null);

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareModalPersonId, setShareModalPersonId] = useState<string | null>(
    null
  );

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    destructive: boolean;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    confirmLabel: '',
    destructive: true,
    onConfirm: () => {},
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    void syncUserProfileToFirestore(user).catch((err) => {
      console.error('Profile sync error:', err);
    });

    const unsubscribe = subscribeUserWishlist(
      uid,
      localState,
      (remoteState) => {
        setCloudData({uid, state: remoteState});
      },
      (err) => {
        console.error('Wishlist sync error:', err);
        showToast('Erreur de synchronisation Firebase');
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const isCloudReady = Boolean(user && cloudData?.uid === user.uid);
  const state: WishlistState =
    user && cloudData?.uid === user.uid ? cloudData.state : localState;

  const setState = useCallback(
    (updater: WishlistState | ((prev: WishlistState) => WishlistState)) => {
      if (user) {
        const current =
          cloudData?.uid === user.uid ? cloudData.state : localState;
        const next =
          typeof updater === 'function' ? updater(current) : updater;
        setCloudData({uid: user.uid, state: next});
        void saveUserWishlist(user.uid, next).catch(() => {
          showToast('Erreur sauvegarde Firebase');
        });
      } else {
        setLocalState(updater);
      }
    },
    [user, cloudData, localState, setLocalState, showToast]
  );

  const remainingCount = useMemo(
    () => state.gifts.filter((g) => !g.purchased).length,
    [state.gifts]
  );

  // Show welcome / login / guest-mode screen when neither logged in nor in guest test mode
  if (!authLoading && !user && !guestMode) {
    return (
      <WelcomeAuthScreen
        signingIn={signingIn}
        authError={authError}
        onSignInGoogle={() => void signInWithGoogle()}
        onEnterGuestMode={enterGuestMode}
      />
    );
  }

  const handleSavePerson = (data: {
    name: string;
    relation?: string;
    budgetLimit: number | null;
  }) => {
    if (editingPerson) {
      setState((prev) => ({
        ...prev,
        people: prev.people.map((p) =>
          p.id === editingPerson.id ? {...p, ...data} : p
        ),
      }));
      showToast(`${data.name} mis à jour`);
    } else {
      const newPerson: Person = {
        id: createId('person'),
        name: data.name,
        budgetLimit: data.budgetLimit,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        people: [...prev.people, newPerson],
      }));
      setSelectedPersonId(newPerson.id);
      showToast(`${data.name} ajouté`);
    }
    setEditingPerson(null);
  };

  const handleUpdatePersonBudget = (
    personId: string,
    budgetLimit: number | null
  ) => {
    setState((prev) => ({
      ...prev,
      people: prev.people.map((p) =>
        p.id === personId ? {...p, budgetLimit} : p
      ),
    }));
    showToast(
      budgetLimit != null
        ? `Budget : ${formatEuro(budgetLimit)}`
        : 'Budget retiré'
    );
  };

  const handleRequestDeletePerson = (person: Person) => {
    const giftCount = state.gifts.filter(
      (g) => g.personId === person.id
    ).length;
    setConfirmState({
      open: true,
      title: `Supprimer ${person.name} ?`,
      description:
        giftCount > 0
          ? `${giftCount} ${
              giftCount > 1
                ? 'cadeaux associés seront supprimés'
                : 'cadeau associé sera supprimé'
            }.`
          : 'Cette personne sera retirée de la liste.',
      confirmLabel: 'Supprimer',
      destructive: true,
      onConfirm: () => {
        setState((prev) => ({
          ...prev,
          people: prev.people.filter((p) => p.id !== person.id),
          gifts: prev.gifts.filter((g) => g.personId !== person.id),
        }));
        if (selectedPersonId === person.id) {
          setSelectedPersonId(null);
        }
        showToast(`${person.name} supprimé`);
      },
    });
  };

  const handleSaveGiftModal = (data: {
    personId: string;
    title: string;
    price: number;
    url?: string;
    note?: string;
    photoKey?: GiftPhotoKey;
    purchased: boolean;
  }) => {
    if (editingGift) {
      setState((prev) => ({
        ...prev,
        gifts: prev.gifts.map((g) =>
          g.id === editingGift.id ? {...g, ...data} : g
        ),
      }));
      showToast('Cadeau mis à jour');
    } else {
      const newGift: GiftItem = {
        id: createId('gift'),
        ...data,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        gifts: [...prev.gifts, newGift],
      }));
      showToast('Cadeau ajouté');
    }
    setEditingGift(null);
  };

  const handleTogglePurchased = (giftId: string) => {
    setState((prev) => ({
      ...prev,
      gifts: prev.gifts.map((g) =>
        g.id === giftId ? {...g, purchased: !g.purchased} : g
      ),
    }));
  };

  const handleDeleteGift = (giftId: string) => {
    setState((prev) => ({
      ...prev,
      gifts: prev.gifts.filter((g) => g.id !== giftId),
    }));
    showToast('Cadeau supprimé');
  };

  const handleOpenGiftModal = (personId?: string, gift?: GiftItem) => {
    setEditingGift(gift ?? null);
    setGiftModalDefaultPersonId(personId);
    setGiftModalOpen(true);
  };

  const handleUpdateGlobalBudget = (budget: number | null) => {
    setState((prev) => ({...prev, globalBudget: budget}));
    showToast(
      budget != null
        ? `Budget global : ${formatEuro(budget)}`
        : 'Budget global retiré'
    );
  };

  const handleShareSaved = (meta: ActiveShareMeta) => {
    setState((prev) => {
      const existing = prev.activeShares ?? [];
      const filtered = existing.filter((s) => s.id !== meta.id);
      return {...prev, activeShares: [meta, ...filtered]};
    });
  };

  const handleSyncFromServer = (share: SharedWishlist) => {
    const purchasedMap = new Map(share.gifts.map((g) => [g.id, g.purchased]));
    setState((prev) => ({
      ...prev,
      gifts: prev.gifts.map((g) =>
        purchasedMap.has(g.id)
          ? {...g, purchased: Boolean(purchasedMap.get(g.id))}
          : g
      ),
    }));
  };

  const handleCopySummary = async () => {
    const text = buildShoppingSummaryText(state);
    try {
      await navigator.clipboard.writeText(text);
      showToast('Résumé copié');
    } catch {
      showToast('Copie impossible');
    }
  };

  const handleExportCsv = () => {
    const csv = buildCsvContent(state);
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'christmaslist.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('CSV téléchargé');
  };

  const handleExportJson = () => {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sauvegarde-christmaslist.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('JSON téléchargé');
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<WishlistState>;
        if (!Array.isArray(parsed.people) || !Array.isArray(parsed.gifts)) {
          showToast('Fichier invalide');
          return;
        }
        setState({
          globalBudget:
            typeof parsed.globalBudget === 'number'
              ? parsed.globalBudget
              : null,
          people: parsed.people,
          gifts: parsed.gifts,
          activeShares: Array.isArray(parsed.activeShares)
            ? parsed.activeShares
            : [],
        });
        setSelectedPersonId(null);
        showToast('Liste importée');
      } catch {
        showToast('Erreur de lecture');
      }
    };
    reader.readAsText(file);
  };

  const handleResetSamples = () => {
    setConfirmState({
      open: true,
      title: 'Charger les exemples ?',
      description: 'La liste actuelle sera remplacée par les exemples.',
      confirmLabel: 'Charger',
      destructive: false,
      onConfirm: () => {
        setState(INITIAL_SAMPLE_STATE);
        setSelectedPersonId(null);
        showToast('Exemples chargés');
      },
    });
  };

  const handleClearAll = () => {
    setConfirmState({
      open: true,
      title: 'Tout supprimer ?',
      description: 'Toutes les personnes et cadeaux seront effacés.',
      confirmLabel: 'Tout vider',
      destructive: true,
      onConfirm: () => {
        setState({
          globalBudget: null,
          people: [],
          gifts: [],
          activeShares: [],
        });
        setSelectedPersonId(null);
        showToast('Liste vidée');
      },
    });
  };

  const showSkeleton = !isHydrated || authLoading || (Boolean(user) && !isCloudReady);
  const userFirstName = user?.displayName?.split(' ')[0] ?? 'Compte';

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-10 overflow-x-hidden">
      {/* Top Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100/80 md:sticky md:top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-3 md:gap-8">
          <button
            type="button"
            onClick={() => {
              setActiveTab('gifts');
              setSelectedPersonId(null);
            }}
            className="inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#A855F7] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(236,72,153,0.3)]">
              <Gift className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </span>
            <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-[#DB2777] to-[#9333EA] bg-clip-text text-transparent">
              ChristmasList
            </span>
          </button>

          {/* 3 Clear, Distinct Tabs */}
          <nav
            className="hidden md:flex items-center gap-8 h-full"
            aria-label="Navigation principale"
          >
            {(
              [
                {key: 'gifts', label: 'Cadeaux'},
                {
                  key: 'shopping',
                  label:
                    remainingCount > 0
                      ? `À acheter (${remainingCount})`
                      : 'À acheter',
                },
                {key: 'budgets', label: 'Budgets'},
              ] as const
            ).map((item) => {
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  className={`h-full inline-flex items-center text-sm font-bold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-[#EC4899] text-[#DB2777]'
                      : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Account / Guest Switcher + Add Person */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((o) => !o)}
                className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FDF2F8] hover:bg-[#FCE7F3] text-xs font-semibold text-[#BE185D] transition-colors whitespace-nowrap"
                aria-expanded={accountMenuOpen}
                aria-label="Compte et installation"
              >
                {user ? (
                  <>
                    <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#EC4899] to-[#A855F7] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {userFirstName.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden sm:inline max-w-[90px] truncate">
                      {userFirstName}
                    </span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Invité</span>
                  </>
                )}
              </button>

              {accountMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-60 bg-white border border-pink-100 rounded-2xl shadow-xl py-2 z-30 text-xs">
                    {user ? (
                      <>
                        <div className="px-4 py-2 border-b border-pink-100/70">
                          <div className="font-bold text-neutral-900 truncate">
                            {user.displayName ?? 'Utilisateur Google'}
                          </div>
                          <div className="text-[11px] text-neutral-500 truncate">
                            {user.email}
                          </div>
                          <div className="mt-1 text-[10px] font-semibold text-emerald-600">
                            Synchronisé sur Firebase
                          </div>
                        </div>
                        <PWAInstallButton variant="menu-item" />
                        <button
                          type="button"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            void signOutAll();
                          }}
                          className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 font-semibold text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Se déconnecter
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-2 border-b border-pink-100/70">
                          <div className="font-bold text-neutral-900">
                            Mode test invité
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            Sauvegarde locale sur cet appareil
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            void signInWithGoogle();
                          }}
                          className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-[#DB2777] hover:bg-[#FDF2F8] font-semibold text-left"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          Connexion Google (Gmail)
                        </button>
                        <PWAInstallButton variant="menu-item" />
                        <button
                          type="button"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            void signOutAll();
                          }}
                          className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-neutral-500 hover:bg-neutral-50 font-semibold text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Écran d&apos;accueil
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingPerson(null);
                setPersonModalOpen(true);
              }}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#EC4899] to-[#A855F7] rounded-2xl shadow-[0_4px_14px_rgba(236,72,153,0.28)] hover:opacity-95 active:scale-[0.97] transition-all whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Personne</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {showSkeleton ? (
          <div className="space-y-5">
            <div className="h-56 bg-white/80 border border-pink-100 rounded-[28px] animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="h-64 bg-white/80 border border-pink-100 rounded-[28px] animate-pulse" />
              <div className="h-64 bg-white/80 border border-pink-100 rounded-[28px] animate-pulse" />
              <div className="h-64 bg-white/80 border border-pink-100 rounded-[28px] animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'gifts' && (
              <DiscoverView
                globalBudget={state.globalBudget}
                people={state.people}
                gifts={state.gifts}
                selectedPersonId={selectedPersonId}
                onSelectPerson={setSelectedPersonId}
                onTogglePurchased={handleTogglePurchased}
                onOpenGiftModal={handleOpenGiftModal}
                onDeleteGift={handleDeleteGift}
                onOpenPersonModal={() => {
                  setEditingPerson(null);
                  setPersonModalOpen(true);
                }}
                onDeletePerson={handleRequestDeletePerson}
                onOpenShareModal={() => {
                  setShareModalPersonId(selectedPersonId);
                  setShareModalOpen(true);
                }}
              />
            )}

            {activeTab === 'shopping' && (
              <ShoppingView
                people={state.people}
                gifts={state.gifts}
                onTogglePurchased={handleTogglePurchased}
              />
            )}

            {activeTab === 'budgets' && (
              <BudgetsView
                globalBudget={state.globalBudget}
                people={state.people}
                gifts={state.gifts}
                onUpdateGlobalBudget={handleUpdateGlobalBudget}
                onUpdatePersonBudget={handleUpdatePersonBudget}
                onAddPerson={() => {
                  setEditingPerson(null);
                  setPersonModalOpen(true);
                }}
                onEditPerson={(p) => {
                  setEditingPerson(p);
                  setPersonModalOpen(true);
                }}
                onDeletePerson={handleRequestDeletePerson}
                onSharePerson={(pid) => {
                  setShareModalPersonId(pid);
                  setShareModalOpen(true);
                }}
                onOpenPersonGifts={(pid) => {
                  setSelectedPersonId(pid);
                  setActiveTab('gifts');
                }}
                onExportCsv={handleExportCsv}
                onExportJson={handleExportJson}
                onImportJson={handleImportJson}
                onCopySummary={handleCopySummary}
                onResetSamples={handleResetSamples}
                onClearAll={handleClearAll}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Navigation mobile"
        className="md:hidden fixed bottom-3 inset-x-4 z-40 h-14 bg-white/95 backdrop-blur-md border border-pink-100 rounded-2xl shadow-[0_8px_30px_rgba(219,39,119,0.14)] grid grid-cols-4 items-center px-1"
      >
        <button
          type="button"
          onClick={() => setActiveTab('gifts')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeTab === 'gifts' ? 'text-[#DB2777]' : 'text-neutral-400'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span className="text-[10px] font-bold">Cadeaux</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shopping')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeTab === 'shopping' ? 'text-[#DB2777]' : 'text-neutral-400'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-[10px] font-bold tabular-nums">
            À acheter{remainingCount > 0 ? ` (${remainingCount})` : ''}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('budgets')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeTab === 'budgets' ? 'text-[#DB2777]' : 'text-neutral-400'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span className="text-[10px] font-bold">Budgets</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShareModalPersonId(selectedPersonId);
            setShareModalOpen(true);
          }}
          className="h-full flex flex-col items-center justify-center gap-0.5 text-neutral-500 active:text-[#DB2777] transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-[10px] font-bold">Partager</span>
        </button>
      </nav>

      {/* Modals */}
      <PersonModal
        open={personModalOpen}
        initialPerson={editingPerson}
        onClose={() => {
          setPersonModalOpen(false);
          setEditingPerson(null);
        }}
        onSave={handleSavePerson}
      />

      <GiftModal
        open={giftModalOpen}
        people={state.people}
        defaultPersonId={giftModalDefaultPersonId}
        initialGift={editingGift}
        onClose={() => {
          setGiftModalOpen(false);
          setEditingGift(null);
        }}
        onSave={handleSaveGiftModal}
      />

      <ShareModal
        open={shareModalOpen}
        userId={user?.uid ?? null}
        initialPersonId={shareModalPersonId}
        people={state.people}
        gifts={state.gifts}
        activeShares={state.activeShares ?? []}
        onClose={() => setShareModalOpen(false)}
        onShareSaved={handleShareSaved}
        onSyncFromServer={handleSyncFromServer}
        onToast={showToast}
      />

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        destructive={confirmState.destructive}
        onCancel={() => setConfirmState((prev) => ({...prev, open: false}))}
        onConfirm={confirmState.onConfirm}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 px-4 py-2.5 bg-gradient-to-r from-[#DB2777] to-[#9333EA] text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-lg flex items-center gap-2"
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
