'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerInput } from '@/components/ui/date-picker';
import { ExportMenu } from '@/components/reports/export-menu';

import {
  useMonthlySummary,
  useMonthlyComparison,
  useCategorySummary,
  useRecurrenceProjection,
} from '@/hooks/use-finance';
import {
  TRANSACTION_CATEGORY_LABELS,
  RECURRENCE_FREQUENCY_LABELS,
  type TransactionType,
} from '@/types/api';
import type { ExcelSheet } from '@/lib/export';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function localMonthStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function localDateStr(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatMonthLabel(ym: string) {
  const [y, m] = ym.split('-');
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
    .format(new Date(Number(y), Number(m) - 1, 1));
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(new Date(dateStr + 'T00:00:00'));
}

const CATEGORY_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

// ── Monthly Summary Tab ───────────────────────────────────────────────────────

function MonthlySummaryTab() {
  const [month, setMonth] = useState(localMonthStr(new Date()));

  const { data: summary, isLoading: loadingSum } = useMonthlySummary(month);
  const { data: comparison, isLoading: loadingComp } = useMonthlyComparison(month);

  const isLoading = loadingSum || loadingComp;

  function prevMonth() {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setMonth(localMonthStr(d));
  }

  function nextMonth() {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m, 1);
    setMonth(localMonthStr(d));
  }

  function variationBadge(pct: number, positiveIsGood = true) {
    const good = positiveIsGood ? pct >= 0 : pct <= 0;
    const colorClass = pct === 0 ? 'text-slate-500' : good ? 'text-emerald-600' : 'text-rose-600';
    return (
      <span className={`flex items-center gap-0.5 text-xs font-medium ${colorClass}`}>
        {pct > 0 ? <TrendingUp className="h-3 w-3" /> : pct < 0 ? <TrendingDown className="h-3 w-3" /> : null}
        {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
      </span>
    );
  }

  const maxBar = comparison
    ? Math.max(comparison.currentIncome, comparison.currentExpense,
               comparison.previousIncome, comparison.previousExpense, 1)
    : 1;

  function getSheets(): ExcelSheet[] {
    const label = formatMonthLabel(month);
    const rows: (string | number | null)[][] = [
      ['MyLife Finanças — Relatório'],
      ['Resumo Mensal', label],
      [],
      ['Métrica', 'Valor (R$)', 'Variação vs mês anterior'],
    ];
    if (summary) {
      rows.push(['Receitas', summary.totalIncome, comparison ? `${comparison.incomeVariation.toFixed(1)}%` : null]);
      rows.push(['Despesas', summary.totalExpense, comparison ? `${comparison.expenseVariation.toFixed(1)}%` : null]);
      rows.push(['Saldo', summary.balance, comparison ? `${comparison.balanceVariation.toFixed(1)}%` : null]);
      rows.push([]);
      rows.push(['Gastos no cartão', summary.totalCreditCardSpending]);
      rows.push(['Saldo líquido', summary.netBalance]);
    }
    if (comparison) {
      rows.push([]);
      rows.push(['Comparativo', 'Valor (R$)']);
      rows.push(['Receitas (mês atual)', comparison.currentIncome]);
      rows.push(['Receitas (mês anterior)', comparison.previousIncome]);
      rows.push(['Despesas (mês atual)', comparison.currentExpense]);
      rows.push(['Despesas (mês anterior)', comparison.previousExpense]);
    }
    return [{ name: 'Resumo Mensal', rows }];
  }

  return (
    <div className="space-y-5">
      {/* Month navigator + export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-slate-700 capitalize min-w-36 text-center">
            {formatMonthLabel(month)}
          </span>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <ExportMenu
          getSheets={getSheets}
          filename={`resumo-${month}`}
          googleClientId={GOOGLE_CLIENT_ID}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : summary ? (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border bg-white p-4 space-y-1">
              <p className="text-xs text-slate-500">Receitas</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(summary.totalIncome)}</p>
              {comparison && variationBadge(comparison.incomeVariation)}
            </div>
            <div className="rounded-xl border bg-white p-4 space-y-1">
              <p className="text-xs text-slate-500">Despesas</p>
              <p className="text-xl font-bold text-rose-600">{formatCurrency(summary.totalExpense)}</p>
              {comparison && variationBadge(comparison.expenseVariation, false)}
            </div>
            <div className="rounded-xl border bg-white p-4 space-y-1">
              <p className="text-xs text-slate-500">Saldo</p>
              <p className={`text-xl font-bold ${summary.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(summary.balance)}
              </p>
              {comparison && variationBadge(comparison.balanceVariation)}
            </div>
          </div>

          {/* Comparison bar chart */}
          {comparison && (
            <div className="rounded-xl border bg-white p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Comparativo — atual vs mês anterior</h3>
              <div className="space-y-3">
                {[
                  { label: 'Receitas (atual)',    value: comparison.currentIncome,   color: 'bg-emerald-500' },
                  { label: 'Receitas (anterior)', value: comparison.previousIncome,  color: 'bg-emerald-200' },
                  { label: 'Despesas (atual)',    value: comparison.currentExpense,  color: 'bg-rose-500' },
                  { label: 'Despesas (anterior)', value: comparison.previousExpense, color: 'bg-rose-200' },
                ].map((bar) => (
                  <div key={bar.label} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{bar.label}</span>
                      <span className="font-medium text-slate-700">{formatCurrency(bar.value)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${bar.color}`}
                        style={{ width: `${Math.min(100, (bar.value / maxBar) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extra info */}
          <div className="rounded-xl border bg-white p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Gastos no cartão de crédito</p>
              <p className="text-base font-bold text-rose-600">{formatCurrency(summary.totalCreditCardSpending)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Saldo líquido</p>
              <p className={`text-base font-bold ${summary.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(summary.netBalance)}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed p-8 text-center text-slate-400">
          Sem dados para este mês.
        </div>
      )}
    </div>
  );
}

// ── Category Summary Tab ──────────────────────────────────────────────────────

function CategorySummaryTab() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const [startDate, setStartDate] = useState(localDateStr(firstDay));
  const [endDate, setEndDate] = useState(localDateStr(now));
  const [type, setType] = useState<TransactionType>('EXPENSE');

  const { data: items = [], isLoading } = useCategorySummary(startDate, endDate, type);

  function getSheets(): ExcelSheet[] {
    const typeLabel = type === 'EXPENSE' ? 'Despesas' : 'Receitas';
    const rows: (string | number | null)[][] = [
      ['MyLife Finanças — Relatório'],
      ['Por Categoria', typeLabel],
      ['Período:', `${startDate} a ${endDate}`],
      [],
      ['Categoria', 'Transações', 'Valor (R$)', '% do Total'],
      ...items.map((item) => [
        TRANSACTION_CATEGORY_LABELS[item.category] ?? item.category,
        item.transactionCount,
        item.totalAmount,
        `${item.percentageOfTotal.toFixed(1)}%`,
      ]),
    ];
    return [{ name: 'Por Categoria', rows }];
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">De</span>
            <DatePickerInput value={startDate} onChange={setStartDate} placeholder="DD/MM/AAAA" />
            <span className="text-xs text-slate-500">até</span>
            <DatePickerInput value={endDate} onChange={setEndDate} placeholder="DD/MM/AAAA" />
          </div>
          <div className="flex rounded-lg border bg-white overflow-hidden">
            {(['EXPENSE', 'INCOME'] as TransactionType[]).map((t) => (
              <button
                key={t} onClick={() => setType(t)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  type === t ? (t === 'EXPENSE' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white') : 'text-slate-600 hover:bg-slate-50'
                }`}
              >{t === 'EXPENSE' ? 'Despesas' : 'Receitas'}</button>
            ))}
          </div>
        </div>
        <ExportMenu
          getSheets={getSheets}
          filename={`categorias-${startDate}-${endDate}`}
          googleClientId={GOOGLE_CLIENT_ID}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-slate-400">
          Nenhuma transação no período selecionado.
        </div>
      ) : (
        <div className="rounded-xl border bg-white divide-y">
          {items.map((item, idx) => (
            <div key={item.category} className="px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                  />
                  <span className="font-medium text-slate-700">
                    {TRANSACTION_CATEGORY_LABELS[item.category] ?? item.category}
                  </span>
                  <span className="text-xs text-slate-400">{item.transactionCount} tx</span>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="text-slate-500">{item.percentageOfTotal.toFixed(1)}%</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(item.totalAmount)}</span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.percentageOfTotal}%`,
                    backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Projection Tab ────────────────────────────────────────────────────────────

function ProjectionTab() {
  const [days, setDays] = useState(30);

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);

  const startDateStr = localDateStr(today);
  const endDateStr   = localDateStr(endDate);

  const { data: items = [], isLoading } = useRecurrenceProjection(startDateStr, endDateStr);

  const totalIncome  = items.filter((i) => i.type === 'INCOME').reduce((s, i) => s + i.amount, 0);
  const totalExpense = items.filter((i) => i.type === 'EXPENSE').reduce((s, i) => s + i.amount, 0);
  const netBalance   = totalIncome - totalExpense;

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.expectedDate]) acc[item.expectedDate] = [];
    acc[item.expectedDate].push(item);
    return acc;
  }, {});

  function getSheets(): ExcelSheet[] {
    const rows: (string | number | null)[][] = [
      ['MyLife Finanças — Relatório'],
      ['Projeção de Recorrências', `Próximos ${days} dias`],
      ['Período:', `${startDateStr} a ${endDateStr}`],
      [],
      ['Receitas projetadas', totalIncome],
      ['Despesas projetadas', totalExpense],
      ['Saldo projetado', netBalance],
      [],
      ['Data', 'Descrição', 'Conta', 'Frequência', 'Tipo', 'Valor (R$)'],
      ...items.map((item) => [
        item.expectedDate,
        item.description,
        item.creditCardName ? `Cartão: ${item.creditCardName}` : (item.accountName ?? ''),
        item.creditCardName ? 'Fatura' : (item.recurrenceFrequency ? RECURRENCE_FREQUENCY_LABELS[item.recurrenceFrequency] : ''),
        item.type === 'INCOME' ? 'Receita' : 'Despesa',
        item.amount,
      ]),
    ];
    return [{ name: 'Projeção', rows }];
  }

  return (
    <div className="space-y-5">
      {/* Days filter + export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Próximos:</span>
          <div className="flex rounded-lg border bg-white overflow-hidden">
            {[30, 60, 90].map((d) => (
              <button
                key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  days === d ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >{d} dias</button>
            ))}
          </div>
        </div>
        <ExportMenu
          getSheets={getSheets}
          filename={`projecao-${days}d`}
          googleClientId={GOOGLE_CLIENT_ID}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-slate-400">
          Nenhuma recorrência encontrada para os próximos {days} dias.
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border bg-white p-4 space-y-1">
              <p className="text-xs text-slate-500">Receitas projetadas</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="rounded-xl border bg-white p-4 space-y-1">
              <p className="text-xs text-slate-500">Despesas projetadas</p>
              <p className="text-lg font-bold text-rose-600">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="rounded-xl border bg-white p-4 space-y-1">
              <p className="text-xs text-slate-500">Saldo projetado</p>
              <p className={`text-lg font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(netBalance)}
              </p>
            </div>
          </div>

          {/* Grouped list */}
          <div className="space-y-4">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, dateItems]) => (
                <div key={date}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {formatDate(date)}
                  </p>
                  <div className="rounded-xl border bg-white divide-y">
                    {dateItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3">
                        {item.creditCardName ? (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/15">
                            <CreditCard className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                          </div>
                        ) : null}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{item.description}</p>
                          <p className="text-xs text-slate-400">
                            {item.creditCardName
                              ? <span className="inline-flex items-center gap-1">
                                  <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-600">Fatura</span>
                                  {item.creditCardName}
                                </span>
                              : <>{item.accountName} · {item.recurrenceFrequency ? RECURRENCE_FREQUENCY_LABELS[item.recurrenceFrequency] : ''}</>
                            }
                          </p>
                        </div>
                        <p className={`text-sm font-semibold shrink-0 ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.type === 'INCOME' ? '+' : '−'}{formatCurrency(item.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
        <p className="text-sm text-slate-500">Análise detalhada das suas finanças</p>
      </div>

      <Tabs defaultValue="monthly">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="monthly">Resumo mensal</TabsTrigger>
          <TabsTrigger value="categories">Por categoria</TabsTrigger>
          <TabsTrigger value="projection">Projeção</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="mt-6">
          <MonthlySummaryTab />
        </TabsContent>
        <TabsContent value="categories" className="mt-6">
          <CategorySummaryTab />
        </TabsContent>
        <TabsContent value="projection" className="mt-6">
          <ProjectionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
