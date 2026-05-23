'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, TrendingUp, TrendingDown, Pencil, PowerOff, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

import { useInvestmentSummary, useDeactivateInvestment } from '@/hooks/use-finance';
import { InvestmentSheet } from '@/components/investments/investment-sheet';
import { InvestmentEntrySheet } from '@/components/investments/investment-entry-sheet';
import {
  INVESTMENT_TYPE_LABELS,
  type InvestmentResponse,
  type InvestmentType,
  type InvestmentEntryType,
} from '@/types/api';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const TYPE_COLORS: Record<InvestmentType, { badge: string; header: string }> = {
  FIXED_INCOME: { badge: 'bg-emerald-100 text-emerald-700', header: 'text-emerald-700' },
  STOCK:        { badge: 'bg-blue-100 text-blue-700',       header: 'text-blue-700' },
  FUND:         { badge: 'bg-violet-100 text-violet-700',   header: 'text-violet-700' },
  CRYPTO:       { badge: 'bg-amber-100 text-amber-700',     header: 'text-amber-700' },
};

const TYPE_ORDER: InvestmentType[] = ['FIXED_INCOME', 'STOCK', 'FUND', 'CRYPTO'];

export default function InvestmentsPage() {
  const router = useRouter();
  const { data: summary, isLoading } = useInvestmentSummary();
  const deactivateMutation = useDeactivateInvestment();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InvestmentResponse | undefined>();
  const [entrySheetOpen, setEntrySheetOpen] = useState(false);
  const [entryTarget, setEntryTarget] = useState<{ id: number; name: string; currentValue: number; type: InvestmentEntryType } | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<InvestmentResponse | null>(null);
  const [typeFilter, setTypeFilter] = useState<InvestmentType | 'ALL'>('ALL');

  const investments = summary?.investments ?? [];
  const activeInvestments = investments.filter((i) => i.active);
  const filteredActive = typeFilter === 'ALL' ? activeInvestments : activeInvestments.filter((i) => i.type === typeFilter);

  const grouped = TYPE_ORDER.reduce<Record<InvestmentType, InvestmentResponse[]>>((acc, t) => {
    acc[t] = filteredActive.filter((i) => i.type === t);
    return acc;
  }, {} as Record<InvestmentType, InvestmentResponse[]>);

  function openEntry(inv: InvestmentResponse, type: InvestmentEntryType) {
    setEntryTarget({ id: inv.id, name: inv.name, currentValue: inv.currentValue, type });
    setEntrySheetOpen(true);
  }

  const yieldPositive = (summary?.totalYield ?? 0) >= 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Investimentos</h1>
          <p className="text-sm text-slate-500">Acompanhe sua carteira de investimentos</p>
        </div>
        <Button onClick={() => { setEditTarget(undefined); setSheetOpen(true); }} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
          <Plus className="h-4 w-4" /> Novo investimento
        </Button>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-white p-4 space-y-1">
            <p className="text-xs text-slate-500">Total investido</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(summary.totalInvested)}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 space-y-1">
            <p className="text-xs text-slate-500">Valor atual</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(summary.totalCurrentValue)}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 space-y-1">
            <p className="text-xs text-slate-500">Rendimento total</p>
            <p className={`text-xl font-bold flex items-center gap-1 ${yieldPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {yieldPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatCurrency(summary.totalYield)}
            </p>
          </div>
          <div className="rounded-xl border bg-white p-4 space-y-1">
            <p className="text-xs text-slate-500">Rendimento %</p>
            <p className={`text-xl font-bold ${yieldPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {yieldPositive ? '+' : ''}{summary.totalYieldPercentage.toFixed(2).replace('.', ',')}%
            </p>
          </div>
        </div>
      ) : null}

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter('ALL')}
          className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-colors ${typeFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
        >Todos</button>
        {TYPE_ORDER.map((t) => (
          <button
            key={t} onClick={() => setTypeFilter(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-colors ${
              typeFilter === t
                ? TYPE_COLORS[t].badge + ' border-current'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >{INVESTMENT_TYPE_LABELS[t]}</button>
        ))}
      </div>

      {/* Investment list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : investments.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white p-12 text-center">
          <p className="text-slate-500 mb-4">Nenhum investimento cadastrado ainda.</p>
          <Button onClick={() => { setEditTarget(undefined); setSheetOpen(true); }} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
            <Plus className="h-4 w-4" /> Adicionar investimento
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {TYPE_ORDER.map((type) => {
            const items = grouped[type];
            if (!items || items.length === 0) return null;
            const colors = TYPE_COLORS[type];
            return (
              <div key={type}>
                <h2 className={`text-sm font-semibold mb-3 ${colors.header}`}>{INVESTMENT_TYPE_LABELS[type]}</h2>
                <div className="space-y-2">
                  {items.map((inv) => {
                    const positive = inv.yieldAmount >= 0;
                    return (
                      <div key={inv.id} className="rounded-xl border bg-white p-4 interactive-card">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-medium text-slate-800 truncate">{inv.name}</p>
                              <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${colors.badge}`}>{inv.institution}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                              <span>Investido: <strong className="text-slate-700">{formatCurrency(inv.totalInvested)}</strong></span>
                              <span>Atual: <strong className="text-slate-700">{formatCurrency(inv.currentValue)}</strong></span>
                              <span className={positive ? 'text-emerald-600' : 'text-rose-600'}>
                                {positive ? '+' : ''}{formatCurrency(inv.yieldAmount)} ({positive ? '+' : ''}{inv.yieldPercentage.toFixed(2).replace('.', ',')}%)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs h-7 px-2" onClick={() => openEntry(inv, 'DEPOSIT')}>Aporte</Button>
                            <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs h-7 px-2" onClick={() => openEntry(inv, 'YIELD_UPDATE')}>Atualizar</Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700" onClick={() => router.push(`/investments/${inv.id}`)}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700" onClick={() => { setEditTarget(inv); setSheetOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600" onClick={() => setDeactivateTarget(inv)}>
                              <PowerOff className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inactive */}
      {(() => {
        const inactive = investments.filter((i) => !i.active);
        if (!inactive.length) return null;
        return (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Inativos</h3>
            <div className="space-y-2">
              {inactive.map((inv) => (
                <div key={inv.id} className="rounded-xl border border-dashed bg-slate-50 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{inv.name}</p>
                    <p className="text-xs text-slate-400">{inv.institution} · {formatCurrency(inv.currentValue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <InvestmentSheet open={sheetOpen} onOpenChange={setSheetOpen} investment={editTarget} />

      {entryTarget && (
        <InvestmentEntrySheet
          open={entrySheetOpen}
          onOpenChange={setEntrySheetOpen}
          investmentId={entryTarget.id}
          investmentName={entryTarget.name}
          currentValue={entryTarget.currentValue}
          defaultType={entryTarget.type}
        />
      )}

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(o) => { if (!o) setDeactivateTarget(null); }}
        title="Desativar investimento?"
        description={
          <>
            <strong>&ldquo;{deactivateTarget?.name}&rdquo;</strong> será marcado como inativo mas não será excluído.
            {deactivateTarget && deactivateTarget.currentValue > 0 && (
              <span className="mt-2 block text-rose-600 font-medium">
                ⚠ Saldo de {formatCurrency(deactivateTarget.currentValue)} ainda em carteira — faça o resgate completo antes de desativar.
              </span>
            )}
          </>
        }
        confirmLabel="Desativar"
        variant={deactivateTarget && deactivateTarget.currentValue > 0 ? 'default' : 'warning'}
        onConfirm={() => {
          const target = deactivateTarget;
          setDeactivateTarget(null);
          if (!target || target.currentValue > 0) return;
          deactivateMutation.mutate(target.id, {
            onSuccess: () => toast.success(`"${target.name}" desativado.`),
            onError: (err: unknown) => {
              const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
              toast.error(msg || 'Erro ao desativar investimento.');
            },
          });
        }}
        loading={deactivateMutation.isPending}
      />
    </div>
  );
}
