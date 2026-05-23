'use client';

import { useState, useEffect, useRef } from 'react';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Locale constants ──────────────────────────────────────────────────────────

const PT_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const PT_DAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// ── Calendar helpers ──────────────────────────────────────────────────────────

/** Returns an array of day numbers (or null for padding) for a month's grid. */
function buildCalendarCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseYMD(value: string): { year: number; month: number; day: number } | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

function formatDisplay(value: string): string {
  const parsed = parseYMD(value);
  if (!parsed) return '';
  return `${String(parsed.day).padStart(2, '0')}/${String(parsed.month + 1).padStart(2, '0')}/${parsed.year}`;
}

function todayYMD(): string {
  const now = new Date();
  return toYMD(now.getFullYear(), now.getMonth(), now.getDate());
}

// ── Calendar popup ────────────────────────────────────────────────────────────

interface CalendarPopupProps {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  accentClass?: string;
  accentTextClass?: string;
}

function CalendarPopup({
  value,
  onChange,
  onClose,
  accentClass = 'bg-slate-800',
  accentTextClass = 'text-white',
}: CalendarPopupProps) {
  const parsed = parseYMD(value);
  const today = parseYMD(todayYMD())!;

  const [viewYear, setViewYear] = useState(parsed?.year ?? today.year);
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.month);

  const cells = buildCalendarCells(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function selectDay(day: number) {
    onChange(toYMD(viewYear, viewMonth, day));
    onClose();
  }

  function isSelected(day: number) {
    return parsed?.year === viewYear && parsed?.month === viewMonth && parsed?.day === day;
  }

  function isToday(day: number) {
    return today.year === viewYear && today.month === viewMonth && today.day === day;
  }

  return (
    <div className="w-[280px] rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 p-4 animate-fade-in-up">
      {/* Month/year navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
        >
          {PT_MONTHS[viewMonth]} {viewYear}
        </button>

        <button
          type="button"
          onClick={nextMonth}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {PT_DAYS_SHORT.map((d, i) => (
          <div key={i} className="flex h-8 items-center justify-center text-[11px] font-semibold text-slate-400">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (day === null) return <div key={idx} />;
          const selected = isSelected(day);
          const today_ = isToday(day);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => selectDay(day)}
              className={cn(
                'flex h-8 w-full items-center justify-center rounded-lg text-sm transition-colors',
                selected
                  ? `${accentClass} ${accentTextClass} font-semibold`
                  : today_
                    ? 'font-semibold text-slate-700 ring-2 ring-slate-300'
                    : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => { onChange(''); onClose(); }}
          className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={() => { onChange(todayYMD()); onClose(); }}
          className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
        >
          Hoje
        </button>
      </div>
    </div>
  );
}

// ── DatePickerInput (for regular pages, e.g. transaction filter) ──────────────

interface DatePickerInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'default';
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = 'Selecione...',
  className,
  size = 'sm',
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className={cn(
          'flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700',
          'hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400',
          'transition-colors cursor-pointer select-none',
          size === 'sm' ? 'h-8 px-2.5' : 'h-10 px-3',
          !value && 'text-slate-400',
          className,
        )}
      >
        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        {value ? formatDisplay(value) : placeholder}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner side="bottom" sideOffset={6} align="start" className="isolate z-[200]">
          <PopoverPrimitive.Popup>
            <CalendarPopup
              value={value}
              onChange={onChange}
              onClose={() => setOpen(false)}
            />
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

// ── MonthPickerPopup ──────────────────────────────────────────────────────────

const PT_MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function parseYM(value: string): { year: number; month: number } | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const [y, m] = value.split('-').map(Number);
  return { year: y, month: m - 1 };
}

function toYM(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function todayYM(): string {
  const now = new Date();
  return toYM(now.getFullYear(), now.getMonth());
}

function formatMonthDisplay(value: string): string {
  const parsed = parseYM(value);
  if (!parsed) return '';
  return `${PT_MONTHS_SHORT[parsed.month]} de ${parsed.year}`;
}

interface MonthPickerPopupProps {
  value: string;                 // YYYY-MM
  onChange: (v: string) => void;
  onClose: () => void;
  accentClass?: string;
  accentTextClass?: string;
}

function MonthPickerPopup({
  value,
  onChange,
  onClose,
  accentClass = 'bg-slate-800',
  accentTextClass = 'text-white',
}: MonthPickerPopupProps) {
  const parsed = parseYM(value);
  const todayParsed = parseYM(todayYM())!;
  const [viewYear, setViewYear] = useState(parsed?.year ?? todayParsed.year);

  function select(month: number) {
    onChange(toYM(viewYear, month));
    onClose();
  }

  function isSelected(month: number) {
    return parsed?.year === viewYear && parsed?.month === month;
  }

  function isThisMonth(month: number) {
    return todayParsed.year === viewYear && todayParsed.month === month;
  }

  return (
    <div className="w-[248px] rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 p-4 animate-fade-in-up">
      {/* Year navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setViewYear(y => y - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-slate-700">{viewYear}</span>
        <button
          type="button"
          onClick={() => setViewYear(y => y + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Month grid — 3 columns × 4 rows */}
      <div className="grid grid-cols-4 gap-1">
        {PT_MONTHS_SHORT.map((label, month) => {
          const selected = isSelected(month);
          const current  = isThisMonth(month);
          return (
            <button
              key={month}
              type="button"
              onClick={() => select(month)}
              className={cn(
                'flex h-9 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                selected
                  ? `${accentClass} ${accentTextClass}`
                  : current
                    ? 'font-semibold text-slate-700 ring-2 ring-slate-300'
                    : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => { onChange(''); onClose(); }}
          className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={() => { onChange(todayYM()); onClose(); }}
          className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
        >
          Este mês
        </button>
      </div>
    </div>
  );
}

// ── SheetMonthPicker (sheet-styled, uses tint) ────────────────────────────────

interface SheetMonthPickerProps {
  value: string;               // YYYY-MM
  onChange: (v: string) => void;
  id?: string;
  tintAccentClass?: string;
  tintAccentTextClass?: string;
  tintBg?: string;
  tintBorder?: string;
  tintIconColor?: string;
}

export function SheetMonthPicker({
  value,
  onChange,
  tintAccentClass = 'bg-slate-800',
  tintAccentTextClass = 'text-white',
  tintBg = 'bg-slate-100/40',
  tintBorder = 'border-slate-200/60',
  tintIconColor = 'text-slate-500',
}: SheetMonthPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className={cn(
          'relative flex h-11 w-full items-center gap-0 rounded-xl border text-sm text-slate-800',
          'focus:outline-none transition-all cursor-pointer select-none text-left',
          tintBg, tintBorder,
          !value && 'text-slate-400',
        )}
        style={open ? { boxShadow: '0 0 0 3px rgba(100,116,139,0.15)' } : undefined}
      >
        <span className={cn('pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2', tintIconColor)}>
          <Calendar className="h-3.5 w-3.5" />
        </span>
        <span className="pl-10 pr-3.5 capitalize">
          {value ? formatMonthDisplay(value) : <span className="text-slate-400 normal-case">mês / ano</span>}
        </span>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner side="bottom" sideOffset={6} align="start" className="isolate z-[200]">
          <PopoverPrimitive.Popup>
            <MonthPickerPopup
              value={value}
              onChange={onChange}
              onClose={() => setOpen(false)}
              accentClass={tintAccentClass}
              accentTextClass={tintAccentTextClass}
            />
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

// ── SheetDatePicker (sheet-styled, uses tint) ─────────────────────────────────

interface SheetDatePickerProps {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  tintAccentClass?: string;
  tintAccentTextClass?: string;
  tintBg?: string;
  tintBorder?: string;
  tintIconColor?: string;
  tintFocusRing?: string;
  tintFocusHex?: string;
}

export function SheetDatePicker({
  value,
  onChange,
  tintAccentClass = 'bg-slate-800',
  tintAccentTextClass = 'text-white',
  tintBg = 'bg-slate-100/40',
  tintBorder = 'border-slate-200/60',
  tintIconColor = 'text-slate-500',
}: SheetDatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className={cn(
          'relative flex h-11 w-full items-center gap-0 rounded-xl border text-sm text-slate-800',
          'focus:outline-none transition-all cursor-pointer select-none text-left',
          tintBg, tintBorder,
          !value && 'text-slate-400',
        )}
        style={open ? { boxShadow: '0 0 0 3px rgba(100,116,139,0.15)' } : undefined}
      >
        <span className={cn('pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2', tintIconColor)}>
          <Calendar className="h-3.5 w-3.5" />
        </span>
        <span className="pl-10 pr-3.5">
          {value ? formatDisplay(value) : <span className="text-slate-400">DD/MM/AAAA</span>}
        </span>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner side="bottom" sideOffset={6} align="start" className="isolate z-[200]">
          <PopoverPrimitive.Popup>
            <CalendarPopup
              value={value}
              onChange={onChange}
              onClose={() => setOpen(false)}
              accentClass={tintAccentClass}
              accentTextClass={tintAccentTextClass}
            />
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
