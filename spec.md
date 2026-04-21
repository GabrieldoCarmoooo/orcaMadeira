# Especificação Técnica — OrçaMadeira

## 1. Visão Geral da Arquitetura

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (SPA)                        │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  React   │  │  Zustand │  │   Zod    │              │
│  │  Router  │  │  Stores  │  │ Schemas  │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │              │              │                    │
│  ┌────▼──────────────▼──────────────▼──────────────┐   │
│  │              React 19 + TypeScript                │   │
│  │         shadcn/ui + Tailwind CSS 4                │   │
│  └─────────────────────┬─────────────────────────────┘   │
│                        │                                  │
│  ┌─────────────────────▼──────────────┐                 │
│  │  @react-pdf/renderer  │  PapaParse  │                 │
│  │     (PDF client-side) │  + SheetJS  │                 │
│  └─────────────────────┬──────────────┘                 │
└────────────────────────┼────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                       Supabase                           │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Auth   │  │PostgreSQL│  │  Storage │              │
│  │  (JWT)   │  │   (RLS)  │  │  (Files) │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

### Stack Completa (versões instaladas)

| Camada | Tecnologia | Versão | Justificativa |
|--------|-----------|--------|---------------|
| UI Framework | React | 19.2 | Concurrency, já configurado |
| Linguagem | TypeScript | 6.x strict | Type safety end-to-end |
| Build | Vite | 8.x | HMR rápido, bundle otimizado |
| Estilização | Tailwind CSS | 4.2 | Utility-first; Design: Timber Grain |
| Componentes | shadcn/ui (radix-nova) | 4.1 | Acessível, customizável |
| Ícones | Lucide React | 1.7 | Consistente com shadcn |
| Roteamento | React Router | 7.14 | Padrão do ecossistema |
| Estado global | Zustand | 5.0 | Leve, zero boilerplate |
| Formulários | React Hook Form | 7.72 | Performance (uncontrolled) |
| Validação | Zod | 4.3 | Type inference automático |
| Backend | Supabase JS | 2.101 | Auth + DB + Storage + RLS |
| PDF | @react-pdf/renderer | 4.4 | Geração client-side |
| CSV | PapaParse | 5.5 | Parse robusto |
| Excel | SheetJS (xlsx) | 0.18 | Parse .xlsx/.xls |

### Design System: Timber Grain — Master's Atelier

Referência conceitual: `references/NOVODESIGN.md` • Mockups por tela: `references/design-atualizado/`.

**Princípios:**
- Sem bordas 1px — usar `surface-container` shifts.
- Glassmorphism no header (bg 80% + blur 12px).
- Grid editorial assimétrico (4 cols título / 8 cols conteúdo).
- Tipografia: `tracking-tighter` em displays; `uppercase tracking-widest text-[10px]` em micro-labels.
- Hover states: `hover:translate-x-1` em listas, `hover:-translate-y-1` em cards.

**Primitivos de `src/components/ui/`:**
- shadcn (via CLI): `button`, `input`, `label`, `tabs`, `dialog`, `select`, `table`, `form`, `dropdown-menu`.
- Custom Timber Grain: `EditorialSection`, `EditorialInput`, `TonalCard`, `MetricCard`, `StatusChip`, `GrainProgress`.

### Decisões Arquiteturais

- **ADR-001 SPA:** 100% autenticada, SEO irrelevante, deploy simples (Vercel/CDN).
- **ADR-002 Supabase:** Sem backend custom no MVP. Postgres com RLS para segurança por linha.
- **ADR-003 PDF client-side:** Zero custo de servidor, offline, sob demanda.
- **ADR-004 Zustand:** API mínima, sem Context hell.
- **ADR-005 Zod:** Schema único compartilhado entre validação e tipagem.
- **ADR-006 RLS:** Todas as regras de acesso aplicadas no banco. UI bloqueia por UX; banco bloqueia por segurança.
- **ADR-007 Catálogo relacional:** entidades dedicadas (Espécies, Madeiras m³, Outros Produtos, Acabamentos, Comprimentos) substituem o upload como fluxo principal de cadastro. Upload permanece como **importação legada** e convive com o catálogo.
- **ADR-008 Snapshot em `itens_orcamento`:** ao finalizar o orçamento, `preco_unitario` e metadados do item são congelados para imutabilidade histórica.
- **ADR-009 Derivação de preço:** `valor_m3_venda` da espécie e `valor_unitario` da Madeira m³ são **calculados**, nunca armazenados — ajustar custo/margem reflete em todo o catálogo ativo.

