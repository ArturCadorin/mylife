'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Pencil, Calendar, Activity, Venus, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useFitProfile } from '@/hooks/use-fit';
import { ACTIVITY_LEVEL_LABELS, BIOLOGICAL_SEX_LABELS } from '@/types/api';
import { cn } from '@/lib/utils';

function fmtDate(d: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date(d + 'T12:00:00'));
}

export function UserProfilePopover() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useFitProfile();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initial = user?.name?.charAt(0).toUpperCase() ?? 'U';

  /* Fecha ao clicar fora */
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const rows = [
    {
      Icon: Calendar,
      label: 'Data de nascimento',
      value: profile?.birthDate ? fmtDate(profile.birthDate) : null,
    },
    {
      Icon: User,
      label: 'Idade',
      value: profile?.age ? `${profile.age} anos` : null,
    },
    {
      Icon: Venus,
      label: 'Sexo biológico',
      value: profile?.biologicalSex ? BIOLOGICAL_SEX_LABELS[profile.biologicalSex] : null,
    },
    {
      Icon: Activity,
      label: 'Nível de atividade',
      value: profile?.activityLevel ? ACTIVITY_LEVEL_LABELS[profile.activityLevel] : null,
    },
  ];

  const hasProfile = rows.some((r) => r.value);

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-xl px-2 py-1 transition-colors hover:bg-slate-100 dark:hover:bg-white/8 outline-none"
      >
        <span className="hidden text-sm font-medium text-slate-600 dark:text-slate-400 sm:block">
          {user?.name}
        </span>
        <Avatar className="h-7 w-7 ring-2 ring-emerald-500/30">
          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs font-bold">
            {initial}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* ── Painel ── */}
      {open && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 z-50 w-72',
            'rounded-2xl border border-slate-200/80 dark:border-white/10',
            'bg-white dark:bg-card shadow-xl shadow-slate-200/60 dark:shadow-black/50',
            'animate-fade-in-up overflow-hidden',
          )}
        >
          {/* Header do painel */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 px-5 py-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-white/30">
                <AvatarFallback className="bg-white/20 text-white font-bold text-base">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                <p className="text-xs text-emerald-100 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Dados pessoais */}
          <div className="px-4 py-3">
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Dados pessoais
              </p>
              <Link
                href="/fit/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <Pencil className="h-2.5 w-2.5" />
                Editar
              </Link>
            </div>

            <div className="space-y-1">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  ))
                : !hasProfile
                ? (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 py-4 text-center">
                    <User className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-600" />
                    <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                      Perfil físico não preenchido
                    </p>
                    <Link
                      href="/fit/profile"
                      onClick={() => setOpen(false)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Completar perfil <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )
                : rows.map(({ Icon, label, value }) => value ? (
                  <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-white/4 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 text-right max-w-[45%] truncate">{value}</span>
                  </div>
                ) : null)
              }
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 dark:border-white/6 px-4 py-2.5">
            <Link
              href="/fit/profile"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Ver perfil completo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
