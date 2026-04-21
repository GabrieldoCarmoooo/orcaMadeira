-- ============================================================
-- OrçaMadeira — Catálogo Relacional de Produtos
-- Migration: 002_catalogo_produtos.sql
-- ============================================================
-- Tabelas novas: especies_madeira, madeiras_m3, outros_produtos,
-- servicos_acabamento, comprimentos_madeira_m3.
-- ============================================================

-- ──────────────────────────────────────────
-- ESPÉCIES DE MADEIRA
-- Base de precificação: custo por m³ + margem
-- O valor de venda é calculado: custo_m3 * (1 + margem_lucro_pct / 100)
-- ──────────────────────────────────────────

CREATE TABLE especies_madeira (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  madeireira_id    UUID NOT NULL REFERENCES madeireiras(id) ON DELETE CASCADE,
  nome             TEXT NOT NULL,
  custo_m3         NUMERIC(10,2) NOT NULL CHECK (custo_m3 > 0),
  margem_lucro_pct NUMERIC(5,2)  NOT NULL DEFAULT 0 CHECK (margem_lucro_pct >= 0),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Each madeireira can have only one species with the same name (case-insensitive)
CREATE UNIQUE INDEX especies_madeira_nome_uniq
  ON especies_madeira (madeireira_id, lower(nome));

-- ──────────────────────────────────────────
-- MADEIRAS M³
-- Produtos de madeira que referenciam uma espécie para herdar o valor de venda
-- ──────────────────────────────────────────

CREATE TABLE madeiras_m3 (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  madeireira_id  UUID         NOT NULL REFERENCES madeireiras(id) ON DELETE CASCADE,
  especie_id     UUID         NOT NULL REFERENCES especies_madeira(id),
  nome           TEXT         NOT NULL,
  espessura_cm   NUMERIC(6,2) NOT NULL CHECK (espessura_cm > 0),
  largura_cm     NUMERIC(6,2) NOT NULL CHECK (largura_cm > 0),
  comprimento_m  NUMERIC(6,2) NOT NULL DEFAULT 1 CHECK (comprimento_m > 0),
  disponivel     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Fast lookup of all lumber products belonging to a given species
CREATE INDEX madeiras_m3_especie_idx ON madeiras_m3 (especie_id);

-- ──────────────────────────────────────────
-- OUTROS PRODUTOS
-- Itens de preço fixo e unidade livre (parafuso, prego, telha, etc.)
-- Não dependem de espécie nem de dimensões — preço já é o de venda ao carpinteiro.
-- ──────────────────────────────────────────

CREATE TABLE outros_produtos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  madeireira_id   UUID           NOT NULL REFERENCES madeireiras(id) ON DELETE CASCADE,
  nome            TEXT           NOT NULL,
  unidade         TEXT           NOT NULL,
  preco_unitario  NUMERIC(10,2)  NOT NULL CHECK (preco_unitario >= 0),
  descricao       TEXT,
  disponivel      BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- SERVIÇOS DE ACABAMENTO
-- Modificadores percentuais aplicáveis a itens de madeira no orçamento.
-- preco_final = preco_base * (1 + percentual_acrescimo / 100).
-- ──────────────────────────────────────────

CREATE TABLE servicos_acabamento (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  madeireira_id        UUID          NOT NULL REFERENCES madeireiras(id) ON DELETE CASCADE,
  nome                 TEXT          NOT NULL,
  percentual_acrescimo NUMERIC(5,2)  NOT NULL CHECK (percentual_acrescimo >= 0),
  ativo                BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- COMPRIMENTOS DISPONÍVEIS POR MADEIRA M³
-- Relação 1:N com madeiras_m3 (fiel ao SISMASTER "Vários Comprimentos").
-- Estoque não é rastreado nesta fase — apenas quais comprimentos estão à venda.
-- ──────────────────────────────────────────

CREATE TABLE comprimentos_madeira_m3 (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  madeira_m3_id  UUID         NOT NULL REFERENCES madeiras_m3(id) ON DELETE CASCADE,
  comprimento_m  NUMERIC(6,2) NOT NULL CHECK (comprimento_m > 0),
  disponivel     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Bloqueia duplicatas: a mesma madeira não pode ter o mesmo comprimento cadastrado duas vezes
CREATE UNIQUE INDEX comprimentos_m3_uniq
  ON comprimentos_madeira_m3 (madeira_m3_id, comprimento_m);

-- Índice parcial para acelerar a busca dos comprimentos atualmente à venda de uma madeira
CREATE INDEX comprimentos_m3_disponivel_idx
  ON comprimentos_madeira_m3 (madeira_m3_id)
  WHERE disponivel = TRUE;

-- ──────────────────────────────────────────
-- TRIGGERS: updated_at automático
-- Reaproveita set_updated_at() da migration 001 (linhas 180-186).
-- comprimentos_madeira_m3 NÃO recebe trigger — não tem coluna updated_at.
-- ──────────────────────────────────────────

CREATE TRIGGER set_updated_at_especies_madeira
  BEFORE UPDATE ON especies_madeira
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_madeiras_m3
  BEFORE UPDATE ON madeiras_m3
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_outros_produtos
  BEFORE UPDATE ON outros_produtos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_servicos_acabamento
  BEFORE UPDATE ON servicos_acabamento
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Segue o mesmo padrão de `tabelas_preco` (migration 001, linhas 278-294):
--   1) a madeireira dona tem acesso total (FOR ALL) às 4 tabelas;
--   2) carpinteiros com vinculação APROVADA podem apenas ler (FOR SELECT).
-- `comprimentos_madeira_m3` é tratado na migration seguinte (ISSUE-005) porque
-- não possui `madeireira_id` direto — o acesso é resolvido via JOIN em `madeiras_m3`.
-- ============================================================

-- Habilita RLS nas 4 tabelas com madeireira_id direto
ALTER TABLE especies_madeira     ENABLE ROW LEVEL SECURITY;
ALTER TABLE madeiras_m3          ENABLE ROW LEVEL SECURITY;
ALTER TABLE outros_produtos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_acabamento  ENABLE ROW LEVEL SECURITY;

-- ── especies_madeira ──

-- A madeireira dona (dono do cadastro) tem controle total sobre suas espécies
CREATE POLICY especies_madeira_madeireira_all ON especies_madeira
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM madeireiras m
      WHERE m.id = especies_madeira.madeireira_id
        AND m.user_id = auth.uid()
    )
  );

