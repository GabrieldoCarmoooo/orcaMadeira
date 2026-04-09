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
- Carpinteiro busca madeireira
- Carpinteiro vê produtos e preços 

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
- Seleciona se vai mostrar ou não os materiais e a mão de obra, ou se será somente o valor do projeto fechado na proposta

### F7 - Geração de PDF
- Layout profissional com logo do carpinteiro
- Dados do cliente
- Lista de materiais com quantidades e valores (caso o carpinteiro queira ou não mostrar)
- Mão de obra discriminada (caso o carpinteiro queira ou não mostrar)
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
- App mobile
- Integração com WhatsApp para envio de PDF
- Monetização (assinatura, comissão, freemium)

## Métricas de Sucesso (MVP)
- Carpinteiro consegue criar um orçamento em < 15 minutos
- PDF gerado é considerado profissional (pesquisa qualitativa)
- Madeireira consegue fazer upload de preços em < 5 minutos

## Requisitos Não-Funcionais
- Responsivo (mobile-first para carpinteiros em obra)
- Performance: < 3s para carregar qualquer página
- Acessível (WCAG 2.1 AA mínimo)
- Dados sensíveis (preços) protegidos por autenticação
- Suporte a navegadores modernos (Chrome, Firefox, Safari, Edge)
