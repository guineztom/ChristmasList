'use client';

import React, {useId} from 'react';
import {formatEuro} from '@/lib/wishlist-types';

export interface PersonBudgetMetric {
  id: string;
  name: string;
  purchased: number;
  pending: number;
  total: number;
  budget: number | null;
}

interface BudgetDonutProps {
  purchased: number;
  pending: number;
  budget: number | null | undefined;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function BudgetDonutChart({
  purchased,
  pending,
  budget,
  size = 132,
  strokeWidth = 14,
  label,
}: BudgetDonutProps) {
  const id = useId();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = purchased + pending;
  const hasBudget = budget != null && budget > 0;
  const ceiling = budget ?? 0;
  const overBudget = hasBudget && total > ceiling;
  const excess = hasBudget ? Math.max(0, total - ceiling) : 0;

  const base = hasBudget ? Math.max(ceiling, total, 1) : Math.max(total, 1);
  const boughtRatio = total === 0 && !hasBudget ? 0 : purchased / base;
  const withinBudgetPending = hasBudget
    ? Math.max(0, Math.min(pending, Math.max(0, ceiling - purchased)))
    : pending;
  const pendingRatio = total === 0 && !hasBudget ? 0 : withinBudgetPending / base;
  const excessRatio = overBudget ? excess / base : 0;

  const boughtLen = boughtRatio * circumference;
  const pendingLen = pendingRatio * circumference;
  const excessLen = excessRatio * circumference;

  const pctUsed = hasBudget ? Math.round((total / ceiling) * 100) : null;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{width: size, height: size}}
      role="img"
      aria-label={`Graphique budget : acheté ${formatEuro(
        purchased
      )}, à acheter ${formatEuro(pending)}${
        hasBudget ? `, budget ${formatEuro(ceiling)}` : ''
      }`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient
            id={`donut-bought-${id}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
          <linearGradient
            id={`donut-pending-${id}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
          <linearGradient
            id={`donut-excess-${id}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>

        {/* Track (Marge) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#FCE7F3"
          strokeWidth={strokeWidth}
        />

        {/* Purchased */}
        {boughtLen > 0.5 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#donut-bought-${id})`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${boughtLen} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="butt"
          />
        )}

        {/* Pending */}
        {pendingLen > 0.5 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#donut-pending-${id})`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${pendingLen} ${circumference}`}
            strokeDashoffset={-boughtLen}
            strokeLinecap="butt"
          />
        )}

        {/* Excess */}
        {excessLen > 0.5 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#donut-excess-${id})`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${excessLen} ${circumference}`}
            strokeDashoffset={-(boughtLen + pendingLen)}
            strokeLinecap="butt"
          />
        )}
      </svg>

      {/* Center numeric summary */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        {pctUsed !== null ? (
          <>
            <span
              className={`font-display text-xl font-extrabold tabular-nums leading-none ${
                overBudget ? 'text-rose-600' : 'text-neutral-900'
              }`}
            >
              {pctUsed}%
            </span>
            <span className="mt-1 text-[10px] font-semibold text-neutral-400">
              {label ?? (overBudget ? 'Dépassé' : 'du budget')}
            </span>
          </>
        ) : (
          <>
            <span className="font-display text-sm font-extrabold tabular-nums text-neutral-900 leading-tight">
              {formatEuro(total)}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold text-neutral-400">
              {label ?? 'Prévu'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
