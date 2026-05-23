---
name: myfinance-context
description: Use this skill for ANY task specific to the myFinance module — adding or editing routes, data hooks, mutation hooks, form sheets, query invalidation, or API integration. Triggers on: transações, contas, cartões, cofrinhos, investimentos, wishlist, relatórios, dashboard, ou qualquer página/componente do Finance.
version: 1.0.0
---

# myFinance — Contexto do Módulo

> Design system compartilhado (SheetLayout, tints, componentes): skill `ui-design-system`  
> Backend Spring Boot: skill `backend-context`

---

## Proxy & API

`.env.local`: `NEXT_PUBLIC_API_URL=/api/v1` (relativo → porta 3000)  
`next.config.ts`: proxy `/api/:path*` → `http://localhost:8080/api/:path*`  
Token JWT: lido de `localStorage('mylife_token')` e injetado em todo request via interceptor (`src/lib/api.ts`).  
**403** = backend reiniciado (H2 apagou o usuário) → usuário precisa logar novamente.  
**401** = interceptor limpa localStorage + redireciona `/login` automaticamente.

## Endpoints relevantes (verificados em testes)

| Recurso | Endpoint correto |
|---------|-----------------|
| Grupo familiar do usuário | `GET /family-groups/me` (não `/my`) |
| Compra no cartão | `POST /finance/credit-cards/{id}/transactions` (não `/purchases`) |
| Relatório mensal | `GET /finance/reports/monthly-summary?month=YYYY-MM` |
| Resumo por categoria | `GET /finance/reports/category-summary?month=YYYY-MM&type=EXPENSE` |
| Comparativo mensal | `GET /finance/reports/monthly-comparison?month=YYYY-MM` |
| Projeção recorrências | `GET /finance/reports/recurrence-projection` |
| Evolução de conta | `GET /finance/reports/account-evolution/{id}?from=YYYY-MM-DD&to=YYYY-MM-DD` |

---

## Onde adicionar cada coisa

| O que | Onde |
|-------|------|
| Nova interface / tipo | `src/types/api.ts` |
| Novo hook de leitura (query) | `src/hooks/use-finance.ts` |
| Nova mutação | `src/hooks/use-finance.ts` |
| Nova página autenticada | `src/app/(app)/nova-rota/page.tsx` + link no `AppSidebar` |
| Novo formulário | `src/components/<dominio>/<nome>-sheet.tsx` usando `SheetLayout` |
| Novo componente de domínio | `src/components/<dominio>/` |

---

## Rotas existentes

```
/dashboard          useOverview() + useRecentTransactions()
/transactions       useTransactions(filters) — paginado, filtros data/tipo/conta
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

## Query Keys

```typescript
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

## Padrão de hook — Query

```typescript
export function useXxx() {
  return useQuery({
    queryKey: ['finance', 'xxx'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TipoRetorno>>('/finance/rota');
      return data.data;
    },
  });
}
```

## Padrão de hook — Mutation

```typescript
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

## Padrão de onSubmit com extração de erro

```typescript
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

## Formulários existentes (Sheets)

| Sheet | Arquivo | Props principais | Modo edição |
|-------|---------|-----------------|-------------|
| `TransactionSheet` | `transactions/transaction-sheet.tsx` | `transaction?`, `defaultType?` | Oculta tipo/conta; exibe "atualizar recorrências" |
| `AccountSheet` | `accounts/account-sheet.tsx` | `account?` | Oculta `initialBalance` |
| `CardSheet` | `credit-cards/card-sheet.tsx` | `card?` | Oculta `lastFourDigits` |
| `SavingsSheet` | `savings/savings-sheet.tsx` | `savings?` | — |
| `SavingsEntrySheet` | `savings/entry-sheet.tsx` | `savingsId`, `entry?` | — |
| `InvestmentSheet` | `investments/investment-sheet.tsx` | `investment?` | Oculta `initialAmount`; campos dinâmicos por tipo |
| `InvestmentEntrySheet` | `investments/investment-entry-sheet.tsx` | `investmentId`, `entry?` | — |
| `WishlistSheet` | `wishlist/wishlist-sheet.tsx` | `item?` | — |
| `PurchaseSheet` | `wishlist/purchase-sheet.tsx` | `item` | Marca item como comprado |

---

## Autenticação & proteção de rotas

- `(app)/layout.tsx` — verifica `useAuth().user`; redireciona `/login` se nulo
- `useAuth()` — lê `mylife_token` e `mylife_user` do `localStorage` no mount
- `FamilyGroupSetupDialog` — ativado por erro **422** via `onFamilyGroupError` (usuário sem grupo familiar)

---

## Enums do Finance (tipos disponíveis em `src/types/api.ts`)

```typescript
// Transações
TransactionType: INCOME | EXPENSE
TransactionCategory: SALARY | FREELANCE | INVESTMENT | FOOD | TRANSPORT | HOUSING |
  HEALTH | EDUCATION | LEISURE | CLOTHING | SUBSCRIPTIONS | TRANSFER | OTHER

// Contas
AccountType: CHECKING | SAVINGS | INVESTMENT | CASH | OTHER

// Investimentos
InvestmentType: STOCKS | FIXED_INCOME | CRYPTO | REAL_ESTATE | FUND | OTHER
FixedIncomeIndexer: CDI | IPCA | SELIC | PREFIXED | OTHER

// Cofrinhos
SavingsEntryType: DEPOSIT | WITHDRAWAL

// Wishlist
WishListStatus: PENDING | PURCHASED | CANCELLED
WishListPriority: HIGH | MEDIUM | LOW
WishListCategory: ELECTRONICS | CLOTHING | HOME | VEHICLE | HEALTH | EDUCATION | LEISURE | FOOD | OTHER
```
