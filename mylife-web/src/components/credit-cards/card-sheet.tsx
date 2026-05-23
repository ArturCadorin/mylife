'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CreditCard, FileText, Hash } from 'lucide-react';

import {
  SheetLayout, SheetInput, SheetCurrencyInput,
  FieldLabel, SectionDivider, useTint,
} from '@/components/ui/sheet-primitives';
import { BankSelector } from '@/components/ui/bank-selector';
import {
  CARD_NETWORK_LABELS, encodeCardColor, decodeCardColor,
  getBankColor, BANK_PRESETS, type CardNetwork,
} from '@/lib/banks';
import { useCreateCreditCard, useUpdateCreditCard } from '@/hooks/use-finance';
import type { CreditCardResponse } from '@/types/api';

const NETWORK_ORDER: CardNetwork[] = ['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'other'];

const schema = z.object({
  name:           z.string().min(1, 'Informe o nome').max(100),
  bankName:       z.string().min(1, 'Informe o banco').max(100),
  lastFourDigits: z.string().regex(/^\d{4}$/, 'Informe os 4 últimos dígitos'),
  limit:          z.coerce.number().min(1, 'Limite deve ser maior que zero'),
  closingDay:     z.coerce.number().min(1).max(28),
  dueDay:         z.coerce.number().min(1).max(28),
  network:        z.enum(['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'other']),
  color:          z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function NetworkSelector({ field }: { field: { value: string; onChange: (v: string) => void } }) {
  const t = useTint();
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {NETWORK_ORDER.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => field.onChange(n)}
          className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2.5 text-xs font-medium transition-all ${
            field.value === n
              ? `${t.inputBg} ${t.inputBorder} text-slate-700 shadow-sm`
              : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: n === 'visa' ? '#1a1f71' : n === 'mastercard' ? '#EB001B' : n === 'elo' ? '#FF6600' : n === 'amex' ? '#006FCF' : n === 'hipercard' ? '#CC0000' : '#94a3b8' }}
          />
          {CARD_NETWORK_LABELS[n]}
        </button>
      ))}
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: CreditCardResponse;
}

export function CardSheet({ open, onOpenChange, card }: Props) {
  const isEdit = !!card;
  const createMutation = useCreateCreditCard();
  const updateMutation = useUpdateCreditCard();
  const [initialCustom, setInitialCustom] = useState(false);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', bankName: '', lastFourDigits: '', limit: undefined, closingDay: 1, dueDay: 10, network: 'mastercard', color: '#1E3A5F' },
  });

  const selectedNetwork = watch('network');
  const selectedColor   = watch('color');

  useEffect(() => {
    if (open) {
      if (card) {
        const { network, hex } = decodeCardColor(card.color);
        setInitialCustom(!BANK_PRESETS.some((b) => b.name === card.bankName));
        reset({ name: card.name, bankName: card.bankName ?? '', lastFourDigits: card.lastFourDigits, limit: card.totalLimit, closingDay: card.closingDay, dueDay: card.dueDay, network, color: hex });
      } else {
        setInitialCustom(false);
        reset({ name: '', bankName: '', lastFourDigits: '', limit: undefined, closingDay: 1, dueDay: 10, network: 'mastercard', color: '#1E3A5F' });
      }
    }
  }, [open, card, reset]);

  async function onSubmit(data: FormData) {
    const encodedColor = encodeCardColor(data.network, data.color || '#1E3A5F');
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: card!.id, req: { name: data.name, bankName: data.bankName, totalLimit: data.limit, closingDay: data.closingDay, dueDay: data.dueDay, color: encodedColor } });
        toast.success('Cartão atualizado!');
      } else {
        await createMutation.mutateAsync({ name: data.name, bankName: data.bankName, lastFourDigits: data.lastFourDigits, totalLimit: data.limit, closingDay: data.closingDay, dueDay: data.dueDay, color: encodedColor });
        toast.success('Cartão criado!');
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao salvar cartão. Tente novamente.');
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <SheetLayout
      open={open} onOpenChange={onOpenChange}
      tint="violet"
      icon={<CreditCard className="h-5 w-5" />}
      title={isEdit ? 'Editar cartão' : 'Novo cartão'}
      subtitle={isEdit ? 'Altere os dados do cartão.' : undefined}
      ctaLabel={isEdit ? 'Salvar' : 'Criar cartão'}
      onSubmit={handleSubmit(onSubmit)}
      isPending={isPending}
    >
      {/* Mini card preview */}
      <div
        className="relative h-36 w-full overflow-hidden rounded-2xl p-4 shadow-md"
        style={{ background: `linear-gradient(135deg, ${selectedColor || '#1E3A5F'} 0%, ${selectedColor || '#1E3A5F'}aa 100%)` }}
      >
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <p className="text-xs font-semibold text-white/70">Pré-visualização</p>
        <p className="mt-6 font-mono text-sm tracking-widest text-white">•••• •••• •••• 0000</p>
        <p className="mt-1 text-xs font-medium text-white/80">{CARD_NETWORK_LABELS[selectedNetwork] ?? 'Bandeira'}</p>
      </div>

      <SectionDivider label="Identificação" />

      <div className="space-y-1.5">
        <FieldLabel>Nome do cartão</FieldLabel>
        <SheetInput id="name" placeholder="Ex: Nubank Roxinho" icon={<FileText className="h-3.5 w-3.5" />} {...register('name')} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Banco / Emissor</FieldLabel>
        <Controller
          name="bankName"
          control={control}
          render={({ field }) => (
            <BankSelector
              key={`${open}-${card?.id ?? 'new'}`}
              value={field.value}
              onChange={(name) => {
                field.onChange(name);
                // Auto-fill card color from bank preset color
                setValue('color', getBankColor(name));
              }}
              initialCustom={initialCustom}
            />
          )}
        />
        {errors.bankName && <p className="text-xs text-red-500">{errors.bankName.message}</p>}
      </div>

      {!isEdit && (
        <div className="space-y-1.5">
          <FieldLabel>Últimos 4 dígitos</FieldLabel>
          <SheetInput id="lastFourDigits" maxLength={4} placeholder="0000" icon={<Hash className="h-3.5 w-3.5" />} {...register('lastFourDigits')} />
          {errors.lastFourDigits && <p className="text-xs text-red-500">{errors.lastFourDigits.message}</p>}
        </div>
      )}

      <SectionDivider label="Bandeira & Cor" />

      <div className="space-y-1.5">
        <FieldLabel>Bandeira</FieldLabel>
        <Controller name="network" control={control} render={({ field }) => <NetworkSelector field={field} />} />
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Cor do cartão</FieldLabel>
        <div className="flex items-center gap-3">
          <input type="color" {...register('color')} className="h-11 w-14 cursor-pointer rounded-xl border border-violet-200/60 bg-violet-100/40 p-1" />
          <div
            className="flex h-11 flex-1 items-center rounded-xl px-3.5 transition-all"
            style={{ background: `linear-gradient(135deg, ${selectedColor || '#1E3A5F'} 0%, ${selectedColor || '#1E3A5F'}aa 100%)` }}
          >
            <span className="text-xs font-medium text-white/80">{(selectedColor || '#1E3A5F').toUpperCase()}</span>
          </div>
        </div>
      </div>

      <SectionDivider label="Limite & Datas" />

      <div className="space-y-1.5">
        <FieldLabel>Limite do cartão</FieldLabel>
        <Controller name="limit" control={control} render={({ field }) => (
          <SheetCurrencyInput id="limit" placeholder="0,00" value={field.value} onChange={field.onChange} />
        )} />
        {errors.limit && <p className="text-xs text-red-500">{errors.limit.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel>Dia fechamento</FieldLabel>
          <SheetInput id="closingDay" type="number" min="1" max="28" placeholder="1–28" {...register('closingDay')} />
          {errors.closingDay && <p className="text-xs text-red-500">{errors.closingDay.message}</p>}
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Dia vencimento</FieldLabel>
          <SheetInput id="dueDay" type="number" min="1" max="28" placeholder="1–28" {...register('dueDay')} />
          {errors.dueDay && <p className="text-xs text-red-500">{errors.dueDay.message}</p>}
        </div>
      </div>
    </SheetLayout>
  );
}
