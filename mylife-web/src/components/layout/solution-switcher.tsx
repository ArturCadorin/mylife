'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Dumbbell, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useSidebar } from '@/components/ui/sidebar';
import type { LucideIcon } from 'lucide-react';
import type { ProductType } from '@/types/api';

// ── Solution map ──────────────────────────────────────────────────────────────

interface Solution {
  product: ProductType;
  name: string;
  description: string;
  Icon: LucideIcon;
  gradient: string;
  shadow: string;
  href: string;
  /** true when this solution IS the currently running app */
  currentApp: boolean;
}

const SOLUTIONS: Solution[] = [
  {
    product: 'FINANCE',
    name: 'MyFinance',
    description: 'Controle financeiro',
    Icon: BarChart3,
    gradient: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-300/40 dark:shadow-emerald-900/50',
    href: '/dashboard',
    currentApp: true,
  },
  {
    product: 'FITNESS',
    name: 'MyFitness',
    description: 'Saúde e treinos',
    Icon: Dumbbell,
    gradient: 'from-orange-500 to-red-500',
    shadow: 'shadow-orange-300/40 dark:shadow-orange-900/50',
    href: 'http://localhost:3001',
    currentApp: false,
  },
];

/** Which product is running right now — change this per-app */
const CURRENT_PRODUCT: ProductType = 'FINANCE';

// ── Component ─────────────────────────────────────────────────────────────────

export function SolutionSwitcher() {
  const { user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const [open, setOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mostra todas as soluções do ecossistema — o array products do usuário indica
  // o que ele já ativou, mas o switcher exibe tudo disponível no ecossistema.
  const userProducts = new Set(user?.products ?? []);
  const current = SOLUTIONS.find((s) => s.product === CURRENT_PRODUCT) ?? SOLUTIONS[0];
  const hasSwitcher = SOLUTIONS.length > 1;

  function enter() {
    if (!hasSwitcher) return;
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setOpen(true);
  }

  function leave() {
    leaveTimer.current = setTimeout(() => setOpen(false), 120);
  }

  return (
    <div
      className="relative"
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      {/* ── Trigger (logo) ────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center gap-2.5 px-1 py-1.5 rounded-xl transition-colors',
          hasSwitcher && 'cursor-pointer hover:bg-sidebar-accent',
          collapsed && 'justify-center',
        )}
      >
        {/* Icon badge */}
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br shrink-0 shadow-md',
            current.gradient,
            current.shadow,
          )}
        >
          <current.Icon className="h-4 w-4 text-white" />
        </div>

        {/* Text — hidden when collapsed */}
        <div className="group-data-[collapsible=icon]:hidden flex-1 min-w-0">
          <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight block">
            {current.name}
          </span>
          <p className="text-xs text-slate-400 dark:text-slate-500 -mt-0.5">{current.description}</p>
        </div>

        {/* Chevron */}
        {hasSwitcher && (
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-slate-400 transition-transform duration-200 shrink-0',
              'group-data-[collapsible=icon]:hidden',
              open && 'rotate-180',
            )}
          />
        )}
      </div>

      {/* ── Dropdown panel ───────────────────────────────────────────────── */}
      {open && hasSwitcher && (
        <div
          className={cn(
            'absolute z-50 w-60 rounded-2xl border border-slate-200/80 dark:border-white/10',
            'bg-white dark:bg-card shadow-xl shadow-slate-200/60 dark:shadow-black/50',
            'p-3 animate-fade-in-up',
            // Position: right-of-icon when collapsed, below when expanded
            collapsed
              ? 'left-12 top-0'
              : 'left-0 top-full mt-1.5',
          )}
          onMouseEnter={enter}
          onMouseLeave={leave}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5 px-0.5">
            Soluções disponíveis
          </p>

          <div className="grid grid-cols-2 gap-2">
            {SOLUTIONS.map((solution) => (
              <SolutionCard
                key={solution.product}
                solution={solution}
                isCurrent={solution.product === CURRENT_PRODUCT}
                hasAccess={userProducts.has(solution.product)}
                onSelect={() => setOpen(false)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Solution card ─────────────────────────────────────────────────────────────

function SolutionCard({
  solution,
  isCurrent,
  hasAccess,
  onSelect,
}: {
  solution: Solution;
  isCurrent: boolean;
  hasAccess: boolean;
  onSelect: () => void;
}) {
  const inner = (
    <div
      className={cn(
        'flex flex-col items-center gap-2.5 rounded-xl p-3 text-center transition-all select-none',
        isCurrent
          ? 'bg-slate-100 dark:bg-white/10 ring-2 ring-emerald-500/30'
          : hasAccess
            ? 'hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer'
            : 'opacity-60 cursor-default',
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-md',
          solution.gradient,
          solution.shadow,
        )}
      >
        <solution.Icon className="h-5 w-5 text-white" />
      </div>

      <div>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight block">
          {solution.name}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight block mt-0.5">
          {solution.description}
        </span>
      </div>

      {isCurrent ? (
        <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
          Ativo
        </span>
      ) : !hasAccess ? (
        <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-white/8 px-2 py-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
          Em breve
        </span>
      ) : null}
    </div>
  );

  // Current app — no navigation needed
  if (isCurrent) {
    return <div onClick={onSelect}>{inner}</div>;
  }

  // No access yet — not clickable
  if (!hasAccess) {
    return <div>{inner}</div>;
  }

  // External app (different port / domain)
  if (solution.href.startsWith('http')) {
    return (
      <a href={solution.href} onClick={onSelect} rel="noopener noreferrer">
        {inner}
      </a>
    );
  }

  return (
    <Link href={solution.href} onClick={onSelect}>
      {inner}
    </Link>
  );
}
