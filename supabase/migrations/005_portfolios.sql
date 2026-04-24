-- ============================================================
-- OrçaMadeira — Portfólio compartilhável do carpinteiro
-- Migration: 005_portfolios.sql
-- ============================================================
-- Mudanças cobertas:
--   1) Tabela `portfolios`: portfólio público do carpinteiro identificado
--      por slug único (URL amigável /p/{slug}).
--   2) Tabela `portfolio_arquivos`: arquivos (imagens/PDFs) vinculados
--      a um portfólio, com limpeza automática via ON DELETE CASCADE.
--   3) Bucket de storage `portfolios` (público): arquivos acessíveis
--      sem autenticação para suportar link compartilhável via WhatsApp.
--   4) RLS em ambas as tabelas:
--      - Dono: FOR ALL via auth.uid() = carpinteiros.user_id
--      - Público: FOR SELECT USING true (portfólio é compartilhável)
--   5) Políticas de storage:
--      - Dono: INSERT/UPDATE/DELETE no caminho {carpinteiro_id}/...
--      - Público: SELECT sem restrição no bucket
--
-- Convenção de caminho no bucket:
--   {carpinteiro_id}/{portfolio_id}/{nome_arquivo}
--   O primeiro segmento identifica o dono para fins de RLS.
-- ============================================================

-- ──────────────────────────────────────────
-- 1) Tabela portfolios
-- ──────────────────────────────────────────
-- Slug opcional gerado no cliente (ex.: nanoid 8 chars);
-- permite URL pública amigável sem expor o UUID.

CREATE TABLE portfolios (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  carpinteiro_id  UUID        NOT NULL REFERENCES carpinteiros(id) ON DELETE CASCADE,
  nome            TEXT        NOT NULL,
  slug            TEXT        UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portfolios_carpinteiro_id ON portfolios(carpinteiro_id);
CREATE INDEX idx_portfolios_slug           ON portfolios(slug);

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Dono pode criar, ler, editar e excluir seus próprios portfólios
CREATE POLICY portfolio_all_owner ON portfolios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM carpinteiros c
      WHERE c.id = portfolios.carpinteiro_id
        AND c.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM carpinteiros c
      WHERE c.id = portfolios.carpinteiro_id
        AND c.user_id = auth.uid()
    )
  );

-- Qualquer visitante (inclusive anônimo) pode visualizar portfólios públicos
CREATE POLICY portfolio_select_public ON portfolios
  FOR SELECT USING (true);

-- ──────────────────────────────────────────
-- 2) Tabela portfolio_arquivos
-- ──────────────────────────────────────────
-- ON DELETE CASCADE garante limpeza automática dos arquivos quando o
-- portfólio pai for removido. `ordem` permite reordenação visual.

CREATE TABLE portfolio_arquivos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id  UUID        NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  tipo          TEXT        NOT NULL CHECK (tipo IN ('imagem', 'pdf')),
  storage_path  TEXT        NOT NULL,
  ordem         INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portfolio_arquivos_portfolio_id ON portfolio_arquivos(portfolio_id);

ALTER TABLE portfolio_arquivos ENABLE ROW LEVEL SECURITY;

-- Dono do portfólio pode gerenciar arquivos (resolve ownership via JOIN ao portfólio pai)
CREATE POLICY portfolio_arquivo_all_owner ON portfolio_arquivos
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM portfolios p
      JOIN carpinteiros c ON c.id = p.carpinteiro_id
      WHERE p.id = portfolio_arquivos.portfolio_id
        AND c.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM portfolios p
      JOIN carpinteiros c ON c.id = p.carpinteiro_id
      WHERE p.id = portfolio_arquivos.portfolio_id
        AND c.user_id = auth.uid()
    )
  );

-- Público pode visualizar arquivos de qualquer portfólio
CREATE POLICY portfolio_arquivo_select_public ON portfolio_arquivos
  FOR SELECT USING (true);

-- ──────────────────────────────────────────
-- 3) Bucket de storage `portfolios`
-- ──────────────────────────────────────────
-- Bucket público: URLs acessíveis sem token para funcionar
-- corretamente ao compartilhar via WhatsApp.
-- Limite por arquivo: 50 MB. MIME types: imagens comuns + PDF.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolios',
  'portfolios',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Permite ao dono fazer upload no caminho iniciado com seu carpinteiro_id
-- O primeiro segmento do path ({carpinteiro_id}/...) é usado para validar ownership.
CREATE POLICY portfolios_storage_insert_owner ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'portfolios' AND
    auth.uid() = (
      SELECT c.user_id
      FROM carpinteiros c
      WHERE c.id = (storage.foldername(name))[1]::uuid
    )
  );

-- Permite ao dono atualizar metadados de seus próprios arquivos
CREATE POLICY portfolios_storage_update_owner ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'portfolios' AND
    auth.uid() = (
      SELECT c.user_id
      FROM carpinteiros c
      WHERE c.id = (storage.foldername(name))[1]::uuid
    )
  );

-- Permite ao dono excluir seus próprios arquivos
CREATE POLICY portfolios_storage_delete_owner ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'portfolios' AND
    auth.uid() = (
      SELECT c.user_id
      FROM carpinteiros c
      WHERE c.id = (storage.foldername(name))[1]::uuid
    )
  );

-- Qualquer pessoa pode ler/baixar arquivos do bucket público
CREATE POLICY portfolios_storage_select_public ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolios');
