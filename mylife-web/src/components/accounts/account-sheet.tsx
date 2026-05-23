'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Building2, FileText } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import {
  SheetLayout, SheetInput, SheetCurrencyInput, SheetSelectTrigger,
  FieldLabel, SectionDivider,
} from '@/components/ui/sheet-primitives';

import { useCreateAccount, useUpdateAccount } from '@/hooks/use-finance';
import { ACCOUNT_TYPE_LABELS, type AccountResponse, type AccountType } from '@/types/api';
import { BANK_PRESETS } from '@/lib/banks';
import { BankSelector } from '@/components/ui/bank-selector';

const schema = z.object({
  name:           z.string().min(1, 'Informe o nome').max(100),
  bankName:       z.string().min(1, 'Informe o banco').max(100),
  type:           z.enum(['CHECKING', 'SAVINGS', 'CASH', 'DIGITAL']),
  currency:       z.string(),
  initialBalance: z.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AccountResponse;
}

export function AccountSheet({ open, onOpenChange, account }: Props) {
  const isEdit = !!account;
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const [initialCustom, setInitialCustom] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', bankName: '', type: 'CHECKING', currency: 'BRL', initialBalance: 0 },
  });

  useEffect(() => {
    if (open) {
      if (account) {
        setInitialCustom(!BANK_PRESETS.some((b) => b.name === account.bankName));
        reset({ name: account.name, bankName: account.bankName, type: account.type, currency: account.currency, initialBalance: 0 });
      } else {
        setInitialCustom(false);
        reset({ name: '', bankName: '', type: 'CHECKING', currency: 'BRL', initialBalance: 0 });
      }
    }
  }, [open, account, reset]);

  async function onSubmit(data: FormData) {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: account!.id, req: { name: data.name, bankName: data.bankName, type: data.type as AccountType, currency: data.currency } });
        toast.success('Conta atualizada!');
      } else {
        await createMutation.mutateAsync({ name: data.name, bankName: data.bankName, type: data.type as AccountType, currency: data.currency, initialBalance: data.initialBalance ?? 0 });
        toast.success('Conta criada!');
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao salvar conta.');
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <SheetLayout
      open={open} onOpenChange={onOpenChange}
      tint="emerald"
      icon={<Building2 className="h-5 w-5" />}
      title={isEdit ? 'Editar conta' : 'Nova conta'}
      subtitle={isEdit ? 'Altere os dados da conta.' : undefined}
      ctaLabel={isEdit ? 'Salvar' : 'Criar conta'}
      onSubmit={handleSubmit(onSubmit)}
      isPending={isPending}
    >
      <SectionDivider label="Instituição" />

      <div className="space-y-1.5">
        <FieldLabel>Banco / Instituição</FieldLabel>
        <Controller
          name="bankName"
          control={control}
          render={({ field }) => (
            <BankSelector
              key={`${open}-${account?.id ?? 'new'}`}
              value={field.value}
              onChange={field.onChange}
              initialCustom={initialCustom}
            />
          )}
        />
        {errors.bankName && <p className="text-xs text-red-500">{errors.bankName.message}</p>}
      </div>

      <SectionDivider label="Identificação" />

      <div className="space-y-1.5">
        <FieldLabel>Nome da conta</FieldLabel>
        <SheetInput id="name" placeholder="Ex: Conta corrente" icon={<FileText className="h-3.5 w-3.5" />} {...register('name')} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Tipo de conta</FieldLabel>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SheetSelectTrigger><SelectValue /></SheetSelectTrigger>
              <SelectContent>
                {(Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
      </div>

      {!isEdit && (
        <div className="space-y-1.5">
          <FieldLabel>Saldo inicial</FieldLabel>
          <Controller
            name="initialBalance"
            control={control}
            render={({ field }) => (
              <SheetCurrencyInput id="initialBalance" placeholder="0,00" value={field.value} onChange={field.onChange} />
            )}
          />
          {errors.initialBalance && <p className="text-xs text-red-500">{errors.initialBalance.message}</p>}
        </div>
      )}
    </SheetLayout>
  );
}
