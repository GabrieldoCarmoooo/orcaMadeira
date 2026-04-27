# Issues — Saúde Geral do Sistema OrçaMadeira

> Gerado a partir de: `PLANO-SAUDE-GERAL-SISTEMA.MD`
> Total de issues: 32
> Última atualização: 2026-04-24

---

## Índice rápido

| ID | Fase | Título | Status | Deps |
|----|------|--------|--------|------|
| ISSUE-001 | 1 | Persistir `deslocamento` e `custos_adicionais` nos 4 payloads de save | ✅ concluída | — |
| ISSUE-002 | 1 | Script SQL de backfill para orçamentos afetados pelo bug C-1 | ✅ concluída | ISSUE-001 |
| ISSUE-003 | 1 | Configurar Vitest + Testing Library no projeto | ✅ concluída | — |
| ISSUE-004 | 1 | Testes unitários para `calcular-orcamento.ts` | ✅ concluída | ISSUE-003 |
| ISSUE-005 | 1 | Testes unitários para `calcular-madeira.ts` | ✅ concluída | ISSUE-003 |
| ISSUE-006 | 1 | Testes unitários para `parse-planilha.ts` | ✅ concluída | ISSUE-003 |
| ISSUE-007 | 2 | Bloquear botão "Editar" para status `pedido_fechado` e `cancelado` | ✅ concluída | — |
| ISSUE-008 | 2 | Guarda server-side em `handleFinalizar` contra update de pedido fechado | ✅ concluída | ISSUE-007 |
| ISSUE-009 | 2 | Extrair hook `useOrcamentoWizard` em `src/hooks/` | ✅ concluída | ISSUE-001 |
| ISSUE-010 | 2 | Refatorar `novo-orcamento-page` e `editar-orcamento-page` para usar o hook | ✅ concluída | ISSUE-009 |
| ISSUE-011 | 2 | Centralizar enum/labels de status em `src/constants/orcamento-status.ts` | ✅ concluída | — |
| ISSUE-012 | 3 | Adicionar limites superiores nos Zod schemas de catálogo | ✅ concluída | — |
| ISSUE-013 | 3 | Extrair helper `calcularPrecoLinhaMadeiraM3` em `calcular-madeira.ts` | ✅ concluída | ISSUE-005 |
| ISSUE-014 | 3 | Instalar e configurar `@tanstack/react-query` | ✅ concluída | — |
| ISSUE-015 | 3 | Migrar `useCatalogoProdutos` para react-query | ✅ concluída | ISSUE-014 |
| ISSUE-016 | 3 | Migrar `useOrcamento` e `useDashboardMetricas` para react-query | ✅ concluída | ISSUE-014 |
| ISSUE-017 | 3 | Adicionar `useMemo` em listas filtradas e selectors Zustand | ✅ concluída | — |
| ISSUE-018 | 3 | Carregar `xlsx`/`papaparse` via dynamic import em `parse-planilha.ts` | ✅ concluída | — |
| ISSUE-019 | 3 | Substituir meta-pacote `radix-ui` por imports escopados | ✅ concluída | — |
| ISSUE-020 | 3 | Padronizar tratamento de erro com helper `logError` | ✅ concluída | — |
| ISSUE-021 | 4 | Configurar `manualChunks` explícitos em `vite.config.ts` | ✅ concluída | ISSUE-019 |
| ISSUE-022 | 5 | Trocar `pending_profile` de `localStorage` para `sessionStorage` | ✅ concluída | — |
| ISSUE-023 | 5 | Adicionar `file_size_limit` e `allowed_mime_types` ao bucket `logos` | ✅ concluída | — |
| ISSUE-024 | 5 | Habilitar `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes` | ✅ concluída | — |
| ISSUE-025 | 5 | Adicionar `eslint-plugin-jsx-a11y` e regra `no-explicit-any` | ✅ concluída | — |
| ISSUE-026 | 5 | Redimensionar logo em `logo-uploader.tsx` antes do upload | ✅ concluída | — |
| ISSUE-027 | 5 | Extrair helpers `buildMadeiraKey` / `parseMadeiraKey` em `lib/item-key.ts` | ✅ concluída | — |
| ISSUE-028 | 6 | Quebrar `pdf-document.tsx` em sub-componentes | ✅ concluída | — |
| ISSUE-029 | 6 | Quebrar `orcamento-detalhe-page.tsx` em seções | ✅ concluída | ISSUE-011 |
| ISSUE-030 | 6 | Quebrar `orcamentos-page.tsx` em filtro/lista/modais | ✅ concluída | ISSUE-011, ISSUE-017 |
| ISSUE-031 | 6 | Quebrar `madeira-m3-form.tsx` em form fields + comprimentos manager | ✅ concluída | — |
| ISSUE-032 | 6 | Quebrar `perfil-page.tsx` em seções empresa/financeiro/termos | ✅ concluída | — |

---

## Fase 1 — Correções Críticas (Integridade de Dados e Cobertura de Testes)

### [ISSUE-001] Persistir `deslocamento` e `custos_adicionais` nos 4 payloads de save

**Status**: `concluída`
**Fase**: 1
**Dependências**: nenhuma
**Estimativa**: pequena (< 1h)

**Contexto**
O wizard coleta e calcula `deslocamento` e `custos_adicionais`, mas os 4 payloads de save omitem ambos os campos, fazendo com que o banco grave silenciosamente `0/0`. O total fica consistente porque já foi pré-calculado, mas qualquer reabertura/refetch perde os valores.

