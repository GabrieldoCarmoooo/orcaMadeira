-- ============================================================
-- OrçaMadeira — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ──────────────────────────────────────────
-- ENUMS
-- ──────────────────────────────────────────

CREATE TYPE vinculacao_status AS ENUM ('pendente', 'aprovada', 'rejeitada');
CREATE TYPE orcamento_status  AS ENUM ('rascunho', 'finalizado', 'enviado');
CREATE TYPE tipo_projeto       AS ENUM ('movel', 'estrutura');
CREATE TYPE mao_obra_tipo      AS ENUM ('fixo', 'hora');

-- ──────────────────────────────────────────
-- MADEIREIRAS (criada antes para poder ser referenciada)
-- ──────────────────────────────────────────

CREATE TABLE madeireiras (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razao_social TEXT NOT NULL,
  cnpj         TEXT NOT NULL,
  telefone     TEXT NOT NULL,
  endereco     TEXT NOT NULL DEFAULT '',
  cidade       TEXT NOT NULL DEFAULT '',
  estado       CHAR(2) NOT NULL DEFAULT '',
  logo_url     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT madeireiras_user_id_unique UNIQUE (user_id),
  CONSTRAINT madeireiras_cnpj_unique UNIQUE (cnpj)
);

CREATE INDEX idx_madeireiras_user_id ON madeireiras(user_id);

-- ──────────────────────────────────────────
-- CARPINTEIROS
-- ──────────────────────────────────────────

CREATE TABLE carpinteiros (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome                  TEXT NOT NULL,
  cpf_cnpj              TEXT NOT NULL,
  telefone              TEXT NOT NULL,
  endereco              TEXT NOT NULL DEFAULT '',
  cidade                TEXT NOT NULL DEFAULT '',
  estado                CHAR(2) NOT NULL DEFAULT '',
  logo_url              TEXT,
  margem_lucro_padrao   NUMERIC(5,2) NOT NULL DEFAULT 20,
  valor_hora_mao_obra   NUMERIC(10,2) NOT NULL DEFAULT 0,
  imposto_padrao        NUMERIC(5,2) NOT NULL DEFAULT 0,
  madeireira_id         UUID REFERENCES madeireiras(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT carpinteiros_user_id_unique UNIQUE (user_id)
);

CREATE INDEX idx_carpinteiros_user_id ON carpinteiros(user_id);
CREATE INDEX idx_carpinteiros_madeireira_id ON carpinteiros(madeireira_id);

-- ──────────────────────────────────────────
-- VINCULAÇÕES (carpinteiro ↔ madeireira)
-- ──────────────────────────────────────────

CREATE TABLE vinculacoes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carpinteiro_id   UUID NOT NULL REFERENCES carpinteiros(id) ON DELETE CASCADE,
  madeireira_id    UUID NOT NULL REFERENCES madeireiras(id) ON DELETE CASCADE,
  status           vinculacao_status NOT NULL DEFAULT 'pendente',
  solicitado_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  respondido_at    TIMESTAMPTZ,

  CONSTRAINT vinculacoes_unique UNIQUE (carpinteiro_id, madeireira_id)
);

CREATE INDEX idx_vinculacoes_carpinteiro_id ON vinculacoes(carpinteiro_id);
CREATE INDEX idx_vinculacoes_madeireira_id ON vinculacoes(madeireira_id);
CREATE INDEX idx_vinculacoes_status ON vinculacoes(status);

-- ──────────────────────────────────────────
-- TABELAS DE PREÇO (da madeireira)
-- ──────────────────────────────────────────

