---
name: frontend-context
description: Use this skill for ANY task involving the mylife-web frontend — adding features, fixing bugs, creating components, editing pages, modifying hooks, or reviewing code. Triggers on mentions of "frontend", "mylife-web", "página", "componente", "hook", "tela", "formulário", or any specific page/route name (dashboard, transactions, accounts, credit-cards, savings, investments, wishlist, reports).
version: 1.0.0
---

# Frontend Context — mylife-web

> Documentação técnica completa: `instrucoes/frontend-docs.md`  
> **Regra:** ao adicionar ou alterar qualquer funcionalidade, atualizar `frontend-docs.md` na seção correspondente.

---

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · **@base-ui/react** (NÃO Radix UI) · TanStack Query v5 · React Hook Form + Zod · Axios · Sonner

---

## Design System — padrão visual aprovado

### Fonte
**Plus Jakarta Sans** — `layout.tsx` importa com `variable: '--font-sans'`, pesos 400–800.  
Nunca trocar sem aprovação. Manter `Geist Mono` para valores tabulares (`font-mono`).

### Cores do tema
- **Fundo claro:** `#F3F6FA` (azul-acinzentado suave)
- **Fundo escuro:** `#0B0B11` (quase-preto com tint azul)
- **Card claro:** branco com sombra (sem borda)
- **Card escuro:** `#14141D` com sombra + anel 1px branco/6%
- **Primary (claro):** `emerald-500` · **Primary (escuro):** verde lime-emerald brilhante

### StatCard — componente de métrica colorida
`src/components/ui/stat-card.tsx` — use sempre que exibir uma métrica numérica de destaque.

```tsx
import { StatCard } from '@/components/ui/stat-card';

<StatCard
  title="Saldo em contas"
  value={fmt(overview?.totalBalanceAllAccounts ?? 0)}
  sub="2 conta(s)"
  icon={Wallet}
  gradient="from-sky-400 to-blue-600"
  shadowColor="shadow-sky-300/40 dark:shadow-sky-900/30"
  loading={isLoading}
/>
```

### Gradientes por domínio (StatCards e seções)

| Domínio / Métrica | Gradiente | Sombra |
|---|---|---|
| Saldo em contas | `from-sky-400 to-blue-600` | `shadow-sky-300/40 dark:shadow-sky-900/30` |
| Patrimônio líquido | `from-emerald-400 to-teal-600` | `shadow-emerald-300/40 dark:shadow-emerald-900/30` |
| Cofrinhos (savings) | `from-violet-400 to-purple-600` | `shadow-violet-300/40 dark:shadow-violet-900/30` |
| Dívida / Cartão | `from-rose-400 to-rose-600` | `shadow-rose-300/40 dark:shadow-rose-900/30` |
| Investimentos | `from-amber-400 to-orange-500` | `shadow-amber-300/40 dark:shadow-amber-900/30` |
| Receita / Entrada | `from-emerald-500 to-teal-500` | — |
| Despesa / Saída | `from-rose-500 to-pink-500` | — |
| Transferência | `from-blue-500 to-indigo-500` | — |

### Cabeçalhos de seção coloridos
Todo `CardHeader` com título de seção deve ter um **ícone badge colorido** à esquerda do título:

```tsx
<CardHeader className="px-6 pb-3 pt-5">
  <div className="flex items-center gap-2.5">
    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15">
      <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    </div>
    <CardTitle>Título da seção</CardTitle>
  </div>
</CardHeader>
```

### Cards flutuantes (sem borda visível)
Não usar `border` nos `<Card>`. O CSS global já aplica sombra ao `[data-slot="card"]`.  
Use simplesmente `<Card>` sem classes extras.

### Sidebar — indicador ativo
`[data-sidebar="menu-button"][data-active="true"]` recebe automaticamente barra verde vertical à esquerda (3px, via `globals.css`). Não adicionar estilos manuais.

---

## Proxy & API

`.env.local`: `NEXT_PUBLIC_API_URL=/api/v1` (relativo → porta 3000)  
`next.config.ts`: `/api/:path*` → `http://localhost:8080/api/:path*`  
Token JWT lido do `localStorage` (`mylife_token`) e injetado em todo request via interceptor.  
**403** = backend reiniciado (H2 apagou o usuário) → usuário precisa fazer login novamente.

---

## Regra crítica — Links com estilo de botão

`@base-ui/react` **não suporta `asChild`**. Nunca usar `<Button asChild>`.

