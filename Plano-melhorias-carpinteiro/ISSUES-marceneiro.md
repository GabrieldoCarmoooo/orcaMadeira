# Issues — Melhorias Carpinteiro/Marceneiro

> Gerado a partir de: `Plano-melhorias-carpinteiro/marceneiro.md`
> Total de issues: 36
> Última atualização: 2026-04-21

---

## Índice rápido

| ID | Fase | Título | Status | Deps |
|----|------|--------|--------|------|
| ISSUE-001 | 1 | Migration `003_status_custos_perfil.sql` (enum, colunas orçamento, colunas carpinteiro) | concluída | — |
| ISSUE-002 | 1 | Regenerar tipos do Supabase e atualizar `OrcamentoStatus` em `common.ts` | concluída | ISSUE-001 |
| ISSUE-003 | 1 | Atualizar `Orcamento` em `types/orcamento.ts` com `deslocamento` e `custos_adicionais` | concluída | ISSUE-001 |
| ISSUE-004 | 1 | Atualizar `Carpinteiro` em `types/carpinteiro.ts` com novos campos do perfil | concluída | ISSUE-001 |
| ISSUE-005 | 1 | Corrigir header do Dashboard para "Olá, {nome}" | concluída | — |
| ISSUE-006 | 1 | Atualizar `STATUS_LABEL`, `STATUS_CLASS`, `FILTER_TABS` em `orcamentos-page.tsx` e card recente | concluída | ISSUE-002 |
| ISSUE-007 | 1 | Adicionar ações Editar/Excluir (kebab menu) nos cards da lista de orçamentos | concluída | ISSUE-006 |
| ISSUE-008 | 1 | Selector de status + ações Editar/Excluir no detalhe do orçamento | concluída | ISSUE-006 |
| ISSUE-009 | 1 | Filtro de datas (range picker + presets) no Dashboard | concluída | — |
| ISSUE-010 | 1 | Métricas novas no Dashboard (mão de obra, margem, total custos, pedidos fechados) | concluída | ISSUE-003, ISSUE-009 |
| ISSUE-011 | 2 | Adicionar action `hydrate` em `useOrcamentoStore` | concluída | ISSUE-003 |
| ISSUE-012 | 2 | Criar `editar-orcamento-page.tsx` | concluída | ISSUE-011 |
| ISSUE-013 | 2 | Mapear rota `/carpinteiro/orcamentos/:id/editar` em `App.tsx` | concluída | ISSUE-012 |
| ISSUE-014 | 3 | Corrigir bug do input de quantidade em `item-material.tsx` | concluída | — |
| ISSUE-015 | 3 | Atualizar fórmula em `calcular-orcamento.ts` (deslocamento + custos_adicionais) | concluída | — |
| ISSUE-016 | 3 | Renomear seção e adicionar campos `deslocamento`/`custos_adicionais` em `step-financeiro.tsx` | concluída | ISSUE-015 |
| ISSUE-017 | 3 | Esconder campos sensíveis em `pdf-document.tsx` | concluída | ISSUE-015 |
| ISSUE-018 | 3 | Exibir custos em `resumo-orcamento.tsx` | concluída | ISSUE-015 |
| ISSUE-019 | 4 | Criar componente `toggle-detalhes-pdf.tsx` com AlertDialog | concluída | — |
| ISSUE-020 | 4 | Substituir toggles inline em criação e detalhe pelo componente compartilhado | concluída | ISSUE-019 |
| ISSUE-021 | 5 | Adicionar rota `/carpinteiro/orcamentos/:id/proposta` | concluída | — |
| ISSUE-022 | 5 | Criar `pdf-lista-materiais.tsx` (Document apenas materiais) | concluída | — |
| ISSUE-023 | 5 | Adicionar `exportarMateriais` em `usePdf.ts` | concluída | ISSUE-022 |
| ISSUE-024 | 5 | Criar `proposta-page.tsx` com `<PDFViewer>` + ações mobile | concluída | ISSUE-021, ISSUE-023 |
| ISSUE-025 | 5 | Atualizar `handleFinalizar` (criar/editar) para navegar à proposta + download automático | concluída | ISSUE-024, ISSUE-013 |
| ISSUE-026 | 5 | Botão "Baixar lista de materiais" no detalhe do orçamento | concluída | ISSUE-023 |
| ISSUE-027 | 6 | Badge "Parceria ativa" em `busca-madeireira.tsx` | concluída | — |
| ISSUE-028 | 7 | Corrigir bug do botão Salvar em `perfil-page.tsx` | concluída | — |
| ISSUE-029 | 7 | Implementar botão "+" de cores com `input[type=color]` | concluída | ISSUE-004 |
| ISSUE-030 | 7 | Campos `custos_adicionais_padrao` e `termos_condicoes_padrao` em `configuracoes-financeiras.tsx` | concluída | ISSUE-004 |
| ISSUE-031 | 7 | Hidratar defaults do orçamento a partir do perfil do carpinteiro | concluída | ISSUE-030 |
| ISSUE-032 | 7 | Usar `cor_primaria` do carpinteiro no header do PDF | concluída | ISSUE-029 |
| ISSUE-033 | 8 | Refatorar `catalogo-page.tsx` para linhas + remover FAB + `useCatalogoProdutos` | concluída | — |
| ISSUE-034 | 8 | Migration `005_portfolios.sql` (tabelas, bucket, RLS) | concluída | — |
| ISSUE-035 | 8 | Tipos + hook `usePortfolios` para CRUD de portfólio | concluída | ISSUE-034 |
| ISSUE-036 | 8 | UI de portfólio: aba "Meus Produtos", dialog de criação, página pública e share WhatsApp | concluída | ISSUE-035 |
| ISSUE-037 | 9 | Atualizar `CLAUDE.md` com novas regras de status, custos e portfólio | concluída | ISSUE-001, ISSUE-034 |

