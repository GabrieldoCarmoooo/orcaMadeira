     OrçaMadeira — Comprehensive Codebase Audit                                                                                                                                  
     Context                                                                                                                                                                                                                                                                                                                                              
     OrçaMadeira is a React 19 + Vite + Supabase SaaS for carpenters/lumberyards to build professional quotes from a real catalog. The audit below covers the entire app/src
     and supabase/migrations tree as of commit b65d096 (branch main), reading the actual code rather than relying on documentation. Findings are categorized (Bug |
     Architecture | Performance | Security | Maintainability) with severity (Critical | High | Medium | Low) and concrete fixes.

     Overall System Health

     ┌────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────┐
     │                 Dimension                  │                                             Verdict                                              │
     ├────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤
     │ Security (RLS, secrets, XSS, file uploads) │ Strong. No exploitable issues; only defense-in-depth gaps.                                       │
     ├────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤
     │ Business logic correctness                 │ One Critical data-loss bug in three save paths; calculations otherwise correct.                  │
     ├────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤
     │ Architecture & separation of concerns      │ Good. Clear hooks/lib/store/components split. Some component bloat.                              │
     ├────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤
     │ Performance                                │ Acceptable for current scale but room to improve (no caching, no memoization on filtered lists). │
     ├────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤
     │ Testing                                    │ Critical gap. Zero tests, including untested money math and parser.                              │
     ├────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤
     │ Maintainability                            │ Good naming/typing. Major sin: novo-orcamento and editar-orcamento are 95% duplicated.           │
     └────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────┘

     ---
     Critical Findings (act on these first)

     C-1 · BUG · Silent data loss: deslocamento and custos_adicionais never persisted

     The wizard collects, calculates with, and renders deslocamento and custos_adicionais (configured in step-financeiro.tsx, computed in calcular-orcamento.ts:70-74,
     included in ResumoOrcamento). The DB has the columns (supabase/migrations/003_status_custos_perfil.sql:76-79) defined as NUMERIC(12,2) NOT NULL DEFAULT 0. But three save      payloads omit both fields entirely, so every save silently defaults them to 0 in the database:

     - src/pages/carpinteiro/novo-orcamento-page.tsx:146-167 — saveDraft (autosave every 30s)
     - src/pages/carpinteiro/novo-orcamento-page.tsx:201-222 — handleFinalizar (rascunho → salvo)
     - src/pages/carpinteiro/editar-orcamento-page.tsx:126-145 — salvarAlteracoes (autosave during edit)
     - src/pages/carpinteiro/editar-orcamento-page.tsx:181-204 — handleFinalizar (edit save)

     The bug is hidden because the local snapshot used for the immediate PDF download (novo-orcamento-page.tsx:269-270, editar-orcamento-page.tsx:241-242) does include the
     fields. So the freshly-generated PDF looks right; the data only diverges when the orçamento is later refetched (it comes back with both fields = 0). total was already
     computed including those values, so the visible total stays consistent — the fields simply disappear for any future reopen, edit, or recalculation.

     Fix — add the two fields to all four payloads:

     // in each of the four payloads above
     deslocamento: resumo.deslocamento,
     custos_adicionais: resumo.custos_adicionais,

     After the fix, also write a one-shot SQL migration (or backfill script) for any existing orçamentos saved while the bug was live — they currently have 0/0 even though
     the user entered values, and only a recompute can detect it (compare total against (materiais + mao_obra) * (1+margem) * (1+imposto); the gap, if any, is the lost desloc      + custos).

     C-2 · Maintainability · Zero tests on money math, parser, and RLS

     package.json has no test framework, no vitest.config.*, no *.test.* files. The most consequential pure functions in the system are uncovered:

     - src/lib/calcular-orcamento.ts — base × margin × tax pipeline (the bug above would have been caught by a single unit test).
     - src/lib/calcular-madeira.ts — (esp/100) * (larg/100) * comp * valor_m3 and finishing markup.
     - src/lib/parse-planilha.ts — CSV/XLSX header detection, per-row validation, error reporting.

     Fix — add Vitest (no extra runtime, integrates with Vite):

     npm i -D vitest @testing-library/react @testing-library/user-event jsdom

     Then write at minimum:

     // src/lib/__tests__/calcular-orcamento.test.ts
     import { calcularOrcamento } from '../calcular-orcamento'
     test('aplica margem e imposto na base com deslocamento e custos_adicionais', () => {
       const r = calcularOrcamento(
         [{ item_preco_id: 'a', nome: 'x', unidade: 'un', preco_unitario: 100, quantidade: 2 }],
         { mao_obra_tipo: 'fixo', mao_obra_valor: 100, mao_obra_horas: null,
           margem_lucro: 10, imposto: 5, deslocamento: 50, custos_adicionais: 50 },
       )
       expect(r.subtotal_materiais).toBe(200)
       expect(r.deslocamento).toBe(50)            // would have caught C-1
       expect(r.total).toBeCloseTo(400 * 1.1 * 1.05, 2)
     })

     RLS regression coverage can use the Supabase JS client against a local Supabase Docker stack with seeded carpinteiro/madeireira fixtures.

     ---
     High-Severity Findings

     H-1 · Maintainability · novo-orcamento-page.tsx and editar-orcamento-page.tsx are duplicates

     491 vs 490 lines, ~95% identical. Wizard state, autosave, PDF export, item validation, and the C-1 bug are all duplicated. Any change to the orçamento flow has to be
     made twice and was — that is precisely how C-1 got copy-pasted.

     Fix — extract a single useOrcamentoWizard(orcamentoId?: string) hook in src/hooks/:

     - Holds the wizard state.
     - Exposes salvar({ status }) which switches between insert (no id) and update (with id).
     - Both pages become thin shells (~80 lines each) that mount the hook and render the steps.

     Keep the two route files for clarity, but the wizard logic lives in one place.

     H-2 · Maintainability · Hardcoded status strings scattered across 11+ call sites

     OrcamentoStatus is typed in src/types/common.ts but the string values appear inline as 'rascunho', 'salvo', 'pedido_fechado', 'cancelado' throughout pages and hooks.
     STATUS_LABEL is locally redefined in orcamentos-page.tsx:52-61 and would diverge silently if any page added a new label.

     Fix — create src/constants/orcamento-status.ts:

     export const ORCAMENTO_STATUS = {
       rascunho:       { value: 'rascunho',       label: 'Rascunho',       badgeClass: '...' },
       salvo:          { value: 'salvo',          label: 'Salvo',          badgeClass: '...' },
       enviado:        { value: 'enviado',        label: 'Enviado',        badgeClass: '...' },
       pedido_fechado: { value: 'pedido_fechado', label: 'Pedido Fechado', badgeClass: '...' },
       cancelado:      { value: 'cancelado',      label: 'Cancelado',      badgeClass: '...' },
     } as const satisfies Record<OrcamentoStatus, { value: OrcamentoStatus; label: string; badgeClass: string }>

     Replace inline strings and inline label maps with imports from this module.

     H-3 · Bug · pedido_fechado orçamentos can be edited freely

     src/pages/carpinteiro/orcamento-detalhe-page.tsx:289 exposes the Edit button regardless of status. CLAUDE.md treats pedido_fechado as a finalized order whose prices must      be frozen (snapshot fields exist precisely for this); allowing edit lets the user mutate a closed order's total, mao_obra_*, margem_lucro, etc., breaking the snapshot
     guarantee.

     Fix — gate the navigation:

     {orcamento.status !== 'pedido_fechado' && orcamento.status !== 'cancelado' && (
       <Button onClick={() => navigate(ROUTES.CARPINTEIRO_EDITAR_ORCAMENTO(orcamento.id))}>
         Editar
       </Button>
     )}

     Also add a server-side guard in editar-orcamento-page.tsx's handleFinalizar: refuse to update if the row's current status is pedido_fechado (a .eq('status',
     ...).neq('status', 'pedido_fechado') predicate, or a Postgres trigger).

     ---
     Medium-Severity Findings

     M-1 · Security · Zod schemas accept unbounded numeric input

     - src/lib/schemas/especie-schema.ts:11-20 — custo_m3: z.number().positive() and margem_lucro_pct: z.number().min(0) have no upper bound. A user can save a margin of
     9_999_999 and corrupt every downstream calculation.
     - src/lib/schemas/madeira-m3-schema.ts:26-39 — espessura_cm, largura_cm, comprimento_m similarly unbounded.
     - src/lib/schemas/outro-produto-schema.ts:13-15 — preco_unitario unbounded.
     - src/lib/schemas/acabamento-schema.ts:12-14 — percentual_acrescimo unbounded.

     Fix — add domain caps consistent with NUMERIC(12,2) (max ~9,999,999.99) and physical realism:

     custo_m3: z.number().positive().max(999_999.99),
     margem_lucro_pct: z.number().min(0).max(1000),
     espessura_cm: z.number().positive().max(100),
     largura_cm: z.number().positive().max(500),
     comprimento_m: z.number().positive().max(20),
     percentual_acrescimo: z.number().min(0).max(500),

     M-2 · Architecture · Calculation logic embedded in step-materiais.tsx render body

     src/components/orcamento/step-materiais.tsx:89-105 builds the dialog price (madeira m³ × comprimento × acabamento) inline in JSX. The same logic exists in
     calcular-madeira.ts, but the component re-implements it and is the only consumer that selects a comprimento dynamically.

     Fix — add a single helper in src/lib/calcular-madeira.ts:

     export function calcularPrecoLinhaMadeiraM3(
       especie: { custo_m3: number; margem_lucro_pct: number },
       dims: { espessura_cm: number; largura_cm: number; comprimento_m: number },
       acabamento?: { percentual_acrescimo: number } | null,
     ): number

     Have step-materiais.tsx call it. Cover with a unit test (this is also where C-1's blast radius peers — the real-time price preview).

     M-3 · Performance · No query caching; redundant refetches between routes

     src/hooks/useOrcamento.ts, useDashboardMetricas.ts, useCatalogoProdutos.ts, and the orçamentos list all use raw useState + useEffect with no shared cache. Every
     navigation back to a page reissues the same Supabase queries; the dashboard refetches metrics whenever the user returns from a detail page. With many active carpinteiros      this becomes free wasted DB load.

     Fix (light-touch) — add @tanstack/react-query (the smallest, idiomatic React caching layer; no other deps required):

     const { data: orcamentos } = useQuery({
       queryKey: ['orcamentos', carpinteiroId],
       queryFn: () => supabase.from('orcamentos').select('*').eq('carpinteiro_id', carpinteiroId),
       staleTime: 60_000,
     })

     Migrate one hook at a time (start with useCatalogoProdutos — most-fetched). Mutations call queryClient.invalidateQueries(['orcamentos']) to keep things fresh.

     M-4 · Performance · Filtered lists recomputed every render

     - src/pages/carpinteiro/orcamentos-page.tsx:134,138 — orcamentos.filter(...) runs twice per render with no useMemo. With 100+ rows and a typing search, this fires every
     keystroke.
     - src/pages/carpinteiro/novo-orcamento-page.tsx:87 — destructures the entire Zustand store, so every store change re-renders the wizard root and every step.

     Fix —

     const filtered = useMemo(
       () => orcamentos.filter(o => o.nome.toLowerCase().includes(query.toLowerCase())),
       [orcamentos, query],
     )

     For the Zustand reads, use selectors so each step only re-renders on its own slice:

     const step = useOrcamentoStore(s => s.step)
     const itens = useOrcamentoStore(s => s.itens)

     M-5 · Performance · Both xlsx and papaparse ship in the main bundle

     src/lib/parse-planilha.ts:1-2 imports both at module top-level. xlsx alone is ~1.5 MB minified. The upload page is a low-traffic feature; both libs are downloaded by
     every user (carpinteiros never visit upload).

     Fix — split and dynamic-import the parser path:

     async function parsePlanilha(file: File) {
       const ext = file.name.split('.').pop()?.toLowerCase()
       if (ext === 'csv') {
         const { parseCsv } = await import('./parse-csv')
         return parseCsv(file)
       }
       const { parseXlsx } = await import('./parse-xlsx')
       return parseXlsx(file)
     }

     Vite already code-splits dynamic imports. The xlsx chunk loads only when a madeireira user uploads an Excel file.

     M-6 · Performance · radix-ui meta-package vs scoped imports

     src/components/ui/*.tsx import from the radix-ui umbrella package (package.json:21). The meta-package's tree-shaking is unreliable; many shadcn templates moved to scoped      imports (@radix-ui/react-slot, @radix-ui/react-dialog) for guaranteed split-out.

     Fix — replace import { Slot } from "radix-ui" with import { Slot } from "@radix-ui/react-slot" etc. Add the scoped packages, remove radix-ui from package.json. Verify
     bundle delta with vite build --report (or rollup-plugin-visualizer).

     M-7 · Maintainability · Inconsistent error handling

     - src/hooks/useCatalogoProdutos.ts:194 swallows errors silently (catch { setAllItems([]) }) — empty catalog is indistinguishable from a Supabase 500.
     - src/pages/carpinteiro/novo-orcamento-page.tsx:187 and :303 catch with no logging (catch { setSaveError('Erro ao salvar rascunho.') }); the original error is lost in
     production debugging.
     - src/lib/parse-planilha.ts:28-30 throws.
     - Some hooks return { data, error } shape, some return data | null with a separate error state.

     Fix — pick one convention (recommend { data, error } matching Supabase's own shape) and at minimum add console.error(err) in every catch block, behind a small
     logError(scope, err) helper that you can later wire to Sentry/LogRocket.

     M-8 · Architecture · Large files that mix concerns

     ┌────────────────────────────────────────────────────────┬───────┬───────────────────────────────────────────────────────────────────┐
     │                          File                          │ Lines │                           What to split                           │
     ├────────────────────────────────────────────────────────┼───────┼───────────────────────────────────────────────────────────────────┤
     │ src/components/orcamento/pdf-document.tsx              │ 585   │ header / cliente / materiais / financeiro / footer sub-components │
     ├────────────────────────────────────────────────────────┼───────┼───────────────────────────────────────────────────────────────────┤
     │ src/pages/carpinteiro/novo-orcamento-page.tsx          │ 491   │ extracted by H-1 (useOrcamentoWizard)                             │
     ├────────────────────────────────────────────────────────┼───────┼───────────────────────────────────────────────────────────────────┤
     │ src/pages/carpinteiro/editar-orcamento-page.tsx        │ 490   │ same                                                              │
     ├────────────────────────────────────────────────────────┼───────┼───────────────────────────────────────────────────────────────────┤
     │ src/pages/carpinteiro/orcamento-detalhe-page.tsx       │ 466   │ status actions vs PDF export vs render                            │
     ├────────────────────────────────────────────────────────┼───────┼───────────────────────────────────────────────────────────────────┤
     │ src/pages/carpinteiro/orcamentos-page.tsx              │ 460   │ filter bar / list / status modals                                 │
     ├────────────────────────────────────────────────────────┼───────┼───────────────────────────────────────────────────────────────────┤
     │ src/components/madeireira/catalogo/madeira-m3-form.tsx │ 460   │ form fields vs comprimentos manager                               │
     ├────────────────────────────────────────────────────────┼───────┼───────────────────────────────────────────────────────────────────┤
     │ src/pages/carpinteiro/perfil-page.tsx                  │ 424   │ empresa / financeiro / termos sections                            │
     └────────────────────────────────────────────────────────┴───────┴───────────────────────────────────────────────────────────────────┘

     These don't block anything, but each violates single responsibility.

     ---
     Low-Severity Findings

     L-1 · Security · PII in localStorage during signup

     src/pages/auth/register-page.tsx:98-107 stashes { userId, role, nome, cpf_cnpj, telefone } in localStorage under pending_profile while waiting for email confirmation.
     Persists across browser restarts; readable by any same-origin script if XSS ever lands.

     Fix — switch to sessionStorage (cleared on tab close) or, better, write the profile fields straight to carpinteiros/madeireiras row at signup time and gate access behind      email-verified flag.

     L-2 · Maintainability · tsconfig missing two safety flags

     tsconfig.app.json has strict: true but not:

     - noUncheckedIndexedAccess: true — array/object index access becomes T | undefined, surfaces real bugs.
     - exactOptionalPropertyTypes: true — distinguishes { x: undefined } from {}.

     Fix — enable both, then fix the surfaced errors (typically a small batch in catalog hooks where [0] is assumed defined).

     L-3 · Performance · Logo not resized before base64 embed in PDF

     src/hooks/usePdf.ts:13 (fetchLogoBase64) downloads the user's full-resolution logo and embeds it as base64 into every PDF. A 2 MB PNG inflates the PDF by ~2.7 MB and
     slows generation noticeably.

     Fix — at upload time in logo-uploader.tsx, resize to max 400×400 with a <canvas> and store the resized version. Or downscale on-the-fly in fetchLogoBase64 via
     createImageBitmap.

     L-4 · Maintainability · Magic UID format string

     src/stores/useOrcamentoStore.ts:88-91 builds and parses madeira:{id}:{comprimento_id}:{acabamento_id|none} inline. Same parsing duplicated in step-materiais.tsx.

     Fix — extract src/lib/item-key.ts with buildMadeiraKey() / parseMadeiraKey(). Single source of truth, tested.

     L-5 · Maintainability · ESLint missing two useful rules

     eslint.config.js is minimal (good baseline). Worth adding:

     - eslint-plugin-jsx-a11y (recommended preset) — accessibility lint.
     - @typescript-eslint/no-explicit-any (error) — backstops the CLAUDE.md rule.

     L-6 · Architecture · vite.config.ts chunking is partial

     Only React/Router and Supabase are explicitly chunked. PDF (@react-pdf/renderer) and forms (react-hook-form, zod, @hookform/resolvers) ship in random place chunks.

     Fix — explicit manualChunks:

     manualChunks: {
       vendor:  ['react', 'react-dom', 'react-router-dom'],
       supabase:['@supabase/supabase-js'],
       pdf:     ['@react-pdf/renderer'],
       forms:   ['react-hook-form', 'zod', '@hookform/resolvers'],
     }

     L-7 · Security · logos storage bucket has no server-side MIME/size cap

     The frontend (logo-uploader.tsx) checks 2 MB and JPEG/PNG/WebP, but the bucket itself (supabase/migrations/001_initial_schema.sql:362-387) is created without
     file_size_limit or allowed_mime_types. An authenticated user with the right path can upload arbitrarily large arbitrary files to their own folder.

     Fix — set bucket-level limits when creating the bucket:

     INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
     VALUES ('logos', 'logos', false, 2 * 1024 * 1024,
             array['image/jpeg','image/png','image/webp']);

     (Same pattern as portfolios bucket in migration 005.)

     ---
     Verified Compliant (no action needed)

     These were checked carefully and look correct as built:

     - PDF privacy rule — valor_margem, deslocamento, custos_adicionais are unconditionally hidden in pdf-document.tsx:532-545 regardless of the "Detalhes" toggle. The toggle      only controls materiais and mão de obra. Snapshot fields per CLAUDE.md are correct.
     - RLS — every table in 001, 002, 003, 005 has RLS enabled with explicit per-tenant policies; carpinteiro→madeireira catalog access correctly joins through vinculacoes
     with status = 'aprovada'. No USING (true) outside of public portfolio reads.
     - Calculation formulas — calcular-madeira.ts ((esp/100) * (larg/100) * comp * valor_m3_venda) and calcular-orcamento.ts ((materiais + mao + desloc + custos) * (1+margem)      * (1+imposto)) match CLAUDE.md exactly.
     - Snapshot freezing on rascunho → salvo — mapItemParaInsert writes preco_unitario, especie_nome, espessura_cm, largura_cm, acabamento_percentual etc. into
     itens_orcamento, so post-finalize catalog edits don't mutate saved orçamentos.
     - Auth — App.tsx AuthInitializer correctly subscribes to onAuthStateChange, role is read from DB (not JWT claim), AuthGuard redirects mismatched roles. Logout clears
     Supabase session and Zustand state.
     - No XSS sinks — no dangerouslySetInnerHTML, eval, or innerHTML with user data anywhere in src/.
     - No any — zero occurrences in src/. A handful of safe as casts after Supabase result narrowing.
     - Vinculação status enforcement — useVinculacao.ts filters to pendente/aprovada only; old pendings auto-rejected when a new one is requested.
     - No N+1 in catalog — useMadeirasM3 eager-loads especie + comprimentos in one PostgREST select; useCatalogoProdutos runs the three sources via Promise.all.

     ---
     Recommended Execution Order

     If you want to action these as separate tasks, this is the sequence I'd run:

     1. C-1 — fix the four payloads. ~10 lines of code, immediate data-integrity win. (Backfill follow-up.)
     2. C-2 — wire up Vitest, write tests for calcular-orcamento + calcular-madeira + parse-planilha. Pin behavior before any refactor.
     3. H-3 — block edit on pedido_fechado. UI gate + server check.
     4. H-1 — extract useOrcamentoWizard, dedupe novo/editar pages.
     5. H-2 — centralize status enum/labels.
     6. M-1, M-2 — schema bounds + extract calcularPrecoLinhaMadeiraM3.
     7. M-3, M-4 — react-query (or memoization-only as a smaller alternative for M-4) for caching/render perf.
     8. M-5, M-6, L-6 — bundle-size pass; verify with vite build --report.
     9. L-1, L-7 — sessionStorage for pending_profile; bucket MIME/size limits.
     10. L-2, L-5 — strict TS flags + ESLint a11y rule (one PR, fix surfaced errors).
     11. L-3 — logo resize at upload time.
     12. M-8 — file-size split-up where it actively helps (pdf-document, perfil).

     Each item is independently shippable.