'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { User } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import {
  SheetLayout,
  SheetInput,
  SheetSelectTrigger,
  SheetDatePicker,
  FieldLabel,
  SectionDivider,
} from '@/components/ui/sheet-primitives';
import { useFitProfile, useUpsertFitProfile } from '@/hooks/use-fit';
import {
  BIOLOGICAL_SEX_LABELS,
  ACTIVITY_LEVEL_LABELS,
  type BiologicalSex,
  type ActivityLevel,
} from '@/types/api';

/* ── Schema ──────────────────────────────────────────────────────────────── */

const optionalPositiveNumber = z.preprocess(
  (v) => (v === '' || v === null || (typeof v === 'number' && Number.isNaN(v)) ? undefined : Number(v)),
  z.number().positive('Deve ser positivo').optional(),
);

const schema = z.object({
  heightCm:       optionalPositiveNumber,
  weightKg:       optionalPositiveNumber,
  targetWeightKg: optionalPositiveNumber,
  birthDate:      z.string().optional(),
  biologicalSex:  z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  activityLevel:  z.enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE']).optional(),
});

type FormData = z.infer<typeof schema>;

/* ── Props ───────────────────────────────────────────────────────────────── */

interface ProfileEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function ProfileEditSheet({ open, onOpenChange }: ProfileEditSheetProps) {
  const { data: profile } = useFitProfile();
  const mutation = useUpsertFitProfile();

  const { register, handleSubmit, reset, control } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  /* Pre-preenche o form sempre que o sheet abre */
  useEffect(() => {
    if (!open) return;
    reset({
      heightCm:       profile?.heightCm       ?? undefined,
      weightKg:       profile?.weightKg       ?? undefined,
      targetWeightKg: profile?.targetWeightKg ?? undefined,
      birthDate:      profile?.birthDate      ?? undefined,
      biologicalSex:  (profile?.biologicalSex as BiologicalSex) ?? undefined,
      activityLevel:  (profile?.activityLevel as ActivityLevel) ?? undefined,
    });
  }, [open, profile, reset]);

  async function onSubmit(data: FormData) {
    try {
      await mutation.mutateAsync({
        heightCm:       data.heightCm,
        weightKg:       data.weightKg,
        targetWeightKg: data.targetWeightKg,
        birthDate:      data.birthDate || undefined,
        biologicalSex:  data.biologicalSex,
        activityLevel:  data.activityLevel,
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
      open={open}
      onOpenChange={onOpenChange}
      tint="blue"
      icon={<User className="h-5 w-5" />}
      title="Perfil físico"
      subtitle="Dados compartilhados entre todas as soluções."
      ctaLabel="Salvar perfil"
      onSubmit={handleSubmit(onSubmit)}
      isPending={mutation.isPending}
    >
      {/* ── Medidas ─────────────────────────────────────────────────────── */}
      <SectionDivider label="Medidas" />

      <FieldLabel>Altura (cm)</FieldLabel>
      <SheetInput
        id="heightCm"
        type="number"
        placeholder="175"
        {...register('heightCm')}
      />

      <FieldLabel>Peso atual (kg)</FieldLabel>
      <SheetInput
        id="weightKg"
        type="number"
        step="0.1"
        placeholder="70.0"
        {...register('weightKg')}
      />

      <FieldLabel>Peso alvo (kg)</FieldLabel>
      <SheetInput
        id="targetWeightKg"
        type="number"
        step="0.1"
        placeholder="65.0"
        {...register('targetWeightKg')}
      />

      {/* ── Dados pessoais ──────────────────────────────────────────────── */}
      <SectionDivider label="Dados pessoais" />

      <FieldLabel>Data de nascimento</FieldLabel>
      <Controller
        name="birthDate"
        control={control}
        render={({ field }) => (
          <SheetDatePicker
            value={field.value ?? ''}
            onChange={field.onChange}
          />
        )}
      />

      <FieldLabel>Sexo biológico</FieldLabel>
      <Controller
        name="biologicalSex"
        control={control}
        render={({ field }) => (
          <Select value={field.value ?? ''} onValueChange={field.onChange}>
            <SheetSelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SheetSelectTrigger>
            <SelectContent>
              {(Object.entries(BIOLOGICAL_SEX_LABELS) as [BiologicalSex, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      <FieldLabel>Nível de atividade</FieldLabel>
      <Controller
        name="activityLevel"
        control={control}
        render={({ field }) => (
          <Select value={field.value ?? ''} onValueChange={field.onChange}>
            <SheetSelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SheetSelectTrigger>
            <SelectContent>
              {(Object.entries(ACTIVITY_LEVEL_LABELS) as [ActivityLevel, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </SheetLayout>
  );
}
