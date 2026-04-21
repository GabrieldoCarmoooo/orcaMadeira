
# Issues — Catálogo Relacional de Produtos + Adaptação do Orçamento

> Gerado a partir de: `Plano-catalogo-produtos-adaptacao-orcamento.md`
> Total de issues: 27
> Última atualização: 2026-04-13

---

## Índice rápido

| ID | Fase | Título | Status | Deps |
|----|------|--------|--------|------|
| ISSUE-001 | 1 | Criar tabelas `especies_madeira` e `madeiras_m3` no SQL | `concluída` | — |
| ISSUE-002 | 1 | Criar tabelas `outros_produtos`, `servicos_acabamento` e `comprimentos_madeira_m3` | `concluída` | ISSUE-001 |
| ISSUE-003 | 1 | Criar triggers `updated_at` para as 5 novas tabelas | `concluída` | ISSUE-002 |
| ISSUE-004 | 1 | Criar policies RLS para as 4 tabelas com `madeireira_id` direto | `concluída` | ISSUE-003 |
| ISSUE-005 | 1 | Criar policies RLS para `comprimentos_madeira_m3` + ALTER TABLE `itens_orcamento` | `concluída` | ISSUE-004 |
| ISSUE-006 | 1 | Aplicar migration 002 via MCP Supabase + regenerar types TypeScript | `concluída` | ISSUE-005 |
| ISSUE-007 | 2 | Criar `src/types/produto.ts` com interfaces e union discriminada | `concluída` | ISSUE-006 |
| ISSUE-008 | 2 | Estender `src/types/orcamento.ts` com campos de origem/comprimento/acabamento | `concluída` | ISSUE-007 |
| ISSUE-009 | 2 | Criar 4 Zod schemas em `src/lib/schemas/` | `concluída` | ISSUE-007 |
| ISSUE-010 | 2 | Criar `src/lib/calcular-madeira.ts` com 3 funções puras | `concluída` | ISSUE-007 |
| ISSUE-011 | 3 | Instalar 6 primitivos shadcn: tabs, dialog, select, table, form, dropdown-menu | `concluída` | — |
| ISSUE-012 | 4 | Criar hooks `useEspecies.ts`, `useOutrosProdutos.ts`, `useAcabamentos.ts` | `concluída` | ISSUE-006 |
| ISSUE-013 | 4 | Criar hook `useMadeirasM3.ts` com transação create/update incluindo comprimentos | `concluída` | ISSUE-006 |
| ISSUE-014 | 4 | Criar componentes base: `tabs-produtos.tsx` e `empty-state.tsx` | `concluída` | ISSUE-011 |
| ISSUE-015 | 4 | Criar `especies-panel.tsx` + `especie-form.tsx` com preview de `valor_m3_venda` | `concluída` | ISSUE-012, ISSUE-014 |
| ISSUE-016 | 4 | Criar `madeiras-m3-panel.tsx` + `madeira-m3-form.tsx` com seção de comprimentos | `concluída` | ISSUE-013, ISSUE-015 |
| ISSUE-017 | 4 | Criar `outros-produtos-panel.tsx` + `outro-produto-form.tsx` | `concluída` | ISSUE-012, ISSUE-014 |
| ISSUE-018 | 4 | Criar `acabamentos-panel.tsx` + `acabamento-form.tsx` | `concluída` | ISSUE-012, ISSUE-014 |
| ISSUE-019 | 4 | Refatorar `precos-page.tsx` para tabbed layout com 5 abas | `concluída` | ISSUE-015, ISSUE-016, ISSUE-017, ISSUE-018 |
| ISSUE-020 | 5 | Criar `useCatalogoProdutos.ts` com queries paralelas + CatalogoItem[] unificado | `concluída` | ISSUE-006, ISSUE-013 |
| ISSUE-021 | 5 | Editar `step-materiais.tsx` — Select de comprimento + dialog de configuração | `concluída` | ISSUE-020, ISSUE-010 |
| ISSUE-022 | 5 | Editar `item-material.tsx` — badges de origem e acabamento | `concluída` | ISSUE-008 |
| ISSUE-023 | 5 | Estender `useOrcamentoStore.ts` com `comprimento_id`, `origem` e `acabamento_*` | `concluída` | ISSUE-008, ISSUE-010 |
| ISSUE-024 | 6 | Mapear persistência em `novo-orcamento-page.tsx` para colunas de origem | `concluída` | ISSUE-023 |
| ISSUE-025 | 7 | Editar `pdf-document.tsx` — linha auxiliar por item com espécie + dimensões + acabamento | `concluída` | ISSUE-022 |
| ISSUE-026 | 8 | Verificação final — typecheck + build + golden path SISMASTER | `pendente` | ISSUE-024, ISSUE-025 |
| ISSUE-027 | 9 | Regenerar `PRD.md` com seções F4/F5 atualizadas + modelo de dados | `concluída` | ISSUE-026 |

---

## Fase 1 — Banco de dados

### [ISSUE-001] Criar tabelas `especies_madeira` e `madeiras_m3` no SQL da migration 002

**Status**: `concluída`
**Fase**: 1
**Dependências**: nenhuma
**Estimativa**: pequena (< 1h)

**Contexto**
Inicia o arquivo `supabase/migrations/002_catalogo_produtos.sql`. `especies_madeira` é a base de precificação (custo + margem); `madeiras_m3` referencia a espécie via FK para herdar o valor de venda calculado.

**O que fazer**
- [x] Criar o arquivo `supabase/migrations/002_catalogo_produtos.sql`
- [x] Adicionar `CREATE TABLE especies_madeira` com colunas: `id uuid PK DEFAULT gen_random_uuid()`, `madeireira_id uuid NOT NULL REFERENCES madeireiras(id) ON DELETE CASCADE`, `nome text NOT NULL`, `custo_m3 numeric(10,2) NOT NULL CHECK (custo_m3 > 0)`, `margem_lucro_pct numeric(5,2) NOT NULL DEFAULT 0 CHECK (margem_lucro_pct >= 0)`, `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()`
- [x] Adicionar `CREATE UNIQUE INDEX especies_madeira_nome_uniq ON especies_madeira (madeireira_id, lower(nome))`
- [x] Adicionar `CREATE TABLE madeiras_m3` com colunas: `id uuid PK`, `madeireira_id uuid NOT NULL REFERENCES madeireiras(id) ON DELETE CASCADE`, `especie_id uuid NOT NULL REFERENCES especies_madeira(id)`, `nome text NOT NULL`, `espessura_cm numeric(6,2) NOT NULL CHECK (espessura_cm > 0)`, `largura_cm numeric(6,2) NOT NULL CHECK (largura_cm > 0)`, `comprimento_m numeric(6,2) NOT NULL DEFAULT 1 CHECK (comprimento_m > 0)`, `disponivel boolean NOT NULL DEFAULT true`, `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()`
- [x] Adicionar índice: `CREATE INDEX madeiras_m3_especie_idx ON madeiras_m3 (especie_id)`

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `supabase/migrations/002_catalogo_produtos.sql` | início da migration com as 2 primeiras tabelas |

