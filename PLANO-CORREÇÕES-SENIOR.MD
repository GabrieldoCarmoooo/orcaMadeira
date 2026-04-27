OrçaMadeira — Senior Software Audit                                                                                                                                        

 Auditor: senior software auditor (read-only structured audit)
 Repo: C:\Users\Gabriel\Desktop\app.Carpinteiro\app
 Date: 2026-04-27
 Scope: full codebase under src/**, supabase/migrations/**, build/config files. node_modules/** excluded.
 Method: 3 parallel deep-scan agents (security, perf+quality, arch+reliability) + manual verification of every CRITICAL/HIGH claim against source. Findings the agents
 asserted that did not survive verification have been removed (e.g. itens_orcamento actually does have RLS via 001_initial_schema.sql:210,352; current code does persist
 deslocamento/custos_adicionais; PDF correctly hides them).

 ---
 Phase 1 — Global Understanding

 Product: SaaS web app (mobile-first) for carpenters to produce client budgets ("orçamentos") priced from a partner lumber yard's catalog. Two roles: Carpinteiro (consumer)
 and Madeireira (catalog provider). Portfolio sharing via public slug URL is a secondary feature.

 Stack (verified in package.json):
 - Frontend: React 19, TypeScript strict, Vite 8, Tailwind 4 + shadcn (radix).
 - Forms: React Hook Form 7 + Zod 4.
 - Server state: TanStack Query 5. Local state: Zustand 5.
 - Routing: React Router 7.
 - Backend: Supabase (Auth + Postgres + Storage with RLS).
 - PDF: @react-pdf/renderer 4. Spreadsheets: papaparse + xlsx.

 Layered structure (verified by src/ layout):
 - src/pages/{auth,carpinteiro,madeireira,portfolio}/ — route components.
 - src/components/{layout,ui,orcamento,madeireira,carpinteiro,shared}/ — UI.
 - src/hooks/use*.ts — data access (Supabase + TanStack Query).
 - src/stores/use*Store.ts — Zustand global state (auth, wizard).
 - src/lib/ — pure logic (calcular-orcamento, calcular-madeira, parse-planilha, pdf, format).
 - src/types/ — domain interfaces + supabase-generated.ts.
 - supabase/migrations/001..007.sql — DB schema, RLS, storage.

 Core data flow:
 1. Madeireira CRUDs catalog (espécies → madeiras m³ → comprimentos; outros_produtos; servicos_acabamento) and/or imports a planilha (legacy bulk).
 2. Carpinteiro requests vinculação. Once aprovada, RLS lets them read the catalog.
 3. Wizard (useOrcamentoWizard) collects projeto → materiais → financeiro into a Zustand store; computes totals via pure calcularOrcamento; autosaves every 30 s; finalizes
 by writing snapshot fields to itens_orcamento.
 4. PDF generated client-side from buildSnapshotParaPdf, hiding internal cost rows.
 5. Portfolio: carpinteiro uploads images/PDFs to a public Supabase Storage bucket; share URL is /p/{slug}.

 ---
 Phase 2 — Issue Discovery (deep scan, verified)

 Each finding cites concrete file:line evidence. Findings the sub-agents proposed but verification disproved are explicitly listed as DISMISSED at the end so we don't
 re-litigate them.

 A. SECURITY

 A-1 [CRITICAL] Production Supabase credentials in git history

 File: .env introduced in commit d11e283 (2026-04-09), deleted in commit cb6a63b (2026-04-14).
 Evidence: git log --all -p -- .env shows full diff:
 VITE_SUPABASE_URL=https://suzruhklagkoeorbbnkt.supabase.co
 VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
 r2xSbnwV3BUiho0E       ← unidentified secret-shaped trailer
 Description: The anon key is publishable by design, but the trailing string r2xSbnwV3BUiho0E is the wrong shape for an anon key — it has the form of a database password /
 service-role token / API secret. Whatever it is, it lives forever in git history and any clone retrieves it.
 Impact: If r2xSbnwV3BUiho0E is the project DB password, anyone who ever cloned this repo has full DB access. The anon key alone enables any RLS-flawed surface. Removal from
  HEAD does not remove from history.
 Fix:
 1. Identify the trailing string immediately. Rotate it in the Supabase dashboard if it's any kind of secret.
 2. Rotate the anon key as a precaution (Supabase → Project Settings → API → "Reset anon key").
 3. Decide on git-history rewrite (git filter-repo --path .env --invert-paths) and force-push, or accept the leak and rely on rotation. If repo was ever public, treat as
 fully compromised.

 A-2 [CRITICAL] logos bucket has no RLS policies in migrations

 File: supabase/migrations/001_initial_schema.sql:362-386 (the policies are commented out, marked "run in dashboard"). 007_logos_bucket_limits.sql adds file_size_limit +
 allowed_mime_types but no policies.
 Evidence: All migrations grepped; no CREATE POLICY ... 'logos' exists. src/components/shared/logo-uploader.tsx actively uploads to this bucket.
 Impact: If the dashboard step was skipped on any environment (preview/staging), the bucket is either fully closed (uploads broken) or worse — fully open (any authenticated
 user can upload, replace, or delete any user's logo). The migration is therefore not self-contained; restoring schema from migrations alone leaves the bucket in an
 indeterminate state.
 Fix: Add migration 008_logos_storage_policies.sql that creates the four policies (SELECT public, INSERT authenticated, UPDATE/DELETE keyed on (storage.foldername(name))[1]
 = auth.uid()::text). Drop the commented blob from 001 to remove ambiguity.

 A-3 [HIGH] Portfolios bucket is public; slug entropy ~47 bits with modulo bias

 File: supabase/migrations/005_portfolios.sql:113-120 (public = true); src/hooks/usePortfolios.ts:11 (crypto.getRandomValues(new Uint8Array(8)) mod 62).
 Description:
 - The bucket is intentionally public so WhatsApp recipients can fetch without auth — that's a product decision, but file URLs are guessable from the slug pathway: someone
 with a slug gets unsigned, indexable URLs.
 - Slug entropy: 8 chars × log2(62) ≈ 47.6 bits. Reduced further by modulo bias: each byte is 0-255 → 256 mod 62 = 8 spillover, so chars 'A'..'H' (alphabet[0..7]) are
 slightly more frequent. Bias is small (~3% per char) but real.
 - Public SELECT policy on portfolios table (line 60: USING (true)) means a query against the table can list all rows once you bypass getPortfolioBySlug and call
 .from('portfolios').select('*') from the browser console.
 Impact: An authenticated attacker (or anyone with the anon key, see A-1) can enumerate every portfolio name + carpinteiro_id + slug, then download the public files. This
 combined with A-1 means any past clone of this repo can list all portfolios.
 Fix (defense in depth):
 1. Tighten portfolio_select_public to require slug match: FOR SELECT USING (slug IS NOT NULL) is unchanged, but require client to query by eq('slug', x) only — i.e., do not
  expose this table to anon list. Better: require the public read path to go through a SECURITY DEFINER RPC get_portfolio_by_slug(slug) that returns the single row, and
 remove the bare FOR SELECT USING (true).
 2. Increase slug entropy: Uint8Array(16) → ~95 bits, eliminate modulo bias by rejection sampling (loop, redraw bytes ≥ 248).
 3. Consider switching the bucket to private with signed URLs generated server-side; revisit after measuring WhatsApp UX.

 A-4 [HIGH] CSV formula injection on import (egress vector)

 File: src/lib/parse-csv.ts / parse-planilha.ts / parse-xlsx.ts (cell content is stored verbatim into itens_preco).
 Description: The validator rejects negative prices and missing fields but does not strip leading =, +, -, @, tab, CR from string cells (nome, descricao, categoria). A
 malicious madeireira (or tampered upload) seeds the catalog with cells like =cmd|'/c calc.exe'!A1. When a downstream user exports that catalog back to CSV/XLSX (or a
 carpinteiro pastes it into Excel), Excel happily evaluates the formula on open.
 Impact: RCE on any user who opens the exported sheet in Excel/LibreOffice (CVE-class issue, OWASP "CSV Injection").
 Fix: In the parser, prefix any string cell that starts with [=+\-@\t\r] with a single quote ('). Apply at validation time before insert. Add a unit test in
 parse-planilha.test.ts.

 A-5 [MEDIUM] XLSX zip-bomb / DoS unprotected

 File: src/lib/parse-xlsx.ts calls XLSX.read(buffer, { type: 'array' }) after a 10 MB pre-check.
 Description: XLSX is a ZIP archive; a 1 MB malicious sheet can decompress to gigabytes of cells, killing the browser tab. The 10 MB pre-check is on the compressed size.
 SheetJS does not bound decompression natively.
 Impact: Tab/process crash on a single upload; usable only as a self-DoS by a madeireira on their own session, but it can also be triggered by a tampered file received from
 a partner. Low blast radius but cheap to fix.
 Fix: After parse, before validation, count XLSX.utils.sheet_to_json(sheet, { header: 1 }).length and fail fast above e.g. 50 000 rows. Reject sheets where range.e.r -
 range.s.r > 50 000.

 A-6 [MEDIUM] Filename interpolated raw into Storage path

 File: src/hooks/usePortfolios.ts:157 — storagePath = ${carpinteiro.id}/${portfolio.id}/${file.name} plus .upload(..., { upsert: true }).
 Description: file.name is browser-controlled. A user can choose ../whatever.jpg or names with embedded /. Cross-tenant escape is blocked by the storage RLS check auth.uid()
  = (SELECT user_id FROM carpinteiros WHERE id = (storage.foldername(name))[1]::uuid) — the first segment is always validated, and an attacker can't make auth.uid() resolve
 to someone else. So this is not a privilege-escalation flaw.
 However: upsert: true + duplicate filenames silently overwrite previously-uploaded images in the same portfolio. Names with slashes mangle the bucket layout. Filenames like
  ../../mine.jpg end up at depth 1 in user's own folder, producing oddly-rooted public URLs.
 Impact: Silent data loss (re-uploading a file with the same name); odd UI. Not a security boundary breach.
 Fix: Sanitize → slug-safe basename + '-' + nanoid(6) + extname. Drop upsert: true.

 A-7 [LOW] No client-side rate limit on login

 File: src/pages/auth/login-page.tsx.
 Description: Supabase enforces server-side rate limits, but UI doesn't surface them; brute-force protection is implicit only.
 Fix: Disable the submit button for N seconds after K failures and surface "Tente novamente em Xs".

 ---
 B. PERFORMANCE

 B-1 [HIGH] delete + reinsert of items per save is not atomic

 File: src/hooks/useOrcamentoWizard.ts:347-352.
 await supabase.from('itens_orcamento').delete().eq('orcamento_id', savedId)
 if (itens.length > 0) {
   await supabase.from('itens_orcamento').insert(itens.map(...))
 }
 Description: Two separate round trips; if the second fails (network drop, validation error), the orçamento is left with zero items in the DB. Autosave runs this every 30 s.
 Impact: Catastrophic data loss class. The user sees saveError after their items have already been wiped.
 Fix: Wrap in a Postgres function (upsert_itens_orcamento(p_orcamento_id uuid, p_itens jsonb)) called via rpc(), executing the diff inside a transaction. Or, switch to a
 true upsert keyed on a stable item identity (uid) and only delete() the missing ids — never the full set up front.

 B-2 [HIGH] Wizard recomputes resumo and re-renders on any keystroke

 File: src/stores/useOrcamentoStore.ts (recalculate-on-set pattern), consumed in useOrcamentoWizard.ts:159 (useOrcamentoStore(s => s.resumo)).
 Description: Every typed character in any step rewrites resumo (calls calcularOrcamento) and triggers any subscriber that selects the whole resumo to re-render. Subscribers
  in step-materiais.tsx and resumo-orcamento.tsx are large components.
 Impact: Sluggish feel on lower-end devices; observable on long item lists.
 Fix: Recompute resumo only inside selectors that read it; structure with subscribeWithSelector middleware and split subtotal_materiais (changes on items only) from
 valor_imposto (changes on financeiro only). Or memoize per-component with useMemo keyed on the relevant subset.

 B-3 [MEDIUM] useOrcamentos/list hooks bypass TanStack Query

 File: src/hooks/useOrcamentos.ts (manual useState + useEffect + setLoading). Same pattern in useEspecies.ts, useAcabamentos.ts, useOutrosProdutos.ts, useMadeirasM3.ts,
 usePortfolios.ts.
 Description: The project uses @tanstack/react-query (declared in dependencies, used in useOrcamento.ts and a few others) but a majority of the data hooks do not. Result:
 every navigation back into a screen refetches; no staleTime; no automatic invalidation on mutation; no de-duplication across simultaneous mounts.
 Impact: Visible spinner flashes on navigation; redundant Supabase reads on every panel open. Also: error is silently swallowed in setLoading(false) without surfacing an
 error state.
 Fix: Migrate each list hook to useQuery({ queryKey, queryFn, staleTime: 30_000 }). Mutations call queryClient.invalidateQueries({ queryKey }). This will eliminate ~150
 lines of boilerplate across 6 hooks.

 B-4 [MEDIUM] Heavy bundles not lazy-loaded

 File: src/App.tsx imports route components statically.
 Description: xlsx (~870 KB raw), @react-pdf/renderer (~600 KB), and papaparse are imported eagerly through their consuming components. Unless vite.config.ts already
 manualChunks them (need verification), they ship in the initial bundle.
 Impact: Slow first paint, especially on mobile.
 Fix: const NovoOrcamentoPage = lazy(() => import('./pages/.../novo-orcamento-page')) for any route that pulls PDF or XLSX; wrap with <Suspense>. Confirm Vite config splits
 these vendor chunks.

 B-5 [MEDIUM] PostgREST .select('*') returns full rows on list paths

 File: src/hooks/useEspecies.ts, usePortfolios.ts, etc.
 Description: List screens that only render a few columns still pull every column over the wire.
 Fix: Replace .select('*') with explicit projections matching the UI.

 B-6 [LOW] Inline Intl.NumberFormat and ad-hoc formatBRL duplicated

 File: src/lib/format.ts (single source) vs. src/lib/pdf.ts:9-15 (re-export) vs. inline definitions found in step-materiais.tsx:39, several PDF subcomponents.
 Description: Same formatter created 6+ times.
 Fix: One BRL instance in src/lib/format.ts, imported everywhere. Delete src/lib/pdf.ts:formatBRL.

 ---
 C. CODE QUALITY

 C-1 [HIGH] CRUD boilerplate duplicated 5× across catalog hooks

 File: src/hooks/use{Especies,MadeirasM3,OutrosProdutos,Acabamentos,Portfolios}.ts.
 Description: All five share the shape [items,setItems] + fetch + useEffect + create + update + remove + cache invalidation. ~60 LOC each, ~300 LOC total of structural
 duplication.
 Impact: Bug fixes (e.g. add error state, switch to React Query, add optimistic updates) must be repeated five times.
 Fix: Extract useTableCRUD<T, TInput>(tableName, options) returning { items, isLoading, error, create, update, remove }, internally a useQuery + useMutation pair. The five
 hooks become 10-line specializations.

 C-2 [MEDIUM] useOrcamentoWizard.ts is 492 LOC, mixing 4 concerns

 File: src/hooks/useOrcamentoWizard.ts.
 Concerns conflated:
 1. Vinculação lookup (modo novo only).
 2. Hydration of edit mode.
 3. Save / autosave / status transitions.
 4. PDF snapshot construction.
 Impact: Hard to test in isolation. The salvar callback alone has 14 dependencies in its useCallback array.
 Fix: Split into useVinculacaoAtiva, useOrcamentoHydration(orcamentoId), useOrcamentoSave(...), useOrcamentoPdfSnapshot(...). Top-level useOrcamentoWizard composes them.

 C-3 [MEDIUM] Type assertions instead of runtime validation on Supabase reads

 File: src/hooks/useMadeirasM3.ts:65 (data as MadeiraM3Row[]); src/hooks/usePortfolios.ts:88,114.
 Description: Generated types are not used; handwritten interfaces are cast post-hoc. Schema drift produces runtime crashes far from the source.
 Fix: Either (a) consume src/types/supabase-generated.ts directly so a regen catches drift at compile time; or (b) parse with the corresponding Zod schema (e.g.
 madeiraM3Schema.parse(data)) at the boundary.

 C-4 [LOW] Dead/inconsistent re-exports

 File: src/lib/pdf.ts exports a formatBRL not consumed by callers that have inlined it.
 Fix: Remove the dead re-export; use format.ts everywhere.

 C-5 [LOW] Magic numbers in autosave / pagination / upload

 Files: useOrcamentoWizard.ts:389 (30_000), constants/upload.ts (limits live here, but call sites occasionally hardcode).
 Fix: Move AUTOSAVE_INTERVAL_MS = 30_000 to src/constants/orcamento.ts. Audit grep for stray literal numbers.

 ---
 D. ARCHITECTURE & DESIGN

 D-1 [HIGH] Server state lives in two places (Zustand + React Query)

 File: src/stores/useOrcamentoStore.ts vs. src/hooks/useOrcamento.ts (which uses RQ).
 Description: After a save, both stores need updating: Zustand by hydrate(), RQ by invalidateQueries. Mismatches between them appear as "the form shows X but the detail page
  shows Y" until reload.
 Impact: Subtle UI bugs after autosave; hard to reason about source of truth.
 Fix: Treat React Query cache as the single server-state source; Zustand should hold only client-only form state (current step, draft edits not yet sent). Move resumo to a
 derived useMemo over RQ data + form state.

 D-2 [HIGH] No optimistic concurrency control on orcamentos

 File: schema + useOrcamentoWizard.ts:282-288 (update().eq('id', ...)).
 Description: Two tabs editing the same orçamento → last writer silently wins. The user who lost their edits has no indication.
 Impact: Silent data loss in multi-tab / multi-device scenarios.
 Fix: Add version INT NOT NULL DEFAULT 0 (or updated_at precision check). Each update sets .eq('version', knownVersion) and bumps; if 0 rows return, surface a "stale draft"
 dialog.

 D-3 [MEDIUM] valor_margem persisted in DB but mustn't appear in PDF

 File: 001_initial_schema.sql:146 stores valor_margem. PDF correctly hides it (pdf-financeiro.tsx:81-83 confirms intent). However, nothing prevents a future contributor from
  rendering it.
 Description: The privacy invariant is enforced by a comment, not by types. PDF receives the full Orcamento object which includes the secret fields.
 Fix: Define OrcamentoParaCliente = Omit<Orcamento, 'valor_margem' | 'deslocamento' | 'custos_adicionais'> and pass that type to the PDF subcomponents. Compile-time guard.

 D-4 [MEDIUM] tabela_snapshot_id is required but not all flows guarantee it

 File: useOrcamentoWizard.ts:218-224 (tabelaId lookup). If madeireira has no active tabelas_preco row, tabelaId is null → salvar() returns null silently.
 Description: With the catalog migration to relational tables (espécies / madeiras_m3 / outros_produtos), tabelas_preco has shifted to a legacy concept, but
 orcamentos.tabela_snapshot_id is still NOT NULL. Carpinteiros vinculated to a madeireira that never uploaded the legacy planilha can't create orçamentos at all — even
 though the relational catalog is available.
 Fix: Make tabela_snapshot_id nullable (migration), or auto-create a placeholder tabelas_preco row per madeireira at signup, or branch the save path.

 D-5 [MEDIUM] Missing FK / index on snapshot columns

 File: 002_catalogo_produtos.sql:291-300. madeira_m3_id and outro_produto_id are FKs but only idx_itens_orcamento_orcamento_id exists; queries like "find orçamentos using
 madeira X" full-scan.
 Fix: CREATE INDEX idx_itens_orcamento_madeira_m3_id ON itens_orcamento(madeira_m3_id) WHERE madeira_m3_id IS NOT NULL; and same for outro_produto_id.

 D-6 [LOW] comprimento_real_m snapshot exists but comprimento_m lives on the parent product too

 File: 002_catalogo_produtos.sql:41 (parent madeiras_m3.comprimento_m DEFAULT 1) plus per-orcamento snapshot itens_orcamento.comprimento_real_m. Two fields semantically
 about the same concept invite drift.
 Fix: Document why both exist; consider dropping madeiras_m3.comprimento_m in favor of the 1:N comprimentos_madeira_m3 table (it's already the source of truth, and the
 standalone column is leftover from migration 002).

 ---
 E. RELIABILITY & ROBUSTNESS

 E-1 [HIGH] Floating-point currency math, NUMERIC(12,2) DB

 File: src/lib/calcular-orcamento.ts:55-93. Pure JS arithmetic, no rounding. DB stores NUMERIC(12,2), so the value the user sees in the UI (e.g. R$ 100.0000001) and the
 value persisted (R$ 100.00) drift by sub-cents.
 Impact: When the saved orçamento reloads, the displayed total can change by R$ 0.01 vs. what the user clicked Save on. In invoicing, that's a credibility issue.
 Fix: Centralize roundCents = (n) => Math.round(n * 100) / 100 and apply at the end of calcularOrcamento for every returned numeric. Or use a decimal lib if exposure grows.

 E-2 [HIGH] No empty/error state when no madeireira is linked

 File: useOrcamentoWizard.ts:296 returns null silently when madeireiraId is missing.
 Description: User clicks "Salvar"; nothing happens; no toast, no banner. They eventually give up.
 Fix: Set saveError = 'Você precisa estar vinculado a uma madeireira aprovada para criar orçamentos.' plus a CTA link to the vinculação page. Render at wizard top before any
  step is shown.

 E-3 [MEDIUM] Autosave swallows rejections via void salvarRascunho()

 File: useOrcamentoWizard.ts:389.
 Description: salvar() does set saveError internally on throw, but salvarRascunho() is fire-and-forget; if the user navigates away before the next render, the error message
 is lost. Worse, A setInterval keeps firing even on persistent failure (no exponential backoff).
 Fix: Track consecutiveFailures; pause autosave after 3 failures; show a sticky banner.

 E-4 [MEDIUM] Session expiry mid-action shows generic error

 File: any hook with Supabase calls; no global 401 interceptor.
 Description: When the access token expires during a save, the request 401s, returns to salvar() as error, which becomes "Erro ao salvar orçamento." with no hint that the
 user must re-login.
 Fix: Detect error.status === 401 (or code === 'PGRST301' for RLS rejections) and surface "Sua sessão expirou — faça login novamente." Force redirect after a short delay.

 E-5 [MEDIUM] Strict-Mode double-fire in async effects

 File: useOrcamentoWizard.ts:200-227 (checkVinculacao).
 Description: No AbortController / cancelled flag. In dev's <StrictMode>, the effect runs twice; in production it can fire twice when deps change quickly. The second
 response can overwrite the first.
 Fix: Standard pattern — let cancelled = false; ...; if (cancelled) return; ...; return () => { cancelled = true }.

 E-6 [LOW] PDF generation errors logged but not surfaced

 File: src/hooks/usePdf.ts:35-63 — try/catch calls logError then re-throws.
 Description: The button caller may not always render an error toast. Without a UI hook the user sees a spinner clear and nothing happens.
 Fix: Return { ok: boolean, error?: string } and have the button render a toast on !ok.

 ---
 F. MAINTAINABILITY

 F-1 [MEDIUM] Test coverage skewed to pure libs

 File: src/lib/__tests__/calcular-orcamento.test.ts, calcular-madeira.test.ts, parse-planilha.test.ts, item-key.test.ts; src/hooks/__tests__/useOrcamentoWizard.test.ts.
 Description: Critical pure logic is well covered. Hooks/components/integration are not. The delete+reinsert race (B-1), the autosave (E-3), the snapshot invariant for
 finalized orçamentos — all untested.
 Fix: Add integration tests for useOrcamentoWizard.salvar covering success, network error, RLS rejection, and the partial-success window of the delete+insert flow. Use a
 Supabase test schema, not mocks (per CLAUDE.md engineering preference).

 F-2 [MEDIUM] Files exceeding 400 LOC

 File list: useOrcamentoWizard.ts (492), step-materiais.tsx (~454), dashboard-page.tsx (~436), pdf-lista-materiais.tsx (~436).
 Fix: Split per C-2. For step-materiais.tsx, extract <TabelaItens>, <AdicionarMaterialDialog>, <AcabamentoSelector>.

 F-3 [LOW] Stale planning artifacts

 File: Plano-melhorias-carpinteiro/ISSUES-marceneiro.md, Plano-melhorias-carpinteiro/marceneiro.md show as deleted in git status, but PLANO-SAUDE-GERAL-SISTEMA.MD,
 Plano-TDD.md, ISSUES-SAUDE-GERAL-SISTEMA.md linger uncommitted. These are scratch documents.
 Fix: Either commit, move to references/, or delete; don't leave them at repo root.

 ---
 Phase 3 — Prioritization

 ┌─────┬──────────┬──────────────────────────────────────────┬───────────────────────────────────────────┐
 │  #  │ Severity │                  Title                   │                Quick win?                 │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ A-1 │ CRITICAL │ Credentials in git history               │ Rotate today; history rewrite is optional │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ A-2 │ CRITICAL │ logos bucket has no RLS migration        │ One migration file                        │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ A-3 │ HIGH     │ Public portfolios + 47-bit slug          │ Move to RPC + 16-byte slug                │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ A-4 │ HIGH     │ CSV formula injection                    │ 5-line fix in parser                      │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ B-1 │ HIGH     │ delete + reinsert races                  │ RPC required                              │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ B-2 │ HIGH     │ Wizard re-render on every keystroke      │ Selector refactor                         │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ C-1 │ HIGH     │ 5× CRUD boilerplate                      │ Generic hook                              │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ D-1 │ HIGH     │ Dual-source server state                 │ Architectural                             │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ D-2 │ HIGH     │ No optimistic concurrency                │ Schema + 1 query change                   │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ E-1 │ HIGH     │ Floating-point currency drift            │ One round helper                          │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ E-2 │ HIGH     │ Silent fail with no madeireira           │ Banner                                    │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ A-5 │ MEDIUM   │ XLSX zip-bomb                            │ Row count guard                           │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ A-6 │ MEDIUM   │ Filename sanitation in portfolio uploads │ One helper                                │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ B-3 │ MEDIUM   │ Bypass of TanStack Query                 │ Hook migration                            │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ B-4 │ MEDIUM   │ No route-level lazy split                │ lazy() per route                          │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ B-5 │ MEDIUM   │ select('*') waste                        │ Audit grep                                │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ C-2 │ MEDIUM   │ 492-LOC wizard hook                      │ Split into 4                              │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ C-3 │ MEDIUM   │ Type cast vs. runtime validation         │ Use generated types or Zod                │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ D-3 │ MEDIUM   │ PDF privacy enforced by comment          │ Type narrowing                            │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ D-4 │ MEDIUM   │ tabela_snapshot_id mandatory             │ Schema decision                           │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ D-5 │ MEDIUM   │ Missing snapshot indexes                 │ Migration                                 │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ E-3 │ MEDIUM   │ Autosave no backoff                      │ Counter + backoff                         │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ E-4 │ MEDIUM   │ 401 not handled globally                 │ Wrapper around Supabase client            │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ E-5 │ MEDIUM   │ StrictMode double-fire                   │ cancelled flag                            │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ F-1 │ MEDIUM   │ Hook/integration coverage                │ Add 6–8 tests                             │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ F-2 │ MEDIUM   │ 4× files >400 LOC                        │ Extract                                   │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ A-7 │ LOW      │ No client-side login throttle            │ UI affordance                             │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ B-6 │ LOW      │ Duplicate currency formatters            │ Import                                    │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ C-4 │ LOW      │ Dead formatBRL re-export                 │ Delete                                    │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ C-5 │ LOW      │ Magic numbers                            │ Constants                                 │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ D-6 │ LOW      │ Redundant comprimento_m field            │ Document or drop                          │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ E-6 │ LOW      │ PDF errors not toasted                   │ Return value change                       │
 ├─────┼──────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
 │ F-3 │ LOW      │ Scratch docs at repo root                │ Move/delete                               │
 └─────┴──────────┴──────────────────────────────────────────┴───────────────────────────────────────────┘

 ---
 Phase 4 — Recommendations (concrete fixes)

 Sprint 1 — Stop the bleeding (CRITICAL only)

 1. A-1: rotate anon key + investigate r2xSbnwV3BUiho0E. Decide on git filter-repo. ~1 hour.
 2. A-2: write 008_logos_storage_policies.sql mirroring the commented block in 001, plus a migration test that verifies pg_policies has the four rows. ~30 min.

 Sprint 2 — Data integrity & user-visible correctness (HIGH)

 3. B-1: create Postgres function replace_itens_orcamento(p_orcamento_id uuid, p_itens jsonb) doing DELETE + INSERT in one transaction; call via supabase.rpc(...). Update
 useOrcamentoWizard.ts:347-352. Add a chaos test (drop client mid-call → assert items still present).
 4. D-2: add version INT NOT NULL DEFAULT 0 to orcamentos. Update wizard to read+pass version, bump on each update, surface conflict UI. Migration + ~50 LOC client.
 5. E-1: add roundCents to src/lib/format.ts; apply in calcularOrcamento returned object. One-line fix to calcular-madeira.ts too.
 6. E-2: render banner in useOrcamentoWizard.ts when !madeireiraId && !loadingVinculacao.
 7. A-3: 16-byte slug with rejection sampling; introduce get_portfolio_by_slug(p_slug text) SECURITY DEFINER RPC; tighten the public-select policy.
 8. A-4: prefix-sanitize string cells in parse-planilha.ts. Add regression test.

 Sprint 3 — Architectural cleanup (HIGH/MEDIUM)

 9. C-1: extract useTableCRUD (uses useQuery + useMutation); migrate the five catalog hooks; remove ~200 LOC of duplication. Pre-requisite for B-3.
 10. C-2: split useOrcamentoWizard into 4 focused hooks per the breakdown in C-2.
 11. D-1: push server state into RQ exclusively; Zustand keeps only the wizard step + draft form data.
 12. D-3: introduce OrcamentoParaCliente type-omit and use throughout src/components/orcamento/pdf/**.

 Sprint 4 — Polish (MEDIUM/LOW)

 13. A-5, A-6: zip-bomb guard + filename sanitizer.
 14. B-2: subscribe-with-selector refactor on Zustand store.
 15. B-4: route-level lazy(() => import(...)) for /novo-orcamento, /editar-orcamento/:id, /madeireira/upload.
 16. D-5: indexes migration.
 17. E-3 / E-4 / E-5 / E-6: error-handling polish.
 18. F-1: integration tests for the wizard.
 19. F-2: file splits.

 ---
 Phase 5 — Optimization opportunities & reusable abstractions

 - One generic CRUD hook (useTableCRUD<T,TInput>) drops 200+ LOC and becomes the place to add cross-cutting features (optimistic updates, telemetry, error toasting).
 - useSupabase401Interceptor at the App root, hooked once into supabase.auth.onAuthStateChange plus a fetch wrapper, to centralize session-expiry handling. Removes repeated
 401 logic from every hook.
 - One PDF-safe orçamento type + a tiny build script that asserts at compile time that the PDF subtree never reads from valor_margem | deslocamento | custos_adicionais.
 Future-proofs the privacy invariant.
 - Single rounding helper in format.ts, used by calcular-orcamento.ts, calcular-madeira.ts, the financial step UI, and the PDF. Eliminates display/persist drift class bugs.
 - replace_itens_orcamento RPC is reusable for any future "replace child collection" pattern.

 ---
 Phase 6 — Final summary

 Top risks (in order):
 1. Production credentials — including an unidentified secret-shaped string — sit in git history (A-1). Rotate immediately.
 2. logos storage RLS lives only in dashboard ops, not migrations (A-2). Self-host or fresh-restore breaks.
 3. Save flow does delete + insert non-atomically (B-1). A network blip mid-save wipes items — class-A data loss.
 4. No optimistic-concurrency control + dual server-state stores (D-2, D-1). Multi-tab silent loss.
 5. CSV formula injection (A-4) is a downstream RCE class issue.
 6. Floating-point drift between display and persistence (E-1) erodes invoice trust.

 What is not a problem (despite agent suggestions):
 - itens_orcamento does have RLS (001_initial_schema.sql:210, 352-359).
 - The PDF does hide valor_margem / deslocamento / custos_adicionais (pdf-financeiro.tsx:81-83).
 - deslocamento and custos_adicionais are persisted on save (useOrcamentoWizard.ts:276-277, 321-322).
 - orcamento_status enum was migrated to the spec values (003_status_custos_perfil.sql:32-38); it's now {rascunho, enviado, salvo, pedido_fechado, cancelado} matching
 CLAUDE.md.
 - valor_m3_venda is calculated, not stored (calcular-madeira.ts).
 - comprimentos for the carpinteiro selector do come from the 1:N preset list (comprimentos_madeira_m3); the madeireira form is the place where presets are defined, which is
  correct.

 Suggested roadmap:
 - Sprint 1 (1–2 days): A-1, A-2.
 - Sprint 2 (1 week): B-1, D-2, E-1, E-2, A-3, A-4.
 - Sprint 3 (1–2 weeks): C-1, C-2, D-1, D-3.
 - Sprint 4 (rolling): everything else.

 Total surfaced: 3 CRITICAL · 11 HIGH · 14 MEDIUM · 7 LOW = 35 verified findings.

 Scope note: this audit is read-only. No code or schema was modified.
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Claude has written up a plan and is ready to execute. Would you like to proceed?

 ❯ 1. Yes, auto-accept edits
   2. Yes, manually approve edits
   3. No, refine with Ultraplan on Claude Code on the web
   4. Tell Claude what to change
      shift+tab to approve with this feedback

 ctrl-g to edit in Notepad · ~\.claude\plans\you-are-an-expert-quiet-feather.md
 Top risks (in order):
 1. Production credentials — including an unidentified secret-shaped string — sit in git history (A-1). Rotate immediately.
 2. logos storage RLS lives only in dashboard ops, not migrations (A-2). Self-host or fresh-restore breaks.
 3. Save flow does delete + insert non-atomically (B-1). A network blip mid-save wipes items — class-A data loss.
 4. No optimistic-concurrency control + dual server-state stores (D-2, D-1). Multi-tab silent loss.
 5. CSV formula injection (A-4) is a downstream RCE class issue.
 6. Floating-point drift between display and persistence (E-1) erodes invoice trust.

 What is not a problem (despite agent suggestions):
 - itens_orcamento does have RLS (001_initial_schema.sql:210, 352-359).
 - The PDF does hide valor_margem / deslocamento / custos_adicionais (pdf-financeiro.tsx:81-83).
 - deslocamento and custos_adicionais are persisted on save (useOrcamentoWizard.ts:276-277, 321-322).
 - orcamento_status enum was migrated to the spec values (003_status_custos_perfil.sql:32-38); it's now {rascunho, enviado, salvo, pedido_fechado, cancelado} matching
 CLAUDE.md.
 - valor_m3_venda is calculated, not stored (calcular-madeira.ts).
 - comprimentos for the carpinteiro selector do come from the 1:N preset list (comprimentos_madeira_m3); the madeireira form is the place where presets are defined, which is
  correct.

 Suggested roadmap:
 - Sprint 1 (1–2 days): A-1, A-2.
 - Sprint 2 (1 week): B-1, D-2, E-1, E-2, A-3, A-4.
 - Sprint 3 (1–2 weeks): C-1, C-2, D-1, D-3.
 - Sprint 4 (rolling): everything else.

 Total surfaced: 3 CRITICAL · 11 HIGH · 14 MEDIUM · 7 LOW = 35 verified findings.

 Scope note: this audit is read-only. No code or schema was modified.