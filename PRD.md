# PRD — OrçaMadeira

## Visão do Produto
OrçaMadeira é uma plataforma SaaS que conecta carpinteiros/marceneiros a madeireiras, permitindo a criação de orçamentos profissionais com preços reais e atualizados vindos de um catálogo relacional mantido pela madeireira.

## Problema
Carpinteiros perdem tempo criando orçamentos manualmente, consultando preços por telefone/WhatsApp com madeireiras, calculando custos em planilhas improvisadas e entregando orçamentos sem padrão profissional ao cliente. Isso resulta em erros de precificação, perda de credibilidade e retrabalho.

## Solução
Uma plataforma onde:
1. **Madeireiras** cadastram e atualizam seu catálogo no app (4 categorias) e, opcionalmente, fazem upload de planilha para importação em massa.
2. **Carpinteiros** criam orçamentos selecionando materiais com preços reais, escolhendo comprimentos pré-cadastrados, aplicando acabamento opcional e adicionando mão de obra, margem e impostos.
3. O sistema gera um **PDF profissional** com a marca do carpinteiro.

## Personas

### Persona 1 — João, Marceneiro Autônomo
- 35 anos, marceneiro há 12 anos. Faz móveis sob medida.
- Perde 2–3h por orçamento consultando preços; usa WhatsApp.
- Envia orçamentos em Word ou manuscritos.
- Quer parecer mais profissional para fechar mais clientes.

### Persona 2 — Carlos, Carpinteiro Estrutural
- 45 anos, especializado em telhados e pergolados.
- Projetos grandes com volumes de madeira significativos.
- Erro no orçamento = prejuízo. Quer precisão nos cálculos.

### Persona 3 — Maria, Dona de Madeireira
- 50 anos, administra madeireira familiar, ~30 carpinteiros parceiros.
- Atualiza preços semanalmente; cansada de responder WhatsApp.
- Quer um canal digital padronizado para divulgar seu catálogo.

---

## Funcionalidades (MVP)

### F1 — Autenticação
- Login/cadastro para carpinteiros e madeireiras via Supabase Auth.
- Seleção de tipo de usuário no cadastro.
- Recuperação de senha por email (token expira em 1h).

### F2 — Perfil do Carpinteiro
- Dados pessoais (nome, CPF/CNPJ, telefone, endereço).
- Upload de logo (JPG/PNG, máx 2MB).
- Configuração padrão: margem de lucro, valor/hora de mão de obra, impostos.

### F3 — Perfil da Madeireira
- Dados da empresa (razão social, CNPJ, endereço, telefone).
- Upload de logo.

### F4 — Catálogo de Produtos (Madeireira) — **fluxo principal**

A página `/madeireira/precos` (ou `/madeireira/produtos`) é organizada em **5 abas**:

#### F4.1 — Espécies de Madeira
Base de cálculo do catálogo.
- Campos: `nome`, `custo_m3` (R$), `margem_lucro_pct` (%).
- Preview ao vivo do **valor de venda**: `valor_m3_venda = custo_m3 × (1 + margem_lucro_pct/100)`.
- Exemplo: Cambará, custo R$ 3.500,00/m³, margem 20% → venda R$ 4.200,00/m³.
- Ajustar custo ou margem reflete automaticamente em todas as Madeiras m³ da espécie (só não afeta orçamentos já finalizados, que são snapshot).

#### F4.2 — Madeiras m³
Produto dimensionado que herda o valor da espécie.
- Campos: `especie_id`, `nome`, `espessura_cm`, `largura_cm`, `comprimento_m` (referência, padrão 1), `disponivel`.
- Preview ao vivo do valor unitário: `(esp/100) × (larg/100) × comp × valor_m3_venda_da_especie`.
- Exemplo: Viga 5×15 Cambará (1m) = `0,05 × 0,15 × 1 × 4.200 = R$ 31,50`.
- **Lista de Comprimentos disponíveis** (1:N): a madeireira cadastra quais comprimentos vende por produto (ex.: 1m, 1,5m, 2m, 2,5m, 3m) com toggle `disponível`. Tabela lateral mostra o preço calculado para cada comprimento. Estoque não é rastreado nesta fase.