---

## Fase 1 — Status de Orçamento + Dashboard

### [ISSUE-001] Criar migration `003_status_custos_perfil.sql` ✅

**Status**: `concluída`
**Fase**: 1
**Dependências**: nenhuma
**Estimativa**: média (1–3h)

**Contexto**
Base SQL para todos os épicos 1, 3 e 7: novos status de orçamento, novas colunas de custos no orçamento e novas configurações no perfil do carpinteiro.

**O que fazer**
- [x] Criar `supabase/migrations/003_status_custos_perfil.sql`.
- [x] Substituir enum `orcamento_status` por novo conjunto (`rascunho`, `enviado`, `salvo`, `pedido_fechado`, `cancelado`) via rename+recreate (Postgres não permite `ALTER TYPE ADD VALUE` + `UPDATE` na mesma transação).
- [x] Backfill `finalizado → salvo` aplicado dentro do `USING` do `ALTER COLUMN`.
- [x] `ALTER TABLE orcamentos ADD COLUMN deslocamento NUMERIC NOT NULL DEFAULT 0`, `ADD COLUMN custos_adicionais NUMERIC NOT NULL DEFAULT 0`.
- [x] `ALTER TABLE carpinteiros ADD COLUMN cor_primaria TEXT`, `ADD COLUMN custos_adicionais_padrao NUMERIC NOT NULL DEFAULT 0`, `ADD COLUMN termos_condicoes_padrao TEXT`.
- [x] Recriar política `orcamento_delete_rascunho` (foi necessário dropá-la para permitir o `ALTER COLUMN ... TYPE`).
- [x] Aplicar via `mcp__supabase__apply_migration`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `supabase/migrations/003_status_custos_perfil.sql` | enum + colunas + recriação de política |

**Critérios de aceitação**
- [x] `mcp__supabase__list_migrations` mostra `status_custos_perfil` aplicada.
- [x] `SELECT enum_range(NULL::orcamento_status)` retorna `{rascunho, enviado, salvo, pedido_fechado, cancelado}` (5 valores; `finalizado` removido).
- [x] `SELECT count(*) FROM orcamentos WHERE status::text='finalizado'` retorna 0 (5 registros migrados para `salvo`).

---

### [ISSUE-002] Regenerar tipos Supabase e atualizar `OrcamentoStatus`

**Status**: `concluída`
**Fase**: 1
**Dependências**: ISSUE-001
**Estimativa**: pequena (< 1h)

**Contexto**
Sincronizar a typings do banco com a nova migration e expor o union de status atualizado para o resto do app.

**O que fazer**
- [x] Rodar `mcp__supabase__generate_typescript_types` e atualizar arquivo de tipos do banco.
- [x] Atualizar `OrcamentoStatus` em `src/types/common.ts` para `'rascunho' | 'enviado' | 'salvo' | 'pedido_fechado' | 'cancelado'` (manter `'finalizado'` apenas se ainda houver uso legado mapeado).

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/types/supabase-generated.ts` | tipos atualizados (enum + novas colunas carpinteiros/orcamentos) |
| EDITAR | `src/types/common.ts` | union `OrcamentoStatus` |

**Critérios de aceitação**
- [x] `npx tsc --noEmit` passa.
- [x] Grep por `'finalizado'` não retorna usos lógicos novos (apenas migração se necessário).

---

### [ISSUE-003] Atualizar `Orcamento` com `deslocamento` e `custos_adicionais`

**Status**: `concluída`
**Fase**: 1
**Dependências**: ISSUE-001
**Estimativa**: pequena (< 1h)

**Contexto**
Refletir as colunas novas do orçamento na camada de tipos e no `ResumoOrcamento` para o dashboard agregar.

**O que fazer**
- [x] Adicionar `deslocamento: number` e `custos_adicionais: number` na interface `Orcamento`.
- [x] Adicionar os mesmos campos em `ResumoOrcamento` em `src/lib/calcular-orcamento.ts`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/types/orcamento.ts` | campos novos |
| EDITAR | `src/lib/calcular-orcamento.ts` | espelhar no resumo |

**Critérios de aceitação**
- [x] `npx tsc --noEmit` passa.

---

### [ISSUE-004] Atualizar `Carpinteiro` com novos campos do perfil ✅

**Status**: `concluída`
**Fase**: 1
**Dependências**: ISSUE-001
**Estimativa**: pequena (< 1h)

**Contexto**
Permitir que UI e stores leiam `cor_primaria`, `custos_adicionais_padrao` e `termos_condicoes_padrao` do carpinteiro autenticado.

**O que fazer**
- [x] Adicionar `cor_primaria?: string`, `custos_adicionais_padrao: number`, `termos_condicoes_padrao?: string` em `Carpinteiro`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/types/carpinteiro.ts` | campos novos |

**Critérios de aceitação**
- [x] `npx tsc --noEmit` passa.

---

### [ISSUE-005] Corrigir header do Dashboard ("Olá, {nome}")

**Status**: `concluída`
**Fase**: 1
**Dependências**: nenhuma
**Estimativa**: pequena (< 1h)

**Contexto**
Bug item 9: H1 hardcoded em `dashboard-page.tsx:110-113`. Já existe `carpinteiro.nome` na linha 34, basta interpolar.

**O que fazer**
- [x] Substituir o H1 "Painel de Controle" por `Olá, {carpinteiro?.nome ?? 'Carpinteiro'}`.
- [x] Manter overline "Bem-vindo de volta".

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/carpinteiro/dashboard-page.tsx` | header |

**Critérios de aceitação**
- [x] Dashboard renderiza "Olá, Gabriel" (ou nome do user de teste) ao logar.
- [x] Sem regressão visual no layout do header.