---

## 2. Modelos de Dados

### Entidades existentes (migration 001)

```typescript
// src/types/common.ts
export type UserRole = 'carpinteiro' | 'madeireira'
export type VinculacaoStatus = 'pendente' | 'aprovada' | 'rejeitada'
export type OrcamentoStatus = 'rascunho' | 'finalizado' | 'enviado'
export type TipoProjeto = 'movel' | 'estrutura'
export type OrigemItem = 'legado_planilha' | 'madeira_m3' | 'outro_produto'

// src/types/carpinteiro.ts
export interface Carpinteiro {
  id: string
  user_id: string
  nome: string
  cpf_cnpj: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  logo_url: string | null
  margem_lucro_padrao: number
  valor_hora_mao_obra: number
  imposto_padrao: number
  madeireira_id: string | null
  created_at: string
  updated_at: string
}

// src/types/madeireira.ts
export interface Madeireira {
  id: string
  user_id: string
  razao_social: string
  cnpj: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface TabelaPreco {
  id: string
  madeireira_id: string
  nome: string
  upload_at: string
  ativo: boolean   // apenas uma tabela ativa por madeireira
}

export interface ItemPreco {
  id: string
  tabela_id: string
  codigo: string | null
  nome: string
  categoria: string | null
  descricao: string | null
  unidade: string
  preco_unitario: number
  disponivel: boolean
}
```

### Entidades do Catálogo Relacional (migration 002)

```typescript
// src/types/produto.ts
export interface EspecieMadeira {
  id: string
  madeireira_id: string
  nome: string
  custo_m3: number            // R$ por m³
  margem_lucro_pct: number    // % (0–∞)
  created_at: string
  updated_at: string
  // derivado: valor_m3_venda = custo_m3 * (1 + margem_lucro_pct/100)
}

export interface ComprimentoMadeiraM3 {
  id: string
  madeira_m3_id: string
  comprimento_m: number        // ex: 1, 1.5, 2, 2.5, 3
  disponivel: boolean
  created_at: string
}

export interface MadeiraM3 {
  id: string
  madeireira_id: string
  especie_id: string
  nome: string
  espessura_cm: number
  largura_cm: number
  comprimento_m: number        // referência (default 1)
  disponivel: boolean
  created_at: string
  updated_at: string
  // joins opcionais:
  especie?: EspecieMadeira
  comprimentos?: ComprimentoMadeiraM3[]
}

export interface OutroProduto {
  id: string
  madeireira_id: string
  nome: string
  unidade: string
  preco_unitario: number
  descricao: string | null
  disponivel: boolean
  created_at: string
  updated_at: string
}

export interface ServicoAcabamento {
  id: string
  madeireira_id: string
  nome: string
  percentual_acrescimo: number  // ex: 10 = +10%
  ativo: boolean
  created_at: string
  updated_at: string
}

// União discriminada consumida pelo carpinteiro
export type CatalogoItem =
  | { origem: 'madeira_m3'; id: string; madeireira_id: string; nome: string; especie: EspecieMadeira; espessura_cm: number; largura_cm: number; comprimentos: ComprimentoMadeiraM3[] }
  | { origem: 'outro_produto'; id: string; madeireira_id: string; nome: string; unidade: string; preco_unitario: number }
  | { origem: 'legado_planilha'; id: string; tabela_id: string; nome: string; unidade: string; preco_unitario: number; categoria: string | null }
```

### Orçamento — ItemOrcamento estendido

