# Arquitetura — OrçaMadeira

## Stack (versões instaladas)

| Camada | Tecnologia | Versão | Justificativa |
|--------|-----------|--------|---------------|
| UI Framework | React | 19.2 | Ecossistema maduro, concurrency |
| Linguagem | TypeScript | 6.x strict | Segurança de tipos |
| Build | Vite | 8.x | HMR rápido |
| Estilização | Tailwind CSS 4 + Timber Grain tokens | 4.2 | Utility-first |
| Componentes | shadcn/ui (radix-nova) | 4.1 | Acessível, customizável |
| Ícones | Lucide React | 1.7 | Consistente com shadcn |
| Roteamento | React Router | 7.14 | Padrão do ecossistema |
| Estado global | Zustand | 5.0 | Leve, TypeScript-first |
| Formulários | React Hook Form + Zod | 7.72 / 4.3 | Validação type-safe |
| Backend | Supabase JS | 2.101 | Auth + DB + Storage + RLS |
| PDF | @react-pdf/renderer | 4.4 | Geração client-side |
| Upload/Parse | PapaParse + SheetJS | 5.5 / 0.18 | CSV/Excel |

## Estrutura de Pastas

```
src/
├── components/
│   ├── ui/                   # shadcn/ui + primitives Timber Grain (não editar manualmente)
│   ├── layout/               # Header, Sidebar, PageWrapper, AuthGuard
│   ├── orcamento/            # Fluxo de orçamento do carpinteiro
│   ├── madeireira/
│   │   ├── catalogo/         # Abas do catálogo (Espécies, Madeiras m³, Outros, Acabamentos)
│   │   └── *.tsx             # Upload de planilha (legado), parceiros
│   ├── carpinteiro/          # Busca de madeireira, vinculação
│   └── shared/               # Reutilizáveis de negócio
├── pages/
│   ├── auth/                 # Login, Register, ForgotPassword
│   ├── carpinteiro/          # Dashboard, Orçamentos, Perfil, Vinculação
│   └── madeireira/           # Dashboard, Preços (5 abas), Parceiros, Perfil
├── hooks/                    # Data access — Catálogo, Orçamento, Auth, PDF
├── lib/
│   ├── utils.ts              # shadcn cn()
│   ├── supabase.ts           # createClient<Database>()
│   ├── pdf.ts                # Helpers: formatBRL, formatDate
│   ├── calcular-orcamento.ts # Fórmula de orçamento
│   ├── calcular-madeira.ts   # valorVendaM3, valorMadeiraM3, aplicarAcabamento
│   ├── parse-planilha.ts     # Wrappers PapaParse + SheetJS
│   ├── validar-cpf-cnpj.ts
│   └── schemas/              # Zod schemas de forms
├── types/
│   ├── common.ts             # Enums, UserRole, OrigemItem
│   ├── carpinteiro.ts
│   ├── madeireira.ts
│   ├── produto.ts            # Espécie, MadeiraM3, Comprimento, OutroProduto, Acabamento, CatalogoItem
│   ├── orcamento.ts
│   ├── vinculacao.ts
│   └── supabase-generated.ts # Gerado via MCP
├── stores/                   # Zustand stores
├── constants/
└── assets/

supabase/
└── migrations/
    ├── 001_initial_schema.sql       # Tabelas base + vinculação + tabelas_preco legado
    └── 002_catalogo_produtos.sql    # 5 tabelas novas + RLS + ALTER itens_orcamento
```

## Modelo de Dados

### Catálogo relacional (migration 002)
- `especies_madeira (madeireira_id, nome, custo_m3, margem_lucro_pct)` — base de cálculo. `valor_m3_venda` é derivado.
- `madeiras_m3 (especie_id, nome, espessura, largura, comprimento_ref, disponivel)` — herda preço da espécie.
- `comprimentos_madeira_m3 (madeira_m3_id, comprimento_m, disponivel)` — 1:N, lista que o carpinteiro vê no Select.
- `outros_produtos (nome, unidade, preco_unitario)` — preço fixo.
- `servicos_acabamento (nome, percentual_acrescimo)` — modificadores no orçamento.

### Item de orçamento polimórfico
`itens_orcamento.origem ∈ {'legado_planilha', 'madeira_m3', 'outro_produto'}` com `CHECK` garantindo coerência com a FK correspondente (`item_preco_id`, `madeira_m3_id`, `outro_produto_id`). Snapshots de espécie/dimensões/acabamento congelados na finalização.

### RLS (padrão)
1. **Dona** (madeireira ou carpinteiro) → `FOR ALL` usando `auth.uid()`.
2. **Consumidor** (carpinteiro vinculado aprovado) → `FOR SELECT` via JOIN em `vinculacoes WHERE status = 'aprovada'`.
3. Tabelas sem `madeireira_id` direto (ex.: `comprimentos_madeira_m3`) resolvem o ownership via JOIN na tabela pai.

## Decisões Arquiteturais (ADR)

- **ADR-001 SPA:** aplicação 100% autenticada; SEO irrelevante; deploy simples.
- **ADR-002 Supabase:** Auth + Postgres + Storage sem backend custom no MVP.
- **ADR-003 PDF client-side:** zero custo de servidor, offline, `@react-pdf/renderer`.
- **ADR-004 Zustand:** API mínima, boa integração com TypeScript.
- **ADR-005 Zod:** type inference + composable + integra com React Hook Form via `zodResolver`.
- **ADR-006 Boas práticas:** código limpo, comentários em pt-BR por bloco lógico explicando o **porquê**.
- **ADR-007 Catálogo relacional:** 4 categorias de cadastro direto no app como fluxo principal; upload de planilha permanece como importação legada e convive com o catálogo (carpinteiro vê tudo unificado).
- **ADR-008 Snapshot em `itens_orcamento`:** após `finalizado`, `preco_unitario` e metadados são imutáveis. Mudanças de catálogo não afetam orçamentos fechados.
- **ADR-009 Preço derivado:** `valor_m3_venda` e `valor_unitario` de Madeira m³ **não** são armazenados — calculados em `src/lib/calcular-madeira.ts`. Ajustar custo/margem da espécie reflete no catálogo ativo.
- **ADR-010 RLS first:** toda autorização é duplicada no banco. UI bloqueia por UX; Postgres bloqueia por segurança.
- **ADR-011 Secrets:** apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no client. Service role **somente** em Edge Functions.
