'use client';

import React from 'react';
import Image from 'next/image';
import {ArrowRight, Gift, UserCheck} from 'lucide-react';
import {HERO_PRESENT_IMAGE} from '@/lib/gift-photos';
import {PWAInstallButton} from '@/components/pwa-install-button';

interface WelcomeAuthScreenProps {
  signingIn: boolean;
  authError: string | null;
  onSignInGoogle: () => void;
  onEnterGuestMode: () => void;
}

export function WelcomeAuthScreen({
  signingIn,
  authError,
  onSignInGoogle,
  onEnterGuestMode,
}: WelcomeAuthScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#FFF5F9] via-[#FDFBFF] to-[#F3EFFE]">
      <div className="w-full max-w-md bg-white/95 border border-pink-100 rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(219,39,119,0.14)]">
        {/* Visual Hero Header */}
        <div className="relative h-56 flex flex-col items-center justify-center p-6 text-center">
          <Image
            src={HERO_PRESENT_IMAGE}
            alt="Coffret cadeau rose ChristmasList"
            priority
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#3A102B]/70 via-[#54193E]/75 to-[#3A102B]/90" />

          <div className="relative z-10 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#EC4899] to-[#A855F7] text-white flex items-center justify-center mx-auto shadow-[0_10px_28px_rgba(236,72,153,0.45)] ring-4 ring-white/25">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">
                ChristmasList
              </h1>
              <p className="mt-1 text-xs font-medium text-pink-100/90">
                Cadeaux, budgets & partage en un lien
              </p>
            </div>
          </div>
        </div>

        {/* Auth & Guest Mode Actions */}
        <div className="p-6 sm:p-7 space-y-3.5">
          <button
            type="button"
            disabled={signingIn}
            onClick={onSignInGoogle}
            className="w-full min-h-[48px] px-5 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-[#EC4899] to-[#A855F7] shadow-[0_6px_20px_rgba(236,72,153,0.32)] hover:opacity-95 active:scale-[0.98] disabled:opacity-60 transition-all flex items-center justify-center gap-2.5"
          >
            <span>
              {signingIn
                ? 'Connexion en cours...'
                : 'Continuer avec Google (Gmail)'}
            </span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>

          <button
            type="button"
            onClick={onEnterGuestMode}
            className="w-full min-h-[46px] px-5 py-2.5 rounded-2xl text-sm font-semibold text-[#BE185D] bg-[#FDF2F8] hover:bg-[#FCE7F3] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>Mode test invité (sans connexion)</span>
          </button>

          {authError && (
            <p
              role="alert"
              className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 leading-relaxed"
            >
              {authError}
            </p>
          )}

          <div className="pt-2 flex items-center justify-center">
            <PWAInstallButton />
          </div>
        </div>
      </div>
    </div>
  );
}
