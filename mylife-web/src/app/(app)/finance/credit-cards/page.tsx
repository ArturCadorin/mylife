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
import { useCreditCards, useDeactivateCreditCard, useDeleteCreditCard } from '@/hooks/use-finance';
import type { CreditCardResponse } from '@/types/api';
import { decodeCardColor, type CardNetwork } from '@/lib/banks';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function usedPercent(card: CreditCardResponse) {
  if (card.totalLimit === 0) return 0;
  return Math.min(100, ((card.totalLimit - card.availableLimit) / card.totalLimit) * 100);
}

function hexIsLight(hex: string): boolean {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
  } catch {
    return false;
  }
}

// ── Card sub-components ───────────────────────────────────────────────────────

function ChipSvg() {
  return (
    <svg width="38" height="28" viewBox="0 0 38 28">
      <rect width="38" height="28" rx="4" fill="#D4AF37" />
      <rect x="12" y="0" width="14" height="28" fill="#B8920A" opacity="0.45" />
      <rect x="0" y="9" width="38" height="10" fill="#B8920A" opacity="0.45" />
      <rect x="12" y="9" width="14" height="10" fill="#8B6D08" opacity="0.6" />
    </svg>
  );
}

function ContactlessIcon({ white }: { white: boolean }) {
  const c = white ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.55)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="15.5" r="1.5" fill={c} />
      <path d="M8.8 12.5c.9-1.8 2.6-2.8 3.2-2.8s2.3.9 3.2 2.8" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 9.5C7.7 6.3 9.8 5 12 5s4.3 1.3 6 4.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

function NetworkLogo({ network, white }: { network: CardNetwork; white: boolean }) {
  if (network === 'visa') {
    return (
      <span
        className="text-lg font-black italic tracking-tight"
        style={{ color: white ? 'white' : '#1a1f71', fontFamily: 'serif', textShadow: white ? '0 1px 3px rgba(0,0,0,0.3)' : 'none' }}
      >
        VISA
      </span>
    );
  }

  if (network === 'mastercard') {
    return (
      <div className="flex -space-x-2.5 items-center">
        <div className="h-6 w-6 rounded-full bg-red-500 opacity-95 shadow-sm" />
        <div className="h-6 w-6 rounded-full bg-amber-400 opacity-95 shadow-sm" />
      </div>
    );
  }

  if (network === 'elo') {
    return (
      <span
        className="text-lg font-black lowercase tracking-tight"
        style={{ color: white ? 'white' : '#FF6600' }}
      >
        elo
      </span>
    );
  }

  if (network === 'amex') {
    return (
      <span
        className="text-[10px] font-bold tracking-widest uppercase leading-tight"
        style={{ color: white ? 'white' : '#006FCF' }}
      >
        AMEX
      </span>
    );
  }

  if (network === 'hipercard') {
    return (
      <span
        className="text-xs font-bold"
        style={{ color: white ? 'white' : '#CC0000' }}
      >
        Hiper
      </span>
    );
  }

  return null;
}

// ── CardVisual ────────────────────────────────────────────────────────────────

function CardVisual({ card }: { card: CreditCardResponse }) {
  const { network, hex } = decodeCardColor(card.color);
  const white = !hexIsLight(hex);
  const tc = white ? 'text-white' : 'text-slate-900';
  const tcMuted = white ? 'text-white/60' : 'text-slate-600';
  const used = usedPercent(card);

  return (
    <div className={`overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 transition-opacity interactive-card ${!card.active ? 'opacity-55' : ''}`}>
      {/* Card face */}
      <div
        className="relative flex h-52 flex-col justify-between overflow-hidden p-5"
        style={{ background: `linear-gradient(135deg, ${hex} 0%, ${hex}bb 100%)` }}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-10 top-16 h-24 w-24 rounded-full bg-white/10" />

        {/* Top row: bank + status + network */}
        <div className="relative z-10 flex items-center justify-between">
          <span className={`text-sm font-bold ${tc}`}>{card.bankName}</span>
          <div className="flex items-center gap-2">
            {!card.active && (
              <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs text-white">Inativo</span>
            )}
            <NetworkLogo network={network} white={white} />
          </div>
        </div>

        {/* Middle: chip + contactless */}
        <div className="relative z-10 flex items-center justify-between">
          <ChipSvg />
          <ContactlessIcon white={white} />
        </div>

        {/* Bottom: number + name + dates */}
        <div className="relative z-10">
          <p className={`font-mono text-sm tracking-widest ${tc}`}>
            •••• •••• •••• {card.lastFourDigits}
          </p>
          <p className={`mt-1 text-xs font-medium ${tc}`}>{card.name}</p>
          <p className={`mt-0.5 text-[10px] ${tcMuted}`}>
            Fecha {card.closingDay} · Vence {card.dueDay}
          </p>
        </div>
      </div>

      {/* Usage info */}
      <div className="bg-white px-4 py-3 space-y-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Fatura atual</span>
          <span className="font-semibold text-slate-700">{formatCurrency(card.currentInvoiceTotal)}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100">
          <div
            className={`h-1.5 rounded-full transition-all ${used > 80 ? 'bg-rose-400' : used > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
            style={{ width: `${used}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>Disponível: {formatCurrency(card.availableLimit)}</span>
          <span>Limite: {formatCurrency(card.totalLimit)}</span>
        </div>
      </div>
    </div>
  );
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
      <Link href={`/credit-cards/${card.id}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-1 px-2 text-xs text-slate-500 hover:text-slate-700" })}>
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
              <Link href={`/credit-cards/${card.id}`} className="block hover:opacity-90 transition-opacity">
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
