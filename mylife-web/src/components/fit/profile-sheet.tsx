'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { User, Ruler, Weight, Target, Calendar } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import {
  SheetLayout, SheetInput, SheetSelectTrigger,
  FieldLabel, SectionDivider,
} from '@/components/ui/sheet-primitives';

import { useUpsertFitProfile } from '@/hooks/use-fit';
import {
  ACTIVITY_LEVEL_LABELS, BIOLOGICAL_SEX_LABELS,
  type FitProfileResponse, type ActivityLevel, type BiologicalSex,
} from '@/types/api';

const schema = z.object({
  heightCm:       z.coerce.number().min(50).max(280).optional().or(z.literal('')),
  weightKg:       z.coerce.number().min(1).max(500).optional().or(z.literal('')),
  targetWeightKg: z.coerce.number().min(1).max(500).optional().or(z.literal('')),
  birthDate:      z.string().optional(),
  biologicalSex:  z.string().optional(),
  activityLevel:  z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: FitProfileResponse | null;
}

export function ProfileSheet({ open, onOpenChange, profile }: Props) {
  const mutation = useUpsertFitProfile();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      heightCm: '', weightKg: '', targetWeightKg: '',
      birthDate: '', biologicalSex: '', activityLevel: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset(profile ? {
        heightCm:       profile.heightCm ?? '',
        weightKg:       profile.weightKg ?? '',
        targetWeightKg: profile.targetWeightKg ?? '',
        birthDate:      profile.birthDate ?? '',
        biologicalSex:  profile.biologicalSex ?? '',
        activityLevel:  profile.activityLevel ?? '',
      } : {
        heightCm: '', weightKg: '', targetWeightKg: '',
        birthDate: '', biologicalSex: '', activityLevel: '',
      });
    }
  }, [open, profile, reset]);

  async function onSubmit(data: FormData) {
    try {
      await mutation.mutateAsync({
        heightCm:       data.heightCm !== '' ? Number(data.heightCm) : undefined,
        weightKg:       data.weightKg !== '' ? Number(data.weightKg) : undefined,
        targetWeightKg: data.targetWeightKg !== '' ? Number(data.targetWeightKg) : undefined,
        birthDate:      data.birthDate || undefined,
        biologicalSex:  (data.biologicalSex || undefined) as BiologicalSex | undefined,
        activityLevel:  (data.activityLevel || undefined) as ActivityLevel | undefined,
      });
      toast.success('Perfil atualizado!');
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao salvar perfil.');
    }
  }

  return (
    <SheetLayout
      open={open} onOpenChange={onOpenChange}
      tint="sky"
      icon={<User className="h-5 w-5" />}
      title="Perfil Físico"
      subtitle="Seus dados de saúde e composição corporal."
      ctaLabel="Salvar perfil"
      onSubmit={handleSubmit(onSubmit)}
      isPending={mutation.isPending}
    >
      <SectionDivider label="Medidas" />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel>Altura (cm)</FieldLabel>
          <SheetInput id="heightCm" type="number" step="0.1" placeholder="178"
            icon={<Ruler className="h-3.5 w-3.5" />} {...register('heightCm')} />
          {errors.heightCm && <p className="text-xs text-red-500">Valor inválido</p>}
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Peso atual (kg)</FieldLabel>
          <SheetInput id="weightKg" type="number" step="0.1" placeholder="80.0"
            icon={<Weight className="h-3.5 w-3.5" />} {...register('weightKg')} />
          {errors.weightKg && <p className="text-xs text-red-500">Valor inválido</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Peso alvo (kg) <span className="normal-case font-normal text-slate-400">(opcional)</span></FieldLabel>
        <SheetInput id="targetWeightKg" type="number" step="0.1" placeholder="75.0"
          icon={<Target className="h-3.5 w-3.5" />} {...register('targetWeightKg')} />
      </div>

      <SectionDivider label="Dados pessoais" />

      <div className="space-y-1.5">
        <FieldLabel>Data de nascimento</FieldLabel>
        <SheetInput id="birthDate" type="date"
          icon={<Calendar className="h-3.5 w-3.5" />} {...register('birthDate')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel>Sexo biológico</FieldLabel>
          <Controller name="biologicalSex" control={control} render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SheetSelectTrigger><SelectValue placeholder="Selecione" /></SheetSelectTrigger>
              <SelectContent>
                {Object.entries(BIOLOGICAL_SEX_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Nível de atividade</FieldLabel>
          <Controller name="activityLevel" control={control} render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SheetSelectTrigger><SelectValue placeholder="Selecione" /></SheetSelectTrigger>
              <SelectContent>
                {Object.entries(ACTIVITY_LEVEL_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </div>
      </div>
    </SheetLayout>
  );
}
