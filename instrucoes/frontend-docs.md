# Documentação Técnica — mylife-web (Frontend)

**Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, @base-ui/react, TanStack Query v5, React Hook Form + Zod, Axios, Sonner

---

## Índice

1. [Estrutura de Pastas](#1-estrutura-de-pastas)
2. [Configuração e Ambiente](#2-configuração-e-ambiente)
3. [Tipos e Interfaces (API)](#3-tipos-e-interfaces-api)
4. [Cliente HTTP (api.ts)](#4-cliente-http-apits)
5. [Hooks de Autenticação](#5-hooks-de-autenticação)
6. [Hooks de Finanças](#6-hooks-de-finanças)
7. [Utilitários (lib/)](#7-utilitários-lib)
8. [Providers](#8-providers)
9. [Componentes UI Base](#9-componentes-ui-base)
10. [Componentes de Domínio](#10-componentes-de-domínio)
11. [Páginas e Rotas](#11-páginas-e-rotas)
12. [Fluxos de Dados](#12-fluxos-de-dados)
13. [Guia de Alterações](#13-guia-de-alterações)

---

## 1. Estrutura de Pastas

```
mylife-web/src/
├── app/
│   ├── layout.tsx               ← Root layout (fonts, metadata, Providers)
│   ├── page.tsx                 ← Redireciona para /dashboard
│   ├── globals.css              ← Variáveis CSS / Tailwind
│   ├── (app)/                   ← Grupo de rotas autenticadas
│   │   ├── layout.tsx           ← Guard de autenticação + Sidebar + Header
│   │   ├── page.tsx             ← Redireciona para /dashboard
│   │   ├── dashboard/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── accounts/page.tsx
│   │   ├── credit-cards/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── savings/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── investments/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── wishlist/page.tsx
│   │   ├── reports/page.tsx
│   │   └── ui-demo/page.tsx
│   └── (auth)/                  ← Grupo de rotas públicas
│       ├── layout.tsx
│       ├── login/page.tsx
│       └── register/page.tsx
├── components/
│   ├── ui/                      ← Design system (20+ componentes base)
│   ├── layout/                  ← Header, Sidebar, FamilyGroupDialog
│   ├── transactions/            ← TransactionSheet
│   ├── accounts/                ← AccountSheet + BankSelector
│   ├── credit-cards/            ← CardSheet + NetworkSelector
│   ├── savings/                 ← SavingsSheet + EntrySheet
│   ├── investments/             ← InvestmentSheet + EntrySheet
│   └── wishlist/                ← WishlistSheet + PurchaseSheet
├── hooks/
│   ├── use-auth.ts              ← Login, register, logout
│   ├── use-family-group.ts      ← Criação de grupo familiar
│   ├── use-finance.ts           ← 70+ funções para todos os domínios
│   └── use-mobile.ts            ← Detecção de breakpoint mobile
├── lib/
│   ├── api.ts                   ← Instância Axios + interceptors
│   ├── banks.ts                 ← Dados de bancos e redes de cartão
│   └── utils.ts                 ← cn() helper (clsx + tailwind-merge)
├── providers/
│   └── providers.tsx            ← QueryClient, Toaster, Tooltip
└── types/
    └── api.ts                   ← Todas as interfaces da API
```

---

## 2. Configuração e Ambiente

### `.env.local`
```
NEXT_PUBLIC_API_URL=/api/v1
```
Com essa configuração, todas as chamadas do Axios vão para `/api/v1` (relativo à porta 3000).

### Proxy Next.js (`next.config.ts`)
```
/api/:path*  →  http://localhost:8080/api/:path*
```
O Next.js age como proxy reverso: o browser chama `localhost:3000/api/v1/...` e o servidor redireciona para o backend Spring Boot em `localhost:8080`.

> **Por que isso existe?** Evita problemas de CORS no browser. O browser só fala com o Next.js (mesma origem), e o Next.js repassa ao backend.

---

## 3. Tipos e Interfaces (API)

Arquivo: `src/types/api.ts`

Todas as interfaces refletem exatamente o contrato da API REST do backend.

### Respostas Genéricas

| Interface | Campos |
|-----------|--------|
| `ApiResponse<T>` | `data: T`, `message: string`, `status: 'SUCCESS' \| 'ERROR' \| 'VALIDATION_ERROR'` |
| `PageResponse<T>` | `content: T[]`, `totalElements`, `totalPages`, `number`, `size`, `first`, `last` |

### Autenticação

| Interface | Campos Principais |
|-----------|------------------|
| `LoginRequest` | `email`, `password` |
| `RegisterRequest` | `name`, `email`, `password`, `role: Role`, `products: ProductType[]` |
| `AuthResponse` | `token`, `userId`, `name`, `email`, `role`, `products` |
| `Role` | `'OWNER' \| 'MEMBER'` |
| `ProductType` | `'FINANCE' \| 'FITNESS'` |

### Transações

| Interface | Campos Principais |
|-----------|------------------|
| `TransactionResponse` | `id`, `type`, `category`, `amount`, `date`, `description`, `accountName`, `recurrenceType`, `pending`, `parentTransactionId` |
| `TransactionRequest` | `type`, `category`, `amount`, `date`, `description`, `accountId`, `recurrenceType`, `recurrenceFrequency?`, `recurrenceEndDate?` |
| `TransactionUpdateRequest` | `description`, `amount`, `category`, `date`, `note?`, `updateFutureRecurrences` |
| `TransactionType` | `'INCOME' \| 'EXPENSE'` |
| `RecurrenceType` | `'NONE' \| 'AUTOMATIC' \| 'MANUAL'` |
| `RecurrenceFrequency` | `'DAILY' \| 'WEEKLY' \| 'MONTHLY' \| 'YEARLY'` |
| `TransactionCategory` | 16 valores: SALARY, FOOD, TRANSPORT, HEALTH, EDUCATION, LEISURE, CLOTHING, HOME, VEHICLE, SUBSCRIPTIONS, CREDIT_CARD, FREELANCE, INVESTMENT_RETURN, RENTAL, OTHER_INCOME, OTHER_EXPENSE |

### Contas

| Interface | Campos Principais |
|-----------|------------------|
| `AccountResponse` | `id`, `name`, `bankName`, `type`, `balance`, `currency`, `active` |
| `AccountRequest` | `name`, `bankName`, `type`, `currency`, `initialBalance` |
| `AccountUpdateRequest` | `name`, `bankName`, `type`, `currency` |
| `AccountType` | `'CHECKING' \| 'SAVINGS' \| 'CASH' \| 'DIGITAL'` |

### Cartões de Crédito

| Interface | Campos Principais |
|-----------|------------------|
| `CreditCardResponse` | `id`, `name`, `bankName`, `lastFourDigits`, `limit`, `availableLimit`, `closingDay`, `dueDay`, `color`, `active`, `currentInvoiceAmount`, `currentInvoiceId` |
| `CreditCardRequest` | `name`, `bankName`, `lastFourDigits`, `limit`, `closingDay`, `dueDay`, `color?` |
| `InvoiceResponse` | `id`, `creditCardId`, `yearMonth`, `totalAmount`, `status`, `closingDate`, `dueDate`, `paidAt`, `paidAmount`, `transactions[]` |
| `InvoiceStatus` | `'OPEN' \| 'CLOSED' \| 'PAID'` |
| `CreditCardTransactionRequest` | `description`, `amount`, `date`, `category`, `installments` |
| `InvoicePaymentRequest` | `accountId`, `amount`, `paymentDate` |

### Poupança (Cofrinhos)

| Interface | Campos Principais |
|-----------|------------------|
| `SavingsResponse` | `id`, `name`, `description`, `targetAmount`, `currentAmount`, `cdiRate`, `currentCdiValue`, `estimatedReturn`, `linkedAccountId`, `percentualDaMeta` |
| `SavingsRequest` | `name`, `description?`, `targetAmount?`, `cdiRate`, `currentCdiValue`, `linkedAccountId?` |
| `SavingsEntryResponse` | `id`, `type`, `amount`, `date`, `note` |
| `SavingsEntryRequest` | `type: 'DEPOSIT' \| 'WITHDRAWAL'`, `amount`, `date`, `note?` |

### Investimentos

| Interface | Campos Principais |
|-----------|------------------|
| `InvestmentResponse` | `id`, `name`, `type`, `institution`, `totalInvested`, `currentValue`, `yieldAmount`, `yieldPercentage`, `indexer?`, `indexerRate?`, `fixedRate?`, `maturityDate?`, `active` |
| `InvestmentRequest` | `name`, `type`, `institution`, `initialAmount`, `indexer?`, `indexerRate?`, `fixedRate?`, `maturityDate?`, `linkedAccountId?` |
| `InvestmentType` | `'FIXED_INCOME' \| 'STOCK' \| 'FUND' \| 'CRYPTO'` |
| `FixedIncomeIndexer` | `'CDI' \| 'SELIC' \| 'IPCA' \| 'PREFIXED' \| 'OTHER'` |
| `InvestmentSummaryResponse` | `totalInvested`, `totalCurrentValue`, `totalYield`, `totalYieldPercentage`, `byType{}` |
| `InvestmentEntryRequest` | `type: 'DEPOSIT' \| 'WITHDRAWAL' \| 'YIELD_UPDATE'`, `amount`, `date`, `note?` |

### Lista de Desejos

| Interface | Campos Principais |
|-----------|------------------|
| `WishListItemResponse` | `id`, `name`, `description`, `estimatedPrice`, `category`, `priority`, `estimatedMonth`, `status`, `daysUntilEstimatedMonth` |
| `WishListItemRequest` | `name`, `description?`, `estimatedPrice`, `category`, `priority`, `estimatedMonth`, `linkedAccountId?` |
| `WishListStatus` | `'PENDING' \| 'PURCHASED' \| 'CANCELLED'` |
| `WishListPriority` | `'HIGH' \| 'MEDIUM' \| 'LOW'` |
| `PurchaseRequest` | `linkedAccountId?`, `note?` |

### Relatórios e Visão Geral

| Interface | Campos Principais |
|-----------|------------------|
| `FinancialOverviewResponse` | `totalBalanceAllAccounts`, `totalSavings`, `totalInvestments`, `totalCreditCardDebt`, `netWorth`, `accountSummaries[]`, `savingsSummaries[]` |
| `MonthlySummaryResponse` | `referenceMonth`, `totalIncome`, `totalExpense`, `balance`, `totalCreditCardSpending`, `netBalance` |
| `CategorySummaryResponse` | `category`, `totalAmount`, `transactionCount`, `percentageOfTotal` |
| `MonthlyComparisonResponse` | `currentMonth`, `previousMonth`, `incomeVariation`, `expenseVariation`, `balanceVariation` |
| `RecurrenceProjectionResponse` | `description`, `amount`, `type`, `expectedDate`, `recurrenceFrequency`, `accountName` |

---

## 4. Cliente HTTP (api.ts)

Arquivo: `src/lib/api.ts`

```typescript
// Instância única do Axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
});
```

### Interceptor de Request
- Lê `mylife_token` do `localStorage`
- Injeta `Authorization: Bearer <token>` em todo request

### Interceptor de Response
| Status | Ação |
|--------|------|
| `401` | Remove token e user do localStorage → redireciona para `/login` |
| `422` com `"grupo familiar"` | Dispara `onFamilyGroupError` listeners → abre `FamilyGroupSetupDialog` |

### Constantes de localStorage
| Chave | Conteúdo |
|-------|----------|
| `mylife_token` | JWT Bearer token |
| `mylife_user` | JSON serializado de `AuthResponse` |

---

## 5. Hooks de Autenticação

### `use-auth.ts`

```typescript
const { user, loading, login, register, logout } = useAuth();
```

| Função | Parâmetros | Comportamento |
|--------|-----------|---------------|
| `login(req)` | `LoginRequest` | POST `/auth/login` → salva token + user → redireciona `/dashboard` |
| `register(req)` | `RegisterRequest` | POST `/auth/register` → salva token + user → redireciona `/dashboard` |
| `logout()` | — | Remove localStorage → redireciona `/login` |

**Estado:** `user: AuthResponse | null`, `loading: boolean`

O hook lê o `localStorage` no mount para recuperar a sessão ativa.

### `use-family-group.ts`

```typescript
const mutation = useCreateFamilyGroup();
mutation.mutateAsync({ name: 'Família Silva' });
// Endpoint: POST /family-groups
```

---

## 6. Hooks de Finanças

Arquivo: `src/hooks/use-finance.ts`

Todos os hooks usam **TanStack Query** para cache e invalidação automática.

### Visão Geral
```typescript
useOverview()               // GET /finance/overview → FinancialOverviewResponse
useRecentTransactions(5)    // GET /finance/transactions?size=5 → TransactionResponse[]
```

### Transações
```typescript
useTransactions(filters)    // GET /finance/transactions?... (paginado, com filtros)
useCreateTransaction()      // POST /finance/transactions
useUpdateTransaction()      // PUT /finance/transactions/{id}
useDeleteTransaction()      // DELETE /finance/transactions/{id}
```

**Filtros de `useTransactions`:**
```typescript
type TransactionFilters = {
  startDate?: string;   // formato: 'YYYY-MM-DD'
  endDate?: string;
  type?: TransactionType;
  page?: number;
  size?: number;
}
```

### Contas
```typescript
useAccounts()                   // GET /finance/accounts
useCreateAccount()              // POST /finance/accounts
useUpdateAccount()              // PUT /finance/accounts/{id}
useDeactivateAccount()          // PATCH /finance/accounts/{id}/deactivate
useDeleteAccount()              // DELETE /finance/accounts/{id}
```

### Cartões de Crédito
```typescript
useCreditCards()                // GET /finance/credit-cards
useCreditCard(id)               // GET /finance/credit-cards/{id}
useCreateCreditCard()           // POST /finance/credit-cards
useUpdateCreditCard()           // PUT /finance/credit-cards/{id}
useDeactivateCreditCard()       // PATCH /finance/credit-cards/{id}/deactivate
useDeleteCreditCard()           // DELETE /finance/credit-cards/{id}
useInvoices(cardId)             // GET /finance/credit-cards/{id}/invoices
useInvoice(cardId, yearMonth)   // GET /finance/credit-cards/{id}/invoices/{yearMonth}
useCreateCardTransaction(cardId)// POST /finance/credit-cards/{id}/transactions
usePayInvoice(invoiceId)        // POST /finance/credit-cards/invoices/{id}/pay
```

### Poupança
```typescript
useSavings()                    // GET /finance/savings
useSaving(id)                   // GET /finance/savings/{id}
useCreateSavings()              // POST /finance/savings
useUpdateSavings()              // PUT /finance/savings/{id}
useDeleteSavings()              // DELETE /finance/savings/{id}
useSavingsEntries(id, page, size)// GET /finance/savings/{id}/entries (paginado)
useAddSavingsEntry(id)          // POST /finance/savings/{id}/entries
```

### Investimentos
```typescript
useInvestments()                // GET /finance/investments
useInvestmentSummary()          // GET /finance/investments/summary
useInvestment(id)               // GET /finance/investments/{id}
useCreateInvestment()           // POST /finance/investments
useUpdateInvestment()           // PUT /finance/investments/{id}
useDeactivateInvestment()       // PATCH /finance/investments/{id}/deactivate
useInvestmentEntries(id, p, s)  // GET /finance/investments/{id}/entries (paginado)
useAddInvestmentEntry(id)       // POST /finance/investments/{id}/entries
```

### Lista de Desejos
```typescript
useWishlist(status?)            // GET /finance/wishlist?status=...
useCreateWishlistItem()         // POST /finance/wishlist
useUpdateWishlistItem()         // PUT /finance/wishlist/{id}
usePurchaseWishlistItem(id)     // PATCH /finance/wishlist/{id}/purchase
useCancelWishlistItem(id)       // PATCH /finance/wishlist/{id}/cancel
useDeleteWishlistItem(id)       // DELETE /finance/wishlist/{id}
```

### Relatórios
```typescript
useMonthlySummary(month)        // GET /finance/reports/monthly?month=YYYY-MM
useMonthlyComparison(month)     // GET /finance/reports/monthly-comparison?month=...
useCategorySummary(start, end, type) // GET /finance/reports/categories?...
useRecurrenceProjection(start, end)  // GET /finance/reports/recurrences?...
```

### Padrão de uso de mutações
```typescript
const mutation = useCreateAccount();

// Dentro de um handler:
try {
  await mutation.mutateAsync(payload);
  toast.success('Criado!');
} catch (err) {
  const msg = err?.response?.data?.message;
  toast.error(msg || 'Erro ao salvar.');
}
```

Após sucesso, cada mutação invalida automaticamente as queries relacionadas via `queryClient.invalidateQueries`.

---

## 7. Utilitários (lib/)

### `utils.ts`
```typescript
cn(...inputs: ClassValue[]): string
```
Combina `clsx` + `tailwind-merge`. Usado em todo componente para mesclar classes dinâmicas sem conflitos Tailwind.

---

### `banks.ts`

**BANK_PRESETS** — array com 20 bancos pré-configurados:
```typescript
{ name: string; color: string; textColor: 'light' | 'dark' }
```
Inclui: Nubank, Itaú, Bradesco, Santander, Banco do Brasil, Caixa, XP, Inter, C6, BTG, etc.

| Função | Retorno |
|--------|---------|
| `getBankColor(bankName)` | Cor hex do banco ou cor gerada por hash |
| `getBankTextColor(bankName)` | `'light'` ou `'dark'` |
| `detectNetwork(bankName, cardName)` | `CardNetwork` detectada por keywords |
| `encodeCardColor(network, hex)` | `"network\|hex"` — formato armazenado no backend |
| `decodeCardColor(raw)` | `{ network: CardNetwork, hex: string }` |

**CardNetwork:** `'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'other'`

---

## 8. Providers

Arquivo: `src/providers/providers.tsx`

Envolve toda a aplicação com:

| Provider | Configuração |
|----------|-------------|
| `QueryClientProvider` | `staleTime: 5min`, `retry: 1` |
| `TooltipProvider` | Base UI tooltips |
| `Toaster` | Sonner, posição `top-right`, `richColors: true` |
| `ReactQueryDevtools` | Inicialmente fechado (só dev) |

---

## 9. Componentes UI Base

Pasta: `src/components/ui/`

Todos usam `@base-ui/react` como primitivo + estilos Tailwind. **Não usam `asChild`** (padrão Radix UI — incompatível).

### Estrutura
| Componente | Arquivo | Uso Principal |
|-----------|---------|---------------|
| `Button` | `button.tsx` | Ações, submits |
| `Input` | `input.tsx` | Campos de texto |
| `CurrencyInput` | `currency-input.tsx` | Campos monetários (centavos → BRL) |
| `Label` | `label.tsx` | Rótulos de formulário |
| `Select` | `select.tsx` | Dropdowns de seleção |
| `Card` | `card.tsx` | Containers de conteúdo |
| `Skeleton` | `skeleton.tsx` | Loading states |
| `Badge` | `badge.tsx` | Status labels |
| `Progress` | `progress.tsx` | Barras de progresso |
| `Tooltip` | `tooltip.tsx` | Dicas em hover |
| `Dialog` | `dialog.tsx` | Modais centralizados |
| `Sheet` | `sheet.tsx` | Drawers laterais |
| `Alert Dialog` | `alert-dialog.tsx` | Confirmações destrutivas |
| `Dropdown Menu` | `dropdown-menu.tsx` | Menus contextuais |
| `Sidebar` | `sidebar.tsx` | Navegação lateral |

### Button Variants
```
variant: default | outline | secondary | ghost | destructive | link
size:    xs | sm | default | lg | icon | icon-xs | icon-sm | icon-lg
```

### Links com visual de Button
Como o projeto usa `@base-ui/react` (sem `asChild`), links com estilo de botão usam:
```tsx
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

<Link href="/rota" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
  Texto
</Link>
```

### SheetLayout (Primitivo de formulários)
Arquivo: `src/components/ui/sheet-primitives.tsx`

Componente base para todos os formulários em drawer:
```tsx
<SheetLayout
  open={open}
  onOpenChange={onOpenChange}
  tint="emerald"           // cor do tema: emerald | rose | violet | sky | amber
  icon={<Icon />}
  title="Título"
  subtitle="Subtítulo"
  ctaLabel="Salvar"
  onSubmit={handleSubmit(onSubmit)}
>
  {/* campos do formulário */}
</SheetLayout>
```

**Componentes filhos disponíveis:** `SheetInput`, `SheetCurrencyInput`, `SheetSelectTrigger`, `FieldLabel`, `SectionDivider`

---

## 10. Componentes de Domínio

### Layout

#### `AppSidebar` (`components/layout/app-sidebar.tsx`)
Sidebar de navegação principal. Grupos de menu:
- **Início:** Dashboard
- **Finanças:** Transações, Contas, Cartões
- **Patrimônio:** Cofrinhos, Investimentos
- **Outros:** Lista de Desejos, Relatórios

Footer com dropdown: alternar tema escuro/claro, logout.

#### `SiteHeader` (`components/layout/site-header.tsx`)
Cabeçalho superior. Exibe título da página atual (derivado do `pathname`) e nome do usuário logado.

#### `FamilyGroupSetupDialog` (`components/layout/family-group-setup-dialog.tsx`)
Modal automático. Aparece quando a API retorna 422 com mensagem sobre grupo familiar. Permite criar o grupo sem sair da página. Após criar, recarrega via `window.location.reload()`.

---

### Formulários de Domínio (Sheets)

Todos os formulários de criação/edição são drawers laterais (`Sheet`).

#### `TransactionSheet` (`components/transactions/transaction-sheet.tsx`)

| Prop | Tipo | Descrição |
|------|------|-----------|
| `open` | `boolean` | Controla visibilidade |
| `onOpenChange` | `(open: boolean) => void` | Callback |
| `transaction?` | `TransactionResponse` | Se informado, modo edição |
| `defaultType?` | `TransactionType` | Pré-seleciona tipo ao criar |

**Campos:** tipo (toggle INCOME/EXPENSE), categoria (filtrada por tipo), valor, data, descrição, nota, conta, recorrência (tipo + frequência + data fim).  
**Modo edição:** oculta tipo e conta; exibe opção "atualizar ocorrências futuras".  
**Tint:** emerald (receita) / rose (despesa)

---

#### `AccountSheet` (`components/accounts/account-sheet.tsx`)

| Prop | Tipo | Descrição |
|------|------|-----------|
| `open` | `boolean` | Controla visibilidade |
| `onOpenChange` | `(open: boolean) => void` | Callback |
| `account?` | `AccountResponse` | Se informado, modo edição |

**Campos:** banco (`BankSelector`), nome, tipo (CHECKING/SAVINGS/CASH/DIGITAL), moeda, saldo inicial (só criação).  
**BankSelector:** grid scrollável com 20 bancos + opção "Outro" (input livre).  
**Tint:** emerald

---

#### `CardSheet` (`components/credit-cards/card-sheet.tsx`)

| Prop | Tipo | Descrição |
|------|------|-----------|
| `open` | `boolean` | Controla visibilidade |
| `onOpenChange` | `(open: boolean) => void` | Callback |
| `card?` | `CreditCardResponse` | Se informado, modo edição |

**Campos:** nome, banco, últimos 4 dígitos (só criação), rede (`NetworkSelector`), cor (color picker), limite, dia fechamento, dia vencimento.  
**Preview:** cartão animado com gradiente da cor escolhida.  
**Armazenamento de cor:** `encodeCardColor(network, hex)` → string `"network|hex"` enviada ao backend.  
**Tint:** violet

---

#### `SavingsSheet` (`components/savings/savings-sheet.tsx`)

| Prop | Tipo | Descrição |
|------|------|-----------|
| `open` | `boolean` | Controla visibilidade |
| `onOpenChange` | `(open: boolean) => void` | Callback |
| `savings?` | `SavingsResponse` | Se informado, modo edição |

**Campos:** nome, descrição, meta (opcional), % CDI, valor atual do CDI, conta vinculada.  
**Taxa efetiva** = (% CDI × CDI atual) ÷ 100.  
**Tint:** sky

---

#### `InvestmentSheet` (`components/investments/investment-sheet.tsx`)

| Prop | Tipo | Descrição |
|------|------|-----------|
| `open` | `boolean` | Controla visibilidade |
| `onOpenChange` | `(open: boolean) => void` | Callback |
| `investment?` | `InvestmentResponse` | Se informado, modo edição |

**Campos estáticos:** nome, instituição, tipo (FIXED_INCOME/STOCK/FUND/CRYPTO), conta vinculada, valor inicial (só criação).  
**Campos dinâmicos por tipo:**
- `FIXED_INCOME`: indexador, taxa do indexador, valor atual do índice (ou taxa fixa se PREFIXED), data de vencimento
- Outros tipos: sem campos extras  

**Tint:** emerald

---

#### `WishlistSheet` (`components/wishlist/wishlist-sheet.tsx`)

| Prop | Tipo | Descrição |
|------|------|-----------|
| `open` | `boolean` | Controla visibilidade |
| `onOpenChange` | `(open: boolean) => void` | Callback |
| `item?` | `WishListItemResponse` | Se informado, modo edição |

**Campos:** nome, descrição, valor estimado, categoria, prioridade (toggle HIGH/MEDIUM/LOW), mês estimado, conta vinculada.  
**Tint:** amber

---

#### Sheets Complementares

| Componente | Arquivo | Uso |
|-----------|---------|-----|
| `EntrySheet` (savings) | `components/savings/entry-sheet.tsx` | Registrar depósito ou retirada de cofrinho |
| `InvestmentEntrySheet` | `components/investments/investment-entry-sheet.tsx` | Registrar depósito, retirada ou atualização de yield |
| `PurchaseSheet` | `components/wishlist/purchase-sheet.tsx` | Marcar item da wishlist como comprado |

---

## 11. Páginas e Rotas

### Rotas Públicas (`(auth)/`)

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/login` | `(auth)/login/page.tsx` | Form de login |
| `/register` | `(auth)/register/page.tsx` | Form de cadastro |

### Rotas Autenticadas (`(app)/`)

O layout `(app)/layout.tsx` protege todas as rotas abaixo. Se não autenticado, redireciona para `/login`.

| Rota | Arquivo | O que exibe |
|------|---------|-------------|
| `/dashboard` | `dashboard/page.tsx` | Métricas gerais, transações recentes, ações rápidas, cofrinhos, contas |
| `/transactions` | `transactions/page.tsx` | Lista paginada com filtros de data/tipo, resumo do período, CRUD completo |
| `/accounts` | `accounts/page.tsx` | Grid de contas ativas, saldo total, CRUD |
| `/credit-cards` | `credit-cards/page.tsx` | Grid visual de cartões, resumo de fatura, CRUD |
| `/credit-cards/[id]` | `credit-cards/[id]/page.tsx` | Fatura atual, transações do cartão, opção de pagamento |
| `/savings` | `savings/page.tsx` | Lista de cofrinhos com progress bar, CDI, CRUD + lançamentos |
| `/savings/[id]` | `savings/[id]/page.tsx` | Histórico de depósitos/retiradas do cofrinho |
| `/investments` | `investments/page.tsx` | Sumário consolidado, grid de investimentos, CRUD |
| `/investments/[id]` | `investments/[id]/page.tsx` | Histórico de lançamentos do investimento |
| `/wishlist` | `wishlist/page.tsx` | Lista de desejos com filtro por status, CRUD + compra/cancelamento |
| `/reports` | `reports/page.tsx` | Sumário mensal, comparação mensal, por categoria, projeção de recorrências |

---

## 12. Fluxos de Dados

### Autenticação
```
Login/Register
  → useAuth.login/register()
  → POST /auth/login ou /auth/register
  → Salva token + user no localStorage
  → redirect /dashboard

App Layout (mount)
  → useAuth() lê localStorage
  → Se user == null → redirect /login
  → Se user != null → renderiza sidebar + conteúdo
```

### Chamadas de API (padrão geral)
```
Página/Componente
  → Chama hook (ex: useAccounts())
  → TanStack Query verifica cache (stale: 5min)
  → Se stale/ausente → axios.get(...) com Authorization: Bearer token
  → Dados disponíveis em { data, isLoading, isError }
```

### Criação/Edição (mutations)
```
Usuário submete formulário
  → onSubmit(formData)
  → mutation.mutateAsync(payload)
  → axios.post/put(...)
  → onSuccess: invalidateQueries → refetch automático das listas
  → toast.success / toast.error
  → onOpenChange(false) → fecha o sheet
```

### Grupo Familiar (setup obrigatório)
```
API retorna 422 com "grupo familiar"
  → api.ts interceptor → dispara onFamilyGroupError listeners
  → FamilyGroupSetupDialog (no layout) escuta via onFamilyGroupError
  → Modal abre automaticamente
  → Usuário preenche nome → POST /family-groups
  → window.location.reload() → queries são refeitas
```

### Erro 403 (JWT inválido/expirado)
```
Request retorna 403
  → Spring Security rejeitou a autenticação
  → CAUSA MAIS COMUM: backend foi reiniciado (H2 em memória apagado)
  → SOLUÇÃO: fazer login novamente (ou re-registrar se dados foram perdidos)

  Obs: 401 (token ausente/inválido) → interceptor redireciona para /login
       403 (autenticado mas sem permissão, ou token de usuário inexistente) → não redireciona automaticamente
```

---

## 13. Guia de Alterações

### Adicionar um novo campo em um formulário existente

1. **Adicione o campo na interface** em `src/types/api.ts` (ex: `AccountRequest`)
2. **Atualize o schema Zod** dentro do Sheet correspondente
3. **Adicione o campo no formulário** dentro do `<SheetLayout>`
4. **Passe o campo na chamada `mutateAsync`** no `onSubmit`

### Adicionar uma nova página

1. Crie `src/app/(app)/nova-rota/page.tsx` com `'use client'`
2. Adicione o link no `AppSidebar` (`components/layout/app-sidebar.tsx`)
3. Os hooks e autenticação já funcionam automaticamente (herdados do layout)

### Adicionar um novo endpoint

1. Declare as interfaces em `src/types/api.ts`
2. Crie o hook em `src/hooks/use-finance.ts`:
   ```typescript
   export function useNovaFuncionalidade() {
     return useQuery({
       queryKey: ['finance', 'nova-chave'],
       queryFn: async () => {
         const { data } = await api.get<ApiResponse<SeuTipo>>('/finance/rota');
         return data.data;
       },
     });
   }
   ```
3. Use o hook na página

### Criar um link com visual de botão (sem `asChild`)
```tsx
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

<Link href="/destino" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'extra-classes' })}>
  Texto do link
</Link>
```

### Invalidar queries após uma ação
```typescript
const qc = useQueryClient();
// dentro de onSuccess de uma mutation:
qc.invalidateQueries({ queryKey: ['finance', 'accounts'] });
qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
```

### Query Keys de referência
| Dado | Query Key |
|------|-----------|
| Visão geral | `['finance', 'overview']` |
| Transações | `['finance', 'transactions']` |
| Contas | `['finance', 'accounts']` |
| Cartões | `['finance', 'credit-cards']` |
| Fatura de cartão | `['finance', 'credit-cards', cardId, 'invoices', yearMonth]` |
| Cofrinhos | `['finance', 'savings']` |
| Investimentos | `['finance', 'investments']` |
| Lista de desejos | `['finance', 'wishlist']` |
| Relatórios mensais | `['finance', 'reports', 'monthly', month]` |
