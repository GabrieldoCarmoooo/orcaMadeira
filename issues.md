# OrçaMadeira — Backlog de Issues

> Gerado em: 2026-04-06
> Total: 28 issues | 4 épicos base + F1–F8

---

## SETUP — Base do Projeto

## ISSUE-001: Setup inicial do projeto (Vite + TS + Tailwind + shadcn) ✅
**Épico**: Setup - Base
**Depende de**: Nenhuma
**Prioridade**: P0

### Descrição
Configurar o projeto React 19 com TypeScript strict, Vite 8, Tailwind CSS 4, shadcn/ui (radix-nova), Lucide React e Inter Variable. Garantir que o alias `@/` funcione corretamente apontando para `./src/`.

### Tarefas
- [x] Inicializar projeto com Vite (template react-ts)
- [x] Configurar TypeScript strict em `tsconfig.json`
- [x] Instalar e configurar Tailwind CSS 4
- [x] Instalar shadcn/ui (estilo radix-nova) e inicializar
- [x] Instalar Lucide React
- [x] Configurar fonte Inter Variable (via CDN ou pacote)
- [x] Configurar alias `@/` em `vite.config.ts` e `tsconfig.json`
- [x] Verificar `App.tsx` mínimo rodando sem erros

### Critérios de Aceite
- [x] `npm run dev` sobe sem erros
- [x] `npm run build` gera bundle sem erros
- [x] Alias `@/` resolvido corretamente em imports
- [x] Componente shadcn (ex: `Button`) renderiza com estilo correto

