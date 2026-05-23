'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, TrendingUp, TrendingDown, Calendar, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useInvestment, useInvestmentEntries } from '@/hooks/use-finance';
import { InvestmentSheet } from '@/components/investments/investment-sheet';
import { InvestmentEntrySheet } from '@/components/investments/investment-entry-sheet';
import {
  INVESTMENT_TYPE_LABELS,
  FIXED_INCOME_INDEXER_LABELS,
  type InvestmentEntryType,
} from '@/types/api';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr + 'T00:00:00'));
}

function formatMonth(dateStr: string) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(dateStr + 'T00:00:00'));
}

const ENTRY_TYPE_LABELS: Record<string, string> = {
  DEPOSIT:      'Aporte',
  WITHDRAWAL:   'Resgate',
  YIELD_UPDATE: 'Atualização',
};

const ENTRY_TYPE_COLORS: Record<string, string> = {
  DEPOSIT:      'text-emerald-600 bg-emerald-50',
  WITHDRAWAL:   'text-rose-600 bg-rose-50',
  YIELD_UPDATE: 'text-blue-600 bg-blue-50',
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  FIXED_INCOME: 'bg-emerald-100 text-emerald-700',
  STOCK:        'bg-blue-100 text-blue-700',
  FUND:         'bg-violet-100 text-violet-700',
  CRYPTO:       'bg-amber-100 text-amber-700',
};

export default function InvestmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const investmentId = Number(id);

  const { data: investment, isLoading: loadingInv } = useInvestment(investmentId);
  const [page, setPage] = useState(0);
  const { data: entriesPage, isLoading: loadingEntries } = useInvestmentEntries(investmentId, page, 20);

  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [entrySheetOpen, setEntrySheetOpen] = useState(false);
  const [entryDefaultType, setEntryDefaultType] = useState<InvestmentEntryType>('DEPOSIT');

  function openEntry(type: InvestmentEntryType) {
    setEntryDefaultType(type);
    setEntrySheetOpen(true);
  }

  const entries = entriesPage?.content ?? [];

  const entriesByMonth = entries.reduce<Record<string, typeof entries>>((acc, e) => {
    const key = e.date.slice(0, 7);
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const positive = (investment?.yieldAmount ?? 0) >= 0;

  return (
    <div className="p-6 space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1 text-slate-500" onClick={() => router.push('/investments')}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </div>

      {/* Investment header */}
      {loadingInv ? (
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <Skeleton className="h-7 w-48" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        </div>
      ) : investment ? (
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-slate-900">{investment.name}</h1>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${TYPE_BADGE_COLORS[investment.type] ?? 'bg-slate-100 text-slate-600'}`}>
                  {INVESTMENT_TYPE_LABELS[investment.type]}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{investment.institution}</span>
                {investment.maturityDate && (
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Venc. {formatDate(investment.maturityDate)}</span>
                )}
                {investment.linkedAccountName && (
                  <span>Conta: {investment.linkedAccountName}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setEditSheetOpen(true)}>
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-slate-500">Total investido</p>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(investment.totalInvested)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Valor atual</p>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(investment.currentValue)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Rendimento</p>
              <p className={`text-lg font-bold flex items-center gap-1 ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {formatCurrency(investment.yieldAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Rendimento %</p>
              <p className={`text-lg font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {positive ? '+' : ''}{investment.yieldPercentage.toFixed(2).replace('.', ',')}%
              </p>
            </div>
          </div>

          {/* Fixed income details */}
          {investment.type === 'FIXED_INCOME' && (investment.indexer || investment.fixedRate) && (
            <div className="flex flex-wrap gap-4 pt-2 border-t text-xs text-slate-600">
              {investment.indexer && (
                <span>Indexador: <strong>{FIXED_INCOME_INDEXER_LABELS[investment.indexer]}</strong></span>
              )}
              {investment.indexerRate != null && (
                <span>% do índice: <strong>{investment.indexerRate}%</strong></span>
              )}
              {investment.currentIndexValue != null && (
                <span>Valor atual do índice: <strong>{investment.currentIndexValue}%</strong></span>
              )}
              {investment.fixedRate != null && (
                <span>Taxa prefixada: <strong>{investment.fixedRate}% a.a.</strong></span>
              )}
              {investment.estimatedReturn != null && (
                <span>Retorno estimado: <strong>{formatCurrency(investment.estimatedReturn)}</strong></span>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Action buttons */}
      {investment && (
        <div className="flex gap-2">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2" onClick={() => openEntry('DEPOSIT')}>
            + Aporte
          </Button>
          <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 gap-2" onClick={() => openEntry('WITHDRAWAL')}>
            Resgate
          </Button>
          <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-2" onClick={() => openEntry('YIELD_UPDATE')}>
            Atualizar valor
          </Button>
        </div>
      )}

      {/* Entry history */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-4">Histórico de movimentações</h2>

        {loadingEntries ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-slate-400">
            Nenhuma movimentação registrada.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(entriesByMonth)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([month, monthEntries]) => (
                <div key={month}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 capitalize">
                    {formatMonth(month + '-01')}
                  </p>
                  <div className="rounded-xl border bg-white divide-y">
                    {monthEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${ENTRY_TYPE_COLORS[entry.type] ?? 'bg-slate-100 text-slate-600'}`}>
                          {ENTRY_TYPE_LABELS[entry.type] ?? entry.type}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700">{entry.note ?? ENTRY_TYPE_LABELS[entry.type]}</p>
                          <p className="text-xs text-slate-400">{formatDate(entry.date)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-semibold ${entry.type === 'WITHDRAWAL' ? 'text-rose-600' : entry.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-blue-600'}`}>
                            {entry.type === 'WITHDRAWAL' ? '−' : entry.type === 'DEPOSIT' ? '+' : ''}{formatCurrency(entry.amount)}
                          </p>
                          {entry.previousValue != null && (
                            <p className="text-[10px] text-slate-400">anterior: {formatCurrency(entry.previousValue)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            {/* Pagination */}
            {entriesPage && entriesPage.totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                <Button variant="outline" size="sm" disabled={entriesPage.first} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <span className="text-xs text-slate-500 self-center">Página {page + 1} de {entriesPage.totalPages}</span>
                <Button variant="outline" size="sm" disabled={entriesPage.last} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sheets */}
      {investment && (
        <>
          <InvestmentSheet open={editSheetOpen} onOpenChange={setEditSheetOpen} investment={investment} />
          <InvestmentEntrySheet
            open={entrySheetOpen}
            onOpenChange={setEntrySheetOpen}
            investmentId={investment.id}
            investmentName={investment.name}
            currentValue={investment.currentValue}
            defaultType={entryDefaultType}
          />
        </>
      )}
    </div>
  );
}
