'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, PiggyBank, Pencil, Trash2, Loader2, ArrowDownToLine, ArrowUpFromLine, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SavingsSheet } from '@/components/savings/savings-sheet';
import { EntrySheet } from '@/components/savings/entry-sheet';
import { useSavings, useDeleteSavings } from '@/hooks/use-finance';
import type { SavingsResponse, SavingsEntryType } from '@/types/api';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function progressColor(pct: number | null): string {
  if (pct === null) return 'bg-emerald-400';
  if (pct >= 75) return 'bg-emerald-500';
  if (pct >= 25) return 'bg-amber-400';
  return 'bg-slate-300';
}

interface SavingsCardProps {
  savings: SavingsResponse;
  onEdit: (s: SavingsResponse) => void;
  onEntry: (s: SavingsResponse, type: SavingsEntryType) => void;
  onDelete: (s: SavingsResponse) => void;
  deleting: boolean;
}

function SavingsCard({ savings, onEdit, onEntry, onDelete, deleting }: SavingsCardProps) {
  const pct = savings.percentualDaMeta;
  const hasCdi = savings.cdiRate !== null && savings.currentCdiValue !== null;
  const effectiveRate = hasCdi ? (savings.cdiRate! * savings.currentCdiValue! / 100) : 0;

  return (
    <Card className="shadow-sm flex flex-col interactive-card">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
              pct !== null && pct >= 75 ? 'bg-emerald-100' : pct !== null && pct >= 25 ? 'bg-amber-100' : 'bg-slate-100'
            }`}>
              <PiggyBank className={`h-5 w-5 ${
                pct !== null && pct >= 75 ? 'text-emerald-600' : pct !== null && pct >= 25 ? 'text-amber-500' : 'text-slate-400'
              }`} />
            </div>
            <div>
              <Link href={`/savings/${savings.id}`} className="text-sm font-semibold text-slate-800 hover:text-emerald-600 transition-colors line-clamp-1">
                {savings.name}
              </Link>
              {savings.description && (
                <p className="text-xs text-slate-400 line-clamp-1">{savings.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-0.5 shrink-0">
            <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-slate-400 hover:text-slate-600" onClick={() => onEdit(savings)} title="Editar">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-slate-400 hover:text-rose-500" onClick={() => onDelete(savings)} disabled={deleting} title="Excluir">
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pt-0">
        {/* Amounts */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Saldo atual</p>
            <p className="text-xl font-bold tabular-nums text-slate-800">{formatCurrency(savings.currentAmount)}</p>
          </div>
          {savings.targetAmount && (
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-0.5">Meta</p>
              <p className="text-sm font-semibold text-slate-500 tabular-nums">{formatCurrency(savings.targetAmount)}</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {savings.targetAmount && pct !== null && (
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full transition-all ${progressColor(pct)}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">{Math.round(pct)}% da meta</p>
          </div>
        )}

        {/* CDI info */}
        {hasCdi ? (
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
            <span>{savings.cdiRate}% do CDI</span>
            <span>·</span>
            <span>Taxa efetiva: <strong className="text-slate-600">{effectiveRate.toFixed(2)}%</strong> a.a.</span>
            {savings.estimatedReturn > 0 && (
              <>
                <span>·</span>
                <span className="text-emerald-600 font-medium">+{formatCurrency(savings.estimatedReturn)}/mês</span>
              </>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Sem rendimento CDI — depósitos manuais</p>
        )}

        {/* Linked account */}
        {savings.linkedAccountName && (
          <p className="text-xs text-slate-400">Conta: <span className="text-slate-600">{savings.linkedAccountName}</span></p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs h-8"
            onClick={() => onEntry(savings, 'DEPOSIT')}
          >
            <ArrowDownToLine className="h-3.5 w-3.5 mr-1" /> Depositar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-rose-500 border-rose-200 hover:bg-rose-50 text-xs h-8"
            onClick={() => onEntry(savings, 'WITHDRAWAL')}
          >
            <ArrowUpFromLine className="h-3.5 w-3.5 mr-1" /> Retirar
          </Button>
          <Link href={`/savings/${savings.id}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "text-slate-400 hover:text-slate-600 h-8 px-2" })}><ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SavingsPage() {
  const { data: savingsList = [], isLoading } = useSavings();
  const deleteMutation = useDeleteSavings();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingSavings, setEditingSavings] = useState<SavingsResponse | undefined>();

  const [entrySheetOpen, setEntrySheetOpen] = useState(false);
  const [entryTarget, setEntryTarget] = useState<SavingsResponse | null>(null);
  const [entryType, setEntryType] = useState<SavingsEntryType>('DEPOSIT');

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavingsResponse | null>(null);

  const totalSavings = savingsList.reduce((s, item) => s + item.currentAmount, 0);
  const totalReturn  = savingsList.reduce((s, item) => s + (item.estimatedReturn ?? 0), 0);

  function openCreate() { setEditingSavings(undefined); setSheetOpen(true); }
  function openEdit(s: SavingsResponse) { setEditingSavings(s); setSheetOpen(true); }

  function openEntry(s: SavingsResponse, type: SavingsEntryType) {
    setEntryTarget(s);
    setEntryType(type);
    setEntrySheetOpen(true);
  }

  function handleDelete(s: SavingsResponse) {
    setDeleteTarget(s);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(target.id);
    try {
      await deleteMutation.mutateAsync(target.id);
      toast.success('Cofrinho excluído.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao excluir cofrinho.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        <Card className="shadow-sm sm:col-span-2">
          <CardContent className="flex items-center gap-4 pt-5 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 shrink-0">
              <PiggyBank className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total em cofrinhos</p>
              {isLoading
                ? <Skeleton className="h-8 w-36 mt-1" />
                : <p className="text-3xl font-bold tabular-nums text-slate-900">{formatCurrency(totalSavings)}</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex flex-col justify-center pt-5 pb-4">
            <p className="text-xs text-slate-400 mb-1">Rendimento estimado</p>
            {isLoading
              ? <Skeleton className="h-7 w-24" />
              : <p className="text-xl font-bold text-emerald-600 tabular-nums">+{formatCurrency(totalReturn)}<span className="text-xs text-slate-400 font-normal ml-1">/mês</span></p>}
            <p className="text-xs text-slate-400 mt-1">{savingsList.length} cofrinho(s)</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Seus cofrinhos</h2>
        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Novo cofrinho
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-3 w-48" />
                <div className="flex gap-2"><Skeleton className="h-8 flex-1" /><Skeleton className="h-8 flex-1" /></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : savingsList.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <PiggyBank className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm text-slate-400 mb-3">Nenhum cofrinho criado ainda.</p>
            <p className="text-xs text-slate-300 mb-4">Crie cofrinhos para guardar dinheiro com objetivos e acompanhar o rendimento.</p>
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Criar primeiro cofrinho
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savingsList.map((s) => (
            <SavingsCard
              key={s.id}
              savings={s}
              onEdit={openEdit}
              onEntry={openEntry}
              onDelete={handleDelete}
              deleting={deletingId === s.id}
            />
          ))}
        </div>
      )}

      <SavingsSheet open={sheetOpen} onOpenChange={setSheetOpen} savings={editingSavings} />
      {entryTarget && (
        <EntrySheet
          open={entrySheetOpen}
          onOpenChange={setEntrySheetOpen}
          savingsId={entryTarget.id}
          savingsName={entryTarget.name}
          currentAmount={entryTarget.currentAmount}
          defaultType={entryType}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Excluir cofrinho?"
        description={
          <>
            O cofrinho <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong> será excluído permanentemente.
            {deleteTarget && deleteTarget.currentAmount > 0 && (
              <span className="mt-2 block text-amber-600 font-medium">
                ⚠ Saldo de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deleteTarget.currentAmount)} ainda em carteira.
              </span>
            )}
          </>
        }
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        loading={deletingId !== null}
      />
    </div>
  );
}