-- Carpinteiros com vínculo aprovado podem ler o catálogo para precificar orçamentos
CREATE POLICY especies_madeira_vinculados_select ON especies_madeira
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vinculacoes v
      JOIN carpinteiros c ON c.id = v.carpinteiro_id
      WHERE v.madeireira_id = especies_madeira.madeireira_id
        AND v.status = 'aprovada'
        AND c.user_id = auth.uid()
    )
  );

-- ── madeiras_m3 ──

-- Acesso total da madeireira dona às suas madeiras dimensionadas
CREATE POLICY madeiras_m3_madeireira_all ON madeiras_m3
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM madeireiras m
      WHERE m.id = madeiras_m3.madeireira_id
        AND m.user_id = auth.uid()
    )
  );

-- Leitura liberada para carpinteiros vinculados e aprovados
CREATE POLICY madeiras_m3_vinculados_select ON madeiras_m3
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vinculacoes v
      JOIN carpinteiros c ON c.id = v.carpinteiro_id
      WHERE v.madeireira_id = madeiras_m3.madeireira_id
        AND v.status = 'aprovada'
        AND c.user_id = auth.uid()
    )
  );

-- ── outros_produtos ──

-- Controle total da madeireira dona sobre os itens de preço fixo
CREATE POLICY outros_produtos_madeireira_all ON outros_produtos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM madeireiras m
      WHERE m.id = outros_produtos.madeireira_id
        AND m.user_id = auth.uid()
    )
  );

-- Carpinteiros aprovados podem consultar os demais produtos disponíveis
CREATE POLICY outros_produtos_vinculados_select ON outros_produtos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vinculacoes v
      JOIN carpinteiros c ON c.id = v.carpinteiro_id
      WHERE v.madeireira_id = outros_produtos.madeireira_id
        AND v.status = 'aprovada'
        AND c.user_id = auth.uid()
    )
  );

-- ── servicos_acabamento ──

-- Acesso total da madeireira dona sobre seus modificadores de acabamento
CREATE POLICY servicos_acabamento_madeireira_all ON servicos_acabamento
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM madeireiras m
      WHERE m.id = servicos_acabamento.madeireira_id
        AND m.user_id = auth.uid()
    )
  );

