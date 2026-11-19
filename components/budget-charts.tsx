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

export function StackedPeopleBarChart({
  items,
  onSelectPerson,
}: {
  items: PersonBudgetMetric[];
  onSelectPerson?: (personId: string) => void;
}) {
  if (items.length === 0) return null;

  const maxScale = Math.max(
    ...items.map((item) => Math.max(item.total, item.budget ?? 0)),
    50
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-base font-bold text-neutral-900">
          Comparatif par personne
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-neutral-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-emerald-400 to-teal-500" />
            Acheté
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-[#EC4899] to-[#A855F7]" />
            À acheter
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#FCE7F3] border border-pink-200" />
            Marge
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-rose-500 to-red-600" />
            Dépassement
          </span>
        </div>
      </div>

      {/* Vertical stacked bars grid — responsive, zero horizontal scroll */}
      <div
        className={`grid gap-4 items-end pt-2 ${
          items.length === 1
            ? 'grid-cols-1 max-w-[140px]'
            : items.length === 2
            ? 'grid-cols-2 max-w-sm'
            : items.length === 3
            ? 'grid-cols-3'
            : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6'
        }`}
      >
        {items.map((item) => {
          const hasBudget = item.budget != null && item.budget > 0;
          const ceiling = item.budget ?? 0;
          const overBudget = hasBudget && item.total > ceiling;
          const excess = hasBudget ? Math.max(0, item.total - ceiling) : 0;
          const margin = hasBudget ? Math.max(0, ceiling - item.total) : 0;

          const withinPending = hasBudget
            ? Math.max(
                0,
                Math.min(item.pending, Math.max(0, ceiling - item.purchased))
              )
            : item.pending;

          const barHeightPx = 156;
          const boughtH = (item.purchased / maxScale) * barHeightPx;
          const pendingH = (withinPending / maxScale) * barHeightPx;
          const marginH = (margin / maxScale) * barHeightPx;
          const excessH = (excess / maxScale) * barHeightPx;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectPerson?.(item.id)}
              className="group flex flex-col items-center gap-2 text-center focus:outline-none"
              title={`${item.name} : ${formatEuro(item.total)}${
                hasBudget ? ` / ${formatEuro(ceiling)}` : ''
              }`}
            >
              {/* Value above bar */}
              <div className="font-display text-xs font-extrabold tabular-nums text-neutral-900">
                {formatEuro(item.total)}
              </div>

              {/* Stacked column */}
              <div
                className="w-full max-w-[52px] flex flex-col-reverse justify-start rounded-2xl bg-[#FDF2F8]/70 p-1 overflow-hidden border border-pink-100/80 group-hover:border-[#EC4899]/50 transition-colors"
                style={{height: `${barHeightPx + 8}px`}}
              >
                {boughtH > 0 && (
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-lg first:rounded-b-xl transition-all duration-300"
                    style={{height: `${Math.max(boughtH, 4)}px`}}
                  />
                )}
                {pendingH > 0 && (
                  <div
                    className="w-full bg-gradient-to-t from-[#EC4899] to-[#A855F7] rounded-lg mt-0.5 transition-all duration-300"
                    style={{height: `${Math.max(pendingH, 4)}px`}}
                  />
                )}
                {marginH > 0 && (
                  <div
                    className="w-full bg-[#FCE7F3] rounded-lg mt-0.5 transition-all duration-300"
                    style={{height: `${Math.max(marginH, 4)}px`}}
                  />
                )}
                {excessH > 0 && (
                  <div
                    className="w-full bg-gradient-to-t from-rose-600 to-rose-400 rounded-lg mt-0.5 transition-all duration-300"
                    style={{height: `${Math.max(excessH, 4)}px`}}
                  />
                )}
              </div>

              {/* Person Name & optional budget */}
              <div className="w-full space-y-0.5">
                <div className="font-display text-xs sm:text-sm font-bold text-neutral-800 truncate group-hover:text-[#DB2777] transition-colors">
                  {item.name}
                </div>
                <div
                  className={`text-[10px] font-semibold tabular-nums truncate ${
                    overBudget ? 'text-rose-600' : 'text-neutral-400'
                  }`}
                >
                  {hasBudget ? `/ ${formatEuro(ceiling)}` : 'Sans limite'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
