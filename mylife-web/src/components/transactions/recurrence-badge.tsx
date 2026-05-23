'use client';

import { RefreshCw } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  RECURRENCE_FREQUENCY_LABELS,
  type TransactionResponse,
} from '@/types/api';

const RECURRENCE_TYPE_LABELS: Record<string, string> = {
  AUTOMATIC: 'Automática',
  MANUAL:    'Manual',
};

function formatDateBR(ymd: string) {
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

interface RecurrenceBadgeProps {
  tx: Pick<
    TransactionResponse,
    | 'recurrenceType'
    | 'recurrenceFrequency'
    | 'recurrenceCurrentCount'
    | 'recurrenceTotalCount'
    | 'nextOccurrenceDate'
  >;
}

export function RecurrenceBadge({ tx }: RecurrenceBadgeProps) {
  if (tx.recurrenceType === 'NONE') return null;

  const typeLabel = RECURRENCE_TYPE_LABELS[tx.recurrenceType] ?? tx.recurrenceType;
  const freqLabel = tx.recurrenceFrequency
    ? RECURRENCE_FREQUENCY_LABELS[tx.recurrenceFrequency]
    : null;
  const hasCount =
    tx.recurrenceCurrentCount != null && tx.recurrenceTotalCount != null;
  const nextDate = tx.nextOccurrenceDate ? formatDateBR(tx.nextOccurrenceDate) : null;

  return (
    <TooltipProvider delay={250}>
      <Tooltip>
        <TooltipTrigger
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-50 outline-none cursor-default border-0 p-0 hover:bg-violet-100 transition-colors"
        >
          <RefreshCw className="h-3 w-3 text-violet-500" />
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="flex flex-col items-start gap-1 text-left px-3 py-2 min-w-[160px]"
        >
          <p className="font-semibold text-xs">Recorrência {typeLabel}</p>
          {freqLabel && (
            <p className="text-xs opacity-80">Frequência: {freqLabel}</p>
          )}
          {hasCount && (
            <p className="text-xs opacity-80">
              Ocorrência: {tx.recurrenceCurrentCount} de {tx.recurrenceTotalCount}
            </p>
          )}
          {nextDate && (
            <p className="text-xs opacity-80">Próxima: {nextDate}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
