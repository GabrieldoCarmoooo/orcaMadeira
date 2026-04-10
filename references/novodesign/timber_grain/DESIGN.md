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

---
*End of Document*