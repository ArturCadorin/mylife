'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { ArrowLeft, Plus, Loader2, CheckCircle2, Clock, XCircle, Layers, Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DatePickerInput } from '@/components/ui/date-picker';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CardVisual } from '@/components/credit-cards/card-visual';
import {
  useCreditCard, useInvoice, useInvoices, useCreateCardTransaction, usePayInvoice, useAccounts,
  useDeleteCardTransaction,
} from '@/hooks/use-finance';
import {
  TRANSACTION_CATEGORY_LABELS,
  INVOICE_STATUS_LABELS,
  EXPENSE_CATEGORIES,
  type TransactionCategory,
  type InvoiceStatus,
  type InvoicePaymentRequest,
  type InvoiceResponse,
} from '@/types/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function localDateStr(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fmtMonthYear(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' })
    .format(new Date(y, m - 1, 1));
}

/** Mês/ano da 1ª parcela derivado do yearMonth da fatura e do número da parcela atual */
function calcStartMonth(invoiceYearMonth: string, installmentNumber: number): string {
  const [y, m] = invoiceYearMonth.split('-').map(Number);
  const start = new Date(y, m - 1 - (installmentNumber - 1), 1);
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(start);
}

/** Mês/ano da última parcela derivado do yearMonth da fatura e do número da parcela atual */
function calcEndMonth(invoiceYearMonth: string, installmentNumber: number, totalInstallments: number): string {
  const [y, m] = invoiceYearMonth.split('-').map(Number);
  const end = new Date(y, m - 1 + (totalInstallments - installmentNumber), 1);
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(end);
}

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Mês de faturamento atual para o cartão, usando a mesma lógica do backend */
function billingYearMonth(closingDay: number): string {
  const today = new Date();
  const d = today.getDate();
  // Se ainda não fechou (hoje <= dia de fechamento), fatura é do mês atual
  // Senão, a fatura atual é do próximo mês
  const base = d <= closingDay
    ? new Date(today.getFullYear(), today.getMonth(), 1)
    : new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const styles: Record<InvoiceStatus, string> = {
    OPEN:   'bg-blue-50 text-blue-700',
    CLOSED: 'bg-amber-50 text-amber-700',
    PAID:   'bg-emerald-50 text-emerald-700',
  };
  const icons: Record<InvoiceStatus, React.ReactNode> = {
    OPEN:   <Clock className="h-3 w-3" />,
    CLOSED: <XCircle className="h-3 w-3" />,
    PAID:   <CheckCircle2 className="h-3 w-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
      {icons[status]}{INVOICE_STATUS_LABELS[status]}
    </span>
  );
}

// ── Purchase form schema ───────────────────────────────────────────────────────

