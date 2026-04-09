# Especificação Técnica - OrçaMadeira

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
│  │  (JWT)   │  │   (DB)   │  │  (Files) │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

### Stack Completa

| Camada | Tecnologia | Versão | Justificativa |
|--------|-----------|--------|---------------|
| UI Framework | React | 19 | Concurrency features, já configurado |
| Linguagem | TypeScript | strict | Type safety end-to-end |
| Build | Vite | 8 | HMR rápido, bundle otimizado |
| Estilização | Tailwind CSS | 4 | Utility-first, sem CSS custom |
| Componentes | shadcn/ui (radix-nova) | latest | Acessível (WCAG), customizável |
| Ícones | Lucide React | latest | Consistente com shadcn |
| Roteamento | React Router | v7 | Padrão do ecossistema React |
| Estado global | Zustand | latest | Leve, zero boilerplate, TypeScript-first |
| Formulários | React Hook Form | latest | Performance (uncontrolled) |
| Validação | Zod | latest | Type inference automático |
| Backend | Supabase | latest | Auth + DB + Storage sem backend custom |
| PDF | @react-pdf/renderer | latest | Geração client-side, sem custo de servidor |
| CSV/Excel | PapaParse + SheetJS | latest | Parse robusto de planilhas |

### Decisões Arquiteturais

- **ADR-001 SPA:** Aplicação 100% autenticada, SEO irrelevante, deploy simples (qualquer CDN/Vercel).
- **ADR-002 Supabase:** Elimina necessidade de backend custom no MVP. PostgreSQL com RLS para segurança por linha.
- **ADR-003 PDF client-side:** Zero custo de servidor, funciona offline, gerado sob demanda.
- **ADR-004 Zustand:** API mínima (`create`, `set`, `get`), sem Context hell.
- **ADR-005 Zod:** Schema único compartilhado entre validação de formulário e tipagem TypeScript.
- **ADR-006 RLS (Row Level Security):** Toda regra de acesso aplicada no banco — carpinteiro só vê seus próprios orçamentos, madeireira só vê seus parceiros.

---

## 2. Modelos de Dados

### Entidades

```typescript
// src/types/common.ts
export type UserRole = 'carpinteiro' | 'madeireira'
export type VinculacaoStatus = 'pendente' | 'aprovada' | 'rejeitada'
export type OrcamentoStatus = 'rascunho' | 'finalizado' | 'enviado'
export type TipoProjeto = 'movel' | 'estrutura'

// src/types/carpinteiro.ts
export interface Carpinteiro {
  id: string
  user_id: string          // ref: auth.users
  nome: string
  cpf_cnpj: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  logo_url: string | null
  margem_lucro_padrao: number      // percentual ex: 20 = 20%
  valor_hora_mao_obra: number      // BRL
  imposto_padrao: number           // percentual ex: 5 = 5%
  madeireira_id: string | null     // madeireira vinculada atual
  created_at: string
  updated_at: string
}

// src/types/madeireira.ts
export interface Madeireira {
  id: string
  user_id: string          // ref: auth.users
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
  ativo: boolean           // apenas uma tabela ativa por madeireira
}

export interface ItemPreco {
  id: string
  tabela_id: string
  codigo: string | null
  nome: string
  categoria: string | null
  descricao: string | null
  unidade: string          // ex: m², m³, ml, un, kg
  preco_unitario: number   // BRL
  disponivel: boolean
}

// src/types/orcamento.ts
export interface Orcamento {
  id: string
  carpinteiro_id: string
  madeireira_id: string
  tabela_snapshot_id: string   // ref: tabela vigente no momento da finalização
  status: OrcamentoStatus
  tipo_projeto: TipoProjeto
  nome: string
  descricao: string | null
  // dados do cliente
  cliente_nome: string
  cliente_telefone: string | null
  cliente_email: string | null
  // configurações financeiras (snapshot do momento da criação)
  mao_obra_tipo: 'fixo' | 'hora'
  mao_obra_valor: number       // valor fixo ou valor/hora
  mao_obra_horas: number | null // só quando tipo = 'hora'
  margem_lucro: number         // percentual
  imposto: number              // percentual
  validade_dias: number        // dias de validade do orçamento
  termos_condicoes: string | null
  // calculados (desnormalizados para PDF e histórico)
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
  item_preco_id: string
  // snapshot do preço no momento
  nome: string
  unidade: string
  preco_unitario: number
  quantidade: number
  subtotal: number          // quantidade * preco_unitario
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
auth.users (Supabase Auth)
  ├── Carpinteiro (1:1 via user_id)
  │     ├── Orcamento (1:N via carpinteiro_id)
  │     │     └── ItemOrcamento (1:N via orcamento_id)
  │     └── Vinculacao (1:N via carpinteiro_id)
  │
  └── Madeireira (1:1 via user_id)
        ├── TabelaPreco (1:N via madeireira_id)
        │     └── ItemPreco (1:N via tabela_id)
        └── Vinculacao (1:N via madeireira_id)
```