---

### [ISSUE-006] Atualizar `STATUS_LABEL`, `STATUS_CLASS` e `FILTER_TABS` ✅

**Status**: `concluída`
**Fase**: 1
**Dependências**: ISSUE-002
**Estimativa**: pequena (< 1h)

**Contexto**
Refletir os 4 status (`rascunho`, `salvo`, `pedido_fechado`, `cancelado`) na lista, no card recente e nos filtros do header.

**O que fazer**
- [x] Atualizar mapas em `orcamentos-page.tsx` (labels: "Rascunho", "Salvo", "Pedido Fechado", "Cancelado").
- [x] Atualizar classes Tailwind por status (cancelado vermelho discreto, pedido_fechado verde, salvo neutro positivo).
- [x] Atualizar `orcamento-recente-card.tsx` com os novos labels/classes (via `StatusChip` em `status-chip.tsx`).

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/carpinteiro/orcamentos-page.tsx` | mapas + tabs |
| EDITAR | `src/components/ui/status-chip.tsx` | labels/cores novos (usado pelo card recente) |
| EDITAR | `src/pages/carpinteiro/novo-orcamento-page.tsx` | status `finalizado` → `salvo` (fix crítico) |
| EDITAR | `src/components/orcamento/botao-exportar-pdf.tsx` | check de status atualizado |

**Critérios de aceitação**
- [x] Cada status renderiza com label e cor correspondente.
- [x] Filtro tabs cobrem os 4 status + "Todos".

---

### [ISSUE-007] Ações Editar/Excluir (kebab menu) nos cards da lista ✅

**Status**: `concluída`
**Fase**: 1
**Dependências**: ISSUE-006
**Estimativa**: média (1–3h)

**Contexto**
Permitir editar e excluir orçamentos diretamente da lista, sem precisar abrir o detalhe.

**O que fazer**
- [x] Adicionar `DropdownMenu` shadcn no card com ações "Editar" e "Excluir".
- [x] "Editar" navega para `/carpinteiro/orcamentos/:id/editar`.
- [x] "Excluir" abre `AlertDialog` de confirmação e chama `deleteOrcamento(id)` (criar/usar mutation existente).
- [x] Atualizar lista (refetch ou invalidate) após exclusão.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/components/ui/alert-dialog.tsx` | componente AlertDialog shadcn |
| EDITAR | `src/pages/carpinteiro/orcamentos-page.tsx` | menu + handlers |

**Critérios de aceitação**
- [x] Excluir remove o orçamento e atualiza a lista.
- [x] Editar abre a página de edição (após ISSUE-013).

---

### [ISSUE-008] Selector de status + ações no detalhe do orçamento ✅

**Status**: `concluída`
**Fase**: 1
**Dependências**: ISSUE-006
**Estimativa**: média (1–3h)

**Contexto**
Transições livres entre os 4 status, manualmente, no header do detalhe; replicar Editar/Excluir.

**O que fazer**
- [x] Adicionar `<Select>` shadcn no header com os 4 status; on change chama mutation `updateOrcamentoStatus(id, status)`.
- [x] Adicionar botões "Editar" (navega para `/editar`) e "Excluir" (AlertDialog de confirmação).
- [x] Atualizar UI imediatamente após mudança de status.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/carpinteiro/orcamento-detalhe-page.tsx` | selector + ações |

**Critérios de aceitação**
- [x] Mudar status pelo selector persiste no banco.
- [x] Excluir redireciona para a lista após confirmar.

---

### [ISSUE-009] Filtro de datas no Dashboard com presets ✅

**Status**: `concluída`
**Fase**: 1
**Dependências**: nenhuma
**Estimativa**: média (1–3h)

**Contexto**
Permitir agregar métricas por período. Presets reduzem fricção no mobile.

**O que fazer**
- [x] Adicionar componente de range picker (shadcn `DateRangePicker` ou composição própria) no Dashboard.
- [x] Presets: "Mês atual", "Últimos 30 dias", "Últimos 90 dias", "Personalizado".
- [x] Manter estado local (e/ou query string) e propagar para os hooks de métricas.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/carpinteiro/dashboard-page.tsx` | range picker |

**Critérios de aceitação**
- [x] Trocar preset re-renderiza métricas com a nova janela.
- [x] Estado inicial = "Mês atual".

---

### [ISSUE-010] Novas métricas do Dashboard ✅

**Status**: `concluída`
**Fase**: 1
**Dependências**: ISSUE-003, ISSUE-009
**Estimativa**: média (1–3h)

**Contexto**
Mostrar métricas financeiras reais no período filtrado. As métricas de Mão de obra, Margem, Margem+Mão de obra e Total de custos devem agregar **somente orçamentos com status `pedido_fechado`** — são os valores efetivamente realizados. O card "Pedidos Fechados" exibe contagem + valor total desse mesmo conjunto.

**O que fazer**
- [x] Criar `src/hooks/useDashboardMetricas.ts` com query que filtra `status = 'pedido_fechado'` + `created_at` dentro do range recebido, selecionando `subtotal_mao_obra`, `valor_margem`, `subtotal_materiais`, `imposto`, `custos_adicionais`, `deslocamento`, `total`.
- [x] Calcular no hook (client-side a partir dos dados retornados):
  - `totalMaoObra` = soma de `subtotal_mao_obra`
  - `totalMargem` = soma de `valor_margem`
  - `totalMargemMaoObra` = `totalMargem + totalMaoObra`
  - `totalCustos` = soma de `imposto + custos_adicionais + deslocamento` por orçamento
  - `countPedidosFechados` e `valorPedidosFechados` = contagem e soma de `total`
