'use client';

import { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { TrendingUp, FileText, Building2, Percent } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import {
  SheetLayout, SheetInput, SheetCurrencyInput, SheetSelectTrigger, SheetDatePicker,
  FieldLabel, SectionDivider,
} from '@/components/ui/sheet-primitives';

import { useCreateInvestment, useUpdateInvestment, useAccounts } from '@/hooks/use-finance';
import {
  INVESTMENT_TYPE_LABELS, FIXED_INCOME_INDEXER_LABELS,
  type InvestmentResponse, type InvestmentType, type FixedIncomeIndexer,
} from '@/types/api';

const schema = z.object({
  type:              z.enum(['FIXED_INCOME', 'STOCK', 'FUND', 'CRYPTO']),
  name:              z.string().min(1, 'Informe o nome').max(100),
  institution:       z.string().min(1, 'Informe a instituição').max(100),
  initialAmount:     z.coerce.number().positive('Valor deve ser maior que zero'),
  indexer:           z.string().optional(),
  indexerRate:       z.coerce.number().min(0).optional().or(z.literal('')),
  fixedRate:         z.coerce.number().min(0).optional().or(z.literal('')),
  currentIndexValue: z.coerce.number().min(0).optional().or(z.literal('')),
  maturityDate:      z.string().optional(),
  linkedAccountId:   z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const TYPE_COLORS: Record<string, string> = {
  FIXED_INCOME: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  STOCK:        'border-blue-300 bg-blue-50 text-blue-700',
  FUND:         'border-violet-300 bg-violet-50 text-violet-700',
  CRYPTO:       'border-amber-300 bg-amber-50 text-amber-700',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment?: InvestmentResponse;
}

export function InvestmentSheet({ open, onOpenChange, investment }: Props) {
  const isEdit = !!investment;
  const { data: accounts = [] } = useAccounts();
  const createMutation = useCreateInvestment();
  const updateMutation = useUpdateInvestment();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'FIXED_INCOME', name: '', institution: '', initialAmount: undefined, indexer: '', indexerRate: '', fixedRate: '', currentIndexValue: '', maturityDate: '', linkedAccountId: '' },
  });

  const currentType    = useWatch({ control, name: 'type' });
  const currentIndexer = useWatch({ control, name: 'indexer' });
  const isFixedIncome  = currentType === 'FIXED_INCOME';
  const isPrefixed     = currentIndexer === 'PREFIXED';

  useEffect(() => {
    if (open) {
      reset(investment
        ? { type: investment.type, name: investment.name, institution: investment.institution, initialAmount: investment.totalInvested, indexer: investment.indexer ?? '', indexerRate: investment.indexerRate ?? '', fixedRate: investment.fixedRate ?? '', currentIndexValue: investment.currentIndexValue ?? '', maturityDate: investment.maturityDate ?? '', linkedAccountId: investment.linkedAccountId ? String(investment.linkedAccountId) : '' }
        : { type: 'FIXED_INCOME', name: '', institution: '', initialAmount: undefined, indexer: '', indexerRate: '', fixedRate: '', currentIndexValue: '', maturityDate: '', linkedAccountId: '' }
      );
    }
  }, [open, investment, reset]);

  async function onSubmit(data: FormData) {
    const base = {
      name: data.name, institution: data.institution,
      indexer: data.indexer as FixedIncomeIndexer || undefined,
      indexerRate: data.indexerRate ? Number(data.indexerRate) : undefined,
      fixedRate: data.fixedRate ? Number(data.fixedRate) : undefined,
      currentIndexValue: data.currentIndexValue ? Number(data.currentIndexValue) : undefined,
      maturityDate: data.maturityDate || undefined,
      linkedAccountId: data.linkedAccountId ? Number(data.linkedAccountId) : undefined,
    };
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: investment!.id, req: base });
        toast.success('Investimento atualizado!');
      } else {
        await createMutation.mutateAsync({ ...base, type: data.type as InvestmentType, initialAmount: data.initialAmount });
        toast.success('Investimento criado!');
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao salvar investimento.');
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <SheetLayout
      open={open} onOpenChange={onOpenChange}
      tint="emerald"
      icon={<TrendingUp className="h-5 w-5" />}
      title={isEdit ? 'Editar investimento' : 'Novo investimento'}
      subtitle={isEdit ? 'Altere os dados do investimento.' : undefined}
      ctaLabel={isEdit ? 'Salvar' : 'Criar'}
      onSubmit={handleSubmit(onSubmit)}
      isPending={isPending}
    >
      {!isEdit && (
        <>
          <SectionDivider label="Tipo" />
          <Controller name="type" control={control} render={({ field }) => (
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.entries(INVESTMENT_TYPE_LABELS) as [InvestmentType, string][]).map(([k, v]) => (
                <button key={k} type="button" onClick={() => field.onChange(k)}
                  className={`rounded-xl border py-2.5 text-xs font-semibold transition-all ${field.value === k ? TYPE_COLORS[k] : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'}`}
                >{v}</button>
              ))}
            </div>
          )} />
        </>
      )}

      <SectionDivider label="Identificação" />

      <div className="space-y-1.5">
        <FieldLabel>Nome</FieldLabel>
        <SheetInput id="name" placeholder="Ex: Tesouro IPCA 2030, PETR4..." icon={<FileText className="h-3.5 w-3.5" />} {...register('name')} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Instituição</FieldLabel>
        <SheetInput id="institution" placeholder="Ex: Tesouro Direto, XP, Binance..." icon={<Building2 className="h-3.5 w-3.5" />} {...register('institution')} />
        {errors.institution && <p className="text-xs text-red-500">{errors.institution.message}</p>}
      </div>

      {!isEdit && (
        <div className="space-y-1.5">
          <FieldLabel>Valor inicial</FieldLabel>
          <Controller name="initialAmount" control={control} render={({ field }) => (
            <SheetCurrencyInput id="initialAmount" placeholder="0,00" value={field.value} onChange={field.onChange} />
          )} />
          {errors.initialAmount && <p className="text-xs text-red-500">{errors.initialAmount.message}</p>}
        </div>
      )}

      {isFixedIncome && (
        <>
          <SectionDivider label="Renda fixa" />

          <div className="space-y-1.5">
            <FieldLabel>Indexador</FieldLabel>
            <Controller name="indexer" control={control} render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SheetSelectTrigger><SelectValue placeholder="Selecione..." /></SheetSelectTrigger>
                <SelectContent>
                  {(Object.entries(FIXED_INCOME_INDEXER_LABELS) as [FixedIncomeIndexer, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </div>

          {!isPrefixed && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel>% do Indexador</FieldLabel>
                <SheetInput id="indexerRate" type="number" step="0.01" min="0" placeholder="100" icon={<Percent className="h-3.5 w-3.5" />} {...register('indexerRate')} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Valor atual (%)</FieldLabel>
                <SheetInput id="currentIndexValue" type="number" step="0.01" min="0" placeholder="10.75" icon={<Percent className="h-3.5 w-3.5" />} {...register('currentIndexValue')} />
              </div>
            </div>
          )}

          {isPrefixed && (
            <div className="space-y-1.5">
              <FieldLabel>Taxa prefixada (% a.a.)</FieldLabel>
              <SheetInput id="fixedRate" type="number" step="0.01" min="0" placeholder="12.5" icon={<Percent className="h-3.5 w-3.5" />} {...register('fixedRate')} />
            </div>
          )}

          <div className="space-y-1.5">
            <FieldLabel>Vencimento <span className="normal-case font-normal text-slate-400">(opcional)</span></FieldLabel>
            <Controller name="maturityDate" control={control} render={({ field }) => (
              <SheetDatePicker value={field.value ?? ''} onChange={field.onChange} />
            )} />
          </div>
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
