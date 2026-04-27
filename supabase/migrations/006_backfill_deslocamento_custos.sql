-- ============================================================
-- OrçaMadeira — Backfill: deslocamento + custos_adicionais
-- Migration: 006_backfill_deslocamento_custos.sql
-- ============================================================
-- Contexto (bug C-1 — corretiva de código: ISSUE-001):
--   Os 4 payloads de save do wizard (saveDraft e handleFinalizar em
--   novo-orcamento-page e editar-orcamento-page) omitiam os campos
--   `deslocamento` e `custos_adicionais`. O banco gravava 0/0 via DEFAULT
--   NOT NULL, mas o `total` foi pré-calculado corretamente no client
--   já incluindo esses valores. Os campos `valor_margem`, `valor_imposto`
--   e `total` estão corretos; apenas `deslocamento` e `custos_adicionais`
--   foram perdidos.
--
-- Estratégia de recuperação:
--   A fórmula do orçamento é:
--     total = (subtotal_materiais + subtotal_mao_obra + deslocamento + custos_adicionais)
--             * (1 + margem_lucro/100)
--             * (1 + imposto/100)
--
--   Como `total` está correto, a base real pode ser obtida por:
--     base_real = total / ((1 + margem_lucro/100) * (1 + imposto/100))
--
--   E o gap recuperável é:
--     gap = base_real - subtotal_materiais - subtotal_mao_obra
--
--   Não é possível separar o deslocamento dos custos_adicionais após o fato;
--   portanto o gap inteiro vai para `custos_adicionais` (campo de propósito
--   geral que agrupa ambos para fins de reconstrução histórica).
--
-- Idempotência:
--   O WHERE exige `deslocamento = 0 AND custos_adicionais = 0`. Após o
--   primeiro run, os registros afetados têm `custos_adicionais > 0` e
--   não serão reprocessados em execuções subsequentes.
--
-- Verificação pós-backfill (execute para confirmar 0 linhas):
--   SELECT id, total,
--          ROUND((subtotal_materiais + subtotal_mao_obra + deslocamento + custos_adicionais)
--                * (1 + margem_lucro/100.0) * (1 + imposto/100.0), 2) AS total_recalculado
--   FROM orcamentos
--   WHERE ABS(total
--             - ROUND((subtotal_materiais + subtotal_mao_obra + deslocamento + custos_adicionais)
--                     * (1 + margem_lucro/100.0) * (1 + imposto/100.0), 2)) > 0.01;
-- ============================================================

WITH afetados AS (
  SELECT
    id,
    -- Recalcula a base real dividindo o total correto pelo multiplicador
    -- de margem + imposto. NULLIF protege contra margem = -100 (impossível
    -- via regra de negócio, mas guarda contra dados corrompidos).
    ROUND(
      total / NULLIF(
        (1 + margem_lucro / 100.0) * (1 + imposto / 100.0),
        0
      )
      - subtotal_materiais
      - subtotal_mao_obra,
      2
    ) AS gap_recuperado
  FROM orcamentos
  WHERE
    -- Candidatos: nunca tiveram custos extras gravados (ambos zero)
    deslocamento      = 0
    AND custos_adicionais = 0
    -- Total é maior que o calculado sem custos extras?
    -- (epsilon 0.01 = R$ 0,01 evita falsos positivos por arredondamento NUMERIC)
    AND total > ROUND(
      (subtotal_materiais + subtotal_mao_obra)
        * (1 + margem_lucro / 100.0)
        * (1 + imposto / 100.0),
      2
    ) + 0.01
)
UPDATE orcamentos AS o
SET
  -- Gap vai inteiro para custos_adicionais; deslocamento permanece 0
  -- pois não há como recuperar a separação original após o bug.
  custos_adicionais = a.gap_recuperado
FROM afetados a
WHERE
  o.id            = a.id
  AND a.gap_recuperado IS NOT NULL
  AND a.gap_recuperado  > 0;
