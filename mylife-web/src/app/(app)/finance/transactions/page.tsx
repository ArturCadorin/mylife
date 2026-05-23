'use client';

import { useState, useMemo } from 'react';
import { Plus, ArrowDownLeft, ArrowUpRight, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePickerInput } from '@/components/ui/date-picker';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TransactionSheet } from '@/components/transactions/transaction-sheet';
import { RecurrenceBadge } from '@/components/transactions/recurrence-badge';
import { useTransactions, useDeleteTransaction } from '@/hooks/use-finance';
import {
  TRANSACTION_CATEGORY_LABELS,
  type TransactionResponse,
  type TransactionType,
} from '@/types/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function localDateStr(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function firstDayOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatGroupLabel(dateKey: string) {
  const today = localDateStr(new Date());
  const yesterday = localDateStr(new Date(Date.now() - 86_400_000));
  if (dateKey === today) return 'Hoje';
  if (dateKey === yesterday) return 'Ontem';
  const [y, mo, d] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    .format(new Date(y, mo - 1, d));
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: TransactionType }) {
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
      type === 'INCOME' ? 'bg-emerald-50' : 'bg-rose-50'
    }`}>
      {type === 'INCOME'
        ? <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
        : <ArrowUpRight className="h-4 w-4 text-rose-500" />}
    </div>
  );
}

interface TransactionRowProps {
  tx: TransactionResponse;
  onEdit: (tx: TransactionResponse) => void;
  onDelete: (tx: TransactionResponse) => void;
  deleting: boolean;
}

function TransactionRow({ tx, onEdit, onDelete, deleting }: TransactionRowProps) {
  return (
    <div className="group flex items-center gap-3 rounded-lg px-2 py-2.5 -mx-2 hover:bg-slate-50 transition-colors">
      <TypeBadge type={tx.type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{tx.description}</p>
        <p className="text-xs text-slate-400 flex items-center gap-1 flex-wrap">
          <span>{TRANSACTION_CATEGORY_LABELS[tx.category]} · {tx.accountName}</span>
          {tx.recurrenceType !== 'NONE' && <RecurrenceBadge tx={tx} />}
        </p>
      </div>
      <span className={`text-sm font-semibold tabular-nums shrink-0 ${
        tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-500'
      }`}>
        {tx.type === 'INCOME' ? '+' : '−'}{formatCurrency(tx.amount)}
      </span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7 text-slate-400 hover:text-slate-600"
          onClick={() => onEdit(tx)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7 text-slate-400 hover:text-rose-500"
          onClick={() => onDelete(tx)}
          disabled={deleting}
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

type TypeFilter = 'ALL' | 'INCOME' | 'EXPENSE';

export default function TransactionsPage() {
  const [startDate, setStartDate] = useState(localDateStr(firstDayOfMonth()));
  const [endDate, setEndDate] = useState(localDateStr(new Date()));
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionResponse | undefined>();
  const [defaultSheetType, setDefaultSheetType] = useState<TransactionType>('EXPENSE');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionResponse | null>(null);

  const { data, isLoading } = useTransactions({ startDate, endDate, page, size: PAGE_SIZE });
  const deleteMutation = useDeleteTransaction();

  const allTransactions = data?.content ?? [];

  const filtered = useMemo(() => {
    if (typeFilter === 'ALL') return allTransactions;
    return allTransactions.filter((tx) => tx.type === typeFilter);
  }, [allTransactions, typeFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, TransactionResponse[]>();
    for (const tx of filtered) {
      if (!map.has(tx.date)) map.set(tx.date, []);
      map.get(tx.date)!.push(tx);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, items]) => ({
        dateKey,
        label: formatGroupLabel(dateKey),
        items: [...items].sort((a, b) => b.id - a.id),
        dayTotal: items.reduce((sum, tx) => sum + (tx.type === 'INCOME' ? tx.amount : -tx.amount), 0),
      }));
  }, [filtered]);

  const totalIncome = filtered.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  function openCreate(type: TransactionType) {
    setEditingTx(undefined);
    setDefaultSheetType(type);
    setSheetOpen(true);
  }

  function openEdit(tx: TransactionResponse) {
    setEditingTx(tx);
    setSheetOpen(true);
  }

  function handleDelete(tx: TransactionResponse) {
    setDeleteTarget(tx);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(target.id);
    try {
      await deleteMutation.mutateAsync(target.id);
      toast.success('Transação excluída!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao excluir transação.');
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid gap-3 grid-cols-3">
        {[
          { label: 'Receitas', value: totalIncome, color: 'text-emerald-600' },
          { label: 'Despesas', value: totalExpense, color: 'text-rose-500' },
          { label: 'Saldo', value: balance, color: balance >= 0 ? 'text-emerald-600' : 'text-rose-500' },
        ].map((item) => (
          <Card key={item.label} className="shadow-sm">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-400 mb-1">{item.label}</p>
              {isLoading
                ? <Skeleton className="h-6 w-24" />
                : <p className={`text-lg font-bold tabular-nums ${item.color}`}>{formatCurrency(item.value)}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + actions */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Date range */}
            <div className="flex items-center gap-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">De</label>
                <DatePickerInput
                  value={startDate}
                  onChange={(v) => { setStartDate(v); setPage(0); }}
                  placeholder="DD/MM/AAAA"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Até</label>
                <DatePickerInput
                  value={endDate}
                  onChange={(v) => { setEndDate(v); setPage(0); }}
                  placeholder="DD/MM/AAAA"
                />
              </div>
            </div>

            {/* Type filter */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {(['ALL', 'INCOME', 'EXPENSE'] as TypeFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 h-8 text-xs font-medium transition-colors ${
                    typeFilter === t
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {t === 'ALL' ? 'Todos' : t === 'INCOME' ? 'Receitas' : 'Despesas'}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                onClick={() => openCreate('INCOME')}
              >
                <ArrowDownLeft className="h-3.5 w-3.5 mr-1" />
                Receita
              </Button>
              <Button
                size="sm"
                className="bg-rose-500 hover:bg-rose-600 text-white"
                onClick={() => openCreate('EXPENSE')}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Despesa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction list */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">
            {isLoading ? <Skeleton className="h-5 w-40" /> : `${filtered.length} transação(ões)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : grouped.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-400">Nenhuma transação no período.</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-emerald-600"
                onClick={() => openCreate('EXPENSE')}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar primeira transação
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map((group) => (
                <div key={group.dateKey}>
                  {/* Day header */}
                  <div className="flex items-center justify-between mb-1 py-1 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {group.label}
                    </span>
                    <span className={`text-xs font-semibold tabular-nums ${
                      group.dayTotal >= 0 ? 'text-emerald-600' : 'text-rose-500'
                    }`}>
                      {group.dayTotal >= 0 ? '+' : '−'}{formatCurrency(Math.abs(group.dayTotal))}
                    </span>
                  </div>

                  {/* Items */}
                  <div>
                    {group.items.map((tx) => (
                      <TransactionRow
                        key={tx.id}
                        tx={tx}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        deleting={deletingId === tx.id}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Página {page + 1} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction sheet */}
      <TransactionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        transaction={editingTx}
        defaultType={defaultSheetType}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Excluir transação?"
        description={<>A transação <strong>&ldquo;{deleteTarget?.description}&rdquo;</strong> será excluída permanentemente. Esta ação não pode ser desfeita.</>}
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        loading={deletingId !== null}
      />
    </div>
  );
}