const purchaseSchema = z.object({
  description:       z.string().min(1, 'Informe a descrição').max(255),
  totalAmount:       z.coerce.number().positive('Valor inválido'),
  purchaseDate:      z.string().min(1, 'Informe a data'),
  category:          z.string().min(1, 'Selecione uma categoria'),
  totalInstallments: z.coerce.number().min(1).max(48).default(1),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

// ── Pay invoice schema ─────────────────────────────────────────────────────────

const paySchema = z.object({
  accountId:   z.coerce.number().min(1, 'Selecione a conta'),
  amount:      z.coerce.number().positive('Valor inválido'),
  paymentDate: z.string().min(1, 'Informe a data'),
});

type PayFormData = z.infer<typeof paySchema>;

// ── Pay invoice sheet ─────────────────────────────────────────────────────────

function PayInvoiceSheet({
  open,
  onOpenChange,
  invoice,
  cardId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoice: InvoiceResponse;
  cardId: number;
}) {
  const { data: accounts = [] } = useAccounts();
  const payMutation = usePayInvoice();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<PayFormData>({
    resolver: zodResolver(paySchema),
    defaultValues: { accountId: undefined, amount: invoice.totalAmount, paymentDate: localDateStr(new Date()) },
  });

  async function onSubmit(data: PayFormData) {
    try {
      await payMutation.mutateAsync({ invoiceId: invoice.id, req: { accountId: data.accountId, amount: data.amount, paymentDate: data.paymentDate } });
      toast.success('Pagamento registrado!');
      onOpenChange(false);
      reset();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao registrar pagamento.');
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-sm flex flex-col">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>Pagar fatura</SheetTitle>
          <SheetDescription>
            Fatura {invoice.yearMonth} — <strong>{formatCurrency(invoice.totalAmount)}</strong>
            {' '}· Vence {new Date(invoice.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
          </SheetDescription>
        </SheetHeader>

        <form className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Conta debitada</Label>
            <Controller name="accountId" control={control} render={({ field }) => (
              <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                <SelectTrigger className="w-full h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => <SelectItem key={acc.id} value={String(acc.id)}>{acc.name} — {acc.bankName}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
            {errors.accountId && <p className="text-xs text-red-500">{errors.accountId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payAmount">Valor pago (R$)</Label>
            <Controller name="amount" control={control} render={({ field }) => (
              <CurrencyInput id="payAmount" value={field.value} onChange={(v) => field.onChange(v ?? 0)} />
            )} />
            {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paymentDate">Data do pagamento</Label>
            <Controller name="paymentDate" control={control} render={({ field }) => (
              <DatePickerInput value={field.value} onChange={field.onChange} size="default" className="w-full" />
            )} />
            {errors.paymentDate && <p className="text-xs text-red-500">{errors.paymentDate.message}</p>}
          </div>
        </form>

        <SheetFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={payMutation.isPending}>Cancelar</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={payMutation.isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white">
            {payMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar pagamento
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = use(params);
  const cardId = Number(idStr);

  const [selectedYearMonth, setSelectedYearMonth] = useState(currentYearMonth());
  const [paySheetOpen, setPaySheetOpen] = useState(false);
  const [historyInitialized, setHistoryInitialized] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ transactionId: number; description: string; totalInstallments: number } | null>(null);

  const { data: card, isLoading: cardLoading } = useCreditCard(cardId);
  const { data: invoice, isLoading: invoiceLoading, refetch: refetchInvoice } = useInvoice(cardId, selectedYearMonth);
  const { data: history = [], isLoading: historyLoading } = useInvoices(cardId);

  // Auto-seleciona o mês de faturamento atual na primeira carga do histórico
  // Prioridade: mês atual do cartão → mais recente com dados
  useEffect(() => {
    if (!historyInitialized && history.length > 0 && card) {
      const billing = billingYearMonth(card.closingDay);
      const hasBilling = history.some((h) => h.yearMonth === billing);
      if (hasBilling) {
        setSelectedYearMonth(billing);
      } else {
        const sorted = [...history].sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
        setSelectedYearMonth(sorted[0].yearMonth);
      }
      setHistoryInitialized(true);
    }
  }, [history, historyInitialized, card]);
  const createTxMutation = useCreateCardTransaction();
  const deleteTxMutation = useDeleteCardTransaction();

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { description: '', totalAmount: undefined, purchaseDate: localDateStr(new Date()), category: '', totalInstallments: 1 },
  });

  const totalInstallments = watch('totalInstallments') || 1;
  const totalAmount = watch('totalAmount') || 0;
  const installmentValue = totalInstallments > 1 ? totalAmount / totalInstallments : 0;

  async function onSubmitPurchase(data: PurchaseFormData) {
    try {
      await createTxMutation.mutateAsync({
        cardId,
        req: {
          description: data.description,
          totalAmount: data.totalAmount,
          purchaseDate: data.purchaseDate,
          category: data.category as TransactionCategory,
          totalInstallments: data.totalInstallments,
        },
      });
      toast.success('Compra lançada!');
      reset({ description: '', totalAmount: undefined, purchaseDate: localDateStr(new Date()), category: '', totalInstallments: 1 });
      if (selectedYearMonth === currentYearMonth()) refetchInvoice();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao lançar compra.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/finance/credit-cards" className={buttonVariants({ variant: "ghost", size: "sm", className: "text-slate-500 -ml-2" })}><ArrowLeft className="h-4 w-4 mr-1" />Cartões</Link>

      {/* Card visual */}
      {cardLoading ? (
        <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
          <div className="h-52 animate-pulse bg-slate-200" />
          <div className="bg-white px-4 py-3 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-1.5 w-full animate-pulse rounded-full bg-slate-100" />
            <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ) : card ? (
        <CardVisual card={card} showUsage />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Invoice selector */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">Fatura</CardTitle>
                {!historyLoading && history.length > 0 && (
                  <select
                    value={selectedYearMonth}
                    onChange={(e) => setSelectedYearMonth(e.target.value)}
                    className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    {history.map((inv) => (
                      <option key={inv.yearMonth} value={inv.yearMonth}>
                        {fmtMonthYear(inv.yearMonth)} — {formatCurrency(inv.totalAmount)}
                      </option>
                    ))}
                    {!history.find((h) => h.yearMonth === currentYearMonth()) && (
                      <option value={currentYearMonth()}>Mês atual</option>
                    )}
                  </select>
                )}
              </div>
              {invoice && invoice.status !== 'PAID' && (
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={() => setPaySheetOpen(true)}
                >
                  Pagar fatura
                </Button>
              )}
            </CardHeader>

            <CardContent>
              {invoiceLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <Skeleton className="h-3.5 w-40" />
                      <div className="flex-1" />
                      <Skeleton className="h-3.5 w-20" />
                    </div>
                  ))}
                </div>
              ) : !invoice ? (
                <p className="py-8 text-center text-sm text-slate-400">Nenhuma fatura encontrada para este período.</p>
              ) : (
                <div className="space-y-4">
                  {/* Invoice summary */}
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-xs text-slate-400">Total da fatura</p>
                      <p className="text-xl font-bold tabular-nums text-slate-800">{formatCurrency(invoice.totalAmount)}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <StatusBadge status={invoice.status} />
                      <p className="text-xs text-slate-400">
                        Vence {new Date(invoice.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Transactions */}
                  {invoice.transactions.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-400">Nenhuma compra nesta fatura.</p>
                  ) : (
                    <div className="space-y-1">
                      {invoice.transactions.map((tx) => {
                        const isParcelado = tx.totalInstallments > 1;
                        const startMonth = calcStartMonth(invoice.yearMonth, tx.installmentNumber);
                        const endMonth   = calcEndMonth(invoice.yearMonth, tx.installmentNumber, tx.totalInstallments);
                        const pct        = Math.round((tx.installmentNumber / tx.totalInstallments) * 100);
                        const canDelete  = invoice.status !== 'PAID';
                        return (
                          <div key={tx.id} className="group rounded-xl border border-slate-100 dark:border-white/6 bg-slate-50/60 dark:bg-white/3 px-3 py-2.5 hover:bg-slate-100/70 dark:hover:bg-white/5 transition-colors">
                            {/* Linha 1: descrição + parcela badge + valor + botão excluir */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                  {tx.description}
                                </p>
                                {isParcelado && (
                                  <span className="shrink-0 inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300">
                                    {tx.installmentNumber}/{tx.totalInstallments}x
                                  </span>
                                )}
                              </div>
                              <div className="shrink-0 flex items-start gap-2">
                                <div className="text-right">
                                  <span className="text-sm font-bold tabular-nums text-rose-500 dark:text-rose-400">
                                    {formatCurrency(tx.installmentAmount)}
                                  </span>
                                  {isParcelado && (
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
                                      total {formatCurrency(tx.totalAmount)}
                                    </p>
                                  )}
                                </div>
                                {canDelete && (
                                  <button
                                    onClick={() => setDeleteConfirm({ transactionId: tx.id, description: tx.description, totalInstallments: tx.totalInstallments })}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 rounded p-0.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                    title="Excluir lançamento"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Linha 2: categoria + data */}
                            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                              {TRANSACTION_CATEGORY_LABELS[tx.category]}
                              {' · '}
                              {new Date(tx.purchaseDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </p>

                            {/* Linha 3: detalhe de parcelamento */}
                            {isParcelado && (
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                                  <span>Início: <strong className="text-slate-600 dark:text-slate-300">{startMonth}</strong></span>
                                  <span>Término: <strong className={tx.lastInstallment ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}>{endMonth}</strong></span>
                                </div>
                                <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                                  <div
                                    className={`h-1 rounded-full transition-all ${tx.lastInstallment ? 'bg-emerald-500' : 'bg-violet-400'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {tx.installmentNumber === tx.totalInstallments
                                    ? '✅ Última parcela'
                                    : `${tx.totalInstallments - tx.installmentNumber} parcela${tx.totalInstallments - tx.installmentNumber !== 1 ? 's' : ''} restante${tx.totalInstallments - tx.installmentNumber !== 1 ? 's' : ''}`}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parcelamentos em andamento */}
          {invoice && (() => {
            const parcelas = invoice.transactions.filter((t) => t.totalInstallments > 1);
            if (parcelas.length === 0) return null;
            return (
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/15">
                      <Layers className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <CardTitle className="text-base">Parcelamentos em andamento</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {parcelas.map((tx) => {
                    const startMonth = calcStartMonth(invoice.yearMonth, tx.installmentNumber);
                    const endMonth   = calcEndMonth(invoice.yearMonth, tx.installmentNumber, tx.totalInstallments);
                    const pct        = Math.round((tx.installmentNumber / tx.totalInstallments) * 100);
                    const remaining  = tx.totalInstallments - tx.installmentNumber;
                    return (
                      <div key={tx.id} className="rounded-xl border border-violet-100 dark:border-violet-500/15 bg-violet-50/40 dark:bg-violet-500/5 p-3">
                        {/* Linha 1: descrição + progresso */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{tx.description}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{TRANSACTION_CATEGORY_LABELS[tx.category]}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-500/20 px-2 py-0.5 text-xs font-bold text-violet-700 dark:text-violet-300">
                              {tx.installmentNumber}/{tx.totalInstallments}x
                            </span>
                            <p className="mt-1 text-sm font-bold tabular-nums text-rose-500 dark:text-rose-400">
                              {formatCurrency(tx.installmentAmount)}<span className="text-xs font-normal text-slate-400">/mês</span>
                            </p>
                          </div>
                        </div>

                        {/* Barra de progresso */}
                        <div className="mt-2.5 space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span>Início: <strong className="text-slate-700 dark:text-slate-200">{startMonth}</strong></span>
                            <span>Término: <strong className={tx.lastInstallment ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}>{endMonth}</strong></span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-violet-200/60 dark:bg-violet-500/20">
                            <div
                              className={`h-2 rounded-full transition-all ${tx.lastInstallment ? 'bg-emerald-500' : 'bg-violet-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                            <span>{pct}% pago · total {formatCurrency(tx.totalAmount)}</span>
                            <span>{tx.lastInstallment ? '✅ Última parcela' : `${remaining} restante${remaining !== 1 ? 's' : ''}`}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })()}

          {/* Invoice history */}
          {!historyLoading && history.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Histórico de faturas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {history.map((inv) => (
                  <button
                    key={inv.yearMonth}
                    onClick={() => setSelectedYearMonth(inv.yearMonth)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      selectedYearMonth === inv.yearMonth ? 'bg-slate-100 dark:bg-white/8' : 'hover:bg-slate-50 dark:hover:bg-white/4'
                    }`}
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-200">{fmtMonthYear(inv.yearMonth)}</span>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={inv.status} />
                      <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(inv.totalAmount)}</span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Purchase form */}
        <div>
          <Card className="shadow-sm sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-500" /> Lançar compra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmitPurchase)} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-description">Descrição</Label>
                  <Input id="p-description" placeholder="Ex: Supermercado" {...register('description')} />
                  {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-amount">Valor (R$)</Label>
                  <Controller name="totalAmount" control={control} render={({ field }) => (
                    <CurrencyInput id="p-amount" value={field.value} onChange={(v) => field.onChange(v ?? 0)} />
                  )} />
                  {errors.totalAmount && <p className="text-xs text-red-500">{errors.totalAmount.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-date">Data</Label>
                  <Controller name="purchaseDate" control={control} render={({ field }) => (
                    <DatePickerInput value={field.value} onChange={field.onChange} size="default" className="w-full" />
                  )} />
                </div>

                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Controller name="category" control={control} render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{TRANSACTION_CATEGORY_LABELS[cat]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                  {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-installments">Parcelas</Label>
                  <Input id="p-installments" type="number" min="1" max="48" {...register('totalInstallments')} />
                  {installmentValue > 0 && (
                    <p className="text-xs text-slate-400">{totalInstallments}x de {formatCurrency(installmentValue)}</p>
                  )}
                </div>

                <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" disabled={createTxMutation.isPending}>
                  {createTxMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Lançar compra
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pay invoice sheet */}
      {invoice && (
        <PayInvoiceSheet
          open={paySheetOpen}
          onOpenChange={setPaySheetOpen}
          invoice={invoice}
          cardId={cardId}
        />
      )}

      {/* Delete transaction confirm */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(v) => { if (!v) setDeleteConfirm(null); }}
        title="Excluir lançamento"
        description={
          deleteConfirm
            ? deleteConfirm.totalInstallments > 1
              ? `Isso irá excluir "${deleteConfirm.description}" e todas as ${deleteConfirm.totalInstallments} parcelas ainda não pagas. Esta ação não pode ser desfeita.`
              : `Tem certeza que deseja excluir "${deleteConfirm.description}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={async () => {
          if (!deleteConfirm) return;
          try {
            await deleteTxMutation.mutateAsync({ cardId, transactionId: deleteConfirm.transactionId });
            toast.success('Lançamento excluído.');
            setDeleteConfirm(null);
          } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Erro ao excluir lançamento.');
          }
        }}
      />
    </div>
  );
}
