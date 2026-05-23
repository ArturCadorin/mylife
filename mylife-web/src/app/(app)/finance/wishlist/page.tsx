'use client';

import { useState } from 'react';
import { Plus, Pencil, ShoppingCart, XCircle, Trash2, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

import { useWishlist, useCancelWishlistItem, useDeleteWishlistItem } from '@/hooks/use-finance';
import { WishlistSheet } from '@/components/wishlist/wishlist-sheet';
import { PurchaseSheet } from '@/components/wishlist/purchase-sheet';
import {
  WISHLIST_CATEGORY_LABELS,
  WISHLIST_PRIORITY_LABELS,
  type WishListItemResponse,
  type WishListStatus,
  type WishListPriority,
} from '@/types/api';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatMonth(yearMonth: string) {
  const [year, month] = yearMonth.split('-');
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
    .format(new Date(Number(year), Number(month) - 1, 1));
}

const STATUS_TABS: { value: WishListStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',       label: 'Todos' },
  { value: 'PENDING',   label: 'Pendentes' },
  { value: 'PURCHASED', label: 'Comprados' },
  { value: 'CANCELLED', label: 'Cancelados' },
];

const PRIORITY_COLORS: Record<WishListPriority, string> = {
  HIGH:   'bg-rose-100 text-rose-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW:    'bg-slate-100 text-slate-600',
};

const STATUS_COLORS: Record<WishListStatus, string> = {
  PENDING:   'bg-blue-100 text-blue-700',
  PURCHASED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

const STATUS_LABELS: Record<WishListStatus, string> = {
  PENDING:   'Pendente',
  PURCHASED: 'Comprado',
  CANCELLED: 'Cancelado',
};

export default function WishlistPage() {
  const [statusFilter, setStatusFilter] = useState<WishListStatus | 'ALL'>('PENDING');

  const queryStatus = statusFilter === 'ALL' ? undefined : statusFilter;
  const { data: items = [], isLoading } = useWishlist(queryStatus);

  const cancelMutation = useCancelWishlistItem();
  const deleteMutation = useDeleteWishlistItem();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WishListItemResponse | undefined>();
  const [purchaseTarget, setPurchaseTarget] = useState<WishListItemResponse | null>(null);
  const [cancelTarget, setCancelTarget] = useState<WishListItemResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WishListItemResponse | null>(null);

  const pendingItems = items.filter((i) => i.status === 'PENDING');
  const totalEstimated = pendingItems.reduce((sum, i) => sum + i.estimatedPrice, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lista de Desejos</h1>
          <p className="text-sm text-slate-500">Planeje suas próximas compras</p>
        </div>
        <Button onClick={() => { setEditTarget(undefined); setSheetOpen(true); }} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
          <Plus className="h-4 w-4" /> Novo item
        </Button>
      </div>

      {/* Summary */}
      {!isLoading && pendingItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-white p-4 space-y-1">
            <p className="text-xs text-slate-500">Itens pendentes</p>
            <p className="text-2xl font-bold text-slate-800">{pendingItems.length}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 space-y-1">
            <p className="text-xs text-slate-500">Total estimado</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(totalEstimated)}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 space-y-1 col-span-2 md:col-span-1">
            <p className="text-xs text-slate-500">Alta prioridade</p>
            <p className="text-2xl font-bold text-rose-600">{pendingItems.filter((i) => i.priority === 'HIGH').length}</p>
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value} onClick={() => setStatusFilter(tab.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-colors ${
              statusFilter === tab.value
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >{tab.label}</button>
        ))}
      </div>

      {/* Items */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white p-12 text-center">
          <p className="text-slate-500 mb-4">Nenhum item encontrado.</p>
          <Button onClick={() => { setEditTarget(undefined); setSheetOpen(true); }} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
            <Plus className="h-4 w-4" /> Adicionar item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border bg-white p-4 flex flex-col gap-3 interactive-card ${item.status !== 'PENDING' ? 'opacity-70' : ''}`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                  {item.description && <p className="text-xs text-slate-500 truncate">{item.description}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${PRIORITY_COLORS[item.priority]}`}>
                    {WISHLIST_PRIORITY_LABELS[item.priority]}
                  </span>
                  {statusFilter === 'ALL' && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_COLORS[item.status]}`}>
                      {STATUS_LABELS[item.status]}
                    </span>
                  )}
                </div>
              </div>

              {/* Price + meta */}
              <div className="space-y-1">
                <p className="text-lg font-bold text-slate-900">{formatCurrency(item.estimatedPrice)}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                  <span>{WISHLIST_CATEGORY_LABELS[item.category]}</span>
                  <span className="flex items-center gap-0.5">
                    <Calendar className="h-3 w-3" />
                    {formatMonth(item.estimatedMonth)}
                  </span>
                  {item.daysUntilEstimatedMonth > 0 && item.status === 'PENDING' && (
                    <span className="text-slate-400">em {item.daysUntilEstimatedMonth} dias</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {item.status === 'PENDING' && (
                <div className="flex gap-1.5 pt-1 border-t">
                  <Button
                    size="sm" variant="outline"
                    className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs h-7 gap-1"
                    onClick={() => setPurchaseTarget(item)}
                  >
                    <ShoppingCart className="h-3 w-3" /> Comprado
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                    onClick={() => { setEditTarget(item); setSheetOpen(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600"
                    onClick={() => setCancelTarget(item)}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {item.status !== 'PENDING' && (
                <div className="flex gap-1.5 pt-1 border-t">
                  <Button
                    size="sm" variant="ghost"
                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sheets */}
      <WishlistSheet open={sheetOpen} onOpenChange={setSheetOpen} item={editTarget} />

      {purchaseTarget && (
        <PurchaseSheet
          open={!!purchaseTarget}
          onOpenChange={(o) => { if (!o) setPurchaseTarget(null); }}
          item={purchaseTarget}
        />
      )}

      {/* Cancel dialog */}
      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(o) => { if (!o) setCancelTarget(null); }}
        title="Cancelar item?"
        description={<><strong>&ldquo;{cancelTarget?.name}&rdquo;</strong> será marcado como cancelado.</>}
        confirmLabel="Cancelar item"
        variant="warning"
        onConfirm={async () => {
          if (!cancelTarget) return;
          const target = cancelTarget;
          setCancelTarget(null);
          try {
            await cancelMutation.mutateAsync(target.id);
            toast.success(`"${target.name}" cancelado.`);
          } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Erro ao cancelar item.');
          }
        }}
        loading={cancelMutation.isPending}
      />

      {/* Delete dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Excluir item?"
        description={<><strong>&ldquo;{deleteTarget?.name}&rdquo;</strong> será excluído permanentemente. Esta ação não pode ser desfeita.</>}
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (!deleteTarget) return;
          const target = deleteTarget;
          setDeleteTarget(null);
          try {
            await deleteMutation.mutateAsync(target.id);
            toast.success(`"${target.name}" excluído.`);
          } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Erro ao excluir item.');
          }
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
