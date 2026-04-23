# OrçaMadeira — Regras de Negócio e Contexto do Projeto

## Sobre o Produto
OrçaMadeira é um SaaS web responsivo mobile-first para marceneiros e carpinteiros criarem orçamentos profissionais usando preços reais de uma madeireira parceira.

## Usuários do Sistema

### Carpinteiro / Marceneiro
- Cria orçamentos para clientes finais.
- Consome o catálogo de produtos disponibilizado pela Madeireira vinculada.
- Configura margem de lucro, mão de obra, impostos, frete e demais campos.
- Aplica, quando desejar, um **Serviço de Acabamento** (markup percentual) em itens de madeira.
- Gera PDF profissional personalizado com logo e cores da sua marca.

### Madeireira
- Cadastra o catálogo **diretamente no app** (fluxo principal), dividido em 4 categorias:
  1. **Espécies de Madeira** — base de cálculo (nome + custo por m³ + margem de lucro %).
  2. **Madeiras m³** — produto dimensionado (referencia uma espécie e tem lista própria de comprimentos disponíveis).
  3. **Outros Produtos** — itens com preço fixo e unidade livre (parafuso, prego, telha, etc.).
  4. **Serviços de Acabamento** — modificadores percentuais aplicáveis a itens de madeira no orçamento.
- **Importação via planilha (CSV/XLSX) continua disponível como opção de bulk/legado** — convive com o catálogo relacional e não pode ser quebrada.

## Regras de Negócio Críticas

### Orçamentos
1. Fórmula: **Materiais + Mão de Obra + Margem de Lucro + Impostos = Preço Final**
2. Preços de materiais vêm SEMPRE do catálogo da madeireira vinculada.
3. O carpinteiro define mão de obra por projeto (fixo) ou por hora × horas estimadas.
4. Margem de lucro é um percentual definido pelo carpinteiro.
5. Impostos são configuráveis (ISS etc.).
6. O orçamento gera um PDF profissional com logo, detalhes e preços (opção de exibir ou ocultar materiais/mão de obra).

### Catálogo — regras de cálculo
- **Espécie:** `valor_m3_venda = custo_m3 * (1 + margem_lucro_pct / 100)` — **calculado, nunca armazenado**. Ajustar custo ou margem reflete automaticamente em todas as madeiras da espécie.
- **Madeira m³:** `valor_unitario = (espessura_cm / 100) * (largura_cm / 100) * comprimento_m * valor_m3_venda`.
  - Exemplo: Viga 5×15 Cambará, espécie Cambará a R$ 3.500/m³ com 20% de margem → venda R$ 4.200/m³ → peça de 1m: `0,05 × 0,15 × 1 × 4.200 = R$ 31,50`.
- **Comprimentos disponíveis:** cada Madeira m³ tem uma lista 1:N de comprimentos cadastrados pela madeireira. No orçamento o carpinteiro **seleciona um dos comprimentos pré-cadastrados** (não digita comprimento livre).
- **Acabamento:** `preco_final = preco_base * (1 + percentual_acrescimo / 100)`. Snapshot gravado no item do orçamento.

### Tipos de Projeto
- **Móveis**: armários, mesas, prateleiras, cozinhas planejadas.
- **Estruturas**: telhados, pergolados, decks, coberturas.

### Vinculação Carpinteiro ↔ Madeireira
- Cada carpinteiro vincula-se a uma madeireira principal (status `pendente` → `aprovada`/`rejeitada`).
- Se a madeireira atualizar custo, margem ou comprimentos, **orçamentos em rascunho** usam os valores novos.
- **Orçamentos finalizados** mantêm os preços do momento da finalização (snapshot em `itens_orcamento.preco_unitario` e demais colunas de snapshot).

### Importação via Planilha (legado / bulk)
- Aceita CSV e Excel (`.xlsx`, `.xls`).
- Colunas obrigatórias: `nome`, `unidade`, `preco_unitario`.
- Colunas opcionais: `categoria`, `código`, `descrição`, `disponível`.
- Tamanho máximo: 10MB.
- Validação: rejeita preços negativos, linhas com campos obrigatórios vazios; relatório de erros por linha sem bloquear o import das válidas.
- Apenas uma tabela ativa por madeireira (ativação atômica).

