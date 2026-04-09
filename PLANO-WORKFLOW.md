# Plano: Workflow OrçaMadeira - Comandos, Referências e PRD

## Contexto
SaaS chamado **OrçaMadeira** para carpinteiros/marceneiros criarem orçamentos profissionais com preços reais de madeireiras. O projeto já tem React 19 + TypeScript + Vite + Tailwind CSS 4 + shadcn/ui configurados.

## Respostas coletadas para o PRD
- **Usuários**: Carpinteiro + Madeireira (ambos com login)
- **Preços**: Upload manual de planilha (CSV/Excel)
- **Orçamento**: Materiais + mão de obra + margem + impostos = preço final
- **Madeireiras**: Uma principal por carpinteiro
- **Projetos**: Móveis sob medida E estruturas (telhados, decks, pergolados)
- **Entrega**: PDF profissional com logo
- **Monetização**: Ainda não definido
- **Nome**: OrçaMadeira

---

## Estrutura de Arquivos a Criar

```
app/
├── CLAUDE.md                    # Regras de negócio e convenções
├── PRD.md                       # Product Requirements Document
├── .claude/
│   └── commands/
│       ├── prd.md               # /prd - Cria PRD.md
│       ├── spec.md              # /spec - Cria spec.md a partir do PRD
│       ├── break.md             # /break - Quebra spec em issues
│       └── execute.md           # /execute - Executa uma issue planejada
└── references/
    ├── architecture.md          # Decisões de arquitetura e stack
    ├── design.md                # Design system e padrões de UI
    └── engineering.md           # Padrões de engenharia e código
```

---

## 1. CLAUDE.md

```markdown
# OrçaMadeira - Regras de Negócio e Contexto do Projeto

## Sobre o Produto
OrçaMadeira é um SaaS para marceneiros e carpinteiros criarem orçamentos profissionais com preços reais de madeireiras parceiras.

## Usuários do Sistema

### Carpinteiro/Marceneiro
- Cria orçamentos para clientes finais
- Vincula-se a UMA madeireira parceira principal
- Configura margem de lucro e valor de mão de obra
- Gera PDF profissional do orçamento

### Madeireira
- Faz upload de planilha (CSV/Excel) com tabela de preços
- Atualiza preços manualmente quando necessário
- Atende múltiplos carpinteiros parceiros

## Regras de Negócio Críticas

### Orçamentos
1. Fórmula: **Materiais + Mão de Obra + Margem de Lucro + Impostos = Preço Final**
2. Preços de materiais vêm SEMPRE da tabela da madeireira vinculada
3. O carpinteiro define a mão de obra por projeto ou por hora
4. A margem de lucro é um percentual definido pelo carpinteiro
5. Impostos são configuráveis (ISS, etc.)
6. O orçamento gera um PDF profissional com logo, detalhes e preços

### Tipos de Projeto
- **Móveis**: armários, mesas, prateleiras, cozinhas planejadas
- **Estruturas**: telhados, pergolados, decks, coberturas

### Vinculação Carpinteiro-Madeireira
- Cada carpinteiro se vincula a UMA madeireira principal
- A madeireira precisa aprovar a vinculação
- Se a madeireira atualizar preços, os orçamentos em rascunho usam preços novos
- Orçamentos já finalizados mantêm os preços do momento da finalização

### Upload de Preços (Madeireira)
- Aceita CSV e Excel (.xlsx)
- Colunas obrigatórias: nome do produto, unidade, preço unitário
- Colunas opcionais: categoria, código, descrição, disponibilidade
- Validação de dados no upload (preços negativos, campos vazios, etc.)

## Stack Técnica
- **Frontend**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS 4 + shadcn/ui (radix-nova style)
- **Font**: Inter Variable
- **Icons**: Lucide React
- **Path alias**: `@/` aponta para `./src/`
- **Backend**: Supabase
- **PDF**: A definir (considerar @react-pdf/renderer ou jsPDF)

## Convenções de Código
- Sempre usar TypeScript strict
- Componentes em PascalCase, arquivos em kebab-case
- Usar `@/` para imports absolutos
- Componentes UI ficam em `src/components/ui/` (gerenciados pelo shadcn)
- Componentes de negócio ficam em `src/components/`
- Pages ficam em `src/pages/`
- Hooks customizados em `src/hooks/`
- Types/interfaces em `src/types/`
- Utilitários em `src/lib/`
- Escrever código e comentários em inglês
- Nomes de variáveis de negócio podem usar português (ex: `orcamento`, `madeireira`)
- Commits em inglês

## Referências
- Arquitetura: `references/architecture.md`
- Design: `references/design.md`
- Engenharia: `references/engineering.md`
- PRD: `PRD.md`
```

