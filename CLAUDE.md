# myLife — Monorepo

## Estrutura de diretórios

```
mylife-backend/mylife-backend/   ← Spring Boot 3.5 · Java 21 · H2 file · Maven
mylife-web/                      ← Next.js 16 · React 19 · TypeScript · Tailwind CSS v4
instrucoes/                      ← Documentação e orientações do projeto
.claude/skills/                  ← Skills deste projeto
```

## Módulos

| Módulo | Rota base (frontend) | Pacote (backend) | Status |
|--------|---------------------|------------------|--------|
| **myFinance** | `(app)/` | `com.mylife.finance` | ativo |
| **myFit** | `(fit)/` (em breve) | `com.mylife.fit` (em breve) | planejado |

## Skills disponíveis

| Skill | Quando carregar |
|-------|-----------------|
| `ui-design-system` | Componentes UI, SheetLayout, tints, StatCard, ConfirmDialog, pickers |
| `myfinance-context` | Features do módulo Finance: rotas, hooks, sheets, query keys |
| `backend-context` | Qualquer tarefa no backend Spring Boot |
| `start-servers` | Subir ambiente de desenvolvimento local |

## Regras críticas (valem para todos os módulos)

- **`@base-ui/react` não tem `asChild`** — nunca `<Button asChild><Link>`. Use `buttonVariants()` no `className` do `<Link>`.
- **Erro do backend** — sempre extrair em catch: `(err as { response?: { data?: { message?: string } } })?.response?.data?.message`
- **Deletar/confirmar ações destrutivas** — usar `ConfirmDialog` (`src/components/ui/confirm-dialog.tsx`), nunca `window.confirm()`
- **Documentar mudanças** — ao alterar qualquer funcionalidade frontend, atualizar `instrucoes/frontend-docs.md`

## Convenção de commits

```
feat: descrição curta
fix: descrição curta
refactor: descrição curta
chore: descrição curta
```
