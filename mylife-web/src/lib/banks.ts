export interface BankPreset {
  name: string;
  color: string;
  textColor: 'light' | 'dark';
}

export const BANK_PRESETS: BankPreset[] = [
  { name: 'Nubank',           color: '#8A05BE', textColor: 'light' },
  { name: 'Itaú',             color: '#EC7000', textColor: 'light' },
  { name: 'Bradesco',         color: '#CC0000', textColor: 'light' },
  { name: 'Santander',        color: '#EC0000', textColor: 'light' },
  { name: 'Caixa',            color: '#005CA9', textColor: 'light' },
  { name: 'Banco do Brasil',  color: '#F8D000', textColor: 'dark'  },
  { name: 'BTG Pactual',      color: '#1B3D6E', textColor: 'light' },
  { name: 'Inter',            color: '#FF5F00', textColor: 'light' },
  { name: 'XP Investimentos', color: '#161616', textColor: 'light' },
  { name: 'C6 Bank',          color: '#232323', textColor: 'light' },
  { name: 'Sicoob',           color: '#007B3E', textColor: 'light' },
  { name: 'PicPay',           color: '#21C25E', textColor: 'light' },
  { name: 'Mercado Pago',     color: '#009EE3', textColor: 'light' },
  { name: 'Neon',             color: '#00D4FF', textColor: 'dark'  },
  { name: 'PagBank',          color: '#05C46B', textColor: 'light' },
  { name: 'Safra',            color: '#003A78', textColor: 'light' },
  { name: 'Original',         color: '#007B40', textColor: 'light' },
  { name: 'Sicredi',          color: '#009A44', textColor: 'light' },
  { name: 'Will Bank',        color: '#FFDD00', textColor: 'dark'  },
  { name: 'Daycoval',         color: '#E8311B', textColor: 'light' },
];

// Paleta de fallback para bancos não reconhecidos
const FALLBACK_COLORS = [
  '#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#14B8A6', '#6366F1',
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getBankColor(bankName: string): string {
  const lower = bankName.toLowerCase().trim();
  const match = BANK_PRESETS.find((b) => lower.includes(b.name.toLowerCase()));
  if (match) return match.color;
  return FALLBACK_COLORS[hashStr(bankName) % FALLBACK_COLORS.length];
}

export function getBankTextColor(bankName: string): 'light' | 'dark' {
  const lower = bankName.toLowerCase().trim();
  const match = BANK_PRESETS.find((b) => lower.includes(b.name.toLowerCase()));
  return match?.textColor ?? 'light';
}

// ── Card networks ─────────────────────────────────────────────────────────────

export type CardNetwork = 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'other';

export const CARD_NETWORK_LABELS: Record<CardNetwork, string> = {
  visa:       'Visa',
  mastercard: 'Mastercard',
  elo:        'Elo',
  amex:       'American Express',
  hipercard:  'Hipercard',
  other:      'Outra',
};

const NETWORK_HINTS: { keywords: string[]; network: CardNetwork }[] = [
  { keywords: ['visa'],                                                              network: 'visa' },
  { keywords: ['master', 'nubank', 'neon', 'inter', 'c6', 'picpay', 'will'],       network: 'mastercard' },
  { keywords: ['elo', 'bradesco', 'caixa', 'bb', 'banco do brasil'],               network: 'elo' },
  { keywords: ['amex', 'american express'],                                          network: 'amex' },
  { keywords: ['hipercard', 'hiper'],                                               network: 'hipercard' },
];

export function detectNetwork(bankName: string, cardName = ''): CardNetwork {
  const text = `${bankName} ${cardName}`.toLowerCase();
  for (const hint of NETWORK_HINTS) {
    if (hint.keywords.some((kw) => text.includes(kw))) return hint.network;
  }
  return 'mastercard';
}

// Encode/decode network + color into the single `color` field
export function encodeCardColor(network: CardNetwork, hex: string): string {
  return `${network}|${hex}`;
}

export function decodeCardColor(raw: string | null | undefined): { network: CardNetwork; hex: string } {
  if (!raw) return { network: 'mastercard', hex: '#1E3A5F' };
  const parts = raw.split('|');
  if (parts.length === 2) return { network: parts[0] as CardNetwork, hex: parts[1] };
  // Legacy: raw is just a hex color
  return { network: 'mastercard', hex: raw };
}
