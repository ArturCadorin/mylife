'use client';

import { useState } from 'react';
import { Plus, Activity, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useBodyMeasurements, useDeleteMeasurement } from '@/hooks/use-fit';
import { MeasurementSheet } from '@/components/fit/measurement-sheet';
import type { BodyMeasurementResponse } from '@/types/api';

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(d + 'T12:00:00')
  );
}

// ── Measurement card ──────────────────────────────────────────────────────────

function MeasurementCard({
  m,
  onDelete,
}: {
  m: BodyMeasurementResponse;
  onDelete: (m: BodyMeasurementResponse) => void;
}) {
  const mainFields = [
    { label: 'Peso',     value: m.weightKg          ? `${m.weightKg} kg`         : null },
    { label: 'Gordura',  value: m.bodyFatPercentage  ? `${m.bodyFatPercentage}%`  : null },
    { label: 'M. Musc.', value: m.muscleMassKg       ? `${m.muscleMassKg} kg`     : null },
  ].filter(({ value }) => value !== null);

  const circumFields = [
    { label: 'Cintura',  value: m.waistCm      ? `${m.waistCm} cm`      : null },
    { label: 'Peito',    value: m.chestCm      ? `${m.chestCm} cm`      : null },
    { label: 'Quadril',  value: m.hipsCm       ? `${m.hipsCm} cm`       : null },
    { label: 'Braço E.', value: m.leftArmCm    ? `${m.leftArmCm} cm`    : null },
    { label: 'Braço D.', value: m.rightArmCm   ? `${m.rightArmCm} cm`   : null },
    { label: 'Coxa E.',  value: m.leftThighCm  ? `${m.leftThighCm} cm`  : null },
    { label: 'Coxa D.',  value: m.rightThighCm ? `${m.rightThighCm} cm` : null },
  ].filter(({ value }) => value !== null);

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
              <Activity className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800">{fmtDate(m.date)}</p>
              {m.note && <p className="mt-0.5 text-xs text-slate-400 italic">&ldquo;{m.note}&rdquo;</p>}
            </div>
          </div>
          <button
            onClick={() => onDelete(m)}
            className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-100 hover:text-rose-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Composition row */}
        {mainFields.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {mainFields.map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-violet-50 px-3 py-1.5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-400">{label}</p>
                <p className="mt-0.5 text-sm font-extrabold tabular-nums text-violet-700">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Circumferences */}
        {circumFields.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {circumFields.map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-slate-50 px-2.5 py-1">
                <span className="text-[10px] text-slate-400">{label} </span>
                <span className="text-[11px] font-bold text-slate-700">{value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

export default function MeasurementsPage() {
  const [page,         setPage]         = useState(0);
  const [sheetOpen,    setSheetOpen]    = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BodyMeasurementResponse | null>(null);

  const { data, isLoading } = useBodyMeasurements(page, PAGE_SIZE);
  const deleteMutation      = useDeleteMeasurement();

  const measurements = data?.content ?? [];
  const totalPages   = data?.totalPages ?? 0;
  const total        = data?.totalElements ?? 0;

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Medição removida.');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao remover medição.');
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Medidas Corporais</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {total} medição(ões) registrada(s)
          </p>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className={buttonVariants({ size: 'sm', className: 'gap-1.5 rounded-xl' })}
        >
          <Plus className="h-4 w-4" />
          Registrar medidas
        </button>
      </div>

      {/* ── List ── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-12 w-20 rounded-lg" />)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : measurements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-violet-300 bg-violet-50/40 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100">
            <Activity className="h-7 w-7 text-violet-500" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-700">Nenhuma medição registrada</p>
          <p className="mt-1 text-sm text-slate-400">Registre suas medidas corporais para acompanhar sua evolução</p>
          <button
            onClick={() => setSheetOpen(true)}
            className={buttonVariants({ size: 'sm', className: 'mt-4 gap-1.5 rounded-xl' })}
          >
            <Plus className="h-4 w-4" />
            Primeira medição
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {measurements.map((m) => (
            <MeasurementCard key={m.id} m={m} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-slate-600">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Sheet + Dialog ── */}
      <MeasurementSheet open={sheetOpen} onOpenChange={setSheetOpen} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Remover medição?"
        description={`A medição de ${deleteTarget ? fmtDate(deleteTarget.date) : ''} será removida permanentemente.`}
        confirmLabel="Remover"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
