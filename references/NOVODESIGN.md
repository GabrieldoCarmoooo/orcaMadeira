# Design System Document

## 1. Overview & Creative North Star: "The Master’s Atelier"
The Creative North Star for this design system is **The Master’s Atelier**. 

In woodworking, quality is felt through the grain, the joinery, and the weight of the material. This design system moves away from the "generic SaaS" look by treating the mobile screen as a high-end physical workspace. We are moving beyond standard grids to an **Editorial Wood-Block** layout—utilizing heavy, intentional typography, asymmetric white space, and tonal depth that mimics the layering of fine veneers. 

The goal is to provide a UI that feels as sturdy and premium as a mahogany boardroom table, yet remains hyper-functional for a carpenter standing in a sawdust-filled workshop. We replace thin, fragile lines with robust color blocks and high-contrast "inking" to ensure legibility under harsh shop lights.

---

## 2. Colors: Tonal Architecture
We use a palette inspired by raw timber and polished finishes. Our strategy relies on **Tonal Layering** rather than outlines.

### Palette Highlights
*   **Primary (#7A5900 / #FFBC00):** The "Gold/Wood" core. Use the darker `primary` for text-on-light and the vibrant `primary_container` for high-visibility highlights.
*   **Secondary (#9D422B / #5C1302):** The "Deep Mahogany." This provides the "ink" and the gravity. Use it for heavy-duty actions and sophisticated accents.
*   **Surface Hierarchy:**
    *   `surface`: The base floor of the shop (#FEF8F4).
    *   `surface_container_low`: Used for secondary information "etched" into the background.
    *   `surface_container_highest`: Used for the most prominent cards to create a natural "lift."

### The "No-Line" Rule
**Explicit Instruction:** Prohibit 1px solid borders for sectioning. 
Structure must be defined by background shifts. To separate a "Labor Cost" section from a "Materials" section, transition from `surface` to `surface_container_low`. If you feel the urge to draw a line, use 16px of vertical white space instead.

### The "Glass & Gradient" Rule
For floating action buttons or "Status" chips, use a subtle gradient from `primary` to `primary_container`. This mimics the way light hits a finished wood grain—adding "soul" to an otherwise flat digital interface.

---

## 3. Typography: The Editorial Scale
We use **Inter** not as a system font, but as a technical tool. By manipulating weight and tracking, we create an authoritative, editorial feel.

*   **Display (Large/Med/Small):** Used for "Hero" proposal totals or client names. Set with `-0.02em` tracking to feel "tight" and custom.
*   **Headline (Large/Med/Small):** The "Joinery" of the app. Use `headline-sm` for card titles to give them a bold, unmistakable presence.
*   **Body & Labels:** High-contrast `on_surface` (#1D1B19) ensures that even with sawdust on a screen, the grain of the text is legible.

**Hierarchy Note:** Use `secondary` (#9D422B) for `label-md` to highlight technical specs (e.g., "Dimensions: 24x48")—it separates "Technical Data" from "Narrative Text."

---

## 4. Elevation & Depth: Tonal Stacking
Standard shadows look "digital." We want "physical."

*   **The Layering Principle:** Instead of shadows, stack `surface_container_lowest` (the card) on `surface_container_high` (the background). This creates a crisp, "paper-on-wood" look.
*   **Ambient Shadows:** If an element must float (like a "Sign Proposal" button), use a shadow tinted with `secondary` at 6% opacity. This feels like a warm light source is hitting the UI.
*   **The Ghost Border:** If a boundary is required for accessibility in high-glare environments, use `outline_variant` at **15% opacity**. It should be a whisper, not a shout.
*   **Glassmorphism:** Use `surface_container_lowest` at 80% opacity with a `12px` backdrop blur for top navigation bars. This allows the "wood grain" of the content below to peek through as the user scrolls.

---

## 5. Components: Crafted Primitives

### Cards & Proposal Items
*   **Rule:** No dividers. 
*   **Style:** Use `surface_container_highest` for the card background. All cards use `radius-DEFAULT` (8px). 
*   **Layout:** Use asymmetrical padding (e.g., 24px top, 16px sides) to give an editorial, custom-built feel.

### Buttons (The "Chisel" Actions)
*   **Primary:** `primary_container` background with `on_primary_container` text. High contrast, high energy.
*   **Secondary:** `secondary_fixed` background. This mahogany-tinted button feels premium and "heavy."
*   **Tertiary:** No background. Use `title-sm` typography in `secondary` color.

### Input Fields
*   **Style:** Use a filled style using `surface_container_low`. 
*   **Focus State:** Instead of a blue ring, use a 2px bottom-border of `primary` (#7A5900). It mimics a pencil mark on a piece of lumber.

### Signature Component: The "Grain" Progress Bar
*   For proposal stages (Draft > Sent > Signed), use a thick (8px) bar using `secondary_container` as the track and a `primary` gradient for the progress.

### Tabs (Catálogo da Madeireira)
*   Usado na página `Produtos & Preços` para separar **Espécies | Madeiras m³ | Outros Produtos | Acabamentos | Importar Planilha**.
*   `TabsTrigger` ativo: `bg-surface-container-highest` + `text-primary` + `tracking-tight font-medium`. Inativo: `text-on-surface-variant`.
*   Sem sublinhado 1px — indicador é `bg-primary-container` sob o label (bloco tonal).
*   Container externo com `bg-surface-container-low`, 16px de padding vertical entre Tabs e conteúdo.

### Dialog / Modal
*   Backdrop `bg-secondary/20 backdrop-blur-sm` (névoa quente, não preto puro).
*   Conteúdo `bg-surface-container-highest`, `rounded-lg` (16px), `p-6 md:p-8`, sombra tintada com `secondary` a 6% opacidade.
*   Título em `headline-sm` com `tracking-tight`; descrição em `body-md text-on-surface-variant`.
*   Ações no rodapé alinhadas à direita; Cancelar é tertiary, Confirmar é primary.

### Preview ao vivo (forms de catálogo)
*   Exemplo: no form de Espécie, ao digitar custo + margem, exibir bloco em `bg-primary/10` com "Venda: R$ 4.200,00/m³" em `display-sm tracking-tighter text-primary`.
*   No form de Madeira m³, tabela lateral com cada comprimento cadastrado → valor calculado formatado em BRL. Linha usa `surface_container_low` alternado com `surface`.

### Empty States (editoriais)
*   Ícone Lucide grande (48px) em `text-secondary/40`.
*   Título `headline-sm` + body curta. CTA primary abaixo.
*   Uso: "Cadastre ao menos uma espécie primeiro" no form de Madeira m³ sem espécies.

### Badges de origem no Orçamento
*   Para cada item do step de materiais, chip tonal à direita: `Madeira m³ · Cambará 5×15×2,40m`.
*   Usa `bg-secondary/10 text-secondary` + `uppercase tracking-widest text-[10px]`.
*   Acabamento aplicado vira um segundo chip: `Acabamento: Lixamento (+10%)` em `bg-primary/10 text-primary`.

---

## 6. Do’s and Don’ts

### Do:
*   **DO** use `surface` shifts to group related items (e.g., a "Client Info" block).
*   **DO** embrace white space. A premium proposal needs room to breathe.
*   **DO** use `display-sm` for the "Total Price"—make the number the hero of the page.

### Don't:
*   **DON'T** use pure black (#000000). Use `on_surface` (#1D1B19) to keep the warmth of the mahogany palette.
*   **DON'T** use 1px dividers between list items. Use 8px of `surface_container_low` as a spacer or simply rely on typography and vertical rhythm.
*   **DON'T** use standard 4px rounding. Stick to the **8px (DEFAULT)** or **16px (lg)** to maintain a "sturdy" architectural feel.
*   **DON'T** editar componentes gerados por `shadcn add` (em `src/components/ui/`). Aplicar customizações Timber Grain via `className` no consumo.

---

## 7. Mockups de referência por tela
Ver `references/design-atualizado/`. Implementações que toquem UI devem conferir o mockup da tela correspondente antes de criar variantes novas.

---
*End of Document*