**Critérios de aceitação**
- [x] SQL é válido (sem erros de sintaxe ao aplicar no Supabase Studio)
- [x] `especie_id` na tabela `madeiras_m3` tem FK para `especies_madeira`
- [x] `custo_m3 = -1` é rejeitado pelo CHECK constraint

---

### [ISSUE-002] Criar tabelas `outros_produtos`, `servicos_acabamento` e `comprimentos_madeira_m3`

**Status**: `concluída`
**Fase**: 1
**Dependências**: ISSUE-001
**Estimativa**: pequena (< 1h)

**Contexto**
Completa a criação das 5 tabelas novas da migration 002. `comprimentos_madeira_m3` é 1:N com `madeiras_m3` e armazena os comprimentos disponíveis por produto (fiel ao SISMASTER "Vários Comprimentos"). Estoque não é rastreado nesta fase.

**O que fazer**
- [x] Adicionar `CREATE TABLE outros_produtos` com colunas: `id uuid PK`, `madeireira_id uuid NOT NULL REFERENCES madeireiras(id) ON DELETE CASCADE`, `nome text NOT NULL`, `unidade text NOT NULL`, `preco_unitario numeric(10,2) NOT NULL CHECK (preco_unitario >= 0)`, `descricao text`, `disponivel boolean NOT NULL DEFAULT true`, `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()`
- [x] Adicionar `CREATE TABLE servicos_acabamento` com colunas: `id uuid PK`, `madeireira_id uuid NOT NULL REFERENCES madeireiras(id) ON DELETE CASCADE`, `nome text NOT NULL`, `percentual_acrescimo numeric(5,2) NOT NULL CHECK (percentual_acrescimo >= 0)`, `ativo boolean NOT NULL DEFAULT true`, `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()`
- [x] Adicionar `CREATE TABLE comprimentos_madeira_m3` com colunas: `id uuid PK`, `madeira_m3_id uuid NOT NULL REFERENCES madeiras_m3(id) ON DELETE CASCADE`, `comprimento_m numeric(6,2) NOT NULL CHECK (comprimento_m > 0)`, `disponivel boolean NOT NULL DEFAULT true`, `created_at timestamptz NOT NULL DEFAULT now()`
- [x] Adicionar `CREATE UNIQUE INDEX comprimentos_m3_uniq ON comprimentos_madeira_m3 (madeira_m3_id, comprimento_m)`
- [x] Adicionar `CREATE INDEX comprimentos_m3_disponivel_idx ON comprimentos_madeira_m3 (madeira_m3_id) WHERE disponivel = true`

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `supabase/migrations/002_catalogo_produtos.sql` | adicionar as 3 tabelas restantes |

**Critérios de aceitação**
- [x] Constraint `UNIQUE(madeira_m3_id, comprimento_m)` bloqueia duplicata
- [x] `ON DELETE CASCADE` em `comprimentos_madeira_m3` apaga comprimentos ao deletar a madeira mãe

---

### [ISSUE-003] Criar triggers `updated_at` para as 5 novas tabelas

**Status**: `concluída`
**Fase**: 1
**Dependências**: ISSUE-002
**Estimativa**: pequena (< 1h)

**Contexto**
A função `set_updated_at()` já existe em `001_initial_schema.sql:180-186`. Basta criar os triggers para as 4 tabelas que têm o campo `updated_at` (não se aplica a `comprimentos_madeira_m3` que não tem esse campo).

