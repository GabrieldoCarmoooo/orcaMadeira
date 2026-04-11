# OrçaMadeira

SaaS web/mobile-first para marceneiros e carpinteiros criarem orçamentos profissionais com preços reais de uma madeireira parceira.

## Sobre o produto

- **Carpinteiro/Marceneiro** — cria orçamentos para clientes com materiais da madeireira vinculada, margem de lucro, mão de obra, imposto e exporta PDF profissional com logo e cores de marca.
- **Madeireira** — cadastra produtos (madeira por m³ e outros), faz upload de tabela de preços (CSV/Excel) e disponibiliza para carpinteiros parceiros.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript strict + Vite 8 |
| Estilização | Tailwind CSS 4 + shadcn/ui + **Timber Grain design system** |
| Ícones | Lucide React |
| Roteamento | React Router v7 |
| Estado | Zustand |
| Formulários | React Hook Form + Zod |
| Backend | Supabase (Auth + PostgreSQL + Storage) |
| PDF | @react-pdf/renderer |
| CSV/Excel | PapaParse + SheetJS |

## Design System

**Timber Grain — Master's Atelier**: identidade editorial wood-block, paleta wood gold (#7A5900) + mahogany (#9D422B), sem bordas 1px, glassmorphism no header.

- Conceitual: [`references/NOVODESIGN.md`](references/NOVODESIGN.md)
- Mockups por tela: [`references/design-atualizado/`](references/design-atualizado/)

## Desenvolvimento

```bash
# instalar dependências
npm install

# servidor de desenvolvimento (http://localhost:5173)
npm run dev

# build de produção
npm run build

# lint
npm run lint
```

Variáveis de ambiente necessárias:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Documentação

- [`PRD.md`](PRD.md) — Product Requirements Document
- [`spec.md`](spec.md) — Especificação técnica
- [`CLAUDE.md`](CLAUDE.md) — Regras de negócio e convenções para AI
- [`references/NOVODESIGN.md`](references/NOVODESIGN.md) — Design system Timber Grain
