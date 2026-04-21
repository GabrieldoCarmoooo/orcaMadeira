 Plano — Catálogo Relacional de Produtos (Madeireira) + Adaptação do Orçamento (Carpinteiro)

 Context

 Hoje a Madeireira só consegue disponibilizar produtos via upload de planilha (CSV/XLSX), que popula tabelas_preco + itens_preco. O PlanoImplementaçãoCadastroProdutos.MD     
 define a transição para um catálogo relacional cadastrado dentro do app, com 4 entidades distintas:

 1. Espécies de Madeira — base de cálculo (nome + valor/m³).
 2. Madeiras m³ — produto dimensionado (espessura × largura × comprimento × valor_m³ da espécie).
 3. Outros Produtos — item simples com preço fixo + unidade.
 4. Serviços de Acabamento — modificadores percentuais aplicados a madeira durante o orçamento.

 O Carpinteiro precisa consumir tudo transparentemente: buscar produtos do catálogo, informar comprimento real para madeiras m³ (o valor cadastrado é para 1m) e
 opcionalmente aplicar um acabamento que multiplica o preço do item.

 Regra de ouro: o fluxo de upload de planilha não pode quebrar. Orçamentos antigos (que referenciam itens_preco) continuam válidos. Frente e RLS devem suportar ambas as      
 origens de catálogo (novo relacional + legado planilha) durante a transição e no longo prazo.

 Tech stack confirmada: React 19 + TS + Vite 8 + Tailwind 4 + shadcn (radix-nova) + Supabase. Já instalados: react-hook-form@7.72, zod@4.3, @hookform/resolvers@5.2,
 zustand@5.0, @supabase/supabase-js@2.101, @react-pdf/renderer@4.4, papaparse, xlsx. Faltam primitives shadcn: Tabs, Dialog/Sheet, Select, Table, Form, DropdownMenu (hoje só 
  existem button, input, label, editorial-*, metric-card, tonal-card, status-chip, grain-progress).

 Atualização v2 — Alinhamento SISMASTER (print `WhatsApp Image 2026-04-13 at 14.21.38.jpeg`)

 Dois ajustes refinam o modelo original após revisão do sistema de referência:

 1. Espécie separa **custo do m³** e **margem de lucro** (%). O preço de venda por m³ é sempre
    derivado: `valor_m3_venda = custo_m3 * (1 + margem_lucro_pct / 100)`. Isso substitui o campo
    único `valor_m3` do rascunho inicial e permite à madeireira ajustar margem sem reeditar todos
    os produtos.
 2. Cada Madeira m³ passa a ter uma lista de **Comprimentos disponíveis** (1:N) cadastrados junto
    do produto (igual ao painel "Vários Comprimentos — F11" do SISMASTER). No orçamento, o
    carpinteiro seleciona um desses comprimentos pré-cadastrados via Select (em vez de digitar
    comprimento livre). Estoque por comprimento NÃO é rastreado nesta fase (decisão explícita).
 3. A lista "Apresentação da Madeira" do SISMASTER (APARELHADO, LIXADO, VERNIZ, …) é modelada
    como a entidade **Acabamentos** já prevista — sem tabela nova, apenas registros-exemplo.

 ---
 Arquivos críticos a modificar / criar

 Banco de dados

 - CRIAR supabase/migrations/002_catalogo_produtos.sql — novas tabelas + RLS + extensão de itens_orcamento.
 - REGENERAR src/types/supabase-generated.ts (via CLI ou MCP).

 Types

 - CRIAR src/types/produto.ts — EspecieMadeira, MadeiraM3, OutroProduto, ServicoAcabamento, CatalogoItem (união discriminada), ItemOrcamentoExtended.
 - EDITAR src/types/orcamento.ts — estender ItemOrcamento com snapshots de acabamento/origem.

 Schemas de validação (Zod)

 - CRIAR src/lib/schemas/especie-schema.ts, madeira-m3-schema.ts, outro-produto-schema.ts, acabamento-schema.ts.
 - EDITAR src/lib/calcular-orcamento.ts — adicionar helper puro calcularValorMadeiraM3(espessura, largura, comprimento, valorM3) e aplicarAcabamento(preco, percentual).      
 - CRIAR src/lib/calcular-madeira.ts — fórmula centralizada.

 Hooks (data access)

 - CRIAR src/hooks/useEspecies.ts, useMadeirasM3.ts, useOutrosProdutos.ts, useAcabamentos.ts — CRUD por Madeireira (owner).
 - CRIAR src/hooks/useCatalogoProdutos.ts — lê unificadamente Madeiras m³ + Outros Produtos + itens_preco legados para o Carpinteiro (debounced, segue o padrão de
 useItensPreco.ts:18).
 - MANTER src/hooks/useItensPreco.ts intacto (ele continua sendo o loader do legado; será consumido por dentro de useCatalogoProdutos).

 Páginas Madeireira

 - REFATORAR src/pages/madeireira/precos-page.tsx — passar de "upload-only" para tabbed layout de 5 abas: Espécies | Madeiras m³ | Outros Produtos | Acabamentos | Importar   
 Planilha (legado). A rota /madeireira/precos/novo continua abrindo o wizard de upload dentro da aba "Importar Planilha" — zero regressão no batchInsert existente em
 precos-page.tsx:85-104.
 - Considerar renomear no menu lateral (app-sidebar.tsx) de "Preços" para "Produtos & Preços".

 Componentes Madeireira (novos)

 - src/components/madeireira/catalogo/tabs-produtos.tsx — wrapper do shadcn Tabs.
 - src/components/madeireira/catalogo/especies-panel.tsx — lista + botão "Nova Espécie" + modal form.
 - src/components/madeireira/catalogo/especie-form.tsx — RHF + Zod (nome, custo_m3, margem_lucro_pct) com preview live `valor_m3_venda = custo * (1 + margem/100)`.
 - src/components/madeireira/catalogo/madeiras-m3-panel.tsx — lista com colunas (espécie, nome, dimensões, valor calculado).
 - src/components/madeireira/catalogo/madeira-m3-form.tsx — RHF com preview ao vivo do valor unitário (reage a mudanças de espécie/dimensões via watch) + seção "Comprimentos disponíveis" com `useFieldArray` (add/remove/toggle disponível, chips de sugestão 1/1.5/2/2.5/3 m, tabela lateral mostrando valor calculado por comprimento — espelha SISMASTER "Vários Comprimentos").
 - src/components/madeireira/catalogo/outros-produtos-panel.tsx + outro-produto-form.tsx.
 - src/components/madeireira/catalogo/acabamentos-panel.tsx + acabamento-form.tsx.
 - src/components/madeireira/catalogo/empty-state.tsx — estado vazio editorial reutilizável.

 Componentes Carpinteiro (editar)

 - EDITAR src/components/orcamento/step-materiais.tsx — trocar useItensPreco por useCatalogoProdutos; quando o item for madeira_m3, exibir campo adicional "Comprimento (m)"; 
  para madeira, exibir Select opcional de Acabamento que recalcula o subtotal.
 - EDITAR src/components/orcamento/item-material.tsx — renderizar badge de origem + acabamento aplicado quando houver.
 - EDITAR src/components/orcamento/pdf-document.tsx — exibir espécie, dimensões reais e acabamento no PDF gerado.

 Store

 - EDITAR src/stores/useOrcamentoStore.ts — estender ItemOrcamentoCalculo com origem, comprimento_real?, acabamento_id?, acabamento_percentual?. Recalcular subtotal
 considerando o acabamento.

 UI primitives (shadcn add)

 Instalar via shadcn skill: tabs, dialog, select, table, form, dropdown-menu. NÃO editar manualmente; deixar o CLI gerar em src/components/ui/.

 Documentos

 - REGENERAR PRD.md (raiz) incluindo o novo modelo relacional nas seções F4/Madeireira/Carpinteiro — ver "Fase 9".

 ---
 Estratégia de dados (essencial — leia antes de codar)

 1. Tabelas novas (migration 002)

 Cada uma é owned by madeireira_id (não é mais snapshot como tabelas_preco; é catálogo persistente):

 -- especies_madeira
 id uuid pk, madeireira_id uuid fk, nome text not null,
 custo_m3 numeric(10,2) not null check (custo_m3 > 0),
 margem_lucro_pct numeric(5,2) not null default 0 check (margem_lucro_pct >= 0),
 -- valor_m3_venda = custo_m3 * (1 + margem_lucro_pct/100) é CALCULADO (não armazenado)
 created_at, updated_at
 unique (madeireira_id, lower(nome))

 -- madeiras_m3
 id uuid pk, madeireira_id uuid fk, especie_id uuid fk especies_madeira,
 nome text not null, espessura_cm numeric(6,2) not null check > 0,
 largura_cm numeric(6,2) not null check > 0,
 comprimento_m numeric(6,2) not null default 1 check > 0,
 disponivel boolean default true, created_at, updated_at
 -- valor_unitario é CALCULADO (não armazenado) — sempre derivado da espécie ativa

 -- comprimentos_madeira_m3  (fiel ao SISMASTER "Vários Comprimentos — F11")
 id uuid pk, madeira_m3_id uuid fk madeiras_m3 ON DELETE CASCADE,
 comprimento_m numeric(6,2) not null check > 0,
 disponivel boolean default true, created_at
 unique (madeira_m3_id, comprimento_m)
 -- estoque NÃO rastreado nesta fase (decisão explícita)

 -- outros_produtos
 id uuid pk, madeireira_id uuid fk, nome text not null,
 unidade text not null, preco_unitario numeric(10,2) not null check >= 0,
 descricao text, disponivel boolean default true, created_at, updated_at

 -- servicos_acabamento
 id uuid pk, madeireira_id uuid fk, nome text not null,
 percentual_acrescimo numeric(5,2) not null check (percentual_acrescimo >= 0),
 ativo boolean default true, created_at, updated_at

 Por que valor de venda não é armazenado: o valor ofertado = custo_m3 * (1 + margem_lucro_pct/100) é sempre derivado da espécie. Se a madeireira ajustar custo ou margem,
 todas as madeiras dependentes refletem automaticamente — preço unitário da madeira =
 (esp/100)*(larg/100)*comp*especie.valor_m3_venda. Orçamentos finalizados permanecem corretos porque itens_orcamento.preco_unitario já é um snapshot (padrão já
 estabelecido no schema atual).

 2. Estender itens_orcamento (sem quebrar legado)

 Hoje item_preco_id é NOT NULL FK → itens_preco. Vamos:

 ALTER TABLE itens_orcamento
   ALTER COLUMN item_preco_id DROP NOT NULL,
   ADD COLUMN origem TEXT NOT NULL DEFAULT 'legado_planilha'
     CHECK (origem IN ('legado_planilha','madeira_m3','outro_produto')),
   ADD COLUMN madeira_m3_id UUID REFERENCES madeiras_m3(id),
   ADD COLUMN outro_produto_id UUID REFERENCES outros_produtos(id),
   -- snapshots de contexto quando aplicável:
   ADD COLUMN especie_nome TEXT,
   ADD COLUMN espessura_cm NUMERIC(6,2),
   ADD COLUMN largura_cm NUMERIC(6,2),
   ADD COLUMN comprimento_real_m NUMERIC(6,2),
   ADD COLUMN acabamento_id UUID REFERENCES servicos_acabamento(id),
   ADD COLUMN acabamento_nome TEXT,
   ADD COLUMN acabamento_percentual NUMERIC(5,2),
   ADD CONSTRAINT itens_orcamento_origem_check CHECK (
     (origem = 'legado_planilha' AND item_preco_id IS NOT NULL) OR
     (origem = 'madeira_m3'      AND madeira_m3_id  IS NOT NULL) OR
     (origem = 'outro_produto'   AND outro_produto_id IS NOT NULL)
   );

 - preco_unitario e subtotal continuam como hoje (snapshot final já com acabamento aplicado). Toda lógica legada de cálculo em src/lib/calcular-orcamento.ts segue intacta.   
 - Default 'legado_planilha' garante que registros antigos permanecem válidos sem backfill.

 3. RLS — seguir exato padrão de tabelas_preco (migration 001, linhas 278-294)

 Para cada uma das 4 tabelas com madeireira_id direto (especies_madeira, madeiras_m3, outros_produtos, servicos_acabamento):

 CREATE POLICY <tab>_madeireira_all ON <tab>
   FOR ALL USING (EXISTS (
     SELECT 1 FROM madeireiras m
     WHERE m.id = <tab>.madeireira_id AND m.user_id = auth.uid()
   ));

 CREATE POLICY <tab>_vinculados_select ON <tab>
   FOR SELECT USING (EXISTS (
     SELECT 1 FROM vinculacoes v
     JOIN carpinteiros c ON c.id = v.carpinteiro_id
     WHERE v.madeireira_id = <tab>.madeireira_id
       AND v.status = 'aprovada'
       AND c.user_id = auth.uid()
   ));

 Para comprimentos_madeira_m3 (não tem madeireira_id direto — resolve via JOIN em madeiras_m3):

 CREATE POLICY comprimentos_m3_madeireira_all ON comprimentos_madeira_m3
   FOR ALL USING (EXISTS (
     SELECT 1 FROM madeiras_m3 mm
     JOIN madeireiras m ON m.id = mm.madeireira_id
     WHERE mm.id = comprimentos_madeira_m3.madeira_m3_id
       AND m.user_id = auth.uid()
   ));

 CREATE POLICY comprimentos_m3_vinculados_select ON comprimentos_madeira_m3
   FOR SELECT USING (EXISTS (
     SELECT 1 FROM madeiras_m3 mm
     JOIN vinculacoes v ON v.madeireira_id = mm.madeireira_id
     JOIN carpinteiros c ON c.id = v.carpinteiro_id
     WHERE mm.id = comprimentos_madeira_m3.madeira_m3_id
       AND v.status = 'aprovada' AND c.user_id = auth.uid()
   ));

 Triggers updated_at reusam a function set_updated_at() já definida em 001_initial_schema.sql:180-186.

 4. View unificada (opcional — recomendado para simplificar o Carpinteiro)

 CREATE VIEW catalogo_produtos_view AS
   SELECT id, madeireira_id, 'madeira_m3'::text AS origem,
          nome, NULL::text AS codigo,
          especie_id, ... , valor_unitario_calculado, 'm' AS unidade
   FROM madeiras_m3 m JOIN especies_madeira e ON ...
   UNION ALL
   SELECT id, madeireira_id, 'outro_produto', nome, NULL, NULL, ...,
          preco_unitario, unidade
   FROM outros_produtos;

 Decisão: na Fase 5 avaliar se uma VIEW vs consultas paralelas no hook é mais ergonômico. Plano atual = consultas paralelas no hook (mais flexível no React e RLS já cobre).  
 View só se performance virar problema.

 ---
 Fases de implementação

 Fase 1 — Banco de dados (usar skill supabase-postgres-best-practices)

 1. Criar supabase/migrations/002_catalogo_produtos.sql com: 4 CREATE TABLE + índices + triggers updated_at + 8 policies RLS + ALTER em itens_orcamento.
 2. Aplicar via MCP Supabase (mcp__supabase__apply_migration) em branch de dev.
 3. Regenerar types TS (mcp__supabase__generate_typescript_types) → sobrescrever src/types/supabase-generated.ts.
 4. Smoke test SQL: inserir 1 espécie + 1 madeira m³ + 1 outro produto + 1 acabamento como madeireira; tentar SELECT como carpinteiro vinculado e como carpinteiro
 não-vinculado.

 Fase 2 — Types & schemas

 1. Criar src/types/produto.ts com as 4 interfaces + CatalogoItem (union discriminada por origem).
 2. Estender src/types/orcamento.ts → ItemOrcamento com os novos campos opcionais.
 3. Criar Zod schemas em src/lib/schemas/* (ver "Arquivos críticos"). Exportar type *Input = z.infer<typeof schema>.
 4. Criar src/lib/calcular-madeira.ts:
 export function calcularValorVendaM3(custo: number, margemPct: number) {
   return custo * (1 + margemPct / 100)
 }
 export function calcularValorMadeiraM3(esp: number, larg: number, comp: number, valorVendaM3: number) {
   return (esp / 100) * (larg / 100) * comp * valorVendaM3
 }
 export function aplicarAcabamento(preco: number, percentual: number) {
   return preco * (1 + percentual / 100)
 }

 Fase 3 — Instalar UI primitives (usar skill shadcn)

 1. Rodar shadcn add tabs dialog select table form dropdown-menu (ou via skill).
 2. Verificar que os componentes foram instalados em src/components/ui/ e que as classes Tailwind combinam com o design system Timber Grain (cores primary, secondary,        
 surface-container-*).
 3. Se algum conflitar com editorial-input.tsx, manter ambos: novos forms usam editorial-input onde couber para consistência visual (pencil-mark focus).

 Fase 4 — UI Madeireira (usar skill frontend-design + shadcn)

 1. Refatorar precos-page.tsx preservando 100% do fluxo de upload atual (função handleConfirm + batchInsert em :138-204 intactas). O wizard continua sendo renderizado quando 
  a rota é /madeireira/precos/novo OU step !== 'idle'.
 2. Envolver a página em <Tabs defaultValue="especies"> com 5 TabsTriggers. O conteúdo "Importar Planilha" recebe o wizard antigo (sem alterações).
 3. Para cada aba (Espécies → Madeiras m³ → Outros → Acabamentos):
   - Listagem com Table shadcn (nome, campos chave, ações Editar/Excluir)
   - FAB "Adicionar" (bg primary-container #FFBC00, seguindo mockup references/design-atualizado/catálogo_produtos/code.html)
   - Modal Dialog com o form correspondente (react-hook-form + zodResolver)
 4. Madeira m³ form — críticos:
   - useEspecies() popula o Select de espécies (traz custo_m3 + margem_lucro_pct)
   - watch(['especie_id','espessura_cm','largura_cm','comprimento_m']) → preview live = calcularValorMadeiraM3(esp, larg, comp, calcularValorVendaM3(custo, margem))
     (mostrar com <Intl.NumberFormat 'pt-BR' currency:'BRL'>)
   - Seção "Comprimentos disponíveis" (useFieldArray): input numérico + botão Adicionar, chips de sugestão clicáveis (1m, 1.5m, 2m, 2.5m, 3m), lista editável com toggle
     `disponivel` e botão remover. No submit, transação: cria/atualiza madeira_m3 + upsert/delete dos comprimentos.
   - Tabela lateral de preview (estilo SISMASTER): para cada comprimento cadastrado, linha com "1,50 m — R$ 47,25" calculado.
   - Se não houver espécies cadastradas, bloquear com empty state "Cadastre ao menos uma espécie primeiro"
 5. Respeitar Timber Grain: sem bordas 1px — usar bg-surface-container-highest para cards, border-b-2 no pencil-focus dos inputs, espaçamento 16px entre seções.

 Fase 5 — UI Carpinteiro (catálogo + orçamento)

 1. Criar src/hooks/useCatalogoProdutos.ts:
   - Reusa o padrão de useItensPreco.ts:18 (resolve madeireira_id via vinculação aprovada, debounce 300ms)
   - Executa 3 queries em paralelo: madeiras_m3 + especies(custo_m3, margem_lucro_pct) + comprimentos_madeira_m3, outros_produtos, itens_preco (legacy da tabela ativa)
   - Une num CatalogoItem[] com discriminante origem. Cada item `madeira_m3` carrega `comprimentos: { id, comprimento_m }[]` para alimentar o Select do orçamento.
   - Filtra client-side por query (ilike equivalente)
 2. Criar src/pages/carpinteiro/catalogo-page.tsx adaptações se já existir, ou revisar.
 3. step-materiais.tsx — trocar import de useItensPreco por useCatalogoProdutos. Ao clicar num item:
   - Se origem === 'madeira_m3': abrir dialog com **Select de Comprimento** (opções = lista pré-cadastrada com `disponivel=true`, cada label no formato "1,50 m — R$ 47,25"
     já calculado) + Select Acabamento opcional + campo Quantidade. Preview de subtotal = preço_base * (1 + acabamento_pct/100) * quantidade. Se o produto não tiver
     nenhum comprimento cadastrado, renderizar empty state "Madeireira ainda não cadastrou comprimentos para este produto" e desabilitar Adicionar. Persistir snapshot
     completo (comprimento_id, comprimento_real_m, especie_nome, dimensões, acabamento_*) no store.
   - Se origem === 'outro_produto' ou 'legado_planilha': fluxo atual (só quantidade)
 4. item-material.tsx — mostrar chips tonais: "Madeira m³ · Cambará 5×15×2.40m" + "Acabamento: Lixamento (+10%)".
 5. useOrcamentoStore.ts — estender ItemOrcamentoCalculo:
 type ItemOrcamentoCalculo = {
   id_origem: string           // FK compat
   origem: 'legado_planilha'|'madeira_m3'|'outro_produto'
   nome, unidade, quantidade, preco_unitario, subtotal
   // madeira m³:
   especie_nome?, espessura_cm?, largura_cm?
   comprimento_id?, comprimento_real_m?   // comprimento_id referencia comprimentos_madeira_m3
   // acabamento:
   acabamento_id?, acabamento_nome?, acabamento_percentual?
 }
 5. recalcular() continua somando preco_unitario * quantidade — o preco_unitario já vem com acabamento aplicado.

 Fase 6 — Persistência do orçamento

 1. No handleConfirm/save do novo-orcamento-page (rascunho + finalizado), mapear para itens_orcamento preenchendo as colunas de origem novas. Manter item_preco_id para itens 
  legados.
 2. Quando origem = madeira_m3, item_preco_id = null, madeira_m3_id = <id>; análogo para outro_produto.
 3. Revalidar o CHECK constraint local antes de enviar (evita round-trip).

 Fase 7 — PDF (usar skill pdf)

 1. pdf-document.tsx — adicionar coluna/linha secundária por item: espécie + dimensões reais + acabamento quando aplicável.
 2. Manter layout editorial atual; apenas linha auxiliar em text-secondary uppercase tracking-widest text-[10px] (padrão Timber Grain).

 Fase 8 — Verificação e QA

 1. Typecheck: npx tsc --noEmit zero erros.
 2. Build: npm run build passa.
 3. Matriz manual de QA (documentar no PR):
   - Madeireira: cadastrar 1 espécie (custo + margem, ver preview do valor de venda derivado) → madeira m³ com 3+ comprimentos (ver tabela lateral de preços) → outro
     produto → acabamento; editar; excluir; alterar custo/margem da espécie e conferir que as madeiras vinculadas refletem o novo valor de venda
   - Madeireira (regressão): fazer upload da planilha existente — deve funcionar sem erros; histórico deve aparecer
   - Carpinteiro vinculado: ver itens novos + legados misturados na busca; adicionar madeira m³ escolhendo comprimento no Select (não há input livre) + acabamento
     Lixamento (+10%); conferir subtotal matemático; gerar PDF e revisar
   - Carpinteiro: abrir orçamento finalizado antigo (pré-migration) — deve carregar/exibir normalmente
 4. RLS: tentar ler/escrever tabelas novas como carpinteiro sem vinculação → deve bloquear. Para comprimentos_madeira_m3, validar via JOIN funcional.

 Fase 9 — Regeneração do PRD.md

 O usuário pediu "gere um novo PRD.md". Como estamos em plan mode, este passo é parte da execução. Ao executar:
 1. Ler PRD.md atual integralmente.
 2. Reescrever seções F4 (Madeireira) e F5 (Carpinteiro) refletindo:
   - 4 categorias de cadastro como fluxo principal
   - Upload de planilha rebaixado para "Importação legado / bulk"
   - Espécie tem custo_m3 + margem_lucro_pct; preço de venda = custo × (1 + margem/100) (exemplo Cambará: custo R$ 3.500 + 20% margem → venda R$ 4.200/m³)
   - Fórmula de volume + exemplo Viga 5x15 Cambará (comp-ref 1m) = R$ 31,50
   - Cada Madeira m³ possui lista de Comprimentos disponíveis (fiel ao SISMASTER); carpinteiro escolhe no Select
   - Acabamentos como modificadores percentuais (equivalem a "Apresentação da Madeira" do SISMASTER)
 3. Adicionar seção "Modelo de Dados — Catálogo Relacional" com diagrama ER textual.
 4. Atualizar métricas de sucesso (ex: "Madeireira cadastra primeiro produto em < 2 minutos").
 5. Manter seções não relacionadas (login, vinculação, PDF, etc) intocadas.

 ---
 Skills e MCPs a usar durante a execução

 ┌──────┬──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ Fase │                                                 Skill / MCP                                                  │
 ├──────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 1    │ supabase-postgres-best-practices + mcp__supabase__apply_migration + mcp__supabase__generate_typescript_types │
 ├──────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 3    │ shadcn (add tabs dialog select table form dropdown-menu)                                                     │
 ├──────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 4, 5 │ frontend-design + shadcn                                                                                     │
 ├──────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 7    │ pdf                                                                                                          │
 ├──────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 9    │ prd (reescrever PRD.md)                                                                                      │
 └──────┴──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

 ---
 Referências externas (consultar em dúvida)

 - shadcn Tabs / Dialog / Form / Select — docs oficiais (ui.shadcn.com/docs/components/*) para API e variantes.
 - React Hook Form + Zod — react-hook-form.com/get-started#SchemaValidation para composição com zodResolver.
 - Supabase RLS polymorphic — supabase.com/docs/guides/database/postgres/row-level-security para padrões CHECK + nullable FK.
 - Postgres CHECK constraints multi-coluna — postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS.

 ---
 Verificação end-to-end (golden path)

 # 1. Database
 #    (via MCP) aplicar migration 002 + regenerar types

 # 2. Build & typecheck
 npm run typecheck  # ou: npx tsc --noEmit
 npm run build

 # 3. Dev server
 npm run dev

 Fluxo manual no navegador:
 1. Login como Madeireira → /madeireira/precos → aba "Espécies" → criar "Cambará" com custo R$ 3.500,00/m³ + margem 20% → preview mostra "Venda: R$ 4.200,00/m³"
 2. Aba "Madeiras m³" → criar "Viga 5×15 Cambará" (esp 5, larg 15, comp-referência 1) → preview tabelado = R$ 31,50 → na seção "Comprimentos disponíveis" adicionar
    1,00 / 1,50 / 2,00 / 2,50 / 3,00 m (tabela lateral mostra R$ 31,50 / 47,25 / 63,00 / 78,75 / 94,50)
 3. Aba "Outros Produtos" → criar "Prego 17×21" R$ 19,90/kg
 4. Aba "Acabamentos" → criar "Lixamento" +10%
 5. Aba "Importar Planilha" → upload da planilha de teste existente (regressão)
 6. Logout → login como Carpinteiro vinculado → criar orçamento
 7. Step Materiais: buscar "Viga" → ver resultado com badge "Madeira m³" → dialog abre com Select de comprimento (5 opções com preço ao lado) → selecionar 2,50 m +
    Acabamento "Lixamento" + quantidade 2
 8. Conferir subtotal: 0.05*0.15*2.50*4200 * 1.10 * 2 = R$ 173,25
 9. Adicionar "Prego 17×21" quantidade 5 → R$ 99,50
 10. Finalizar orçamento → gerar PDF → conferir espécie + dimensões + acabamento no output
 11. Madeireira altera margem de Cambará para 30% → carpinteiro em NOVO orçamento vê preços recalculados; orçamento finalizado em R$ 173,25 permanece imutável (snapshot)

 Teste de regressão crítico: abrir um orçamento finalizado criado antes da migration. Deve carregar itens (via item_preco_id legado) sem erros.

 ---
 Riscos & mitigações

 ┌────────────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────┐    
 │                               Risco                                │                                            Mitigação                                             │    
 ├────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤    
 │ Quebrar itens_orcamento legados ao dropar NOT NULL de              │ Default origem='legado_planilha' + CHECK por origem garante integridade retroativa               │    
 │ item_preco_id                                                      │                                                                                                  │    
 ├────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤    
 │ Mudança de custo/margem de espécie afetando orçamentos antigos     │ Orçamentos snapshotam preco_unitario em itens_orcamento — não leem madeiras_m3 depois de         │    
 │                                                                    │ finalizar                                                                                        │    
 ├────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤    
 │ Duplicar lógica de cadastro na UI (4 tabs similares)               │ Extrair base <CadastroPanel> genérico com render-prop para form; cada aba passa schema + columns │    
 ├────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤    
 │ shadcn Tabs conflitar com classes Timber Grain                     │ Após shadcn add, aplicar overrides via className (não editar o componente base)                  │    
 ├────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤    
 │ useCatalogoProdutos com 3 queries pode ser lento                   │ Resultados cacheados em useRef; debounce 300ms já cobre UX; se necessário, trocar por VIEW SQL   │    
 └────────────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────┘    

 ---
 Definition of Done

 - Migration 002 aplicada em dev, types regenerados (inclui tabela comprimentos_madeira_m3)
 - 4 tabs novas funcionais com CRUD completo; espécie tem custo_m3 + margem_lucro_pct com preview de valor de venda derivado
 - Madeira m³ permite cadastrar/remover comprimentos disponíveis com tabela de preview (estilo SISMASTER)
 - Upload de planilha continua funcionando (regressão zero)
 - Carpinteiro vê catálogo unificado (novo + legado) na busca
 - Orçamento exige escolher comprimento pré-cadastrado (Select) — sem input livre
 - Golden path alinhado SISMASTER produz subtotal matemático exato R$ 173,25 (0.05×0.15×2.50×4200×1.10×2)
 - Alterar margem de espécie reflete no catálogo do carpinteiro; orçamentos finalizados permanecem com snapshot original
 - Orçamento antigo pré-migration abre sem erros
 - PDF mostra espécie + dimensões + acabamento
 - tsc --noEmit zero erros; npm run build passa
 - PRD.md regenerado com seções novas (custo+margem, comprimentos por produto)
 - CLAUDE.md permanece consistente (revisar se precisa atualizar a seção "Upload de Preços")