```typescript
// src/types/orcamento.ts
export interface Orcamento {
  id: string
  carpinteiro_id: string
  madeireira_id: string
  tabela_snapshot_id: string | null    // FK legado (null se catálogo relacional apenas)
  status: OrcamentoStatus
  tipo_projeto: TipoProjeto
  nome: string
  descricao: string | null
  cliente_nome: string
  cliente_telefone: string | null
  cliente_email: string | null
  mao_obra_tipo: 'fixo' | 'hora'
  mao_obra_valor: number
  mao_obra_horas: number | null
  margem_lucro: number
  imposto: number
  validade_dias: number
  termos_condicoes: string | null
  exibir_materiais_pdf: boolean
  exibir_mao_obra_pdf: boolean
  subtotal_materiais: number
  subtotal_mao_obra: number
  valor_margem: number
  valor_imposto: number
  total: number
  created_at: string
  updated_at: string
  finalizado_at: string | null
}

export interface ItemOrcamento {
  id: string
  orcamento_id: string
  origem: OrigemItem              // 'legado_planilha' | 'madeira_m3' | 'outro_produto'
  // FKs mutuamente exclusivas (CHECK constraint no banco)
  item_preco_id: string | null
  madeira_m3_id: string | null
  outro_produto_id: string | null
  comprimento_id: string | null   // FK comprimentos_madeira_m3 (quando madeira_m3)
  // snapshot genérico
  nome: string
  unidade: string
  preco_unitario: number          // já com acabamento aplicado
  quantidade: number
  subtotal: number
  // snapshot específico de madeira
  especie_nome: string | null
  espessura_cm: number | null
  largura_cm: number | null
  comprimento_real_m: number | null
  // snapshot de acabamento
  acabamento_id: string | null
  acabamento_nome: string | null
  acabamento_percentual: number | null
}

// src/types/vinculacao.ts
export interface Vinculacao {
  id: string
  carpinteiro_id: string
  madeireira_id: string
  status: VinculacaoStatus
  solicitado_at: string
  respondido_at: string | null
}
```

### Relacionamentos

```
auth.users
  ├── Carpinteiro (1:1 via user_id)
  │     ├── Orcamento (1:N)
  │     │     └── ItemOrcamento (1:N) ──→ [item_preco_id | madeira_m3_id | outro_produto_id]
  │     └── Vinculacao (1:N)
  │
  └── Madeireira (1:1 via user_id)
        ├── TabelaPreco (1:N)         [legado]
        │     └── ItemPreco (1:N)
        ├── EspecieMadeira (1:N)
        │     └── MadeiraM3 (1:N)
        │           └── ComprimentoMadeiraM3 (1:N)
        ├── OutroProduto (1:N)
        ├── ServicoAcabamento (1:N)
        └── Vinculacao (1:N)
```

### Invariantes

- **Exclusividade por origem:** `CHECK` em `itens_orcamento` garante que exatamente UMA das FKs (`item_preco_id`, `madeira_m3_id`, `outro_produto_id`) é NOT NULL, coerente com `origem`.
- **Snapshot imutável:** após `status = 'finalizado'`, `preco_unitario`, `subtotal` e todos os campos snapshot são congelados.
- **Derivação em tempo de leitura:** `valor_m3_venda` e `valor_unitario` de Madeira m³ não são armazenados; calculados em `src/lib/calcular-madeira.ts`.

---

## 3. Funcionalidades Detalhadas

### F1 — Autenticação

Supabase Auth (email/senha). Seleção de role no cadastro insere em `carpinteiros` ou `madeireiras` via trigger.

**Rotas:** `/login`, `/register`, `/forgot-password`, `/reset-password`.

**Validações (Zod):**
```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['carpinteiro', 'madeireira']),
  nome: z.string().min(2),
  cpf_cnpj: z.string().min(11),
  telefone: z.string().min(10),
})
```

**Critérios:** email duplicado → mensagem amigável; token de reset 1h; sessão persiste; `AuthGuard` redireciona para `/login`; role determinado pelo registro no banco.

---

### F2 — Perfil do Carpinteiro

**Rotas:** `/carpinteiro/perfil`.

```typescript
const perfilCarpinteiroSchema = z.object({
  nome: z.string().min(2).max(100),
  cpf_cnpj: z.string().refine(validarCpfCnpj),
  telefone: z.string().min(10).max(15),
  endereco: z.string().min(5),
  cidade: z.string().min(2),
  estado: z.string().length(2),
  margem_lucro_padrao: z.number().min(0).max(100),
  valor_hora_mao_obra: z.number().min(0),
  imposto_padrao: z.number().min(0).max(100),
})
```