**O que fazer**
- [x] Adicionar `deslocamento: resumo.deslocamento` e `custos_adicionais: resumo.custos_adicionais` em `saveDraft` (`novo-orcamento-page.tsx:146-167`).
- [x] Adicionar os dois campos em `handleFinalizar` de `novo-orcamento-page.tsx:201-222`.
- [x] Adicionar os dois campos em `salvarAlteracoes` de `editar-orcamento-page.tsx:126-145`.
- [x] Adicionar os dois campos em `handleFinalizar` de `editar-orcamento-page.tsx:181-204`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/carpinteiro/novo-orcamento-page.tsx` | incluir os 2 campos nos 2 payloads |
| EDITAR | `src/pages/carpinteiro/editar-orcamento-page.tsx` | incluir os 2 campos nos 2 payloads |

**Critérios de aceitação**
- [x] Após salvar um orçamento com `deslocamento=50` e `custos_adicionais=50`, refetch retorna esses valores no banco (não `0`).
- [x] `npm run typecheck` sem erros.
- [x] PDF gerado imediatamente continua igual (não depende deste fix).

---

### [ISSUE-002] Script SQL de backfill para orçamentos afetados pelo bug C-1

**Status**: `concluída`
**Fase**: 1
**Dependências**: ISSUE-001
**Estimativa**: média (1–3h)

**Contexto**
Orçamentos salvos enquanto o bug estava ativo têm `deslocamento=0` e `custos_adicionais=0` mesmo quando o usuário inseriu valores. O `total` foi gravado corretamente, então a diferença pode ser detectada comparando `total` vs `(materiais + mao_obra) * (1+margem) * (1+imposto)`.

**O que fazer**
- [x] Criar nova migration em `supabase/migrations/` com nome `006_backfill_deslocamento_custos.sql`.
- [x] Escrever query que selecione orçamentos com `deslocamento=0 AND custos_adicionais=0` e `total > (materiais+mao_obra)*(1+margem)*(1+imposto) + epsilon`.
- [x] Documentar no comentário SQL o motivo do backfill (referência ao bug C-1).
- [x] Como o gap é a soma de `desloc + custos`, registrar a diferença em `custos_adicionais` (não há como separar) e logar no campo `observacoes` ou em tabela de auditoria.
- [x] Aplicar via `mcp__supabase__apply_migration`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `supabase/migrations/006_backfill_deslocamento_custos.sql` | backfill seguro com auditoria |

**Critérios de aceitação**
- [x] Migration roda sem erros em ambiente de teste.
- [x] Query de verificação retorna 0 orçamentos com gap inconsistente após o backfill.
- [x] Migration é idempotente (rodar 2× não duplica ajustes).

---

### [ISSUE-003] Configurar Vitest + Testing Library no projeto

**Status**: `concluída`
**Fase**: 1
**Dependências**: nenhuma
**Estimativa**: pequena (< 1h)

**Contexto**
`package.json` não tem framework de teste. Setup precisa ser feito antes de qualquer cobertura.

**O que fazer**
- [x] Rodar `npm i -D vitest @testing-library/react @testing-library/user-event jsdom`.
- [x] Criar `vitest.config.ts` com env `jsdom`, alias `@/` apontando para `./src`.
- [x] Adicionar script `"test": "vitest"` e `"test:run": "vitest run"` em `package.json`.
- [x] Criar `src/test/setup.ts` com import de `@testing-library/jest-dom`.
- [x] Adicionar `setupFiles: ['./src/test/setup.ts']` na config.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `vitest.config.ts` | config Vitest |
| CRIAR | `src/test/setup.ts` | setup global de testes |
| EDITAR | `package.json` | scripts e devDependencies |

**Critérios de aceitação**
- [x] `npm test -- --run` executa sem erros (com 0 testes).
- [x] Alias `@/` resolve dentro de testes.
- [x] `npm run typecheck` continua passando.

---

### [ISSUE-004] Testes unitários para `calcular-orcamento.ts`

**Status**: `concluída`
**Fase**: 1
**Dependências**: ISSUE-003
**Estimativa**: pequena (< 1h)

**Contexto**
A pipeline `base × margem × imposto` é o coração do sistema. Um teste teria capturado o bug C-1.

**O que fazer**
- [x] Criar `src/lib/__tests__/calcular-orcamento.test.ts`.
- [x] Cobrir: cálculo de `subtotal_materiais` com vários itens.
- [x] Cobrir: `mao_obra_tipo='fixo'` vs `mao_obra_tipo='hora'` (com `mao_obra_horas`).
- [x] Cobrir: `deslocamento` e `custos_adicionais` aparecem no resumo retornado.
- [x] Cobrir: aplicação correta de `(1+margem) * (1+imposto)` no total.
- [x] Cobrir: caso com margem=0 e imposto=0.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/lib/__tests__/calcular-orcamento.test.ts` | suite completa |

**Critérios de aceitação**
- [x] `npm test -- --run calcular-orcamento` passa com pelo menos 5 casos.
- [x] Teste explícito para `deslocamento` e `custos_adicionais` no retorno.
- [x] Cobertura inclui borda margem=0/imposto=0.

---

### [ISSUE-005] Testes unitários para `calcular-madeira.ts`

**Status**: `concluída`
**Fase**: 1
**Dependências**: ISSUE-003
**Estimativa**: pequena (< 1h)

**Contexto**
Fórmula de m³ e markup de acabamento é regra de negócio crítica documentada em CLAUDE.md (exemplo Cambará 5×15×1m → R$ 31,50).

