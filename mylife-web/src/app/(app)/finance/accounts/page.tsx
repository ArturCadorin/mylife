'use client';

import { useState, useMemo } from 'react';
import { Plus, Building2, Wallet, Pencil, PowerOff, Trash2, Loader2, PiggyBank } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AccountSheet } from '@/components/accounts/account-sheet';
import { useAccounts, useDeactivateAccount, useDeleteAccount, useSavings } from '@/hooks/use-finance';
import { ACCOUNT_TYPE_LABELS, type AccountResponse, type SavingsResponse } from '@/types/api';
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
  const { data: savings = [], isLoading: savingsLoading } = useSavings();
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
  const totalSavings     = savings.reduce((sum, s) => sum + s.currentAmount, 0);

  /* Group savings by linked account */
  const savingsGroups = useMemo(() => {
    const map = new Map<number | null, { accountId: number | null; accountName: string | null; items: SavingsResponse[] }>();
    for (const s of savings) {
      const key = s.linkedAccountId ?? null;
      if (!map.has(key)) {
        map.set(key, { accountId: key, accountName: s.linkedAccountName, items: [] });
      }
      map.get(key)!.items.push(s);
    }
    return [...map.values()].sort((a, b) => {
      if (a.accountId === null) return 1;
      if (b.accountId === null) return -1;
      return (a.accountName ?? '').localeCompare(b.accountName ?? '');
    });
  }, [savings]);

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
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-4">
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

        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 pb-4 pt-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-500/15">
              <PiggyBank className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-400">Total cofrinhos</p>
              {savingsLoading
                ? <Skeleton className="h-7 w-24" />
                : <p className="text-2xl font-bold tabular-nums text-violet-700 dark:text-violet-300">
                    {formatCurrency(totalSavings)}
                  </p>}
              <p className="mt-0.5 text-xs text-slate-400">{savings.length} cofrinho(s)</p>
            </div>
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

      {/* ── Cofrinhos por conta ──────────────────────────────── */}
      {!savingsLoading && savings.length > 0 && (
        <>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cofrinhos por conta</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savingsGroups.map(({ accountId, accountName, items }) => {
              const groupTotal = items.reduce((s, i) => s + i.currentAmount, 0);
              return (
                <Card key={accountId ?? 'unlinked'} className="shadow-sm">
                  <CardHeader className="px-5 pb-2 pt-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/15">
                        <PiggyBank className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-sm">
                          {accountName ?? 'Sem conta vinculada'}
                        </CardTitle>
                        <p className="text-xs text-slate-400 tabular-nums">{formatCurrency(groupTotal)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 px-5 pb-5">
                    {items.map((s) => {
                      const hasTarget = s.targetAmount != null && s.targetAmount > 0;
                      const pct = hasTarget && s.percentualDaMeta != null
                        ? Math.min(s.percentualDaMeta, 100)
                        : null;
                      return (
                        <div key={s.id}>
                          <div className="mb-1 flex items-baseline justify-between">
                            <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-300">{s.name}</p>
                            {pct !== null
                              ? <span className={`ml-2 shrink-0 text-xs font-bold ${pct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-violet-500 dark:text-violet-400'}`}>
                                  {Math.round(pct)}%
                                </span>
                              : <span className="ml-2 shrink-0 text-xs italic text-slate-400">sem meta</span>
                            }
                          </div>
                          {hasTarget && (
                            <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all"
                                style={{ width: `${pct ?? 0}%` }}
                              />
                            </div>
                          )}
                          <p className="text-xs text-slate-500">
                            {formatCurrency(s.currentAmount)}
                            {hasTarget && s.targetAmount != null && (
                              <span className="text-slate-300 dark:text-slate-600"> / {formatCurrency(s.targetAmount)}</span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {savingsLoading && (
        <>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Cofrinhos por conta</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="px-5 pb-5 pt-4 space-y-3">
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
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