**Critérios:** logo JPG/PNG ≤ 2MB; CPF/CNPJ com dígito verificador; defaults pré-preenchem o wizard.

---

### F3 — Perfil da Madeireira

**Rotas:** `/madeireira/perfil`. Mesmos critérios de logo. CNPJ validado.

---

### F4 — Catálogo de Produtos (Madeireira) — fluxo principal

Página `/madeireira/precos` em **tabbed layout** com 5 abas. Sidebar renomeada para "Produtos & Preços".

**Componentes:**
- `pages/madeireira/precos-page.tsx` — container com `Tabs`.
- `components/madeireira/catalogo/tabs-produtos.tsx` — wrapper dos 5 triggers.
- `components/madeireira/catalogo/empty-state.tsx` — estado vazio editorial reutilizável.
- Panels + forms (`especies-panel.tsx` + `especie-form.tsx`, `madeiras-m3-panel.tsx` + `madeira-m3-form.tsx`, `outros-produtos-panel.tsx` + `outro-produto-form.tsx`, `acabamentos-panel.tsx` + `acabamento-form.tsx`).
- `components/madeireira/upload-planilha.tsx`, `mapeamento-colunas.tsx`, `previa-dados.tsx`, `historico-uploads.tsx` — fluxo legado intacto na 5ª aba.

**Hooks:** `useEspecies`, `useMadeirasM3`, `useOutrosProdutos`, `useAcabamentos` (CRUD por madeireira owner); `useItensPreco` mantém-se para consumo legado.

#### F4.1 — Espécies de Madeira

```typescript
const especieSchema = z.object({
  nome: z.string().min(2).max(80),
  custo_m3: z.number().positive(),
  margem_lucro_pct: z.number().min(0).max(500),
})
```

Preview ao vivo: `valor_m3_venda = custo_m3 * (1 + margem_lucro_pct/100)`, formatado em BRL.
Unicidade: `(madeireira_id, lower(nome))`.

#### F4.2 — Madeiras m³

```typescript
const madeiraM3Schema = z.object({
  especie_id: z.string().uuid(),
  nome: z.string().min(2).max(120),
  espessura_cm: z.number().positive(),
  largura_cm: z.number().positive(),
  comprimento_m: z.number().positive().default(1),
  disponivel: z.boolean().default(true),
  comprimentos: z.array(z.object({
    id: z.string().uuid().optional(),
    comprimento_m: z.number().positive(),
    disponivel: z.boolean().default(true),
  })).min(1, 'Cadastre ao menos um comprimento disponível'),
})
```

**Preview ao vivo** (reage via `watch`): `calcularValorMadeiraM3(esp, larg, comp, calcularValorVendaM3(custo, margem))`.
**Seção de comprimentos** (`useFieldArray`): input numérico + botão Adicionar, chips de sugestão (1 / 1.5 / 2 / 2.5 / 3 m), toggle `disponivel`, remove. Tabela lateral calcula preço por comprimento em tempo real.
**Persistência:** transação única — upsert da Madeira m³ + upsert/delete dos comprimentos.
**Guard:** se a madeireira não tiver nenhuma espécie, bloquear com empty state.

#### F4.3 — Outros Produtos

```typescript
const outroProdutoSchema = z.object({
  nome: z.string().min(2).max(120),
  unidade: z.string().min(1).max(10),
  preco_unitario: z.number().nonnegative(),
  descricao: z.string().max(300).optional(),
  disponivel: z.boolean().default(true),
})
```

#### F4.4 — Serviços de Acabamento

```typescript
const acabamentoSchema = z.object({
  nome: z.string().min(2).max(80),
  percentual_acrescimo: z.number().min(0).max(500),
  ativo: z.boolean().default(true),
})
```

#### F4.5 — Importação via Planilha (legado)

**Rotas:** `/madeireira/precos/novo`.