- [x] Renderizar 5 cards novos em `dashboard-page.tsx` seguindo o padrão `MetricCard` existente (Timber Grain).
- [x] Passar o `dateRange` do seletor de período (ISSUE-009) para o hook.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/hooks/useDashboardMetricas.ts` | agregação filtrada por `pedido_fechado` |
| EDITAR | `src/pages/carpinteiro/dashboard-page.tsx` | 5 cards novos |

**Critérios de aceitação**
- [x] Todos os 5 cards exibem apenas números oriundos de orçamentos `pedido_fechado` no período selecionado.
- [x] Trocar o preset de período atualiza os 5 cards junto com os demais.
- [x] Soma de "Total de custos" bate com `SUM(imposto + deslocamento + custos_adicionais)` filtrado por `status = 'pedido_fechado'` e pelo mesmo período em SQL.
- [x] Card "Pedidos Fechados" mostra `count` e `valor total` (soma de `total`).
- [x] `npx tsc --noEmit` passa.

---

## Fase 2 — Edição de Orçamento Salvo

### [ISSUE-011] Action `hydrate` em `useOrcamentoStore` ✅

**Status**: `concluída`
**Fase**: 2
**Dependências**: ISSUE-003
**Estimativa**: pequena (< 1h)

**Contexto**
Necessário para a tela de edição reaproveitar o wizard partindo de um orçamento existente.

**O que fazer**
- [x] Adicionar `hydrate(orcamento, itens)` que popula todas as steps do store com snapshot atual.
- [x] Garantir que `reset()` limpa o estado para evitar leak entre navegações.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/stores/useOrcamentoStore.ts` | nova action |

**Critérios de aceitação**
- [x] `npx tsc --noEmit` passa.
- [x] Chamando `hydrate` o `useOrcamentoStore.getState()` reflete os campos passados.

---

### [ISSUE-012] Criar `editar-orcamento-page.tsx` ✅

**Status**: `concluída`
**Fase**: 2
**Dependências**: ISSUE-011
**Estimativa**: grande (> 3h)

**Contexto**
Reaproveita o wizard de novo orçamento, mas carrega via `useOrcamento(id)`, hidrata o store e faz `UPDATE` no Finalizar (preserva `finalizado_at`).

**O que fazer**
- [x] Criar página que monta `<NovoOrcamentoWizard mode="edit" />` (extrair wizard se necessário) ou cópia controlada do fluxo.
- [x] No mount: `useOrcamento(id)` → `hydrate` no store → `setStep(0)`.
- [x] No `handleFinalizar`: `updateOrcamento(id, payload)` em vez de `insert`.
- [x] Manter `finalizado_at` original ao editar não-rascunho.
- [x] Confirmar que `useOrcamento` retorna itens com todas as colunas de snapshot (`select('*')` já retorna tudo; confirmado).

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/pages/carpinteiro/editar-orcamento-page.tsx` | página edição |
| EDITAR | `src/hooks/useOrcamento.ts` | garantir snapshot completo |

**Critérios de aceitação**
- [x] Abrir um orçamento "salvo" → wizard renderiza com dados pré-preenchidos.
- [x] "Finalizar" não cria duplicata — atualiza o registro existente.

---

### [ISSUE-013] Mapear rota de edição em `App.tsx` ✅

**Status**: `concluída`
**Fase**: 2
**Dependências**: ISSUE-012
**Estimativa**: pequena (< 1h)

**Contexto**
Bug item 2: rota `/carpinteiro/orcamentos/:id/editar` definida em `routes.ts` mas sem `<Route>` em `App.tsx`, caindo no fallback `Navigate to /login`.

**O que fazer**
- [x] Adicionar `<Route path="/carpinteiro/orcamentos/:id/editar" element={<EditarOrcamentoPage />} />` em `App.tsx`, dentro do guard de carpinteiro autenticado.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/App.tsx` | rota nova |

**Critérios de aceitação**
- [x] Acesso direto à URL não redireciona para `/login` quando autenticado.

---

## Fase 3 — Bugs e novos campos no Form de Orçamento

### [ISSUE-014] Fix bug do input de quantidade em `item-material.tsx` ✅

**Status**: `concluída`
**Fase**: 3
**Dependências**: nenhuma
**Estimativa**: pequena (< 1h)

**Contexto**
Bug item 3: handler em `item-material.tsx:45-50` ignora valores < 0.01 (incl. NaN do campo vazio); `min={0.01}` no HTML bloqueia edição. Usuário percebe input "preso em 1".

**O que fazer**
- [x] Introduzir `inputValue` (string) com `useEffect` para sincronizar a partir de `item.quantidade`.
- [x] `onChange` aceita qualquer string (inclusive vazia).
- [x] `onBlur`: `parseFloat`; se `>= 0.01` commita no store; senão restaura último valor válido.
- [x] Remover `min={0.01}` do HTML.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/components/orcamento/item-material.tsx` | input controlado |

**Critérios de aceitação**
- [x] Apagar o input e digitar `5` aceita o novo valor.
- [x] Deixar vazio + blur restaura o valor anterior.
- [x] Não é possível commitar `0` ou negativo.

---

### [ISSUE-015] Atualizar fórmula em `calcular-orcamento.ts`

**Status**: `concluída`
**Fase**: 3
**Dependências**: nenhuma
**Estimativa**: média (1–3h)

**Contexto**
Nova base: `subtotal_materiais + subtotal_mao_obra + deslocamento + custos_adicionais`. Margem e imposto continuam sobre essa base. Custos extras integram total mas não vão ao PDF (regra de negócio).

**O que fazer**
- [x] Atualizar `StepFinanceiroData`/`DadosFinanceiros` com `deslocamento` e `custos_adicionais`.
- [x] Atualizar `calcularOrcamento(...)` aplicando a nova fórmula.
- [x] Atualizar schema Zod do step financeiro.
- [x] Garantir que `ResumoOrcamento` retorna ambos os custos.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/lib/calcular-orcamento.ts` | tipos + fórmula |
| EDITAR | `src/components/orcamento/step-financeiro.tsx` | schema Zod + hidden inputs |
| EDITAR | `src/stores/useOrcamentoStore.ts` | defaults + recalcular + hydrate |

