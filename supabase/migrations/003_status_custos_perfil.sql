-- ============================================================
-- OrçaMadeira — Status, custos extras de orçamento e perfil
-- Migration: 003_status_custos_perfil.sql
-- ============================================================
-- Mudanças cobertas:
--   1) Enum orcamento_status: substitui 'finalizado' por 'salvo' e adiciona
--      'pedido_fechado' / 'cancelado'. Backfill: finalizado → salvo.
--   2) orcamentos: novas colunas deslocamento e custos_adicionais
--      (custos invisíveis no PDF, integram a base de cálculo final).
--   3) carpinteiros: novas colunas cor_primaria, custos_adicionais_padrao,
--      termos_condicoes_padrao (defaults usados em cada novo orçamento).
--
-- Por que rename+recreate em vez de ALTER TYPE ADD VALUE:
--   PostgreSQL não permite usar um valor de enum recém-criado dentro da
--   mesma transação. Como precisamos do backfill (finalizado → salvo)
--   atomicamente com a alteração do tipo, é mais seguro recriar o enum
--   por completo via USING + cast textual.
-- ============================================================

-- ──────────────────────────────────────────
-- 1) ENUM orcamento_status — rename + recreate com backfill
-- ──────────────────────────────────────────

-- A política orcamento_delete_rascunho referencia a coluna status diretamente;
-- precisa ser removida antes do ALTER COLUMN ... TYPE e recriada na sequência.
DROP POLICY IF EXISTS orcamento_delete_rascunho ON orcamentos;

-- Preserva o tipo atual com sufixo _old para permitir o cast via CASE
ALTER TYPE orcamento_status RENAME TO orcamento_status_old;

-- Cria o novo enum com a lista final de status (5 valores)
CREATE TYPE orcamento_status AS ENUM (
  'rascunho',
  'enviado',
  'salvo',
  'pedido_fechado',
  'cancelado'
);

-- Converte a coluna mapeando 'finalizado' → 'salvo' e mantendo os demais
-- valores compatíveis. DROP DEFAULT é obrigatório porque o default antigo
-- referencia o tipo antigo; restauramos logo depois apontando para o novo.
ALTER TABLE orcamentos
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE orcamento_status USING (
    CASE status::text
      WHEN 'finalizado' THEN 'salvo'
      ELSE status::text
    END
  )::orcamento_status,
  ALTER COLUMN status SET DEFAULT 'rascunho'::orcamento_status;

-- Tipo antigo já não tem dependentes — seguro descartar
DROP TYPE orcamento_status_old;

-- Recria a política de delete de rascunho referenciando o novo enum
CREATE POLICY orcamento_delete_rascunho ON orcamentos
  FOR DELETE USING (
    status = 'rascunho' AND
    EXISTS (
      SELECT 1 FROM carpinteiros c
      WHERE c.id = orcamentos.carpinteiro_id
        AND c.user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────
-- 2) orcamentos — custos extras invisíveis no PDF
-- ──────────────────────────────────────────
-- deslocamento e custos_adicionais entram na base do total cobrado do
-- cliente, mas a UI do PDF deve ocultá-los (regra de negócio reforçada
-- em pdf-document.tsx). Default 0 garante compatibilidade com registros
-- antigos sem precisar de backfill explícito.

ALTER TABLE orcamentos
  ADD COLUMN deslocamento      NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (deslocamento >= 0),
  ADD COLUMN custos_adicionais NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (custos_adicionais >= 0);

-- ──────────────────────────────────────────
-- 3) carpinteiros — novos defaults do perfil
-- ──────────────────────────────────────────
-- cor_primaria: hex usado no header do PDF e na identidade visual da marca.
-- custos_adicionais_padrao: pré-preenche o campo equivalente em novo orçamento.
-- termos_condicoes_padrao: texto base usado como rascunho dos termos.

ALTER TABLE carpinteiros
  ADD COLUMN cor_primaria              TEXT,
  ADD COLUMN custos_adicionais_padrao  NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (custos_adicionais_padrao >= 0),
  ADD COLUMN termos_condicoes_padrao   TEXT;
