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
