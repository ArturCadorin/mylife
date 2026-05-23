'use client';

import { createContext, useContext, useState } from 'react';
import {
  Building2, CreditCard, ArrowLeftRight, X, ChevronRight,
  Landmark, FileText, Layers, DollarSign, Wallet2,
  Search, Check, Hash,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { BANK_PRESETS } from '@/lib/banks';

// ── Tint context ──────────────────────────────────────────────────────────────

interface TintConfig {
  inputBg:      string;  // bg class for resting state
  inputBorder:  string;  // border class for resting state
  focusBorder:  string;  // border class on focus
  focusRing:    string;  // rgba for box-shadow ring
  iconColor:    string;  // icon tint
  dividerColor: string;  // section divider text color
  bodyBg:       string;  // subtle body gradient
}

const TINTS: Record<string, TintConfig> = {
  emerald: {
    inputBg:      'bg-emerald-100/40',
    inputBorder:  'border-emerald-200/60',
    focusBorder:  'border-emerald-400',
    focusRing:    'rgba(16,185,129,0.18)',
    iconColor:    'text-emerald-500',
    dividerColor: 'text-emerald-300',
    bodyBg:       'from-emerald-50/40 to-white',
  },
  violet: {
    inputBg:      'bg-violet-100/40',
    inputBorder:  'border-violet-200/60',
    focusBorder:  'border-violet-400',
    focusRing:    'rgba(139,92,246,0.18)',
    iconColor:    'text-violet-500',
    dividerColor: 'text-violet-300',
    bodyBg:       'from-violet-50/40 to-white',
  },
  rose: {
    inputBg:      'bg-rose-100/40',
    inputBorder:  'border-rose-200/60',
    focusBorder:  'border-rose-400',
    focusRing:    'rgba(244,63,94,0.18)',
    iconColor:    'text-rose-500',
    dividerColor: 'text-rose-300',
    bodyBg:       'from-rose-50/40 to-white',
  },
  blue: {
    inputBg:      'bg-blue-100/40',
    inputBorder:  'border-blue-200/60',
    focusBorder:  'border-blue-400',
    focusRing:    'rgba(59,130,246,0.18)',
    iconColor:    'text-blue-500',
    dividerColor: 'text-blue-300',
    bodyBg:       'from-blue-50/40 to-white',
  },
};

const TintCtx = createContext<TintConfig>(TINTS.emerald);
const useTint = () => useContext(TintCtx);

// ── Primitives ────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  );
}

