'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PiggyBank, FileText, Target, Percent, TrendingUp } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import {
  SheetLayout, SheetInput, SheetCurrencyInput, SheetSelectTrigger,
  FieldLabel, SectionDivider,
} from '@/components/ui/sheet-primitives';

import { useCreateSavings, useUpdateSavings, useAccounts } from '@/hooks/use-finance';
import type { SavingsResponse } from '@/types/api';

const schema = z.object({
  name:            z.string().min(1, 'Informe o nome').max(100),
  description:     z.string().optional(),
  targetAmount:    z.coerce.number().positive().optional().or(z.literal('')),
  hasCdi:          z.boolean().default(false),
  cdiRate:         z.coerce.number().min(0).max(1000).optional().or(z.literal('')),
  currentCdiValue: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  linkedAccountId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savings?: SavingsResponse;
}

export function SavingsSheet({ open, onOpenChange, savings }: Props) {
  const isEdit = !!savings;
  const { data: accounts = [] } = useAccounts();
  const createMutation = useCreateSavings();
  const updateMutation = useUpdateSavings();

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', description: '', targetAmount: '',
      hasCdi: false, cdiRate: '', currentCdiValue: '',
      linkedAccountId: '',
    },
  });

  const hasCdi = watch('hasCdi');

  useEffect(() => {
    if (open) {
      const hasCdiValue = savings ? savings.cdiRate !== null : false;
      reset(savings
        ? {
            name: savings.name,
            description: savings.description ?? '',
            targetAmount: savings.targetAmount ?? '',
            hasCdi: hasCdiValue,
            cdiRate: hasCdiValue ? (savings.cdiRate ?? '') : '',
            currentCdiValue: hasCdiValue ? (savings.currentCdiValue ?? '') : '',
            linkedAccountId: savings.linkedAccountId ? String(savings.linkedAccountId) : '',
          }
        : {
            name: '', description: '', targetAmount: '',
            hasCdi: false, cdiRate: '', currentCdiValue: '',
            linkedAccountId: '',
          }
      );
    }
  }, [open, savings, reset]);

  async function onSubmit(data: FormData) {
    const linkedId = data.linkedAccountId && data.linkedAccountId !== 'none'
      ? Number(data.linkedAccountId)
      : undefined;

    const req = {
      name: data.name,
      description: data.description || undefined,
      targetAmount: data.targetAmount !== '' && data.targetAmount !== undefined
        ? Number(data.targetAmount)
        : undefined,
      cdiRate: data.hasCdi && data.cdiRate !== '' && data.cdiRate !== undefined
        ? Number(data.cdiRate)
        : undefined,
      currentCdiValue: data.hasCdi && data.currentCdiValue !== '' && data.currentCdiValue !== undefined
        ? Number(data.currentCdiValue)
        : undefined,
      linkedAccountId: linkedId,
    };
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: savings!.id, req });
        toast.success('Cofrinho atualizado!');
      } else {
        await createMutation.mutateAsync(req);
        toast.success('Cofrinho criado!');
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao salvar cofrinho. Tente novamente.');
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <SheetLayout
      open={open} onOpenChange={onOpenChange}
      tint="sky"
      icon={<PiggyBank className="h-5 w-5" />}
      title={isEdit ? 'Editar cofrinho' : 'Novo cofrinho'}
      subtitle={isEdit ? 'Atualize os dados do cofrinho.' : 'Crie um cofrinho para guardar com objetivo.'}
      ctaLabel={isEdit ? 'Salvar' : 'Criar cofrinho'}
      onSubmit={handleSubmit(onSubmit)}
      isPending={isPending}
    >
      <SectionDivider label="Identificação" />

      <div className="space-y-1.5">
        <FieldLabel>Nome</FieldLabel>
        <SheetInput id="name" placeholder="Ex: Viagem Europa, Reserva..." icon={<FileText className="h-3.5 w-3.5" />} {...register('name')} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Descrição <span className="normal-case font-normal text-slate-400">(opcional)</span></FieldLabel>
        <SheetInput id="description" placeholder="Uma breve descrição..." {...register('description')} />
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Meta <span className="normal-case font-normal text-slate-400">(opcional)</span></FieldLabel>
        <Controller name="targetAmount" control={control} render={({ field }) => (
          <SheetCurrencyInput id="targetAmount" placeholder="0,00" value={field.value ?? undefined} onChange={field.onChange} />
        )} />
        {errors.targetAmount && <p className="text-xs text-red-500">Valor inválido</p>}
      </div>

      <SectionDivider label="Rendimento" />

      {/* CDI toggle */}
      <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
            <TrendingUp className="h-4 w-4 text-sky-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Rendimento CDI</p>
            <p className="text-xs text-slate-400">
              {hasCdi ? 'Rendimento automático pela taxa CDI' : 'Depósitos manuais até atingir a meta'}
            </p>
          </div>
        </div>
        <Controller name="hasCdi" control={control} render={({ field }) => (
          <button
            type="button"
            role="switch"
            aria-checked={field.value}
            onClick={() => field.onChange(!field.value)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
              field.value ? 'bg-sky-500' : 'bg-slate-200'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              field.value ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        )} />
      </div>

      {/* CDI fields — only when toggle is on */}
      {hasCdi && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>% do CDI</FieldLabel>
              <SheetInput
                id="cdiRate"
                type="number" step="0.1" min="0" max="1000" placeholder="100"
                icon={<Percent className="h-3.5 w-3.5" />}
                {...register('cdiRate')}
              />
              {errors.cdiRate && <p className="text-xs text-red-500">{errors.cdiRate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <FieldLabel>CDI atual (%)</FieldLabel>
              <SheetInput
                id="currentCdiValue"
                type="number" step="0.01" min="0" max="100" placeholder="Ex: 10.5"
                icon={<Percent className="h-3.5 w-3.5" />}
                {...register('currentCdiValue')}
              />
              {errors.currentCdiValue && <p className="text-xs text-red-500">{errors.currentCdiValue.message}</p>}
            </div>
          </div>
          <p className="text-xs text-slate-400 -mt-2">Taxa efetiva = % CDI × CDI atual ÷ 100</p>
        </>
      )}

      <div className="space-y-1.5">
        <FieldLabel>Conta vinculada <span className="normal-case font-normal text-slate-400">(opcional)</span></FieldLabel>
        <Controller name="linkedAccountId" control={control} render={({ field }) => (
          <Select value={field.value || undefined} onValueChange={field.onChange}>
            <SheetSelectTrigger><SelectValue placeholder="Nenhuma" /></SheetSelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={String(acc.id)}>{acc.name} — {acc.bankName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )} />
      </div>
    </SheetLayout>
  );
}