**O que fazer**
- [x] Adicionar `CREATE TRIGGER set_updated_at_especies_madeira BEFORE UPDATE ON especies_madeira FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- [x] Adicionar o mesmo trigger para `madeiras_m3`, `outros_produtos` e `servicos_acabamento`
- [x] NÃO criar trigger para `comprimentos_madeira_m3` (sem campo `updated_at`)

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `supabase/migrations/002_catalogo_produtos.sql` | adicionar 4 triggers |

**Critérios de aceitação**
- [x] Atualizar `custo_m3` de uma espécie atualiza automaticamente `updated_at`
- [x] Sem erro "function set_updated_at does not exist" ao aplicar a migration

---

### [ISSUE-004] Criar policies RLS para as 4 tabelas com `madeireira_id` direto

**Status**: `concluída`
**Fase**: 1
**Dependências**: ISSUE-003
**Estimativa**: média (1–3h)

**Contexto**
Segue o padrão exato da migration 001 (linhas 278-294) para `tabelas_preco`: 2 policies por tabela — ALL para a madeireira dona, SELECT para carpinteiros vinculados aprovados. Total: 8 policies.

**O que fazer**
- [x] Para cada uma das tabelas `especies_madeira`, `madeiras_m3`, `outros_produtos`, `servicos_acabamento`:
  - Habilitar RLS: `ALTER TABLE <tabela> ENABLE ROW LEVEL SECURITY`
  - Criar policy `<tabela>_madeireira_all` FOR ALL com `EXISTS (SELECT 1 FROM madeireiras m WHERE m.id = <tabela>.madeireira_id AND m.user_id = auth.uid())`
  - Criar policy `<tabela>_vinculados_select` FOR SELECT com `EXISTS (SELECT 1 FROM vinculacoes v JOIN carpinteiros c ON c.id = v.carpinteiro_id WHERE v.madeireira_id = <tabela>.madeireira_id AND v.status = 'aprovada' AND c.user_id = auth.uid())`

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `supabase/migrations/002_catalogo_produtos.sql` | 8 policies (4 tabelas × 2 policies) |

**Critérios de aceitação**
- [x] Carpinteiro SEM vinculação não consegue fazer SELECT em `especies_madeira`
- [x] Madeireira dona consegue INSERT/UPDATE/DELETE nas 4 tabelas
- [x] Carpinteiro COM vinculação aprovada consegue SELECT, mas não INSERT

---

### [ISSUE-005] Criar policies RLS para `comprimentos_madeira_m3` + ALTER TABLE `itens_orcamento`

**Status**: `concluída`
**Fase**: 1
**Dependências**: ISSUE-004
**Estimativa**: média (1–3h)

**Contexto**
`comprimentos_madeira_m3` não tem `madeireira_id` direto — o acesso é resolvido via JOIN em `madeiras_m3`. O ALTER TABLE em `itens_orcamento` adiciona colunas de origem sem quebrar registros antigos (default `'legado_planilha'`).

**O que fazer**
- [x] `ALTER TABLE comprimentos_madeira_m3 ENABLE ROW LEVEL SECURITY`
- [x] Criar policy `comprimentos_m3_madeireira_all` FOR ALL: `EXISTS (SELECT 1 FROM madeiras_m3 mm JOIN madeireiras m ON m.id = mm.madeireira_id WHERE mm.id = comprimentos_madeira_m3.madeira_m3_id AND m.user_id = auth.uid())`
- [x] Criar policy `comprimentos_m3_vinculados_select` FOR SELECT: `EXISTS (SELECT 1 FROM madeiras_m3 mm JOIN vinculacoes v ON v.madeireira_id = mm.madeireira_id JOIN carpinteiros c ON c.id = v.carpinteiro_id WHERE mm.id = comprimentos_madeira_m3.madeira_m3_id AND v.status = 'aprovada' AND c.user_id = auth.uid())`
- [x] Adicionar ao final do arquivo o bloco ALTER TABLE:
  ```sql
  ALTER TABLE itens_orcamento
    ALTER COLUMN item_preco_id DROP NOT NULL,
    ADD COLUMN origem TEXT NOT NULL DEFAULT 'legado_planilha'
      CHECK (origem IN ('legado_planilha','madeira_m3','outro_produto')),
    ADD COLUMN madeira_m3_id UUID REFERENCES madeiras_m3(id),
    ADD COLUMN outro_produto_id UUID REFERENCES outros_produtos(id),
    ADD COLUMN especie_nome TEXT,
    ADD COLUMN espessura_cm NUMERIC(6,2),
    ADD COLUMN largura_cm NUMERIC(6,2),
    ADD COLUMN comprimento_real_m NUMERIC(6,2),
    ADD COLUMN comprimento_id UUID REFERENCES comprimentos_madeira_m3(id),
    ADD COLUMN acabamento_id UUID REFERENCES servicos_acabamento(id),
    ADD COLUMN acabamento_nome TEXT,
    ADD COLUMN acabamento_percentual NUMERIC(5,2),
    ADD CONSTRAINT itens_orcamento_origem_check CHECK (
      (origem = 'legado_planilha' AND item_preco_id IS NOT NULL) OR
      (origem = 'madeira_m3'      AND madeira_m3_id  IS NOT NULL) OR
      (origem = 'outro_produto'   AND outro_produto_id IS NOT NULL)
    );
  ```

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `supabase/migrations/002_catalogo_produtos.sql` | 2 policies + ALTER TABLE |

**Critérios de aceitação**
- [x] Orçamentos antigos com `item_preco_id IS NOT NULL` continuam válidos (CHECK passa)
- [x] Inserir item novo com `origem='madeira_m3'` e `madeira_m3_id=NULL` viola o CHECK
- [x] Carpinteiro sem vinculação não consegue SELECT em `comprimentos_madeira_m3`

---

### [ISSUE-006] Aplicar migration 002 via MCP Supabase + regenerar types TypeScript

**Status**: `concluída`
**Fase**: 1
**Dependências**: ISSUE-005
**Estimativa**: pequena (< 1h)

**Contexto**
Com a migration 002 completa, aplicar no banco de dados e regenerar os tipos TypeScript gerados para que o restante da implementação use as novas tabelas com type safety.

**O que fazer**
- [x] Usar `mcp__supabase__apply_migration` passando o conteúdo de `supabase/migrations/002_catalogo_produtos.sql`
- [x] Verificar que nenhum erro foi retornado
- [x] Usar `mcp__supabase__generate_typescript_types` para obter os tipos atualizados
- [x] Sobrescrever `src/types/supabase-generated.ts` com o resultado
- [x] Confirmar que as 5 novas tabelas + colunas adicionais em `itens_orcamento` estão presentes nos tipos gerados

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/types/supabase-generated.ts` | substituir pelo output do MCP |

**Critérios de aceitação**
- [x] `npx tsc --noEmit` não produz novos erros após a substituição dos types
- [x] Tipos `EspeciesMadeira`, `MadeirasM3`, `OutrosProdutos`, `ServicoAcabamento`, `ComprimentosMadeirasM3` existem nos types gerados

---

## Fase 2 — Types & Schemas

### [ISSUE-007] Criar `src/types/produto.ts` com interfaces e union discriminada

**Status**: `concluída`
**Fase**: 2
**Dependências**: ISSUE-006
**Estimativa**: pequena (< 1h)

**Contexto**
Centraliza as definições TypeScript para as entidades do catálogo. `CatalogoItem` é a union discriminada que o hook `useCatalogoProdutos` e o step de materiais consomem.

**O que fazer**
- [x] Criar `src/types/produto.ts` com as seguintes interfaces:
  - `EspecieMadeira { id, madeireira_id, nome, custo_m3, margem_lucro_pct, created_at, updated_at }`
  - `ComprimentoMadeiraM3 { id, madeira_m3_id, comprimento_m, disponivel, created_at }`
  - `MadeiraM3 { id, madeireira_id, especie_id, nome, espessura_cm, largura_cm, comprimento_m, disponivel, created_at, updated_at; especie?: EspecieMadeira; comprimentos?: ComprimentoMadeiraM3[] }`
  - `OutroProduto { id, madeireira_id, nome, unidade, preco_unitario, descricao, disponivel, created_at, updated_at }`
  - `ServicoAcabamento { id, madeireira_id, nome, percentual_acrescimo, ativo, created_at, updated_at }`
  - `CatalogoItemMadeiraM3 { origem: 'madeira_m3'; data: MadeiraM3 }`
  - `CatalogoItemOutroProduto { origem: 'outro_produto'; data: OutroProduto }`
  - `CatalogoItemLegado { origem: 'legado_planilha'; data: { id, nome, unidade, preco_unitario } }`
  - `CatalogoItem = CatalogoItemMadeiraM3 | CatalogoItemOutroProduto | CatalogoItemLegado`

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/types/produto.ts` | todas as interfaces do catálogo |

**Critérios de aceitação**
- [x] `npx tsc --noEmit` sem erros
- [x] Narrowing via `item.origem === 'madeira_m3'` dá acesso a `item.data.espessura_cm` com type safety

---

### [ISSUE-008] Estender `src/types/orcamento.ts` com campos de origem/comprimento/acabamento

**Status**: `concluída`
**Fase**: 2
**Dependências**: ISSUE-007
**Estimativa**: pequena (< 1h)

**Contexto**
O tipo `ItemOrcamento` (persistência) e `ItemOrcamentoCalculo` (store Zustand) precisam dos novos campos opcionais para suportar madeira m³ com comprimento real e acabamento.

**O que fazer**
- [x] Ler `src/types/orcamento.ts` integralmente
- [x] Adicionar ao tipo `ItemOrcamento` (ou equivalente de persistência) os campos opcionais: `origem?`, `madeira_m3_id?`, `outro_produto_id?`, `especie_nome?`, `espessura_cm?`, `largura_cm?`, `comprimento_real_m?`, `comprimento_id?`, `acabamento_id?`, `acabamento_nome?`, `acabamento_percentual?`
- [x] Não alterar campos existentes (`item_preco_id`, `preco_unitario`, `quantidade`, `subtotal`)

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/types/orcamento.ts` | adicionar campos opcionais |

