'use client';

import { forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  wrapperClassName?: string;
}

function centsToBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, wrapperClassName, ...props }, ref) => {
    const displayValue = value !== undefined ? centsToBRL(Math.round(value * 100)) : '';

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '');
      if (!digits) { onChange(undefined); return; }
      onChange(parseInt(digits, 10) / 100);
    }, [onChange]);

    return (
      <div className={cn('relative', wrapperClassName)}>
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none select-none">
          R$
        </span>
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors',
            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
CurrencyInput.displayName = 'CurrencyInput';
