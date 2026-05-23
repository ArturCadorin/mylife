'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Pencil } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SavingsSheet } from '@/components/savings/savings-sheet';
import { EntrySheet } from '@/components/savings/entry-sheet';
import { useSaving, useSavingsEntries } from '@/hooks/use-finance';
import type { SavingsEntryType } from '@/types/api';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function progressColor(pct: number | null): string {
  if (pct === null) return 'bg-emerald-400';
  if (pct >= 75) return 'bg-emerald-500';
  if (pct >= 25) return 'bg-amber-400';
  return 'bg-slate-300';
}

function formatMonthLabel(yearMonth: string) {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
}

export default function SavingsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = use(params);
  const savingsId = Number(idStr);

  const [page, setPage] = useState(0);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [entrySheetOpen, setEntrySheetOpen] = useState(false);
  const [entryType, setEntryType] = useState<SavingsEntryType>('DEPOSIT');

  const { data: savings, isLoading: savingsLoading } = useSaving(savingsId);
  const { data: entriesPage, isLoading: entriesLoading } = useSavingsEntries(savingsId, page);

  const entries = entriesPage?.content ?? [];
  const totalPages = entriesPage?.totalPages ?? 0;

  const grouped = useMemo(() => {
    const map = new Map<string, typeof entries>();
    for (const e of entries) {
      const key = e.date.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => ({ label: formatMonthLabel(key), items }));
  }, [entries]);

  function openEntry(type: SavingsEntryType) {
    setEntryType(type);
    setEntrySheetOpen(true);
  }

  const pct = savings?.percentualDaMeta ?? null;
  const hasCdi = savings ? (savings.cdiRate !== null && savings.currentCdiValue !== null) : false;
  const effectiveRate = hasCdi ? (savings!.cdiRate! * savings!.currentCdiValue! / 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/savings" className={buttonVariants({ variant: "ghost", size: "sm", className: "text-slate-500 -ml-2" })}><ArrowLeft className="h-4 w-4 mr-1" />Cofrinhos</Link>

      {/* Header card */}
      {savingsLoading ? (
        <Card className="shadow-sm">
          <CardContent className="pt-5 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-2 w-full rounded-full" />
          </CardContent>
        </Card>
      ) : savings ? (
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{savings.name}</h2>
                {savings.description && <p className="text-sm text-slate-400 mt-0.5">{savings.description}</p>}
              </div>
              <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-slate-400 hover:text-slate-600" onClick={() => setEditSheetOpen(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-400">Saldo atual</p>
                <p className="text-2xl font-bold tabular-nums text-slate-900">{formatCurrency(savings.currentAmount)}</p>
              </div>
              {savings.targetAmount && (
                <div>
                  <p className="text-xs text-slate-400">Meta</p>
                  <p className="text-lg font-semibold tabular-nums text-slate-600">{formatCurrency(savings.targetAmount)}</p>
                </div>
              )}
              {hasCdi ? (
                <>
                  <div>
                    <p className="text-xs text-slate-400">Taxa efetiva</p>
                    <p className="text-lg font-semibold text-slate-700">{effectiveRate.toFixed(2)}% a.a.</p>
                  </div>
                  {savings.estimatedReturn > 0 && (
                    <div>
                      <p className="text-xs text-slate-400">Rendimento est.</p>
                      <p className="text-lg font-semibold text-emerald-600 tabular-nums">+{formatCurrency(savings.estimatedReturn)}/mês</p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <p className="text-xs text-slate-400">Rendimento</p>
                  <p className="text-sm font-medium text-slate-400 italic">Sem CDI</p>
                </div>
              )}
            </div>

            {savings.targetAmount && pct !== null && (
              <div className="space-y-1.5">
                <div className="h-2.5 w-full rounded-full bg-slate-100">
                  <div
                    className={`h-2.5 rounded-full transition-all ${progressColor(pct)}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">{Math.round(pct)}% da meta atingida</p>
              </div>
            )}

            {savings.linkedAccountName && (
              <p className="text-xs text-slate-400">Conta vinculada: <span className="text-slate-600">{savings.linkedAccountName}</span></p>
            )}

            <div className="flex gap-2">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => openEntry('DEPOSIT')}>
                <ArrowDownToLine className="h-3.5 w-3.5 mr-1" /> Depositar
              </Button>
              <Button size="sm" variant="outline" className="text-rose-500 border-rose-200 hover:bg-rose-50" onClick={() => openEntry('WITHDRAWAL')}>
                <ArrowUpFromLine className="h-3.5 w-3.5 mr-1" /> Retirar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Entry history */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Histórico de movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          {entriesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-36" /><Skeleton className="h-3 w-20" /></div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : grouped.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Nenhuma movimentação ainda. Faça seu primeiro depósito!</p>
          ) : (
            <div className="space-y-6">
              {grouped.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 border-b border-slate-100 pb-1">
                    {group.label}
                  </p>
                  <div>
                    {group.items.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3 py-2 rounded-lg hover:bg-slate-50 px-2 -mx-2 transition-colors">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          entry.type === 'DEPOSIT' ? 'bg-emerald-50' : 'bg-rose-50'
                        }`}>
                          {entry.type === 'DEPOSIT'
                            ? <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-600" />
                            : <ArrowUpFromLine className="h-3.5 w-3.5 text-rose-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700">
                            {entry.type === 'DEPOSIT' ? 'Depósito' : 'Retirada'}
                          </p>
                          {entry.note && <p className="text-xs text-slate-400 truncate">{entry.note}</p>}
                          <p className="text-xs text-slate-400">
                            {new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className={`text-sm font-semibold tabular-nums shrink-0 ${
                          entry.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-rose-500'
                        }`}>
                          {entry.type === 'DEPOSIT' ? '+' : '−'}{formatCurrency(entry.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400">Página {page + 1} de {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {savings && <SavingsSheet open={editSheetOpen} onOpenChange={setEditSheetOpen} savings={savings} />}
      {savings && (
        <EntrySheet
          open={entrySheetOpen}
          onOpenChange={setEntrySheetOpen}
          savingsId={savings.id}
          savingsName={savings.name}
          currentAmount={savings.currentAmount}
          defaultType={entryType}
        />
      )}
    </div>
  );
}