**O que fazer**
- [x] Criar `src/lib/__tests__/calcular-madeira.test.ts`.
- [x] Caso CLAUDE.md: espécie Cambará custo 3500/m³, margem 20%, peça 5×15×1m → R$ 31,50.
- [x] Caso com acabamento 10% aplicado sobre o preço base.
- [x] Caso com margem 0% (valor_m3_venda = custo_m3).
- [x] Caso com dimensões fracionárias.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/lib/__tests__/calcular-madeira.test.ts` | suite com casos do CLAUDE.md |

**Critérios de aceitação**
- [x] Teste do exemplo Cambará retorna exatamente `31.50`.
- [x] Acabamento aplica markup multiplicativo sobre o base.
- [x] `npm test -- --run calcular-madeira` passa.

---

### [ISSUE-006] Testes unitários para `parse-planilha.ts`

**Status**: `concluída`
**Fase**: 1
**Dependências**: ISSUE-003
**Estimativa**: média (1–3h)

**Contexto**
Parser CSV/XLSX precisa rejeitar preços negativos, campos obrigatórios vazios e gerar relatório de erro por linha sem bloquear linhas válidas (regra do CLAUDE.md).

**O que fazer**
- [x] Criar `src/lib/__tests__/parse-planilha.test.ts`.
- [x] Cobrir detecção de colunas obrigatórias (`nome`, `unidade`, `preco_unitario`).
- [x] Cobrir rejeição de preço negativo.
- [x] Cobrir rejeição de linha com campo obrigatório vazio.
- [x] Validar que linhas válidas continuam sendo importadas mesmo com erros em outras.
- [x] Cobrir colunas opcionais (`categoria`, `código`, `descrição`, `disponível`).

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/lib/__tests__/parse-planilha.test.ts` | suite com fixtures CSV inline |
| EDITAR | `src/lib/parse-planilha.ts` | adicionada função `validatePlanilha` com tipos `ValidatedRow`, `RowError`, `ValidationResult` |

**Critérios de aceitação**
- [x] Suite cobre pelo menos 6 casos: header detection, válido, preço negativo, campo vazio, linhas mistas, colunas opcionais.
- [x] `npm test -- --run parse-planilha` passa.

---

## Fase 2 — Severidade Alta (Bug + Refatoração Estrutural)

### [ISSUE-007] Bloquear botão "Editar" para status `pedido_fechado` e `cancelado`

**Status**: `concluída`
**Fase**: 2
**Dependências**: nenhuma
**Estimativa**: pequena (< 1h)

**Contexto**
`orcamento-detalhe-page.tsx:289` exibe o botão Editar independente do status, permitindo mutação de pedidos finalizados que deveriam ter preços congelados (snapshot).

**O que fazer**
- [x] Localizar o botão de editar em `orcamento-detalhe-page.tsx:289`.
- [x] Envolver em condicional `{orcamento.status !== 'pedido_fechado' && orcamento.status !== 'cancelado' && (...)}`.
- [x] Confirmar que nenhum outro caminho navega para a rota de edição (links em listas, ações rápidas).

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/carpinteiro/orcamento-detalhe-page.tsx` | gate visual no botão Editar |
| EDITAR | `src/pages/carpinteiro/orcamentos-page.tsx` | gate visual no DropdownMenuItem Editar |

**Critérios de aceitação**
- [x] Em orçamento `pedido_fechado`, botão Editar não renderiza.
- [x] Em orçamento `cancelado`, botão Editar não renderiza.
- [x] Em `salvo`/`enviado`/`rascunho`, botão segue funcionando.

---

### [ISSUE-008] Guarda server-side em `handleFinalizar` contra update de pedido fechado

**Status**: `concluída`
**Fase**: 2
**Dependências**: ISSUE-007
**Estimativa**: pequena (< 1h)

**Contexto**
Mesmo com gate visual, request direto via DevTools/fetch poderia mutar um `pedido_fechado`. Adicionar guarda no update.

**O que fazer**
- [x] Em `editar-orcamento-page.tsx:181-204` (`handleFinalizar`), adicionar `.neq('status', 'pedido_fechado')` à query de update.
- [x] Tratar resultado: se `count === 0`, exibir erro "Pedido fechado não pode ser editado".
- [x] Aplicar a mesma proteção em `salvarAlteracoes` (autosave).

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/carpinteiro/editar-orcamento-page.tsx` | predicado `neq` no update + tratamento |

**Critérios de aceitação**
- [x] Update direto via Supabase JS contra orçamento `pedido_fechado` retorna 0 rows afetadas.
- [x] UI exibe mensagem clara quando o update é bloqueado.
- [x] `npm run typecheck` passa.

---

### [ISSUE-009] Extrair hook `useOrcamentoWizard` em `src/hooks/`

**Status**: `concluída`
**Fase**: 2
**Dependências**: ISSUE-001
**Estimativa**: grande (> 3h)

**Contexto**
`novo-orcamento-page.tsx` (491 linhas) e `editar-orcamento-page.tsx` (490 linhas) são ~95% duplicadas. O bug C-1 foi copiado por causa dessa duplicação. Centralizar a lógica em um hook.

**O que fazer**
- [x] Criar `src/hooks/useOrcamentoWizard.ts` com assinatura `useOrcamentoWizard(orcamentoId?: string)`.
- [x] Mover state do wizard, autosave (30s), validação de itens, snapshot para PDF.
- [x] Expor `salvar({ status })` que faz `insert` (sem id) ou `update` (com id).
- [x] Garantir que `deslocamento` e `custos_adicionais` estejam no payload (do ISSUE-001).
- [x] Expor estado: `step`, `setStep`, `resumo`, `saveError`, `isSaving`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/hooks/useOrcamentoWizard.ts` | hook compartilhado |
| CRIAR | `src/hooks/__tests__/useOrcamentoWizard.test.ts` | testes dos helpers exportados |

**Critérios de aceitação**
- [x] Hook isolado compila e passa typecheck.
- [x] Cobertura em testes para o branch insert vs update.
- [x] Autosave é debounceado e cancelável (sem leak ao desmontar).

---

### [ISSUE-010] Refatorar `novo-orcamento-page` e `editar-orcamento-page` para usar o hook

**Status**: `concluída`
**Fase**: 2
**Dependências**: ISSUE-009
**Estimativa**: média (1–3h)

**Contexto**
Após o hook existir, as duas páginas viram shells finos (~80 linhas) que apenas montam steps.

**O que fazer**
- [x] Reescrever `novo-orcamento-page.tsx` usando `useOrcamentoWizard()`.
- [x] Reescrever `editar-orcamento-page.tsx` usando `useOrcamentoWizard(orcamentoId)`.
- [x] Manter as duas rotas (clareza de URL) mas remover duplicação interna.
- [x] Manter geração imediata de PDF após save (snapshot local).

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/components/orcamento/orcamento-wizard-shell.tsx` | UI compartilhada (wizard + review) |
| EDITAR | `src/pages/carpinteiro/novo-orcamento-page.tsx` | reduzido a shell (74 linhas) |
| EDITAR | `src/pages/carpinteiro/editar-orcamento-page.tsx` | reduzido a shell (75 linhas) |