```tsx
// CORRETO
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

<Link href="/rota" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'extra' })}>
  Texto
</Link>

// ERRADO — gera warning React no DOM
<Button asChild><Link href="/rota">Texto</Link></Button>
```

---

## Onde adicionar cada coisa

| O que | Onde |
|-------|------|
| Nova interface / tipo | `src/types/api.ts` |
| Novo hook de leitura (query) | `src/hooks/use-finance.ts` — padrão `useQuery` |
| Nova mutação | `src/hooks/use-finance.ts` — padrão `useMutation` + `invalidateQueries` |
| Nova página autenticada | `src/app/(app)/nova-rota/page.tsx` + link no `AppSidebar` |
| Novo formulário/drawer | `src/components/<dominio>/<nome>-sheet.tsx` usando `SheetLayout` |
| Novo componente UI base | `src/components/ui/` |

---

## SheetLayout — tints por domínio

| Domínio | Tint |
|---------|------|
| Transações — receita | `emerald` |
| Transações — despesa | `rose` |
| Contas | `emerald` |
| Cartões de crédito | `violet` |
| Cofrinhos (savings) | `sky` |
| Investimentos | `emerald` |
| Lista de desejos | `amber` |

```tsx
<SheetLayout open={open} onOpenChange={onOpenChange} tint="emerald"
  icon={<Icon />} title="Título" ctaLabel="Salvar" onSubmit={handleSubmit(onSubmit)}>
  <SheetInput label="Campo" {...register('campo')} />
</SheetLayout>
```

---

## Query Keys (para invalidateQueries)

```
['finance', 'overview']
['finance', 'transactions']
['finance', 'accounts']
['finance', 'credit-cards']
['finance', 'credit-cards', cardId, 'invoices', yearMonth]
['finance', 'savings']
['finance', 'investments']
['finance', 'wishlist']
['finance', 'reports', 'monthly', month]
```

---

## Padrão de mutação

```tsx
const mutation = useCreateXxx();

async function onSubmit(data: FormData) {
  try {
    await mutation.mutateAsync(payload);
    toast.success('Salvo!');
    onOpenChange(false);
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    toast.error(msg || 'Erro ao salvar.');
  }
}
```

---

## Padrão de novo hook

```typescript
// Query
export function useXxx() {
  return useQuery({
    queryKey: ['finance', 'xxx'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TipoRetorno>>('/finance/rota');
      return data.data;
    },
  });
}

// Mutation
export function useCreateXxx() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: XxxRequest) => {
      const { data } = await api.post<ApiResponse<XxxResponse>>('/finance/rota', req);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'xxx'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] }); // se afeta saldo
    },
  });
}
```

---

## Rotas existentes

```
/dashboard          useOverview() + useRecentTransactions()
/transactions       useTransactions(filters) — paginado, filtros data/tipo
/accounts           useAccounts()
/credit-cards       useCreditCards()
/credit-cards/[id]  useCreditCard(id) + useInvoice(cardId, yearMonth)
/savings            useSavings()
/savings/[id]       useSaving(id) + useSavingsEntries(id)
/investments        useInvestments() + useInvestmentSummary()
/investments/[id]   useInvestment(id) + useInvestmentEntries(id)
/wishlist           useWishlist(status?)
/reports            useMonthlySummary + useMonthlyComparison + useCategorySummary + useRecurrenceProjection
```

---

## Formulários existentes (Sheets)

| Sheet | Props principais | Modo edição |
|-------|-----------------|-------------|
| `TransactionSheet` | `transaction?`, `defaultType?` | Oculta tipo/conta; exibe "atualizar recorrências" |
| `AccountSheet` | `account?` | Oculta `initialBalance` |
| `CardSheet` | `card?` | Oculta `lastFourDigits` |
| `SavingsSheet` | `savings?` | — |
| `InvestmentSheet` | `investment?` | Oculta `initialAmount`; campos dinâmicos por tipo |
| `WishlistSheet` | `item?` | — |

---

## Autenticação & proteção de rotas

- `(app)/layout.tsx` — verifica `useAuth().user`; redireciona `/login` se nulo
- `useAuth()` — lê `mylife_token` e `mylife_user` do localStorage no mount
- 401 → interceptor limpa localStorage + redireciona `/login` automaticamente
- `FamilyGroupSetupDialog` — ativado por erro 422 via `onFamilyGroupError`
