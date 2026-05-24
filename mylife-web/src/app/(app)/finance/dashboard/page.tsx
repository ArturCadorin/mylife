'use client';

import {
  Wallet, CreditCard, PiggyBank, TrendingUp,
  ArrowUpRight, ArrowDownLeft, ArrowLeftRight,
  Plus, ArrowRight, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useOverview, useRecentTransactions } from '@/hooks/use-finance';
import { useAuth } from '@/hooks/use-auth';
import { TRANSACTION_CATEGORY_LABELS, type TransactionResponse, type TransactionType } from '@/types/api';
import { RecurrenceBadge } from '@/components/transactions/recurrence-badge';

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}
function fmtDate(d: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(d));
}

/* ─── sub-componentes locais ──────────────────────────────────────────────── */

function TxBadge({ type }: { type: TransactionType }) {
  const map = {
    INCOME:   { bg: 'bg-emerald-100 dark:bg-emerald-500/15', Icon: ArrowDownLeft,  c: 'text-emerald-600 dark:text-emerald-400' },
    EXPENSE:  { bg: 'bg-rose-100 dark:bg-rose-500/15',       Icon: ArrowUpRight,   c: 'text-rose-500 dark:text-rose-400'    },
    TRANSFER: { bg: 'bg-blue-100 dark:bg-blue-500/15',        Icon: ArrowLeftRight, c: 'text-blue-500 dark:text-blue-400'    },
  };
  const { bg, Icon, c } = map[type] ?? map.TRANSFER;
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
      <Icon className={`h-4 w-4 ${c}`} />
    </div>
  );
}

function TxAmount({ tx }: { tx: TransactionResponse }) {
  const isIncome = tx.type === 'INCOME';
  const isTransfer = tx.type === 'TRANSFER';
  return (
    <span className={`text-sm font-bold tabular-nums ${
      isIncome ? 'text-emerald-600 dark:text-emerald-400'
      : isTransfer ? 'text-blue-600 dark:text-blue-400'
      : 'text-rose-500 dark:text-rose-400'
    }`}>
      {isIncome ? '+' : isTransfer ? '' : '−'}{fmt(tx.amount)}
    </span>
  );
}