**Fluxo:** drag-and-drop → parse CSV/XLSX → mapeamento de colunas → prévia com validação → confirma → cria `tabelas_preco` + batch insert `itens_preco` → ativação atômica da nova tabela.

**Constantes:**
```typescript
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024
export const ACCEPTED_TYPES = ['.csv', '.xlsx', '.xls']
export const COLUNAS_OBRIGATORIAS = ['nome', 'unidade', 'preco_unitario']
```

**Validação (Zod):** `itemPrecoSchema` (nome, unidade obrigatórios; `preco_unitario` positivo; `disponivel` default true).

**Critérios:** arquivo > 10MB rejeitado; linha com erro não bloqueia import das válidas; ativação de tabela atômica; histórico lista upload_at + total de itens.

---

### F5 — Vinculação Carpinteiro ↔ Madeireira

`carpinteiro` busca `madeireira` por nome/cidade e solicita (`status = pendente`). Madeireira aprova/rejeita em `/madeireira/parceiros`. Regra: carpinteiro só tem UMA vinculação ativa — nova solicitação cancela a anterior.

**Critérios:** busca < 500ms; atualização sem refresh (Realtime ou polling); rejeição aceita motivo opcional.

---

### F6 — Criação de Orçamento

Wizard multi-step em `/carpinteiro/orcamentos/novo`.

**Componentes:** `step-projeto.tsx`, `step-materiais.tsx` (**consome `useCatalogoProdutos`**), `item-material.tsx` (renderiza badges de origem/acabamento), `step-financeiro.tsx`, `resumo-orcamento.tsx`.

**`useCatalogoProdutos`:** resolve madeireira via vinculação aprovada; roda 3 queries em paralelo (`madeiras_m3` + `especies` + `comprimentos_madeira_m3`; `outros_produtos`; `itens_preco` da tabela ativa); unifica em `CatalogoItem[]`; debounce 300ms no filtro.

**Cálculo (`src/lib/calcular-orcamento.ts`):**
```typescript
export function calcularOrcamento(params: {
  itens: ItemOrcamento[]
  maoObraTipo: 'fixo' | 'hora'
  maoObraValor: number
  maoObraHoras?: number
  margemLucro: number
  imposto: number
}): ResumoOrcamento {
  const subtotalMateriais = params.itens.reduce((a, i) => a + i.subtotal, 0)
  const subtotalMaoObra = params.maoObraTipo === 'fixo'
    ? params.maoObraValor
    : params.maoObraValor * (params.maoObraHoras ?? 0)
  const base = subtotalMateriais + subtotalMaoObra
  const valorMargem = base * (params.margemLucro / 100)
  const valorImposto = (base + valorMargem) * (params.imposto / 100)
  const total = base + valorMargem + valorImposto
  return { subtotalMateriais, subtotalMaoObra, valorMargem, valorImposto, total }
}
```

**Cálculo de Madeira (`src/lib/calcular-madeira.ts`):**
```typescript
export function calcularValorVendaM3(custo: number, margemPct: number) {
  return custo * (1 + margemPct / 100)
}
export function calcularValorMadeiraM3(esp: number, larg: number, comp: number, valorVendaM3: number) {
  return (esp / 100) * (larg / 100) * comp * valorVendaM3
}
export function aplicarAcabamento(preco: number, percentual: number) {
  return preco * (1 + percentual / 100)
}
```

**Fluxo no step Materiais:**
- Clicar num item abre `Dialog`.
- **Madeira m³:** `Select` de comprimento (apenas opções com `disponivel=true`, label "1,50 m — R$ 47,25"), `Select` opcional de Acabamento, campo Quantidade. Preview: `preco_base × (1 + acabamento_pct/100) × quantidade`. Se não houver comprimento cadastrado, bloquear Adicionar.
- **Outro Produto / legado:** apenas Quantidade.

**Store (`useOrcamentoStore`):** `ItemOrcamentoCalculo` com `origem`, `id_origem`, snapshots de espécie/dimensões/comprimento e acabamento.

