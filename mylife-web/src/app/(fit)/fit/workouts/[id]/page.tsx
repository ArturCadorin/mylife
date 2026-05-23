'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, Flame, Route, Heart, CheckCircle2, XCircle,
  Dumbbell, Plus, Trash2, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  useWorkout, useCompleteWorkout, useSkipWorkout,
  useDeleteWorkout, useAddExercise, useDeleteExercise,
} from '@/hooks/use-fit';
import { WorkoutSheet } from '@/components/fit/workout-sheet';
import {
  WORKOUT_TYPE_LABELS, WORKOUT_TYPE_ICONS, WORKOUT_STATUS_LABELS,
  type WorkoutStatus, type WorkoutExerciseResponse,
} from '@/types/api';

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(d + 'T12:00:00'));
}

const STATUS_CONFIG = {
  PLANNED:   { bg: 'bg-blue-100',    text: 'text-blue-700'    },
  COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  SKIPPED:   { bg: 'bg-slate-100',   text: 'text-slate-500'   },
} satisfies Record<WorkoutStatus, { bg: string; text: string }>;

// ── Add Exercise inline form ──────────────────────────────────────────────────

function AddExerciseRow({ workoutId }: { workoutId: number }) {
  const [name,  setName]  = useState('');
  const [sets,  setSets]  = useState('');
  const [reps,  setReps]  = useState('');
  const [weight, setWeight] = useState('');
  const mutation = useAddExercise();

  async function save() {
    if (!name.trim()) return;
    try {
      await mutation.mutateAsync({
        workoutId,
        req: {
          name: name.trim(),
          sets:     sets     ? Number(sets)   : undefined,
          reps:     reps     ? Number(reps)   : undefined,
          weightKg: weight   ? Number(weight) : undefined,
        },
      });
      setName(''); setSets(''); setReps(''); setWeight('');
      toast.success('Exercício adicionado!');
    } catch {
      toast.error('Erro ao adicionar exercício.');
    }
  }

  const inp = 'h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white transition';

  return (
    <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/40 p-3 space-y-2">
      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Novo exercício</p>
      <input
        className={`${inp} col-span-full`}
        placeholder="Nome do exercício"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="grid grid-cols-3 gap-2">
        <input className={inp} type="number" placeholder="Séries" value={sets} onChange={(e) => setSets(e.target.value)} />
        <input className={inp} type="number" placeholder="Reps"   value={reps} onChange={(e) => setReps(e.target.value)} />
        <input className={inp} type="number" step="0.5" placeholder="Kg" value={weight} onChange={(e) => setWeight(e.target.value)} />
      </div>
      <button
        onClick={save}
        disabled={!name.trim() || mutation.isPending}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const workoutId = Number(id);
  const router = useRouter();

  const { data: workout, isLoading } = useWorkout(isNaN(workoutId) ? null : workoutId);

  const completeMutation   = useCompleteWorkout();
  const skipMutation       = useSkipWorkout();
  const deleteMutation     = useDeleteWorkout();
  const deleteExMutation   = useDeleteExercise();

  const [editOpen,        setEditOpen]        = useState(false);
  const [deleteWorkout,   setDeleteWorkout]   = useState(false);
  const [deleteExTarget,  setDeleteExTarget]  = useState<WorkoutExerciseResponse | null>(null);

  async function handleComplete() {
    try { await completeMutation.mutateAsync(workoutId); toast.success('Treino concluído!'); }
    catch { toast.error('Erro ao atualizar treino.'); }
  }

  async function handleSkip() {
    try { await skipMutation.mutateAsync(workoutId); toast.success('Treino pulado.'); }
    catch { toast.error('Erro ao atualizar treino.'); }
  }

  async function handleDeleteWorkout() {
    try {
      await deleteMutation.mutateAsync(workoutId);
      toast.success('Treino removido.');
      router.push('/fit/workouts');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao remover treino.');
    }
  }

  async function handleDeleteExercise() {
    if (!deleteExTarget) return;
    try {
      await deleteExMutation.mutateAsync({ workoutId, exerciseId: deleteExTarget.id });
      toast.success('Exercício removido.');
      setDeleteExTarget(null);
    } catch { toast.error('Erro ao remover exercício.'); }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-slate-700">Treino não encontrado</p>
        <Link href="/fit/workouts" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'mt-4 gap-1' })}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </div>
    );
  }

  const sc     = STATUS_CONFIG[workout.status];
  const stats  = [
    { label: 'Duração',    value: workout.durationMinutes ? `${workout.durationMinutes} min` : '—', Icon: Clock,  color: 'bg-violet-100 text-violet-600' },
    { label: 'Calorias',   value: workout.caloriesBurned  ? `${workout.caloriesBurned} kcal` : '—', Icon: Flame,  color: 'bg-rose-100 text-rose-600' },
    { label: 'Distância',  value: workout.distanceKm      ? `${workout.distanceKm} km`        : '—', Icon: Route,  color: 'bg-sky-100 text-sky-600' },
    { label: 'FC média',   value: workout.heartRateAvg    ? `${workout.heartRateAvg} bpm`     : '—', Icon: Heart,  color: 'bg-pink-100 text-pink-600' },
  ] as const;

  return (
    <div className="space-y-6">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-3">
        <Link href="/fit/workouts" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'gap-1.5 -ml-2' })}>
          <ArrowLeft className="h-4 w-4" /> Treinos
        </Link>
      </div>

      {/* ── Hero card ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 p-6 text-white shadow-xl shadow-orange-300/25">
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{WORKOUT_TYPE_ICONS[workout.type]}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sc.bg} ${sc.text}`}>
                {WORKOUT_STATUS_LABELS[workout.status]}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold">{workout.name}</h1>
            <p className="text-sm font-medium text-orange-200 capitalize">{fmtDate(workout.date)}</p>
            {workout.startTime && (
              <p className="text-sm text-orange-200">Início: {workout.startTime.slice(0, 5)}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-col gap-2">
            {workout.status === 'PLANNED' && (
              <>
                <button
                  onClick={handleComplete}
                  disabled={completeMutation.isPending}
                  className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/30 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
                </button>
                <button
                  onClick={handleSkip}
                  disabled={skipMutation.isPending}
                  className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/30 transition disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" /> Pular
                </button>
              </>
            )}
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/30 transition"
            >
              <Pencil className="h-3.5 w-3.5" /> Editar
            </button>
            <button
              onClick={() => setDeleteWorkout(true)}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500/40 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500/60 transition"
            >
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Exercícios ── */}
      <Card>
        <CardHeader className="px-6 pb-3 pt-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100">
              <Dumbbell className="h-4 w-4 text-amber-600" />
            </div>
            <CardTitle>Exercícios</CardTitle>
            <span className="ml-auto text-xs font-semibold text-slate-400">
              {workout.exercises.length} exercício(s)
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-5 space-y-3">
          {workout.exercises.length === 0 && (
            <p className="text-sm text-slate-400 py-2">Nenhum exercício registrado ainda.</p>
          )}

          {workout.exercises.map((ex, i) => (
            <div key={ex.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800">{ex.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {[
                    ex.sets     && `${ex.sets} séries`,
                    ex.reps     && `${ex.reps} reps`,
                    ex.weightKg && `${ex.weightKg} kg`,
                    ex.durationSeconds && `${ex.durationSeconds}s`,
                  ].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <button
                onClick={() => setDeleteExTarget(ex)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Add exercise row */}
          <AddExerciseRow workoutId={workoutId} />
        </CardContent>
      </Card>

      {/* ── Note ── */}
      {workout.note && (
        <Card>
          <CardContent className="px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Observação</p>
            <p className="text-sm text-slate-700 leading-relaxed">{workout.note}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Dialogs ── */}
      <WorkoutSheet open={editOpen} onOpenChange={setEditOpen} workout={workout} />

      <ConfirmDialog
        open={deleteWorkout}
        onOpenChange={setDeleteWorkout}
        title="Excluir treino?"
        description={`O treino "${workout.name}" será removido permanentemente.`}
        confirmLabel="Excluir"
        onConfirm={handleDeleteWorkout}
        loading={deleteMutation.isPending}
        variant="danger"
      />

      <ConfirmDialog
        open={!!deleteExTarget}
        onOpenChange={(v) => !v && setDeleteExTarget(null)}
        title="Remover exercício?"
        description={`"${deleteExTarget?.name}" será removido deste treino.`}
        confirmLabel="Remover"
        onConfirm={handleDeleteExercise}
        loading={deleteExMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