---

## 3. Funcionalidades Detalhadas

### F1 - Autenticação

**Descrição técnica:** Fluxo completo de autenticação via Supabase Auth (email/senha). Seleção de role no cadastro salva na tabela correspondente.

**Componentes React:**
- `pages/auth/login-page.tsx` — formulário de login
- `pages/auth/register-page.tsx` — formulário de cadastro com seleção de role
- `pages/auth/forgot-password-page.tsx` — solicitação de reset
- `components/layout/auth-guard.tsx` — HOC de proteção de rotas

**Rotas:**
```
/login
/register
/forgot-password
/reset-password    (link do email)
```

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
  nome: z.string().min(2),          // nome do carpinteiro ou razão social
  cpf_cnpj: z.string().min(11),
  telefone: z.string().min(10),
})
```

**Fluxo do usuário:**
1. Acessa `/register` → preenche email, senha, seleciona tipo (carpinteiro/madeireira)
2. Preenche dados básicos do perfil correspondente
3. Supabase cria `auth.users` → trigger cria registro em `carpinteiros` ou `madeireiras`
4. Redirect para dashboard correspondente

**Critérios de aceite:**
- [ ] Erro de email duplicado exibe mensagem amigável
- [ ] Token de reset expira em 1h
- [ ] Sessão persiste após refresh (Supabase session)
- [ ] Rota protegida redireciona para `/login` se não autenticado
- [ ] Role é determinado pelo registro existente no banco (não do token JWT)

---

### F2 - Perfil do Carpinteiro

**Descrição técnica:** CRUD do perfil, upload de logo para Supabase Storage, configuração de defaults financeiros.

**Componentes React:**
- `pages/carpinteiro/perfil-page.tsx`
- `components/shared/logo-uploader.tsx` — upload com preview
- `components/shared/configuracoes-financeiras.tsx` — margem, hora, imposto

**Rotas:**
```
/carpinteiro/perfil
```

**Validações (Zod):**
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

**Fluxo:**
1. Carpinteiro acessa `/carpinteiro/perfil`
2. Edita campos → ao submeter, `UPDATE carpinteiros WHERE id = ?`
3. Upload de logo → `supabase.storage.from('logos').upload()` → salva URL em `logo_url`

**Critérios de aceite:**
- [ ] Logo aceita JPG/PNG, máximo 2MB
- [ ] Preview da logo exibido antes e após upload
- [ ] Configurações padrão pré-preenchem o formulário de orçamento
- [ ] CNPJ/CPF validado com dígito verificador

---

### F3 - Perfil da Madeireira

**Descrição técnica:** CRUD do perfil da madeireira com upload de logo.

**Componentes React:**
- `pages/madeireira/perfil-page.tsx`
- `components/shared/logo-uploader.tsx` (reutilizado)

**Rotas:**
```
/madeireira/perfil
```

**Validações (Zod):**
```typescript
const perfilMadeireiraSchema = z.object({
  razao_social: z.string().min(2).max(150),
  cnpj: z.string().refine(validarCnpj),
  telefone: z.string().min(10).max(15),
  endereco: z.string().min(5),
  cidade: z.string().min(2),
  estado: z.string().length(2),
})
```

**Critérios de aceite:**
- [ ] CNPJ validado com dígito verificador
- [ ] Logo aceita JPG/PNG, máximo 2MB

---

### F4 - Upload de Tabela de Preços (Madeireira)

**Descrição técnica:** Upload de CSV ou Excel, parsing no client-side via PapaParse/SheetJS, mapeamento de colunas, prévia, validação e persistência no banco.

**Componentes React:**
- `pages/madeireira/precos-page.tsx` — listagem de uploads
- `components/madeireira/upload-planilha.tsx` — drag-and-drop com Sheet
- `components/madeireira/mapeamento-colunas.tsx` — seleção de colunas
- `components/madeireira/previa-dados.tsx` — tabela paginada com erros destacados
- `components/madeireira/historico-uploads.tsx`

**Rotas:**
```
/madeireira/precos
/madeireira/precos/novo
```

**Fluxo:**
1. Madeireira faz drag-and-drop ou seleciona arquivo CSV/XLSX
2. Client-side parse → exibe colunas detectadas
3. Madeireira mapeia colunas: `nome`, `unidade`, `preco_unitario` (obrigatórias), `categoria`, `codigo`, `descricao`, `disponivel` (opcionais)
4. Sistema exibe prévia dos dados com validações destacadas (preços negativos, campos vazios, etc.)
5. Ao confirmar:
   - Cria novo registro em `tabelas_preco` com `ativo = false`
   - Insere todos os `itens_preco` em batch
   - Define tabela anterior como `ativo = false`, nova como `ativo = true`
6. Exibe histórico de uploads com data e quantidade de itens

**Validações:**
```typescript
const itemPrecoSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  unidade: z.string().min(1, 'Unidade obrigatória'),
  preco_unitario: z.number().positive('Preço deve ser positivo'),
  categoria: z.string().optional(),
  codigo: z.string().optional(),
  descricao: z.string().optional(),
  disponivel: z.boolean().default(true),
})
```

**Constantes:**
```typescript
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = ['.csv', '.xlsx', '.xls']
const COLUNAS_OBRIGATORIAS = ['nome', 'unidade', 'preco_unitario']
```

**Critérios de aceite:**
- [ ] Arquivo maior que 10MB rejeitado com mensagem
- [ ] Linha com erro não bloqueia import — exibe contagem de linhas com erro
- [ ] Tabela anterior desativada atomicamente ao confirmar nova
- [ ] Histórico exibe: data, total de itens, quem fez upload

---

### F5 - Vinculação Carpinteiro ↔ Madeireira

**Descrição técnica:** Fluxo de solicitação e aprovação. Carpinteiro busca madeireira, envia solicitação. Madeireira vê pendentes e aprova/rejeita.

**Componentes React:**
- `pages/carpinteiro/vinculacao-page.tsx` — busca e status atual
- `pages/madeireira/parceiros-page.tsx` — solicitações e parceiros ativos
- `components/carpinteiro/busca-madeireira.tsx` — input de busca com resultados
- `components/madeireira/card-solicitacao.tsx` — aprovar/rejeitar

**Rotas:**
```
/carpinteiro/vinculacao
/madeireira/parceiros
```

**Fluxo do Carpinteiro:**
1. Acessa `/carpinteiro/vinculacao`
2. Busca madeireira por nome ou cidade (query no banco)
3. Clica em "Solicitar Parceria" → cria `vinculacao` com `status = 'pendente'`
4. Exibe status da solicitação em tempo real (Supabase Realtime ou polling)
5. Após aprovação, acessa tabela de preços da madeireira

**Fluxo da Madeireira:**
1. Acessa `/madeireira/parceiros`
2. Vê lista de solicitações pendentes
3. Aprova → `status = 'aprovada'` / Rejeita → `status = 'rejeitada'`
4. Lista de parceiros ativos com opção de remover

**Regras de negócio:**
- Carpinteiro só pode ter UMA vinculação ativa por vez
- Nova solicitação cancela a anterior automaticamente
- Madeireira pode ter N carpinteiros parceiros

**Critérios de aceite:**
- [ ] Busca retorna resultados em < 500ms
- [ ] Carpinteiro com vinculação pendente não pode solicitar outra
- [ ] Rejeição exibe motivo opcional da madeireira
- [ ] Status atualiza sem refresh de página

---

### F6 - Criação de Orçamento

**Descrição técnica:** Wizard multi-step para criação de orçamento. Busca de itens da tabela da madeireira vinculada. Cálculo em tempo real.

**Componentes React:**
- `pages/carpinteiro/orcamentos-page.tsx` — listagem
- `pages/carpinteiro/novo-orcamento-page.tsx` — wizard
- `components/orcamento/step-projeto.tsx` — tipo, nome, cliente
- `components/orcamento/step-materiais.tsx` — busca e adição de itens
- `components/orcamento/item-material.tsx` — linha da tabela com quantidade
- `components/orcamento/step-financeiro.tsx` — mão de obra, margem, impostos
- `components/orcamento/resumo-orcamento.tsx` — totalizador em tempo real

**Rotas:**
```
/carpinteiro/orcamentos
/carpinteiro/orcamentos/novo
/carpinteiro/orcamentos/:id
/carpinteiro/orcamentos/:id/editar
```

**Cálculo (lib/calcular-orcamento.ts):**
```typescript
export function calcularOrcamento(params: {
  itens: ItemOrcamento[]
  maoObraTipo: 'fixo' | 'hora'
  maoObraValor: number
  maoObraHoras?: number
  margemLucro: number   // percentual
  imposto: number       // percentual
}): ResumoOrcamento {
  const subtotalMateriais = itens.reduce((acc, i) => acc + i.subtotal, 0)
  const subtotalMaoObra = maoObraTipo === 'fixo'
    ? maoObraValor
    : maoObraValor * (maoObraHoras ?? 0)
  const base = subtotalMateriais + subtotalMaoObra
  const valorMargem = base * (margemLucro / 100)
  const valorImposto = (base + valorMargem) * (imposto / 100)
  const total = base + valorMargem + valorImposto
  return { subtotalMateriais, subtotalMaoObra, valorMargem, valorImposto, total }
}
```

**Fluxo:**
1. Carpinteiro clica em "Novo Orçamento"
2. **Step 1 - Projeto:** tipo (móvel/estrutura), nome, descrição, dados do cliente
3. **Step 2 - Materiais:** busca por nome/categoria nos `itens_preco` da madeireira vinculada → adiciona com quantidade → subtotal calculado em tempo real
4. **Step 3 - Financeiro:** mão de obra (fixo ou hora × horas), margem de lucro %, impostos %, validade, termos
5. **Resumo:** exibe breakdown completo com total
6. **Salvar rascunho** (a qualquer momento) ou **Finalizar** (congela preços via snapshot)

**Validações:**
```typescript
const orcamentoSchema = z.object({
  tipo_projeto: z.enum(['movel', 'estrutura']),
  nome: z.string().min(3).max(100),
  cliente_nome: z.string().min(2),
  cliente_telefone: z.string().optional(),
  cliente_email: z.string().email().optional(),
  itens: z.array(z.object({
    item_preco_id: z.string().uuid(),
    quantidade: z.number().positive(),
  })).min(1, 'Adicione ao menos um material'),
  mao_obra_tipo: z.enum(['fixo', 'hora']),
  mao_obra_valor: z.number().min(0),
  mao_obra_horas: z.number().positive().optional(),
  margem_lucro: z.number().min(0).max(100),
  imposto: z.number().min(0).max(100),
  validade_dias: z.number().int().min(1).max(365),
})
```

**Critérios de aceite:**
- [ ] Rascunho salvo automaticamente a cada 30s (debounce)
- [ ] Preços vêm exclusivamente da tabela ativa da madeireira vinculada
- [ ] Ao finalizar, os valores são desnormalizados no registro do orçamento
- [ ] Carpinteiro sem madeireira vinculada não consegue criar orçamento (exibe CTA de vinculação)
- [ ] Busca de materiais retorna em < 300ms (índice full-text no Supabase)

---

### F7 - Geração de PDF

**Descrição técnica:** Geração client-side via `@react-pdf/renderer`. Documento profissional com logo, dados do cliente, tabela de materiais e totais.

**Componentes React:**
- `lib/pdf.ts` — funções auxiliares de formatação
- `components/orcamento/pdf-document.tsx` — documento `@react-pdf/renderer`
- `components/orcamento/botao-exportar-pdf.tsx` — trigger com loading state

**Estrutura do PDF:**
```
┌─────────────────────────────────────────┐
│ [Logo Carpinteiro]    OrçaMadeira        │
│ Nome do Carpinteiro   CNPJ               │
│ Telefone | Email                         │
├─────────────────────────────────────────┤
│ ORÇAMENTO #001          Data: 06/04/2026 │
│ Válido até: 06/05/2026                  │
├─────────────────────────────────────────┤
│ CLIENTE                                  │
│ Nome, Telefone, Email                    │
├─────────────────────────────────────────┤
│ MATERIAIS                                │
│ Item | Unid | Qtd | Preço Un. | Subtotal │
│ .... | .... | ... | ......... | ........ │
├─────────────────────────────────────────┤
│                Materiais:    R$ 0.000,00 │
│               Mão de Obra:   R$ 0.000,00 │
│           Margem (XX%):      R$ 0.000,00 │
│          Impostos (XX%):     R$ 0.000,00 │
│                   TOTAL:     R$ 0.000,00 │
├─────────────────────────────────────────┤
│ Termos e Condições:                      │
│ [texto editável]                         │
├─────────────────────────────────────────┤
│ [Nome Carpinteiro] — [Cidade/UF]         │
└─────────────────────────────────────────┘
```

**Fluxo:**
1. Carpinteiro acessa orçamento finalizado
2. Clica em "Exportar PDF" → loading state no botão
3. `@react-pdf/renderer` gera blob → `URL.createObjectURL` → download automático
4. Nome do arquivo: `orcamento-{id}-{cliente}.pdf`

**Critérios de aceite:**
- [ ] PDF gerado em < 3s
- [ ] Logo carregada como base64 antes de gerar (evita CORS)
- [ ] Valores formatados em pt-BR (R$ 1.234,56)
- [ ] Disponível apenas para orçamentos com `status = 'finalizado'`

---

### F8 - Dashboard

**Descrição técnica:** Página inicial pós-login com métricas e atalhos relevantes para cada tipo de usuário.

**Componentes React:**
- `pages/carpinteiro/dashboard-page.tsx`
- `pages/madeireira/dashboard-page.tsx`
- `components/shared/stat-card.tsx` — card de métrica
- `components/orcamento/orcamento-recente-card.tsx`

**Rotas:**
```
/carpinteiro/dashboard
/madeireira/dashboard
```

**Dashboard Carpinteiro:**
- Total orçado no mês corrente (soma de `total` dos orçamentos do mês)
- Número de orçamentos em rascunho
- Número de orçamentos finalizados
- Lista dos 5 orçamentos mais recentes com status e total
- CTA de vinculação se não houver madeireira vinculada

**Dashboard Madeireira:**
- Número de carpinteiros parceiros ativos
- Número de solicitações pendentes
- Data/hora do último upload de preços
- Número de itens na tabela ativa

**Critérios de aceite:**
- [ ] Dados carregados em < 2s
- [ ] Skeleton exibido durante loading
- [ ] Empty state com CTA quando sem orçamentos
- [ ] Badge visual nas solicitações pendentes (madeireira)

---

## 4. Estrutura de Pastas

```
src/
├── components/
│   ├── ui/                        # shadcn/ui — NÃO editar manualmente
│   ├── layout/
│   │   ├── app-sidebar.tsx        # Sidebar com nav por role
│   │   ├── app-header.tsx         # Header com breadcrumb e avatar
│   │   ├── page-wrapper.tsx       # Container com max-width
│   │   └── auth-guard.tsx         # Proteção de rota
│   ├── orcamento/
│   │   ├── step-projeto.tsx
│   │   ├── step-materiais.tsx
│   │   ├── item-material.tsx
│   │   ├── step-financeiro.tsx
│   │   ├── resumo-orcamento.tsx
│   │   ├── pdf-document.tsx
│   │   └── botao-exportar-pdf.tsx
│   ├── madeireira/
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
│   │   ├── login-page.tsx
│   │   ├── register-page.tsx
│   │   └── forgot-password-page.tsx
│   ├── carpinteiro/
│   │   ├── dashboard-page.tsx
│   │   ├── orcamentos-page.tsx
│   │   ├── novo-orcamento-page.tsx
│   │   ├── orcamento-detalhe-page.tsx
│   │   ├── perfil-page.tsx
│   │   └── vinculacao-page.tsx
│   └── madeireira/
│       ├── dashboard-page.tsx
│       ├── precos-page.tsx
│       ├── parceiros-page.tsx
│       └── perfil-page.tsx
├── hooks/
│   ├── useAuth.ts                 # Sessão atual e role
│   ├── useOrcamento.ts            # CRUD de orçamento
│   ├── useItensPreco.ts           # Busca na tabela da madeireira
│   ├── useVinculacao.ts           # Status e operações de vinculação
│   └── usePdf.ts                  # Geração de PDF
├── stores/
│   ├── useAuthStore.ts            # Usuário autenticado e role
│   ├── useOrcamentoStore.ts       # Orçamento em edição (wizard state)
│   └── useUploadStore.ts          # Estado do upload de planilha
├── lib/
│   ├── utils.ts                   # cn() do shadcn
│   ├── supabase.ts                # createClient
│   ├── pdf.ts                     # Helpers: formatBRL, formatDate
│   ├── calcular-orcamento.ts      # Fórmula de cálculo
│   ├── validar-cpf-cnpj.ts        # Validadores
│   └── parse-planilha.ts          # PapaParse + SheetJS wrappers
├── types/
│   ├── common.ts
│   ├── carpinteiro.ts
│   ├── madeireira.ts
│   └── orcamento.ts
├── constants/
│   ├── upload.ts                  # MAX_UPLOAD_SIZE, ACCEPTED_TYPES
│   └── routes.ts                  # Enum de rotas
└── assets/
    └── logo.svg
