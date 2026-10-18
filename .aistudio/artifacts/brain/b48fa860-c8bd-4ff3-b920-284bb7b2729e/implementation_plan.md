# Captions Text Inspector & Multi-Stop Gradient Studio Plan

Redesign the **Captions → Text** inspector panel to match the reference studio workflow, featuring collapsible typography, format, position, color, emphasis, spacing, and effects sections, an interactive multi-stop gradient editor (up to 5 stops, custom angle, and Word/Char level) in both the **Color** and **Emphasis** sections, reordered sub-tabs with **Text** first, and a sticky bottom **Export** footer.

## User Review & Critical Decisions

> [!IMPORTANT]
> All three product decisions have been confirmed from your answers and incorporated into this plan:

- **Confirmed Decision 1 (Multi-Stop Gradient Scope)**: The interactive multi-stop gradient bar, Angle (`0°–360°`) slider/input, and `Word | Char` level selector will be available in **both** the main **COLOR** section (for base caption text) and the **EMPHASIS** section (for emphasized/hero words).
- **Confirmed Decision 2 (Interactive Gradient Stops Bar)**: Users can customize **up to 5 color stops** along the horizontal gradient bar—clicking the gradient track adds a new stop (up to 5), clicking any stop pointer (`▲`) opens its color picker and hex editor, dragging a pointer adjusts its percentage position (`0%–100%`), and a `Reset` button restores the default metallic/gold or preset stops.
- **Confirmed Decision 3 (Sub-Tab Order & Sticky Export Footer)**: The **Captions** sub-tabs will place **Text** first (`Text | Templates | Transitions [New] | AI Audio | ...`), and the right inspector will include a sticky bottom bar with the emerald **Export** CTA button matching your screenshots.

---

## 1. Overview & Core Concept

