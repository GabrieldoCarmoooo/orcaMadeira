-- ============================================================
-- OrçaMadeira — Permitir DELETE de orçamento em qualquer status
-- Migration: 004_orcamento_delete_any_status.sql
-- ============================================================
-- Contexto:
--   A política original `orcamento_delete_rascunho` restringia DELETE a
--   orçamentos com status = 'rascunho'. Com a nova UX (kebab menu +
--   botão excluir no detalhe), o carpinteiro precisa poder remover
--   orçamentos em qualquer status. Sem essa mudança, o DELETE é
--   silenciosamente filtrado pelo RLS (0 linhas afetadas, sem erro).
-- ============================================================

DROP POLICY IF EXISTS orcamento_delete_rascunho ON orcamentos;

-- Permite ao dono excluir qualquer orçamento próprio independente do status
CREATE POLICY orcamento_delete_own ON orcamentos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM carpinteiros c
      WHERE c.id = orcamentos.carpinteiro_id
        AND c.user_id = auth.uid()
    )
  );
