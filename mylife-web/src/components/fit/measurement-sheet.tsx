'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Activity, Calendar } from 'lucide-react';

import {
  SheetLayout, SheetInput, FieldLabel, SectionDivider,
} from '@/components/ui/sheet-primitives';

import { useCreateMeasurement } from '@/hooks/use-fit';

const schema = z.object({
  date:               z.string().min(1, 'Data obrigatória'),
  weightKg:           z.coerce.number().min(1).max(500).optional().or(z.literal('')),
  bodyFatPercentage:  z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  muscleMassKg:       z.coerce.number().min(0).max(200).optional().or(z.literal('')),
  waistCm:            z.coerce.number().min(0).max(300).optional().or(z.literal('')),
  chestCm:            z.coerce.number().min(0).max(300).optional().or(z.literal('')),
  hipsCm:             z.coerce.number().min(0).max(300).optional().or(z.literal('')),
  leftArmCm:          z.coerce.number().min(0).max(200).optional().or(z.literal('')),
  rightArmCm:         z.coerce.number().min(0).max(200).optional().or(z.literal('')),
  leftThighCm:        z.coerce.number().min(0).max(200).optional().or(z.literal('')),
  rightThighCm:       z.coerce.number().min(0).max(200).optional().or(z.literal('')),
  note:               z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function today() {
  return new Date().toISOString().split('T')[0];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeasurementSheet({ open, onOpenChange }: Props) {
  const mutation = useCreateMeasurement();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: today(),
      weightKg: '', bodyFatPercentage: '', muscleMassKg: '',
      waistCm: '', chestCm: '', hipsCm: '',
      leftArmCm: '', rightArmCm: '', leftThighCm: '', rightThighCm: '',
      note: '',
    },
  });

  useEffect(() => {
    if (open) reset({ date: today() });
  }, [open, reset]);

  function num(v: unknown) {
    if (v === '' || v === undefined || v === null) return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  }

  async function onSubmit(data: FormData) {
    try {
      await mutation.mutateAsync({
        date: data.date,
        weightKg:          num(data.weightKg),
        bodyFatPercentage: num(data.bodyFatPercentage),
        muscleMassKg:      num(data.muscleMassKg),
        waistCm:           num(data.waistCm),
        chestCm:           num(data.chestCm),
        hipsCm:            num(data.hipsCm),
        leftArmCm:         num(data.leftArmCm),
        rightArmCm:        num(data.rightArmCm),
        leftThighCm:       num(data.leftThighCm),
        rightThighCm:      num(data.rightThighCm),
        note:              data.note || undefined,
      });
      toast.success('Medidas registradas!');
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao registrar medidas.');
    }
  }

  return (
    <SheetLayout
      open={open} onOpenChange={onOpenChange}
      tint="violet"
      icon={<Activity className="h-5 w-5" />}
      title="Registrar Medidas"
      subtitle="Acompanhe a evolução do seu corpo."
      ctaLabel="Registrar"
      onSubmit={handleSubmit(onSubmit)}
      isPending={mutation.isPending}
    >
      <SectionDivider label="Data" />

      <div className="space-y-1.5">
        <FieldLabel>Data da medição</FieldLabel>
        <SheetInput id="date" type="date" icon={<Calendar className="h-3.5 w-3.5" />} {...register('date')} />
        {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
      </div>

      <SectionDivider label="Composição corporal" />

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <FieldLabel>Peso (kg)</FieldLabel>
          <SheetInput id="weightKg" type="number" step="0.1" placeholder="80.0" {...register('weightKg')} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Gordura (%)</FieldLabel>
          <SheetInput id="bodyFatPercentage" type="number" step="0.1" placeholder="18.0" {...register('bodyFatPercentage')} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Massa musc. (kg)</FieldLabel>
          <SheetInput id="muscleMassKg" type="number" step="0.1" placeholder="55.0" {...register('muscleMassKg')} />
        </div>
      </div>

      <SectionDivider label="Circunferências (cm)" />

      <div className="grid grid-cols-3 gap-3">
        {[
          { id: 'waistCm', label: 'Cintura' },
          { id: 'chestCm', label: 'Peito' },
          { id: 'hipsCm', label: 'Quadril' },
          { id: 'leftArmCm', label: 'Braço Esq.' },
          { id: 'rightArmCm', label: 'Braço Dir.' },
          { id: 'leftThighCm', label: 'Coxa Esq.' },
          { id: 'rightThighCm', label: 'Coxa Dir.' },
        ].map(({ id, label }) => (
          <div key={id} className="space-y-1.5">
            <FieldLabel>{label}</FieldLabel>
            <SheetInput id={id} type="number" step="0.1" placeholder="—"
              {...register(id as keyof FormData)} />
          </div>
        ))}
      </div>

      <SectionDivider label="Observações" />

      <div className="space-y-1.5">
        <FieldLabel>Nota <span className="normal-case font-normal text-slate-400">(opcional)</span></FieldLabel>
        <SheetInput id="note" placeholder="Como você está se sentindo?" {...register('note')} />
      </div>
    </SheetLayout>
  );
}
