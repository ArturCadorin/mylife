'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PiggyBank, FileText } from 'lucide-react';

import {
  SheetLayout, SheetInput, SheetCurrencyInput, SheetDatePicker,
  FieldLabel, SectionDivider,
} from '@/components/ui/sheet-primitives';
import { useAddSavingsEntry } from '@/hooks/use-finance';
import type { SavingsEntryType } from '@/types/api';

function localDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savingsId: number;
  savingsName: string;
  currentAmount: number;
  defaultType?: SavingsEntryType;
}

export function EntrySheet({ open, onOpenChange, savingsId, savingsName, currentAmount, defaultType = 'DEPOSIT' }: Props) {
  const addMutation = useAddSavingsEntry();

  const schema = z.object({
    type:   z.enum(['DEPOSIT', 'WITHDRAWAL']),
    amount: z.coerce.number().positive('Valor deve ser maior que zero'),
    date:   z.string().min(1, 'Informe a data'),
    note:   z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.type === 'WITHDRAWAL' && data.amount > currentAmount) {
      ctx.addIssue({ code: 'custom', path: ['amount'], message: `Saldo disponível: R$ ${currentAmount.toFixed(2).replace('.', ',')}` });
    }
  });

  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: defaultType, amount: undefined, date: localDateStr(new Date()), note: '' },
  });

  const currentType = watch('type');
  const tint = currentType === 'DEPOSIT' ? 'emerald' : 'rose';
  const ctaLabel = currentType === 'DEPOSIT' ? 'Depositar' : 'Retirar';

  useEffect(() => {
    if (open) reset({ type: defaultType, amount: undefined, date: localDateStr(new Date()), note: '' });
  }, [open, defaultType, reset]);

  async function onSubmit(data: FormData) {
    try {
      await addMutation.mutateAsync({ id: savingsId, req: { type: data.type as SavingsEntryType, amount: data.amount, date: data.date, note: data.note || undefined } });
      toast.success(data.type === 'DEPOSIT' ? 'Depósito registrado!' : 'Retirada registrada!');
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao registrar movimentação.');
    }
  }

  return (
    <SheetLayout
      open={open} onOpenChange={onOpenChange}
      tint={tint}
      icon={<PiggyBank className="h-5 w-5" />}
      title="Movimentação"
      subtitle={`${savingsName} · Saldo: R$ ${currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
      ctaLabel={ctaLabel}
      onSubmit={handleSubmit(onSubmit)}
      isPending={addMutation.isPending}
    >
      {/* Type selector */}
      <Controller name="type" control={control} render={({ field }) => (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
          {(['DEPOSIT', 'WITHDRAWAL'] as SavingsEntryType[]).map((t) => (
            <button key={t} type="button" onClick={() => field.onChange(t)}
              className={`rounded-xl py-2.5 text-xs font-semibold transition-all ${field.value === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t === 'DEPOSIT' ? 'Depositar' : 'Retirar'}
            </button>
          ))}
        </div>
      )} />

      <SectionDivider label="Detalhes" />

      <div className="space-y-1.5">
        <FieldLabel>
          Valor
          {currentType === 'WITHDRAWAL' && (
            <span className="ml-1.5 normal-case font-normal text-slate-400">máx. R$ {currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          )}
        </FieldLabel>
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
        <FieldLabel>Observação <span className="normal-case font-normal text-slate-400">(opcional)</span></FieldLabel>
        <SheetInput id="note" placeholder="Ex: Aporte mensal, retirada de emergência..." icon={<FileText className="h-3.5 w-3.5" />} {...register('note')} />
      </div>
    </SheetLayout>
  );
}