**Critérios de aceitação**
- [x] Cada página resultante tem ≤ 100 linhas.
- [x] Fluxo de criação e edição funciona end-to-end no preview.
- [x] Autosave durante edição continua salvando os 2 campos do C-1.

---

### [ISSUE-011] Centralizar enum/labels de status em `src/constants/orcamento-status.ts`

**Status**: `concluída`
**Fase**: 2
**Dependências**: nenhuma
**Estimativa**: média (1–3h)

**Contexto**
Strings de status (`'rascunho'`, `'salvo'`, etc.) aparecem em 11+ call sites e há um `STATUS_LABEL` redefinido em `orcamentos-page.tsx:52-61`. Risco de divergência silenciosa.

**O que fazer**
- [x] Criar `src/constants/orcamento-status.ts` exportando `ORCAMENTO_STATUS` com `{ value, label, badgeClass }` por status.
- [x] Usar `as const satisfies Record<OrcamentoStatus, ...>` para travar tipo.
- [x] Substituir literais inline em pages, hooks e componentes.
- [x] Remover `STATUS_LABEL` local de `orcamentos-page.tsx`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/constants/orcamento-status.ts` | fonte única de verdade |
| EDITAR | `src/pages/carpinteiro/orcamentos-page.tsx` | remover STATUS_LABEL local |
| EDITAR | múltiplos | substituir literais por constante |

**Critérios de aceitação**
- [x] `grep -r "'rascunho'\|'salvo'\|'pedido_fechado'" src/` retorna apenas o arquivo de constantes e tipos.
- [x] Adicionar um novo status só requer editar 1 arquivo.
- [x] `npm run typecheck` passa.

---

## Fase 3 — Severidade Média (Schemas, Performance e Erros)

### [ISSUE-012] Adicionar limites superiores nos Zod schemas de catálogo

**Status**: `concluída`
**Fase**: 3
**Dependências**: nenhuma
**Estimativa**: pequena (< 1h)

**Contexto**
Schemas aceitam input numérico ilimitado. Margem 9.999.999% corromperia todos os cálculos. Limites devem refletir `NUMERIC(12,2)` e realismo físico.

**O que fazer**
- [x] Em `especie-schema.ts`: `custo_m3.max(999_999.99)`, `margem_lucro_pct.max(1000)`.
- [x] Em `madeira-m3-schema.ts`: `espessura_cm.max(100)`, `largura_cm.max(500)`, `comprimento_m.max(20)`.
- [x] Em `outro-produto-schema.ts`: `preco_unitario.max(999_999.99)`.
- [x] Em `acabamento-schema.ts`: `percentual_acrescimo.max(500)`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/lib/schemas/especie-schema.ts` | bounds |
| EDITAR | `src/lib/schemas/madeira-m3-schema.ts` | bounds |
| EDITAR | `src/lib/schemas/outro-produto-schema.ts` | bounds |
| EDITAR | `src/lib/schemas/acabamento-schema.ts` | bounds |

**Critérios de aceitação**
- [x] Submeter formulário com margem 9999999 retorna erro de validação.
- [x] Mensagens de erro Zod são em pt-BR e claras.
- [x] Forms funcionam com valores válidos típicos.

---

### [ISSUE-013] Extrair helper `calcularPrecoLinhaMadeiraM3` em `calcular-madeira.ts`

**Status**: `concluída`
**Fase**: 3
**Dependências**: ISSUE-005
**Estimativa**: pequena (< 1h)

**Contexto**
`step-materiais.tsx:89-105` reimplementa inline a fórmula de preço de madeira m³ com acabamento. Risco de divergir de `calcular-madeira.ts`.