CREATE TABLE tabelas_preco (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  madeireira_id  UUID NOT NULL REFERENCES madeireiras(id) ON DELETE CASCADE,
  nome           TEXT NOT NULL,
  upload_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ativo          BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_tabelas_preco_madeireira_id ON tabelas_preco(madeireira_id);
CREATE INDEX idx_tabelas_preco_ativo ON tabelas_preco(madeireira_id, ativo);

-- ──────────────────────────────────────────
-- ITENS DE PREÇO
-- ──────────────────────────────────────────

CREATE TABLE itens_preco (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela_id       UUID NOT NULL REFERENCES tabelas_preco(id) ON DELETE CASCADE,
  codigo          TEXT,
  nome            TEXT NOT NULL,
  categoria       TEXT,
  descricao       TEXT,
  unidade         TEXT NOT NULL,
  preco_unitario  NUMERIC(10,2) NOT NULL CHECK (preco_unitario >= 0),
  disponivel      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_itens_preco_tabela_id ON itens_preco(tabela_id);
CREATE INDEX idx_itens_preco_disponivel ON itens_preco(tabela_id, disponivel);

-- ──────────────────────────────────────────
-- ORÇAMENTOS
-- ──────────────────────────────────────────

CREATE TABLE orcamentos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carpinteiro_id        UUID NOT NULL REFERENCES carpinteiros(id) ON DELETE CASCADE,
  madeireira_id         UUID NOT NULL REFERENCES madeireiras(id),
  tabela_snapshot_id    UUID NOT NULL REFERENCES tabelas_preco(id),
  status                orcamento_status NOT NULL DEFAULT 'rascunho',
  tipo_projeto          tipo_projeto NOT NULL,
  nome                  TEXT NOT NULL,
  descricao             TEXT,
  -- cliente
  cliente_nome          TEXT NOT NULL,
  cliente_telefone      TEXT,
  cliente_email         TEXT,
  -- financeiro (snapshot da criação)
  mao_obra_tipo         mao_obra_tipo NOT NULL DEFAULT 'fixo',
  mao_obra_valor        NUMERIC(10,2) NOT NULL DEFAULT 0,
  mao_obra_horas        NUMERIC(6,2),
  margem_lucro          NUMERIC(5,2) NOT NULL DEFAULT 0,
  imposto               NUMERIC(5,2) NOT NULL DEFAULT 0,
  validade_dias         INTEGER NOT NULL DEFAULT 30,
  termos_condicoes      TEXT,
  -- totais desnormalizados
  subtotal_materiais    NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal_mao_obra     NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_margem          NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_imposto         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total                 NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalizado_at         TIMESTAMPTZ
);

CREATE INDEX idx_orcamentos_carpinteiro_id ON orcamentos(carpinteiro_id);
CREATE INDEX idx_orcamentos_status ON orcamentos(carpinteiro_id, status);
CREATE INDEX idx_orcamentos_created_at ON orcamentos(carpinteiro_id, created_at DESC);

-- ──────────────────────────────────────────
-- ITENS DE ORÇAMENTO
-- ──────────────────────────────────────────

CREATE TABLE itens_orcamento (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id    UUID NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  item_preco_id   UUID NOT NULL REFERENCES itens_preco(id),
  -- snapshot do preço no momento da adição
  nome            TEXT NOT NULL,
  unidade         TEXT NOT NULL,
  preco_unitario  NUMERIC(10,2) NOT NULL,
  quantidade      NUMERIC(10,3) NOT NULL CHECK (quantidade > 0),
  subtotal        NUMERIC(12,2) NOT NULL
);

CREATE INDEX idx_itens_orcamento_orcamento_id ON itens_orcamento(orcamento_id);

-- ──────────────────────────────────────────
-- TRIGGER: updated_at automático
-- ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER carpinteiros_updated_at
  BEFORE UPDATE ON carpinteiros
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER madeireiras_updated_at
  BEFORE UPDATE ON madeireiras
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER orcamentos_updated_at
  BEFORE UPDATE ON orcamentos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────
-- RLS (Row Level Security)
-- ──────────────────────────────────────────

ALTER TABLE carpinteiros     ENABLE ROW LEVEL SECURITY;
ALTER TABLE madeireiras      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vinculacoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabelas_preco    ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_preco      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_orcamento  ENABLE ROW LEVEL SECURITY;

-- ── carpinteiros ──

CREATE POLICY carpinteiro_select_own ON carpinteiros
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY carpinteiro_insert_own ON carpinteiros
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY carpinteiro_update_own ON carpinteiros
  FOR UPDATE USING (auth.uid() = user_id);

-- ── madeireiras ──

CREATE POLICY madeireira_select_own ON madeireiras
  FOR SELECT USING (auth.uid() = user_id);

-- carpinteiros vinculados podem ver o perfil da madeireira
CREATE POLICY madeireira_select_vinculado ON madeireiras
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vinculacoes v
      JOIN carpinteiros c ON c.id = v.carpinteiro_id
      WHERE v.madeireira_id = madeireiras.id
        AND v.status = 'aprovada'
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY madeireira_insert_own ON madeireiras
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY madeireira_update_own ON madeireiras
  FOR UPDATE USING (auth.uid() = user_id);

-- ── vinculacoes ──

CREATE POLICY vinculacao_select_carpinteiro ON vinculacoes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM carpinteiros c WHERE c.id = vinculacoes.carpinteiro_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY vinculacao_select_madeireira ON vinculacoes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM madeireiras m WHERE m.id = vinculacoes.madeireira_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY vinculacao_insert_carpinteiro ON vinculacoes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM carpinteiros c WHERE c.id = vinculacoes.carpinteiro_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY vinculacao_update_madeireira ON vinculacoes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM madeireiras m WHERE m.id = vinculacoes.madeireira_id AND m.user_id = auth.uid()
    )
  );

