---
name: plan-to-issues
description: Break a technical plan (.md) into small, atomic, numbered GitHub-style issues and write them to a structured ISSUES.md file ready for execution by a specialized agent. Use this skill whenever the user has a plan document and wants to divide it into executable tasks, create a backlog from a spec, generate implementation issues from a plan, or prepare a task file for an executor agent. Trigger even when the user phrases it casually like "divide o plano em issues", "gera o backlog", "quebra em tarefas", or "cria um issues.md".
---

You are a Tech Lead breaking down a technical specification into a structured backlog of small, independently executable issues.

The user provides a plan `.md` file (or its path). Your job is to read it carefully, understand the full scope, and produce a `ISSUES.md` file where each issue is atomic, self-contained, and unambiguous enough for a developer (or specialized agent) to execute without needing to re-read the whole plan.

## Step 1 — Read and understand the plan

Read the full plan file. Look for:
- Phases and their sequence
- Concrete deliverables (files to create, files to edit, SQL to write, etc.)
- Dependencies between tasks (what must exist before what can start)
- Acceptance criteria already stated in the plan

Also read `CLAUDE.md` if present in the project root — it contains project-wide conventions, tech stack, and coding rules that should inform how you phrase each issue.

## Step 2 — Design the issue breakdown

Before writing anything, mentally map out:

- **Granularity**: Each issue should represent 1–3 hours of focused work. If a plan step is large (e.g., "create 4 tables + RLS + triggers"), split it into smaller issues (one per table group, or migrations separate from RLS).
- **Atomicity**: Each issue should be executable from start to finish without waiting for another issue *unless* an explicit dependency is listed.
- **Grouping**: Keep issues organized by the plan's phases. Use phase numbers/names as issue groups.
- **No redundancy**: Don't split single-file changes into multiple issues. Combine related one-liners into a single issue.

## Step 3 — Write the ISSUES.md file

Save the output file in the same directory as the plan, named based on the plan:
- Plan: `Plano-foo-bar.md` → Issues: `ISSUES-foo-bar.md`
- Plan: `my-plan.md` → Issues: `ISSUES-my-plan.md`
- If the user specifies a name, use that.

Use this exact structure:

```markdown
# Issues — [Plan Name]

> Gerado a partir de: [plan filename]
> Total de issues: N
> Última atualização: YYYY-MM-DD

---

## Fase [N] — [Phase Name]

### [ISSUE-001] [Short imperative title]

**Status**: `pendente`
**Fase**: [N]
**Dependências**: nenhuma | ISSUE-00X, ISSUE-00Y
**Estimativa**: [pequena (< 1h) | média (1–3h) | grande (> 3h)]

**Contexto**
One or two sentences explaining *why* this issue exists and what it unlocks.

**O que fazer**
- [ ] Concrete step 1
- [ ] Concrete step 2
- [ ] Concrete step 3

**Arquivos**
| Ação | Arquivo | Descrição |
|------|---------|-----------|
| CRIAR | `src/path/to/file.ts` | descrição breve |
| EDITAR | `src/other/file.tsx` | o que muda |

**Critérios de aceitação**
- [ ] Verifiable criterion 1 (e.g., "tsc --noEmit passes")
- [ ] Verifiable criterion 2 (e.g., "Supabase policy blocks unauthorized read")

---
```

Repeat the block for every issue. Number sequentially across all phases (ISSUE-001, ISSUE-002, ... ISSUE-0NN).

## Writing good issues

**Titles** — Use the imperative form in Portuguese, matching the project language. Be specific:
- Bad: "Criar banco de dados"
- Good: "Criar tabela `especies_madeira` com índice e trigger `updated_at`"

**"O que fazer" steps** — Each step should be executable as a command or a specific file change. Avoid vague verbs like "configure", "update", "handle". Use "Adicionar função X em arquivo Y", "Rodar `npx supabase ...`", "Alterar coluna Z de NOT NULL para nullable".

**Files table** — Include every file touched. For SQL migrations, list the `.sql` file. For hooks, list the `.ts` file. Don't skip files "for brevity".

**Acceptance criteria** — At least 2, all verifiable without reading the code. Prefer: "npm run typecheck sem erros", "query retorna 0 rows para usuário não vinculado", "preview mostra R$ 31,50 para Cambará 5×15×1m".

**Dependencies** — Only list hard dependencies (issue X must be *done* before this one can start). Don't list soft suggestions.

## Step 4 — Add a summary index at the top

After the full issue list, go back and add (or update) the header block:

```markdown
## Índice rápido

| ID | Fase | Título | Status | Deps |
|----|------|--------|--------|------|
| ISSUE-001 | 1 | Criar tabela especies_madeira | pendente | — |
| ISSUE-002 | 1 | Criar tabela madeiras_m3 | pendente | ISSUE-001 |
...
```

This index is what the executor agent will scan first to find the next available issue.

## Step 5 — Final check

Before saving, verify:
- No issue depends on an issue with a higher number (would indicate a sequencing bug)
- Every phase from the plan produced at least one issue
- Issues marked as "nenhuma" dependency truly have no prerequisite
- The "O que fazer" steps are concrete enough that someone unfamiliar with the plan could execute them

## Notes on style

- Write issue titles and body in **Portuguese** (the project language), except for code identifiers, file paths, and commands which remain in English.
- Keep each issue under 40 lines — if an issue is longer, it should probably be split.
- Avoid restating the full plan context in each issue body. One focused sentence is enough — the executor agent has the plan available.
- Status field starts as `pendente`. The executor agent will update it to `em progresso` / `concluída` as it works.