**O que fazer**
- [x] Adicionar em `src/lib/calcular-madeira.ts` a função `calcularPrecoLinhaMadeiraM3(especie, dims, acabamento?)`.
- [x] Substituir cálculo inline em `step-materiais.tsx` pela chamada.
- [x] Adicionar caso de teste correspondente em `calcular-madeira.test.ts`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/lib/calcular-madeira.ts` | nova função pura |
| EDITAR | `src/components/orcamento/step-materiais.tsx` | usar helper |
| EDITAR | `src/lib/__tests__/calcular-madeira.test.ts` | cobrir helper |

**Critérios de aceitação**
- [x] Preview de preço em `step-materiais` mostra mesmo valor do snapshot final.
- [x] Teste do helper passa.
- [x] Nenhum cálculo de m³ duplicado fora de `calcular-madeira.ts`.

---

### [ISSUE-014] Instalar e configurar `@tanstack/react-query`

**Status**: `concluída`
**Fase**: 3
**Dependências**: nenhuma
**Estimativa**: pequena (< 1h)

**Contexto**
Hooks `useOrcamento`, `useDashboardMetricas`, `useCatalogoProdutos` usam `useState + useEffect` sem cache. Toda navegação refaz queries.

**O que fazer**
- [x] Rodar `npm i @tanstack/react-query`.
- [x] Em `App.tsx`, criar `QueryClient` e envolver a árvore com `QueryClientProvider`.
- [x] Configurar default `staleTime: 60_000` e `refetchOnWindowFocus: false`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `package.json` | dependência |
| EDITAR | `src/App.tsx` | QueryClientProvider |

**Critérios de aceitação**
- [x] App carrega normalmente após mudança.
- [x] DevTools (opcional) mostra QueryClient ativo.
- [x] `npm run typecheck` passa.

---

### [ISSUE-015] Migrar `useCatalogoProdutos` para react-query

**Status**: `concluída`
**Fase**: 3
**Dependências**: ISSUE-014
**Estimativa**: média (1–3h)

**Contexto**
Hook mais consultado (toda navegação ao orçamento). Migrar primeiro para validar a abordagem.

**O que fazer**
- [x] Reescrever `useCatalogoProdutos.ts` usando `useQuery` com `queryKey` por carpinteiro/madeireira.
- [x] Manter assinatura pública igual (consumidores não mudam).
- [x] Em mutations relacionadas, chamar `queryClient.invalidateQueries` apropriadamente.
- [x] Trocar o `catch { setAllItems([]) }` por logging real (ver ISSUE-020).

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/hooks/useCatalogoProdutos.ts` | usar useQuery |
| EDITAR | `src/hooks/useEspecies.ts` | invalidateQueries após mutações |
| EDITAR | `src/hooks/useMadeirasM3.ts` | invalidateQueries após mutações |
| EDITAR | `src/hooks/useOutrosProdutos.ts` | invalidateQueries após mutações |

**Critérios de aceitação**
- [x] Navegar entre rotas não refaz a query (DevTools).
- [x] Após criar/editar item de catálogo, listas atualizam (invalidação).
- [x] Comportamento de erro distingue "vazio" de "falha".

---

### [ISSUE-016] Migrar `useOrcamento` e `useDashboardMetricas` para react-query

**Status**: `concluída`
**Fase**: 3
**Dependências**: ISSUE-014
**Estimativa**: média (1–3h)

**Contexto**
Após validar com `useCatalogoProdutos`, replicar nos demais hooks de leitura.

**O que fazer**
- [x] Migrar `useOrcamento.ts` para `useQuery`.
- [x] Migrar `useDashboardMetricas.ts` para `useQuery`.
- [x] Adicionar `queryKey` consistente (`['orcamento', id]`, `['dashboard-metricas', userId]`).
- [x] Invalidar `['orcamento', id]` após save no wizard.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/hooks/useOrcamento.ts` | useQuery |
| EDITAR | `src/hooks/useDashboardMetricas.ts` | useQuery |
| EDITAR | `src/hooks/useOrcamentoWizard.ts` | invalidateQueries após salvar |

**Critérios de aceitação**
- [x] Dashboard não refaz fetch ao voltar de tela de detalhe.
- [x] Após salvar orçamento, detalhe reabre com dados frescos.

---

### [ISSUE-017] Adicionar `useMemo` em listas filtradas e selectors Zustand

**Status**: `concluída`
**Fase**: 3
**Dependências**: nenhuma
**Estimativa**: pequena (< 1h)

**Contexto**
`orcamentos-page.tsx:134,138` filtra 2× por render sem memo. `novo-orcamento-page.tsx:87` desestrutura store inteiro causando re-render em cascata.

**O que fazer**
- [x] Adicionar `useMemo` em `orcamentos-page.tsx` para o array filtrado.
- [x] Substituir desestruturação completa do `useOrcamentoStore` por selectors granulares (`useOrcamentoStore(s => s.itens)` etc.) nas pages do wizard.
- [x] Auditar outros usos de `useOrcamentoStore()` sem selector e converter.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/carpinteiro/orcamentos-page.tsx` | useMemo |
| EDITAR | `src/pages/carpinteiro/novo-orcamento-page.tsx` | selectors |
| EDITAR | `src/pages/carpinteiro/editar-orcamento-page.tsx` | selectors |
| EDITAR | múltiplos | selectors em consumidores do store |

**Critérios de aceitação**
- [x] React DevTools mostra menos re-renders ao digitar no campo de busca.
- [x] Nenhum comportamento funcional muda.

---

### [ISSUE-018] Carregar `xlsx`/`papaparse` via dynamic import em `parse-planilha.ts`

**Status**: `concluída`
**Fase**: 3
**Dependências**: nenhuma
**Estimativa**: média (1–3h)

**Contexto**
`xlsx` (~1.5 MB minified) e `papaparse` ficam no bundle principal. Carpinteiros nunca usam upload, mas baixam ambos.