**Critérios de aceitação**
- [x] `npx tsc --noEmit` sem erros
- [x] Código existente que não usa os novos campos continua compilando sem alterações

---

### [ISSUE-009] Criar 4 Zod schemas em `src/lib/schemas/`

**Status**: `concluída`
**Fase**: 2
**Dependências**: ISSUE-007
**Estimativa**: pequena (< 1h)

**Contexto**
Schemas de validação para os 4 formulários do catálogo. Cada schema exporta também o tipo inferido via `z.infer`.

**O que fazer**
- [x] Criar `src/lib/schemas/especie-schema.ts`: `{ nome: z.string().min(2), custo_m3: z.number().positive(), margem_lucro_pct: z.number().min(0) }` — exportar `EspecieInput = z.infer<typeof especieSchema>`
- [x] Criar `src/lib/schemas/madeira-m3-schema.ts`: `{ especie_id: z.string().uuid(), nome: z.string().min(2), espessura_cm: z.number().positive(), largura_cm: z.number().positive(), comprimento_m: z.number().positive().default(1), comprimentos: z.array(z.object({ comprimento_m: z.number().positive(), disponivel: z.boolean().default(true) })).optional() }` — exportar `MadeiraM3Input`
- [x] Criar `src/lib/schemas/outro-produto-schema.ts`: `{ nome, unidade, preco_unitario: z.number().min(0), descricao?: z.string().optional() }` — exportar `OutroProdutoInput`
- [x] Criar `src/lib/schemas/acabamento-schema.ts`: `{ nome, percentual_acrescimo: z.number().min(0) }` — exportar `AcabamentoInput`

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/lib/schemas/especie-schema.ts` | schema de espécie |
| CRIAR | `src/lib/schemas/madeira-m3-schema.ts` | schema de madeira m³ com comprimentos |
| CRIAR | `src/lib/schemas/outro-produto-schema.ts` | schema de outro produto |
| CRIAR | `src/lib/schemas/acabamento-schema.ts` | schema de acabamento |

**Critérios de aceitação**
- [x] `custo_m3: -5` é rejeitado pelo schema de espécie
- [x] `preco_unitario: 0` é aceito (válido para promoção)
- [x] `npx tsc --noEmit` sem erros

---

### [ISSUE-010] Criar `src/lib/calcular-madeira.ts` com 3 funções puras

**Status**: `concluída`
**Fase**: 2
**Dependências**: ISSUE-007
**Estimativa**: pequena (< 1h)

**Contexto**
Centraliza as fórmulas de precificação de madeira. Funções puras e testáveis, sem dependência de estado global.

**O que fazer**
- [x] Criar `src/lib/calcular-madeira.ts` com:
  ```ts
  export function calcularValorVendaM3(custo: number, margemPct: number): number {
    return custo * (1 + margemPct / 100)
  }

  export function calcularValorMadeiraM3(
    espCm: number, largCm: number, compM: number, valorVendaM3: number
  ): number {
    return (espCm / 100) * (largCm / 100) * compM * valorVendaM3
  }

  export function aplicarAcabamento(preco: number, percentual: number): number {
    return preco * (1 + percentual / 100)
  }
  ```
- [x] Verificar: Cambará (custo=3500, margem=20%) → `calcularValorVendaM3(3500, 20) === 4200`
- [x] Verificar: Viga 5×15×1m → `calcularValorMadeiraM3(5, 15, 1, 4200) === 31.50`
- [x] Verificar: Lixamento +10% → `aplicarAcabamento(31.50, 10) ≈ 34.65` (IEEE 754 float — exibir com round 2 casas)

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/lib/calcular-madeira.ts` | 3 funções de cálculo |

**Critérios de aceitação**
- [x] `calcularValorMadeiraM3(5, 15, 2.5, 4200) === 78.75`
- [x] `aplicarAcabamento(78.75, 10) * 2 === 173.25` (golden path SISMASTER)
- [x] `npx tsc --noEmit` sem erros

---

## Fase 3 — UI Primitives

### [ISSUE-011] Instalar 6 primitivos shadcn: tabs, dialog, select, table, form, dropdown-menu

**Status**: `concluída`
**Fase**: 3
**Dependências**: nenhuma
**Estimativa**: pequena (< 1h)

**Contexto**
O design system Timber Grain usa shadcn/ui. Os primitivos precisam ser instalados via CLI (não editados manualmente) para manter compatibilidade com Radix UI e as variáveis CSS do tema.

**O que fazer**
- [x] Rodar: `npx shadcn@latest add tabs dialog select table form dropdown-menu --yes`
- [x] Verificar que os 6 arquivos foram criados em `src/components/ui/`
- [x] Confirmar que nenhum arquivo existente em `src/components/ui/` foi sobrescrito (button, input, label permanecem)
- [x] Rodar `npx tsc --noEmit` e `npm run build` para garantir que não há regressão

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/components/ui/tabs.tsx` | via shadcn CLI |
| CRIAR | `src/components/ui/dialog.tsx` | via shadcn CLI |
| CRIAR | `src/components/ui/select.tsx` | via shadcn CLI |
| CRIAR | `src/components/ui/table.tsx` | via shadcn CLI |
| CRIAR | `src/components/ui/form.tsx` | via shadcn CLI |
| CRIAR | `src/components/ui/dropdown-menu.tsx` | via shadcn CLI |

**Critérios de aceitação**
- [x] `npm run build` passa sem erros após a instalação
- [x] `src/components/ui/button.tsx` permanece idêntico ao anterior

---

## Fase 4 — UI Madeireira

### [ISSUE-012] Criar hooks `useEspecies.ts`, `useOutrosProdutos.ts`, `useAcabamentos.ts`

**Status**: `concluída`
**Fase**: 4
**Dependências**: ISSUE-006
**Estimativa**: média (1–3h)

**Contexto**
3 hooks de CRUD básico com o mesmo padrão — cada um resolve `madeireira_id` via `auth.uid()` + `madeireiras` table, e expõe `{ items, isLoading, create, update, remove }`. Seguir o padrão de `useItensPreco.ts:18` para resolução do `madeireira_id`.

**O que fazer**
- [x] Ler `src/hooks/useItensPreco.ts` para entender o padrão de resolução de `madeireira_id`
- [x] Criar `src/hooks/useEspecies.ts`: resolve `madeireira_id`, busca `especies_madeira` filtrado, expõe `{ especies, isLoading, create(input: EspecieInput), update(id, input), remove(id) }`
- [x] Criar `src/hooks/useOutrosProdutos.ts`: idem para `outros_produtos`
- [x] Criar `src/hooks/useAcabamentos.ts`: idem para `servicos_acabamento`
- [x] Todos usam `@supabase/supabase-js` e TypeScript strict com os tipos de `supabase-generated.ts`

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/hooks/useEspecies.ts` | CRUD de especies_madeira |
| CRIAR | `src/hooks/useOutrosProdutos.ts` | CRUD de outros_produtos |
| CRIAR | `src/hooks/useAcabamentos.ts` | CRUD de servicos_acabamento |

