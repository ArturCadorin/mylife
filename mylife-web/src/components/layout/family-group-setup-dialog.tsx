'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { onFamilyGroupError } from '@/lib/api';
import { useCreateFamilyGroup } from '@/hooks/use-family-group';

const schema = z.object({
  name: z.string().min(1, 'Informe o nome do grupo').max(100),
});
type FormData = z.infer<typeof schema>;

export function FamilyGroupSetupDialog() {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateFamilyGroup();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    return onFamilyGroupError(() => setOpen(true));
  }, []);

  async function onSubmit(data: FormData) {
    try {
      await createMutation.mutateAsync({ name: data.name });
      toast.success(`Grupo "${data.name}" criado! Agora você pode usar todas as funcionalidades.`);
      setOpen(false);
      // Recarrega a página para limpar queries em erro
      window.location.reload();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao criar grupo. Tente novamente.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <DialogTitle>Criar grupo familiar</DialogTitle>
          </div>
          <DialogDescription>
            Para usar as funcionalidades financeiras, você precisa criar um grupo familiar.
            Você pode convidar membros depois nas configurações.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="group-name">Nome do grupo</Label>
            <Input
              id="group-name"
              placeholder="Ex: Família Silva, Meu grupo..."
              {...register('name')}
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar grupo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