---

## 2. PRD.md

```markdown
# PRD - OrçaMadeira

## Visão do Produto
OrçaMadeira é uma plataforma SaaS que conecta carpinteiros/marceneiros a madeireiras, permitindo a criação de orçamentos profissionais com preços reais e atualizados.

## Problema
Carpinteiros perdem tempo criando orçamentos manualmente, consultando preços por telefone/WhatsApp com madeireiras, calculando custos em planilhas improvisadas e entregando orçamentos sem padrão profissional ao cliente. Isso resulta em erros de precificação, perda de credibilidade e retrabalho.

## Solução
Uma plataforma onde:
1. **Madeireiras** cadastram e atualizam seus preços via upload de planilha
2. **Carpinteiros** criam orçamentos selecionando materiais com preços reais, adicionando mão de obra, margem e impostos
3. O sistema gera um **PDF profissional** com a marca do carpinteiro

## Personas

### Persona 1: João - Marceneiro Autônomo
- 35 anos, marceneiro há 12 anos
- Faz móveis sob medida (cozinhas, armários, estantes)
- Perde 2-3 horas por orçamento consultando preços
- Usa WhatsApp para pedir preços à madeireira
- Envia orçamentos em Word ou escrito à mão
- Quer parecer mais profissional para fechar mais clientes

### Persona 2: Carlos - Carpinteiro Estrutural
- 45 anos, carpinteiro especializado em telhados e pergolados
- Trabalha com projetos maiores (estruturas)
- Precisa calcular grandes volumes de madeira
- Margem de erro no orçamento pode causar prejuízo
- Quer precisão nos cálculos de materiais

### Persona 3: Maria - Dona de Madeireira
- 50 anos, administra madeireira familiar
- Atende ~30 carpinteiros parceiros
- Atualiza preços semanalmente
- Cansada de responder preço por WhatsApp o dia todo
- Quer um canal digital para divulgar seus preços

## Funcionalidades (MVP)

### F1 - Autenticação
- Login/cadastro para carpinteiros e madeireiras
- Seleção de tipo de usuário no cadastro
- Recuperação de senha

### F2 - Perfil do Carpinteiro
- Dados pessoais (nome, CNPJ/CPF, telefone, endereço)
- Logo para aparecer no orçamento
- Configuração padrão: margem de lucro, valor hora de mão de obra, impostos

### F3 - Perfil da Madeireira
- Dados da empresa (razão social, CNPJ, endereço, telefone)
- Logo da madeireira

### F4 - Upload de Tabela de Preços (Madeireira)
- Upload de CSV ou Excel
- Mapeamento de colunas (nome, unidade, preço, categoria)
- Prévia dos dados antes de confirmar
- Histórico de uploads
- Validação de dados

### F5 - Vinculação Carpinteiro ↔ Madeireira
- Carpinteiro busca madeireira por nome ou cidade
- Envia solicitação de vinculação
- Madeireira aprova/rejeita
- Carpinteiro vê tabela de preços após aprovação

### F6 - Criação de Orçamento
- Seleciona tipo de projeto (móvel ou estrutura)
- Descreve o projeto (nome, descrição, cliente)
- Adiciona itens de material da tabela da madeireira
  - Busca por nome/categoria
  - Define quantidade
  - Preço vem automático da tabela
- Define mão de obra (valor fixo ou por hora x horas estimadas)
- Define margem de lucro (%)
- Define impostos (%)
- Visualiza resumo: subtotal materiais + mão de obra + margem + impostos = total

### F7 - Geração de PDF
- Layout profissional com logo do carpinteiro
- Dados do cliente
- Lista de materiais com quantidades e valores
- Mão de obra discriminada
- Subtotais e total
- Validade do orçamento
- Termos e condições (editáveis)

### F8 - Dashboard
- Carpinteiro: orçamentos recentes, valor total orçado no mês, status
- Madeireira: carpinteiros vinculados, último upload de preços

## Funcionalidades Futuras (pós-MVP)
- Calculadora de madeira (m³, m², metros lineares)
- Templates de projetos comuns
- Histórico de orçamentos aceitos/rejeitados pelo cliente
- Notificação quando madeireira atualiza preços
- Múltiplas madeireiras por carpinteiro
- App mobile
- Integração com WhatsApp para envio de PDF
- Monetização (assinatura, comissão, freemium)

## Métricas de Sucesso (MVP)
- Carpinteiro consegue criar um orçamento em < 15 minutos
- PDF gerado é considerado profissional (pesquisa qualitativa)
- Madeireira consegue fazer upload de preços em < 5 minutos
- Vinculação carpinteiro-madeireira funciona em < 2 minutos

## Requisitos Não-Funcionais
- Responsivo (mobile-first para carpinteiros em obra)
- Performance: < 3s para carregar qualquer página
- Acessível (
   WCAG 2.1 AA mínimo)
- Dados sensíveis (preços) protegidos por autenticação
- Suporte a navegadores modernos (Chrome, Firefox, Safari, Edge)
```