**Critérios de aceitação**
- [x] `npx tsc --noEmit` sem erros
- [x] Criar espécie e recarregar lista retorna o novo item

---

### [ISSUE-013] Criar hook `useMadeirasM3.ts` com transação create/update incluindo comprimentos

**Status**: `concluída`
**Fase**: 4
**Dependências**: ISSUE-006
**Estimativa**: média (1–3h)

**Contexto**
Mais complexo que os outros hooks: criar/atualizar uma madeira m³ deve ser transacional com seus comprimentos (upsert/delete em `comprimentos_madeira_m3`). Supabase não tem transações nativas no JS client — usar `rpc` ou operações sequenciais com rollback manual em caso de erro.

**O que fazer**
- [x] Criar `src/hooks/useMadeirasM3.ts` resolvendo `madeireira_id` via auth
- [x] Expor `{ madeiras, isLoading, create(input: MadeiraM3Input), update(id, input), remove(id) }`
- [x] Na função `create`: inserir em `madeiras_m3` → obter `id` → inserir em `comprimentos_madeira_m3` para cada item do array `input.comprimentos` (se houver)
- [x] Na função `update`: atualizar `madeiras_m3` → fazer upsert dos comprimentos (identificados por `comprimento_m`), deletar comprimentos que foram removidos do array
- [x] Incluir `especie?: EspecieMadeira` no join da query de listagem

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/hooks/useMadeirasM3.ts` | CRUD com transação para comprimentos |

**Critérios de aceitação**
- [x] Criar madeira com 3 comprimentos insere 3 rows em `comprimentos_madeira_m3`
- [x] Atualizar removendo 1 comprimento deleta o row correspondente
- [x] `npx tsc --noEmit` sem erros

---

### [ISSUE-014] Criar componentes base: `tabs-produtos.tsx` e `empty-state.tsx`

**Status**: `concluída`
**Fase**: 4
**Dependências**: ISSUE-011
**Estimativa**: pequena (< 1h)

**Contexto**
Componentes reutilizados por todos os painéis do catálogo. `empty-state.tsx` exibe o estado vazio editorial no design Timber Grain (sem bordas 1px, bg-surface-container-highest).

**O que fazer**
- [x] Criar `src/components/madeireira/catalogo/tabs-produtos.tsx`: wrapper do shadcn `<Tabs>` com 5 `<TabsTrigger>` (Espécies, Madeiras m³, Outros Produtos, Acabamentos, Importar Planilha) e 5 `<TabsContent>`; aceita `children` mapeados por aba
- [x] Criar `src/components/madeireira/catalogo/empty-state.tsx`: aceita props `icon`, `title`, `description`, `action?`; usa `bg-surface-container-highest` (Timber Grain), sem borda 1px

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/components/madeireira/catalogo/tabs-produtos.tsx` | wrapper de tabs |
| CRIAR | `src/components/madeireira/catalogo/empty-state.tsx` | estado vazio reutilizável |

**Critérios de aceitação**
- [x] `npx tsc --noEmit` sem erros
- [x] Nenhum elemento visual usa `border` de 1px sólida (Timber Grain)

---

### [ISSUE-015] Criar `especies-panel.tsx` + `especie-form.tsx` com preview de `valor_m3_venda`

**Status**: `concluída`
**Fase**: 4
**Dependências**: ISSUE-012, ISSUE-014
**Estimativa**: média (1–3h)

**Contexto**
Primeiro painel funcional do catálogo. O form de espécie tem 3 campos + preview ao vivo do preço de venda derivado, que é a novidade central do design v2 SISMASTER.

**O que fazer**
- [x] Criar `src/components/madeireira/catalogo/especie-form.tsx`:
  - `useForm` com `zodResolver(especieSchema)`
  - Campos: `nome` (editorial-input), `custo_m3` (input numérico, label "Custo/m³ (R$)"), `margem_lucro_pct` (input numérico, label "Margem de Lucro (%)")
  - `watch(['custo_m3', 'margem_lucro_pct'])` → mostrar preview "Preço de venda/m³: R$ X.XXX,XX" usando `calcularValorVendaM3`
  - Submit chama `useEspecies().create` ou `update`
- [x] Criar `src/components/madeireira/catalogo/especies-panel.tsx`:
  - Lista espécies com shadcn `<Table>` (colunas: Nome, Custo/m³, Margem %, Venda/m³ calculado, Ações)
  - Botão "Nova Espécie" abre `<Dialog>` com `especie-form.tsx`
  - Ações: Editar (abre Dialog preenchido) e Excluir (confirm dialog)
  - Estado vazio: usa `empty-state.tsx`

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/components/madeireira/catalogo/especie-form.tsx` | form com preview de valor de venda |
| CRIAR | `src/components/madeireira/catalogo/especies-panel.tsx` | tabela + CRUD completo |

**Critérios de aceitação**
- [x] Digitar custo=3500 e margem=20 atualiza o preview para "R$ 4.200,00" sem submit
- [x] Criar espécie aparece na listagem imediatamente (revalida query)
- [x] `npx tsc --noEmit` sem erros

---

### [ISSUE-016] Criar `madeiras-m3-panel.tsx` + `madeira-m3-form.tsx` com seção de comprimentos

**Status**: `concluída`
**Fase**: 4
**Dependências**: ISSUE-013, ISSUE-015
**Estimativa**: grande (> 3h)

**Contexto**
Painel mais complexo do catálogo. O form replica o painel "Vários Comprimentos" do SISMASTER: uma sub-lista editável de comprimentos com tabela de preview de preços calculados.

**O que fazer**
- [x] Criar `src/components/madeireira/catalogo/madeira-m3-form.tsx`:
  - `useForm` com `zodResolver(madeiraM3Schema)`, `useFieldArray` para `comprimentos`
  - Campo `especie_id`: Select shadcn populado por `useEspecies()` (label "Espécie")
  - Campos: `nome`, `espessura_cm`, `largura_cm`, `comprimento_m` (referência, default 1)
  - `watch(['especie_id','espessura_cm','largura_cm'])` → mostrar preview "Valor tabelado (1m): R$ XX,XX"
  - Seção "Comprimentos disponíveis": input numérico + botão "Adicionar", chips de sugestão clicáveis (1, 1.5, 2, 2.5, 3), lista com toggle `disponivel` e botão remover
  - Tabela lateral: para cada comprimento no array, linha "X,XX m — R$ YY,YY" calculado via `calcularValorMadeiraM3`
  - Se não houver espécies cadastradas, renderizar mensagem "Cadastre ao menos uma espécie primeiro" e desabilitar o form
- [x] Criar `src/components/madeireira/catalogo/madeiras-m3-panel.tsx`:
  - Tabela com colunas: Espécie, Nome, Espessura, Largura, Comprimentos cadastrados (count), Ações

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/components/madeireira/catalogo/madeira-m3-form.tsx` | form com comprimentos e preview |
| CRIAR | `src/components/madeireira/catalogo/madeiras-m3-panel.tsx` | tabela de listagem |

