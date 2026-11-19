'use client';

import React, {useState} from 'react';
import {Download, Share, Smartphone, X} from 'lucide-react';
import {usePWAInstall} from '@/hooks/use-pwa-install';

export function PWAInstallButton({
  className = '',
  variant = 'pill',
}: {
  className?: string;
  variant?: 'pill' | 'menu-item';
}) {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;
  if (!isInstallable && !isIOS) return null;

  const handleClick = () => {
    if (isInstallable) {
      void install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'menu-item' ? (
        <button
          type="button"
          onClick={handleClick}
          className={`w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-[#FDF2F8] hover:text-[#BE185D] text-left text-xs font-semibold text-neutral-700 ${className}`}
        >
          {isIOS ? (
            <Smartphone className="w-3.5 h-3.5" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>{isIOS ? 'Installer sur iPhone' : "Installer l'app"}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FDF2F8] hover:bg-[#FCE7F3] text-xs font-semibold text-[#BE185D] transition-colors whitespace-nowrap ${className}`}
        >
          {isIOS ? (
            <Smartphone className="w-3.5 h-3.5" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>{isIOS ? 'App iPhone' : 'Installer'}</span>
        </button>
      )}

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2E1025]/40 backdrop-blur-xs sm:p-4"
          onClick={() => setShowIOSGuide(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-pwa-title"
        >
          <div
            className="w-full sm:max-w-sm bg-white border border-pink-100 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3
                id="ios-pwa-title"
                className="font-display text-lg font-bold text-neutral-900"
              >
                Installer sur iPhone
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-9 h-9 inline-flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-500"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-neutral-600">
              <p className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#FDF2F8] text-[#DB2777] font-display font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Ouvrez ce site dans <strong>Safari</strong> puis touchez
                  l&apos;icône{' '}
                  <Share className="inline w-4 h-4 text-[#DB2777] mx-0.5" />{' '}
                  <strong>Partager</strong> en bas de l&apos;écran.
                </span>
              </p>
              <p className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#FDF2F8] text-[#DB2777] font-display font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Faites défiler et choisissez{' '}
                  <strong>Sur l&apos;écran d&apos;accueil</strong>.
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full min-h-[44px] py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#EC4899] to-[#A855F7] rounded-2xl"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
