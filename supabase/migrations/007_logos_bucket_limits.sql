-- ──────────────────────────────────────────────────────────────────────────────
-- Migration 007 — Limites server-side no bucket "logos"
--
-- Contexto (ISSUE-023): o bucket foi criado sem file_size_limit nem
-- allowed_mime_types. A validação existe apenas no frontend (logo-uploader.tsx)
-- e pode ser bypassada por chamadas diretas à API do Supabase Storage.
-- Esta migration adiciona as restrições no servidor para que o próprio Storage
-- rejeite qualquer upload fora das regras, independente do cliente.
--
-- Limites definidos:
--   • file_size_limit : 2 MB (= 2 × 1024 × 1024 bytes)
--   • allowed_mime_types: image/jpeg, image/png, image/webp
--
-- A migration é idempotente: o UPDATE não falha se já estiver aplicado.
-- ──────────────────────────────────────────────────────────────────────────────

UPDATE storage.buckets
SET
  file_size_limit   = 2097152,                                         -- 2 × 1024 × 1024
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'logos';