**Critérios de aceitação**
- [x] Adicionar comprimento 2,50 m para Cambará 5×15 mostra "R$ 78,75" na tabela lateral
- [x] Clicar no chip "2" adiciona `{ comprimento_m: 2, disponivel: true }` ao array
- [x] Submit com 3 comprimentos cria 3 rows em `comprimentos_madeira_m3`
- [x] `npx tsc --noEmit` sem erros

---

### [ISSUE-017] Criar `outros-produtos-panel.tsx` + `outro-produto-form.tsx`

**Status**: `concluída`
**Fase**: 4
**Dependências**: ISSUE-012, ISSUE-014
**Estimativa**: média (1–3h)

**Contexto**
Painel mais simples do catálogo — produto com preço fixo. Segue o mesmo padrão de estrutura dos outros painéis.

**O que fazer**
- [x] Criar `src/components/madeireira/catalogo/outro-produto-form.tsx`:
  - `useForm` + `zodResolver(outroProdutoSchema)`
  - Campos: `nome`, `unidade` (texto livre ou select com opções: kg, un, m, m², m³, pç, cx), `preco_unitario`, `descricao` (opcional)
  - Submit chama `useOutrosProdutos().create` ou `update`
- [x] Criar `src/components/madeireira/catalogo/outros-produtos-panel.tsx`:
  - Tabela: Nome, Unidade, Preço Unitário, Ações
  - Estado vazio via `empty-state.tsx`

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/components/madeireira/catalogo/outro-produto-form.tsx` | form de produto simples |
| CRIAR | `src/components/madeireira/catalogo/outros-produtos-panel.tsx` | listagem |

**Critérios de aceitação**
- [x] Criar "Prego 17×21" R$ 19,90/kg aparece na listagem
- [x] `npx tsc --noEmit` sem erros

---

### [ISSUE-018] Criar `acabamentos-panel.tsx` + `acabamento-form.tsx`

**Status**: `concluída`
**Fase**: 4
**Dependências**: ISSUE-012, ISSUE-014
**Estimativa**: pequena (< 1h)

**Contexto**
Acabamentos são modificadores percentuais aplicados às madeiras m³ no orçamento. Equivalem à "Apresentação da Madeira" do SISMASTER (APARELHADO, LIXADO, VERNIZ, etc.).

**O que fazer**
- [x] Criar `src/components/madeireira/catalogo/acabamento-form.tsx`:
  - Campos: `nome` (ex: "Lixamento", "Aparelhado"), `percentual_acrescimo` (label: "Acréscimo (%)")
  - Submit chama `useAcabamentos().create` ou `update`
- [x] Criar `src/components/madeireira/catalogo/acabamentos-panel.tsx`:
  - Tabela: Nome, Acréscimo (%), Ativo, Ações
  - Toggle ativo/inativo via `update`

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/components/madeireira/catalogo/acabamento-form.tsx` | form de acabamento |
| CRIAR | `src/components/madeireira/catalogo/acabamentos-panel.tsx` | listagem |

**Critérios de aceitação**
- [x] Criar "Lixamento" +10% aparece na listagem com badge "Ativo"
- [x] `npx tsc --noEmit` sem erros

---

### [ISSUE-019] Refatorar `precos-page.tsx` para tabbed layout com 5 abas

**Status**: `concluída`
**Fase**: 4
**Dependências**: ISSUE-015, ISSUE-016, ISSUE-017, ISSUE-018
**Estimativa**: média (1–3h)

**Contexto**
A página atual é "upload-only" (wizard de 3 steps). Ela precisa ser envolvida por tabs, mantendo 100% do fluxo de upload intacto na aba "Importar Planilha". O wizard deve continuar abrindo quando `step !== 'idle'` ou a rota é `/madeireira/precos/novo`.

**O que fazer**
- [x] Ler `src/pages/madeireira/precos-page.tsx` na íntegra antes de editar
- [x] Envolver o conteúdo em `<Tabs defaultValue="especies">` com `<TabsTrigger>` para: Espécies, Madeiras m³, Outros Produtos, Acabamentos, Importar Planilha
- [x] `<TabsContent value="especies">`: renderizar `<EspeciesPanel />`
- [x] `<TabsContent value="madeiras-m3">`: renderizar `<MadeirasMcPanel />`  
- [x] `<TabsContent value="outros-produtos">`: renderizar `<OutrosProdutosPanel />`
- [x] `<TabsContent value="acabamentos">`: renderizar `<AcabamentosPanel />`
- [x] `<TabsContent value="importar">`: o wizard existente (código da função `handleConfirm` e `batchInsert` em `:138-204` permanece intocado)
- [x] Preservar a lógica de rota `/madeireira/precos/novo` que abre o wizard
- [x] Renomear item do menu em `src/constants/nav-items.ts` de "Preços" para "Produtos & Preços"

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/madeireira/precos-page.tsx` | adicionar tabs, preservar wizard |
| EDITAR | `src/constants/nav-items.ts` | renomear "Preços" para "Produtos & Preços" |

**Critérios de aceitação**
- [x] Upload de planilha existente ainda funciona sem erros (regressão zero)
- [x] Navegar para `/madeireira/precos/novo` ainda abre o wizard de upload
- [x] As 4 abas novas renderizam os painéis de CRUD
- [x] `npx tsc --noEmit` sem erros

---

## Fase 5 — UI Carpinteiro

### [ISSUE-020] Criar `useCatalogoProdutos.ts` com queries paralelas + CatalogoItem[] unificado

**Status**: `concluída`
**Fase**: 5
**Dependências**: ISSUE-006, ISSUE-013
**Estimativa**: média (1–3h)

**Contexto**
Hook central do carpinteiro. Resolve a madeireira vinculada, busca as 3 fontes em paralelo (madeiras m³ com espécies e comprimentos, outros produtos, itens_preco legados), e unifica em `CatalogoItem[]` com debounce para a busca.

**O que fazer**
- [x] Ler `src/hooks/useItensPreco.ts` para reutilizar o padrão de resolução de `madeireira_id` via vinculação aprovada
- [x] Criar `src/hooks/useCatalogoProdutos.ts`:
  - Parâmetro `query: string` com debounce 300ms
  - Resolve `madeireira_id` da madeireira vinculada ao carpinteiro logado
  - 3 queries em paralelo via `Promise.all`:
    1. `madeiras_m3` JOIN `especies_madeira` + sub-query `comprimentos_madeira_m3 WHERE disponivel=true`
    2. `outros_produtos WHERE disponivel=true`
    3. `useItensPreco` legado (reutilizar o hook existente ou chamar diretamente)
  - Mapear para `CatalogoItem[]` com discriminante `origem`
  - Filtrar client-side por `query` (match em `nome`)
  - Retornar `{ items: CatalogoItem[], isLoading }`

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/hooks/useCatalogoProdutos.ts` | hook unificado do catálogo |

