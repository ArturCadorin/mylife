'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { TrendingUp, FileText } from 'lucide-react';

import {
  SheetLayout, SheetInput, SheetCurrencyInput, SheetDatePicker,
  FieldLabel, SectionDivider,
} from '@/components/ui/sheet-primitives';
import { useAddInvestmentEntry } from '@/hooks/use-finance';
import type { InvestmentEntryType } from '@/types/api';

function localDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const ENTRY_TYPES: { value: InvestmentEntryType; label: string; tint: string }[] = [
  { value: 'DEPOSIT',      label: 'Aporte',            tint: 'emerald' },
  { value: 'WITHDRAWAL',   label: 'Resgate',            tint: 'rose'    },
  { value: 'YIELD_UPDATE', label: 'Atualizar valor',    tint: 'blue'    },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investmentId: number;
  investmentName: string;
  currentValue: number;
  defaultType?: InvestmentEntryType;
}

export function InvestmentEntrySheet({ open, onOpenChange, investmentId, investmentName, currentValue, defaultType = 'DEPOSIT' }: Props) {
  const addMutation = useAddInvestmentEntry();

  const schema = z.object({
    entryType: z.enum(['DEPOSIT', 'WITHDRAWAL', 'YIELD_UPDATE']),
    amount:    z.coerce.number().positive('Valor deve ser maior que zero'),
    date:      z.string().min(1, 'Informe a data'),
    note:      z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.entryType === 'WITHDRAWAL' && data.amount > currentValue) {
      ctx.addIssue({ code: 'custom', path: ['amount'], message: `Disponível: R$ ${currentValue.toFixed(2).replace('.', ',')}` });
    }
  });

  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { entryType: defaultType, amount: undefined, date: localDateStr(new Date()), note: '' },
  });

  const entryType = watch('entryType');
  const tint = ENTRY_TYPES.find((e) => e.value === entryType)?.tint ?? 'emerald';
  const isYieldUpdate = entryType === 'YIELD_UPDATE';

  useEffect(() => {
    if (open) reset({ entryType: defaultType, amount: undefined, date: localDateStr(new Date()), note: '' });
  }, [open, defaultType, reset]);

  async function onSubmit(data: FormData) {
    try {
      await addMutation.mutateAsync({ id: investmentId, req: { type: data.entryType as InvestmentEntryType, amount: data.amount, date: data.date, note: data.note || undefined } });
      const label = ENTRY_TYPES.find((e) => e.value === data.entryType)?.label ?? 'Movimentação';
      toast.success(`${label} registrado!`);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao registrar movimentação.');
    }
  }

  const ctaLabel = ENTRY_TYPES.find((e) => e.value === entryType)?.label ?? 'Confirmar';

  return (
    <SheetLayout
      open={open} onOpenChange={onOpenChange}
      tint={tint}
      icon={<TrendingUp className="h-5 w-5" />}
      title="Movimentação"
      subtitle={`${investmentName} · Valor atual: R$ ${currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
      ctaLabel={ctaLabel}
      onSubmit={handleSubmit(onSubmit)}
      isPending={addMutation.isPending}
    >
      {/* Type selector */}
      <Controller name="entryType" control={control} render={({ field }) => (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1">
          {ENTRY_TYPES.map((t) => (
            <button key={t.value} type="button" onClick={() => field.onChange(t.value)}
              className={`rounded-xl py-2.5 text-xs font-semibold transition-all ${field.value === t.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )} />

      <SectionDivider label="Detalhes" />

      <div className="space-y-1.5">
        <FieldLabel>
          {isYieldUpdate ? 'Novo valor total' : 'Valor'}
          {entryType === 'WITHDRAWAL' && (
            <span className="ml-1.5 normal-case font-normal text-slate-400">máx. R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          )}
        </FieldLabel>
        <Controller name="amount" control={control} render={({ field }) => (
          <SheetCurrencyInput id="amount" placeholder="0,00" value={field.value} onChange={field.onChange} />
        )} />
        {isYieldUpdate && <p className="text-xs text-slate-400">Informe o valor total atual do investimento</p>}
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
        <SheetInput id="note" placeholder="Ex: Aporte mensal, resgate parcial..." icon={<FileText className="h-3.5 w-3.5" />} {...register('note')} />
      </div>
    </SheetLayout>
  );
}
