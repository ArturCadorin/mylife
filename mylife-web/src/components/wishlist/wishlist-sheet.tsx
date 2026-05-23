'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Star, FileText, DollarSign } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import {
  SheetLayout, SheetInput, SheetCurrencyInput, SheetSelectTrigger,
  SheetMonthPicker, FieldLabel, SectionDivider,
} from '@/components/ui/sheet-primitives';

import { useCreateWishlistItem, useUpdateWishlistItem, useAccounts } from '@/hooks/use-finance';
import {
  WISHLIST_CATEGORY_LABELS, WISHLIST_PRIORITY_LABELS,
  type WishListItemResponse, type WishListCategory, type WishListPriority,
} from '@/types/api';

const schema = z.object({
  name:            z.string().min(1, 'Informe o nome').max(100),
  description:     z.string().optional(),
  estimatedPrice:  z.coerce.number().positive('Valor deve ser maior que zero'),
  category:        z.enum(['ELECTRONICS', 'CLOTHING', 'HOME', 'VEHICLE', 'HEALTH', 'EDUCATION', 'LEISURE', 'FOOD', 'OTHER']),
  priority:        z.enum(['HIGH', 'MEDIUM', 'LOW']),
  estimatedMonth:  z.string().min(1, 'Informe o mês estimado'),
  linkedAccountId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PRIORITY_ORDER: WishListPriority[] = ['HIGH', 'MEDIUM', 'LOW'];

const PRIORITY_ACTIVE: Record<WishListPriority, string> = {
  HIGH:   'border-rose-300 bg-rose-50 text-rose-700',
  MEDIUM: 'border-amber-300 bg-amber-50 text-amber-700',
  LOW:    'border-slate-300 bg-slate-50 text-slate-600',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: WishListItemResponse;
}

export function WishlistSheet({ open, onOpenChange, item }: Props) {
  const isEdit = !!item;
  const { data: accounts = [] } = useAccounts();
  const createMutation = useCreateWishlistItem();
  const updateMutation = useUpdateWishlistItem();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', estimatedPrice: undefined, category: 'OTHER', priority: 'MEDIUM', estimatedMonth: '', linkedAccountId: '' },
  });

  useEffect(() => {
    if (open) {
      reset(item
        ? { name: item.name, description: item.description ?? '', estimatedPrice: item.estimatedPrice, category: item.category, priority: item.priority, estimatedMonth: item.estimatedMonth, linkedAccountId: '' }
        : { name: '', description: '', estimatedPrice: undefined, category: 'OTHER', priority: 'MEDIUM', estimatedMonth: '', linkedAccountId: '' }
      );
    }
  }, [open, item, reset]);

  async function onSubmit(data: FormData) {
    const req = {
      name: data.name,
      description: data.description || undefined,
      estimatedPrice: data.estimatedPrice,
      category: data.category as WishListCategory,
      priority: data.priority as WishListPriority,
      estimatedMonth: data.estimatedMonth,
      linkedAccountId: data.linkedAccountId ? Number(data.linkedAccountId) : undefined,
    };
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: item!.id, req });
        toast.success('Item atualizado!');
      } else {
        await createMutation.mutateAsync(req);
        toast.success('Item adicionado à lista!');
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao salvar item.');
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <SheetLayout
      open={open} onOpenChange={onOpenChange}
      tint="amber"
      icon={<Star className="h-5 w-5" />}
      title={isEdit ? 'Editar item' : 'Novo item'}
      subtitle={isEdit ? 'Altere os dados do item.' : 'Adicione à sua lista de desejos.'}
      ctaLabel={isEdit ? 'Salvar' : 'Adicionar'}
      onSubmit={handleSubmit(onSubmit)}
      isPending={isPending}
    >
      <SectionDivider label="Identificação" />

      <div className="space-y-1.5">
        <FieldLabel>Nome</FieldLabel>
        <SheetInput id="name" placeholder="Ex: iPhone 16, Notebook Dell..." icon={<FileText className="h-3.5 w-3.5" />} {...register('name')} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Descrição <span className="normal-case font-normal text-slate-400">(opcional)</span></FieldLabel>
        <SheetInput id="description" placeholder="Detalhes adicionais..." {...register('description')} />
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Preço estimado</FieldLabel>
        <Controller name="estimatedPrice" control={control} render={({ field }) => (
          <SheetCurrencyInput id="estimatedPrice" placeholder="0,00" value={field.value} onChange={field.onChange} />
        )} />
        {errors.estimatedPrice && <p className="text-xs text-red-500">{errors.estimatedPrice.message}</p>}
      </div>

      <SectionDivider label="Prioridade & Categoria" />

      <div className="space-y-1.5">
        <FieldLabel>Prioridade</FieldLabel>
        <Controller name="priority" control={control} render={({ field }) => (
          <div className="flex gap-1.5">
            {PRIORITY_ORDER.map((p) => (
              <button key={p} type="button" onClick={() => field.onChange(p)}
                className={`flex-1 rounded-xl border py-2.5 text-xs font-semibold transition-all ${field.value === p ? PRIORITY_ACTIVE[p] : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'}`}
              >
                {WISHLIST_PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        )} />
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Categoria</FieldLabel>
        <Controller name="category" control={control} render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SheetSelectTrigger><SelectValue placeholder="Selecione..." /></SheetSelectTrigger>
            <SelectContent>
              {(Object.entries(WISHLIST_CATEGORY_LABELS) as [WishListCategory, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )} />
      </div>

      <SectionDivider label="Planejamento" />

      <div className="space-y-1.5">
        <FieldLabel>Mês estimado</FieldLabel>
        <Controller name="estimatedMonth" control={control} render={({ field }) => (
          <SheetMonthPicker value={field.value} onChange={field.onChange} />
        )} />
        {errors.estimatedMonth && <p className="text-xs text-red-500">{errors.estimatedMonth.message}</p>}
      </div>

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
