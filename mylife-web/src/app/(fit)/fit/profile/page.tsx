'use client';

import { useState } from 'react';
import { Pencil, User, Ruler, Weight, Target, HeartPulse, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/components/ui/button';
import { useFitProfile, useBodyMeasurements } from '@/hooks/use-fit';
import { ProfileSheet } from '@/components/fit/profile-sheet';
import { ACTIVITY_LEVEL_LABELS, BIOLOGICAL_SEX_LABELS } from '@/types/api';
import { cn } from '@/lib/utils';

// ── helpers ───────────────────────────────────────────────────────────────────

function bmiBadge(bmi: number) {
  if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'bg-blue-100 text-blue-700' };
  if (bmi < 25)   return { label: 'Peso normal',    color: 'bg-emerald-100 text-emerald-700' };
  if (bmi < 30)   return { label: 'Sobrepeso',      color: 'bg-amber-100 text-amber-700' };
  return               { label: 'Obesidade',       color: 'bg-rose-100 text-rose-700' };
}

function fmtDate(d: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(
    new Date(d + 'T12:00:00')
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: profile, isLoading } = useFitProfile();
  const { data: measurements }       = useBodyMeasurements(0, 1);
  const lastMeasurement              = measurements?.content?.[0];

  const bmi = profile?.bmi;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Perfil Físico</h1>
          <p className="mt-0.5 text-sm text-slate-500">Seus dados de saúde e composição corporal</p>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className={buttonVariants({ size: 'sm', className: 'gap-1.5 rounded-xl' })}
        >
          <Pencil className="h-4 w-4" />
          Editar perfil
        </button>
      </div>

      {/* ── Hero — IMC ── */}
      {!isLoading && profile?.bmi && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 p-6 text-white shadow-xl shadow-sky-300/25">
          <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-sm font-semibold text-sky-200">Índice de Massa Corporal</p>
            <p className="mt-2 text-5xl font-extrabold tabular-nums">{bmi?.toFixed(1)}</p>
            {bmi && (
              <span className={cn('mt-3 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold', bmiBadge(bmi).color)}>
                {bmiBadge(bmi).label}
              </span>
            )}
            <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
              {[
                { label: 'Altura', value: profile.heightCm ? `${profile.heightCm} cm` : '—' },
                { label: 'Peso',   value: profile.weightKg  ? `${profile.weightKg} kg`  : '—' },
                { label: 'Idade',  value: profile.age        ? `${profile.age} anos`      : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-sky-200">{label}</p>
                  <p className="mt-0.5 text-base font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Cards de dados ── */}
      <div className="grid gap-4 sm:grid-cols-2">

        {/* Medidas físicas */}
        <Card>
          <CardHeader className="px-6 pb-3 pt-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100">
                <Ruler className="h-4 w-4 text-sky-600" />
              </div>
              <CardTitle>Medidas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {[
                  { label: 'Altura',      value: profile?.heightCm       ? `${profile.heightCm} cm`       : '—', Icon: Ruler   },
                  { label: 'Peso atual',  value: profile?.weightKg        ? `${profile.weightKg} kg`        : '—', Icon: Weight  },
                  { label: 'Peso alvo',   value: profile?.targetWeightKg  ? `${profile.targetWeightKg} kg`  : '—', Icon: Target  },
                  { label: 'IMC',         value: profile?.bmi             ? profile.bmi.toFixed(1)          : '—', Icon: Activity },
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600">{label}</span>
                    </div>
                    <span className="font-bold text-slate-800">{value}</span>
                  </div>
                ))}

                {/* Diferença para meta */}
                {profile?.weightKg && profile?.targetWeightKg && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200/60 px-4 py-3">
                    <p className="text-xs font-semibold text-emerald-700">
                      {profile.weightKg > profile.targetWeightKg
                        ? `Faltam ${(profile.weightKg - profile.targetWeightKg).toFixed(1)} kg para a meta`
                        : profile.weightKg === profile.targetWeightKg
                        ? '🎉 Você atingiu sua meta de peso!'
                        : `${(profile.targetWeightKg - profile.weightKg).toFixed(1)} kg abaixo da meta`
                      }
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Dados pessoais */}
        <Card>
          <CardHeader className="px-6 pb-3 pt-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100">
                <User className="h-4 w-4 text-violet-600" />
              </div>
              <CardTitle>Dados pessoais</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3.5 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {[
                  { label: 'Data nascimento', value: profile?.birthDate     ? fmtDate(profile.birthDate)                      : '—' },
                  { label: 'Idade',           value: profile?.age            ? `${profile.age} anos`                           : '—' },
                  { label: 'Sexo biológico',  value: profile?.biologicalSex  ? BIOLOGICAL_SEX_LABELS[profile.biologicalSex]   : '—' },
                  { label: 'Nível atividade', value: profile?.activityLevel  ? ACTIVITY_LEVEL_LABELS[profile.activityLevel]   : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className="font-bold text-slate-800 text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Última medição ── */}
      {lastMeasurement && (
        <Card>
          <CardHeader className="px-6 pb-3 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100">
                  <HeartPulse className="h-4 w-4 text-violet-600" />
                </div>
                <CardTitle>Última medição corporal</CardTitle>
              </div>
              <span className="text-xs text-slate-400">{fmtDate(lastMeasurement.date)}</span>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: 'Peso',        value: lastMeasurement.weightKg          ? `${lastMeasurement.weightKg} kg`         : null },
                { label: 'Gordura',     value: lastMeasurement.bodyFatPercentage  ? `${lastMeasurement.bodyFatPercentage}%`  : null },
                { label: 'Massa musc.', value: lastMeasurement.muscleMassKg       ? `${lastMeasurement.muscleMassKg} kg`     : null },
                { label: 'Cintura',     value: lastMeasurement.waistCm            ? `${lastMeasurement.waistCm} cm`          : null },
                { label: 'Peito',       value: lastMeasurement.chestCm            ? `${lastMeasurement.chestCm} cm`          : null },
                { label: 'Quadril',     value: lastMeasurement.hipsCm             ? `${lastMeasurement.hipsCm} cm`           : null },
                { label: 'Braço E.',    value: lastMeasurement.leftArmCm          ? `${lastMeasurement.leftArmCm} cm`        : null },
                { label: 'Coxa E.',     value: lastMeasurement.leftThighCm        ? `${lastMeasurement.leftThighCm} cm`      : null },
              ].filter(({ value }) => value !== null).map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-slate-50 px-3 py-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="mt-1 text-base font-extrabold tabular-nums text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Empty state ── */}
      {!isLoading && !profile?.heightCm && !profile?.weightKg && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sky-300 bg-sky-50/50 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100">
            <User className="h-7 w-7 text-sky-500" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-700">Perfil incompleto</p>
          <p className="mt-1 text-sm text-slate-400">Adicione seus dados físicos para calcular o IMC e acompanhar sua evolução</p>
          <button
            onClick={() => setSheetOpen(true)}
            className={buttonVariants({ size: 'sm', className: 'mt-4 gap-1.5 rounded-xl' })}
          >
            <Pencil className="h-4 w-4" />
            Completar perfil
          </button>
        </div>
      )}

      <ProfileSheet open={sheetOpen} onOpenChange={setSheetOpen} profile={profile} />
    </div>
  );
}
