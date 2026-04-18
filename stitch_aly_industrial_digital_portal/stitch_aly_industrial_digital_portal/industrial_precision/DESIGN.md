# Design System Strategy: Industrial Precision

## 1. Overview & Creative North Star
The North Star for this design system is **"The Digital Forge."** 

In the world of heavy industrial tool distribution, "professional" often translates to "cluttered." This system rejects that. We are moving away from the "catalog" aesthetic toward a **High-End Editorial** experience. The goal is to make industrial procurement feel like navigating a high-performance engineering dashboard.

We achieve this through:
*   **Massive Typographic Scale:** Using Inter Black to anchor the page like a steel beam.
*   **Intentional Asymmetry:** Breaking the traditional 12-column grid with overlapping glass elements and offset text blocks.
*   **Atmospheric Depth:** Moving away from flat panels toward a layered, semi-transparent environment that feels "machined" and precise.

---

## 2. Colors: The High-Contrast Blueprint
Our palette balances the weight of heavy industry with the vibrancy of modern technology.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off content. Boundaries must be defined solely through:
1.  **Background Shifts:** e.g., A `surface-container-low` card sitting on a `surface` background.
2.  **Tonal Transitions:** Using the hierarchy of `surface-container` tokens to define spatial priority.

### Surface Hierarchy & Nesting
Treat the interface as a physical assembly of plates.
*   **Base:** `surface` (#f7f9fb) for the main canvas.
*   **Low Priority:** `surface-container-low` (#f2f4f6) for secondary sidebars.
*   **High Priority:** `surface-container-highest` (#e0e3e5) for active workspace areas.
*   **Nesting:** A `surface-container-lowest` (pure white) card should only sit on a `surface-container-low` or `surface-container-high` background to create a "lifted" effect without artificial borders.

### The "Glass & Gradient" Rule
To bridge the gap between "Heavy-Duty" and "Advanced Tech," use **Glassmorphism** for floating UI elements (modals, dropdowns, sticky headers). 
*   **Implementation:** Use `surface_container_lowest` with 70-80% opacity and a `backdrop-filter: blur(12px)`.
*   **Signature Textures:** For primary CTAs or high-impact hero sections, apply a subtle linear gradient from `primary` (#000919) to `primary_container` (#0f2137) at a 135-degree angle. This adds "soul" and depth to otherwise flat industrial surfaces.

---

## 3. Typography: The Weight of Authority
We utilize the **Inter** family to communicate both brute strength and technical precision.

*   **Display & Headlines (Inter Black):** These are your "Structural Beams." Use them in all-caps or tight-kerning configurations for a bold, authoritative industrial feel.
*   **Body & Titles (Inter Regular/Medium):** These provide the "Technical Specs." They must be surrounded by wide whitespace to ensure legibility against the heavy display type.
*   **Label SM/MD:** Use these for technical metadata (SKUs, dimensions, torque ratings). These should often be paired with `secondary` (#9d4300) to draw the eye to critical data points.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "soft" for an industrial platform. We use **Tonal Layering** to create hierarchy.

*   **The Layering Principle:** Depth is achieved by stacking. A `surface-container-lowest` card placed on a `surface-container-high` section creates a natural, crisp lift that feels like a precision-cut component.
*   **Ambient Shadows:** When an element must "float" (e.g., a tool preview modal), use a highly diffused shadow: `box-shadow: 0 20px 40px rgba(15, 33, 55, 0.08)`. Note the use of a Navy tint (`primary`) rather than black to maintain a premium, atmospheric look.
*   **The "Ghost Border" Fallback:** If a container requires further definition for accessibility, use the `outline-variant` token at **15% opacity**. This creates a "Ghost Border" that suggests an edge without creating a hard visual stop.

---

## 5. Components: Precision Machined Elements

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`), `on_primary` text, `DEFAULT` (0.25rem) radius for a "chiseled" look.
*   **Secondary (Action):** `secondary_container` (#fd761a) with `on_secondary_container` text. Reserved exclusively for "Purchase," "Confirm," or "Add to Quote."
*   **Tertiary:** Ghost style. No background, `on_surface` text, becomes `surface_container_low` on hover.

### Cards & Lists
*   **No Dividers:** Absolutely no horizontal rules. Separate list items using `body-md` spacing (vertical whitespace) or by alternating background tones between `surface` and `surface-container-low`.
*   **Glass Cards:** For featured products, use a `surface_container_lowest` background at 80% opacity with a subtle `outline_variant` ghost border.

### Input Fields
*   **Style:** Minimalist. Bottom-only "Ghost Border" (`outline-variant` at 20%). On focus, the border transitions to `secondary` (#f97316) with a subtle 2px glow.
*   **Labels:** Always use `label-md` in `on_surface_variant` for a technical, high-performance feel.

### Additional Industrial Components
*   **Status Beacons:** Small, glowing pips for "In Stock" or "System Calibration." Use `secondary` for high-alert/active and `outline` for inactive.
*   **Technical Spec Grid:** A custom component using `surface-container-high` with `Inter Black` for values and `Inter Regular` for units (e.g., **450** Nm).

---

## 6. Do's and Don'ts

### Do
*   **Do** use extreme whitespace. If a section feels "full," double the padding.
*   **Do** overlap elements. Let a glass card partially cover a large background headline to create 3D depth.
*   **Do** use subtle line-art icons (0.75px to 1px stroke weight) to maintain the "advanced tech" aesthetic.

### Don't
*   **Don't** use 100% opaque black. Always use `primary` (#000919) for the deepest tones.
*   **Don't** use rounded corners larger than `md` (0.375rem). We want the system to feel "machined" and "sturdy," not "bubbly."
*   **Don't** use standard "Grey" for shadows. Use tinted Navy to keep the UI from feeling "muddy."

---
*Director's Final Note: This design system is about the tension between the weight of the primary navy and the 'air' provided by the snow-white surfaces. Keep it lean, keep it heavy, and let the typography do the heavy lifting.*