function ModernInput({ placeholder, icon, value, type = 'text' }: {
  placeholder?: string; icon?: React.ReactNode; value?: string; type?: string;
}) {
  const t = useTint();
  return (
    <div className="relative">
      {icon && (
        <div className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${t.iconColor}`}>
          {icon}
        </div>
      )}
      <input
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = t.focusBorder.replace('border-', '').replace(/-\d+$/, (m) => m);
          e.currentTarget.style.boxShadow = `0 0 0 3px ${t.focusRing}`;
          e.currentTarget.style.backgroundColor = 'white';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '';
          e.currentTarget.style.boxShadow = '';
          e.currentTarget.style.backgroundColor = '';
        }}
        className={`h-11 w-full rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all ${t.inputBg} ${t.inputBorder} ${icon ? 'pl-10 pr-3.5' : 'px-3.5'}`}
      />
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  const t = useTint();
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="h-px flex-1 bg-slate-100" />
      <span className={`text-[10px] font-bold uppercase tracking-widest ${t.dividerColor}`}>{label}</span>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

function TypeChip({ label, active }: { label: string; active?: boolean }) {
  const t = useTint();
  return (
    <button
      type="button"
      className={`flex-1 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
        active
          ? `${t.inputBg} border-current text-slate-700 shadow-sm`
          : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'
      }`}
      style={active ? { borderColor: t.focusRing.replace('rgba(', '').replace(')', '').split(',').slice(0,3).join(',') } : {}}
    >
      {label}
    </button>
  );
}

// ── Sheet wrapper ─────────────────────────────────────────────────────────────

interface DemoSheetProps {
  open: boolean;
  onClose: () => void;
  tintKey: string;
  accentBg: string;
  accentIcon: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  ctaLabel: string;
  ctaGradient: string;
  ctaShadow: string;
}

function DemoSheet({
  open, onClose, tintKey, accentBg, accentIcon, icon, title,
  children, ctaLabel, ctaGradient, ctaShadow,
}: DemoSheetProps) {
  const tint = TINTS[tintKey] ?? TINTS.emerald;

  return (
    <TintCtx.Provider value={tint}>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm [&>button]:hidden overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between px-5 pb-4 pt-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accentBg} shadow-sm`}>
                <span className={accentIcon}>{icon}</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">{title}</h2>
                <p className="text-xs text-slate-400">Preencha os campos abaixo</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Tinted body */}
          <div className={`flex-1 overflow-y-auto bg-gradient-to-b ${tint.bodyBg} px-5 pb-4 space-y-4`}>
            {children}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-slate-100 bg-white px-5 pb-6 pt-3 space-y-2">
            <button
              type="button"
              className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${ctaGradient} py-3.5 text-sm font-semibold text-white shadow-md ${ctaShadow} transition-all hover:shadow-lg active:scale-[0.98]`}
            >
              {ctaLabel} <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl py-2.5 text-sm text-slate-400 transition hover:text-slate-600"
            >
              Cancelar
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </TintCtx.Provider>
  );
}

// ── Demo: Nova Conta ──────────────────────────────────────────────────────────

function DemoAccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('Nubank');
  const t = TINTS.emerald;

  const presets = search
    ? BANK_PRESETS.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    : BANK_PRESETS.slice(0, 8);

  return (
    <DemoSheet
      open={open} onClose={onClose}
      tintKey="emerald"
      accentBg="bg-emerald-50" accentIcon="text-emerald-600"
      icon={<Building2 className="h-5 w-5" />}
      title="Nova conta"
      ctaLabel="Criar conta"
      ctaGradient="from-emerald-500 to-emerald-600"
      ctaShadow="shadow-emerald-200"
    >
      <SectionDivider label="Instituição" />

      {/* Bank search */}
      <div className="relative">
        <Search className={`absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${t.iconColor}`} />
        <input
          placeholder="Buscar banco..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full rounded-xl border py-2.5 pl-10 pr-3.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 transition-all ${t.inputBg} ${t.inputBorder}`}
          onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${t.focusRing}`; e.currentTarget.style.backgroundColor = 'white'; }}
          onBlur={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.backgroundColor = ''; }}
        />
      </div>

      {/* Bank chips */}
      <div className="grid grid-cols-2 gap-1.5">
        {presets.map((b) => (
          <button
            key={b.name}
            type="button"
            onClick={() => { setSelected(b.name); setSearch(''); }}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
              selected === b.name
                ? `${t.inputBg} border-emerald-300 text-emerald-800 shadow-sm`
                : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
            }`}
          >
            <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: b.color }} />
            <span className="truncate">{b.name}</span>
            {selected === b.name && <Check className="ml-auto h-3 w-3 shrink-0 text-emerald-500" />}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSelected('')}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
            selected === ''
              ? `${t.inputBg} border-emerald-300 text-emerald-800`
              : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
          }`}
        >
          <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-dashed border-slate-300" />
          Outro
        </button>
      </div>

      <SectionDivider label="Identificação" />

      <div className="space-y-1.5">
        <FieldLabel>Nome da conta</FieldLabel>
        <ModernInput placeholder="Ex: Conta corrente" icon={<FileText className="h-3.5 w-3.5" />} />
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Tipo de conta</FieldLabel>
        <div className="flex gap-1.5">
          {['Corrente', 'Poupança', 'Dinheiro', 'Digital'].map((l, i) => (
            <TypeChip key={l} label={l} active={i === 0} />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Saldo inicial</FieldLabel>
        <ModernInput placeholder="R$ 0,00" icon={<DollarSign className="h-3.5 w-3.5" />} />
      </div>
    </DemoSheet>
  );
}

// ── Demo: Novo Cartão ─────────────────────────────────────────────────────────

const NETWORKS = [
  { id: 'visa',       label: 'Visa',       color: '#1a1f71' },
  { id: 'mastercard', label: 'Mastercard', color: '#EB001B' },
  { id: 'elo',        label: 'Elo',        color: '#FF6600' },
  { id: 'amex',       label: 'Amex',       color: '#006FCF' },
  { id: 'hipercard',  label: 'Hipercard',  color: '#CC0000' },
  { id: 'other',      label: 'Outra',      color: '#94a3b8' },
];

function DemoCardSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [network, setNetwork] = useState('mastercard');
  const [cardColor, setCardColor] = useState('#8A05BE');
  const t = TINTS.violet;

  return (
    <DemoSheet
      open={open} onClose={onClose}
      tintKey="violet"
      accentBg="bg-violet-50" accentIcon="text-violet-600"
      icon={<CreditCard className="h-5 w-5" />}
      title="Novo cartão"
      ctaLabel="Criar cartão"
      ctaGradient="from-violet-500 to-violet-600"
      ctaShadow="shadow-violet-200"
    >
      {/* Card preview */}
      <div
        className="relative h-40 w-full overflow-hidden rounded-2xl p-5 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}aa 100%)` }}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <p className="text-xs font-semibold text-white/70">Banco</p>
        <p className="mt-auto pt-10 font-mono text-sm tracking-widest text-white">•••• •••• •••• 0000</p>
        <p className="mt-1 text-xs text-white/60">Nome do Cartão</p>
      </div>

      <SectionDivider label="Identificação" />

      <div className="space-y-1.5">
        <FieldLabel>Nome do cartão</FieldLabel>
        <ModernInput placeholder="Ex: Nubank Roxinho" icon={<FileText className="h-3.5 w-3.5" />} />
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Banco / Emissor</FieldLabel>
        <ModernInput placeholder="Ex: Nubank, Itaú..." icon={<Landmark className="h-3.5 w-3.5" />} />
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Últimos 4 dígitos</FieldLabel>
        <ModernInput placeholder="0000" icon={<Hash className="h-3.5 w-3.5" />} />
      </div>

      <SectionDivider label="Bandeira & Cor" />

      <div className="space-y-1.5">
        <FieldLabel>Bandeira</FieldLabel>
        <div className="grid grid-cols-3 gap-1.5">
          {NETWORKS.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setNetwork(n.id)}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2.5 text-xs font-medium transition-all ${
                network === n.id
                  ? `${t.inputBg} border-violet-300 text-violet-800 shadow-sm`
                  : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
              }`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: n.color }} />
              {n.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Cor do cartão</FieldLabel>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={cardColor}
            onChange={(e) => setCardColor(e.target.value)}
            className="h-11 w-14 cursor-pointer rounded-xl border border-violet-100 bg-violet-50/60 p-1"
          />
          <div
            className="flex h-11 flex-1 items-center rounded-xl px-3.5 transition-all"
            style={{ background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}aa 100%)` }}
          >
            <span className="text-xs text-white/80 font-medium">
              {NETWORKS.find((n) => n.id === network)?.label ?? 'Prévia'} · {cardColor.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <SectionDivider label="Limite & Datas" />

      <div className="space-y-1.5">
        <FieldLabel>Limite do cartão</FieldLabel>
        <ModernInput placeholder="R$ 0,00" icon={<Wallet2 className="h-3.5 w-3.5" />} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel>Dia fechamento</FieldLabel>
          <ModernInput placeholder="1 – 28" type="number" />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Dia vencimento</FieldLabel>
          <ModernInput placeholder="1 – 28" type="number" />
        </div>
      </div>
    </DemoSheet>
  );
}

