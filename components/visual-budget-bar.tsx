'use client';

import React from 'react';
import {formatEuro} from '@/lib/wishlist-types';

interface VisualBudgetBarProps {
  purchased: number;
  pending: number;
  budget: number | null | undefined;
  compact?: boolean;
}

export function VisualBudgetBar({
  purchased,
  pending,
  budget,
  compact = false,
}: VisualBudgetBarProps) {
  const total = purchased + pending;
  const hasBudget = budget != null && budget > 0;
  const ceiling = budget ?? 0;
  const overBudget = hasBudget && total > ceiling;
  const margin = hasBudget ? Math.max(0, ceiling - total) : 0;
  const excess = hasBudget ? Math.max(0, total - ceiling) : 0;

  const scaleBase = hasBudget ? Math.max(ceiling, total, 1) : Math.max(total, 1);

  const boughtPct = Math.min(100, (purchased / scaleBase) * 100);
  const withinBudgetPending = hasBudget
    ? Math.max(0, Math.min(pending, Math.max(0, ceiling - purchased)))
    : pending;
  const pendingPct = Math.min(
    100 - boughtPct,
    (withinBudgetPending / scaleBase) * 100
  );
  const excessPct =
    overBudget && excess > 0
      ? Math.min(100 - boughtPct - pendingPct, (excess / scaleBase) * 100)
      : 0;

  return (
    <div className="space-y-2.5">
      {/* Multi-segment visual bar */}
      <div
        className={`${
          compact ? 'h-3' : 'h-4'
        } w-full rounded-full bg-[#FCE7F3]/60 border border-pink-100 p-0.5 flex items-center gap-0.5 overflow-hidden`}
        role="img"
        aria-label={`Acheté ${formatEuro(purchased)}, à acheter ${formatEuro(
          pending
        )}${hasBudget ? `, budget ${formatEuro(ceiling)}` : ''}`}
      >
        {boughtPct > 0 && (
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-300"
            style={{width: `${boughtPct}%`}}
            title={`Acheté : ${formatEuro(purchased)}`}
          />
        )}
        {pendingPct > 0 && (
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#EC4899] to-[#A855F7] transition-all duration-300"
            style={{width: `${pendingPct}%`}}
            title={`À acheter : ${formatEuro(withinBudgetPending)}`}
          />
        )}
        {excessPct > 0 && (
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-300"
            style={{width: `${excessPct}%`}}
            title={`Dépassement : ${formatEuro(excess)}`}
          />
        )}
      </div>

      {/* Color-coded compact visual legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold tabular-nums">
        <span className="inline-flex items-center gap-1.5 text-neutral-700">
          <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-emerald-400 to-teal-500 shrink-0" />
          <span>Acheté</span>
          <span className="font-display font-bold text-neutral-900">
            {formatEuro(purchased)}
          </span>
        </span>

        <span className="inline-flex items-center gap-1.5 text-neutral-700">
          <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-[#EC4899] to-[#A855F7] shrink-0" />
          <span>À acheter</span>
          <span className="font-display font-bold text-neutral-900">
            {formatEuro(pending)}
          </span>
        </span>

        {hasBudget && !overBudget && (
          <span className="inline-flex items-center gap-1.5 text-neutral-700">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#FBCFE8] border border-pink-200 shrink-0" />
            <span>Marge</span>
            <span className="font-display font-bold text-[#DB2777]">
              {formatEuro(margin)}
            </span>
          </span>
        )}

        {overBudget && (
          <span className="inline-flex items-center gap-1.5 text-rose-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-rose-500 to-red-600 shrink-0" />
            <span>Dépassement</span>
            <span className="font-display font-bold">
              +{formatEuro(excess)}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