**Critérios de aceitação**
- [x] Caso de teste manual: materiais 100 + mão de obra 50 + deslocamento 10 + custos 20 + margem 10% + ISS 5% → total = `(180) * 1.10 * 1.05 = 207.90`.
- [x] `npx tsc --noEmit` passa.

---

### [ISSUE-016] Renomear seção e adicionar campos em `step-financeiro.tsx` ✅

**Status**: `concluída`
**Fase**: 3
**Dependências**: ISSUE-015
**Estimativa**: pequena (< 1h)

**Contexto**
Refletir na UI a nova fórmula e os campos novos (sem alterar o toggle do PDF).

**O que fazer**
- [x] Renomear seção "Margem e impostos" → "Margem e Custos" em `step-financeiro.tsx:183`.
- [x] Adicionar inputs `deslocamento` e `custos_adicionais` (R$, mínimo 0, default 0).
- [x] Atualizar defaults no `useOrcamentoStore`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/components/orcamento/step-financeiro.tsx` | label + campos |
| EDITAR | `src/stores/useOrcamentoStore.ts` | defaults |

**Critérios de aceitação**
- [x] Campos aparecem no step e persistem no store.
- [x] Validação Zod rejeita valores negativos.

---

### [ISSUE-017] Esconder custos sensíveis no PDF ✅

**Status**: `concluída`
**Fase**: 3
**Dependências**: ISSUE-015
**Estimativa**: pequena (< 1h)

**Contexto**
Regra de negócio: `deslocamento`, `custos_adicionais` e `valor_margem` jamais aparecem no PDF — independente do toggle "Detalhes no PDF".

**O que fazer**
- [x] Em `pdf-document.tsx`, remover qualquer renderização desses três campos.
- [x] Adicionar comentário curto explicando a regra.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/components/orcamento/pdf-document.tsx` | esconder campos |

**Critérios de aceitação**
- [x] PDF gerado com toggle ON e OFF não exibe nenhum dos três campos.

---

### [ISSUE-018] Exibir custos em `resumo-orcamento.tsx`

**Status**: `concluída`
**Fase**: 3
**Dependências**: ISSUE-015
**Estimativa**: pequena (< 1h)

**Contexto**
Resumo interno (visto pelo carpinteiro) deve mostrar todos os custos para conferência.

**O que fazer**
- [x] Adicionar linhas para `deslocamento` e `custos_adicionais` no resumo.
- [x] Manter ordem: materiais → mão de obra → deslocamento → custos adicionais → margem → imposto → total.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/components/orcamento/resumo-orcamento.tsx` | linhas novas |

**Critérios de aceitação**
- [x] Resumo bate com o total calculado (ISSUE-015).

---

## Fase 4 — Toggle "Detalhes no PDF" compartilhado

### [ISSUE-019] Componente `toggle-detalhes-pdf.tsx` com AlertDialog ✅

**Status**: `concluída`
**Fase**: 4
**Dependências**: nenhuma
**Estimativa**: média (1–3h)

**Contexto**
Hoje o toggle está duplicado inline em criação e detalhe. Extrair e adicionar warning ao ligar (não ao desligar).

**O que fazer**
- [x] Criar componente com props `value`, `onChange`, `disabled?`.
- [x] Ao mudar `false → true`, abrir `AlertDialog` shadcn com mensagem: "Ativar 'Detalhes no PDF' fará com que valores de mão de obra e materiais apareçam discriminados na proposta entregue ao cliente. Deseja continuar?".
- [x] Botões: "Cancelar" / "Sim, mostrar detalhes".
- [x] `true → false` muda direto, sem warning.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/components/orcamento/toggle-detalhes-pdf.tsx` | componente |

**Critérios de aceitação**
- [x] Cancelar no dialog mantém o toggle desligado.
- [x] Confirmar liga; desligar não exibe diálogo.

---

### [ISSUE-020] Substituir toggles inline pelo componente compartilhado ✅

**Status**: `concluída`
**Fase**: 4
**Dependências**: ISSUE-019
**Estimativa**: pequena (< 1h)

**Contexto**
Remover duplicação em `novo-orcamento-page.tsx:389-402` e `orcamento-detalhe-page.tsx:177-198`.

**O que fazer**
- [x] Substituir os blocos inline pelo `<ToggleDetalhesPdf>`.
- [x] Garantir que o estado segue persistido como hoje (store ou prop).

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/carpinteiro/novo-orcamento-page.tsx` | usar componente |
| EDITAR | `src/pages/carpinteiro/orcamento-detalhe-page.tsx` | usar componente |

**Critérios de aceitação**
- [x] Comportamento idêntico nas duas telas.
- [x] `npx tsc --noEmit` passa.

---

## Fase 5 — Pós-finalizar e PDF de materiais

### [ISSUE-021] Rota `/carpinteiro/orcamentos/:id/proposta`

**Status**: `concluída`
**Fase**: 5
**Dependências**: nenhuma
**Estimativa**: pequena (< 1h)

**Contexto**
Destino do redirect após finalizar e ponto de visualização in-app do PDF.

**O que fazer**
- [x] Adicionar constante em `src/constants/routes.ts`.
- [x] Adicionar `<Route>` placeholder em `App.tsx` apontando para `PropostaPage` (a ser criada).

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/constants/routes.ts` | nova rota |
| EDITAR | `src/App.tsx` | route element |
| CRIAR | `src/pages/carpinteiro/proposta-page.tsx` | página placeholder |