---

## 3. Comandos (.claude/commands/)

### 3.1 prd.md (`/prd`)

```markdown
Você é um Product Manager experiente. Crie um documento PRD completo.

## Instruções

1. Pergunte ao usuário sobre o produto:
   - Qual o nome do produto?
   - Quem são os usuários? (personas)
   - Qual problema o produto resolve?
   - Quais as funcionalidades principais do MVP?
   - Existe stack técnica definida?
   - Qual o modelo de monetização?
   - Existem requisitos não-funcionais específicos?

2. Crie o arquivo `PRD.md` na raiz com:
   - Visão do Produto
   - Problema
   - Solução
   - Personas (com nomes fictícios e contexto real)
   - Funcionalidades (MVP) - numeradas como F1, F2, etc.
   - Funcionalidades Futuras (pós-MVP)
   - Métricas de Sucesso
   - Requisitos Não-Funcionais

3. Use português brasileiro, linguagem clara e objetiva.

4. Após criar, informe que o próximo passo é `/spec`.

## Contexto
Consulte `CLAUDE.md` para regras de negócio e contexto.
```

### 3.2 spec.md (`/spec`)

```markdown
Você é um Arquiteto de Software sênior. Crie uma especificação técnica baseada no PRD.

## Pré-requisitos
- `PRD.md` deve existir. Se não existir, peça para rodar `/prd` primeiro.

## Instruções

1. Leia: `PRD.md`, `CLAUDE.md`, `references/architecture.md`, `references/engineering.md`, `references/design.md`

2. Crie `spec.md` na raiz com:

   ## 1. Visão Geral da Arquitetura
   - Diagrama de alto nível (ASCII)
   - Stack completa com justificativas
   - Decisões arquiteturais

   ## 2. Modelos de Dados
   - Entidades com campos e tipos (TypeScript interface)
   - Relacionamentos

   ## 3. Funcionalidades Detalhadas
   Para CADA funcionalidade do PRD (F1, F2...):
   - Descrição técnica
   - Componentes React envolvidos
   - Rotas/páginas necessárias
   - Validações
   - Fluxo do usuário (passo a passo)
   - Critérios de aceite

   ## 4. Estrutura de Pastas
   ## 5. Rotas da Aplicação
   ## 6. Integrações (APIs, upload, PDF)
   ## 7. Segurança (auth, RBAC)
   ## 8. Performance

3. Após criar, informe que o próximo passo é `/break`.
```

### 3.3 break.md (`/break`)

```markdown
Você é um Tech Lead organizando o backlog. Quebre a spec em issues incrementais.

## Pré-requisitos
- `spec.md` deve existir. Se não, peça para rodar `/spec` primeiro.

## Instruções

1. Leia: `spec.md`, `PRD.md`, `CLAUDE.md`

2. Crie `issues.md` na raiz seguindo estas regras:
   - Cada issue implementável de forma independente (ou com dependências claras)
   - Pequena o suficiente para 1-3 horas de trabalho
   - Ordenada por dependência: setup/base primeiro, depois features
   - Numerada: ISSUE-001, ISSUE-002, etc.
   - Agrupada por épico (F1, F2... do PRD)

3. Formato de cada issue:

   ## ISSUE-XXX: [Título curto]
   **Épico**: F[N] - [Nome]
   **Depende de**: ISSUE-YYY (ou "Nenhuma")
   **Prioridade**: P0 | P1 | P2 | P3

   ### Descrição
   [2-3 frases do que fazer]

   ### Tarefas
   - [ ] Tarefa 1
   - [ ] Tarefa 2

   ### Critérios de Aceite
   - [ ] CA1
   - [ ] CA2

   ### Arquivos Envolvidos
   - `src/path/to/file.tsx`

4. Primeiro grupo sempre = base (rotas, auth, layout, tipos)

5. Após criar, mostre resumo:
   - Total de issues
   - Distribuição por épico
   - Caminho crítico (P0s em sequência)
   - Sugestão de qual issue começar

6. Informe: usar `/plan` para planejar cada issue, depois `/execute` para implementar.
```

### 3.4 execute.md (`/execute`)