- **What It Does**: Provides a unified, collapsible **Text** inspector inside the **Captions** panel where creators can control every typographic, positional, color, gradient, emphasis, spacing, and visual effect parameter with single-click per-field reset buttons (`↺`) and live 60fps canvas feedback.
- **Target Audience / Persona**: Short-form video creators and editors styling multi-language captions who need fine-grained control over base text and emphasized words without switching across multiple disjointed tabs.
- **Key Value**: Consolidates all text styling into a clean vertical flow (`FONTS` → `FORMAT` → `POSITION` → `COLOR` → `EMPHASIS` → `SPACING` → `EFFECTS`) with true multi-stop linear gradients (`Angle`, `Stops`, `Word` vs `Char` level) rendered on the live video canvas and burned-in exports.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Sub-Tab Navigation**: Opening the **Captions** panel defaults to or allows instant access to **Text** as the first sub-tab (`Text`, `Templates`, `Transitions` with `New` badge, `AI Audio`, plus `Position`, `Colors`, `Mask`, `B-Roll`, `Export`).
  2. **1. FONTS Section (Collapsible)**:
     - **Font Family**: Dropdown selector (including *Instrument Sans* and 220+ Indian & English Google Fonts + custom fonts), up/down stepper (`⌃⌄`) to cycle through fonts, and a reset button (`↺`).
     - **Font Face**: Weight/style dropdown (`Regular`, `Medium`, `SemiBold`, `Bold`, `ExtraBold`, `Black`, `Italic`), up/down stepper (`⌃⌄`), and reset button (`↺`).
     - **Font Size**: Range slider paired with a gold-bordered numeric input box (`px`) and reset button (`↺`).
     - **EMPHASIS Sub-Group inside FONTS**: Quick **Font Family** and **Font Face** selectors with `⌃⌄` steppers and `↺` reset buttons synchronized with the Emphasis section.
  3. **2. FORMAT Section (Collapsible)**:
     - **Styles**: Segmented 4-button bar (`Tt` Title Case, `T` Uppercase, `t` Lowercase, `U̲` Underline).
     - **Text Alignment**: Segmented 3-button bar (`Left`, `Center`, `Right`).
  4. **3. POSITION Section (Collapsible)**:
     - Side-by-side **`X`** (`50.0 %`) and **`Y`** (`70.0 %`) gold-bordered decimal/numeric inputs with individual `↺` reset buttons (plus expandable quick placement grid).
  5. **4. COLOR Section (Collapsible — Base Text)**:
     - Segmented toggle: **`💧 Solid`** | **`🎨 Gradient`**.
     - **Solid Mode**: `Color` row with color swatch, `#HEX` input (`#FFFFFF`), and `↺` reset button.
     - **Gradient Mode**: Interactive **Stops** bar (up to 5 draggable/clickable color stop handles + `↺ Reset`), **Angle** slider + gold-bordered numeric input (`90`) + `↺`, and **Level** segmented toggle (`ab Word` | `Aa Char`).
  6. **5. EMPHASIS Section (Collapsible — Hero / Highlighted Words)**:
     - Mode segmented bar: **`Emphasize`** | **`Spotlight`**.
     - Fill segmented bar: **`💧 Solid`** | **`🎨 Gradient`**.
     - **Gradient Mode**: Interactive **Stops** bar (up to 5 stops with gold/metallic default preview + `↺ Reset`), **Angle** slider + numeric input (`90`) + `↺`, and **Level** toggle (`ab Word` | `Aa Char`).
     - **Solid Mode**: `Color` swatch + `#HEX` input + `↺`.
     - **Size**: Slider + gold-bordered multiplier input (`1.5`) + `↺`.
     - **Glow**: Color swatch + `#FFFFFF` hex input + `↺`.
     - **Font** & **Font Face**: Dropdowns with `⌃⌄` cycle steppers and `↺` reset buttons.
     - **Styles**: Segmented bar (`Tt`, `T`, `t`, `U̲`) for emphasized words.
  7. **6. SPACING Section (Collapsible)**:
     - **Letter Spacing**: Slider + gold-bordered numeric input (`0`) + `↺`.
     - **Line Spacing**: Slider + gold-bordered numeric input (`1.0`) + `↺`.
  8. **7. EFFECTS Section (Collapsible)**:
     - Clean row list with pill toggle switches for **Drop Shadow**, **Glow**, **3D Depth**, **Text Stroke**, **Arc**, and **Background** (toggling any effect ON reveals its fine-tuning controls directly underneath).
  9. **Sticky Bottom Export Bar**:
     - Pinned footer at the bottom of the right inspector with the green **`Export`** button that triggers the Export drawer.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Precision dark studio inspector (`#131315` surface, `#1C1C20` input wells) with crisp `1px` borders (`rgba(255,255,255,0.08)`), gold-highlighted numeric value boxes (`#EAB308` / `#CA8A04` focus/active border), and emerald (`#24B47E`) primary accents.
  - *Typography & Hierarchy*: Section headers in bold uppercase tracking (`11px`), control labels in muted slate (`#94A3B8`), and all numeric inputs in `font-mono tabular-nums`.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Unified Multi-Stop Gradient Data Model (`GradientStop[]`)**
  - *Chosen Approach*: Store structured `GradientStop` arrays (`{ id, color, position }` where `position` is `0` to `100`) on `CaptionStyleConfig` for both base text (`baseGradientStops`, `useBaseGradient`, `baseGradientAngle`, `baseGradientLevel`) and emphasis words (`gradientStops`, `useGradient`, `gradientAngle`, `gradientLevel`), while keeping `gradientStart`, `gradientMid`, `gradientEnd`, and `gradientFourth` automatically synchronized for backward compatibility with all 48 built-in templates.
  - *Why*: Ensures custom 2-to-5 stop gradients render accurately on the HTML5 2D canvas at any angle (`0°–360°`) while keeping existing templates working seamlessly.
- **Decision 2: Word-Level vs. Character-Level (`Word | Char`) Gradient Rendering**
  - *Chosen Approach*: When `Level` is set to `Word`, the linear gradient vector spans across the bounding box of the word/phrase at the chosen `Angle`. When `Level` is set to `Char`, the canvas renderer iterates character-by-character (preserving letter spacing) and computes a local linear gradient per character glyph box.
  - *Why*: Delivers a distinct visual difference between `ab Word` and `Aa Char` directly on the live video canvas and exported video.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        StyleAnimationInspector                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Top Mode Bar: [ Captions ]  [ Edit ]                     [Minimize >]│  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ Sub-Tabs: [ Text ] [ Templates ] [ Transitions (New) ] [ AI Audio ]  │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ KalakarTextAndEffectsTab (Scrollable Accordion Inspector)            │  │
