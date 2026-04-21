# Padrões de Engenharia — OrçaMadeira

## TypeScript
- `strict: true` sempre.
- **Nunca** `any`. Use `unknown` + narrowing, genéricos ou tipos do domínio. Não use `@ts-ignore` / `eslint-disable` sem justificativa explícita em comentário.
- `interface` para objetos; `type` para unions/intersections e **unions discriminadas** (ex.: `CatalogoItem` discriminado por `origem`).
- Tipos geradas pelo Supabase em `src/types/supabase-generated.ts` (regenerar via MCP após cada migration).
- Exportar tipos do domínio de `src/types/`.

## Componentes React
- Functional components apenas.
- Props tipadas com `interface`.
- Um componente por arquivo; `export default` no final.
- Lógica de negócio **fora** de componentes — extrair para `src/hooks/` ou `src/lib/`.
- Componentes não falam direto com Supabase — sempre via hook (`useEspecies`, `useMadeirasM3` etc.).

## Nomenclatura

| Item | Padrão | Exemplo |
|------|--------|---------|
| Componente | PascalCase | `OrcamentoCard`, `MadeiraM3Form` |
| Arquivo de componente | kebab-case | `madeira-m3-form.tsx` |
| Hook | camelCase com `use` | `useCatalogoProdutos.ts` |
| Store | camelCase com `use…Store` | `useOrcamentoStore.ts` |
| Type / Interface | PascalCase | `EspecieMadeira`, `CatalogoItem` |
| Constante | UPPER_SNAKE | `MAX_UPLOAD_SIZE` |
| Função pura | camelCase | `calcularValorMadeiraM3()` |
| Schema Zod | camelCase com `Schema` | `especieSchema` |

Variáveis de domínio em pt-BR são permitidas (`orcamento`, `madeireira`, `custoM3`). Código-base e commits em inglês.

## Imports
- Path alias: `@/` → `src/`.
- Ordem: `react` > libs externas > `@/components` > `@/hooks` > `@/types` > `@/lib` > estilos.
- Nunca imports relativos que subam mais de um nível.

## Estado
- **Local:** `useState`/`useReducer`.
- **Global:** Zustand stores em `src/stores/`. API mínima — use `create`, `set`, `get`.
- **Server/cache:** hooks com `useEffect` + debounce; TanStack Query reservado para futuro.
- **Forms:** React Hook Form + Zod (`zodResolver`). Schemas em `src/lib/schemas/`.
- **Store do wizard de orçamento:** `useOrcamentoStore` mantém `ItemOrcamentoCalculo[]` com `origem` + snapshots.

## Comentários
- Default: **não comentar**. Só escreva comentário quando o "porquê" não for óbvio.
- **Em cada bloco lógico não trivial, explicar em português-BR o propósito** (não linha a linha — por bloco).
- Exemplo aceitável:
  ```ts
  // Valor de venda do m³ é derivado (custo + margem) — nunca armazenado na espécie.
  // Isso garante que ajustar custo ou margem reflete em todas as madeiras dependentes.
  const valorVendaM3 = custo * (1 + margemPct / 100)
  ```
- Não documentar o óbvio nem referenciar ISSUE/PR/autor — isso pertence ao git log.

## Acesso a Dados (Supabase)
- Sempre via `src/lib/supabase.ts` com o `Database` tipado.
- Hooks CRUD por entidade; nenhum componente fala com Supabase diretamente.
- Seguir o padrão de `useItensPreco.ts`: resolução de `madeireira_id` via vinculação aprovada + debounce 300ms na busca.
- Queries paralelas (`Promise.all`) quando o hook une múltiplas origens (ex.: `useCatalogoProdutos`).

## Validação
- **Todo** formulário usa Zod via `zodResolver`.
- Parse de payloads vindos de CSV/XLSX passa por schema Zod antes do insert.
- Validar também no boundary: Edge Function ou antes de `supabase.insert()`.

## Polimorfismo `itens_orcamento`
- Campo discriminante: `origem ∈ {'legado_planilha','madeira_m3','outro_produto'}`.
- `CHECK` constraint no banco garante que exatamente UMA das FKs (`item_preco_id`, `madeira_m3_id`, `outro_produto_id`) está preenchida conforme `origem`.
- Na UI, usar `z.discriminatedUnion('origem', [...])` para preservar type safety.
- Snapshots de espécie/dimensões/comprimento/acabamento são gravados no insert — nunca joinados em runtime para exibição de orçamentos finalizados.

## RLS (sempre presente em migrations novas)
- `ALTER TABLE <t> ENABLE ROW LEVEL SECURITY` obrigatório.
- Duas policies padrão por tabela com `madeireira_id` direto:
  - `<t>_madeireira_all` → `FOR ALL` para a dona.
  - `<t>_vinculados_select` → `FOR SELECT` para carpinteiros com vinculação aprovada.
- Tabelas filhas (ex.: `comprimentos_madeira_m3`) resolvem ownership via JOIN na tabela pai.

## Segurança (obrigatório)
- **Secrets no client:** apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Service role **nunca** exposto — vai em Edge Function.
- Validação Zod em todos os boundaries (forms, upload, edge functions).
- Sanitização de uploads CSV/XLSX (tipos, tamanho máx, colunas obrigatórias, preços negativos).
- Nunca `dangerouslySetInnerHTML` com conteúdo do usuário.
- Logs nunca contêm dados sensíveis (preços de parceiros, CPF/CNPJ, tokens).
- CPF/CNPJ armazenados sem máscara; máscara só na apresentação.

## Performance
- Debounce de 300ms em buscas; 30s em autosave de rascunho.
- Paginação com limite máx 50 por query.
- Code splitting por rota com `React.lazy()`.
- Índices Postgres para colunas filtradas com frequência (`especie_id`, `madeireira_id`, `(madeira_m3_id) WHERE disponivel = true` etc.).

## Git
- Commits em inglês. Formato `type(scope): description`.
- `type ∈ { feat, fix, refactor, style, docs, test, chore }`.
- Branches: `feature/issue-xxx-short-description`.
- Nunca `--no-verify` / `--no-gpg-sign` sem pedido explícito.
- Nunca push a `main` sem pedido.

## Proibições
- ❌ Instalar pacotes sem perguntar.
- ❌ Alterar configs do projeto (tsconfig, vite, tailwind, eslint) sem justificar.
- ❌ Criar arquivos fora da estrutura definida em `references/architecture.md`.
- ❌ Editar componentes em `src/components/ui/` gerados pelo shadcn CLI.
- ❌ Armazenar valores derivados (`valor_m3_venda`, `valor_unitario` de Madeira m³).
- ❌ Fazer o componente falar direto com Supabase.