```markdown
Você é um desenvolvedor sênior fullstack. Execute a tarefa planejada seguindo as regras do projeto.

## Instruções

1. Pergunte qual issue executar (ex: "ISSUE-001") ou peça descrição da tarefa.

2. Antes de codar, leia obrigatoriamente:
   - `CLAUDE.md`
   - `references/architecture.md`
   - `references/engineering.md`
   - `references/design.md`
   - `issues.md`
   - `spec.md`

3. Verifique dependências: a issue depende de algo não implementado? Avise.

4. Implemente seguindo:
   - TypeScript strict, nunca `any`
   - Componentes shadcn/ui existentes antes de criar novos
   - Path alias `@/` para imports
   - Componentes de negócio em `src/components/`, UI em `src/components/ui/`
   - Pages em `src/pages/`, hooks em `src/hooks/`, types em `src/types/`
   - PascalCase para componentes, kebab-case para arquivos
   - Tailwind CSS para estilização (nunca CSS inline ou modules)
   - Responsivo mobile-first

5. Ao finalizar:
   - Liste arquivos criados/modificados
   - Confirme critérios de aceite atendidos
   - Sugira próxima issue

6. NÃO faça:
   - Instalar pacotes sem perguntar
   - Mudar config do projeto sem justificar
   - Criar arquivos fora da estrutura definida
   - Usar `any` em TypeScript
```

---

## 4. Referências (references/)

### 4.1 architecture.md

```markdown
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
```

### 4.2 design.md

```markdown
# Design System - OrçaMadeira

## Identidade Visual
- **Tema base**: shadcn/ui neutral (já configurado)
- **Primary**: A definir (sugestão: tom de madeira/amber ou verde profissional)
- **Modo**: Light e dark mode
- **Font**: Inter Variable (já configurada)
- **Ícones**: Lucide React - 16px inline, 20px buttons, 24px destaque

## Padrões de UI

### Layout
- Sidebar fixa à esquerda em desktop (colapsável)
- Header com breadcrumb e ações
- Conteúdo centralizado com max-width
- Mobile: sidebar vira drawer/sheet

### Formulários
- Label acima do input (nunca placeholder como label)
- Mensagens de erro abaixo do campo, em vermelho
- Botão submit à direita, cancelar à esquerda
- Loading state em todos os botões de submit

### Tabelas
- Componente Table do shadcn
- Paginação quando > 10 itens
- Busca/filtro quando > 20 itens
- Card view em mobile

### Feedback
- Toast para ações concluídas
- Dialog para confirmações destrutivas
- Skeleton para loading states
- Empty states com ilustração e CTA

### PDFs
- Layout limpo e profissional
- Logo do carpinteiro no topo
- Cores neutras (preto, cinza, branco)
- Tabelas com bordas leves
- Footer com dados de contato

## Responsividade
- Mobile first
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
```

### 4.3 engineering.md

```markdown
# Padrões de Engenharia - OrçaMadeira

## TypeScript
- strict: true sempre
- Nunca usar `any` - usar `unknown` e type narrowing
- Interfaces para objetos, types para unions/intersections
- Exportar tipos de `src/types/`

## Componentes React
- Functional components apenas
- Props tipadas com interface
- Um componente por arquivo
- Export default no final

## Nomenclatura
| Item | Padrão | Exemplo |
|------|--------|---------|
| Componente | PascalCase | `OrcamentoCard` |
| Arquivo | kebab-case | `orcamento-card.tsx` |
| Hook | camelCase com use | `useOrcamento.ts` |
| Store | camelCase com use | `useOrcamentoStore.ts` |
| Type/Interface | PascalCase | `Orcamento` |
| Constante | UPPER_SNAKE | `MAX_UPLOAD_SIZE` |
| Função | camelCase | `calcularTotal()` |

## Imports
- Path alias: `@/` para `src/`
- Ordem: react > libs externas > components > hooks > types > utils > styles
- Nunca usar imports relativos que subam mais de um nível

## Estado
- Local: useState/useReducer
- Global: Zustand stores em `src/stores/`
- Server: TanStack Query para cache (futuro)
- Forms: React Hook Form + Zod

## Git
- Commits em inglês
- Formato: `type(scope): description`
- Types: feat, fix, refactor, style, docs, test, chore
- Branches: `feature/issue-xxx-short-description`
```

---

## Fluxo de trabalho completo

```
/prd  -->  PRD.md
/spec -->  spec.md  (lê PRD.md + referências)
/break --> issues.md (lê spec.md)
/plan  --> planeja uma issue (built-in Claude Code)
/execute -> implementa a issue planejada
```

---

## Ordem de criação dos arquivos

1. `.claude/commands/` e `references/` (diretórios)
2. `CLAUDE.md`
3. `PRD.md`
4. `references/architecture.md`
5. `references/design.md`
6. `references/engineering.md`
7. `.claude/commands/prd.md`
8. `.claude/commands/spec.md`
9. `.claude/commands/break.md`
10. `.claude/commands/execute.md`