│  │  ├─ 1. FONTS (Family + Face + Size px + EMPHASIS Family/Face)        │  │
│  │  ├─ 2. FORMAT (Styles [Tt|T|t|U] + Text Alignment [L|C|R])           │  │
│  │  ├─ 3. POSITION (X % + Reset | Y % + Reset)                          │  │
│  │  ├─ 4. COLOR (Solid | Gradient -> MultiStopGradientEditor)           │  │
│  │  ├─ 5. EMPHASIS (Emphasize|Spotlight, Solid|Gradient, Stops, Angle,  │  │
│  │  │               Level [Word|Char], Size, Glow, Font, Face, Styles)  │  │
│  │  ├─ 6. SPACING (Letter Spacing + Line Spacing)                       │  │
│  │  └─ 7. EFFECTS (Drop Shadow, Glow, 3D Depth, Text Stroke, Arc, Bg)   │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ Sticky Bottom Footer:                                     [ Export ] │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────┬────────────────────────────────────┘
                                        │ onUpdateStyle(Partial<CaptionStyleConfig>)
                                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                   canvasCaptionRenderer (60fps + Export)                   │
│  • Builds angled linear gradient from GradientStop[] (2..5 stops, 0-360°)  │
│  • Applies gradient at Word level or per-Character glyph level             │
│  • Applies Emphasis Size, Glow, Font, Face, Transform, and 6 Effects       │
└────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State Additions (`CaptionStyleConfig`)

- `GradientStop`: `{ id: string; color: string; position: number }` (`position` in `0..100`).
- **Base Text Color & Gradient Fields**:
  - `useBaseGradient?: boolean` (`false` = Solid, `true` = Gradient)
  - `baseGradientStops?: GradientStop[]` (default 4-stop metallic/gold or preset gradient stops)
  - `baseGradientAngle?: number` (default `90`)
  - `baseGradientLevel?: 'word' | 'char'` (default `'word'`)
- **Emphasis Gradient & Typography Fields**:
  - `gradientStops?: GradientStop[]` (up to 5 stops; default 4-stop gold gradient `['#9A6515', '#DFB249', '#FFF6C3', '#8C5811']` matching Screenshot 5)
  - `gradientAngle?: number` (default `90`)
  - `gradientLevel?: 'word' | 'char'` (default `'word'`)
  - `emphasisFontFace?: string` (default `'Regular'`)
  - `emphasisGlowColor?: string` (default `'#FFFFFF'`)
  - `emphasisTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'`
  - `emphasisUnderline?: boolean`

### Interactive Component & State Mapping

- **`MultiStopGradientControl` Reusable Component**:
  - Renders the `Stops` header + `↺ Reset` button.
  - Renders the CSS `linear-gradient(90deg, ...)` preview bar with interactive `▲` stop handles positioned at `left: ${stop.position}%`.
  - Clicking empty space on the gradient bar inserts a new stop (up to 5 stops) with interpolated color; dragging a handle updates `stop.position` in real time; clicking a handle selects it and opens its color picker; double-clicking or clicking a remove button (when `stops.length > 2`) deletes a stop.
  - Renders the `Angle` slider (`0` to `360`) + gold-bordered numeric input + `↺` reset to `90`.
  - Renders the `Level` segmented toggle (`ab Word` | `Aa Char`).
- **Canvas Renderer Updates**:
  - Updates `addMultiStopColors`, `createSidzVerticalGradient`, `createAnimatedWordGradient`, and base text fill helpers to read `gradientStops` / `baseGradientStops`, compute the exact angled gradient vector from `gradientAngle` / `baseGradientAngle`, and support both `word` and `char` gradient levels across all caption templates.
