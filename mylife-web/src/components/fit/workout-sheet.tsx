'use client';

import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Dumbbell, Calendar, Plus, Trash2 } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import {
  SheetLayout, SheetInput, SheetSelectTrigger,
  FieldLabel, SectionDivider,
} from '@/components/ui/sheet-primitives';
import { cn } from '@/lib/utils';

import { useCreateWorkout, useUpdateWorkout } from '@/hooks/use-fit';
import {
  WORKOUT_TYPE_LABELS, WORKOUT_TYPE_ICONS, WORKOUT_STATUS_LABELS,
  type WorkoutResponse, type WorkoutType, type WorkoutStatus,
} from '@/types/api';

// ── Schema ────────────────────────────────────────────────────────────────────

const exerciseSchema = z.object({
  name:            z.string().min(1, 'Nome obrigatório'),
  sets:            z.coerce.number().int().min(1).max(100).optional().or(z.literal('')),
  reps:            z.coerce.number().int().min(1).max(1000).optional().or(z.literal('')),
  weightKg:        z.coerce.number().min(0).max(500).optional().or(z.literal('')),
  durationSeconds: z.coerce.number().int().min(1).optional().or(z.literal('')),
  restSeconds:     z.coerce.number().int().min(0).optional().or(z.literal('')),
});

const schema = z.object({
  name:            z.string().min(1, 'Nome obrigatório'),
  type:            z.string().min(1, 'Tipo obrigatório'),
  date:            z.string().min(1, 'Data obrigatória'),
  status:          z.string().optional(),
  startTime:       z.string().optional(),
  durationMinutes: z.coerce.number().int().min(1).max(1440).optional().or(z.literal('')),
  caloriesBurned:  z.coerce.number().int().min(0).optional().or(z.literal('')),
  heartRateAvg:    z.coerce.number().int().min(30).max(250).optional().or(z.literal('')),
  distanceKm:      z.coerce.number().min(0).max(1000).optional().or(z.literal('')),
  pace:            z.string().optional(),
  note:            z.string().optional(),
  exercises:       z.array(exerciseSchema).optional(),
});

type FormData = z.infer<typeof schema>;

