'use client';

import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, BarChart3, CreditCard,
  CheckCircle2, Clock, ChevronDown, ChevronUp, Calculator,
  Landmark, ArrowRight,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useMonthSimulator } from '@/hooks/use-finance';
import { TRANSACTION_CATEGORY_LABELS, type SimulatorItemResponse, type CreditCardDueItem } from '@/types/api';
import { decodeCardColor } from '@/lib/banks';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtMonthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
}

function prevMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${color}`}>{fmt(value)}</p>
      {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}

function ItemRow({ item }: { item: SimulatorItemResponse }) {
  const isIncome = item.type === 'INCOME';
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-50 dark:border-white/4 last:border-0">
      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
        item.confirmed
          ? 'bg-emerald-100 dark:bg-emerald-500/15'
          : 'bg-amber-100 dark:bg-amber-500/15'
      }`}>
        {item.confirmed
          ? <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          : <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{item.description}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {TRANSACTION_CATEGORY_LABELS[item.category]} · {item.accountName}
          {!item.confirmed && <span className="ml-1 text-amber-500">· previsto</span>}
        </p>
      </div>
      <span className={`shrink-0 text-sm font-bold tabular-nums ${
        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
      }`}>
        {isIncome ? '+' : '-'}{fmt(item.amount)}
      </span>
    </div>
  );
}

