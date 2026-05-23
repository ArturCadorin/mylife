'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Clock, Flame, CheckCircle2, XCircle, Circle, ArrowRight, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/components/ui/button';
import { useWorkouts, useCompleteWorkout, useSkipWorkout, useDeleteWorkout } from '@/hooks/use-fit';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { WorkoutSheet } from '@/components/fit/workout-sheet';
import {
  WORKOUT_TYPE_LABELS, WORKOUT_TYPE_ICONS, WORKOUT_STATUS_LABELS,
  type WorkoutType, type WorkoutStatus, type WorkoutResponse,
} from '@/types/api';

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(d + 'T12:00:00')
  );
}

const STATUS_CONFIG = {
  PLANNED:   { label: WORKOUT_STATUS_LABELS.PLANNED,   bg: 'bg-blue-100',    text: 'text-blue-700',    Icon: Circle         },
  COMPLETED: { label: WORKOUT_STATUS_LABELS.COMPLETED, bg: 'bg-emerald-100', text: 'text-emerald-700', Icon: CheckCircle2   },
  SKIPPED:   { label: WORKOUT_STATUS_LABELS.SKIPPED,   bg: 'bg-slate-100',   text: 'text-slate-500',   Icon: XCircle        },
} satisfies Record<WorkoutStatus, { label: string; bg: string; text: string; Icon: React.ElementType }>;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkoutsPage() {
  const [filterType,   setFilterType]   = useState<WorkoutType | ''>('');
  const [filterStatus, setFilterStatus] = useState<WorkoutStatus | ''>('');
  const [sheetOpen,    setSheetOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<WorkoutResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkoutResponse | null>(null);

  const { data, isLoading } = useWorkouts({
    type:   filterType || undefined,
    status: filterStatus || undefined,
    size:   50,
  });

  const completeMutation = useCompleteWorkout();
  const skipMutation     = useSkipWorkout();
  const deleteMutation   = useDeleteWorkout();

  async function handleComplete(w: WorkoutResponse) {
    try {
      await completeMutation.mutateAsync(w.id);
      toast.success('Treino marcado como concluído!');
    } catch {
      toast.error('Erro ao atualizar treino.');
    }
  }

  async function handleSkip(w: WorkoutResponse) {
    try {
      await skipMutation.mutateAsync(w.id);
      toast.success('Treino marcado como pulado.');
    } catch {
      toast.error('Erro ao atualizar treino.');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Treino removido.');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao remover treino.');
    }
  }

  const workouts = data?.content ?? [];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Meus Treinos</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {data?.totalElements ?? 0} treino(s) encontrado(s)
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setSheetOpen(true); }}
          className={buttonVariants({ size: 'sm', className: 'gap-1.5 rounded-xl shadow-sm' })}
        >
          <Plus className="h-4 w-4" />
          Novo treino
        </button>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-wrap gap-2">
        {/* Tipo */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterType('')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filterType === '' ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>
          {(Object.keys(WORKOUT_TYPE_LABELS) as WorkoutType[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filterType === t ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {WORKOUT_TYPE_ICONS[t]} {WORKOUT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Separador */}
        <div className="h-6 w-px self-center bg-slate-200" />

        {/* Status */}
        <div className="flex flex-wrap gap-1.5">
          {(['', 'PLANNED', 'COMPLETED', 'SKIPPED'] as const).map((s) => {
            const label = s === '' ? 'Todos' : WORKOUT_STATUS_LABELS[s];
            const active = filterStatus === s;
            return (
              <button
                key={s || 'all'}
                onClick={() => setFilterStatus(s)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active ? 'bg-slate-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Lista ── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100">
            <Dumbbell className="h-7 w-7 text-orange-500" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-700">Nenhum treino encontrado</p>
          <p className="mt-1 text-sm text-slate-400">Registre seu primeiro treino para começar</p>
          <button
            onClick={() => { setEditTarget(null); setSheetOpen(true); }}
            className={buttonVariants({ size: 'sm', className: 'mt-4 gap-1.5 rounded-xl' })}
          >
            <Plus className="h-4 w-4" />
            Novo treino
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => {
            const sc = STATUS_CONFIG[w.status];
            return (
              <Card key={w.id} className="group transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 px-5 py-4">
                  {/* Type badge */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-2xl">
                    {WORKOUT_TYPE_ICONS[w.type]}
                  </div>

                  {/* Main info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-800">{w.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>{WORKOUT_TYPE_LABELS[w.type]}</span>
                      <span>·</span>
                      <span>{fmtDate(w.date)}</span>
                      {w.durationMinutes && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" /> {w.durationMinutes} min
                          </span>
                        </>
                      )}
                      {w.caloriesBurned && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <Flame className="h-3 w-3" /> {w.caloriesBurned} kcal
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${sc.bg} ${sc.text}`}>
                    {sc.label}
                  </span>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {w.status === 'PLANNED' && (
                      <>
                        <button
                          onClick={() => handleComplete(w)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
                          title="Marcar como concluído"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleSkip(w)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          title="Marcar como pulado"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => { setEditTarget(w); setSheetOpen(true); }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-100 hover:text-amber-600 transition-colors"
                      title="Editar"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                        <path d="M11.5 2.5l2 2-9 9H2.5v-2l9-9z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(w)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors"
                      title="Excluir"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9H3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <Link
                      href={`/fit/workouts/${w.id}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      title="Ver detalhes"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Dialogs / Sheets ── */}
      <WorkoutSheet open={sheetOpen} onOpenChange={setSheetOpen} workout={editTarget} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Excluir treino?"
        description={`O treino "${deleteTarget?.name}" será removido permanentemente.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