```

---

## 5. Rotas da Aplicação

```typescript
// src/constants/routes.ts
export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Carpinteiro
  CARPINTEIRO_DASHBOARD: '/carpinteiro/dashboard',
  CARPINTEIRO_PERFIL: '/carpinteiro/perfil',
  CARPINTEIRO_VINCULACAO: '/carpinteiro/vinculacao',
  CARPINTEIRO_ORCAMENTOS: '/carpinteiro/orcamentos',
  CARPINTEIRO_NOVO_ORCAMENTO: '/carpinteiro/orcamentos/novo',
  CARPINTEIRO_ORCAMENTO: (id: string) => `/carpinteiro/orcamentos/${id}`,
  CARPINTEIRO_ORCAMENTO_EDITAR: (id: string) => `/carpinteiro/orcamentos/${id}/editar`,

  // Madeireira
  MADEIREIRA_DASHBOARD: '/madeireira/dashboard',
  MADEIREIRA_PERFIL: '/madeireira/perfil',
  MADEIREIRA_PRECOS: '/madeireira/precos',
  MADEIREIRA_PRECOS_NOVO: '/madeireira/precos/novo',
  MADEIREIRA_PARCEIROS: '/madeireira/parceiros',
} as const
```

**Proteção de rotas:**
- Rotas `/carpinteiro/*` → requer `role = 'carpinteiro'`
- Rotas `/madeireira/*` → requer `role = 'madeireira'`
- Rota `/` → redirect para dashboard conforme role

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

**Tabelas Supabase (PostgreSQL):**
- `carpinteiros`, `madeireiras`, `vinculacoes`
- `tabelas_preco`, `itens_preco`
- `orcamentos`, `itens_orcamento`

**Storage buckets:**
- `logos` — logos de carpinteiros e madeireiras (público com auth)
- Política: só o próprio usuário pode escrever; leitura pública

**RLS (Row Level Security) — exemplos:**
```sql
-- Carpinteiro só acessa seus próprios orçamentos
CREATE POLICY "carpinteiro_own_orcamentos" ON orcamentos
  FOR ALL USING (
    carpinteiro_id = (SELECT id FROM carpinteiros WHERE user_id = auth.uid())
  );

-- Itens de preço: acessíveis apenas por carpinteiros vinculados à madeireira
CREATE POLICY "vinculados_ver_precos" ON itens_preco
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vinculacoes v
      JOIN tabelas_preco t ON t.madeireira_id = v.madeireira_id
      WHERE t.id = itens_preco.tabela_id
        AND v.status = 'aprovada'
        AND v.carpinteiro_id = (SELECT id FROM carpinteiros WHERE user_id = auth.uid())
    )
  );
```

### Upload de Planilhas

```typescript
// src/lib/parse-planilha.ts
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export async function parsePlanilha(file: File): Promise<RawRow[]> {
  if (file.name.endsWith('.csv')) {
    return parseCsv(file)
  }
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
- Supabase Auth com JWT (HS256)
- Tokens armazenados em `localStorage` via SDK do Supabase
- Refresh automático de token (SDK gerencia)
- Sessão inválida redireciona para `/login`

### Autorização (RBAC)
- **Role** determinado pelo registro existente em `carpinteiros` ou `madeireiras`
- `AuthGuard` verifica role no client; RLS garante no servidor
- Dupla verificação: UI bloqueia acesso + banco rejeita queries não autorizadas

### Dados Sensíveis
- Preços da madeireira visíveis apenas por carpinteiros vinculados (RLS)
- Variáveis de ambiente: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Anon key é pública por design do Supabase; segurança real está nas RLS policies
- CNPJ/CPF armazenados sem máscara, exibidos com máscara no frontend

### Upload
- Validação de tipo MIME no client antes do envio
- Tamanho máximo: 10MB (planilhas), 2MB (logos)
- Supabase Storage com políticas por `user_id`

---

## 8. Performance

### Metas
- LCP < 2.5s (Largest Contentful Paint)
- Qualquer página carrega em < 3s em 4G
- Busca de materiais responde em < 300ms
- PDF gerado em < 3s

### Estratégias
- **Code splitting:** React Router com `lazy()` por rota
- **Índices no banco:**
  - `itens_preco.nome` — full-text search (Supabase `to_tsvector`)
  - `orcamentos.carpinteiro_id, created_at` — listagem paginada
  - `vinculacoes.carpinteiro_id, status`
- **Paginação:** máximo 50 itens por query (limite no Supabase)
- **Debounce:** busca de materiais com 300ms de debounce
- **Imagens:** logos convertidas para WebP no upload (futuro)
- **Autosave:** debounce de 30s no wizard de orçamento para evitar writes excessivos

### Bundle
```typescript
// vite.config.ts — code splitting manual
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

Especificação criada. Execute `/break` para quebrar em issues incrementais de desenvolvimento.