/* ─── page ────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { data: overview, isLoading: overviewLoading } = useOverview();
  const { data: transactions, isLoading: txLoading }  = useRecentTransactions(5);
  const { user } = useAuth();

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  /* ── config dos 4 StatCards ── */
  const statCards = [
    {
      title:       'Saldo em contas',
      value:       fmt(overview?.totalBalanceAllAccounts ?? 0),
      sub:         `${overview?.accountSummaries?.length ?? 0} conta(s)`,
      icon:        Wallet,
      gradient:    'from-sky-400 to-blue-600',
      shadowColor: 'shadow-sky-300/40 dark:shadow-sky-900/30',
    },
    {
      title:       'Cofrinhos',
      value:       fmt(overview?.totalSavings ?? 0),
      sub:         `${overview?.savingsSummaries?.length ?? 0} cofre(s)`,
      icon:        PiggyBank,
      gradient:    'from-violet-400 to-purple-600',
      shadowColor: 'shadow-violet-300/40 dark:shadow-violet-900/30',
    },
    {
      title:       'Dívida no cartão',
      value:       fmt(overview?.totalCreditCardDebt ?? 0),
      sub:         'Fatura atual',
      icon:        CreditCard,
      gradient:    'from-rose-400 to-rose-600',
      shadowColor: 'shadow-rose-300/40 dark:shadow-rose-900/30',
    },
    {
      title:       'Patrimônio líquido',
      value:       fmt(overview?.netWorth ?? 0),
      sub:         'Ativos − Passivos',
      icon:        TrendingUp,
      gradient:    'from-emerald-400 to-teal-600',
      shadowColor: 'shadow-emerald-300/40 dark:shadow-emerald-900/30',
    },
  ] as const;

  /* ── ações rápidas ── */
  const quickActions = [
    { label: 'Nova receita',  href: '/finance/transactions?type=INCOME',   bg: 'from-emerald-500 to-teal-500',   Icon: ArrowDownLeft  },
    { label: 'Nova despesa',  href: '/finance/transactions?type=EXPENSE',  bg: 'from-rose-500 to-pink-500',      Icon: ArrowUpRight   },
    { label: 'Transferência', href: '/finance/transactions?type=TRANSFER', bg: 'from-blue-500 to-indigo-500',    Icon: ArrowLeftRight },
    { label: 'Ver contas',   href: '/finance/accounts',                   bg: 'from-slate-400 to-slate-600 dark:from-slate-600 dark:to-slate-700', Icon: Wallet },
  ] as const;

  return (
    <div className="space-y-6">

      {/* ── Saudação ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {greeting}, {user?.name?.split(' ')[0] ?? 'usuário'} 👋
          </h2>
          <p className="mt-0.5 text-sm capitalize text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          href="/finance/transactions"
          className={buttonVariants({ size: 'sm', className: 'shrink-0 gap-1.5 rounded-xl shadow-sm shadow-emerald-200 dark:shadow-emerald-900/40' })}
        >
          <Plus className="h-4 w-4" />
          Nova transação
        </Link>
      </div>

      {/* ── Hero — banner do patrimônio ─────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 p-6 text-white shadow-xl shadow-emerald-300/25 dark:shadow-emerald-950/50">
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-44 w-44 rounded-full bg-teal-700/20 blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
            <p className="text-sm font-semibold text-emerald-100">Patrimônio líquido</p>
          </div>

          {overviewLoading
            ? <Skeleton className="mt-2 h-10 w-56 rounded-lg bg-white/20" />
            : <p className="mt-2 text-4xl font-extrabold tabular-nums tracking-tight">
                {fmt(overview?.netWorth ?? 0)}
              </p>
          }

          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
            {[
              { label: 'Saldo em contas', value: overview?.totalBalanceAllAccounts ?? 0, cls: '' },
              { label: 'Cofrinhos',       value: overview?.totalSavings ?? 0,            cls: '' },
              { label: 'Dívida cartão',   value: overview?.totalCreditCardDebt ?? 0,     cls: 'text-rose-200' },
            ].map(({ label, value, cls }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-emerald-200">{label}</p>
                <p className={`mt-0.5 text-base font-bold tabular-nums ${cls}`}>
                  {overviewLoading ? '…' : fmt(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4 StatCards coloridos ───────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {overviewLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              /* skeleton com gradiente cinza */
              <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 p-5 shadow-lg">
                <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
                <div className="relative space-y-3 pt-1">
                  <Skeleton className="h-10 w-10 rounded-xl bg-white/30" />
                  <Skeleton className="h-3 w-24 rounded bg-white/30" />
                  <Skeleton className="h-8 w-36 rounded-lg bg-white/30" />
                  <Skeleton className="h-3 w-16 rounded bg-white/30" />
                </div>
              </div>
            ))
          : statCards.map((c) => (
              <StatCard key={c.title} loading={false} {...c} />
            ))
        }
      </div>

      {/* ── Linha principal ─────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Transações recentes */}
        <Card className="lg:col-span-2">
          <CardHeader className="px-6 pb-3 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15">
                  <ArrowLeftRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle>Transações recentes</CardTitle>
              </div>
              <Link
                href="/finance/transactions"
                className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'gap-1 -mr-2 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400' })}
              >
                Ver todas <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <div className="space-y-0.5">
              {txLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                      <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-36" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))
                : transactions?.length === 0
                ? <p className="py-8 text-center text-sm text-slate-400">Nenhuma transação recente</p>
                : transactions?.map((tx) => (
                    <div key={tx.id}
                      className="-mx-3 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <TxBadge type={tx.type} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{tx.description}</p>
                        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <span>{TRANSACTION_CATEGORY_LABELS[tx.category]} · {tx.accountName}</span>
                          <RecurrenceBadge tx={tx} />
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <TxAmount tx={tx} />
                        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{fmtDate(tx.date)}</p>
                      </div>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>

        {/* Coluna direita */}
        <div className="space-y-4">

          {/* Ações rápidas — botões com gradiente */}
          <Card>
            <CardHeader className="px-6 pb-3 pt-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/15">
                  <Plus className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <CardTitle>Ações rápidas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 px-6 pb-5">
              {quickActions.map(({ label, href, bg, Icon }) => (
                <Link key={label} href={href}
                  className={`flex flex-col items-center gap-1.5 rounded-xl bg-gradient-to-br px-2 py-3.5 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md ${bg}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Cofrinhos */}
          <Card>
            <CardHeader className="px-6 pb-3 pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/15">
                    <PiggyBank className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <CardTitle>Cofrinhos</CardTitle>
                </div>
                <Link href="/finance/savings"
                  className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'gap-1 -mr-2 text-xs text-violet-600 dark:text-violet-400' })}
                >
                  Ver <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-5">
              {overviewLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  ))
                : overview?.savingsSummaries?.length === 0
                ? <p className="text-sm text-slate-400">Nenhum cofrinho criado</p>
                : overview?.savingsSummaries?.slice(0, 3).map((s) => {
                    const hasTarget = s.targetAmount != null && s.targetAmount > 0;
                    const rawPct = s.progressPercentage;
                    const pct = hasTarget && rawPct != null && !isNaN(rawPct)
                      ? Math.min(rawPct, 100)
                      : null;
                    return (
                      <div key={s.savingsId}>
                        <div className="mb-1.5 flex items-baseline justify-between">
                          <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-300">{s.name}</p>
                          {pct !== null
                            ? <span className={`ml-2 shrink-0 text-xs font-bold ${pct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-violet-500 dark:text-violet-400'}`}>
                                {Math.round(pct)}%
                              </span>
                            : <span className="ml-2 shrink-0 text-xs text-slate-400 dark:text-slate-500 italic">sem meta</span>
                          }
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all"
                            style={{ width: `${pct ?? 0}%` }}
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                          {fmt(s.currentAmount)}
                          {hasTarget && s.targetAmount != null && (
                            <span className="text-slate-300 dark:text-slate-600"> / {fmt(s.targetAmount)}</span>
                          )}
                        </p>
                      </div>
                    );
                  })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Contas ──────────────────────────────────────────────── */}
      {!overviewLoading && (overview?.accountSummaries?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="px-6 pb-3 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-500/15">
                  <Wallet className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                </div>
                <CardTitle>Contas</CardTitle>
              </div>
              <Link href="/finance/accounts"
                className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'gap-1 -mr-2 text-xs text-sky-600 dark:text-sky-400' })}
              >
                Ver todas <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {overview?.accountSummaries?.slice(0, 3).map((acc) => (
                <div key={acc.accountId}
                  className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-white/6 bg-slate-50/60 dark:bg-white/4 px-4 py-3.5 transition-colors hover:bg-slate-100 dark:hover:bg-white/7"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">{acc.accountName}</p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{acc.bankName}</p>
                  </div>
                  <p className={`ml-3 shrink-0 text-sm font-extrabold tabular-nums ${
                    acc.balance >= 0 ? 'text-slate-800 dark:text-white' : 'text-rose-500 dark:text-rose-400'
                  }`}>
                    {fmt(acc.balance)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
