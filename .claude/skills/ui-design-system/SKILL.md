---
name: ui-design-system
description: Use this skill when working on UI components, design tokens, shared visual patterns, or building screens for any module (myFinance, myFit, etc.). Triggers on mentions of: SheetLayout, tint, StatCard, ConfirmDialog, DatePicker, MonthPicker, CurrencyInput, Tailwind, design system, component, layout, estilo, tema, dark mode, or when creating a new module UI from scratch.
version: 1.0.0
---

# UI Design System — mylife-web

Compartilhado entre todos os módulos (myFinance, myFit, ...).

---

## Stack

Next.js 16 · React 19 · TypeScript · **Tailwind CSS v4** · **@base-ui/react v1.5** (NÃO Radix UI) · Sonner (toasts)

---

## Regra crítica — @base-ui/react não tem `asChild`

```tsx
// CORRETO — Link estilizado como botão
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
<Link href="/rota" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Texto</Link>

// ERRADO — gera warning no DOM
<Button asChild><Link href="/rota">Texto</Link></Button>
```

---

## Tipografia & Cores

**Fonte:** Plus Jakarta Sans — pesos 400–800. `var(--font-sans)`. Nunca trocar sem aprovação.  
**Valores tabulares:** `Geist Mono` (`font-mono`).

| Token | Claro | Escuro |
|-------|-------|--------|
| Fundo geral | `#F3F6FA` | `#0B0B11` |
| Card | branco, sombra (sem borda) | `#14141D`, sombra + ring 1px branco/6% |
| Primary | `emerald-500` | lime-emerald brilhante |

**Cards:** nunca adicionar `border` em `<Card>` — o CSS global já aplica sombra via `[data-slot="card"]`.

---

## StatCard — métrica colorida

`src/components/ui/stat-card.tsx`

```tsx
<StatCard
  title="Saldo em contas"
  value={fmt(total)}
  sub="2 conta(s)"
  icon={Wallet}
  gradient="from-sky-400 to-blue-600"
  shadowColor="shadow-sky-300/40 dark:shadow-sky-900/30"
  loading={isLoading}
/>
```

### Gradientes por domínio

| Contexto | gradient | shadowColor |
|---|---|---|
| Saldo / contas | `from-sky-400 to-blue-600` | `shadow-sky-300/40 dark:shadow-sky-900/30` |
| Patrimônio líquido | `from-emerald-400 to-teal-600` | `shadow-emerald-300/40 dark:shadow-emerald-900/30` |
| Cofrinhos | `from-violet-400 to-purple-600` | `shadow-violet-300/40 dark:shadow-violet-900/30` |
| Dívida / cartão | `from-rose-400 to-rose-600` | `shadow-rose-300/40 dark:shadow-rose-900/30` |
| Investimentos | `from-amber-400 to-orange-500` | `shadow-amber-300/40 dark:shadow-amber-900/30` |
| Receita | `from-emerald-500 to-teal-500` | — |
| Despesa | `from-rose-500 to-pink-500` | — |

---

## Cabeçalho de seção (CardHeader com ícone badge)

Padrão obrigatório para títulos de seção dentro de cards:

```tsx
<CardHeader className="px-6 pb-3 pt-5">
  <div className="flex items-center gap-2.5">
    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15">
      <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    </div>
    <CardTitle>Título</CardTitle>
  </div>
</CardHeader>
```

---

## SheetLayout — modal de formulário

`src/components/ui/sheet-primitives.tsx` — use para TODOS os formulários de criação/edição.

```tsx
import { SheetLayout, SheetInput, SheetCurrencyInput, SheetSelectTrigger,
         SheetDatePicker, SheetMonthPicker, FieldLabel, SectionDivider }
  from '@/components/ui/sheet-primitives';

<SheetLayout
  open={open} onOpenChange={onOpenChange}
  tint="emerald"
  icon={<Icon className="h-5 w-5" />}
  title="Novo item" subtitle="Preencha os campos abaixo."
  ctaLabel="Salvar"
  onSubmit={handleSubmit(onSubmit)}
  isPending={isPending}
>
  <SectionDivider label="Identificação" />
  <FieldLabel>Nome</FieldLabel>
  <SheetInput id="name" placeholder="..." {...register('name')} />
  <SheetCurrencyInput id="valor" value={field.value} onChange={field.onChange} />
  <SheetMonthPicker value={field.value} onChange={field.onChange} />  {/* YYYY-MM */}
  <SheetDatePicker  value={field.value} onChange={field.onChange} />  {/* YYYY-MM-DD */}
</SheetLayout>
```

### Tints por domínio

| Domínio | Tint |
|---------|------|
| Transações — receita | `emerald` |
| Transações — despesa | `rose` |
| Contas bancárias | `emerald` |
| Cartões de crédito | `violet` |
| Cofrinhos (savings) | `sky` |
| Investimentos | `emerald` |
| Lista de desejos | `amber` |
| myFit (geral) | `blue` (sugestão inicial) |

Tints disponíveis: `emerald` `violet` `rose` `blue` `amber` `sky`

---

## ConfirmDialog — ações destrutivas

`src/components/ui/confirm-dialog.tsx` — substitui `window.confirm()` em todas as operações de exclusão/cancelamento.

```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

<ConfirmDialog
  open={confirmOpen}
  onOpenChange={setConfirmOpen}
  title="Excluir item?"
  description="Esta ação não pode ser desfeita."
  confirmLabel="Excluir"
  variant="danger"          // 'danger' | 'warning' | 'default'
  loading={mutation.isPending}
  onConfirm={async () => {
    await mutation.mutateAsync(id);
    toast.success('Excluído!');
    setConfirmOpen(false);
  }}
/>
```

---

## Componentes UI disponíveis

| Componente | Arquivo | Uso |
|---|---|---|
| `StatCard` | `ui/stat-card.tsx` | Métricas numéricas de destaque |
| `SheetLayout` | `ui/sheet-primitives.tsx` | Modal de formulário |
| `SheetInput` | `ui/sheet-primitives.tsx` | Input dentro de SheetLayout |
| `SheetCurrencyInput` | `ui/sheet-primitives.tsx` | Input monetário (BRL) |
| `SheetDatePicker` | `ui/sheet-primitives.tsx` | Seletor de data (YYYY-MM-DD) |
| `SheetMonthPicker` | `ui/sheet-primitives.tsx` | Seletor de mês (YYYY-MM) |
| `SheetSelectTrigger` | `ui/sheet-primitives.tsx` | Trigger de Select dentro de Sheet |
| `ConfirmDialog` | `ui/confirm-dialog.tsx` | Confirmação de ação destrutiva |
| `CurrencyInput` | `ui/currency-input.tsx` | Input monetário standalone |
| `BankSelector` | `ui/bank-selector.tsx` | Seletor de banco com logo |
| `Badge` | `ui/badge.tsx` | Label colorida |
| `StatCard` | `ui/stat-card.tsx` | Card de métrica |

**Onde criar novo componente UI base:** `src/components/ui/`

---

## Sidebar — ativo automático

`[data-sidebar="menu-button"][data-active="true"]` recebe barra verde vertical à esquerda automaticamente via `globals.css`. Não adicionar estilos manuais.