**Critérios de aceitação**
- [x] Acesso à URL renderiza a página (mesmo que esqueleto).

---

### [ISSUE-022] Criar `pdf-lista-materiais.tsx` ✅

**Status**: `concluída`
**Fase**: 5
**Dependências**: nenhuma
**Estimativa**: média (1–3h)

**Contexto**
PDF reduzido apenas com a tabela de materiais — sem mão de obra, margem, impostos, custos extras ou totais financeiros.

**O que fazer**
- [x] Criar `<MateriaisPdfDocument orcamento={...}>` com `Document` + `Page`.
- [x] Header com logo + dados do projeto/cliente.
- [x] Tabela com nome, dimensões/unidade, quantidade.
- [x] Footer com data e nome do carpinteiro.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/components/orcamento/pdf-lista-materiais.tsx` | document |

**Critérios de aceitação**
- [x] Nenhum campo financeiro aparece no PDF.
- [x] Renderiza para um orçamento com 5 itens sem quebrar layout.

---

### [ISSUE-023] Adicionar `exportarMateriais` em `usePdf.ts` ✅

**Status**: `concluída`
**Fase**: 5
**Dependências**: ISSUE-022
**Estimativa**: pequena (< 1h)

**Contexto**
Reutilizar a infra de geração/download para o novo Document.

**O que fazer**
- [x] Adicionar `exportarMateriais(orcamento)` (ou hook irmão `usePdfMateriais`).
- [x] Usar `pdf().toBlob()` + `saveAs` (ou equivalente já usado).

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/hooks/usePdf.ts` | método novo |

**Critérios de aceitação**
- [x] Chamar o método baixa um PDF nomeado `materiais-{id}.pdf`.

---

### [ISSUE-024] Criar `proposta-page.tsx` com `<PDFViewer>` ✅

**Status**: `concluída`
**Fase**: 5
**Dependências**: ISSUE-021, ISSUE-023
**Estimativa**: média (1–3h)

**Contexto**
Tela de pós-finalização: visualização in-app do PDF + ações.

**O que fazer**
- [x] Carregar `useOrcamento(id)`.
- [x] Renderizar `<PDFViewer>` com `<OrcamentoPdfDocument />`.
- [x] Botões mobile: "Baixar novamente", "Compartilhar" (Web Share API com fallback), "Voltar para orçamentos".
- [x] Botão "Baixar lista de materiais" (`exportarMateriais`).

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/pages/carpinteiro/proposta-page.tsx` | página |

**Critérios de aceitação**
- [x] PDF renderiza no viewer em desktop e mobile (com fallback se viewer não suportado).
- [x] Web Share API só aparece quando `navigator.share` existe.

---

### [ISSUE-025] Atualizar `handleFinalizar` (criar/editar) para destino "proposta" ✅

**Status**: `concluída`
**Fase**: 5
**Dependências**: ISSUE-024, ISSUE-013
**Estimativa**: pequena (< 1h)

**Contexto**
Após finalizar (criar ou editar), navegar para `/proposta` e disparar download automático em paralelo.

**O que fazer**
- [x] Em `novo-orcamento-page.tsx:183-231`, trocar `navigate(ROUTES.CARPINTEIRO_ORCAMENTOS)` por `navigate(rota proposta com id criado)`.
- [x] Disparar `usePdf().exportar(orcamento)` antes/junto da navegação.
- [x] Replicar mesmo destino em `editar-orcamento-page.tsx`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/carpinteiro/novo-orcamento-page.tsx` | navigate + download |
| EDITAR | `src/pages/carpinteiro/editar-orcamento-page.tsx` | navigate + download |

**Critérios de aceitação**
- [x] Finalizar redireciona à proposta e baixa o PDF automaticamente.

---

### [ISSUE-026] Botão "Baixar lista de materiais" no detalhe ✅

**Status**: `concluída`
**Fase**: 5
**Dependências**: ISSUE-023
**Estimativa**: pequena (< 1h)

**Contexto**
Mesma ação da proposta acessível pela tela de detalhe (caso o carpinteiro queira baixar depois).

**O que fazer**
- [x] Adicionar botão "Baixar lista de materiais" e link "Ver proposta" na seção de ações.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/carpinteiro/orcamento-detalhe-page.tsx` | botões |

**Critérios de aceitação**
- [x] Clicar baixa o PDF reduzido (sem campos financeiros).

---

## Fase 6 — Vinculação

### [ISSUE-027] Badge "Parceria ativa" em `busca-madeireira.tsx` ✅

**Status**: `concluída`
**Fase**: 6
**Dependências**: nenhuma
**Estimativa**: pequena (< 1h)

**Contexto**
Item 6: quando a madeireira pesquisada já é a parceira aprovada, mostrar badge em vez de "Solicitar Parceria".

**O que fazer**
- [x] Adicionar prop opcional `madeireiraVinculadaId?: string`.
- [x] Se `m.id === madeireiraVinculadaId`, renderizar badge verde "Parceria ativa" com ícone `Check`.
- [x] Em `vinculacao-page.tsx`, passar `vinculacao?.madeireira_id` quando `status === 'aprovada'`.
- [x] Manter botão "Solicitar Parceria" disabled se já existe pendente.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/components/carpinteiro/busca-madeireira.tsx` | prop + badge |
| EDITAR | `src/pages/carpinteiro/vinculacao-page.tsx` | passar id |

**Critérios de aceitação**
- [x] Madeireira vinculada aparece com badge.
- [x] Outras continuam com botão "Solicitar Parceria".

---

## Fase 7 — Perfil

### [ISSUE-028] Fix bug do botão Salvar em `perfil-page.tsx` ✅

