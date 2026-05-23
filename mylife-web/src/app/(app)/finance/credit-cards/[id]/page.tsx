'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { ArrowLeft, Plus, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePickerInput } from '@/components/ui/date-picker';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';

import {
  useCreditCard, useInvoice, useInvoices, useCreateCardTransaction, usePayInvoice, useAccounts,
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

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function lightenColor(hex: string, factor: number): string {
  const clean = (hex.startsWith('#') ? hex.slice(1) : hex).padEnd(6, '0');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const nr = Math.round(r + (255 - r) * factor);
  const ng = Math.round(g + (255 - g) * factor);
  const nb = Math.round(b + (255 - b) * factor);
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
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
    } catch {
      toast.error('Erro ao registrar pagamento.');
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
            <Input id="payAmount" type="number" step="0.01" {...register('amount')} />
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

  const { data: card, isLoading: cardLoading } = useCreditCard(cardId);
  const { data: invoice, isLoading: invoiceLoading, refetch: refetchInvoice } = useInvoice(cardId, selectedYearMonth);
  const { data: history = [], isLoading: historyLoading } = useInvoices(cardId);
  const createTxMutation = useCreateCardTransaction();

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
    } catch {
      toast.error('Erro ao lançar compra.');
    }
  }

  const color = card?.color ? (card.color.startsWith('#') ? card.color : `#${card.color}`) : '#1E3A5F';
  const colorLight = lightenColor(color, 0.3);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/finance/credit-cards" className={buttonVariants({ variant: "ghost", size: "sm", className: "text-slate-500 -ml-2" })}><ArrowLeft className="h-4 w-4 mr-1" />Cartões</Link>

      {/* Card header */}
      {cardLoading ? (
        <div className="h-36 rounded-xl bg-slate-200 animate-pulse" />
      ) : card ? (
        <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: `linear-gradient(135deg, ${color} 0%, ${colorLight} 100%)` }}>
          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wide">{card.bankName ?? 'Cartão'}</p>
                <p className="text-white font-bold text-2xl mt-1">{card.name}</p>
                <p className="text-white/60 text-sm mt-1 font-mono tracking-widest">•••• •••• •••• {card.lastFourDigits}</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs">Fatura atual</p>
                <p className="text-white font-bold text-xl tabular-nums mt-0.5">{formatCurrency(card.currentInvoiceTotal)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-white/80">
              <span>Disponível: <strong className="text-white">{formatCurrency(card.availableLimit)}</strong></span>
              <span>Limite: <strong className="text-white">{formatCurrency(card.totalLimit)}</strong></span>
              <span>Fecha dia <strong className="text-white">{card.closingDay}</strong></span>
              <span>Vence dia <strong className="text-white">{card.dueDay}</strong></span>
            </div>
          </div>
        </div>
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
                        {inv.yearMonth} — {formatCurrency(inv.totalAmount)}
                      </option>
                    ))}
                    {!history.find((h) => h.yearMonth === currentYearMonth()) && (
                      <option value={currentYearMonth()}>Atual</option>
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
                      {invoice.transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center gap-3 py-2 rounded-lg hover:bg-slate-50 px-2 -mx-2 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {tx.description}
                              {tx.totalInstallments > 1 && (
                                <span className="ml-1 text-xs text-slate-400">({tx.installmentNumber}/{tx.totalInstallments}x)</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">
                              {TRANSACTION_CATEGORY_LABELS[tx.category]} · {new Date(tx.purchaseDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <span className="text-sm font-semibold tabular-nums text-rose-500 shrink-0">
                            {formatCurrency(tx.installmentAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

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
                      selectedYearMonth === inv.yearMonth ? 'bg-slate-100' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-medium text-slate-700">{inv.yearMonth}</span>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={inv.status} />
                      <span className="tabular-nums font-semibold text-slate-800">{formatCurrency(inv.totalAmount)}</span>
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
                  <Input id="p-amount" type="number" step="0.01" placeholder="0,00" {...register('totalAmount')} />
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
    </div>
  );
}
