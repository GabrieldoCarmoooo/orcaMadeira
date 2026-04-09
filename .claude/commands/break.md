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
