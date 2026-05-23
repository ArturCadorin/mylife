'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Receipt, FileText } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import {
  SheetLayout, SheetInput, SheetCurrencyInput, SheetSelectTrigger,
  SheetDatePicker, FieldLabel, SectionDivider,
} from '@/components/ui/sheet-primitives';

import { useCreateTransaction, useUpdateTransaction, useAccounts } from '@/hooks/use-finance';
import {
  TRANSACTION_CATEGORY_LABELS,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  RECURRENCE_FREQUENCY_LABELS,
  type TransactionResponse,
  type TransactionType,
  type TransactionCategory,
  type RecurrenceType,
  type RecurrenceFrequency,
} from '@/types/api';

const schema = z.object({
  type:                    z.enum(['INCOME', 'EXPENSE']),
  category:                z.string().min(1, 'Selecione uma categoria'),
  amount:                  z.coerce.number().positive('Valor inválido'),
  date:                    z.string().min(1, 'Informe a data'),
  description:             z.string().min(1, 'Informe a descrição').max(255),
  accountId:               z.coerce.number().min(1, 'Selecione uma conta'),
  note:                    z.string().optional(),
  recurrenceType:          z.enum(['NONE', 'AUTOMATIC', 'MANUAL']),
  recurrenceFrequency:     z.string().optional(),
  recurrenceEndDate:       z.string().optional(),
  updateFutureRecurrences: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: TransactionResponse;
  defaultType?: TransactionType;
}

function localDateStr(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function TransactionSheet({ open, onOpenChange, transaction, defaultType }: Props) {
  const isEdit = !!transaction;
  const { data: accounts = [] } = useAccounts();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const { register, handleSubmit, control, watch, setValue, setError, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: defaultType ?? 'EXPENSE',
      category: '',
      amount: undefined,
      date: localDateStr(new Date()),
      description: '',
      accountId: undefined,
      note: '',
      recurrenceType: 'NONE',
      recurrenceFrequency: '',
      recurrenceEndDate: '',
      updateFutureRecurrences: false,
    },
  });

  const currentType    = watch('type');
  const recurrenceType = watch('recurrenceType');
  const filteredCategories = currentType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const tint = currentType === 'INCOME' ? 'emerald' : 'rose';

  useEffect(() => {
    if (open) {
      reset(transaction
        ? {
            type: transaction.type, category: transaction.category, amount: transaction.amount,
            date: transaction.date, description: transaction.description, accountId: transaction.accountId,
            note: transaction.note ?? '', recurrenceType: transaction.recurrenceType,
            recurrenceFrequency: transaction.recurrenceFrequency ?? '', recurrenceEndDate: '',
            updateFutureRecurrences: false,
          }
        : {
            type: defaultType ?? 'EXPENSE', category: '', amount: undefined,
            date: localDateStr(new Date()), description: '', accountId: undefined,
            note: '', recurrenceType: 'NONE', recurrenceFrequency: '', recurrenceEndDate: '',
            updateFutureRecurrences: false,
          }
      );
    }
  }, [open, transaction, defaultType, reset]);

  useEffect(() => {
    if (!isEdit) setValue('category', '');
  }, [currentType, isEdit, setValue]);

  async function onSubmit(data: FormData) {
    // Frequency required for recurring transactions
    if (data.recurrenceType !== 'NONE' && !data.recurrenceFrequency) {
      setError('recurrenceFrequency', { message: 'Selecione a frequência de repetição' });
      return;
    }
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: transaction!.id,
          req: {
            description: data.description, amount: data.amount,
            category: data.category as TransactionCategory, date: data.date,
            note: data.note || undefined,
            updateFutureRecurrences: data.updateFutureRecurrences ?? false,
          },
        });
        toast.success('Transação atualizada!');
      } else {
        await createMutation.mutateAsync({
          type: data.type as TransactionType,
          category: data.category as TransactionCategory,
          amount: data.amount, date: data.date, description: data.description,
          accountId: data.accountId, note: data.note || undefined,
          recurrenceType: data.recurrenceType as RecurrenceType,
          recurrenceFrequency: data.recurrenceType !== 'NONE'
            ? (data.recurrenceFrequency as RecurrenceFrequency) : undefined,
          recurrenceEndDate: data.recurrenceType === 'AUTOMATIC' && data.recurrenceEndDate
            ? data.recurrenceEndDate : undefined,
        });
        toast.success('Transação criada!');
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao salvar transação. Tente novamente.');
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <SheetLayout
      open={open} onOpenChange={onOpenChange}
      tint={tint}
      icon={<Receipt className="h-5 w-5" />}
      title={isEdit ? 'Editar transação' : 'Nova transação'}
      subtitle={isEdit ? 'Altere os dados da transação.' : 'Preencha os dados para registrar.'}
      ctaLabel={isEdit ? 'Salvar' : 'Criar'}
      onSubmit={handleSubmit(onSubmit)}
      isPending={isPending}
    >
      {!isEdit && (
        <Controller name="type" control={control} render={({ field }) => (
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
            {(['INCOME', 'EXPENSE'] as TransactionType[]).map((t) => (
              <button key={t} type="button" onClick={() => field.onChange(t)}
                className={`rounded-xl py-2.5 text-xs font-semibold transition-all ${field.value === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t === 'INCOME' ? 'Receita' : 'Despesa'}
              </button>
            ))}
          </div>
        )} />
      )}

      <SectionDivider label="Detalhes" />

      <div className="space-y-1.5">
        <FieldLabel>Descrição</FieldLabel>
        <SheetInput id="description" placeholder="Ex: Almoço no restaurante" icon={<FileText className="h-3.5 w-3.5" />} {...register('description')} />
        {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Valor</FieldLabel>
        <Controller name="amount" control={control} render={({ field }) => (
          <SheetCurrencyInput id="amount" placeholder="0,00" value={field.value} onChange={field.onChange} />
        )} />
        {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Data</FieldLabel>
        <Controller name="date" control={control} render={({ field }) => (
          <SheetDatePicker value={field.value} onChange={field.onChange} />
        )} />
        {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Categoria</FieldLabel>
        <Controller name="category" control={control} render={({ field }) => (
          <Select value={field.value || undefined} onValueChange={field.onChange}>
            <SheetSelectTrigger><SelectValue placeholder="Selecione..." /></SheetSelectTrigger>
            <SelectContent>
              {filteredCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>{TRANSACTION_CATEGORY_LABELS[cat]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )} />
        {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
      </div>

      {!isEdit && (
        <div className="space-y-1.5">
          <FieldLabel>Conta</FieldLabel>
          <Controller name="accountId" control={control} render={({ field }) => (
            <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
              <SheetSelectTrigger><SelectValue placeholder="Selecione..." /></SheetSelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={String(acc.id)}>{acc.name} — {acc.bankName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
          {errors.accountId && <p className="text-xs text-red-500">{errors.accountId.message}</p>}
        </div>
      )}

      <div className="space-y-1.5">
        <FieldLabel>Observação <span className="normal-case font-normal text-slate-400">(opcional)</span></FieldLabel>
        <SheetInput id="note" placeholder="Alguma anotação?" icon={<FileText className="h-3.5 w-3.5" />} {...register('note')} />
      </div>

      {!isEdit && (
        <>
          <SectionDivider label="Recorrência" />

          <div className="space-y-1.5">
            <FieldLabel>Tipo</FieldLabel>
            <Controller name="recurrenceType" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SheetSelectTrigger><SelectValue /></SheetSelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Sem recorrência</SelectItem>
                  <SelectItem value="AUTOMATIC">Automática</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>

          {recurrenceType !== 'NONE' && (
            <>
              <div className="space-y-1.5">
                <FieldLabel>Frequência</FieldLabel>
                <Controller name="recurrenceFrequency" control={control} render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SheetSelectTrigger><SelectValue placeholder="Selecione..." /></SheetSelectTrigger>
                    <SelectContent>
                      {(Object.entries(RECURRENCE_FREQUENCY_LABELS) as [RecurrenceFrequency, string][]).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                {errors.recurrenceFrequency && <p className="text-xs text-red-500">{errors.recurrenceFrequency.message}</p>}
              </div>

              {recurrenceType === 'AUTOMATIC' && (
                <div className="space-y-1.5">
                  <FieldLabel>Data final <span className="normal-case font-normal text-slate-400">(opcional)</span></FieldLabel>
                  <Controller name="recurrenceEndDate" control={control} render={({ field }) => (
                    <SheetDatePicker value={field.value ?? ''} onChange={field.onChange} />
                  )} />
                </div>
              )}

              {recurrenceType === 'MANUAL' && (
                <p className="text-xs text-slate-400 -mt-1">
                  Recorrência manual: você confirma cada nova ocorrência manualmente na tela de recorrências pendentes.
                </p>
              )}
            </>
          )}
        </>
      )}

      {isEdit && transaction?.recurrenceType !== 'NONE' && (
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" {...register('updateFutureRecurrences')} className="rounded" />
          Atualizar ocorrências futuras também
        </label>
      )}
    </SheetLayout>
  );
}
