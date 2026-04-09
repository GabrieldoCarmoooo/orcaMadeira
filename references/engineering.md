# Padrões de Engenharia - OrçaMadeira

## TypeScript
- strict: true sempre
- Nunca usar `any` - usar `unknown` e type narrowing
- Interfaces para objetos, types para unions/intersections
- Exportar tipos de `src/types/`

## Componentes React
- Functional components apenas
- Props tipadas com interface
- Um componente por arquivo
- Export default no final

## Nomenclatura
| Item | Padrão | Exemplo |
|------|--------|---------|
| Componente | PascalCase | `OrcamentoCard` |
| Arquivo | kebab-case | `orcamento-card.tsx` |
| Hook | camelCase com use | `useOrcamento.ts` |
| Store | camelCase com use | `useOrcamentoStore.ts` |
| Type/Interface | PascalCase | `Orcamento` |
| Constante | UPPER_SNAKE | `MAX_UPLOAD_SIZE` |
| Função | camelCase | `calcularTotal()` |

## Imports
- Path alias: `@/` para `src/`
- Ordem: react > libs externas > components > hooks > types > utils > styles
- Nunca usar imports relativos que subam mais de um nível

## Estado
- Local: useState/useReducer
- Global: Zustand stores em `src/stores/`
- Server: TanStack Query para cache (futuro)
- Forms: React Hook Form + Zod

## Git
- Commits em inglês
- Formato: `type(scope): description`
- Types: feat, fix, refactor, style, docs, test, chore
- Branches: `feature/issue-xxx-short-description`