function CardDueRow({ item }: { item: CreditCardDueItem }) {
  const { hex } = decodeCardColor(item.color);
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-white/4 last:border-0">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/15">
        <CreditCard className="h-3 w-3 text-violet-600 dark:text-violet-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{item.cardName}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {item.bankName} · Vence {new Date(item.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-2.5 w-2.5 rounded-full" style={{ background: hex }} />
        <span className="text-sm font-bold tabular-nums text-rose-500 dark:text-rose-400">-{fmt(item.amount)}</span>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title, count, total, isIncome, children,
}: {
  title: string; count: number; total: number; isIncome: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  if (count === 0) return null;
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-1.5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</span>
          <span className="rounded-full bg-slate-100 dark:bg-white/8 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">{count}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold tabular-nums ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
            {isIncome ? '+' : '-'}{fmt(total)}
          </span>
          {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
        </div>
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SimulatorPage() {
  const [month, setMonth] = useState(currentYearMonth());
  const [hypothetical, setHypothetical] = useState<number | undefined>(undefined);

  const { data: sim, isLoading } = useMonthSimulator(month);

  const afterHypothetical = useMemo(() => {
    if (!sim || !hypothetical) return null;
    return {
      balance: sim.projectedMonthBalance - hypothetical,
      netWorth: sim.projectedNetWorth - hypothetical,
    };
  }, [sim, hypothetical]);

  const balanceColor = (v: number) =>
    v > 0 ? 'text-emerald-600 dark:text-emerald-400' : v < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200';

  return (
    <div className="space-y-6">

      {/* ── Month nav ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-slate-700 dark:text-slate-200">Simulador do Mês</h1>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card px-3 py-1.5 shadow-sm">
          <button onClick={() => setMonth(prevMonth(month))} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <ArrowRight className="h-4 w-4 rotate-180" />
          </button>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize min-w-[140px] text-center">
            {fmtMonthLabel(month)}
          </span>
          <button onClick={() => setMonth(nextMonth(month))} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Patrimônio líquido ── */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15">
              <Landmark className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Patrimônio Líquido Atual</p>
              {isLoading
                ? <Skeleton className="h-7 w-36 mt-0.5" />
                : <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{fmt(sim?.netWorth ?? 0)}</p>
              }
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 divide-x divide-slate-100 dark:divide-white/8">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : (
              <>
                <StatCard label="Contas" value={sim?.totalAccounts ?? 0} sub="saldo atual" color="text-slate-800 dark:text-slate-100" />
                <div className="pl-4">
                  <StatCard label="Cofrinhos" value={sim?.totalSavings ?? 0} sub="guardado" color="text-sky-600 dark:text-sky-400" />
                </div>
                <div className="pl-4">
                  <StatCard label="Investimentos" value={sim?.totalInvestments ?? 0} sub="valor atual" color="text-violet-600 dark:text-violet-400" />
                </div>
                <div className="pl-4">
                  <StatCard label="Dívida CC" value={sim?.totalCreditCardDebt ?? 0} sub="faturas abertas" color="text-rose-500 dark:text-rose-400" />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Fluxo do mês (3 cards) ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Receitas */}
        <Card className="shadow-sm border-emerald-100 dark:border-emerald-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Receitas</span>
            </div>
            {isLoading ? <Skeleton className="h-8 w-32" /> : (
              <>
                <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{fmt(sim?.totalProjectedIncome ?? 0)}</p>
                <div className="mt-1 flex gap-3 text-[10px] text-slate-400 dark:text-slate-500">
                  <span>✅ {fmt(sim?.totalConfirmedIncome ?? 0)} confirmado</span>
                </div>
                {(sim?.totalPendingIncome ?? 0) > 0 && (
                  <p className="text-[10px] text-amber-500">⏳ {fmt(sim?.totalPendingIncome ?? 0)} previsto</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card className="shadow-sm border-rose-100 dark:border-rose-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-500/15">
                <TrendingDown className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Despesas</span>
            </div>
            {isLoading ? <Skeleton className="h-8 w-32" /> : (
              <>
                <p className="text-2xl font-bold tabular-nums text-rose-500 dark:text-rose-400">{fmt(sim?.totalProjectedExpenses ?? 0)}</p>
                <div className="mt-1 flex gap-3 text-[10px] text-slate-400 dark:text-slate-500">
                  <span>✅ {fmt((sim?.totalConfirmedExpenses ?? 0))} confirmado</span>
                </div>
                {((sim?.totalPendingExpenses ?? 0) + (sim?.totalCreditCardDueThisMonth ?? 0)) > 0 && (
                  <p className="text-[10px] text-amber-500">
                    ⏳ {fmt((sim?.totalPendingExpenses ?? 0) + (sim?.totalCreditCardDueThisMonth ?? 0))} previsto
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Saldo do mês */}
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/8">
                <Wallet className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saldo do mês</span>
            </div>
            {isLoading ? <Skeleton className="h-8 w-32" /> : (
              <>
                <p className={`text-2xl font-bold tabular-nums ${balanceColor(sim?.projectedMonthBalance ?? 0)}`}>
                  {fmt(sim?.projectedMonthBalance ?? 0)}
                </p>
                <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">receitas − despesas projetadas</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Patrimônio projetado: <span className={`font-semibold ${balanceColor(sim?.projectedNetWorth ?? 0)}`}>{fmt(sim?.projectedNetWorth ?? 0)}</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Simulador "E se?" ── */}
      <Card className="shadow-sm border-violet-100 dark:border-violet-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/15">
              <Calculator className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle className="text-base">Simulador &quot;E se?&quot;</CardTitle>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Simule o impacto de uma compra ou gasto no seu saldo projetado e patrimônio.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Se eu gastar…</p>
              <CurrencyInput
                value={hypothetical}
                onChange={(v) => setHypothetical(v)}
                placeholder="R$ 0,00"
              />
            </div>
            {afterHypothetical && sim && (
              <div className="flex-1 rounded-xl bg-violet-50 dark:bg-violet-500/8 border border-violet-100 dark:border-violet-500/20 px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Saldo do mês</span>
                  <span className={`text-sm font-bold tabular-nums ${balanceColor(afterHypothetical.balance)}`}>
                    {fmt(afterHypothetical.balance)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Patrimônio projetado</span>
                  <span className={`text-sm font-bold tabular-nums ${balanceColor(afterHypothetical.netWorth)}`}>
                    {fmt(afterHypothetical.netWorth)}
                  </span>
                </div>
                <div className="h-px bg-violet-100 dark:bg-violet-500/20" />
                <p className={`text-xs font-semibold ${afterHypothetical.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                  {afterHypothetical.balance >= 0
                    ? '✅ Você ficaria no positivo este mês'
                    : '⚠️ Você ficaria no negativo este mês'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Detalhamento ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Receitas detalhadas */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-sm">Receitas do mês</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : (
              <>
                <CollapsibleSection
                  title="Confirmadas"
                  count={sim?.confirmedIncome.length ?? 0}
                  total={sim?.totalConfirmedIncome ?? 0}
                  isIncome
                >
                  {sim?.confirmedIncome.map((item, i) => <ItemRow key={i} item={item} />)}
                </CollapsibleSection>

                <CollapsibleSection
                  title="Recorrentes previstas"
                  count={sim?.pendingRecurringIncome.length ?? 0}
                  total={sim?.totalPendingIncome ?? 0}
                  isIncome
                >
                  {sim?.pendingRecurringIncome.map((item, i) => <ItemRow key={i} item={item} />)}
                </CollapsibleSection>

                {(sim?.confirmedIncome.length === 0 && sim?.pendingRecurringIncome.length === 0) && (
                  <p className="py-4 text-center text-sm text-slate-400">Nenhuma receita registrada ou prevista.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Despesas detalhadas */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-500/15">
                <TrendingDown className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
              </div>
              <CardTitle className="text-sm">Despesas do mês</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : (
              <>
                <CollapsibleSection
                  title="Confirmadas"
                  count={sim?.confirmedExpenses.length ?? 0}
                  total={sim?.totalConfirmedExpenses ?? 0}
                  isIncome={false}
                >
                  {sim?.confirmedExpenses.map((item, i) => <ItemRow key={i} item={item} />)}
                </CollapsibleSection>

                <CollapsibleSection
                  title="Recorrentes previstas"
                  count={sim?.pendingRecurringExpenses.length ?? 0}
                  total={sim?.totalPendingExpenses ?? 0}
                  isIncome={false}
                >
                  {sim?.pendingRecurringExpenses.map((item, i) => <ItemRow key={i} item={item} />)}
                </CollapsibleSection>

                <CollapsibleSection
                  title="Faturas de cartão"
                  count={sim?.creditCardDueItems.length ?? 0}
                  total={sim?.totalCreditCardDueThisMonth ?? 0}
                  isIncome={false}
                >
                  {sim?.creditCardDueItems.map((item, i) => <CardDueRow key={i} item={item} />)}
                </CollapsibleSection>

                {(sim?.confirmedExpenses.length === 0 && sim?.pendingRecurringExpenses.length === 0 && sim?.creditCardDueItems.length === 0) && (
                  <p className="py-4 text-center text-sm text-slate-400">Nenhuma despesa registrada ou prevista.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Resumo visual do patrimônio ── */}
      {!isLoading && sim && (
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
              Composição do patrimônio
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Contas',       value: sim.totalAccounts,     icon: Wallet,     color: 'bg-slate-100 dark:bg-white/8',     tc: 'text-slate-700 dark:text-slate-200' },
                { label: 'Cofrinhos',    value: sim.totalSavings,      icon: PiggyBank,  color: 'bg-sky-100 dark:bg-sky-500/15',    tc: 'text-sky-600 dark:text-sky-400' },
                { label: 'Investimentos',value: sim.totalInvestments,  icon: BarChart3,  color: 'bg-violet-100 dark:bg-violet-500/15', tc: 'text-violet-600 dark:text-violet-400' },
                { label: 'Dívida CC',   value: -sim.totalCreditCardDebt, icon: CreditCard, color: 'bg-rose-100 dark:bg-rose-500/15', tc: 'text-rose-500 dark:text-rose-400' },
              ].map(({ label, value, icon: Icon, color, tc }) => (
                <div key={label} className={`flex items-center gap-3 rounded-xl p-3 ${color}`}>
                  <Icon className={`h-5 w-5 shrink-0 ${tc}`} />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
                    <p className={`text-sm font-bold tabular-nums truncate ${tc}`}>{fmt(value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