-- Carpinteiros aprovados podem listar os acabamentos para aplicá-los no orçamento
CREATE POLICY servicos_acabamento_vinculados_select ON servicos_acabamento
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vinculacoes v
      JOIN carpinteiros c ON c.id = v.carpinteiro_id
      WHERE v.madeireira_id = servicos_acabamento.madeireira_id
        AND v.status = 'aprovada'
        AND c.user_id = auth.uid()
    )
  );

-- ── comprimentos_madeira_m3 ──
-- Esta tabela não possui madeireira_id direto: o ownership é resolvido via JOIN
-- em madeiras_m3 → madeireiras. O padrão é o mesmo; apenas o caminho de acesso difere.

ALTER TABLE comprimentos_madeira_m3 ENABLE ROW LEVEL SECURITY;

-- A madeireira dona controla os comprimentos de seus produtos (resolve ownership via madeiras_m3)
CREATE POLICY comprimentos_m3_madeireira_all ON comprimentos_madeira_m3
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM madeiras_m3 mm
      JOIN madeireiras m ON m.id = mm.madeireira_id
      WHERE mm.id = comprimentos_madeira_m3.madeira_m3_id
        AND m.user_id = auth.uid()
    )
  );

-- Carpinteiros vinculados e aprovados podem ler comprimentos para exibir no Select do orçamento
CREATE POLICY comprimentos_m3_vinculados_select ON comprimentos_madeira_m3
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM madeiras_m3 mm
      JOIN vinculacoes v  ON v.madeireira_id = mm.madeireira_id
      JOIN carpinteiros c ON c.id = v.carpinteiro_id
      WHERE mm.id = comprimentos_madeira_m3.madeira_m3_id
        AND v.status = 'aprovada'
        AND c.user_id = auth.uid()
    )
  );

-- ============================================================
-- ALTER TABLE itens_orcamento
-- Estende os itens de orçamento para suportar as 3 origens de catálogo:
--   'legado_planilha' — fluxo atual via item_preco_id (NOT NULL hoje, vira nullable)
--   'madeira_m3'      — novo catálogo relacional de madeiras dimensionadas
--   'outro_produto'   — novo catálogo relacional de produtos de preço fixo
-- Default 'legado_planilha' garante que todos os registros existentes
-- continuem válidos sem nenhum backfill.
-- ============================================================

ALTER TABLE itens_orcamento
  -- item_preco_id deixa de ser obrigatório: pode ser NULL quando o item vem
  -- do catálogo relacional (madeira_m3 ou outro_produto)
  ALTER COLUMN item_preco_id DROP NOT NULL,

  -- Discriminante de origem: valores válidos são reforçados pelo constraint composto ao final.
  -- O CHECK inline foi omitido intencionalmente para evitar conflito de nome com
  -- itens_orcamento_origem_check (PostgreSQL nomearia ambos com o mesmo padrão {tabela}_{coluna}_check).
  ADD COLUMN origem TEXT NOT NULL DEFAULT 'legado_planilha',

  -- FK para o catálogo relacional (NULL quando origem = 'legado_planilha')
  ADD COLUMN madeira_m3_id    UUID REFERENCES madeiras_m3(id),
  ADD COLUMN outro_produto_id UUID REFERENCES outros_produtos(id),

  -- Snapshots de contexto gravados no momento de adicionar o item ao orçamento.
  -- Congelam as dimensões e a espécie mesmo que a madeireira edite o catálogo depois.
  ADD COLUMN especie_nome        TEXT,
  ADD COLUMN espessura_cm        NUMERIC(6,2),
  ADD COLUMN largura_cm          NUMERIC(6,2),
  ADD COLUMN comprimento_real_m  NUMERIC(6,2),
  ADD COLUMN comprimento_id      UUID REFERENCES comprimentos_madeira_m3(id),

  -- Snapshot do acabamento aplicado (percentual e nome congelados na seleção)
  ADD COLUMN acabamento_id         UUID REFERENCES servicos_acabamento(id),
  ADD COLUMN acabamento_nome       TEXT,
  ADD COLUMN acabamento_percentual NUMERIC(5,2),

  -- Garante coerência entre a origem e a FK correspondente.
  -- Orçamentos legados passam porque item_preco_id IS NOT NULL + origem = 'legado_planilha'.
  ADD CONSTRAINT itens_orcamento_origem_check CHECK (
    (origem = 'legado_planilha' AND item_preco_id    IS NOT NULL) OR
    (origem = 'madeira_m3'      AND madeira_m3_id    IS NOT NULL) OR
    (origem = 'outro_produto'   AND outro_produto_id IS NOT NULL)
  );