**Validação:**
```typescript
const itemOrcamentoInputSchema = z.discriminatedUnion('origem', [
  z.object({ origem: z.literal('madeira_m3'), madeira_m3_id: z.string().uuid(), comprimento_id: z.string().uuid(), acabamento_id: z.string().uuid().nullable(), quantidade: z.number().positive() }),
  z.object({ origem: z.literal('outro_produto'), outro_produto_id: z.string().uuid(), quantidade: z.number().positive() }),
  z.object({ origem: z.literal('legado_planilha'), item_preco_id: z.string().uuid(), quantidade: z.number().positive() }),
])
const orcamentoSchema = z.object({
  tipo_projeto: z.enum(['movel', 'estrutura']),
  nome: z.string().min(3).max(100),
  cliente_nome: z.string().min(2),
  cliente_telefone: z.string().optional(),
  cliente_email: z.string().email().optional(),
  itens: z.array(itemOrcamentoInputSchema).min(1),
  mao_obra_tipo: z.enum(['fixo', 'hora']),
  mao_obra_valor: z.number().min(0),
  mao_obra_horas: z.number().positive().optional(),
  margem_lucro: z.number().min(0).max(100),
  imposto: z.number().min(0).max(100),
  validade_dias: z.number().int().min(1).max(365),
  exibir_materiais_pdf: z.boolean(),
  exibir_mao_obra_pdf: z.boolean(),
})
```

**Critérios:**
- [ ] Autosave de rascunho a cada 30s (debounce).
- [ ] Preços vêm do catálogo da madeireira vinculada (unificado).
- [ ] Ao finalizar, valores são desnormalizados em `orcamentos` e `itens_orcamento` (snapshot).
- [ ] Carpinteiro sem vinculação não cria orçamento (CTA de vinculação).
- [ ] Busca de materiais < 300ms (debounce + índice).
- [ ] Orçamentos antigos (pré-migration 002) carregam normalmente via `item_preco_id`.

---

### F7 — Geração de PDF

**Componentes:** `lib/pdf.ts` (helpers), `components/orcamento/pdf-document.tsx`, `components/orcamento/botao-exportar-pdf.tsx`.

Layout editorial com logo e cores do carpinteiro. Para Madeira m³: linha auxiliar em `text-secondary uppercase tracking-widest text-[10px]` com `{especie_nome} · {esp}×{larg}×{comp}m` + "Acabamento: {nome} (+{pct}%)".

Flags `exibir_materiais_pdf` e `exibir_mao_obra_pdf` controlam detalhamento.

**Critérios:** PDF em < 3s; logo base64 para evitar CORS; valores em pt-BR (`Intl.NumberFormat`); disponível para `status ∈ { finalizado, enviado }`.

---

### F8 — Dashboard

**Carpinteiro:** total orçado no mês, rascunhos, finalizados, 5 recentes, CTA de vinculação.
**Madeireira:** parceiros ativos, solicitações pendentes (badge), último upload, contagem por categoria do catálogo.

**Critérios:** dados < 2s; skeleton; empty states com CTA.

---

## 4. Estrutura de Pastas

