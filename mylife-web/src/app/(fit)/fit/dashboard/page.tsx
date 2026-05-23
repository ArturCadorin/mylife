'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Dumbbell, Flame, Clock, Route, Zap, Calendar, Plus, ArrowRight, Trophy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useWorkoutSummary, useFitProfile } from '@/hooks/use-fit';
import { WorkoutSheet } from '@/components/fit/workout-sheet';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_ICONS, WORKOUT_STATUS_LABELS, type WorkoutType } from '@/types/api';

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(d + 'T12:00:00')
  );
}

const STATUS_STYLE = {
  PLANNED:   'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  SKIPPED:   'bg-slate-100 text-slate-500',
} as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FitDashboardPage() {
  const { user } = useAuth();
  const { data: summary, isLoading: sumLoading } = useWorkoutSummary();
  const { data: profile, isLoading: profileLoading } = useFitProfile();
  const [workoutSheetOpen, setWorkoutSheetOpen] = useState(false);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const statCards = [
    {
      title:       'Treinos este mês',
      value:       String(summary?.totalWorkoutsThisMonth ?? 0),
      sub:         `${summary?.totalWorkoutsLastMonth ?? 0} no mês anterior`,
      icon:        Dumbbell,
      gradient:    'from-orange-400 to-red-500',
      shadowColor: 'shadow-orange-300/40',
    },
    {
      title:       'Minutos treinados',
      value:       String(summary?.totalMinutesThisMonth ?? 0),
      sub:         'Este mês',
      icon:        Clock,
      gradient:    'from-violet-400 to-purple-600',
      shadowColor: 'shadow-violet-300/40',
    },
    {
      title:       'Calorias queimadas',
      value:       String(summary?.totalCaloriesThisMonth ?? 0),
      sub:         'kcal este mês',
      icon:        Flame,
      gradient:    'from-rose-400 to-pink-600',
      shadowColor: 'shadow-rose-300/40',
    },
    {
      title:       'Sequência atual',
      value:       `${summary?.currentStreak ?? 0} dias`,
      sub:         'Dias consecutivos',
      icon:        Zap,
      gradient:    'from-amber-400 to-yellow-500',
      shadowColor: 'shadow-amber-300/40',
    },
  ] as const;

  // Top workout types this month
  const typeEntries = Object.entries(summary?.byType ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5) as [WorkoutType, number][];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {greeting}, {user?.name?.split(' ')[0] ?? 'atleta'} 💪
          </h2>
          <p className="mt-0.5 text-sm capitalize text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => setWorkoutSheetOpen(true)}
          className={buttonVariants({ size: 'sm', className: 'shrink-0 gap-1.5 rounded-xl shadow-sm shadow-orange-200 bg-gradient-to-r from-orange-500 to-red-500 border-0 text-white hover:opacity-90' })}
        >
          <Plus className="h-4 w-4" />
          Novo treino
        </button>
      </div>

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 p-6 text-white shadow-xl shadow-orange-300/25">
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-44 w-44 rounded-full bg-red-700/20 blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-orange-200" />
            <p className="text-sm font-semibold text-orange-100">Resumo do mês</p>
          </div>

          {sumLoading ? (
            <Skeleton className="mt-2 h-10 w-48 rounded-lg bg-white/20" />
          ) : (
            <p className="mt-2 text-4xl font-extrabold tabular-nums tracking-tight">
              {summary?.totalWorkoutsThisMonth ?? 0} treinos
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
            {[
              { label: 'Minutos',   value: `${summary?.totalMinutesThisMonth ?? 0} min` },
              { label: 'Calorias',  value: `${summary?.totalCaloriesThisMonth ?? 0} kcal` },
              { label: 'Distância', value: `${(summary?.totalDistanceKmThisMonth ?? 0).toFixed(1)} km` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-orange-200">{label}</p>
                <p className="mt-0.5 text-base font-bold tabular-nums">
                  {sumLoading ? '…' : value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4 StatCards ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {sumLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 p-5 shadow-lg">
                <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
                <div className="relative space-y-3 pt-1">
                  <Skeleton className="h-10 w-10 rounded-xl bg-white/30" />
                  <Skeleton className="h-3 w-24 rounded bg-white/30" />
                  <Skeleton className="h-8 w-36 rounded-lg bg-white/30" />
                  <Skeleton className="h-3 w-16 rounded bg-white/30" />
                </div>
              </div>
            ))
          : statCards.map((c) => (
              <StatCard key={c.title} loading={false} {...c} />
            ))
        }
      </div>

      {/* ── Linha principal ── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Próximo treino + tipos */}
        <div className="space-y-4">

          {/* Próximo treino planejado */}
          {!sumLoading && summary?.nextPlanned && (
            <Card className="border-blue-200/60 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="px-6 pb-3 pt-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-blue-800">Próximo treino</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-5">
                <div className="space-y-2">
                  <p className="text-lg font-bold text-slate-800">{summary.nextPlanned.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{WORKOUT_TYPE_ICONS[summary.nextPlanned.type]}</span>
                    <span className="text-sm font-medium text-slate-600">{summary.nextPlanned.typeLabel}</span>
                  </div>
                  <p className="text-sm text-slate-500">{fmtDate(summary.nextPlanned.date)}</p>
                  <Link
                    href={`/fit/workouts/${summary.nextPlanned.id}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Ver detalhes <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Distribuição por tipo */}
          {typeEntries.length > 0 && (
            <Card>
              <CardHeader className="px-6 pb-3 pt-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100">
                    <Dumbbell className="h-4 w-4 text-amber-600" />
                  </div>
                  <CardTitle>Tipos de treino</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-5 space-y-3">
                {typeEntries.map(([type, count]) => {
                  const total = summary?.totalWorkoutsThisMonth ?? 1;
                  const pct   = Math.round((count / total) * 100);
                  return (
                    <div key={type}>
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{WORKOUT_TYPE_ICONS[type]}</span>
                          <span className="text-sm font-medium text-slate-700">{WORKOUT_TYPE_LABELS[type]}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-500">{count}x</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-red-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Perfil físico resumo */}
        <Card className="lg:col-span-2">
          <CardHeader className="px-6 pb-3 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100">
                  <Route className="h-4 w-4 text-sky-600" />
                </div>
                <CardTitle>Perfil físico</CardTitle>
              </div>
              <Link
                href="/fit/profile"
                className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'gap-1 -mr-2 text-xs text-sky-600' })}
              >
                Ver perfil <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {profileLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 p-4 space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: 'Peso', value: profile?.weightKg ? `${profile.weightKg} kg` : '—', color: 'text-slate-800' },
                  { label: 'Altura', value: profile?.heightCm ? `${profile.heightCm} cm` : '—', color: 'text-slate-800' },
                  { label: 'IMC', value: profile?.bmi ? profile.bmi.toFixed(1) : '—', color: profile?.bmi && profile.bmi < 25 ? 'text-emerald-600' : profile?.bmi && profile.bmi < 30 ? 'text-amber-600' : 'text-slate-800' },
                  { label: 'Idade', value: profile?.age ? `${profile.age} anos` : '—', color: 'text-slate-800' },
                  { label: 'Peso alvo', value: profile?.targetWeightKg ? `${profile.targetWeightKg} kg` : '—', color: 'text-slate-800' },
                  { label: 'Nível atividade', value: profile?.activityLevel?.replace('_', ' ') ?? '—', color: 'text-slate-800' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
                    <p className={`mt-1 text-lg font-extrabold tabular-nums ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {!profileLoading && profile && !profile.heightCm && !profile.weightKg && (
              <div className="mt-4 rounded-xl border border-dashed border-sky-300 bg-sky-50/50 p-4 text-center">
                <p className="text-sm text-sky-600 font-medium">Complete seu perfil físico para ver seus dados</p>
                <Link href="/fit/profile" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800">
                  Completar perfil <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Ações rápidas ── */}
      <Card>
        <CardHeader className="px-6 pb-3 pt-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100">
              <Zap className="h-4 w-4 text-orange-600" />
            </div>
            <CardTitle>Ações rápidas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 px-6 pb-5 sm:grid-cols-4">
          {[
            { label: 'Novo treino',    onClick: () => setWorkoutSheetOpen(true), bg: 'from-orange-500 to-red-500', Icon: Plus },
            { label: 'Meus treinos',   href: '/fit/workouts',                    bg: 'from-violet-500 to-purple-500', Icon: Dumbbell },
            { label: 'Perfil físico',  href: '/fit/profile',                     bg: 'from-sky-500 to-blue-500', Icon: Route },
            { label: 'Medidas',        href: '/fit/measurements',                bg: 'from-emerald-500 to-teal-500', Icon: Flame },
          ].map(({ label, href, onClick, bg, Icon }) =>
            href ? (
              <Link key={label} href={href}
                className={`flex flex-col items-center gap-1.5 rounded-xl bg-gradient-to-br px-2 py-3.5 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md ${bg}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ) : (
              <button key={label} type="button" onClick={onClick}
                className={`flex flex-col items-center gap-1.5 rounded-xl bg-gradient-to-br px-2 py-3.5 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md ${bg}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            )
          )}
        </CardContent>
      </Card>

      <WorkoutSheet open={workoutSheetOpen} onOpenChange={setWorkoutSheetOpen} />
    </div>
  );
}
