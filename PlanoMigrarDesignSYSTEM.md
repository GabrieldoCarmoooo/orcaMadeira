Plano: Migrar Design System para "Timber Grain"

 Context

 O app OrçaMadeira usa atualmente um tema neutro grayscale (shadcn/ui neutral). O novo design "Timber Grain" / "The Master's Atelier" traz uma identidade visual premium      
 inspirada em madeira, com paleta wood-gold (#7A5900) + mahogany (#9D422B), sem bordas 1px, glassmorfismo no header, e bottom nav no mobile. O objetivo é migrar toda a       
 referência de design e a implementação visual sem alterar banco de dados, lógica de negócio ou routing.

 ---
 Fase 1: Documentação (0 risco de quebra)

 Atualizar todos os arquivos de referência para que o novo design seja a fonte de verdade.

 1.1 references/design.md

 - Substituir completamente pelo conteúdo do references/novodesign/timber_grain/DESIGN.md
 - Adicionar seções extras: paleta completa de tokens (tabela hex), padrões de navegação (bottom nav mobile, sidebar desktop com glassmorfismo), padrões de badges
 (uppercase, tracking-widest, 10px), referência aos screenshots em references/novodesign/

 1.2 CLAUDE.md

 - Seção "Stack Técnica > Styling": trocar shadcn/ui (radix-nova style) por shadcn/ui (radix-nova) com design system Timber Grain
 - Adicionar nota: "Primary: Wood Gold (#7A5900), Secondary: Mahogany (#9D422B)"
 - Seção "Referências": manter references/design.md como referência de design (já aponta pro arquivo correto)

 1.3 PRD.md

 - Na seção de UI/design, adicionar referência ao design system "Timber Grain" e apontar para references/design.md
 - Trocar menção a "cores neutras" por "paleta Timber Grain (wood gold + mahogany)"

 1.4 spec.md

 - Linha de Estilização na tabela de stack: adicionar "Design System: Timber Grain"
 - Manter todo o resto inalterado

 1.5 issues.md

 - Adicionar nova issue para rastrear a migração de design

 1.6 references/architecture.md

 - Atualizar menção a estilização para incluir "Timber Grain design tokens"

 ---
 Fase 2: CSS Tokens (src/index.css)

 Arquivo mais impactante. Todos os componentes usam classes semânticas do Tailwind (bg-primary, text-muted-foreground, etc.), então trocar os valores das variáveis propaga   
 automaticamente.

 2.1 :root — Trocar variáveis de cor

 ┌────────────────────────┬─────────────────────────────┬──────────────────────────────────────────┐
 │      Variável CSS      │       Antes (neutral)       │        Depois (Timber Grain hex)         │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --background           │ oklch(1 0 0) branco         │ #FEF8F4 warm cream                       │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --foreground           │ oklch(0.145 0 0) preto      │ #1D1B19 near-black quente                │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --card                 │ oklch(1 0 0) branco         │ #E7E1DE surface-container-highest        │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --card-foreground      │ —                           │ #1D1B19 on-surface                       │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --popover              │ —                           │ #FFFFFF surface-container-lowest         │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --popover-foreground   │ —                           │ #1D1B19                                  │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --primary              │ oklch(0.205 0 0) preto      │ #7A5900 wood gold                        │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --primary-foreground   │ —                           │ #FFFFFF                                  │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --secondary            │ oklch(0.97 0 0) cinza claro │ #9D422B mahogany                         │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --secondary-foreground │ —                           │ #FFFFFF                                  │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --muted                │ oklch(0.97 0 0)             │ #F3EDE9 surface-container                │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --muted-foreground     │ oklch(0.556 0 0)            │ #504532 on-surface-variant               │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --accent               │ oklch(0.97 0 0)             │ #FFBC00 primary-container (gold vibrant) │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --accent-foreground    │ —                           │ #6C4E00 on-primary-container             │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --destructive          │ mantém hue vermelho         │ #BA1A1A                                  │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --border               │ oklch(0.922 0 0)            │ #D4C4AB outline-variant                  │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --input                │ oklch(0.922 0 0)            │ #827560 outline                          │
 ├────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
 │ --ring                 │ oklch(0.708 0 0)            │ #7A5900 primary                          │
 └────────────────────────┴─────────────────────────────┴──────────────────────────────────────────┘

 2.2 Sidebar vars

 - --sidebar: #F9F2EF (surface-container-low)
 - --sidebar-foreground: #1D1B19
 - --sidebar-primary: #7A5900
 - --sidebar-accent: #EDE7E3 (surface-container-high)
 - --sidebar-border: #D4C4AB

 2.3 Chart colors

 Usar a nova paleta: primary, secondary, tertiary (#00687A), accent, outline.

 2.4 --radius

 Mudar de 0.625rem (10px) para 0.5rem (8px) — 8px default, ~16px no xl/2xl.

 2.5 Dark mode .dark

 Manter funcional com tons warm escuros (não neutros puros). Inverter a paleta mantendo os mesmos hues.

 2.6 Utilitários CSS extras (dentro de @layer base ou utilities)

 - Classe .glass-header: background-color: oklch(... / 80%); backdrop-filter: blur(12px);
 - Shadow tintada: variável --shadow-tinted com secondary a 6% opacity
 - Adicionar custom properties extras para surfaces que o shadcn não mapeia nativamente:
   - --surface-container-low, --surface-container-high, --surface-container-highest, --surface-container-lowest

 ---
 Fase 3: Componentes UI shadcn (3 arquivos)

 3.1 src/components/ui/button.tsx

 - Remover border das variants que usam (outline variant) — usar bg-only
 - Garantir rounded-lg mapeia para 8px com novo --radius
 - Variant secondary agora usa mahogany bg (#9D422B) + white text
 - Adicionar active state: active:scale-[0.97] para toque premium

 3.2 src/components/ui/input.tsx

 - Remover border border-input do base
 - Adicionar bg-muted (surface-container) como fundo
 - Focus: trocar ring por border-b-2 border-primary (pencil mark)
 - Remover focus-visible:ring-* classes
 - Manter rounded-lg (topo arredondado, fundo reto fica opcional)

 3.3 src/components/ui/label.tsx

 - Adicionar text-secondary (mahogany) como cor padrão para labels técnicos
 - Manter acessibilidade (Radix Label)

 ---
 Fase 4: Layout (4 arquivos modificados + 2 novos)

 4.1 NOVO: src/constants/nav-items.ts

 - Extrair arrays CARPINTEIRO_NAV e MADEIREIRA_NAV do app-sidebar.tsx
 - Compartilhar entre sidebar e bottom-nav

 4.2 NOVO: src/components/layout/bottom-nav.tsx

 - Bottom nav fixo, mobile only (lg:hidden)
 - 4 tabs com ícone (20px) + label (10px)
 - Active state: bg-accent text-accent-foreground (gold)
 - Glassmorfismo: bg-background/80 backdrop-blur-[12px]
 - Shadow tintada no topo: shadow-[0_-4px_6px_-1px_rgba(157,66,43,0.06)]
 - safe-area-inset-bottom padding para iOS

 4.3 src/components/layout/app-sidebar.tsx

 - Esconder no mobile: hidden lg:flex
 - Remover border-r, border-b, border-t (no-line rule)
 - Usar background shift: sidebar bg = surface-container-low, contrasta com background
 - Importar nav items de nav-items.ts

 4.4 src/components/layout/app-header.tsx

 - Aplicar glassmorfismo: bg-background/80 backdrop-blur-[12px]
 - Remover border-b
 - Adicionar shadow tintada sutil
 - No mobile: remover botão hamburger (substituído pelo bottom-nav)

 4.5 src/components/layout/dashboard-layout.tsx

 - Renderizar <BottomNav /> no mobile
 - Manter sidebar apenas lg: e acima

 4.6 src/components/layout/page-wrapper.tsx

 - Adicionar pb-20 lg:pb-0 para compensar bottom nav no mobile

 ---
 Fase 5: Componentes de Negócio (4 arquivos)

 5.1 src/components/shared/stat-card.tsx

 - Remover border border-border → usar bg-card (agora surface-container-highest)
 - Shadow tintada: shadow-[0_2px_8px_rgba(157,66,43,0.06)]
 - Highlight variant: bg-accent (gold #FFBC00)

 5.2 src/components/orcamento/orcamento-recente-card.tsx

 - Remover border → bg-card + shadow tintada
 - Badges: adicionar uppercase tracking-widest text-[10px] font-bold

 5.3 src/components/shared/logo-uploader.tsx

 - Drop zone: trocar border-2 border-dashed por bg-muted rounded-lg com hover state

 5.4 src/components/shared/configuracoes-financeiras.tsx

 - Mudanças mínimas — labels e inputs herdam automaticamente das fases 2-3

 ---
 Fase 6: Páginas Auth (4 arquivos)

 Mudanças uniformes em:
 - src/pages/auth/login-page.tsx
 - src/pages/auth/register-page.tsx
 - src/pages/auth/forgot-password-page.tsx
 - src/pages/auth/reset-password-page.tsx

 Para cada:
 - Remover borders de alertas de erro/sucesso, usar apenas bg color
 - Brand "OrçaMadeira": text-primary (wood gold)
 - Container do form: bg-card rounded-2xl com shadow tintada
 - Register: role selector sem borders, usar bg shift

 ---
 Fase 7: Páginas Dashboard/Perfil (3 arquivos)

 7.1 src/pages/carpinteiro/dashboard-page.tsx

 - CTA sem madeireira: trocar amber-* para accent / accent-foreground
 - Empty states: remover border-dashed, usar bg-card + shadow
 - Section headers: text-secondary uppercase tracking-widest text-xs

 7.2 src/pages/carpinteiro/perfil-page.tsx

 - Section titles: text-secondary (mahogany)
 - Remover border-t do action bar
 - Alertas: remover borders

 7.3 src/pages/madeireira/perfil-page.tsx

 - Mesmas mudanças do perfil carpinteiro

 Stubs (vinculacao, orcamentos, madeireira dashboard/precos/parceiros)

 - Sem mudanças necessárias — usam classes semânticas que atualizam via CSS vars

 ---
 Fase 8: Verificação

 1. npm run dev — verificar visualmente todas as páginas
 2. Contraste WCAG AA — especialmente secondary (#9D422B) sobre cream (#FEF8F4)
 3. Mobile: bottom nav aparece, sidebar escondida
 4. Desktop: sidebar aparece com novas cores, sem bottom nav
 5. Estados interativos: hover/active em botões, focus pencil-mark em inputs
 6. Dark mode funcional
 7. Glassmorfismo no header
 8. npm run build — zero erros

 ---
 Resumo de Arquivos

 ┌────────────────────────────┬───────────────────────────────────────────────────────────────────────┬──────────────────────────────────┐
 │            Fase            │                              Modificados                              │             Criados              │
 ├────────────────────────────┼───────────────────────────────────────────────────────────────────────┼──────────────────────────────────┤
 │ 1 - Docs                   │ 6 (design.md, CLAUDE.md, PRD.md, spec.md, issues.md, architecture.md) │ 0                                │
 ├────────────────────────────┼───────────────────────────────────────────────────────────────────────┼──────────────────────────────────┤
 │ 2 - CSS                    │ 1 (index.css)                                                         │ 0                                │
 ├────────────────────────────┼───────────────────────────────────────────────────────────────────────┼──────────────────────────────────┤
 │ 3 - UI Components          │ 3 (button.tsx, input.tsx, label.tsx)                                  │ 0                                │
 ├────────────────────────────┼───────────────────────────────────────────────────────────────────────┼──────────────────────────────────┤
 │ 4 - Layout                 │ 4 (sidebar, header, dashboard-layout, page-wrapper)                   │ 2 (bottom-nav.tsx, nav-items.ts) │
 ├────────────────────────────┼───────────────────────────────────────────────────────────────────────┼──────────────────────────────────┤
 │ 5 - Business Components    │ 4 (stat-card, orcamento-card, logo-uploader, config-financeiras)      │ 0                                │
 ├────────────────────────────┼───────────────────────────────────────────────────────────────────────┼──────────────────────────────────┤
 │ 6 - Auth Pages             │ 4                                                                     │ 0                                │
 ├────────────────────────────┼───────────────────────────────────────────────────────────────────────┼──────────────────────────────────┤
 │ 7 - Dashboard/Perfil Pages │ 3                                                                     │ 0                                │
 ├────────────────────────────┼───────────────────────────────────────────────────────────────────────┼──────────────────────────────────┤
 │ Total                      │ 25                                                                    │ 2                                │
 └────────────────────────────┴───────────────────────────────────────────────────────────────────────┴──────────────────────────────────┘

 Ordem de Execução

 Fase 1 (docs) → Fase 2 (CSS tokens) → Fase 3 (UI components) → Fase 4 (layout) → Fase 5 (business components) → Fase 6+7 (pages) → Fase 8 (verificação)

 Cada fase pode ser verificada isoladamente. A Fase 2 (CSS) é a de maior impacto — ao trocar as variáveis, ~80% da mudança visual já acontece automaticamente.