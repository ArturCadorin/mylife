'use client';

import { useState } from 'react';
import { Plus, Building2, Wallet, Pencil, PowerOff, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AccountSheet } from '@/components/accounts/account-sheet';
import { useAccounts, useDeactivateAccount, useDeleteAccount } from '@/hooks/use-finance';
import { ACCOUNT_TYPE_LABELS, type AccountResponse } from '@/types/api';
import { getBankColor } from '@/lib/banks';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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

interface BankCardProps {
  account: AccountResponse;
  onEdit: (acc: AccountResponse) => void;
  onDeactivate: (acc: AccountResponse) => void;
  onDelete: (acc: AccountResponse) => void;
  actionLoading: number | null;
}

function BankCard({ account, onEdit, onDeactivate, onDelete, actionLoading }: BankCardProps) {
  const bankColor = getBankColor(account.bankName);
  const white = !hexIsLight(bankColor);
  const tc = white ? 'text-white' : 'text-slate-900';
  const tcMuted = white ? 'text-white/60' : 'text-slate-600';
  const isLoading = actionLoading === account.id;

  return (
    <div className={`rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5 transition-opacity interactive-card ${!account.active ? 'opacity-50' : ''}`}>
      {/* Card face */}
      <div
        className="relative p-5 h-44 flex flex-col justify-between overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${bankColor} 0%, ${bankColor}bb 100%)` }}
      >
        {/* Decorative bubbles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-8 top-12 h-20 w-20 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-6 -bottom-4 h-28 w-28 rounded-full bg-white/10" />

        {/* Top row */}
        <div className="relative z-10 flex items-start justify-between">
          <span className={`text-sm font-bold ${tc}`}>{account.bankName}</span>
          {!account.active && (
            <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs text-white">Inativa</span>
          )}
        </div>

        {/* Bottom info */}
        <div className="relative z-10">
          <p className={`text-xs ${tcMuted}`}>{ACCOUNT_TYPE_LABELS[account.type]}</p>
          <p className={`text-2xl font-bold tabular-nums ${tc}`}>
            {formatCurrency(account.balance)}
          </p>
          <p className={`mt-0.5 text-xs ${tcMuted}`}>{account.name}</p>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between bg-white px-4 py-2">
        <span className="text-xs text-slate-400">
          {account.active ? 'Conta ativa' : 'Conta inativa'}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost" size="icon-sm"
            className="h-7 w-7 text-slate-400 hover:text-slate-700"
            onClick={() => onEdit(account)} disabled={isLoading} title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {account.active && (
            <Button
              variant="ghost" size="icon-sm"
              className="h-7 w-7 text-slate-400 hover:text-amber-500"
              onClick={() => onDeactivate(account)} disabled={isLoading} title="Desativar"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PowerOff className="h-3.5 w-3.5" />}
            </Button>
          )}
          <Button
            variant="ghost" size="icon-sm"
            className="h-7 w-7 text-slate-400 hover:text-rose-500"
            onClick={() => onDelete(account)} disabled={isLoading} title="Excluir"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const deactivateMutation = useDeactivateAccount();
  const deleteMutation = useDeleteAccount();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountResponse | undefined>();
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AccountResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccountResponse | null>(null);

  const activeAccounts   = accounts.filter((a) => a.active);
  const inactiveAccounts = accounts.filter((a) => !a.active);
  const totalBalance     = activeAccounts.reduce((sum, a) => sum + a.balance, 0);

  function openCreate() { setEditingAccount(undefined); setSheetOpen(true); }
  function openEdit(acc: AccountResponse) { setEditingAccount(acc); setSheetOpen(true); }

  function handleDeactivate(acc: AccountResponse) { setDeactivateTarget(acc); }
  function handleDelete(acc: AccountResponse) { setDeleteTarget(acc); }

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    const target = deactivateTarget;
    setDeactivateTarget(null);
    setActionLoading(target.id);
    try { await deactivateMutation.mutateAsync(target.id); toast.success('Conta desativada.'); }
    catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao desativar conta.');
    }
    finally { setActionLoading(null); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setActionLoading(target.id);
    try { await deleteMutation.mutateAsync(target.id); toast.success('Conta excluída.'); }
    catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao excluir conta.');
    }
    finally { setActionLoading(null); }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <Card className="shadow-sm sm:col-span-2">
          <CardContent className="flex items-center gap-4 pb-4 pt-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Saldo total (contas ativas)</p>
              {isLoading
                ? <Skeleton className="mt-1 h-8 w-36" />
                : <p className={`text-3xl font-bold tabular-nums ${totalBalance < 0 ? 'text-rose-500' : 'text-slate-900'}`}>
                    {formatCurrency(totalBalance)}
                  </p>}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="flex flex-col justify-center pb-4 pt-5">
            <p className="mb-1 text-xs text-slate-400">Contas ativas</p>
            {isLoading
              ? <Skeleton className="h-8 w-12" />
              : <p className="text-3xl font-bold text-slate-900">{activeAccounts.length}</p>}
            <p className="mt-1 text-xs text-slate-400">{accounts.length} no total</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Contas ativas</h2>
        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={openCreate}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Nova conta
        </Button>
      </div>

      {/* Active accounts */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5">
              <div className="h-44 animate-pulse bg-slate-200" />
              <div className="bg-white px-4 py-2">
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : activeAccounts.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-200" />
            <p className="mb-3 text-sm text-slate-400">Nenhuma conta ativa ainda.</p>
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={openCreate}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Criar primeira conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeAccounts.map((acc) => (
            <BankCard
              key={acc.id}
              account={acc}
              onEdit={openEdit}
              onDeactivate={handleDeactivate}
              onDelete={handleDelete}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Inactive accounts */}
      {!isLoading && inactiveAccounts.length > 0 && (
        <>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Contas inativas</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inactiveAccounts.map((acc) => (
              <BankCard
                key={acc.id}
                account={acc}
                onEdit={openEdit}
                onDeactivate={handleDeactivate}
                onDelete={handleDelete}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        </>
      )}

      <AccountSheet open={sheetOpen} onOpenChange={setSheetOpen} account={editingAccount} />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(o) => { if (!o) setDeactivateTarget(null); }}
        title="Desativar conta?"
        description={<>A conta <strong>&ldquo;{deactivateTarget?.name}&rdquo;</strong> será marcada como inativa. Você poderá reativá-la depois.</>}
        confirmLabel="Desativar"
        variant="warning"
        onConfirm={confirmDeactivate}
        loading={actionLoading !== null}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Excluir conta?"
        description={<>A conta <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong> será excluída permanentemente. Esta ação não pode ser desfeita.</>}
        confirmLabel="Excluir permanentemente"
        onConfirm={confirmDelete}
        loading={actionLoading !== null}
      />
    </div>
  );
}
