Plano — Melhorias Carpinteiro/Marceneiro
                               
     Contexto
                                                                                                                                                                                   A área do Carpinteiro/Marceneiro acumulou 9 demandas mistas: bugs de UX (input de quantidade preso, botão de salvar do perfil sem efeito, edição de orçamento que dá erro
      porque a rota não existe, header com hard-code "Painel de Controle"), lacunas de produto (status de orçamento limitado a 3, dashboard sem filtro de datas, sem métricas      de margem/mão de obra, sem visualização in-app do PDF, sem PDF reduzido só de materiais), e features novas (custos extras de deslocamento e adicionais, portfólio do   
     carpinteiro compartilhável, configurações financeiras expandidas, catálogo em linhas com produtos relacionais).

     O entregável desta etapa é um arquivo Plano-melhorias-user-carpinteiros.md na raiz do projeto que servirá de insumo único para gerar o novo PRD.md e, em seguida,
     spec.md. Esse arquivo deve agrupar as demandas por épico, traduzir bugs em causa-raiz, definir as decisões de produto já tomadas, e listar as mudanças necessárias em
     código, schema e referências. Nada será implementado nesta etapa.

     ---
     Decisões já tomadas (respostas do usuário)

     1. Deslocamento e Custos Adicionais entram no total cobrado do cliente mas nunca aparecem no PDF — comportam-se como impostos invisíveis. Garantem que a margem real do
     carpinteiro seja preservada.
     2. Após Finalizar uma proposta, abrir uma nova tela com PDFViewer embed mostrando o PDF gerado, e disparar download automático em paralelo.
     3. Compartilhamento de portfólio é via WhatsApp (link público hospedado + wa.me com mensagem pré-formatada).
     4. Transições de status são livres — qualquer status pode virar qualquer outro manualmente.

     ---
     Conteúdo a colocar em Plano-melhorias-user-carpinteiros.md

     A seguir, a estrutura e conteúdo que o arquivo final deve ter. Cada épico carrega: descrição, causa-raiz quando há bug, decisões de produto e arquivos que serão tocados.
     Épico 1 — Status de Orçamento + Dashboard (itens 1, 9)

     Mudanças funcionais
     - Renomear status finalizado → salvo (label "Salvo").
     - Adicionar status pedido_fechado (label "Pedido Fechado") e cancelado (label "Cancelado").
     - Manter rascunho e enviado (avaliar se enviado continua útil ou pode ser deprecado — recomendação: manter por compat; usuário não pediu para remover).
     - Na lista e no detalhe de orçamento, permitir trocar manualmente entre os 4 status com transições livres (rascunho, salvo, pedido_fechado, cancelado). UI:
     dropdown/select no header do detalhe.
     - Adicionar ações Editar e Excluir no card de cada orçamento (kebab menu) e na página de detalhe.
     - Dashboard ganha:
       - Métrica Mão de obra (soma de subtotal_mao_obra no período).
       - Métrica Margem de lucro (soma de valor_margem no período).
       - Métrica composta Margem + Mão de obra.
       - Métrica Pedidos fechados (count + valor).
       - Métrica Total de custos = imposto + custos_adicionais + deslocamento no período.
       - Filtro de datas (range picker) com presets: Mês atual, Últimos 30 dias, Últimos 90 dias, Personalizado.
     - Header do Dashboard: substituir Painel de Controle por Olá, {nome do carpinteiro} (corrige bug do item 9). Manter o overline "Bem-vindo de volta".

     Causa-raiz do bug do header: dashboard-page.tsx:110-113 tem H1 hardcoded "Painel de Controle"; a variável carpinteiro.nome está disponível na linha 34 mas não é
     interpolada.

     Schema Supabase (migration nova)
     - Alterar enum orcamento_status: adicionar salvo, pedido_fechado, cancelado. Migrar dados existentes: UPDATE orcamentos SET status='salvo' WHERE status='finalizado'.
     Manter finalizado no enum por compatibilidade ou remover após backfill — decisão na spec.
     - Adicionar colunas em orcamentos: deslocamento NUMERIC DEFAULT 0, custos_adicionais NUMERIC DEFAULT 0. Nullable false com default 0.
     - Atualizar trigger de total se houver, ou recalcular client-side e gravar.

     Arquivos a tocar
     - src/types/common.ts — atualizar OrcamentoStatus.
     - src/pages/carpinteiro/dashboard-page.tsx — header, métricas, filtro datas.
     - src/pages/carpinteiro/orcamentos-page.tsx — STATUS_LABEL, STATUS_CLASS, FILTER_TABS, ações editar/excluir.
     - src/pages/carpinteiro/orcamento-detalhe-page.tsx — selector de status, ações.
     - src/components/orcamento/orcamento-recente-card.tsx — labels novos.
     - src/types/orcamento.ts — campos novos.
     - Migration: supabase/migrations/003_status_e_custos.sql (nome sugerido).

     ---
     Épico 2 — Edição de Orçamento Salvo (item 2)

     Causa-raiz: A rota /carpinteiro/orcamentos/:id/editar está definida em src/constants/routes.ts:16 e é navegada em orcamento-detalhe-page.tsx, mas não está mapeada em
     App.tsx — o <Route> correspondente não existe. Resultado: a navegação cai no fallback Navigate to /login (App.tsx:107), que parece "página saindo".

     Mudanças
     - Criar src/pages/carpinteiro/editar-orcamento-page.tsx que reaproveita a estrutura do wizard de novo orçamento, mas:
       - Carrega orçamento via useOrcamento(id).
       - Hidrata o useOrcamentoStore com os dados existentes (incluindo itens com snapshot).
       - No "Finalizar" faz UPDATE em vez de INSERT.
     - Adicionar <Route path="/carpinteiro/orcamentos/:id/editar" element={<EditarOrcamentoPage />} /> em App.tsx.
     - Edição funciona para qualquer status (rascunho, salvo, pedido fechado, cancelado) — usuário decidiu transições livres. Para preservar histórico, ao editar um orçamento      já não-rascunho, manter finalizado_at original e atualizar campos sem deletar.

     Arquivos a tocar
     - src/App.tsx
     - src/pages/carpinteiro/editar-orcamento-page.tsx (novo)
     - src/stores/useOrcamentoStore.ts — adicionar action hydrate(orcamento, itens).
     - src/hooks/useOrcamento.ts — confirmar que retorna itens com todos os campos de snapshot.

     ---
     Épico 3 — Bugs e novos campos no Form de Orçamento (item 3)

     Causa-raiz do bug de quantidade: src/components/orcamento/item-material.tsx:45-50 — o handler ignora valores < 0.01 (incluindo NaN do campo vazio) e o input está
     controlado por value={item.quantidade}. Ao apagar, o input rejeita silenciosamente e mantém o valor anterior, dando sensação de "preso em 1".

     Correções
     - Em item-material.tsx: usar state local string para a representação do input. Fluxo:
       - Manter inputValue (string) sincronizado com item.quantidade via useEffect.
       - onChange: aceita qualquer string (inclusive vazia), atualiza state local.
       - onBlur: parseFloat — se válido (>= 0.01), commita no store; se inválido, restaura para o valor anterior do store.
       - Remover min={0.01} do HTML para não bloquear edição.
     - Renomear seção "Margem e impostos" → "Margem e Custos" em step-financeiro.tsx:183.
     - Adicionar campos:
       - deslocamento (R$, mínimo 0, default 0).
       - custos_adicionais (R$, mínimo 0, default 0).
     - Atualizar StepFinanceiroData (src/lib/calcular-orcamento.ts), DadosFinanceiros, store, schema Zod e calcularOrcamento:
       - Nova fórmula: base = subtotal_materiais + subtotal_mao_obra + deslocamento + custos_adicionais. Margem e imposto continuam aplicados sobre base. Total final inclui
     esses custos.
       - ResumoOrcamento ganha deslocamento e custos_adicionais como campos espelhados (para o dashboard agregar).
     - Garantir que deslocamento, custos_adicionais, valor_margem NUNCA apareçam no PDF — independente do toggle "Detalhes no PDF". Reforçar isso em pdf-document.tsx.

     Arquivos a tocar
     - src/components/orcamento/item-material.tsx — fix do input.
     - src/components/orcamento/step-financeiro.tsx — schema, label, campos novos.
     - src/lib/calcular-orcamento.ts — fórmula + tipos.
     - src/stores/useOrcamentoStore.ts — defaults.
     - src/components/orcamento/pdf-document.tsx — esconder campos sensíveis.
     - src/components/orcamento/resumo-orcamento.tsx — exibir custos no resumo interno.

     ---
     Épico 4 — Toggle "Detalhes no PDF" compartilhado + warning (item 4)

     Estado atual: O toggle existe duplicado inline em novo-orcamento-page.tsx:389-402 e orcamento-detalhe-page.tsx:177-198. Não é componente reutilizável. Sem warning.

     Mudanças
     - Extrair para src/components/orcamento/toggle-detalhes-pdf.tsx — props: value, onChange, opcional disabled.
     - Trocar o useState direto por um wrapper que, ao ligar o toggle (false → true), abre AlertDialog (shadcn) com mensagem:
     ▎ "Ativar 'Detalhes no PDF' fará com que valores de mão de obra e materiais apareçam discriminados na proposta entregue ao cliente. Deseja continuar?"
     ▎ Botões: "Cancelar" / "Sim, mostrar detalhes".
     - Ao desligar (true → false), troca direta sem warning.
     - Reusar em ambas as telas (criação e detalhe). Comportamento idêntico em ambas.

     Arquivos a tocar
     - src/components/orcamento/toggle-detalhes-pdf.tsx (novo)
     - src/pages/carpinteiro/novo-orcamento-page.tsx — substituir inline.
     - src/pages/carpinteiro/orcamento-detalhe-page.tsx — substituir inline.

     ---
     Épico 5 — Pós-finalizar: visualização in-app + download automático + PDF de materiais (item 5)

     Mudanças
     - Após handleFinalizar() em novo-orcamento-page.tsx:183-231:
       - Em vez de navigate(ROUTES.CARPINTEIRO_ORCAMENTOS), navegar para /carpinteiro/orcamentos/:id/proposta (rota nova).
       - Disparar download automático do PDF via usePdf().exportar(orcamento).
     - Criar src/pages/carpinteiro/proposta-page.tsx que renderiza <PDFViewer> do @react-pdf/renderer com <OrcamentoPdfDocument />. Mobile: oferecer botão "Baixar novamente"
     + "Compartilhar" (Web Share API quando disponível) + "Voltar para orçamentos".
     - Botão "Baixar lista de materiais" na página da proposta (e também no detalhe do orçamento):
       - Cria src/components/orcamento/pdf-lista-materiais.tsx — Document com Page contendo SÓ a tabela de materiais (sem mão de obra, margem, impostos, custos extras, totais      financeiros). Header com logo + dados do projeto/cliente. Footer com data e nome do carpinteiro.
       - Adicionar usePdf().exportarMateriais(orcamento) ou método separado usePdfMateriais.

     Arquivos a tocar
     - src/pages/carpinteiro/proposta-page.tsx (novo).
     - src/pages/carpinteiro/novo-orcamento-page.tsx — mudar destino do navigate + trigger do download.
     - src/pages/carpinteiro/editar-orcamento-page.tsx (do Épico 2) — mesmo destino ao finalizar.
     - src/pages/carpinteiro/orcamento-detalhe-page.tsx — botão "Baixar lista de materiais" + link para /proposta.
     - src/components/orcamento/pdf-lista-materiais.tsx (novo).
     - src/hooks/usePdf.ts — segundo método de export.
     - src/App.tsx + src/constants/routes.ts — rota nova.

     ---
     Épico 6 — Vinculação: "Parceria ativa" (item 6)

     Mudanças
     - src/components/carpinteiro/busca-madeireira.tsx:
       - Aceitar prop opcional madeireiraVinculadaId?: string da página.
       - Se m.id === madeireiraVinculadaId, renderizar badge "Parceria ativa" (verde, ícone de check) em vez do botão "Solicitar Parceria".
     - Em vinculacao-page.tsx, passar vinculacao?.madeireira_id quando status === 'aprovada'.
     - Manter botão "Solicitar Parceria" desabilitado quando há outra parceria pendente.

     Arquivos a tocar
     - src/components/carpinteiro/busca-madeireira.tsx
     - src/pages/carpinteiro/vinculacao-page.tsx

     ---
     Épico 7 — Perfil: bugs + Configurações Financeiras expandidas (item 7)

     Causa-raiz "salvar não funciona": perfil-page.tsx:331 — botão fica disabled quando !isDirty && logoUrl === carpinteiro.logo_url. Se RHF não detecta dirty (ex.: campo
     numérico que não muda referência de objeto), o botão nunca habilita. Investigar também se o setValue('margem_lucro_padrao', ..., { shouldDirty: true }) em
     handleFinanceiroChange está sendo chamado corretamente — o ConfiguracoesFinanceiras aceita 0 como valor e força a string vazia (linha 82), o que pode confundir o
     controle de dirty.

     Causa-raiz "+ cores não funciona": perfil-page.tsx:223-229 — botão <button> sem onClick, sem implementação. Apenas marker visual.

     Correções
     - Bug do salvar: adicionar fallback explícito — habilitar botão quando há qualquer alteração detectável (isDirty || logoUrl !== original). Se isDirty está dando falso
     para campos financeiros, garantir setValue(..., { shouldDirty: true, shouldTouch: true }) e/ou usar useEffect que compara valores manualmente. Adicionar feedback visual
     ao tentar submeter form com erros (toast).
     - Botão "+" cores: implementar com <input type="color"> nativo. Ao escolher, adiciona à paleta local (sessão) e seleciona. Persistir cor selecionada em
     carpinteiros.cor_primaria (coluna nova) — assim o PDF pode usar a cor escolhida.
     - Adicionar em Configurações Financeiras:
       - Campo Custos adicionais padrão (R$, default 0). Usado como default em stepFinanceiro.custos_adicionais.
       - Campo Termos e condições padrão (textarea). Usado como default em stepFinanceiro.termos_condicoes. O usuário pode editar/apagar dentro de cada orçamento.
     - Schema Supabase: adicionar cor_primaria TEXT, custos_adicionais_padrao NUMERIC DEFAULT 0, termos_condicoes_padrao TEXT em carpinteiros.

     Arquivos a tocar
     - src/pages/carpinteiro/perfil-page.tsx — fix botão, color picker custom.
     - src/components/shared/configuracoes-financeiras.tsx — campos novos.
     - src/types/carpinteiro.ts — campos novos.
     - src/stores/useOrcamentoStore.ts — hidratar defaults a partir do carpinteiro autenticado.
     - src/components/orcamento/pdf-document.tsx — usar cor_primaria no header.
     - Migration: supabase/migrations/003_status_e_custos.sql (mesma do épico 1) ou separada.

     ---
     Épico 8 — Catálogo: linhas + Portfólio (item 8)

     Mudanças no catálogo (aba Madeireira)
     - Trocar useItensPreco por useCatalogoProdutos (já existe, suporta as 3 fontes: madeira_m3, outro_produto, legado_planilha).
     - Renderizar produtos em formato de linhas (estilo step-materiais.tsx), não em cards. Linha mostra: nome, dimensões/unidade, espécie (quando madeira m³), preço unitário,      badge de origem.
     - Remover o FAB "Nova Proposta" desta aba.

     Mudanças na aba "Meus Produtos" → Portfólio
     - Renomear aba conceitualmente para Portfólio (manter label "Meus Produtos" se preferido, ou mudar — decisão a finalizar na spec).
     - Botão "Novo Portfólio" (substitui o FAB removido).
     - Listagem de portfólios criados (cards com thumbnail + nome).
     - Modal/página de criação:
       - Campo "Nome do portfólio" (ex: "Pergolado Residencial").
       - Upload múltiplo: PDF (1) + imagens (N).
       - Salva em Storage bucket portfolios em {carpinteiro_id}/{portfolio_id}/....
     - Visualização do portfólio: galeria de imagens + link para PDF.
     - Compartilhamento via WhatsApp:
       - Cada portfólio ganha URL pública: /p/{slug} (slug = portfolio_id curto).
       - Página pública (sem auth) src/pages/public/portfolio-publico-page.tsx que carrega via RPC server-side ou query com RLS pública restrita.
       - Botão "Compartilhar no WhatsApp" abre https://wa.me/?text=Olha%20meu%20portf%C3%B3lio:%20{url}.

     Schema Supabase (migration nova)
     - Tabela portfolios:
       - id UUID PK, carpinteiro_id UUID FK, nome TEXT NOT NULL, slug TEXT UNIQUE, created_at TIMESTAMPTZ.
     - Tabela portfolio_arquivos:
       - id UUID PK, portfolio_id UUID FK CASCADE, tipo TEXT CHECK IN ('imagem','pdf'), storage_path TEXT, ordem INT, created_at TIMESTAMPTZ.
     - Storage bucket portfolios (público) com policy de upload restrita ao dono.
     - RLS:
       - Carpinteiro dono: FOR ALL USING auth.uid() = carpinteiro.user_id.
       - Público: FOR SELECT USING true em ambas as tabelas (tudo é público por design — slug atua como secret).

     Arquivos a tocar
     - src/pages/carpinteiro/catalogo-page.tsx — remover cards, usar linhas, remover FAB, integrar useCatalogoProdutos.
     - src/components/carpinteiro/catalogo-linha.tsx (novo) — componente de linha unificado.
     - src/hooks/useCatalogoProdutos.ts — confirmar API (parcialmente pronto).
     - src/pages/carpinteiro/portfolios-page.tsx (novo) — alternativa: integrar dentro da aba.
     - src/components/carpinteiro/novo-portfolio-dialog.tsx (novo).
     - src/pages/public/portfolio-publico-page.tsx (novo).
     - src/hooks/usePortfolios.ts (novo).
     - src/types/portfolio.ts (novo).
     - Migration: supabase/migrations/004_portfolios.sql.

     ---
     Mudanças no schema (consolidado)

     Duas migrations novas:

     1. 003_status_custos_perfil.sql:
       - Enum orcamento_status: adicionar salvo, pedido_fechado, cancelado.
       - Backfill: UPDATE orcamentos SET status='salvo' WHERE status='finalizado'.
       - ALTER TABLE orcamentos ADD COLUMN deslocamento NUMERIC NOT NULL DEFAULT 0, ADD COLUMN custos_adicionais NUMERIC NOT NULL DEFAULT 0.
       - ALTER TABLE carpinteiros ADD COLUMN cor_primaria TEXT, ADD COLUMN custos_adicionais_padrao NUMERIC NOT NULL DEFAULT 0, ADD COLUMN termos_condicoes_padrao TEXT.
     2. 004_portfolios.sql:
       - Tabelas portfolios, portfolio_arquivos.
       - Bucket portfolios (Storage).
       - RLS conforme épico 8.

     Após criar migrations, rodar mcp__supabase__generate_typescript_types para sincronizar src/types/database.ts (ou equivalente).

     ---
     Atualizações em arquivos de documentação

     Atualizar CLAUDE.md (raiz do projeto, seção "Regras de Negócio Críticas" e "Convenções"):
     - Substituir lista de status rascunho|finalizado|enviado por rascunho|salvo|enviado|pedido_fechado|cancelado (ou definir o conjunto final na spec).
     - Acrescentar novos campos do orçamento (deslocamento, custos_adicionais) na descrição da fórmula.
     - Acrescentar regra: "Custos deslocamento, custos_adicionais e valor_margem jamais aparecem no PDF — independente do toggle Detalhes."
     - Mencionar a nova feature de Portfólio em "Sobre o Produto" → seção do Carpinteiro.
     - Listar as novas tabelas (portfolios, portfolio_arquivos) e o bucket portfolios.

     Atualizar PRD.md (será reescrito após este plano):
     - Será gerado a partir desse plano + PRD existente, incorporando os 9 itens como user stories.

     Atualizar spec.md (etapa seguinte ao PRD):
     - Detalhar tipos, RLS, fluxos de UI, contratos de hooks, etc.

     Não há necessidade de mexer em references/architecture.md nem references/engineering.md — as mudanças não alteram arquitetura geral nem padrões de engenharia. Apenas
     considerar se a feature de Portfólio merece um adendo no architecture.md (decisão na execução: provavelmente não, basta documentar em CLAUDE.md).

     Não mexer em references/NOVODESIGN.md nem references/design-atualizado/ — sem mudanças visuais profundas além das óbvias decorrentes (badges de status, novos cards de
     métrica seguem padrão Timber Grain existente).

     ---
     Verificação (como testar end-to-end)

     Após implementação completa:
     1. Status & Dashboard: criar orçamento, salvar, alterar manualmente para "Pedido Fechado" → verificar Dashboard mostra contagem e valor; aplicar filtro de últimos 30
     dias e ver métrica de "Total de custos" agregar imposto + custos_adicionais + deslocamento.
     2. Edição: abrir um orçamento "Salvo" via lista → tela de edição carrega → mudar quantidade → finalizar → PDFViewer abre + PDF baixa.
     3. Bug quantidade: criar orçamento, adicionar item, apagar quantidade, digitar 5 → aceita; deixar vazio + blur → restaura último valor válido.
     4. Toggle PDF: ativar toggle em criação → AlertDialog aparece → confirmar → PDF mostra detalhes; desativar → sem warning. Repetir em detalhe — comportamento idêntico.
     5. Lista de materiais: na proposta, clicar "Baixar lista de materiais" → PDF reduzido baixa, sem mão de obra/margem/impostos/custos.
     6. Vinculação: buscar madeireira já vinculada → badge "Parceria ativa" aparece em vez do botão.
     7. Perfil: alterar nome, salvar → confirma; alterar cor (paleta + custom via "+") → cor reflete na prévia; alterar campo financeiro → botão habilita; salvar; criar novo
     orçamento → defaults vêm do perfil.
     8. Catálogo: ver produtos em linhas (não cards), com madeira m³, outros e legado misturados; aba "Meus Produtos" mostra botão "Novo Portfólio"; criar portfólio com 1 PDF      + 3 imagens; clicar "Compartilhar WhatsApp" → abre wa.me com link; abrir link em aba anônima → portfólio público renderiza.
     9. Greeting: Dashboard mostra "Olá, {nome}" no H1, não mais "Painel de Controle".

     ---
     Arquivos críticos referenciados (paths absolutos do projeto)

     - src/types/common.ts — enum status.
     - src/App.tsx — rotas.
     - src/constants/routes.ts — paths.
     - src/pages/carpinteiro/dashboard-page.tsx — header, métricas, filtro datas.
     - src/pages/carpinteiro/orcamentos-page.tsx — lista, filtros, ações.
     - src/pages/carpinteiro/orcamento-detalhe-page.tsx — selector status, ações, lista materiais.
     - src/pages/carpinteiro/novo-orcamento-page.tsx — wizard + finalizar.
     - src/pages/carpinteiro/perfil-page.tsx — bugs salvar/cores, configs financeiras.
     - src/pages/carpinteiro/catalogo-page.tsx — linhas, portfólios.
     - src/pages/carpinteiro/vinculacao-page.tsx — passar id da vinculada.
     - src/components/orcamento/item-material.tsx — fix quantidade.
     - src/components/orcamento/step-financeiro.tsx — schema renomeado + custos.
     - src/components/orcamento/pdf-document.tsx — esconder custos sensíveis, cor_primaria.
     - src/components/carpinteiro/busca-madeireira.tsx — badge parceria ativa.
     - src/components/shared/configuracoes-financeiras.tsx — campos novos.
     - src/lib/calcular-orcamento.ts — fórmula + tipos.
     - src/stores/useOrcamentoStore.ts — defaults + action hydrate.
     - src/hooks/usePdf.ts — método para lista de materiais.
     - src/hooks/useCatalogoProdutos.ts — confirmar consumo.
     - supabase/migrations/003_status_custos_perfil.sql (novo).
     - supabase/migrations/004_portfolios.sql (novo).
     - CLAUDE.md — regras de negócio atualizadas.