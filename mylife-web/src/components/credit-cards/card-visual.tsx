'use client';

import { decodeCardColor, type CardNetwork } from '@/lib/banks';
import type { CreditCardResponse } from '@/types/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexIsLight(hex: string): boolean {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
  } catch {
    return false;
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// ── Sub-componentes visuais ───────────────────────────────────────────────────

function ChipSvg() {
  return (
    <svg width="38" height="28" viewBox="0 0 38 28">
      <rect width="38" height="28" rx="4" fill="#D4AF37" />
      <rect x="12" y="0" width="14" height="28" fill="#B8920A" opacity="0.45" />
      <rect x="0" y="9" width="38" height="10" fill="#B8920A" opacity="0.45" />
      <rect x="12" y="9" width="14" height="10" fill="#8B6D08" opacity="0.6" />
    </svg>
  );
}

function ContactlessIcon({ white }: { white: boolean }) {
  const c = white ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.55)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="15.5" r="1.5" fill={c} />
      <path d="M8.8 12.5c.9-1.8 2.6-2.8 3.2-2.8s2.3.9 3.2 2.8" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 9.5C7.7 6.3 9.8 5 12 5s4.3 1.3 6 4.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

function NetworkLogo({ network, white }: { network: CardNetwork; white: boolean }) {
  if (network === 'visa') {
    return (
      <span
        className="text-lg font-black italic tracking-tight"
        style={{ color: white ? 'white' : '#1a1f71', fontFamily: 'serif', textShadow: white ? '0 1px 3px rgba(0,0,0,0.3)' : 'none' }}
      >
        VISA
      </span>
    );
  }
  if (network === 'mastercard') {
    return (
      <div className="flex -space-x-2.5 items-center">
        <div className="h-6 w-6 rounded-full bg-red-500 opacity-95 shadow-sm" />
        <div className="h-6 w-6 rounded-full bg-amber-400 opacity-95 shadow-sm" />
      </div>
    );
  }
  if (network === 'elo') {
    return (
      <span className="text-lg font-black lowercase tracking-tight" style={{ color: white ? 'white' : '#FF6600' }}>
        elo
      </span>
    );
  }
  if (network === 'amex') {
    return (
      <span className="text-[10px] font-bold tracking-widest uppercase leading-tight" style={{ color: white ? 'white' : '#006FCF' }}>
        AMEX
      </span>
    );
  }
  if (network === 'hipercard') {
    return (
      <span className="text-xs font-bold" style={{ color: white ? 'white' : '#CC0000' }}>
        Hiper
      </span>
    );
  }
  return null;
}

// ── Card Visual ───────────────────────────────────────────────────────────────

interface CardVisualProps {
  card: CreditCardResponse;
  /** Mostrar barra de uso + disponível/limite abaixo do cartão. Padrão: true */
  showUsage?: boolean;
}

export function CardVisual({ card, showUsage = true }: CardVisualProps) {
  const { network, hex } = decodeCardColor(card.color);
  const white = !hexIsLight(hex);
  const tc     = white ? 'text-white' : 'text-slate-900';
  const tcMuted = white ? 'text-white/60' : 'text-slate-600';

  const used = card.totalLimit > 0
    ? Math.min(100, ((card.totalLimit - card.availableLimit) / card.totalLimit) * 100)
    : 0;

  return (
    <div className={`overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 transition-opacity ${!card.active ? 'opacity-55' : ''}`}>
      {/* Card face */}
      <div
        className="relative flex h-52 flex-col justify-between overflow-hidden p-5"
        style={{ background: `linear-gradient(135deg, ${hex} 0%, ${hex}bb 100%)` }}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-10 top-16 h-24 w-24 rounded-full bg-white/10" />

        {/* Top row */}
        <div className="relative z-10 flex items-center justify-between">
          <span className={`text-sm font-bold ${tc}`}>{card.bankName}</span>
          <div className="flex items-center gap-2">
            {!card.active && (
              <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs text-white">Inativo</span>
            )}
            <NetworkLogo network={network} white={white} />
          </div>
        </div>

        {/* Middle: chip + contactless */}
        <div className="relative z-10 flex items-center justify-between">
          <ChipSvg />
          <ContactlessIcon white={white} />
        </div>

        {/* Bottom: number + name + dates */}
        <div className="relative z-10">
          <p className={`font-mono text-sm tracking-widest ${tc}`}>
            •••• •••• •••• {card.lastFourDigits}
          </p>
          <p className={`mt-1 text-xs font-medium ${tc}`}>{card.name}</p>
          <p className={`mt-0.5 text-[10px] ${tcMuted}`}>
            Fecha {card.closingDay} · Vence {card.dueDay}
          </p>
        </div>
      </div>

      {/* Usage info */}
      {showUsage && (
        <div className="bg-white dark:bg-card px-4 py-3 space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Fatura atual</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {formatCurrency(card.currentInvoiceTotal)}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/8">
            <div
              className={`h-1.5 rounded-full transition-all ${used > 80 ? 'bg-rose-400' : used > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${used}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Disponível: {formatCurrency(card.availableLimit)}</span>
            <span>Limite: {formatCurrency(card.totalLimit)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