## Stack Técnica
- **Frontend**: React 19 + TypeScript strict + Vite 8.
- **Estado**: Zustand 5 (stores) + React Hook Form 7 + Zod 4 (forms/validação).
- **Styling**: Tailwind CSS 4 + shadcn/ui (radix-nova) com design system **Timber Grain — Master's Atelier**.
  - Primary: Wood Gold `#7A5900`. Secondary: Mahogany `#9D422B`.
  - Sem bordas 1px (apenas tonal layering). Glassmorphism no header. Grid editorial assimétrico 4/8.
- **Roteamento**: React Router v7.
- **Font**: Inter Variable. **Ícones**: Lucide React.
- **Backend**: Supabase (Auth + Postgres + Storage). Todas as tabelas com RLS.
- **PDF**: `@react-pdf/renderer` 4.
- **Planilhas**: PapaParse + SheetJS (xlsx).
- **Path alias**: `@/` → `./src/`.

## Convenções de Código
- TypeScript **strict** sempre; **nunca `any`** (use `unknown` + narrowing, genéricos ou tipos do domínio).
- Componentes em PascalCase; arquivos em kebab-case.
- Imports absolutos via `@/`; nunca subir mais de um nível com imports relativos.
- Estrutura:
  - `src/components/ui/` — primitives shadcn (não editar manualmente).
  - `src/components/layout/` — header, sidebar, guards.
  - `src/components/orcamento/` — fluxo de orçamento.
  - `src/components/madeireira/catalogo/` — abas do catálogo (Espécies, Madeiras m³, Outros Produtos, Acabamentos).
  - `src/components/madeireira/` — demais componentes (upload, parceiros).
  - `src/components/shared/` — reutilizáveis de negócio.
  - `src/pages/{auth,carpinteiro,madeireira}/`
  - `src/hooks/` — acesso a dados (`useCatalogoProdutos`, `useEspecies`, `useMadeirasM3`, `useOutrosProdutos`, `useAcabamentos`, `useItensPreco` etc.).
  - `src/stores/` — Zustand stores.
  - `src/types/` — interfaces e unions.
  - `src/lib/` — utilitários puros (`calcular-orcamento`, `calcular-madeira`, `parse-planilha`, `supabase`, `pdf`).
  - `src/lib/schemas/` — Zod schemas de forms.
  - `supabase/migrations/` — SQL versionado.
- Código em inglês. **Comentários e nomes de variáveis de domínio em português-BR** (`orcamento`, `madeireira`, `calcularValorMadeiraM3`). Comentários explicam o **porquê** de cada bloco lógico, não o óbvio linha a linha.
- Commits em inglês, formato `type(scope): description`.

## Segurança (obrigatório)
- **Nunca** expor chaves privilegiadas no frontend — apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` vão ao bundle.
- Operações com service role exclusivamente em Edge Functions.
- **RLS sempre ativado** em tabelas novas, com políticas explícitas:
  - Dona (madeireira ou carpinteiro) → `FOR ALL` com `auth.uid()`.
  - Carpinteiros vinculados com `status = 'aprovada'` → `FOR SELECT` via JOIN em `vinculacoes`.
- Validação Zod obrigatória em todos os formulários e nos boundaries de upload.
- Sanitização de uploads CSV/XLSX (tipos, limites, colunas, preços negativos, campos vazios).
- Nunca `dangerouslySetInnerHTML` com conteúdo do usuário. Nunca logar dados sensíveis.

## Referências
- Arquitetura: `references/architecture.md`
- Engenharia (padrões): `references/engineering.md`
- Design (conceitual): `references/NOVODESIGN.md`
- Design (mockups por tela): `references/design-atualizado/`
- PRD: `PRD.md`
- Spec técnica: `spec.md`

## Skills
- **Banco de dados** → `supabase-postgres-best-practices` + MCP (`mcp__supabase__apply_migration`, `mcp__supabase__generate_typescript_types`).
- **Layout / design** → `shadcn` (para primitives) ou `frontend-design` (para composição).
- **PDF** → `pdf`.
- **MCP custom** → `mcp-builder`.
- **Execução de ISSUE** → `/execute` (lê CLAUDE.md + references + PRD + spec + ISSUES antes de codar).
- **Debug** → `/debug`. **Planejar** → `/spec` ou `/break`.
