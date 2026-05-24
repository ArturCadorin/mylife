'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, CreditCard, Pencil, PowerOff, Trash2, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CardSheet } from '@/components/credit-cards/card-sheet';
import { CardVisual } from '@/components/credit-cards/card-visual';
import { useCreditCards, useDeactivateCreditCard, useDeleteCreditCard } from '@/hooks/use-finance';
import type { CreditCardResponse } from '@/types/api';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// ── ActionBar ─────────────────────────────────────────────────────────────────

interface ActionBarProps {
  card: CreditCardResponse;
  onEdit: (c: CreditCardResponse) => void;
  onDeactivate: (c: CreditCardResponse) => void;
  onDelete: (c: CreditCardResponse) => void;
  loading: boolean;
}

function ActionBar({ card, onEdit, onDeactivate, onDelete, loading }: ActionBarProps) {
  return (
    <div className="flex items-center justify-between">
      <Link href={`/finance/credit-cards/${card.id}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-1 px-2 text-xs text-slate-500 hover:text-slate-700" })}>
        Ver fatura <ArrowRight className="h-3 w-3" />
      </Link>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-slate-400 hover:text-slate-600" onClick={() => onEdit(card)} disabled={loading} title="Editar">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        {card.active && (
          <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-slate-400 hover:text-amber-500" onClick={() => onDeactivate(card)} disabled={loading} title="Desativar">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PowerOff className="h-3.5 w-3.5" />}
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-slate-400 hover:text-rose-500" onClick={() => onDelete(card)} disabled={loading} title="Excluir">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreditCardsPage() {
  const { data: cards = [], isLoading } = useCreditCards();
  const deactivateMutation = useDeactivateCreditCard();
  const deleteMutation = useDeleteCreditCard();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardResponse | undefined>();
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<CreditCardResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CreditCardResponse | null>(null);

  const activeCards   = cards.filter((c) => c.active);
  const inactiveCards = cards.filter((c) => !c.active);

  const totalDebt      = activeCards.reduce((s, c) => s + c.currentInvoiceTotal, 0);
  const totalAvailable = activeCards.reduce((s, c) => s + c.availableLimit, 0);
  const totalLimit     = activeCards.reduce((s, c) => s + c.totalLimit, 0);

  function openCreate() { setEditingCard(undefined); setSheetOpen(true); }
  function openEdit(c: CreditCardResponse) { setEditingCard(c); setSheetOpen(true); }

  function handleDeactivate(c: CreditCardResponse) { setDeactivateTarget(c); }
  function handleDelete(c: CreditCardResponse) { setDeleteTarget(c); }

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    const target = deactivateTarget;
    setDeactivateTarget(null);
    setActionLoading(target.id);
    try { await deactivateMutation.mutateAsync(target.id); toast.success('Cartão desativado.'); }
    catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao desativar cartão.');
    }
    finally { setActionLoading(null); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setActionLoading(target.id);
    try { await deleteMutation.mutateAsync(target.id); toast.success('Cartão excluído.'); }
    catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao excluir cartão.');
    }
    finally { setActionLoading(null); }
  }

  return (
    <div className="space-y-6">
      {/* Summary consolidado */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-4">
          {/* Header da seção */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Consolidado
            </span>
            {!isLoading && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {activeCards.length} cartão{activeCards.length !== 1 ? 's' : ''} ativo{activeCards.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Stats em 3 colunas */}
          <div className="grid grid-cols-3 gap-0 divide-x divide-slate-100 dark:divide-white/8">
            {/* Fatura em aberto */}
            <div className="pr-5 space-y-0.5">
              <p className="text-xs text-slate-400 dark:text-slate-500">Fatura em aberto</p>
              {isLoading ? <Skeleton className="h-7 w-24 mt-1" /> : (
                <p className="text-xl font-bold tabular-nums text-rose-500">{formatCurrency(totalDebt)}</p>
              )}
              <p className="text-[10px] text-slate-400 dark:text-slate-500">soma de todas as faturas</p>
            </div>

            {/* Crédito disponível */}
            <div className="px-5 space-y-0.5">
              <p className="text-xs text-slate-400 dark:text-slate-500">Crédito disponível</p>
              {isLoading ? <Skeleton className="h-7 w-24 mt-1" /> : (
                <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(totalAvailable)}</p>
              )}
              <p className="text-[10px] text-slate-400 dark:text-slate-500">disponível para uso agora</p>
            </div>

            {/* Limite total */}
            <div className="pl-5 space-y-0.5">
              <p className="text-xs text-slate-400 dark:text-slate-500">Limite total</p>
              {isLoading ? <Skeleton className="h-7 w-24 mt-1" /> : (
                <p className="text-xl font-bold tabular-nums text-slate-800 dark:text-slate-100">{formatCurrency(totalLimit)}</p>
              )}
              <p className="text-[10px] text-slate-400 dark:text-slate-500">soma de todos os limites</p>
            </div>
          </div>

          {/* Barra de utilização global */}
          {!isLoading && totalLimit > 0 && (
            <div className="mt-4 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/8 overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (totalDebt / totalLimit) * 100)}%`,
                    background: totalDebt / totalLimit > 0.8
                      ? 'oklch(0.64 0.22 27)'   // rose
                      : totalDebt / totalLimit > 0.5
                        ? 'oklch(0.77 0.16 70)'  // amber
                        : 'oklch(0.70 0.17 162)', // emerald
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-right">
                {((totalDebt / totalLimit) * 100).toFixed(1)}% do limite total utilizado
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cartões ativos</h2>
        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={openCreate}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Novo cartão
        </Button>
      </div>

      {/* Active cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
              <div className="h-52 animate-pulse bg-slate-200" />
              <div className="bg-white px-4 py-3 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-1.5 w-full rounded-full" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      ) : activeCards.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <CreditCard className="mx-auto mb-3 h-10 w-10 text-slate-200" />
            <p className="mb-3 text-sm text-slate-400">Nenhum cartão cadastrado ainda.</p>
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={openCreate}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar cartão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeCards.map((card) => (
            <div key={card.id} className="space-y-0">
              <Link href={`/finance/credit-cards/${card.id}`} className="block hover:opacity-90 transition-opacity">
                <CardVisual card={card} />
              </Link>
              <Card className="-mt-1 rounded-t-none border-t-0 shadow-sm">
                <CardContent className="py-2">
                  <ActionBar card={card} onEdit={openEdit} onDeactivate={handleDeactivate} onDelete={handleDelete} loading={actionLoading === card.id} />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Inactive */}
      {!isLoading && inactiveCards.length > 0 && (
        <>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Inativos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inactiveCards.map((card) => (
              <div key={card.id}>
                <CardVisual card={card} />
                <Card className="-mt-1 rounded-t-none border-t-0 shadow-sm">
                  <CardContent className="py-2">
                    <ActionBar card={card} onEdit={openEdit} onDeactivate={handleDeactivate} onDelete={handleDelete} loading={actionLoading === card.id} />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </>
      )}

      <CardSheet open={sheetOpen} onOpenChange={setSheetOpen} card={editingCard} />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(o) => { if (!o) setDeactivateTarget(null); }}
        title="Desativar cartão?"
        description={<>O cartão <strong>&ldquo;{deactivateTarget?.name}&rdquo;</strong> será marcado como inativo. Você poderá reativá-lo depois.</>}
        confirmLabel="Desativar"
        variant="warning"
        onConfirm={confirmDeactivate}
        loading={actionLoading !== null}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Excluir cartão?"
        description={<>O cartão <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong> será excluído permanentemente. Esta ação não pode ser desfeita.</>}
        confirmLabel="Excluir permanentemente"
        onConfirm={confirmDelete}
        loading={actionLoading !== null}
      />
    </div>
  );
}