### Arquivos Envolvidos
- `vite.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `src/components/ui/` (gerenciado pelo shadcn)
- `index.html`

---

## ISSUE-002: Integração com Supabase
**Épico**: Setup - Base
**Depende de**: ISSUE-001
**Prioridade**: P0

### Descrição
Criar o cliente Supabase tipado, configurar variáveis de ambiente e criar as tabelas do banco com as políticas RLS. Inclui o schema SQL completo e o `supabase.ts` do frontend.

### Tarefas
- [x] Instalar `@supabase/supabase-js`
- [x] Criar `src/lib/supabase.ts` com `createClient` tipado
- [ ] Criar `.env.example` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- [x] Criar migration SQL: tabelas `carpinteiros`, `madeireiras`, `vinculacoes`, `tabelas_preco`, `itens_preco`, `orcamentos`, `itens_orcamento`
- [x] Criar RLS policies conforme spec (carpinteiro_own_orcamentos, vinculados_ver_precos, etc.)
- [ ] Criar Storage bucket `logos` com política de leitura pública
- [x] Gerar tipos TypeScript do Supabase (`supabase-generated.ts`)

### Critérios de Aceite
- [x] Cliente Supabase conecta sem erros com as env vars
- [x] Todas as tabelas criadas com PKs, FKs e índices corretos
- [x] RLS ativo em todas as tabelas
- [x] Tipos gerados importáveis em `src/types/supabase-generated.ts`

### Arquivos Envolvidos
- `src/lib/supabase.ts`
- `src/types/supabase-generated.ts`
- `.env.example`
- `supabase/migrations/001_initial_schema.sql`

---

## ISSUE-003: TypeScript types, constants e routes ✅
**Épico**: Setup - Base
**Depende de**: ISSUE-001
**Prioridade**: P0

### Descrição
Definir todos os tipos/interfaces do domínio, as constantes de upload e o enum de rotas. Estes são a base compartilhada por todos os outros módulos.

### Tarefas
- [x] Criar `src/types/common.ts` (`UserRole`, `VinculacaoStatus`, `OrcamentoStatus`, `TipoProjeto`)
- [x] Criar `src/types/carpinteiro.ts` (`Carpinteiro`)
- [x] Criar `src/types/madeireira.ts` (`Madeireira`, `TabelaPreco`, `ItemPreco`)
- [x] Criar `src/types/orcamento.ts` (`Orcamento`, `ItemOrcamento`, `Vinculacao`)
- [x] Criar `src/constants/upload.ts` (`MAX_UPLOAD_SIZE`, `ACCEPTED_TYPES`, `COLUNAS_OBRIGATORIAS`)
- [x] Criar `src/constants/routes.ts` com objeto `ROUTES` completo

### Critérios de Aceite
- [x] Todos os tipos compilam sem erro com `strict: true`
- [x] `ROUTES` cobre todas as rotas da spec
- [x] Nenhum `any` explícito nos arquivos de tipos

### Arquivos Envolvidos
- `src/types/common.ts`
- `src/types/carpinteiro.ts`
- `src/types/madeireira.ts`
- `src/types/orcamento.ts`
- `src/constants/upload.ts`
- `src/constants/routes.ts`

---

## ISSUE-004: Roteamento, AuthGuard e layouts base ✅
**Épico**: Setup - Base
**Depende de**: ISSUE-001, ISSUE-003
**Prioridade**: P0

### Descrição
Configurar React Router v7 com todas as rotas da aplicação, o `AuthGuard` que protege rotas por role, e os componentes de layout (sidebar, header, page-wrapper).

### Tarefas
- [x] Instalar `react-router-dom` v7
- [x] Criar `src/main.tsx` com `<BrowserRouter>`
- [x] Criar `src/App.tsx` com todas as rotas usando `lazy()` + `Suspense`
- [x] Criar `src/components/layout/auth-guard.tsx` (verifica auth + role, redireciona)
- [x] Criar `src/components/layout/app-sidebar.tsx` (nav por role)
- [x] Criar `src/components/layout/app-header.tsx` (breadcrumb + avatar)
- [x] Criar `src/components/layout/page-wrapper.tsx` (max-width container)
- [x] Configurar `vite.config.ts` com `manualChunks` para code splitting

### Critérios de Aceite
- [x] Rota `/` redireciona para dashboard conforme role
- [x] Rota `/carpinteiro/*` sem auth redireciona para `/login`
- [x] Rota `/madeireira/*` com role errado redireciona para dashboard correto
- [x] Sidebar exibe itens corretos para cada role

### Arquivos Envolvidos
- `src/main.tsx`
- `src/App.tsx`
- `src/components/layout/auth-guard.tsx`
- `src/components/layout/app-sidebar.tsx`
- `src/components/layout/app-header.tsx`
- `src/components/layout/page-wrapper.tsx`
- `vite.config.ts`

---

## F1 — Autenticação

## ISSUE-005: Auth store + useAuth hook ✅
**Épico**: F1 - Autenticação
**Depende de**: ISSUE-002, ISSUE-003
**Prioridade**: P0

### Descrição
Criar o Zustand store de autenticação e o hook `useAuth` que expõem o usuário atual, role e operações de login/logout. O role é determinado consultando o banco, não o JWT.

### Tarefas
- [x] Instalar `zustand`
- [x] Criar `src/stores/useAuthStore.ts` com `user`, `role`, `carpinteiro`, `madeireira`, `setSession`, `clearSession`
- [x] Criar `src/hooks/useAuth.ts` com `login`, `logout`, `signUp`, `resetPassword`, `loading`
- [x] Implementar lógica de determinação de role (consulta `carpinteiros` ou `madeireiras` por `user_id`)
- [x] Configurar listener `supabase.auth.onAuthStateChange` no App

### Critérios de Aceite
- [x] Sessão persiste após refresh de página
- [x] Role determinado por registro existente no banco (não no JWT)
- [x] `clearSession` limpa store e redireciona para `/login`

### Arquivos Envolvidos
- `src/stores/useAuthStore.ts`
- `src/hooks/useAuth.ts`

---

## ISSUE-006: Página de login ✅
**Épico**: F1 - Autenticação
**Depende de**: ISSUE-004, ISSUE-005
**Prioridade**: P0

### Descrição
Implementar a página `/login` com formulário validado por Zod + React Hook Form, tratamento de erros e redirect pós-login para o dashboard correto.

### Tarefas
- [x] Instalar `react-hook-form` e `zod` e `@hookform/resolvers`
- [x] Criar `src/pages/auth/login-page.tsx`
- [x] Implementar `loginSchema` (email + password min 8)
- [x] Exibir erros de validação inline
- [x] Tratar erro de credenciais inválidas com mensagem amigável
- [x] Redirect para dashboard após login bem-sucedido

### Critérios de Aceite
- [x] Formulário não submete com campos inválidos
- [x] Erro "Invalid login credentials" exibido de forma amigável
- [x] Link para `/register` e `/forgot-password` presentes

### Arquivos Envolvidos
- `src/pages/auth/login-page.tsx`

---

## ISSUE-007: Página de cadastro com seleção de role ✅
**Épico**: F1 - Autenticação
**Depende de**: ISSUE-005, ISSUE-006
**Prioridade**: P0

### Descrição
Implementar `/register` com seleção de tipo de usuário (carpinteiro/madeireira) e dados básicos do perfil. Após cadastro, criar o registro correspondente no banco.

### Tarefas
- [x] Criar `src/pages/auth/register-page.tsx`
- [x] Implementar `registerSchema` com todos os campos da spec
- [x] UI com toggle carpinteiro/madeireira (campos mudam conforme role)
- [x] Ao submeter: `supabase.auth.signUp` → depois INSERT em `carpinteiros` ou `madeireiras`
- [x] Tratar erro de email duplicado com mensagem amigável

### Critérios de Aceite
- [x] Erro de email duplicado exibe mensagem clara
- [x] Redirect para dashboard correto após cadastro
- [x] Campos corretos exibidos conforme role selecionado

### Arquivos Envolvidos
- `src/pages/auth/register-page.tsx`

---

## ISSUE-008: Forgot password e reset password ✅
**Épico**: F1 - Autenticação
**Depende de**: ISSUE-006
**Prioridade**: P1

### Descrição
Implementar as páginas `/forgot-password` (envia email de reset) e `/reset-password` (nova senha via token do email).

### Tarefas
- [x] Criar `src/pages/auth/forgot-password-page.tsx`
- [x] Chamar `supabase.auth.resetPasswordForEmail` ao submeter
- [x] Criar página `/reset-password` que lê token da URL e chama `supabase.auth.updateUser`
- [x] Exibir feedback de sucesso ("Email enviado, verifique sua caixa")

### Critérios de Aceite
- [x] Token expira em 1h (configurado no Supabase)
- [x] Página de reset exibe erro se token inválido/expirado
- [x] Após reset bem-sucedido, redireciona para `/login`

### Arquivos Envolvidos
- `src/pages/auth/forgot-password-page.tsx`
- `src/pages/auth/reset-password-page.tsx`

---

## F2/F3 — Perfis

## ISSUE-009: Componentes compartilhados de perfil ✅
**Épico**: F2 - Perfil Carpinteiro
**Depende de**: ISSUE-004
**Prioridade**: P1

### Descrição
Criar os componentes `logo-uploader` (upload com preview, max 2MB, JPG/PNG) e `configuracoes-financeiras` (margem, hora mão de obra, imposto) reutilizados por ambos os perfis.

### Tarefas
- [x] Criar `src/lib/utils.ts` com `cn()` do shadcn (já existia)
- [x] Criar `src/components/shared/logo-uploader.tsx`
  - Drag-and-drop ou click para selecionar
  - Validação de tipo (JPG/PNG) e tamanho (2MB)
  - Preview antes e após upload
  - Upload para `supabase.storage.from('logos')`
- [x] Criar `src/components/shared/configuracoes-financeiras.tsx`
  - Campos: margem_lucro_padrao, valor_hora_mao_obra, imposto_padrao
  - Componente controlado (recebe value + onChange)

### Critérios de Aceite
- [x] Logo rejeitada se > 2MB ou tipo não permitido
- [x] Preview exibido imediatamente após seleção
- [x] URL salva em `logo_url` após upload bem-sucedido

### Arquivos Envolvidos
- `src/lib/utils.ts`
- `src/components/shared/logo-uploader.tsx`
- `src/components/shared/configuracoes-financeiras.tsx`

---

## ISSUE-010: Página de perfil do carpinteiro ✅
**Épico**: F2 - Perfil Carpinteiro
**Depende de**: ISSUE-005, ISSUE-009
**Prioridade**: P1

### Descrição
Implementar `/carpinteiro/perfil` com CRUD completo, validação de CPF/CNPJ com dígito verificador e integração com os componentes compartilhados.

### Tarefas
- [x] Criar `src/lib/validar-cpf-cnpj.ts` com validação de dígito verificador
- [x] Criar `src/pages/carpinteiro/perfil-page.tsx`
- [x] Implementar `perfilCarpinteiroSchema` com `z.refine` para CPF/CNPJ
- [x] Carregar dados existentes do banco (pre-fill do form)
- [x] Submeter com `UPDATE carpinteiros WHERE id = ?`

### Critérios de Aceite
- [x] CPF/CNPJ validado com dígito verificador
- [x] Configurações padrão salvas e pré-preenchidas no formulário de orçamento
- [x] Feedback de sucesso após salvar

### Arquivos Envolvidos
- `src/lib/validar-cpf-cnpj.ts`
- `src/pages/carpinteiro/perfil-page.tsx`

---

## ISSUE-011: Página de perfil da madeireira ✅
**Épico**: F3 - Perfil Madeireira
**Depende de**: ISSUE-005, ISSUE-009
**Prioridade**: P1

### Descrição
Implementar `/madeireira/perfil` com CRUD e validação de CNPJ, reutilizando `logo-uploader`.

### Tarefas
- [x] Criar `src/pages/madeireira/perfil-page.tsx`
- [x] Implementar `perfilMadeireiraSchema`
- [x] Carregar dados existentes e submeter UPDATE
- [x] Integrar `logo-uploader` e `configuracoes-financeiras` não se aplica (madeireira não tem)

### Critérios de Aceite
- [x] CNPJ validado com dígito verificador
- [x] Logo aceita JPG/PNG, máximo 2MB

### Arquivos Envolvidos
- `src/pages/madeireira/perfil-page.tsx`

---

## F8 — Dashboard

## ISSUE-012: Dashboard do carpinteiro ✅
**Épico**: F8 - Dashboard
**Depende de**: ISSUE-004, ISSUE-005
**Prioridade**: P1

### Descrição
Implementar `/carpinteiro/dashboard` com métricas do mês, lista dos 5 orçamentos mais recentes e CTA de vinculação quando sem madeireira.

### Tarefas
- [x] Criar `src/components/shared/stat-card.tsx`
- [x] Criar `src/components/orcamento/orcamento-recente-card.tsx`
- [x] Criar `src/pages/carpinteiro/dashboard-page.tsx`
- [x] Queries: total orçado no mês, count rascunhos, count finalizados, 5 mais recentes
- [x] Skeleton loading state
- [x] Empty state com CTA "Vincular Madeireira" se `madeireira_id = null`

### Critérios de Aceite
- [x] Dados carregados em < 2s
- [x] Skeleton exibido durante loading
- [x] CTA de vinculação visível quando sem madeireira vinculada
- [x] Empty state quando sem orçamentos

### Arquivos Envolvidos
- `src/components/shared/stat-card.tsx`
- `src/components/orcamento/orcamento-recente-card.tsx`
- `src/pages/carpinteiro/dashboard-page.tsx`

---

## ISSUE-013: Dashboard da madeireira
**Épico**: F8 - Dashboard
**Depende de**: ISSUE-004, ISSUE-005
**Prioridade**: P1

### Descrição
Implementar `/madeireira/dashboard` com métricas: parceiros ativos, solicitações pendentes, data do último upload e total de itens na tabela ativa.

### Tarefas
- [x] Criar `src/pages/madeireira/dashboard-page.tsx`
- [x] Reutilizar `stat-card.tsx` (ISSUE-012)
- [x] Queries: count parceiros ativos, count pendentes, último upload, count itens ativos
- [x] Badge visual em "solicitações pendentes" se count > 0
- [x] Skeleton loading state

### Critérios de Aceite
- [x] Dados carregados em < 2s
- [x] Badge visível com número de solicitações pendentes
- [x] Link direto para `/madeireira/parceiros` nos atalhos

### Arquivos Envolvidos
- `src/pages/madeireira/dashboard-page.tsx`

---

## F5 — Vinculação Carpinteiro ↔ Madeireira

## ISSUE-014: Página de vinculação do carpinteiro
**Épico**: F5 - Vinculação
**Depende de**: ISSUE-004, ISSUE-005
**Prioridade**: P1

### Descrição
Implementar `/carpinteiro/vinculacao` com busca de madeireiras, envio de solicitação e exibição do status atual com atualização sem refresh.

### Tarefas
- [x] Criar `src/hooks/useVinculacao.ts`
- [x] Criar `src/components/carpinteiro/busca-madeireira.tsx`
  - Input com debounce de 300ms
  - Query full-text em `madeireiras.razao_social` e `cidade`
  - Botão "Solicitar Parceria" por resultado
- [x] Criar `src/pages/carpinteiro/vinculacao-page.tsx`
  - Exibe status atual (pendente/aprovada/rejeitada)
  - Supabase Realtime ou polling para atualização de status
- [x] Regra: cancelar solicitação anterior ao criar nova

### Critérios de Aceite
- [x] Busca retorna resultados em < 500ms
- [x] Carpinteiro com vinculação pendente não pode solicitar outra
- [x] Status atualiza sem refresh de página

### Arquivos Envolvidos
- `src/hooks/useVinculacao.ts`
- `src/components/carpinteiro/busca-madeireira.tsx`
- `src/pages/carpinteiro/vinculacao-page.tsx`

---

## ISSUE-015: Página de parceiros da madeireira
**Épico**: F5 - Vinculação
**Depende de**: ISSUE-004, ISSUE-005
**Prioridade**: P1

### Descrição
Implementar `/madeireira/parceiros` com lista de solicitações pendentes (aprovar/rejeitar) e lista de parceiros ativos com opção de remoção.

### Tarefas
- [x] Criar `src/components/madeireira/card-solicitacao.tsx`
  - Exibe nome do carpinteiro, cidade, data da solicitação
  - Botões Aprovar e Rejeitar (com campo opcional de motivo)
- [x] Criar `src/pages/madeireira/parceiros-page.tsx`
  - Seção "Solicitações Pendentes"
  - Seção "Parceiros Ativos" com opção remover parceria

### Critérios de Aceite
- [x] Aprovar atualiza `vinculacoes.status = 'aprovada'` e atualiza `carpinteiros.madeireira_id`
- [x] Rejeição permite motivo opcional exibido ao carpinteiro
- [x] Lista atualiza em tempo real após ação

### Arquivos Envolvidos
- `src/components/madeireira/card-solicitacao.tsx`
- `src/pages/madeireira/parceiros-page.tsx`

---

## F4 — Upload de Tabela de Preços

## ISSUE-016: Lib de parse de planilhas
**Épico**: F4 - Upload Preços
**Depende de**: ISSUE-001, ISSUE-003
**Prioridade**: P1

### Descrição
Criar a lib `parse-planilha.ts` que abstrai PapaParse (CSV) e SheetJS (Excel) em uma API unificada retornando `RawRow[]`.

### Tarefas
- [x] Instalar `papaparse` e `xlsx` e seus tipos (`@types/papaparse`)
- [x] Criar `src/lib/parse-planilha.ts`
  - `parsePlanilha(file: File): Promise<RawRow[]>`
  - Branch CSV vs Excel por extensão
  - Retornar objeto com headers detectados e linhas

### Critérios de Aceite
- [x] CSV e XLSX parsados para o mesmo formato `RawRow[]`
- [x] Headers da primeira linha extraídos corretamente
- [x] Arquivo > 10MB lança erro antes de parsear

### Arquivos Envolvidos
- `src/lib/parse-planilha.ts`

---

## ISSUE-017: Componentes de upload e mapeamento de colunas
**Épico**: F4 - Upload Preços
**Depende de**: ISSUE-016
**Prioridade**: P1

### Descrição
Criar `upload-planilha.tsx` (drag-and-drop + seleção de arquivo) e `mapeamento-colunas.tsx` (UI para mapear colunas do arquivo para campos obrigatórios/opcionais).

### Tarefas
- [x] Criar `src/stores/useUploadStore.ts` com estado do fluxo de upload
- [x] Criar `src/components/madeireira/upload-planilha.tsx`
  - Drag-and-drop área
  - Validação de tipo e tamanho no client antes de parsear
  - Feedback de loading durante parse
- [x] Criar `src/components/madeireira/mapeamento-colunas.tsx`
  - Selects para mapear cada coluna detectada → campo do sistema
  - Destaca quais são obrigatórias vs opcionais
  - Botão "Continuar" habilitado só quando obrigatórias mapeadas

### Critérios de Aceite
- [x] Arquivo > 10MB rejeitado com mensagem antes de qualquer upload
- [x] Seleção de mapeamento clara com preview do valor de exemplo
- [x] Campos obrigatórios validados antes de prosseguir

### Arquivos Envolvidos
- `src/stores/useUploadStore.ts`
- `src/components/madeireira/upload-planilha.tsx`
- `src/components/madeireira/mapeamento-colunas.tsx`

---

## ISSUE-018: Prévia de dados e histórico de uploads
**Épico**: F4 - Upload Preços
**Depende de**: ISSUE-017
**Prioridade**: P1

### Descrição
Criar `previa-dados.tsx` (tabela paginada com erros destacados) e `historico-uploads.tsx` (lista de uploads anteriores com data, total de itens e status).

### Tarefas
- [ ] Criar `src/components/madeireira/previa-dados.tsx`
  - Valida cada linha com `itemPrecoSchema` (Zod)
  - Destaca linhas com erro em vermelho
  - Exibe contagem: X linhas válidas, Y com erro
  - Paginação (50 por página)
  - Botão "Confirmar Import" só habilita com linhas válidas
- [ ] Criar `src/components/madeireira/historico-uploads.tsx`
  - Lista de `tabelas_preco` ordenadas por `upload_at` desc
  - Exibe: data, quantidade de itens, status (ativa/inativa)

### Critérios de Aceite
- [ ] Linha com erro não bloqueia o import — apenas contabiliza
- [ ] Tabela paginada não trava com arquivos grandes
- [ ] Histórico exibe data, total de itens e quem fez upload

### Arquivos Envolvidos
- `src/components/madeireira/previa-dados.tsx`
- `src/components/madeireira/historico-uploads.tsx`

---

## ISSUE-019: Página de preços da madeireira
**Épico**: F4 - Upload Preços
**Depende de**: ISSUE-018, ISSUE-005
**Prioridade**: P1

### Descrição
Compor todos os componentes de upload na página `/madeireira/precos` e implementar a lógica de persistência: insert em batch de `itens_preco`, swap atômico de tabela ativa.

### Tarefas
- [ ] Criar `src/pages/madeireira/precos-page.tsx`
- [ ] Implementar fluxo completo: upload → mapeamento → prévia → confirmar
- [ ] Persistência: INSERT `tabelas_preco` + batch INSERT `itens_preco` + swap `ativo`
- [ ] Exibir `historico-uploads` na listagem principal

### Critérios de Aceite
- [ ] Tabela anterior desativada atomicamente ao confirmar nova
- [ ] Rollback se insert em batch falhar
- [ ] Rota `/madeireira/precos/novo` abre fluxo de upload

### Arquivos Envolvidos
- `src/pages/madeireira/precos-page.tsx`

---

## F6 — Criação de Orçamento

## ISSUE-020: Lib de cálculo e store do orçamento
**Épico**: F6 - Criação de Orçamento
**Depende de**: ISSUE-003
**Prioridade**: P1

### Descrição
Implementar a função pura `calcularOrcamento` em `lib/calcular-orcamento.ts` e o store Zustand que gerencia o estado do wizard de criação de orçamento.

### Tarefas
- [ ] Criar `src/lib/calcular-orcamento.ts` com a função e tipo `ResumoOrcamento`
- [ ] Criar `src/stores/useOrcamentoStore.ts`
  - Estado: step atual, dados de cada step, itens adicionados
  - Actions: `setStepProjeto`, `addItem`, `removeItem`, `updateQuantidade`, `setFinanceiro`, `reset`
  - Cálculo derivado em tempo real usando `calcularOrcamento`

### Critérios de Aceite
- [ ] Função `calcularOrcamento` testada com casos de margem + imposto
- [ ] Store recalcula totais automaticamente ao mudar itens ou parâmetros financeiros
- [ ] Store resetável ao iniciar novo orçamento

### Arquivos Envolvidos
- `src/lib/calcular-orcamento.ts`
- `src/stores/useOrcamentoStore.ts`

---

## ISSUE-021: Step 1 — Dados do projeto e cliente
**Épico**: F6 - Criação de Orçamento
**Depende de**: ISSUE-020
**Prioridade**: P1

### Descrição
Criar `step-projeto.tsx` com formulário de tipo de projeto (móvel/estrutura), nome, descrição e dados do cliente.

### Tarefas
- [ ] Criar `src/components/orcamento/step-projeto.tsx`
- [ ] Implementar schema parcial do `orcamentoSchema` para este step
- [ ] Campos: `tipo_projeto` (toggle/select), `nome`, `descricao`, `cliente_nome`, `cliente_telefone`, `cliente_email`
- [ ] Ao avançar, salvar no `useOrcamentoStore`

### Critérios de Aceite
- [ ] Validação inline nos campos obrigatórios
- [ ] Tipo de projeto com UI visual clara (ícone móvel vs estrutura)
- [ ] Email do cliente validado quando preenchido

### Arquivos Envolvidos
- `src/components/orcamento/step-projeto.tsx`

---

## ISSUE-022: Step 2 — Seleção de materiais
**Épico**: F6 - Criação de Orçamento
**Depende de**: ISSUE-020, ISSUE-014
**Prioridade**: P1

### Descrição
Criar `step-materiais.tsx` com busca de itens da tabela da madeireira vinculada (debounce 300ms, full-text), adição de itens e `item-material.tsx` para edição de quantidade.

### Tarefas
- [ ] Criar `src/hooks/useItensPreco.ts` — busca paginada com debounce na tabela ativa
- [ ] Criar `src/components/orcamento/item-material.tsx`
  - Linha: nome, unidade, preço unitário, input de quantidade, subtotal, botão remover
- [ ] Criar `src/components/orcamento/step-materiais.tsx`
  - Search input com debounce 300ms
  - Lista de resultados com botão "Adicionar"
  - Lista de itens adicionados com `item-material`
  - Subtotal de materiais em tempo real

### Critérios de Aceite
- [ ] Busca retorna em < 300ms com índice full-text
- [ ] Quantidade mínima 0.01, sem limite máximo
- [ ] Subtotal atualiza imediatamente ao mudar quantidade
- [ ] Ao menos 1 item obrigatório para avançar

### Arquivos Envolvidos
- `src/hooks/useItensPreco.ts`
- `src/components/orcamento/item-material.tsx`
- `src/components/orcamento/step-materiais.tsx`

---

## ISSUE-023: Step 3 — Dados financeiros e resumo
**Épico**: F6 - Criação de Orçamento
**Depende de**: ISSUE-020
**Prioridade**: P1

### Descrição
Criar `step-financeiro.tsx` (mão de obra, margem, impostos, validade, termos) e `resumo-orcamento.tsx` (breakdown completo em tempo real).

### Tarefas
- [ ] Criar `src/components/orcamento/step-financeiro.tsx`
  - Toggle fixo/hora para mão de obra
  - Se hora: campo de horas estimadas
  - Campos: margem_lucro (%), imposto (%), validade_dias, termos_condicoes
  - Pre-fill com valores padrão do perfil do carpinteiro
- [ ] Criar `src/components/orcamento/resumo-orcamento.tsx`
  - Linha por linha: materiais, mão de obra, margem, impostos, total
  - Formato pt-BR (R$ 1.234,56)
  - Atualiza em tempo real conforme dados do store

### Critérios de Aceite
- [ ] Pre-fill com defaults do perfil do carpinteiro
- [ ] Total recalcula em tempo real
- [ ] Valores formatados corretamente em pt-BR

### Arquivos Envolvidos
- `src/components/orcamento/step-financeiro.tsx`
- `src/components/orcamento/resumo-orcamento.tsx`

---

## ISSUE-024: Wizard de novo orçamento + autosave
**Épico**: F6 - Criação de Orçamento
**Depende de**: ISSUE-021, ISSUE-022, ISSUE-023
**Prioridade**: P1

### Descrição
Compor os 3 steps no wizard `/carpinteiro/orcamentos/novo`. Implementar autosave a cada 30s e as ações "Salvar Rascunho" e "Finalizar".

### Tarefas
- [ ] Criar `src/pages/carpinteiro/novo-orcamento-page.tsx`
  - Stepper visual (step 1, 2, 3)
  - Composição dos 3 steps
  - Botão "Salvar Rascunho" disponível a qualquer momento
  - Autosave com debounce de 30s
  - Botão "Finalizar" no último step (congela preços via snapshot)
- [ ] Implementar persistência: INSERT `orcamentos` + `itens_orcamento`
- [ ] Bloquear criação se `madeireira_id = null` (exibir CTA de vinculação)

### Critérios de Aceite
- [ ] Rascunho salvo a cada 30s sem interação do usuário
- [ ] Finalizar desnormaliza todos os valores no registro
- [ ] Carpinteiro sem madeireira vinculada vê CTA claro

### Arquivos Envolvidos
- `src/pages/carpinteiro/novo-orcamento-page.tsx`

---

## ISSUE-025: Listagem e detalhe de orçamentos
**Épico**: F6 - Criação de Orçamento
**Depende de**: ISSUE-024
**Prioridade**: P1

### Descrição
Criar a listagem `/carpinteiro/orcamentos` (paginada, filtrável por status) e a página de detalhe `/carpinteiro/orcamentos/:id`.

### Tarefas
- [ ] Criar `src/hooks/useOrcamento.ts` — CRUD de orçamento
- [ ] Criar `src/pages/carpinteiro/orcamentos-page.tsx`
  - Listagem paginada (50 por página)
  - Filtro por status (rascunho/finalizado/enviado)
  - Link para detalhe e edição
- [ ] Criar `src/pages/carpinteiro/orcamento-detalhe-page.tsx`
  - Exibe todos os dados do orçamento + itens
  - Resumo financeiro com `resumo-orcamento`
  - Ação "Editar" (apenas rascunhos)
  - Ação "Exportar PDF" (apenas finalizados)

### Critérios de Aceite
- [ ] Listagem paginada e ordenada por `created_at` desc
- [ ] Botão "Editar" visível apenas para rascunhos
- [ ] Botão "Exportar PDF" visível apenas para finalizados

### Arquivos Envolvidos
- `src/hooks/useOrcamento.ts`
- `src/pages/carpinteiro/orcamentos-page.tsx`
- `src/pages/carpinteiro/orcamento-detalhe-page.tsx`

---

## F7 — Geração de PDF

## ISSUE-026: Helpers de PDF e hook usePdf
**Épico**: F7 - Geração de PDF
**Depende de**: ISSUE-003
**Prioridade**: P2

### Descrição
Criar os helpers de formatação em `lib/pdf.ts` e o hook `usePdf` que gerencia a geração e download do blob.

### Tarefas
- [ ] Instalar `@react-pdf/renderer`
- [ ] Criar `src/lib/pdf.ts`
  - `formatBRL(value: number): string` — formato pt-BR
  - `formatDate(date: string): string` — DD/MM/YYYY
- [ ] Criar `src/hooks/usePdf.ts`
  - `exportar(orcamento, itens)` → gera blob → download automático
  - Nome do arquivo: `orcamento-{id}-{cliente}.pdf`
  - Loading state durante geração

### Critérios de Aceite
- [ ] `formatBRL(1234.56)` retorna `"R$ 1.234,56"`
- [ ] Download inicia automaticamente após geração

### Arquivos Envolvidos
- `src/lib/pdf.ts`
- `src/hooks/usePdf.ts`

---

## ISSUE-027: Documento PDF (layout)
**Épico**: F7 - Geração de PDF
**Depende de**: ISSUE-026
**Prioridade**: P2

### Descrição
Implementar `pdf-document.tsx` com o layout profissional usando `@react-pdf/renderer`: cabeçalho com logo, dados do cliente, tabela de materiais e seção de totais.

### Tarefas
- [ ] Criar `src/components/orcamento/pdf-document.tsx`
- [ ] Seções conforme spec: cabeçalho carpinteiro + logo, número/data/validade, cliente, tabela de materiais, breakdown financeiro, termos, rodapé
- [ ] Logo carregada como base64 antes de gerar (evita CORS)
- [ ] Valores em pt-BR usando `formatBRL` e `formatDate`

### Critérios de Aceite
- [ ] PDF gerado em < 3s
- [ ] Logo renderizada no documento (não quebra por CORS)
- [ ] Tabela de materiais com cabeçalho repetido em múltiplas páginas
- [ ] Valores formatados em pt-BR

### Arquivos Envolvidos
- `src/components/orcamento/pdf-document.tsx`

---

## ISSUE-028: Botão exportar PDF + integração
**Épico**: F7 - Geração de PDF
**Depende de**: ISSUE-025, ISSUE-027
**Prioridade**: P2

### Descrição
Criar `botao-exportar-pdf.tsx` com loading state e integrá-lo na página de detalhe do orçamento, disponível apenas para orçamentos finalizados.

### Tarefas
- [ ] Criar `src/components/orcamento/botao-exportar-pdf.tsx`
  - Desabilitado se `status !== 'finalizado'`
  - Loading spinner durante geração
  - Chama `usePdf().exportar()`
- [ ] Integrar em `orcamento-detalhe-page.tsx`

### Critérios de Aceite
- [ ] Botão desabilitado para orçamentos não finalizados
- [ ] Loading state visível durante geração
- [ ] Download inicia automaticamente após geração

### Arquivos Envolvidos
- `src/components/orcamento/botao-exportar-pdf.tsx`
- `src/pages/carpinteiro/orcamento-detalhe-page.tsx`

---

---

## DESIGN — Migração para Timber Grain

## ISSUE-029: Migração do Design System para "Timber Grain" ✅
**Épico**: Design System
**Depende de**: ISSUE-001
**Prioridade**: P1

### Descrição
Migrar o app do tema neutro grayscale shadcn para o design system "Timber Grain / The Master's Atelier": paleta wood-gold + mahogany, regra "no-line" (sem bordas 1px), glassmorfismo no header, bottom nav mobile.

### Tarefas
- [x] Atualizar CSS tokens em `src/index.css` (paleta completa Timber Grain)
- [x] Adicionar variáveis extras de surface e shadow tintada
- [x] Adicionar utilitários `.glass-header` e `.shadow-tinted`
- [x] Atualizar dark mode com tons warm
- [x] `button.tsx`: remover border, adicionar `active:scale-[0.97]`, variant secondary mahogany
- [x] `input.tsx`: estilo filled (bg-muted), focus pencil-mark (border-b-2 border-primary)
- [x] `label.tsx`: cor padrão text-secondary (mahogany)
- [x] Criar `src/constants/nav-items.ts` (CARPINTEIRO_NAV e MADEIREIRA_NAV)
- [x] Criar `src/components/layout/bottom-nav.tsx` (mobile only, glassmorfismo)
- [x] Atualizar `app-sidebar.tsx` (hidden mobile, sem borders, usa nav-items)
- [x] Atualizar `app-header.tsx` (glassmorfismo, sem border-b, shadow tintada)
- [x] Atualizar `dashboard-layout.tsx` (renderiza BottomNav, remove mobile sidebar state)
- [x] Atualizar `page-wrapper.tsx` (pb-24 lg:pb-6 para compensar bottom nav)
- [x] Atualizar `stat-card.tsx` (sem border, shadow tintada, highlight com accent)
- [x] Atualizar `orcamento-recente-card.tsx` (sem border, badges uppercase tracking-widest)
- [x] Atualizar `logo-uploader.tsx` (drop zone bg-shift, sem border-dashed)
- [x] Páginas auth: brand text-primary, container bg-card, alertas sem border
- [x] Dashboard carpinteiro: CTA accent, section headers text-secondary, empty state sem border-dashed
- [x] Atualizar CLAUDE.md com nova stack de styling
- [x] Atualizar references/architecture.md

### Critérios de Aceite
- [x] `npm run build` zero erros
- [x] Paleta Timber Grain aplicada globalmente via CSS vars
- [ ] Verificar visualmente todas as páginas em dev
- [ ] Mobile: bottom nav aparece, sidebar escondida
- [ ] Desktop: sidebar aparece sem bottom nav
- [ ] Dark mode funcional com tons warm

### Arquivos Modificados
- `src/index.css`, `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/label.tsx`
- `src/constants/nav-items.ts` (novo), `src/components/layout/bottom-nav.tsx` (novo)
- `src/components/layout/app-sidebar.tsx`, `app-header.tsx`, `dashboard-layout.tsx`, `page-wrapper.tsx`
- `src/components/shared/stat-card.tsx`, `src/components/orcamento/orcamento-recente-card.tsx`
- `src/components/shared/logo-uploader.tsx`
- `src/pages/auth/login-page.tsx`, `register-page.tsx`, `forgot-password-page.tsx`, `reset-password-page.tsx`
- `src/pages/carpinteiro/dashboard-page.tsx`
- `CLAUDE.md`, `references/architecture.md`

---

## Resumo

### Total de Issues: 29

### Distribuição por Épico

| Épico | Issues | Quantidade |
|-------|--------|-----------|
| Setup - Base | ISSUE-001 a ISSUE-004 | 4 |
| F1 - Autenticação | ISSUE-005 a ISSUE-008 | 4 |
| F2/F3 - Perfis | ISSUE-009 a ISSUE-011 | 3 |
| F8 - Dashboard | ISSUE-012 a ISSUE-013 | 2 |
| F5 - Vinculação | ISSUE-014 a ISSUE-015 | 2 |
| F4 - Upload Preços | ISSUE-016 a ISSUE-019 | 4 |
| F6 - Orçamentos | ISSUE-020 a ISSUE-025 | 6 |
| F7 - PDF | ISSUE-026 a ISSUE-028 | 3 |

### Caminho Crítico (P0 em sequência)

```
ISSUE-001 (Setup)
  └── ISSUE-002 (Supabase) ──── ISSUE-005 (Auth Store)
  └── ISSUE-003 (Types)    ──── ISSUE-004 (Routing + Layouts)
                                      └── ISSUE-006 (Login)
                                      └── ISSUE-007 (Register)
                                              └── (desbloqueiam todo o resto)
```

### Por onde começar

**Comece pela ISSUE-001**, depois execute em paralelo **ISSUE-002** e **ISSUE-003**, e então **ISSUE-004** e **ISSUE-005**. Com isso, toda a infra está pronta e você pode atacar qualquer feature em paralelo.

---

> Use `/execute` para implementar cada issue. Exemplo: `/execute ISSUE-001`
