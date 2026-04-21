# Plano de Implementação: Transição de Orçamentos Baseados em Planilha para Catálogo de Produtos Relacional (OrçaMadeira)

## 1. Objetivo Principal
Atualizar a aplicação "OrçaMadeira" para permitir que usuários do tipo "Madeireira" cadastrem seus produtos, espécies e serviços diretamente no sistema (sessão "Preços"), abandonando a dependência exclusiva de uploads de planilhas. Usuários do tipo "Carpinteiro/Marceneiro" deverão conseguir gerar orçamentos consumindo essa nova estrutura de dados de forma transparente.

**Regra de Ouro:** NENHUMA funcionalidade atual deve ser quebrada. O sistema de upload de planilhas existente deve continuar intacto e funcional durante esta implementação. A transição para o Carpinteiro deve prever suporte à estrutura nova, mantendo a compatibilidade com orçamentos antigos.

## 2. Estrutura de Dados e Regras de Negócio (via Supabase MCP)
A sessão "Preços" do painel da Madeireira será dividida em 4 categorias de cadastro. O modelo de dados deve refletir essas entidades.

### 2.1. Cadastro de "Espécies de Madeira"
* **Campos Necessários:** Nome da Espécie (ex: "Pinus", "Cambará"), Valor do Metro Cúbico (m³) (ex: R$ 5.250,00), ID da Madeireira vinculada.
* **Comportamento:** Esta tabela servirá como base de cálculo para os produtos de madeira dimensionada.

### 2.2. Cadastro de "Madeiras m³" (Produtos Dimensionados)
* **Campos Necessários:** * Espécie da Madeira (Relacionamento com a tabela de Espécies).
    * Nome do Produto (ex: "Viga de Cambará 5x15").
    * Espessura em cm (ex: 5).
    * Largura em cm (ex: 15).
    * Comprimento em metros (Padrão fixo de 1m para o cadastro base).
    * Valor Unitário (Campo calculado).
* **Regra de Cálculo Estrita:** O Valor Unitário deve ser calculado automaticamente pelo sistema multiplicando o volume da peça pelo valor do m³ da espécie vinculada.
    * *Fórmula:* `(Espessura / 100) * (Largura / 100) * Comprimento * Valor_m3_da_Especie`
    * *Exemplo prático:* Viga 5x15 de Cambará (R$ 4.200,00 o m³). Cálculo: `0,05 * 0,15 * 1 * 4200 = R$ 31,50`.

### 2.3. Cadastro de "Outros Produtos"
* **Campos Necessários:** Nome do Produto (ex: "Prego 17x21", "Telha de Barro"), Valor Unitário, Unidade de Medida (ex: Kg, Unidade, etc.), ID da Madeireira.
* **Comportamento:** Produtos independentes que não sofrem variação por cálculo de m³. Preço direto e fixo.

### 2.4. Cadastro de "Serviços de Acabamento"
* **Campos Necessários:** Nome do Serviço (ex: "Aparelhado", "Lixamento"), Porcentagem de Acréscimo (ex: 10%, 20%), ID da Madeireira.
* **Comportamento:** Modificadores de preço que serão aplicados como um multiplicador (markup) no valor final dos itens de madeira durante o orçamento.

## 3. Adaptação do Fluxo do Usuário "Carpinteiro" (Orçamentos)
O módulo de geração de orçamentos para os carpinteiros precisa ser atualizado para ler as novas tabelas do banco de dados (Espécies, Madeiras m³, Outros Produtos, Acabamentos), em vez de ler apenas os dados gerados via upload de planilha.

* **Seleção de Produtos:** O carpinteiro deve conseguir buscar os produtos diretamente do catálogo cadastrado pela madeireira selecionada.
* **Cálculo Dinâmico de Acabamento:** Ao adicionar um item de madeira ao orçamento, o carpinteiro deve ter a opção de selecionar um "Serviço de Acabamento" (lido da tabela 2.4). O sistema deve aplicar a porcentagem de acréscimo correspondente sobre o valor do item.
* **Flexibilidade de Comprimento:** Embora o cadastro de "Madeiras m³" tenha o padrão de 1m, no momento do *orçamento*, o carpinteiro informará o comprimento real desejado, e o sistema deve multiplicar o "Valor Unitário (de 1m)" pelo comprimento solicitado.

## 4. Diretrizes de Execução para o Agente
1.  **Analise o Banco de Dados:** Utilize o MCP do Supabase para inspecionar o schema atual e entender onde as novas tabelas se encaixarão de forma isolada.
2.  **Apresente o Schema:** Antes de criar as tabelas, apresente as queries SQL de criação das tabelas e RLS (Row Level Security) para validação.
3.  **Desenvolva as Interfaces:** Crie os formulários e botões necessários no usuario da "Madeireira" para alimentar essas 4 novas estruturas.
4.  **Adapte o Orçamento:** Atualize a lógica de consumo no usuario do "Carpinteiro" aplicando as fórmulas matemáticas solicitadas e também crie os formulários e botões necessários no usuario do "Carpinteiro"
5.  **Validação:** Verifique rigorosamente se a funcionalidade antiga de planilha não foi comprometida.