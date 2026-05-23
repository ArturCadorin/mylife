import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  /** Rótulo da métrica */
  title: string;
  /** Valor formatado para exibição */
  value: string;
  /** Informação de apoio abaixo do valor */
  sub: string;
  /** Ícone Lucide */
  icon: LucideIcon;
  /**
   * Classes Tailwind do gradiente — ex.: `"from-sky-400 to-blue-600"`
   * O gradiente é sempre `bg-gradient-to-br`.
   */
  gradient: string;
  /**
   * Classes de sombra colorida — ex.: `"shadow-sky-300/40 dark:shadow-sky-900/30"`
   */
  shadowColor?: string;
  /** Estado de carregamento */
  loading?: boolean;
  className?: string;
}

/**
 * Card de métrica reutilizável com gradiente colorido.
 * Usado no Dashboard (Saldo, Patrimônio, Cofrinhos, Dívida…).
 */
export function StatCard({
  title, value, sub, icon: Icon,
  gradient, shadowColor, loading, className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg',
        gradient,
        shadowColor,
        className,
      )}
    >
      {/* ── Círculos decorativos ── */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-8 -left-3 h-24 w-24 rounded-full bg-black/10" />

      <div className="relative">
        {/* Ícone */}
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
          <Icon className="h-5 w-5 text-white" />
        </div>

        {/* Rótulo */}
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
          {title}
        </p>

        {/* Valor */}
        {loading ? (
          <Skeleton className="mt-1.5 h-8 w-40 rounded-lg bg-white/20" />
        ) : (
          <p className="mt-1 text-2xl font-extrabold tabular-nums leading-tight">
            {value}
          </p>
        )}

        {/* Sub-info */}
        <p className="mt-1.5 text-xs font-medium text-white/60">{sub}</p>
      </div>
    </div>
  );
}