**O que fazer**
- [x] Quebrar `parse-planilha.ts` em `parse-csv.ts` + `parse-xlsx.ts`.
- [x] Manter um wrapper `parsePlanilha(file)` que detecta extensão e faz `await import(...)` apropriado.
- [x] Confirmar que somente o caminho de upload da madeireira chama essa função.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/lib/parse-csv.ts` | apenas papaparse |
| CRIAR | `src/lib/parse-xlsx.ts` | apenas xlsx |
| EDITAR | `src/lib/parse-planilha.ts` | wrapper com dynamic import |

**Critérios de aceitação**
- [x] `npm run build` mostra `xlsx` em chunk separado (não no main).
- [x] Upload .xlsx funciona end-to-end no preview.
- [x] Upload .csv não baixa o chunk xlsx.

---

### [ISSUE-019] Substituir meta-pacote `radix-ui` por imports escopados

**Status**: `concluída`
**Fase**: 3
**Dependências**: nenhuma
**Estimativa**: média (1–3h)

**Contexto**
Tree-shaking do meta-pacote `radix-ui` é não confiável. Imports escopados são o padrão recomendado pelo shadcn.

**O que fazer**
- [x] Listar todos imports de `"radix-ui"` em `src/components/ui/`.
- [x] Para cada um, instalar o pacote escopado correspondente (`@radix-ui/react-slot`, `@radix-ui/react-dialog`, etc.).
- [x] Trocar imports.
- [x] Remover `radix-ui` de `package.json`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `package.json` | adicionar escopados, remover meta |
| EDITAR | `src/components/ui/*.tsx` | trocar imports |

**Critérios de aceitação**
- [x] Nenhum `from "radix-ui"` remanescente em `src/`.
- [x] `npm run build` reduz tamanho (ou mantém) — comparar via `vite build --report`.
- [x] Componentes UI funcionam normalmente no preview.

---

### [ISSUE-020] Padronizar tratamento de erro com helper `logError`

**Status**: `concluída`
**Fase**: 3
**Dependências**: nenhuma
**Estimativa**: média (1–3h)

**Contexto**
Catches silenciosos (`catch { setAllItems([]) }`) escondem 500s do Supabase. Hooks têm convenções inconsistentes (`{ data, error }` vs `data | null`).

**O que fazer**
- [x] Criar `src/lib/log-error.ts` com `logError(scope: string, err: unknown)` que faz `console.error` (e ponto de extensão para Sentry).
- [x] Adicionar `logError(...)` em todos os `catch` blocks identificados nos hooks/pages.
- [x] Padronizar retorno de hooks de leitura para `{ data, error, isLoading }` (alinhado com react-query).

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/lib/log-error.ts` | helper |
| EDITAR | `src/hooks/useCatalogoProdutos.ts` | logError no catch |
| EDITAR | `src/pages/carpinteiro/novo-orcamento-page.tsx` | logError nos catches |
| EDITAR | múltiplos | substituir catches silenciosos |

**Critérios de aceitação**
- [x] Nenhum `catch {}` ou `catch (err) { /* nada */ }` remanescente em `src/`.
- [x] Erro real do Supabase aparece no console com scope identificável.

---

## Fase 4 — Build e Bundle

### [ISSUE-021] Configurar `manualChunks` explícitos em `vite.config.ts`

**Status**: `concluída`
**Fase**: 4
**Dependências**: ISSUE-019
**Estimativa**: pequena (< 1h)

**Contexto**
Apenas React/Router e Supabase são chunked. PDF e forms ficam em chunks aleatórios.

**O que fazer**
- [x] Adicionar `build.rollupOptions.output.manualChunks` em `vite.config.ts` com grupos: `vendor`, `supabase`, `pdf`, `forms`.
- [x] Rodar `vite build --report` (ou `rollup-plugin-visualizer`) para validar tamanhos.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `vite.config.ts` | manualChunks explícitos |

**Critérios de aceitação**
- [x] `dist/` mostra chunks `vendor-*.js`, `supabase-*.js`, `pdf-*.js`, `forms-*.js`.
- [x] Tamanho do chunk principal cai vs build atual.

---

## Fase 5 — Severidade Baixa (Segurança, Tipagem, Polish)

### [ISSUE-022] Trocar `pending_profile` de `localStorage` para `sessionStorage`

**Status**: `concluída`
**Fase**: 5
**Dependências**: nenhuma
**Estimativa**: pequena (< 1h)

**Contexto**
`register-page.tsx:98-107` salva PII (nome, CPF, telefone) em localStorage. Persiste cross-restart e é lido por XSS.

**O que fazer**
- [x] Trocar `localStorage` por `sessionStorage` em `register-page.tsx`.
- [x] Atualizar leitura no `complete_authentication`/`AuthInitializer`.
- [ ] Considerar (follow-up) escrever direto em `carpinteiros`/`madeireiras` no signup com flag `email_verified=false`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/pages/auth/register-page.tsx` | sessionStorage |
| EDITAR | leitor do pending_profile | mesma troca |

**Critérios de aceitação**
- [x] Fechar a aba durante signup limpa o pending_profile.
- [x] Fluxo de email confirmação ainda completa o cadastro se concluído na mesma aba.

---

### [ISSUE-023] Adicionar `file_size_limit` e `allowed_mime_types` ao bucket `logos`

**Status**: `concluída`
**Fase**: 5
**Dependências**: nenhuma
**Estimativa**: pequena (< 1h)

**Contexto**
Bucket `logos` foi criado sem limites server-side. Frontend valida 2 MB e MIME, mas pode ser bypassado.

**O que fazer**
- [x] Criar migration que faz `UPDATE storage.buckets SET file_size_limit = 2*1024*1024, allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'] WHERE id = 'logos'`.
- [x] Aplicar via `mcp__supabase__apply_migration`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `supabase/migrations/007_logos_bucket_limits.sql` | UPDATE no bucket |

**Critérios de aceitação**
- [x] Upload >2MB direto via Supabase JS é rejeitado pelo servidor.
- [x] Upload de PDF é rejeitado pelo servidor.
- [x] Migration é idempotente.

---

### [ISSUE-024] Habilitar `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes`

**Status**: `concluída`
**Fase**: 5
**Dependências**: nenhuma
**Estimativa**: média (1–3h)

**Contexto**
`tsconfig.app.json` tem `strict: true` mas faltam essas duas flags que pegam bugs reais de acesso a array/objeto.

**O que fazer**
- [x] Adicionar `"noUncheckedIndexedAccess": true` e `"exactOptionalPropertyTypes": true` em `tsconfig.app.json`.
- [x] Rodar `npm run typecheck` e corrigir erros surfaceados (esperado: poucos, em hooks de catálogo).

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `tsconfig.app.json` | flags |
| EDITAR | múltiplos | fixes pontuais |

**Critérios de aceitação**
- [x] `npm run typecheck` passa com as duas flags habilitadas.
- [x] Build em produção continua funcionando.

---