// ── Demo: Nova Transação ──────────────────────────────────────────────────────

function DemoTransactionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [txType, setTxType] = useState<'income' | 'expense' | 'transfer'>('expense');

  const CFG = {
    income:   { tint: 'emerald', label: 'Receita',       grad: 'from-emerald-500 to-green-600',  shadow: 'shadow-emerald-200', accentBg: 'bg-emerald-50', accentIcon: 'text-emerald-600', valueBg: 'bg-emerald-50' },
    expense:  { tint: 'rose',    label: 'Despesa',       grad: 'from-rose-500 to-red-600',        shadow: 'shadow-rose-200',    accentBg: 'bg-rose-50',    accentIcon: 'text-rose-600',    valueBg: 'bg-rose-50'    },
    transfer: { tint: 'blue',    label: 'Transferência', grad: 'from-blue-500 to-blue-600',       shadow: 'shadow-blue-200',    accentBg: 'bg-blue-50',    accentIcon: 'text-blue-600',    valueBg: 'bg-blue-50'    },
  };
  const cfg = CFG[txType];
  const t = TINTS[cfg.tint];

  return (
    <DemoSheet
      open={open} onClose={onClose}
      tintKey={cfg.tint}
      accentBg={cfg.accentBg} accentIcon={cfg.accentIcon}
      icon={<ArrowLeftRight className="h-5 w-5" />}
      title="Nova transação"
      ctaLabel="Registrar"
      ctaGradient={cfg.grad}
      ctaShadow={cfg.shadow}
    >
      {/* Type selector */}
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1">
        {(['income', 'expense', 'transfer'] as const).map((tp) => (
          <button
            key={tp}
            type="button"
            onClick={() => setTxType(tp)}
            className={`rounded-xl py-2.5 text-xs font-semibold transition-all ${
              txType === tp
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {CFG[tp].label}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className={`rounded-2xl ${cfg.valueBg} px-4 py-5 text-center transition-colors`}>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Valor</p>
        <div className="flex items-center justify-center gap-1">
          <span className="text-2xl font-bold text-slate-400">R$</span>
          <input
            defaultValue="0,00"
            className="w-36 bg-transparent text-center text-4xl font-bold text-slate-800 outline-none placeholder:text-slate-300"
          />
        </div>
      </div>

      <SectionDivider label="Detalhes" />

      <div className="space-y-1.5">
        <FieldLabel>Descrição</FieldLabel>
        <ModernInput placeholder="Ex: Almoço, Salário..." icon={<FileText className="h-3.5 w-3.5" />} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel>Data</FieldLabel>
          <ModernInput type="date" />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Categoria</FieldLabel>
          <ModernInput placeholder="Alimentação" icon={<Layers className="h-3.5 w-3.5" />} />
        </div>
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Conta</FieldLabel>
        <ModernInput placeholder="Nubank — Conta corrente" icon={<Building2 className="h-3.5 w-3.5" />} />
      </div>
    </DemoSheet>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UiDemoPage() {
  const [accountOpen, setAccountOpen]         = useState(false);
  const [cardOpen, setCardOpen]               = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(false);

  const demos = [
    {
      label: 'Nova Conta',
      description: 'Fundo fosco em esmeralda · seletor de banco · chips de tipo',
      icon: <Building2 className="h-5 w-5 text-emerald-600" />,
      bg: 'bg-emerald-50', border: 'border-emerald-100 hover:border-emerald-300',
      open: () => setAccountOpen(true),
    },
    {
      label: 'Novo Cartão',
      description: 'Fundo fosco em violeta · prévia em tempo real · bandeiras',
      icon: <CreditCard className="h-5 w-5 text-violet-600" />,
      bg: 'bg-violet-50', border: 'border-violet-100 hover:border-violet-300',
      open: () => setCardOpen(true),
    },
    {
      label: 'Nova Transação',
      description: 'Fundo muda com o tipo (rosa/esmeralda/azul) · valor em destaque',
      icon: <ArrowLeftRight className="h-5 w-5 text-blue-600" />,
      bg: 'bg-blue-50', border: 'border-blue-100 hover:border-blue-300',
      open: () => setTransactionOpen(true),
    },
  ];

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Design Preview</h1>
        <p className="mt-1 text-sm text-slate-400">
          Inputs com fundo fosco colorido. Cada sheet tem sua própria tintagem.
          Clique para visualizar e aprovar.
        </p>
      </div>

      <div className="space-y-3">
        {demos.map((d) => (
          <button
            key={d.label}
            type="button"
            onClick={d.open}
            className={`flex w-full items-center gap-4 rounded-2xl border bg-white px-5 py-4 text-left shadow-sm transition-all hover:shadow-md ${d.border}`}
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${d.bg}`}>
              {d.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{d.label}</p>
              <p className="text-xs text-slate-400">{d.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
        <p className="text-xs font-semibold text-amber-700">Preview — sem integração com API</p>
        <p className="mt-0.5 text-xs text-amber-600">
          Apenas visual. Confirme o design e aplico em todos os módulos.
        </p>
      </div>

      <DemoAccountSheet     open={accountOpen}     onClose={() => setAccountOpen(false)} />
      <DemoCardSheet        open={cardOpen}        onClose={() => setCardOpen(false)} />
      <DemoTransactionSheet open={transactionOpen} onClose={() => setTransactionOpen(false)} />
    </div>
  );
}
