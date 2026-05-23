'use client';

import { useState } from 'react';
import { Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BANK_PRESETS } from '@/lib/banks';
import { SheetInput, useTint } from '@/components/ui/sheet-primitives';

interface BankSelectorProps {
  value: string;
  onChange: (v: string) => void;
  initialCustom?: boolean;
}

export function BankSelector({ value, onChange, initialCustom = false }: BankSelectorProps) {
  const t = useTint();
  const [search, setSearch] = useState('');
  const [customMode, setCustomMode] = useState(initialCustom);

  const filtered = search
    ? BANK_PRESETS.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    : BANK_PRESETS;

  function selectPreset(name: string) {
    setCustomMode(false);
    onChange(name);
    setSearch('');
  }

  function enableCustom() {
    setCustomMode(true);
    if (BANK_PRESETS.some((b) => b.name === value)) onChange('');
  }

  return (
    <div className="space-y-2">
      {/* Busca */}
      <div className="relative">
        <Search className={cn('absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2', t.iconColor)} />
        <input
          placeholder="Buscar banco..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            'h-10 w-full rounded-xl border py-2 pl-10 pr-3.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 transition-all focus:bg-white',
            t.inputBg, t.inputBorder,
          )}
        />
      </div>

      {/* Grid de bancos */}
      <div className="grid max-h-52 grid-cols-2 gap-1.5 overflow-y-auto pr-0.5">
        {filtered.map((bank) => {
          const isSelected = !customMode && value === bank.name;
          return (
            <button
              key={bank.name}
              type="button"
              onClick={() => selectPreset(bank.name)}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-medium transition-all',
                isSelected
                  ? `${t.accentBg} ${t.accentText} border-current/30`
                  : `${t.inputBg} ${t.inputBorder} text-slate-600 hover:opacity-80`,
              )}
            >
              <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: bank.color }} />
              <span className="truncate">{bank.name}</span>
              {isSelected && <Check className="ml-auto h-3 w-3 shrink-0" />}
            </button>
          );
        })}

        {!search && (
          <button
            type="button"
            onClick={enableCustom}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-medium transition-all',
              customMode
                ? `${t.accentBg} ${t.accentText} border-current/30`
                : `${t.inputBg} ${t.inputBorder} text-slate-500 hover:opacity-80`,
            )}
          >
            <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-dashed border-slate-300" />
            Outro
          </button>
        )}
      </div>

      {/* Input livre */}
      {customMode && (
        <SheetInput
          placeholder="Nome do banco ou instituição..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      )}
    </div>
  );
}
