# Arquitetura - OrçaMadeira

## Stack
| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| UI Framework | React 19 | Já configurado, ecossistema maduro |
| Linguagem | TypeScript (strict) | Segurança de tipos |
| Build | Vite 8 | Velocidade de desenvolvimento |
| Estilização | Tailwind CSS 4 | Utility-first, boa DX |
| Componentes | shadcn/ui (radix-nova) | Acessível, customizável |
| Ícones | Lucide React | Consistente com shadcn |
| Roteamento | React Router v7 (a instalar) | Padrão do ecossistema |
| Estado global | Zustand (a instalar) | Leve, simples, TypeScript-friendly |
| Formulários | React Hook Form + Zod (a instalar) | Validação type-safe |
| Backend | Supabase (a definir) | Auth + DB + Storage + Realtime |
| PDF | @react-pdf/renderer (a definir) | Geração client-side |
| Upload/Parse | Papa Parse + SheetJS (a definir) | Parse de planilhas CSV/Excel |

## Estrutura de Pastas
```
src/
├── components/
│   ├── ui/              # shadcn/ui (não editar manualmente)
│   ├── layout/          # Header, Sidebar, Footer, PageWrapper
│   ├── orcamento/       # Componentes do fluxo de orçamento
│   ├── madeireira/      # Componentes específicos da madeireira
│   └── shared/          # Componentes reutilizáveis de negócio
├── pages/
│   ├── auth/            # Login, Register, ForgotPassword
│   ├── carpinteiro/     # Dashboard, Orcamentos, Perfil
│   └── madeireira/      # Dashboard, Precos, Parceiros
├── hooks/
├── lib/
│   ├── utils.ts         # shadcn cn function (já existe)
│   ├── supabase.ts      # Client do Supabase
│   └── pdf.ts           # Helpers de geração de PDF
├── types/
│   ├── orcamento.ts
│   ├── madeireira.ts
│   ├── carpinteiro.ts
│   └── common.ts
├── stores/              # Zustand stores
├── constants/
└── assets/
```

## Decisões Arquiteturais

### ADR-001: SPA (Client-side rendering)
- Aplicação autenticada, SEO não é prioridade, simplifica deploy

### ADR-002: Supabase como backend
- Auth + DB (PostgreSQL) + Storage. Sem backend custom no MVP.
- Status: A confirmar

### ADR-003: PDF no client-side
- Sem custo de servidor, funciona offline

### ADR-004: Zustand para estado global
- API simples, sem boilerplate, boa integração com TypeScript

### ADR-005: Zod para validação
- Type inference automático, composable, funciona com React Hook Form