```
src/
├── components/
│   ├── ui/                              # shadcn + primitives Timber Grain
│   ├── layout/
│   │   ├── app-sidebar.tsx
│   │   ├── app-header.tsx
│   │   ├── page-wrapper.tsx
│   │   └── auth-guard.tsx
│   ├── orcamento/
│   │   ├── step-projeto.tsx
│   │   ├── step-materiais.tsx
│   │   ├── item-material.tsx
│   │   ├── step-financeiro.tsx
│   │   ├── resumo-orcamento.tsx
│   │   ├── pdf-document.tsx
│   │   └── botao-exportar-pdf.tsx
│   ├── madeireira/
│   │   ├── catalogo/
│   │   │   ├── tabs-produtos.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── especies-panel.tsx
│   │   │   ├── especie-form.tsx
│   │   │   ├── madeiras-m3-panel.tsx
│   │   │   ├── madeira-m3-form.tsx
│   │   │   ├── outros-produtos-panel.tsx
│   │   │   ├── outro-produto-form.tsx
│   │   │   ├── acabamentos-panel.tsx
│   │   │   └── acabamento-form.tsx
│   │   ├── upload-planilha.tsx
│   │   ├── mapeamento-colunas.tsx
│   │   ├── previa-dados.tsx
│   │   ├── historico-uploads.tsx
│   │   └── card-solicitacao.tsx
│   ├── carpinteiro/
│   │   └── busca-madeireira.tsx
│   └── shared/
│       ├── logo-uploader.tsx
│       ├── configuracoes-financeiras.tsx
│       └── stat-card.tsx
├── pages/
│   ├── auth/
│   ├── carpinteiro/
│   └── madeireira/
├── hooks/
│   ├── useAuth.ts
│   ├── useOrcamento.ts
│   ├── useItensPreco.ts                 # legado
│   ├── useCatalogoProdutos.ts           # unifica novo + legado
│   ├── useEspecies.ts
│   ├── useMadeirasM3.ts
│   ├── useOutrosProdutos.ts
│   ├── useAcabamentos.ts
│   ├── useVinculacao.ts
│   └── usePdf.ts
├── stores/
│   ├── useAuthStore.ts
│   ├── useOrcamentoStore.ts
│   └── useUploadStore.ts
├── lib/
│   ├── utils.ts
│   ├── supabase.ts
│   ├── pdf.ts
│   ├── calcular-orcamento.ts
│   ├── calcular-madeira.ts
│   ├── parse-planilha.ts
│   ├── validar-cpf-cnpj.ts
│   └── schemas/
│       ├── especie-schema.ts
│       ├── madeira-m3-schema.ts
│       ├── outro-produto-schema.ts
│       └── acabamento-schema.ts
├── types/
│   ├── common.ts
│   ├── carpinteiro.ts
│   ├── madeireira.ts
│   ├── produto.ts
│   ├── orcamento.ts
│   ├── vinculacao.ts
│   └── supabase-generated.ts
├── constants/
└── assets/

supabase/
└── migrations/
    ├── 001_initial_schema.sql
    └── 002_catalogo_produtos.sql
```

---

## 5. Rotas da Aplicação

```typescript
// src/constants/routes.ts
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  CARPINTEIRO_DASHBOARD: '/carpinteiro/dashboard',
  CARPINTEIRO_PERFIL: '/carpinteiro/perfil',
  CARPINTEIRO_VINCULACAO: '/carpinteiro/vinculacao',
  CARPINTEIRO_ORCAMENTOS: '/carpinteiro/orcamentos',
  CARPINTEIRO_NOVO_ORCAMENTO: '/carpinteiro/orcamentos/novo',
  CARPINTEIRO_ORCAMENTO: (id: string) => `/carpinteiro/orcamentos/${id}`,
  CARPINTEIRO_ORCAMENTO_EDITAR: (id: string) => `/carpinteiro/orcamentos/${id}/editar`,

  MADEIREIRA_DASHBOARD: '/madeireira/dashboard',
  MADEIREIRA_PERFIL: '/madeireira/perfil',
  MADEIREIRA_PRECOS: '/madeireira/precos',            // tabbed layout (5 abas)
  MADEIREIRA_PRECOS_NOVO: '/madeireira/precos/novo',  // wizard de upload
  MADEIREIRA_PARCEIROS: '/madeireira/parceiros',
} as const
```

**Proteção:** `/carpinteiro/*` requer role carpinteiro; `/madeireira/*` requer role madeireira; `/` redireciona conforme role.

---

## 6. Integrações

