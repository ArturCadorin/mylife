'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Pencil, Calendar, Activity, Venus, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useFitProfile } from '@/hooks/use-fit';
import { ACTIVITY_LEVEL_LABELS, BIOLOGICAL_SEX_LABELS } from '@/types/api';
import { cn } from '@/lib/utils';
import { ProfileEditSheet } from '@/components/layout/profile-edit-sheet';

function fmtDate(d: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date(d + 'T12:00:00'));
}

/* ── Paleta por solução ───────────────────────────────────────────────────── */
function useSolutionTheme(pathname: string) {
  const isFit = pathname.startsWith('/fit/');
  return isFit
    ? {
        gradient:    'from-orange-500 to-red-500',
        ring:        'ring-orange-500/30',
        subText:     'text-orange-100',
        editBtn:     'text-orange-600 dark:text-orange-400',
        footerHover: 'hover:text-orange-600 dark:hover:text-orange-400',
        avatarRing:  'ring-orange-500/30',
      }
    : {
        gradient:    'from-emerald-500 to-teal-500',
        ring:        'ring-emerald-500/30',
        subText:     'text-emerald-100',
        editBtn:     'text-emerald-600 dark:text-emerald-400',
        footerHover: 'hover:text-emerald-600 dark:hover:text-emerald-400',
        avatarRing:  'ring-emerald-500/30',
      };
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function UserProfilePopover() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { data: profile, isLoading } = useFitProfile();
  const theme = useSolutionTheme(pathname);

  const [open, setOpen]                   = useState(false);
  const [sheetOpen, setSheetOpen]         = useState(false);
  const [panelPos, setPanelPos]           = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  const initial = user?.name?.charAt(0).toUpperCase() ?? 'U';

  /* Abre o sheet de edição (fecha o popover primeiro) */
  function openEdit() {
    setOpen(false);
    setSheetOpen(true);
  }

  /* Calcula posição do painel relativo ao viewport */
  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPanelPos({
      top:   r.bottom + 8,
      right: window.innerWidth - r.right,
    });
  }, []);

  function toggle() {
    if (!open) calcPos();
    setOpen((v) => !v);
  }

  /* Fecha ao clicar fora */
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      const target = e.target as Node;
      const insideTrigger = triggerRef.current?.contains(target);
      const insidePanel   = panelRef.current?.contains(target);
      if (!insideTrigger && !insidePanel) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  /* Reposiciona ao rolar ou redimensionar */
  useEffect(() => {
    if (!open) return;
    const refresh = () => calcPos();
    window.addEventListener('scroll', refresh, true);
    window.addEventListener('resize', refresh);
    return () => {
      window.removeEventListener('scroll', refresh, true);
      window.removeEventListener('resize', refresh);
    };
  }, [open, calcPos]);

  const rows = [
    { Icon: Calendar, label: 'Data de nascimento', value: profile?.birthDate    ? fmtDate(profile.birthDate)                        : null },
    { Icon: User,     label: 'Idade',               value: profile?.age          ? `${profile.age} anos`                             : null },
    { Icon: Venus,    label: 'Sexo biológico',       value: profile?.biologicalSex ? BIOLOGICAL_SEX_LABELS[profile.biologicalSex]    : null },
    { Icon: Activity, label: 'Nível de atividade',   value: profile?.activityLevel ? ACTIVITY_LEVEL_LABELS[profile.activityLevel]   : null },
  ];
  const hasProfile = rows.some((r) => r.value);

  /* ── Painel (renderizado via Portal no body) ── */
  const panel = open && typeof document !== 'undefined' && createPortal(
    <div
      ref={panelRef}
      style={{ position: 'fixed', top: panelPos.top, right: panelPos.right, zIndex: 9999 }}
      className={cn(
        'w-72 rounded-2xl border border-slate-200/80 dark:border-white/10',
        'bg-white dark:bg-card shadow-2xl shadow-slate-300/40 dark:shadow-black/60',
        'overflow-hidden animate-fade-in-up',
      )}
    >
      {/* Header colorido */}
      <div className={cn('bg-gradient-to-br px-5 py-4', theme.gradient)}>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-white/30">
            <AvatarFallback className="bg-white/20 text-white font-bold text-base">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{user?.name}</p>
            <p className={cn('text-xs truncate', theme.subText)}>{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Dados pessoais */}
      <div className="px-4 py-3">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Dados pessoais
          </p>
          <button
            onClick={openEdit}
            className={cn('flex items-center gap-1 text-[10px] font-semibold hover:underline', theme.editBtn)}
          >
            <Pencil className="h-2.5 w-2.5" />
            Editar
          </button>
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
                <button
                  onClick={openEdit}
                  className={cn('mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline', theme.editBtn)}
                >
                  Completar perfil <ArrowRight className="h-3 w-3" />
                </button>
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
          className={cn(
            'flex items-center justify-between text-xs font-semibold',
            'text-slate-500 dark:text-slate-400 transition-colors',
            theme.footerHover,
          )}
        >
          Ver perfil completo
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>,
    document.body,
  );

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={toggle}
        className="flex items-center gap-2.5 rounded-xl px-2 py-1 transition-colors hover:bg-slate-100 dark:hover:bg-white/8 outline-none"
      >
        <span className="hidden text-sm font-medium text-slate-600 dark:text-slate-400 sm:block">
          {user?.name}
        </span>
        <Avatar className={cn('h-7 w-7 ring-2', theme.avatarRing)}>
          <AvatarFallback className={cn('bg-gradient-to-br text-white text-xs font-bold', theme.gradient)}>
            {initial}
          </AvatarFallback>
        </Avatar>
      </button>

      {panel}

      {/* Sheet de edição — abre sobre qualquer página, sem navegar */}
      <ProfileEditSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