### [ISSUE-025] Adicionar `eslint-plugin-jsx-a11y` e regra `no-explicit-any`

**Status**: `concluída`
**Fase**: 5
**Dependências**: nenhuma
**Estimativa**: pequena (< 1h)

**Contexto**
Lint é mínimo. CLAUDE.md já proíbe `any`; vale travar via ESLint.

**O que fazer**
- [x] Rodar `npm i -D eslint-plugin-jsx-a11y`.
- [x] Adicionar plugin com preset `recommended` em `eslint.config.js`.
- [x] Adicionar `'@typescript-eslint/no-explicit-any': 'error'` em rules.
- [x] Rodar `npm run lint` e corrigir issues surfaceados.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `eslint.config.js` | plugin + regra + exceção para `src/components/ui/` |
| EDITAR | `package.json` | devDependency |
| CRIAR | `src/lib/schemas/preco-item-schema.ts` | schema extraído de previa-dados |
| EDITAR | `src/components/madeireira/previa-dados.tsx` | importa schema do novo arquivo |
| EDITAR | `src/pages/madeireira/precos-page.tsx` | importa tipo do novo arquivo |
| EDITAR | `src/components/layout/dashboard-layout.tsx` | renomeia prop `role` → `userRole` |
| EDITAR | `src/components/layout/app-sidebar.tsx` | renomeia prop `role` → `userRole` |
| EDITAR | `src/components/layout/bottom-nav.tsx` | renomeia prop `role` → `userRole` |
| EDITAR | `src/App.tsx` | atualiza prop renomeada |
| EDITAR | `src/components/madeireira/catalogo/madeira-m3-form.tsx` | usa `FormLabel` no lugar de `<label>` |
| EDITAR | `src/components/orcamento/item-material.tsx` | eslint-disable localizado (controlled input sync) |
| EDITAR | `src/components/shared/configuracoes-financeiras.tsx` | eslint-disable localizado (controlled input sync) |
| EDITAR | `src/pages/carpinteiro/catalogo-page.tsx` | eslint-disable localizado (cleanup obrigatório) |
| EDITAR | `src/pages/carpinteiro/orcamento-detalhe-page.tsx` | remove useEffect desnecessário |
| EDITAR | `src/pages/carpinteiro/orcamentos-page.tsx` | substitui useEffect por handler handleFilterChange |
| EDITAR | `src/pages/public/portfolio-publico-page.tsx` | remove setState redundante no effect |

**Critérios de aceitação**
- [x] `npm run lint` passa.
- [x] Tentar adicionar `: any` em qualquer arquivo dispara erro.

---

### [ISSUE-026] Redimensionar logo em `logo-uploader.tsx` antes do upload

**Status**: `concluída`
**Fase**: 5
**Dependências**: nenhuma
**Estimativa**: média (1–3h)

**Contexto**
`fetchLogoBase64` baixa o logo em resolução cheia e embute base64 no PDF. Logo de 2 MB infla o PDF em ~2.7 MB.

**O que fazer**
- [x] Em `logo-uploader.tsx`, no submit, redimensionar via `<canvas>` para máx 400×400 mantendo aspecto.
- [x] Salvar a versão reduzida no bucket.
- [x] Validar que JPEG/PNG/WebP são todos suportados.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| EDITAR | `src/components/shared/logo-uploader.tsx` | resize antes do upload via canvas |

**Critérios de aceitação**
- [x] Logo após upload tem ≤ 400 px no maior lado.
- [x] Tamanho do PDF gerado cai significativamente vs antes.
- [x] Qualidade visual aceitável no PDF.

---

### [ISSUE-027] Extrair helpers `buildMadeiraKey` / `parseMadeiraKey` em `lib/item-key.ts`

**Status**: `concluída`
**Fase**: 5
**Dependências**: nenhuma
**Estimativa**: pequena (< 1h)

**Contexto**
Formato `madeira:{id}:{comprimento_id}:{acabamento_id|none}` é construído e parseado inline em `useOrcamentoStore.ts:88-91` e `step-materiais.tsx`.

**O que fazer**
- [x] Criar `src/lib/item-key.ts` com `buildMadeiraKey({ id, comprimentoId, acabamentoId? })` e `parseMadeiraKey(key)`.
- [x] Substituir construções/parses inline.
- [x] Adicionar testes unitários roundtrip.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/lib/item-key.ts` | helpers |
| CRIAR | `src/lib/__tests__/item-key.test.ts` | roundtrip |
| EDITAR | `src/stores/useOrcamentoStore.ts` | usar helpers |
| EDITAR | `src/components/orcamento/step-materiais.tsx` | usar helpers |

**Critérios de aceitação**
- [x] `buildMadeiraKey` + `parseMadeiraKey` são roundtrip-safe.
- [x] Nenhum literal `'madeira:'` remanescente fora de `item-key.ts`.

---

## Fase 6 — Refatoração de Arquivos Grandes (M-8)

### [ISSUE-028] Quebrar `pdf-document.tsx` em sub-componentes

**Status**: `concluída`
**Fase**: 6
**Dependências**: nenhuma
**Estimativa**: média (1–3h)

**Contexto**
585 linhas misturando header, cliente, materiais, financeiro, footer. Difícil revisar mudanças no PDF.

**O que fazer**
- [x] Criar pasta `src/components/orcamento/pdf/` com sub-componentes: `pdf-header.tsx`, `pdf-cliente.tsx`, `pdf-materiais.tsx`, `pdf-financeiro.tsx`, `pdf-footer.tsx`.
- [x] `pdf-document.tsx` vira composição final.
- [x] Manter regra de privacidade do PDF (CLAUDE.md): nunca mostrar `deslocamento`, `custos_adicionais`, `valor_margem`.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/components/orcamento/pdf/pdf-tokens.ts` | design tokens + shared styles |
| CRIAR | `src/components/orcamento/pdf/pdf-header.tsx` | seção header |
| CRIAR | `src/components/orcamento/pdf/pdf-cliente.tsx` | seção cliente + projeto |
| CRIAR | `src/components/orcamento/pdf/pdf-materiais.tsx` | seção materiais |
| CRIAR | `src/components/orcamento/pdf/pdf-financeiro.tsx` | seção financeiro + termos |
| CRIAR | `src/components/orcamento/pdf/pdf-footer.tsx` | footer |
| EDITAR | `src/components/orcamento/pdf-document.tsx` | composição enxuta (68 linhas) |