**Critérios de aceitação**
- [x] Itens de `madeira_m3` têm `comprimentos[]` populados com comprimentos `disponivel=true`
- [x] Itens de `legado_planilha` vêm de `itens_preco` (hook antigo intacto)
- [x] `npx tsc --noEmit` sem erros

---

### [ISSUE-021] Editar `step-materiais.tsx` — Select de comprimento + dialog de configuração

**Status**: `concluída`
**Fase**: 5
**Dependências**: ISSUE-020, ISSUE-010
**Estimativa**: grande (> 3h)

**Contexto**
Ponto central da experiência do carpinteiro. Ao clicar em uma madeira m³, o carpinteiro escolhe o comprimento via Select (opções pré-cadastradas, não input livre) + Acabamento opcional. Se não houver comprimentos cadastrados, o botão "Adicionar" é desabilitado.

**O que fazer**
- [x] Ler `src/components/orcamento/step-materiais.tsx` na íntegra
- [x] Trocar import de `useItensPreco` por `useCatalogoProdutos`
- [x] Para itens `origem === 'madeira_m3'`: abrir Dialog com:
  - `<Select>` "Comprimento" populado com `item.data.comprimentos` — cada option: "1,50 m — R$ 47,25" (calculado via `calcularValorMadeiraM3` + `calcularValorVendaM3`)
  - `<Select>` "Acabamento" opcional: opções de `useAcabamentos()` ativos, cada option: "Lixamento (+10%)"
  - Input "Quantidade"
  - Preview de subtotal atualizado a cada mudança
  - Se `comprimentos.length === 0`: renderizar `empty-state` com mensagem e desabilitar botão "Adicionar"
  - Ao confirmar: chamar `addItem` no store com snapshot completo
- [x] Para `outro_produto` e `legado_planilha`: manter fluxo atual (apenas quantidade)

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/components/orcamento/step-materiais.tsx` | trocar hook + adicionar dialog configuração |

**Critérios de aceitação**
- [x] Selecionar comprimento 2,50m + Lixamento +10% mostra subtotal "R$ 86,63" (unitário para qty 1)
- [x] Produto "Prego 17×21" (legado ou outro_produto) não abre dialog — direto para quantidade
- [x] `npx tsc --noEmit` sem erros

---

### [ISSUE-022] Editar `item-material.tsx` — badges de origem e acabamento

**Status**: `concluída`
**Fase**: 5
**Dependências**: ISSUE-008
**Estimativa**: pequena (< 1h)

**Contexto**
Pequeno ajuste de UI: cada item no resumo de materiais exibe informações contextuais no estilo Timber Grain (chips tonais, sem bordas 1px).

**O que fazer**
- [x] Ler `src/components/orcamento/item-material.tsx`
- [x] Adicionar linha secundária abaixo do nome quando `origem === 'madeira_m3'`: chip tonal com "Madeira m³ · [especie_nome] [espessura]×[largura]×[comprimento_real]m"
- [x] Se `acabamento_nome` presente: adicionar chip "Acabamento: [nome] (+[percentual]%)"
- [x] Nenhuma borda 1px — usar `bg-surface-container-high/50` nos chips

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/components/orcamento/item-material.tsx` | adicionar linha secundária de contexto |

**Critérios de aceitação**
- [x] Item de madeira m³ exibe "Madeira m³ · Cambará 5×15×2,50m"
- [x] Item de outro_produto ou legado não exibe linha secundária
- [x] `npx tsc --noEmit` sem erros

---

### [ISSUE-023] Estender `useOrcamentoStore.ts` com `comprimento_id`, `origem` e `acabamento_*`

**Status**: `concluída`
**Fase**: 5
**Dependências**: ISSUE-008, ISSUE-010
**Estimativa**: média (1–3h)

**Contexto**
O store Zustand precisa dos novos campos para armazenar o estado completo do item durante o preenchimento do orçamento antes de persistir.

**O que fazer**
- [x] Ler `src/stores/useOrcamentoStore.ts` na íntegra
- [x] Atualizar o tipo `ItemOrcamentoCalculo` (ou equivalente) adicionando os campos opcionais:
  ```ts
  origem: 'legado_planilha' | 'madeira_m3' | 'outro_produto'
  especie_nome?: string
  espessura_cm?: number
  largura_cm?: number
  comprimento_id?: string
  comprimento_real_m?: number
  acabamento_id?: string
  acabamento_nome?: string
  acabamento_percentual?: number
  ```
- [x] A função `recalcular()` continua somando `preco_unitario * quantidade` — `preco_unitario` já vem com acabamento incorporado
- [x] Garantir que campos de itens legados (sem origem) funcionem como antes (default `'legado_planilha'`)

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/stores/useOrcamentoStore.ts` | estender ItemOrcamentoCalculo |

**Critérios de aceitação**
- [x] Adicionar madeira m³ ao store e chamar `recalcular()` produz subtotal correto
- [x] `npx tsc --noEmit` sem erros
- [x] Orçamentos legados existentes no store continuam funcionando

---

## Fase 6 — Persistência

### [ISSUE-024] Mapear persistência em `novo-orcamento-page.tsx` para colunas de origem

**Status**: `concluída`
**Fase**: 6
**Dependências**: ISSUE-023
**Estimativa**: média (1–3h)

**Contexto**
Ao finalizar ou salvar rascunho, cada item do store precisa ser mapeado para as colunas corretas de `itens_orcamento` de acordo com sua `origem`. Validação local do CHECK constraint antes do insert evita round-trips.

**O que fazer**
- [x] Ler `src/pages/carpinteiro/novo-orcamento-page.tsx` (ou equivalente) para localizar o `handleConfirm`/`handleSave`
- [x] Mapear cada `ItemOrcamentoCalculo` do store para o insert:
  - `origem === 'legado_planilha'`: `{ item_preco_id, preco_unitario, quantidade, subtotal, origem: 'legado_planilha' }`
  - `origem === 'madeira_m3'`: `{ item_preco_id: null, madeira_m3_id, preco_unitario, quantidade, subtotal, origem: 'madeira_m3', especie_nome, espessura_cm, largura_cm, comprimento_real_m, comprimento_id, acabamento_id, acabamento_nome, acabamento_percentual }`
  - `origem === 'outro_produto'`: `{ item_preco_id: null, outro_produto_id, preco_unitario, quantidade, subtotal, origem: 'outro_produto' }`
- [x] Antes do insert, validar client-side: se `origem === 'madeira_m3'` e `madeira_m3_id` é null, lançar erro (evita violação do CHECK no banco)

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/carpinteiro/novo-orcamento-page.tsx` | mapear items para insert com colunas de origem |