#### F4.3 — Outros Produtos
Itens com preço fixo (não dependem de cálculo de m³).
- Campos: `nome`, `unidade` (kg, un, m, m², etc.), `preco_unitario`, `descricao`, `disponivel`.
- Exemplo: Prego 17×21, kg, R$ 19,90.

#### F4.4 — Serviços de Acabamento
Modificadores percentuais aplicáveis a itens de madeira durante o orçamento.
- Campos: `nome`, `percentual_acrescimo` (%), `ativo`.
- Exemplos: Aparelhado +10%, Lixamento +10%, Verniz +20%.

#### F4.5 — Importação via Planilha (legado / bulk)
- Upload de CSV ou Excel (`.xlsx`, `.xls`), máx 10MB.
- Mapeamento de colunas (`nome`, `unidade`, `preco_unitario` obrigatórias; `categoria`, `código`, `descrição`, `disponível` opcionais).
- Prévia de dados com validação e destaque de erros.
- Histórico de uploads; apenas uma tabela ativa por vez (ativação atômica).
- Coexiste com o catálogo relacional: carpinteiros vinculados veem itens das duas origens.

### F5 — Vinculação Carpinteiro ↔ Madeireira
- Carpinteiro busca madeireira por nome/cidade e solicita parceria (`status = pendente`).
- Madeireira aprova/rejeita no painel de parceiros.
- Carpinteiro só pode ter **uma** vinculação ativa; nova solicitação cancela a anterior.
- Após aprovação, o carpinteiro tem SELECT no catálogo da madeireira (RLS via `vinculacoes` aprovadas).

### F6 — Criação de Orçamento
Wizard multi-step.
1. **Projeto:** tipo (móvel/estrutura), nome, descrição, dados do cliente.
2. **Materiais:** busca no catálogo unificado (Madeiras m³ + Outros Produtos + itens legados da planilha).
   - Ao adicionar uma **Madeira m³**: dialog abre com Select de **Comprimento** (opções pré-cadastradas, label ex.: "1,50 m — R$ 47,25"), Select opcional de **Acabamento** e quantidade.
   - Ao adicionar **Outro Produto** ou **item legado**: apenas quantidade.
   - Subtotal em tempo real: `preco_base × (1 + acabamento_pct/100) × quantidade`.
3. **Financeiro:** mão de obra (fixo ou hora × horas), margem %, impostos %, validade, termos.
4. **Resumo:** breakdown `materiais + mão_obra + margem + impostos = total`.
5. **Opção de exibição no PDF:** mostrar materiais/mão de obra discriminados OU apenas o total fechado.
6. **Salvar rascunho** (a qualquer momento) ou **Finalizar** (congela preços via snapshot).

### F7 — Geração de PDF
- Layout profissional com logo e cores do carpinteiro.
- Dados do cliente, lista de materiais (opcional), mão de obra (opcional), subtotais e total.
- Para itens de Madeira m³: linha auxiliar com espécie + dimensões reais + acabamento aplicado.
- Validade do orçamento e termos e condições editáveis.

### F8 — Dashboard
- **Carpinteiro:** orçamentos recentes, valor total orçado no mês, status, madeireira vinculada.
- **Madeireira:** carpinteiros vinculados, contagens por categoria do catálogo, último upload de planilha.

---

## Modelo de Dados — Catálogo Relacional

Cinco tabelas novas adicionadas pela migration 002, mais um ALTER TABLE na tabela de itens de orçamento para suportar as três origens de produto.

