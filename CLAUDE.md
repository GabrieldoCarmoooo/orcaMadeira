# OrçaMadeira - Regras de Negócio e Contexto do Projeto

## Sobre o Produto
OrçaMadeira é um SaaS web/ responsivo mobile para marceneiros e carpinteiros criarem orçamentos profissionais com preços reais de uma madeireira parceira.

## Usuários do Sistema

### Carpinteiro/Marceneiro
- Cria orçamentos para clientes finais
- Utiliza os produtos para orçamento disponibilizados pela Madeireira
- Configura margem de lucro e valor de mão de obra, frete e outros campos necessarios
- Gera PDF profissional do orçamento e personalizado com logo e cores da marca do Carpinteiro

### Madeireira
- Faz o cadastro dos produtos na aplicação, sendo separados por Madeira m³ e Outros Produtos
- Faz upload de planilha (CSV/Excel) com produtos e tabela de preços
- Atualiza produtos e preços manualmente quando necessário
- Disponibiliza os produtos e preços para os carpinteiros

## Regras de Negócio Críticas

### Orçamentos
1. Fórmula: **Materiais + Mão de Obra + Margem de Lucro + Impostos = Preço Final**
2. Preços de materiais vêm SEMPRE da tabela da madeireira
3. O carpinteiro define a mão de obra por projeto ou por hora
4. A margem de lucro é um percentual definido pelo carpinteiro
5. Impostos são configuráveis (ISS, etc.)
6. O orçamento gera um PDF profissional com logo, detalhes e preços

### Tipos de Projeto
- **Móveis**: armários, mesas, prateleiras, cozinhas planejadas
- **Estruturas**: telhados, pergolados, decks, coberturas

### Vinculação Carpinteiro-Madeireira
- Cada carpinteiro se vincula a madeireira principal
- Se a madeireira atualizar preços, os orçamentos em rascunho usam preços novos
- Orçamentos já finalizados mantêm os preços do momento da finalização

### Upload de Preços (Madeireira)
- Cadastro de Produto: Deve ter duas opções de cadastro. Cadastrar com m³ as madeiras. Exemplo: "Nome do Produto": Viga de 5x15 cambará. "Espessura": 5, "Largura": 15, "comprimento(padrão 1m)": 1 . Automaticamente calcula o volume, e deve puxar o valor automaticamente do m³ da Espécie da Madeira (exemplo: Cambara) que será cadastro em outra aba as espécies e o valor do m³ das Madeiras. e deve ter a opção de cadastrar "Outros Produtos", apenas colocando o "nome do produto" e o "valor(R$)". Exemplo: Prego 17x21, R$19,90.
- Aceita CSV e Excel (.xlsx) Para Upload
- Colunas obrigatórias para madeira m³: nome do produto, unidade, espessura, largura, comprimento, preço unitário
- Colunas opcionais: Espécie, código, descrição,
- Validação de dados no upload (preços negativos, campos vazios, etc.)

## Stack Técnica
- **Frontend**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS 4 + shadcn/ui (radix-nova) com design system Timber Grain
  - Primary: Wood Gold (#7A5900), Secondary: Mahogany (#9D422B)
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
- Design: `references/NOVODESIGN.md`
- Engenharia: `references/engineering.md`
- PRD: `PRD.md`

## Skills
- Para qualquer implementação/alteração que seja relacionada ao banco de dados utilize a skill: `supabase-postgres-best-practices`
- Para qualquer implementação/alteração de layout e design utilize ou a skill do shadcn: `shadcn` . OU a skill: `frontend-design`
- Para qualquer implementação ou alteração sobre pdf utilize a skill: `pdf`
- Para qualquer implementação/alteração via MCP utilize a skill: `mcp-builder`