**Status**: `concluída`
**Fase**: 7
**Dependências**: nenhuma
**Estimativa**: média (1–3h)

**Contexto**
Causa-raiz `perfil-page.tsx:331`: botão `disabled` quando `!isDirty && logoUrl === carpinteiro.logo_url`. RHF não detecta dirty para campos financeiros (a forma como `ConfiguracoesFinanceiras` força string vazia em valor 0 confunde o controle).

**O que fazer**
- [x] Garantir `setValue('margem_lucro_padrao', ..., { shouldDirty: true, shouldTouch: true })` (e demais financeiros) em `handleFinanceiroChange`.
- [x] Fallback: habilitar botão se `isDirty || logoUrl !== originalLogoUrl || corPrimaria !== original`.
- [x] Toast de erro quando submit falhar por validação.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/carpinteiro/perfil-page.tsx` | dirty + fallback |
| EDITAR | `src/components/shared/configuracoes-financeiras.tsx` | flags shouldDirty |

**Critérios de aceitação**
- [x] Alterar qualquer campo financeiro habilita o botão.
- [x] Submit grava no banco e exibe toast de sucesso.

---

### [ISSUE-029] Botão "+" cores com `input[type=color]` ✅

**Status**: `concluída`
**Fase**: 7
**Dependências**: ISSUE-004
**Estimativa**: média (1–3h)

**Contexto**
`perfil-page.tsx:223-229`: botão visual sem `onClick`. Implementar color picker nativo e persistir em `cor_primaria`.

**O que fazer**
- [x] Substituir `<button>` por `<label>` com `<input type="color" hidden>`.
- [x] `onChange` adiciona à paleta local (sessão) e seleciona.
- [x] Persistir cor selecionada em `carpinteiros.cor_primaria` ao salvar perfil.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/carpinteiro/perfil-page.tsx` | color picker |

**Critérios de aceitação**
- [x] Escolher cor reflete na prévia imediatamente.
- [x] Após salvar, recarregar a página mantém a cor.

---

### [ISSUE-030] Campos `custos_adicionais_padrao` e `termos_condicoes_padrao` ✅

**Status**: `concluída`
**Fase**: 7
**Dependências**: ISSUE-004
**Estimativa**: pequena (< 1h)

**Contexto**
Permitir ao carpinteiro definir defaults reutilizados em cada novo orçamento.

**O que fazer**
- [x] Adicionar input "Custos adicionais padrão" (R$, default 0).
- [x] Adicionar `<Textarea>` "Termos e condições padrão".
- [x] Persistir nos campos novos ao salvar.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/components/ui/textarea.tsx` | primitivo Textarea (shadcn pattern) |
| EDITAR | `src/components/shared/configuracoes-financeiras.tsx` | campos numérico + textarea |
| EDITAR | `src/pages/carpinteiro/perfil-page.tsx` | schema, defaults, reset, handleFinanceiroChange |

**Critérios de aceitação**
- [x] Valores persistem após salvar e recarregar.

---

### [ISSUE-031] Hidratar defaults do orçamento a partir do perfil ✅

**Status**: `concluída`
**Fase**: 7
**Dependências**: ISSUE-030
**Estimativa**: pequena (< 1h)

**Contexto**
Ao iniciar um novo orçamento, pré-preencher `custos_adicionais` e `termos_condicoes` com os defaults do perfil; carpinteiro pode editar.

**O que fazer**
- [x] No `useOrcamentoStore.reset()` (ou init), ler `useAuth().carpinteiro` e usar os campos padrão.
- [x] Não sobrescrever se já houver valor persistido (rascunho retomado).

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/stores/useOrcamentoStore.ts` | hydrate defaults |

**Critérios de aceitação**
- [x] Novo orçamento abre com `custos_adicionais` e `termos_condicoes` preenchidos.

---

### [ISSUE-032] `cor_primaria` no header do PDF ✅

**Status**: `concluída`
**Fase**: 7
**Dependências**: ISSUE-029
**Estimativa**: pequena (< 1h)

**Contexto**
Refletir a cor escolhida pelo carpinteiro no PDF gerado.

**O que fazer**
- [x] Em `pdf-document.tsx`, ler `carpinteiro.cor_primaria` (com fallback para Wood Gold `#7A5900`).
- [x] Usar a cor no header / divisores.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/components/orcamento/pdf-document.tsx` | cor dinâmica |

**Critérios de aceitação**
- [x] PDF reflete a cor do perfil; fallback aplicado quando `cor_primaria` é null.

---

## Fase 8 — Catálogo: linhas + Portfólio

### [ISSUE-033] Refatorar `catalogo-page.tsx` para linhas + remover FAB ✅

**Status**: `concluída`
**Fase**: 8
**Dependências**: nenhuma
**Estimativa**: média (1–3h)

**Contexto**
Trocar a UI de cards por linhas (estilo `step-materiais.tsx`), unificando as 3 fontes via `useCatalogoProdutos`. Remover FAB "Nova Proposta" desta aba (movimento para a aba "Meus Produtos").

**O que fazer**
- [x] Trocar `useItensPreco` por `useCatalogoProdutos` (já cobre `madeira_m3`, `outro_produto`, `legado_planilha`).
- [x] Criar `src/components/carpinteiro/catalogo-linha.tsx` (linha unificada: nome, dimensões/unidade, espécie quando madeira m³, preço, badge de origem).
- [x] Remover o FAB "Nova Proposta" da aba.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/carpinteiro/catalogo-page.tsx` | linhas + remover FAB |
| CRIAR | `src/components/carpinteiro/catalogo-linha.tsx` | componente linha |

**Critérios de aceitação**
- [x] Catálogo mostra produtos das 3 fontes em linhas com badge de origem.
- [x] FAB "Nova Proposta" não aparece mais nessa aba.