function today() { return new Date().toISOString().split('T')[0]; }
function num(v: unknown) {
  if (v === '' || v === undefined || v === null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout?: WorkoutResponse | null;
}

const DISTANCE_TYPES: WorkoutType[] = ['RUNNING', 'CYCLING', 'SWIMMING', 'WALKING'];

// ── Component ─────────────────────────────────────────────────────────────────

export function WorkoutSheet({ open, onOpenChange, workout }: Props) {
  const isEdit = !!workout;
  const createMutation = useCreateWorkout();
  const updateMutation = useUpdateWorkout();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', type: '', date: today(), status: 'PLANNED',
      startTime: '', durationMinutes: '', caloriesBurned: '', heartRateAvg: '',
      distanceKm: '', pace: '', note: '', exercises: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'exercises' });
  const watchedType = watch('type') as WorkoutType | '';

  const showDistance = DISTANCE_TYPES.includes(watchedType as WorkoutType);
  const showExercises = watchedType === 'GYM' || watchedType === 'FUNCTIONAL' || watchedType === 'HIIT';

  useEffect(() => {
    if (open) {
      if (workout) {
        reset({
          name:            workout.name,
          type:            workout.type,
          date:            workout.date,
          status:          workout.status,
          startTime:       workout.startTime ?? '',
          durationMinutes: workout.durationMinutes ?? '',
          caloriesBurned:  workout.caloriesBurned ?? '',
          heartRateAvg:    workout.heartRateAvg ?? '',
          distanceKm:      workout.distanceKm ?? '',
          pace:            workout.pace ?? '',
          note:            workout.note ?? '',
          exercises:       [],
        });
      } else {
        reset({
          name: '', type: '', date: today(), status: 'PLANNED',
          startTime: '', durationMinutes: '', caloriesBurned: '', heartRateAvg: '',
          distanceKm: '', pace: '', note: '', exercises: [],
        });
      }
    }
  }, [open, workout, reset]);

  async function onSubmit(data: FormData) {
    try {
      if (isEdit && workout) {
        await updateMutation.mutateAsync({
          id: workout.id,
          req: {
            name:            data.name,
            type:            data.type as WorkoutType,
            date:            data.date,
            status:          (data.status || 'PLANNED') as WorkoutStatus,
            startTime:       data.startTime || undefined,
            durationMinutes: num(data.durationMinutes),
            caloriesBurned:  num(data.caloriesBurned),
            heartRateAvg:    num(data.heartRateAvg),
            distanceKm:      num(data.distanceKm),
            pace:            data.pace || undefined,
            note:            data.note || undefined,
          },
        });
        toast.success('Treino atualizado!');
      } else {
        await createMutation.mutateAsync({
          name:            data.name,
          type:            data.type as WorkoutType,
          date:            data.date,
          startTime:       data.startTime || undefined,
          durationMinutes: num(data.durationMinutes),
          caloriesBurned:  num(data.caloriesBurned),
          heartRateAvg:    num(data.heartRateAvg),
          distanceKm:      num(data.distanceKm),
          pace:            data.pace || undefined,
          note:            data.note || undefined,
          exercises:       data.exercises?.filter(e => e.name).map((e, i) => ({
            name:            e.name,
            sets:            num(e.sets),
            reps:            num(e.reps),
            weightKg:        num(e.weightKg),
            durationSeconds: num(e.durationSeconds),
            restSeconds:     num(e.restSeconds),
            exerciseOrder:   i + 1,
          })),
        });
        toast.success('Treino registrado!');
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao salvar treino.');
    }
  }

  return (
    <SheetLayout
      open={open} onOpenChange={onOpenChange}
      tint="amber"
      icon={<Dumbbell className="h-5 w-5" />}
      title={isEdit ? 'Editar Treino' : 'Novo Treino'}
      subtitle={isEdit ? 'Atualize os dados do treino.' : 'Registre um novo treino.'}
      ctaLabel={isEdit ? 'Salvar alterações' : 'Registrar treino'}
      onSubmit={handleSubmit(onSubmit)}
      isPending={isPending}
    >
      {/* ── Informações básicas ── */}
      <SectionDivider label="Informações" />

      <div className="space-y-1.5">
        <FieldLabel>Nome do treino</FieldLabel>
        <SheetInput id="name" placeholder="Ex: Treino de peito e tríceps" {...register('name')} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel>Tipo</FieldLabel>
          <Controller name="type" control={control} render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SheetSelectTrigger><SelectValue placeholder="Selecione" /></SheetSelectTrigger>
              <SelectContent>
                {Object.entries(WORKOUT_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {WORKOUT_TYPE_ICONS[k as WorkoutType]} {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
          {errors.type && <p className="text-xs text-red-500">Selecione o tipo</p>}
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Data</FieldLabel>
          <SheetInput id="date" type="date" icon={<Calendar className="h-3.5 w-3.5" />} {...register('date')} />
          {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
        </div>
      </div>

      {isEdit && (
        <div className="space-y-1.5">
          <FieldLabel>Status</FieldLabel>
          <Controller name="status" control={control} render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SheetSelectTrigger><SelectValue placeholder="Selecione" /></SheetSelectTrigger>
              <SelectContent>
                {Object.entries(WORKOUT_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </div>
      )}

      {/* ── Métricas ── */}
      <SectionDivider label="Métricas" />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel>Horário início</FieldLabel>
          <SheetInput id="startTime" type="time" {...register('startTime')} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Duração (min)</FieldLabel>
          <SheetInput id="durationMinutes" type="number" placeholder="60" {...register('durationMinutes')} />
        </div>
      </div>

      <div className={cn('grid gap-3', showDistance ? 'grid-cols-2' : 'grid-cols-2')}>
        <div className="space-y-1.5">
          <FieldLabel>Calorias (kcal)</FieldLabel>
          <SheetInput id="caloriesBurned" type="number" placeholder="350" {...register('caloriesBurned')} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>FC média (bpm)</FieldLabel>
          <SheetInput id="heartRateAvg" type="number" placeholder="140" {...register('heartRateAvg')} />
        </div>
      </div>

      {showDistance && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel>Distância (km)</FieldLabel>
            <SheetInput id="distanceKm" type="number" step="0.01" placeholder="5.0" {...register('distanceKm')} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Pace (min/km)</FieldLabel>
            <SheetInput id="pace" placeholder="5:30" {...register('pace')} />
          </div>
        </div>
      )}

      {/* ── Exercícios (create only, para GYM/FUNCTIONAL/HIIT) ── */}
      {!isEdit && showExercises && (
        <>
          <SectionDivider label="Exercícios" />

          {fields.map((field, index) => (
            <div key={field.id} className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Exercício {index + 1}</span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <SheetInput
                placeholder="Nome do exercício"
                {...register(`exercises.${index}.name`)}
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Séries</p>
                  <SheetInput type="number" placeholder="3" {...register(`exercises.${index}.sets`)} />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Reps</p>
                  <SheetInput type="number" placeholder="12" {...register(`exercises.${index}.reps`)} />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Carga (kg)</p>
                  <SheetInput type="number" step="0.5" placeholder="20" {...register(`exercises.${index}.weightKg`)} />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => append({ name: '', sets: '', reps: '', weightKg: '', durationSeconds: '', restSeconds: '' })}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-amber-300 py-2.5 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar exercício
          </button>
        </>
      )}

      {/* ── Observações ── */}
      <SectionDivider label="Observações" />

      <div className="space-y-1.5">
        <FieldLabel>Nota <span className="normal-case font-normal text-slate-400">(opcional)</span></FieldLabel>
        <SheetInput id="note" placeholder="Como foi o treino?" {...register('note')} />
      </div>
    </SheetLayout>
  );
}