-- ── tabelas_preco ──

CREATE POLICY tabela_preco_madeireira ON tabelas_preco
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM madeireiras m WHERE m.id = tabelas_preco.madeireira_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY tabela_preco_vinculados_ver ON tabelas_preco
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vinculacoes v
      JOIN carpinteiros c ON c.id = v.carpinteiro_id
      WHERE v.madeireira_id = tabelas_preco.madeireira_id
        AND v.status = 'aprovada'
        AND c.user_id = auth.uid()
    )
  );

-- ── itens_preco ──

CREATE POLICY itens_preco_madeireira ON itens_preco
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tabelas_preco tp
      JOIN madeireiras m ON m.id = tp.madeireira_id
      WHERE tp.id = itens_preco.tabela_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY itens_preco_vinculados_ver ON itens_preco
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tabelas_preco tp
      JOIN vinculacoes v ON v.madeireira_id = tp.madeireira_id
      JOIN carpinteiros c ON c.id = v.carpinteiro_id
      WHERE tp.id = itens_preco.tabela_id
        AND v.status = 'aprovada'
        AND c.user_id = auth.uid()
    )
  );

-- ── orcamentos ──

CREATE POLICY orcamento_select_own ON orcamentos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM carpinteiros c WHERE c.id = orcamentos.carpinteiro_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY orcamento_insert_own ON orcamentos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM carpinteiros c WHERE c.id = orcamentos.carpinteiro_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY orcamento_update_own ON orcamentos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM carpinteiros c WHERE c.id = orcamentos.carpinteiro_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY orcamento_delete_rascunho ON orcamentos
  FOR DELETE USING (
    status = 'rascunho' AND
    EXISTS (
      SELECT 1 FROM carpinteiros c WHERE c.id = orcamentos.carpinteiro_id AND c.user_id = auth.uid()
    )
  );

-- ── itens_orcamento ──

CREATE POLICY itens_orcamento_own ON itens_orcamento
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orcamentos o
      JOIN carpinteiros c ON c.id = o.carpinteiro_id
      WHERE o.id = itens_orcamento.orcamento_id AND c.user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────
-- STORAGE — bucket "logos"
-- ──────────────────────────────────────────
-- Run these in the Supabase dashboard SQL editor or via CLI:
--
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('logos', 'logos', true)
--   ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY logos_public_read ON storage.objects
--   FOR SELECT USING (bucket_id = 'logos');
--
-- CREATE POLICY logos_auth_upload ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'logos' AND auth.role() = 'authenticated'
--   );
--
-- CREATE POLICY logos_owner_update ON storage.objects
--   FOR UPDATE USING (
--     bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- CREATE POLICY logos_owner_delete ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]
--   );
