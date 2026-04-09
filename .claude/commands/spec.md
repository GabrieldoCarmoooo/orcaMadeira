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
