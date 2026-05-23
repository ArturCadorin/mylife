'use client';

import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: string;
  description?: React.ReactNode;

  /** Label do botão de confirmação. Padrão: "Confirmar" */
  confirmLabel?: string;

  /** Variante visual do botão. Padrão: "danger" */
  variant?: 'danger' | 'warning' | 'default';

  /** Chamado ao confirmar — pode ser async */
  onConfirm: () => void | Promise<void>;

  /** Exibe spinner no botão quando true */
  loading?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<ConfirmDialogProps['variant']>, string> = {
  danger:  'bg-rose-500 hover:bg-rose-600 focus-visible:ring-rose-500',
  warning: 'bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-500',
  default: 'bg-slate-800 hover:bg-slate-900 focus-visible:ring-slate-800',
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  variant = 'danger',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className={`${VARIANT_CLASSES[variant]} disabled:opacity-50`}
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
