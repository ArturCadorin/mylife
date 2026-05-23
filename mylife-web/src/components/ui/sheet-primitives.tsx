'use client';

import { createContext, forwardRef, useContext } from 'react';
import { Loader2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { SelectTrigger } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { SheetDatePicker as BaseDatePicker, SheetMonthPicker as BaseMonthPicker } from '@/components/ui/date-picker';

// ── Tint system ───────────────────────────────────────────────────────────────

export interface TintConfig {
  inputBg:     string;
  inputBorder: string;
  focusRing:   string;
  focusHex:    string;
  iconColor:   string;
  dividerText: string;
  bodyBg:      string;
  accentBg:    string;
  accentText:  string;
  ctaGradient: string;
  ctaShadow:   string;
}

export const TINTS: Record<string, TintConfig> = {
  emerald: {
    inputBg:     'bg-emerald-100/40',
    inputBorder: 'border-emerald-200/60',
    focusRing:   'rgba(16,185,129,0.18)',
    focusHex:    '#6ee7b7',
    iconColor:   'text-emerald-500',
    dividerText: 'text-emerald-300',
    bodyBg:      'from-emerald-50/40 to-white',
    accentBg:    'bg-emerald-50',
    accentText:  'text-emerald-600',
    ctaGradient: 'from-emerald-500 to-emerald-600',
    ctaShadow:   'shadow-emerald-200',
  },
  violet: {
    inputBg:     'bg-violet-100/40',
    inputBorder: 'border-violet-200/60',
    focusRing:   'rgba(139,92,246,0.18)',
    focusHex:    '#c4b5fd',
    iconColor:   'text-violet-500',
    dividerText: 'text-violet-300',
    bodyBg:      'from-violet-50/40 to-white',
    accentBg:    'bg-violet-50',
    accentText:  'text-violet-600',
    ctaGradient: 'from-violet-500 to-violet-600',
    ctaShadow:   'shadow-violet-200',
  },
  rose: {
    inputBg:     'bg-rose-100/40',
    inputBorder: 'border-rose-200/60',
    focusRing:   'rgba(244,63,94,0.18)',
    focusHex:    '#fda4af',
    iconColor:   'text-rose-500',
    dividerText: 'text-rose-300',
    bodyBg:      'from-rose-50/40 to-white',
    accentBg:    'bg-rose-50',
    accentText:  'text-rose-600',
    ctaGradient: 'from-rose-500 to-rose-600',
    ctaShadow:   'shadow-rose-200',
  },
  blue: {
    inputBg:     'bg-blue-100/40',
    inputBorder: 'border-blue-200/60',
    focusRing:   'rgba(59,130,246,0.18)',
    focusHex:    '#93c5fd',
    iconColor:   'text-blue-500',
    dividerText: 'text-blue-300',
    bodyBg:      'from-blue-50/40 to-white',
    accentBg:    'bg-blue-50',
    accentText:  'text-blue-600',
    ctaGradient: 'from-blue-500 to-blue-600',
    ctaShadow:   'shadow-blue-200',
  },
  amber: {
    inputBg:     'bg-amber-100/40',
    inputBorder: 'border-amber-200/60',
    focusRing:   'rgba(245,158,11,0.18)',
    focusHex:    '#fcd34d',
    iconColor:   'text-amber-500',
    dividerText: 'text-amber-300',
    bodyBg:      'from-amber-50/40 to-white',
    accentBg:    'bg-amber-50',
    accentText:  'text-amber-600',
    ctaGradient: 'from-amber-500 to-amber-600',
    ctaShadow:   'shadow-amber-200',
  },
  sky: {
    inputBg:     'bg-sky-100/40',
    inputBorder: 'border-sky-200/60',
    focusRing:   'rgba(14,165,233,0.18)',
    focusHex:    '#7dd3fc',
    iconColor:   'text-sky-500',
    dividerText: 'text-sky-300',
    bodyBg:      'from-sky-50/40 to-white',
    accentBg:    'bg-sky-50',
    accentText:  'text-sky-600',
    ctaGradient: 'from-sky-500 to-sky-600',
    ctaShadow:   'shadow-sky-200',
  },
};

export const TintCtx = createContext<TintConfig>(TINTS.emerald);
export const useTint = () => useContext(TintCtx);

// ── SheetLayout ───────────────────────────────────────────────────────────────

interface SheetLayoutProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tint: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  onSubmit: () => void;
  isPending: boolean;
  children: React.ReactNode;
}

export function SheetLayout({
  open, onOpenChange, tint, icon, title, subtitle,
  ctaLabel, onSubmit, isPending, children,
}: SheetLayoutProps) {
  const t = TINTS[tint] ?? TINTS.emerald;

  return (
    <TintCtx.Provider value={t}>
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          {/* Backdrop */}
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-all duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />

          {/* Modal centrado */}
          <DialogPrimitive.Popup className="fixed left-1/2 top-1/2 z-50 flex w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/8 outline-none duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.97] data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.97] max-h-[90vh]">

            {/* Header */}
            <div className="flex shrink-0 items-center gap-3.5 border-b border-slate-100 px-6 py-5">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm', t.accentBg)}>
                <span className={t.accentText}>{icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-slate-800 leading-tight">{title}</h2>
                <p className="mt-0.5 text-sm text-slate-400">{subtitle ?? 'Preencha os campos abaixo'}</p>
              </div>
              <DialogPrimitive.Close
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Fechar"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                </svg>
              </DialogPrimitive.Close>
            </div>

            {/* Body scrollável */}
            <div className={cn('flex-1 space-y-4 overflow-y-auto bg-gradient-to-b px-6 py-5', t.bodyBg)}>
              {children}
            </div>

            {/* Footer */}
            <div className="shrink-0 space-y-2 border-t border-slate-100 bg-white px-6 pb-6 pt-4">
              <button
                type="button"
                onClick={onSubmit}
                disabled={isPending}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70',
                  t.ctaGradient, t.ctaShadow,
                )}
              >
                {isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <ChevronRight className="h-4 w-4" />}
                {ctaLabel}
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="w-full rounded-xl py-2.5 text-sm text-slate-400 transition hover:text-slate-600 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </TintCtx.Provider>
  );
}