---

### [ISSUE-034] Migration `005_portfolios.sql` ✅

**Status**: `concluída`
**Fase**: 8
**Dependências**: nenhuma
**Estimativa**: média (1–3h)

**Contexto**
Tabelas, bucket e RLS para o portfólio compartilhável.

**O que fazer**
- [x] Criar `portfolios(id uuid pk, carpinteiro_id uuid fk, nome text not null, slug text unique, created_at timestamptz)`.
- [x] Criar `portfolio_arquivos(id uuid pk, portfolio_id uuid fk on delete cascade, tipo text check in ('imagem','pdf'), storage_path text, ordem int, created_at timestamptz)`.
- [x] Criar bucket `portfolios` (público) com policy de upload restrita ao dono.
- [x] RLS: dono `FOR ALL USING auth.uid() = carpinteiro.user_id`; público `FOR SELECT USING true` em ambas as tabelas.
- [x] Aplicar via `mcp__supabase__apply_migration`.

**Nota**: arquivo nomeado `005_portfolios.sql` pois `004` já estava ocupado por `004_orcamento_delete_any_status.sql`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `supabase/migrations/005_portfolios.sql` | schema + RLS |

**Critérios de aceitação**
- [x] `mcp__supabase__list_migrations` mostra `portfolios` aplicada.
- [x] Bucket `portfolios` listado em Storage (público: true).
- [x] RLS ativo em ambas as tabelas (`rowsecurity: true` confirmado).

---

### [ISSUE-035] Tipos + hook `usePortfolios` ✅

**Status**: `concluída`
**Fase**: 8
**Dependências**: ISSUE-034
**Estimativa**: média (1–3h)

**Contexto**
Camada de dados única para CRUD de portfólio e upload no Storage.

**O que fazer**
- [x] Regenerar tipos com `mcp__supabase__generate_typescript_types`.
- [x] Criar `src/types/portfolio.ts` com `Portfolio` e `PortfolioArquivo`.
- [x] Criar `src/hooks/usePortfolios.ts` com `list()`, `create({ nome, files })`, `delete(id)`, `getBySlug(slug)`.
- [x] Upload no bucket em `{carpinteiro_id}/{portfolio_id}/...`.
- [x] Geração de slug curto (ex.: `nanoid(8)`).

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/types/portfolio.ts` | interfaces |
| CRIAR | `src/hooks/usePortfolios.ts` | CRUD + upload |

**Critérios de aceitação**
- [x] `npx tsc --noEmit` passa.
- [ ] Criar portfólio com 1 PDF + 3 imagens persiste registros e arquivos no Storage.

---

### [ISSUE-036] UI de portfólio: aba, dialog, página pública e share WhatsApp

**Status**: `concluída`
**Fase**: 8
**Dependências**: ISSUE-035
**Estimativa**: grande (> 3h)

**Contexto**
Front-end completo do portfólio: criação, listagem, visualização pública e compartilhamento.

**O que fazer**
- [x] Adicionar botão "Novo Portfólio" na aba "Meus Produtos" (substitui o FAB removido em ISSUE-033).
- [x] Listar portfólios em cards com thumbnail + nome.
- [x] Criar `src/components/carpinteiro/novo-portfolio-dialog.tsx` (campo nome + upload múltiplo PDF/imagens).
- [x] Criar `src/pages/public/portfolio-publico-page.tsx` (sem auth) — galeria de imagens + link para PDF.
- [x] Adicionar rota pública `/p/:slug` em `App.tsx` e `routes.ts`.
- [x] Botão "Compartilhar no WhatsApp" — abre `https://wa.me/?text=Olha%20meu%20portf%C3%B3lio:%20{url}` com URL pública.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/carpinteiro/catalogo-page.tsx` | aba "Meus Produtos" |
| CRIAR | `src/components/carpinteiro/novo-portfolio-dialog.tsx` | criação |
| CRIAR | `src/pages/public/portfolio-publico-page.tsx` | público |
| EDITAR | `src/App.tsx` | rota pública |
| EDITAR | `src/constants/routes.ts` | path público |
| EDITAR | `src/hooks/usePortfolios.ts` | helpers getStoragePublicUrl, getPortfolioThumbnails |

**Critérios de aceitação**
- [x] Criar portfólio com PDF + imagens funciona ponta-a-ponta.
- [x] Abrir `/p/{slug}` em aba anônima renderiza o portfólio.
- [x] Botão WhatsApp abre `wa.me` com a URL pública correta.

---

## Fase 9 — Documentação

### [ISSUE-037] Atualizar `CLAUDE.md` ✅

**Status**: `concluída`
**Fase**: 9
**Dependências**: ISSUE-001, ISSUE-034
**Estimativa**: pequena (< 1h)

**Contexto**
Manter o documento de regras de negócio coerente com as mudanças de status, custos extras, regra do PDF e nova feature de Portfólio.

**O que fazer**
- [x] Substituir lista de status `rascunho|finalizado|enviado` por `rascunho|salvo|enviado|pedido_fechado|cancelado` (ou conjunto final definido na spec).
- [x] Acrescentar `deslocamento` e `custos_adicionais` na descrição da fórmula.
- [x] Acrescentar regra: "`deslocamento`, `custos_adicionais` e `valor_margem` jamais aparecem no PDF — independente do toggle Detalhes."
- [x] Mencionar feature de Portfólio em "Sobre o Produto" → seção do Carpinteiro.
- [x] Listar tabelas `portfolios`, `portfolio_arquivos` e bucket `portfolios`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `CLAUDE.md` | regras + feature |

**Critérios de aceitação**
- [x] Diff revisado — nenhuma referência a `finalizado` como status ativo restante.
- [x] Feature de Portfólio mencionada e tabelas listadas.

---
