---
name: frontend-context
description: Use this skill for ANY task involving the mylife-web frontend — adding features, fixing bugs, creating components, editing pages, modifying hooks, or reviewing code. Triggers on mentions of "frontend", "mylife-web", "página", "componente", "hook", "tela", "formulário", or any specific page/route name (dashboard, transactions, accounts, credit-cards, savings, investments, wishlist, reports).
version: 2.0.0
---

# Frontend Context — redirecionamento

Esta skill foi dividida em duas skills mais específicas.
Carregue a que se aplica à tarefa:

| Skill | Quando usar |
|-------|------------|
| **`ui-design-system`** | Componentes UI, SheetLayout, tints, StatCard, ConfirmDialog, DatePicker, MonthPicker, Tailwind, design tokens, padrão visual |
| **`myfinance-context`** | Rotas, hooks (`use-finance.ts`), sheets, query keys, API integration, enums — tudo específico do módulo Finance |

Para features que envolvem os dois (ex: criar um novo formulário para o Finance),
carregue **ambas**.