// ── Field primitives ──────────────────────────────────────────────────────────

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  );
}

export function SectionDivider({ label }: { label: string }) {
  const t = useTint();
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="h-px flex-1 bg-slate-100" />
      <span className={cn('text-[10px] font-bold uppercase tracking-widest', t.dividerText)}>{label}</span>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

// ── SheetInput ────────────────────────────────────────────────────────────────

interface SheetInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const SheetInput = forwardRef<HTMLInputElement, SheetInputProps>(
  ({ icon, className, onFocus, onBlur, ...restProps }, ref) => {
    const t = useTint();
    return (
      <div className="relative">
        {icon && (
          <div className={cn('pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2', t.iconColor)}>
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'h-11 w-full rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all',
            t.inputBg, t.inputBorder, 'focus:bg-white',
            icon ? 'pl-10 pr-3.5' : 'px-3.5',
            className,
          )}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = `0 0 0 3px ${t.focusRing}`;
            e.currentTarget.style.borderColor = t.focusHex;
            onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = '';
            e.currentTarget.style.borderColor = '';
            onBlur?.(e);
          }}
          {...restProps}
        />
      </div>
    );
  },
);
SheetInput.displayName = 'SheetInput';

// ── SheetCurrencyInput ────────────────────────────────────────────────────────

interface SheetCurrencyInputProps {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  id?: string;
  placeholder?: string;
}

export function SheetCurrencyInput({ value, onChange, id, placeholder }: SheetCurrencyInputProps) {
  const t = useTint();
  return (
    <CurrencyInput
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      wrapperClassName={cn('rounded-xl', t.inputBg)}
      className={cn('h-11 rounded-xl', t.inputBorder, 'bg-transparent')}
    />
  );
}

// ── SheetDatePicker ───────────────────────────────────────────────────────────

interface SheetDatePickerProps {
  value: string;
  onChange: (v: string) => void;
  id?: string;
}

export function SheetDatePicker({ value, onChange }: SheetDatePickerProps) {
  const t = useTint();
  // Map tint tokens to calendar accent colors
  const accentMap: Record<string, { bg: string; text: string }> = {
    'bg-emerald-100/40':  { bg: 'bg-emerald-500', text: 'text-white' },
    'bg-rose-100/40':     { bg: 'bg-rose-500',    text: 'text-white' },
    'bg-violet-100/40':   { bg: 'bg-violet-500',  text: 'text-white' },
    'bg-sky-100/40':      { bg: 'bg-sky-500',      text: 'text-white' },
    'bg-amber-100/40':    { bg: 'bg-amber-500',    text: 'text-white' },
    'bg-blue-100/40':     { bg: 'bg-blue-500',     text: 'text-white' },
  };
  const accent = accentMap[t.inputBg] ?? { bg: 'bg-slate-800', text: 'text-white' };
  return (
    <BaseDatePicker
      value={value}
      onChange={onChange}
      tintAccentClass={accent.bg}
      tintAccentTextClass={accent.text}
      tintBg={t.inputBg}
      tintBorder={t.inputBorder}
      tintIconColor={t.iconColor}
    />
  );
}

// ── SheetMonthPicker ──────────────────────────────────────────────────────────

interface SheetMonthPickerProps {
  value: string;      // YYYY-MM
  onChange: (v: string) => void;
  id?: string;
}

/** Month picker (YYYY-MM) wired to the sheet tint automatically. */
export function SheetMonthPicker({ value, onChange }: SheetMonthPickerProps) {
  const t = useTint();
  const accentMap: Record<string, { bg: string; text: string }> = {
    'bg-emerald-100/40': { bg: 'bg-emerald-500', text: 'text-white' },
    'bg-rose-100/40':    { bg: 'bg-rose-500',    text: 'text-white' },
    'bg-violet-100/40':  { bg: 'bg-violet-500',  text: 'text-white' },
    'bg-sky-100/40':     { bg: 'bg-sky-500',     text: 'text-white' },
    'bg-amber-100/40':   { bg: 'bg-amber-500',   text: 'text-white' },
    'bg-blue-100/40':    { bg: 'bg-blue-500',    text: 'text-white' },
  };
  const accent = accentMap[t.inputBg] ?? { bg: 'bg-slate-800', text: 'text-white' };
  return (
    <BaseMonthPicker
      value={value}
      onChange={onChange}
      tintAccentClass={accent.bg}
      tintAccentTextClass={accent.text}
      tintBg={t.inputBg}
      tintBorder={t.inputBorder}
      tintIconColor={t.iconColor}
    />
  );
}

// ── SheetSelectTrigger ────────────────────────────────────────────────────────

export function SheetSelectTrigger({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectTrigger>) {
  const t = useTint();
  return (
    <SelectTrigger
      className={cn('h-11 w-full rounded-xl', t.inputBg, t.inputBorder, className)}
      {...props}
    >
      {children}
    </SelectTrigger>
  );
}