### Supabase

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase-generated'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
```

**Tabelas:** `carpinteiros`, `madeireiras`, `vinculacoes`, `tabelas_preco`, `itens_preco`, `especies_madeira`, `madeiras_m3`, `comprimentos_madeira_m3`, `outros_produtos`, `servicos_acabamento`, `orcamentos`, `itens_orcamento`.

**Storage:** bucket `logos` (leitura pública, escrita por `auth.uid()`).

**RLS — padrão do catálogo (migration 002):**
```sql
-- Dona da madeireira: full access
CREATE POLICY "<tab>_madeireira_all" ON <tab> FOR ALL USING (
  EXISTS (SELECT 1 FROM madeireiras m
          WHERE m.id = <tab>.madeireira_id AND m.user_id = auth.uid())
);
-- Carpinteiro vinculado aprovado: só leitura
CREATE POLICY "<tab>_vinculados_select" ON <tab> FOR SELECT USING (
  EXISTS (SELECT 1 FROM vinculacoes v
          JOIN carpinteiros c ON c.id = v.carpinteiro_id
          WHERE v.madeireira_id = <tab>.madeireira_id
            AND v.status = 'aprovada'
            AND c.user_id = auth.uid())
);
-- comprimentos_madeira_m3: resolve via JOIN em madeiras_m3
```

### Upload de Planilhas

```typescript
// src/lib/parse-planilha.ts
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export async function parsePlanilha(file: File): Promise<RawRow[]> {
  if (file.name.endsWith('.csv')) return parseCsv(file)
  return parseExcel(file)
}
```

### Geração de PDF

```typescript
// src/hooks/usePdf.ts
import { pdf } from '@react-pdf/renderer'
import { PdfDocument } from '@/components/orcamento/pdf-document'

export function usePdf() {
  const exportar = async (orcamento: Orcamento, itens: ItemOrcamento[]) => {
    const blob = await pdf(<PdfDocument orcamento={orcamento} itens={itens} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orcamento-${orcamento.id}-${orcamento.cliente_nome}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }
  return { exportar }
}
```

---

## 7. Segurança

### Autenticação
- Supabase Auth com JWT. SDK gerencia refresh e persistência.
- Sessão inválida → redirect `/login` via `AuthGuard`.

### Autorização
- Role derivado do registro em `carpinteiros`/`madeireiras` — nunca de claim JWT.
- Dupla verificação: UI bloqueia acesso + RLS rejeita queries.

### RLS — princípios
- **Todas** as tabelas têm RLS habilitado.
- Dona (madeireira ou carpinteiro) → `FOR ALL` com `auth.uid()`.
- Consumidor (carpinteiro vinculado) → `FOR SELECT` via JOIN em `vinculacoes WHERE status = 'aprovada'`.
- Tabelas sem `madeireira_id` direto resolvem via JOIN na tabela pai.
- Constraint `CHECK` em `itens_orcamento` garante consistência `origem` × FK.

### Dados Sensíveis
- Variáveis de ambiente permitidas no client: **apenas** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Service role **nunca** no bundle.
- Operações privilegiadas exclusivamente em Edge Functions.
- CPF/CNPJ armazenados sem máscara; máscara só na apresentação.
- Preços visíveis apenas por vinculados (via RLS).

### Upload
- Validação de MIME no client + tamanho máx (10MB planilha, 2MB logo).
- Sanitização de colunas antes do batch insert; preços negativos rejeitados.
- Storage com políticas por `user_id`.

### Frontend
- Sem `dangerouslySetInnerHTML` com dados do usuário.
- Logs nunca contêm dados sensíveis.
- Validação Zod em **todos** os formulários e boundaries externos.

---

## 8. Performance

### Metas
- LCP < 2.5s.
- Qualquer página < 3s em 4G.
- Busca de materiais < 300ms.
- PDF < 3s.

### Estratégias
- **Code splitting:** React Router com `lazy()` por rota.
- **Índices Postgres:**
  - `itens_preco.nome` full-text.
  - `madeiras_m3.especie_id`, `madeiras_m3.madeireira_id`.
  - `comprimentos_madeira_m3(madeira_m3_id) WHERE disponivel = true`.
  - `orcamentos(carpinteiro_id, created_at)`.
  - `vinculacoes(carpinteiro_id, status)`.
- **Debounce:** 300ms na busca do catálogo; 30s no autosave do wizard.
- **Paginação:** máx 50 por query.
- **Cache:** `useRef` em `useCatalogoProdutos` para evitar re-fetch em remontagem rápida.

### Bundle
```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router'],
        'pdf': ['@react-pdf/renderer'],
        'spreadsheet': ['papaparse', 'xlsx'],
        'supabase': ['@supabase/supabase-js'],
      }
    }
  }
}
```

---

## Próximo Passo

Backlog ativo em `ISSUES-catalogo-produtos.md`. Para executar uma issue, use o comando `/execute`.