**Critérios de aceitação**
- [x] Salvar orçamento com madeira m³ salva `comprimento_real_m` e `especie_nome` corretamente no banco
- [x] Abrir orçamento finalizado antigo (pré-migration) carrega itens sem erros (campos novos são null)
- [x] `npx tsc --noEmit` sem erros

---

## Fase 7 — PDF

### [ISSUE-025] Editar `pdf-document.tsx` — linha auxiliar por item com espécie + dimensões + acabamento

**Status**: `concluída`
**Fase**: 7
**Dependências**: ISSUE-022
**Estimativa**: pequena (< 1h)

**Contexto**
O PDF precisa mostrar contexto adicional para itens de madeira m³. A linha auxiliar segue o padrão Timber Grain (uppercase, tracking-widest, text-secondary, font-size 10px).

**O que fazer**
- [x] Ler `src/components/orcamento/pdf-document.tsx` para localizar o loop de renderização de itens
- [x] Quando `item.origem === 'madeira_m3'`: adicionar linha secundária abaixo do nome com "ESPÉCIE · DIMENSÕES · COMPRIMENTO" (ex: "CAMBARÁ · 5×15cm · 2,50m")
- [x] Se `acabamento_nome` presente: adicionar "ACABAMENTO: LIXAMENTO (+10%)" na mesma linha ou em seguida
- [x] Manter layout editorial existente; a linha auxiliar usa `fontSize: 8, color: secondary, textTransform: 'uppercase', letterSpacing: 2`
- [x] Itens sem `especie_nome` (legado ou outro produto) não exibem linha auxiliar

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/components/orcamento/pdf-document.tsx` | linha auxiliar por item de madeira m³ |

**Critérios de aceitação**
- [x] PDF gerado contém "CAMBARÁ · 5×15cm · 2,50m" para o item de madeira m³
- [x] PDF de orçamento legado (sem especie_nome) é idêntico ao anterior
- [x] `npx tsc --noEmit` sem erros

---

## Fase 8 — QA

### [ISSUE-026] Verificação final — typecheck + build + golden path SISMASTER

**Status**: `concluída`
**Fase**: 8
**Dependências**: ISSUE-024, ISSUE-025
**Estimativa**: média (1–3h)

**Contexto**
Validação end-to-end do sistema completo. O golden path é o cenário do SISMASTER: Cambará custo R$ 3.500 + 20% margem → Viga 5×15 com 5 comprimentos → orçamento com 2,50m + Lixamento +10% × 2 = R$ 173,25.

**Correção aplicada nesta ISSUE**
- `src/lib/schemas/madeira-m3-schema.ts`: removido `.default(1)` de `comprimento_m` e `.default(true)` de `disponivel` — os `.default()` do Zod geram tipos input opcionais incompatíveis com o `zodResolver` do React Hook Form. Os defaults foram mantidos nos `defaultValues` do form (já existiam lá).

**O que fazer**
- [x] Rodar `npx tsc --noEmit` — zero erros
- [x] Rodar `npm run build` — build passa sem erros
- [ ] Executar golden path manual no browser:
  1. Madeireira: criar espécie "Cambará" custo=3500 margem=20 → conferir preview "R$ 4.200,00/m³"
  2. Criar "Viga 5×15 Cambará" esp=5 larg=15 + comprimentos 1, 1.5, 2, 2.5, 3m → tabela lateral mostra R$ 31,50 / 47,25 / 63,00 / 78,75 / 94,50
  3. Criar "Prego 17×21" R$ 19,90/kg
  4. Criar acabamento "Lixamento" +10%
  5. Upload planilha existente → deve funcionar (regressão)
  6. Carpinteiro: criar orçamento → buscar "Viga" → Select comprimento 2,50m + Acabamento Lixamento + qty 2 → subtotal R$ 173,25
  7. Finalizar → verificar `itens_orcamento` no banco com todos os campos
  8. Gerar PDF → conferir linha auxiliar
  9. Abrir orçamento antigo (pré-migration) → deve carregar sem erros
- [ ] RLS: tentar ler `especies_madeira` como carpinteiro sem vinculação → deve retornar 0 rows

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/lib/schemas/madeira-m3-schema.ts` | removidos `.default()` incompatíveis com zodResolver |

**Critérios de aceitação**
- [x] `npx tsc --noEmit` zero erros
- [x] `npm run build` passa
- [ ] Subtotal golden path = R$ 173,25 (0.05×0.15×2.50×4200×1.10×2)
- [ ] Upload de planilha legado continua funcionando
- [ ] Orçamento antigo pré-migration abre sem erros

---

## Fase 9 — PRD

### [ISSUE-027] Regenerar `PRD.md` com seções F4/F5 atualizadas + modelo de dados

**Status**: `concluída`
**Fase**: 9
**Dependências**: ISSUE-026
**Estimativa**: média (1–3h)

**Contexto**
O PRD.md precisa refletir o novo modelo relacional (custo+margem, comprimentos por produto) para servir como documentação oficial do produto após a implementação.

**O que fazer**
- [x] Ler `PRD.md` integralmente
- [x] Reescrever seção F4 (Madeireira): 4 categorias de cadastro como fluxo principal; upload rebaixado para "Importação bulk"; espécie com custo+margem; comprimentos por produto com exemplo Cambará R$ 3.500 + 20% → Viga 5×15×1m = R$ 31,50
- [x] Reescrever seção F5 (Carpinteiro): Select de comprimento pré-cadastrado; acabamentos; visualização de snapshot no orçamento finalizado
- [x] Adicionar seção "Modelo de Dados — Catálogo Relacional" com diagrama ER textual (5 tabelas novas + ALTER em itens_orcamento)
- [x] Atualizar métricas de sucesso: "Madeireira cadastra primeiro produto em < 2 minutos", "Golden path R$ 173,25 validado"
- [x] Manter seções não relacionadas intocadas (login, vinculação, configurações do carpinteiro)

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `PRD.md` | atualizar F4, F5, adicionar modelo de dados |

**Critérios de aceitação**
- [x] Seção de Madeireira menciona `custo_m3` + `margem_lucro_pct` com fórmula de venda
- [x] Diagrama ER textual inclui as 5 tabelas novas e o ALTER em `itens_orcamento`
- [x] Seções de login/vinculação/PDF permanecem idênticas ao PRD original