```
madeireiras (id, user_id, nome, cnpj, ...)
  │
  ├── especies_madeira (id, madeireira_id, nome, custo_m3, margem_lucro_pct)
  │     │   valor_m3_venda = custo_m3 × (1 + margem_lucro_pct/100) — derivado, nunca armazenado
  │     │
  │     └── madeiras_m3 (id, madeireira_id, especie_id, nome,
  │               espessura_cm, largura_cm, comprimento_m, disponivel)
  │               valor_unitario = (esp/100)×(larg/100)×comp×valor_m3_venda — derivado
  │               │
  │               └── comprimentos_madeira_m3 (id, madeira_m3_id, comprimento_m, disponivel)
  │                       UNIQUE (madeira_m3_id, comprimento_m)
  │
  ├── outros_produtos (id, madeireira_id, nome, unidade, preco_unitario, descricao, disponivel)
  │
  ├── servicos_acabamento (id, madeireira_id, nome, percentual_acrescimo, ativo)
  │       preco_final = preco_base × (1 + percentual_acrescimo/100) — derivado
  │
  └── tabelas_preco (legado)
        └── itens_preco (id, nome, unidade, preco_unitario)


itens_orcamento — ALTER TABLE (migration 002)
  ├── item_preco_id   uuid NULL          — FK legado (pode ser NULL para origens novas)
  ├── origem          text NOT NULL      — 'legado_planilha' | 'madeira_m3' | 'outro_produto'
  ├── madeira_m3_id   uuid NULL          — FK → madeiras_m3
  ├── outro_produto_id uuid NULL         — FK → outros_produtos
  │   CHECK: origem='legado_planilha' → item_preco_id IS NOT NULL
  │   CHECK: origem='madeira_m3'      → madeira_m3_id IS NOT NULL
  │   CHECK: origem='outro_produto'   → outro_produto_id IS NOT NULL
  │
  └── snapshots (gravados na finalização — imutáveis após status='finalizado')
        especie_nome, espessura_cm, largura_cm, comprimento_real_m, comprimento_id,
        acabamento_id, acabamento_nome, acabamento_percentual, preco_unitario, subtotal
```

**Princípio de snapshot:** `itens_orcamento` armazena `preco_unitario` e todos os metadados de espécie/dimensões/acabamento congelados no momento da finalização — garantindo que alterar custo/margem da espécie, remover um comprimento ou desativar um acabamento não altere orçamentos já finalizados. Orçamentos em rascunho sempre usam preços atuais do catálogo.

**Golden path de validação (SISMASTER):** Cambará (custo R$ 3.500 + margem 20%) → Viga 5×15 comprimento 2,50m + Lixamento +10% × 2 peças = **R$ 173,25**.

---

## Funcionalidades Futuras (pós-MVP)
- Calculadora de madeira avançada (m², metros lineares).
- Templates de projetos comuns.
- Histórico de orçamentos aceitos/rejeitados pelo cliente.
- Notificação quando madeireira atualiza preços.
- App mobile nativo.
- Integração com WhatsApp para envio de PDF.
- Controle de estoque por comprimento.
- Monetização (assinatura, comissão, freemium).

## Métricas de Sucesso (MVP)
- Madeireira cadastra primeiro produto em **< 2 minutos**.
- Carpinteiro cria orçamento completo em **< 15 minutos**.
- Madeireira importa planilha em **< 5 minutos**.
- PDF gerado é considerado profissional (pesquisa qualitativa).
- **Golden path R$ 173,25 validado** (Cambará 5×15×2,50m + Lixamento +10% × 2 = R$ 173,25).

## Requisitos Não-Funcionais
- Responsivo mobile-first (carpinteiros em obra).
- Performance: < 3s para carregar qualquer página.
- Acessibilidade: WCAG 2.1 AA mínimo.
- Dados sensíveis protegidos por autenticação + RLS.
- Suporte a navegadores modernos (Chrome, Firefox, Safari, Edge).
- Segredos nunca no bundle do frontend.