**Critérios de aceitação**
- [x] PDF gerado é byte-equivalente ou visualmente idêntico ao anterior.
- [x] Nenhum sub-componente >150 linhas.
- [x] Regra de privacidade preservada.

---

### [ISSUE-029] Quebrar `orcamento-detalhe-page.tsx` em seções

**Status**: `concluída`
**Fase**: 6
**Dependências**: ISSUE-011
**Estimativa**: média (1–3h)

**Contexto**
466 linhas misturando ações de status, export PDF e render.

**O que fazer**
- [x] Extrair `OrcamentoStatusActions` (botões mudar status, gate do ISSUE-007).
- [x] Extrair `OrcamentoPdfActions` (download, preview).
- [x] Manter a page como shell que orquestra.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/components/orcamento/orcamento-status-actions.tsx` | botões de status |
| CRIAR | `src/components/orcamento/orcamento-pdf-actions.tsx` | export PDF |
| CRIAR | `src/components/orcamento/detalhe-primitives.tsx` | helpers visuais (SectionTitle, InfoRow, FinancialLine) |
| CRIAR | `src/hooks/useOrcamentoDetalhe.ts` | mutações de status e exclusão |
| CRIAR | `src/lib/format.ts` | formatadores BRL e DATE_FMT_LONGO |
| EDITAR | `src/pages/carpinteiro/orcamento-detalhe-page.tsx` | shell (180 linhas) |

**Critérios de aceitação**
- [x] Page resultante ≤ 200 linhas.
- [x] Comportamento idêntico ao original.

---

### [ISSUE-030] Quebrar `orcamentos-page.tsx` em filtro/lista/modais

**Status**: `concluída`
**Fase**: 6
**Dependências**: ISSUE-011, ISSUE-017
**Estimativa**: média (1–3h)

**Contexto**
460 linhas com filter bar, lista e modais de mudança de status no mesmo arquivo.

**O que fazer**
- [x] Extrair `OrcamentosFilterBar`.
- [x] Extrair `OrcamentosList`.
- [x] Extrair `OrcamentoStatusModal`.
- [x] Page vira shell que conecta state com componentes.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/components/orcamento/orcamentos-filter-bar.tsx` | filtros |
| CRIAR | `src/components/orcamento/orcamentos-list.tsx` | lista |
| CRIAR | `src/components/orcamento/orcamento-status-modal.tsx` | modal de exclusão |
| CRIAR | `src/hooks/useOrcamentos.ts` | hook com busca paginada + mutações |
| EDITAR | `src/types/orcamento.ts` | exporta `OrcamentoListItem` e `FilterStatus` |
| EDITAR | `src/pages/carpinteiro/orcamentos-page.tsx` | shell (106 linhas) |

**Critérios de aceitação**
- [x] Page ≤ 200 linhas.
- [x] Filtros, busca e mudança de status seguem funcionando.

---

### [ISSUE-031] Quebrar `madeira-m3-form.tsx` em form fields + comprimentos manager

**Status**: `concluída`
**Fase**: 6
**Dependências**: nenhuma
**Estimativa**: média (1–3h)

**Contexto**
460 linhas misturando campos do form com gerenciador de comprimentos disponíveis.

**O que fazer**
- [x] Extrair `ComprimentosManager` (lista + adicionar + remover).
- [x] Manter o form principal só com fields da Madeira m³.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/components/madeireira/catalogo/comprimentos-manager.tsx` | sub-componente (227 linhas) |
| CRIAR | `src/components/madeireira/catalogo/madeira-m3-dimensoes-fields.tsx` | campos espessura/largura (74 linhas) |
| EDITAR | `src/components/madeireira/catalogo/madeira-m3-form.tsx` | reduzido a 230 linhas |

**Critérios de aceitação**
- [x] Cada arquivo ≤ 250 linhas.
- [x] CRUD de comprimentos disponíveis funciona igual.

---

### [ISSUE-032] Quebrar `perfil-page.tsx` em seções empresa/financeiro/termos

**Status**: `concluída`
**Fase**: 6
**Dependências**: nenhuma
**Estimativa**: média (1–3h)

**Contexto**
424 linhas com 3 seções distintas no mesmo arquivo.

**O que fazer**
- [x] Extrair `PerfilEmpresaSection`, `PerfilFinanceiroSection`, `PerfilTermosSection`.
- [x] Page passa a renderizar as 3 em sequência.

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/lib/schemas/perfil-carpinteiro-schema.ts` | schema Zod extraído (19 linhas) |
| CRIAR | `src/hooks/usePerfilCarpinteiro.ts` | toda a lógica do form (162 linhas) |
| CRIAR | `src/components/perfil/perfil-empresa-section.tsx` | empresa (105 linhas) |
| CRIAR | `src/components/perfil/perfil-financeiro-section.tsx` | financeiro (132 linhas) |
| CRIAR | `src/components/perfil/perfil-termos-section.tsx` | termos/prévia PDF (116 linhas) |
| EDITAR | `src/pages/carpinteiro/perfil-page.tsx` | shell (95 linhas) |

**Critérios de aceitação**
- [x] Page ≤ 150 linhas (95 linhas).
- [x] Salvar em qualquer seção continua funcionando.

---
