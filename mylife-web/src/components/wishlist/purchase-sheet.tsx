'use client';

import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { ShoppingCart, FileText } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import {
  SheetLayout, SheetInput, SheetSelectTrigger,
  FieldLabel, SectionDivider,
} from '@/components/ui/sheet-primitives';

import { usePurchaseWishlistItem, useAccounts } from '@/hooks/use-finance';
import type { WishListItemResponse } from '@/types/api';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WishListItemResponse;
}

interface FormData {
  linkedAccountId: string;
  note: string;
}

export function PurchaseSheet({ open, onOpenChange, item }: Props) {
  const { data: accounts = [] } = useAccounts();
  const purchaseMutation = usePurchaseWishlistItem();

  const { register, handleSubmit, control, reset } = useForm<FormData>({
    defaultValues: { linkedAccountId: '', note: '' },
  });

  async function onSubmit(data: FormData) {
    try {
      await purchaseMutation.mutateAsync({
        id: item.id,
        req: { linkedAccountId: data.linkedAccountId ? Number(data.linkedAccountId) : undefined, note: data.note || undefined },
      });
      toast.success(`"${item.name}" marcado como comprado!`);
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao registrar compra.');
    }
  }

  return (
    <SheetLayout
      open={open} onOpenChange={onOpenChange}
      tint="emerald"
      icon={<ShoppingCart className="h-5 w-5" />}
      title="Marcar como comprado"
      subtitle={`${item.name} · ${formatCurrency(item.estimatedPrice)}`}
      ctaLabel="Confirmar compra"
      onSubmit={handleSubmit(onSubmit)}
      isPending={purchaseMutation.isPending}
    >
      <SectionDivider label="Compra" />

      <div className="space-y-1.5">
        <FieldLabel>Conta debitada <span className="normal-case font-normal text-slate-400">(opcional)</span></FieldLabel>
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

      <div className="space-y-1.5">
        <FieldLabel>Observação <span className="normal-case font-normal text-slate-400">(opcional)</span></FieldLabel>
        <SheetInput id="note" placeholder="Ex: comprei na promoção..." icon={<FileText className="h-3.5 w-3.5" />} {...register('note')} />
      </div>
    </SheetLayout>
  );
}
