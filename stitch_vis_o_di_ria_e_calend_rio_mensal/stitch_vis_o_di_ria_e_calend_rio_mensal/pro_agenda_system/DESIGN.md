---
name: Pro Agenda System
colors:
  surface: '#faf9fe'
  surface-dim: '#dad9df'
  surface-bright: '#faf9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f8'
  surface-container: '#eeedf3'
  surface-container-high: '#e9e7ed'
  surface-container-highest: '#e3e2e7'
  on-surface: '#1a1b1f'
  on-surface-variant: '#424753'
  inverse-surface: '#2f3034'
  inverse-on-surface: '#f1f0f5'
  outline: '#737784'
  outline-variant: '#c2c6d5'
  surface-tint: '#0459c5'
  primary: '#0459c5'
  on-primary: '#ffffff'
  primary-container: '#5891ff'
  on-primary-container: '#002a65'
  inverse-primary: '#afc6ff'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#5d5e63'
  on-tertiary: '#ffffff'
  tertiary-container: '#939499'
  on-tertiary-container: '#2b2d31'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#afc6ff'
  on-primary-fixed: '#001a43'
  on-primary-fixed-variant: '#004398'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e2e2e7'
  tertiary-fixed-dim: '#c6c6cb'
  on-tertiary-fixed: '#1a1c1f'
  on-tertiary-fixed-variant: '#45474b'
  background: '#faf9fe'
  on-background: '#1a1b1f'
  surface-variant: '#e3e2e7'
typography:
  display-xl:
    fontFamily: Hanken Grotesk
    fontSize: 96px
    fontWeight: '700'
    lineHeight: 100px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 16px
  margin-tablet: 32px
  time-column-width: 80px
  sidebar-width: 320px
---

## Brand & Style

This design system is built for high-performance productivity on tablet devices. The aesthetic is rooted in **Modern Minimalism**, prioritizing information density without sacrificing clarity. It draws inspiration from premium Swiss typography and traditional architectural drafting tools, translated into a digital-first interface.

The brand personality is **Precise, Decisive, and Architectural**. It targets professionals who require a distraction-free environment for deep work and scheduling. The emotional response should be one of "calm control"—moving away from the cluttered anxiety of traditional calendar apps toward the structured elegance of a high-end physical planner.

Visual pillars include:
- **Spatial Order:** Using a strict grid to define relationships between time and tasks.
- **Intentional Contrast:** Using a single "Action Blue" to draw the eye to priorities amidst a monochromatic landscape.
- **Utility First:** Icons and borders exist only to serve function, using hair-line weights to maintain a lightweight feel.

## Colors

The palette is anchored by a stark **High-Contrast Neutral** base to maximize legibility. 

- **Action Blue:** Used exclusively for interactive states, current date highlights, and primary CTAs. This is the "voice" of the interface.
- **Charcoal/Black:** Reserved for primary information (dates, event titles) to ensure immediate visual hierarchy.
- **Subtle Grey:** Utilized for secondary metadata, such as time-slot labels and inactive grid lines, preventing the interface from feeling visually "heavy."
- **Paper White:** The canvas is pure white, simulating a premium high-gsm paper texture without digital noise.

## Typography

The typography system uses a dual-font approach to balance impact with utility.

- **Hanken Grotesk** serves as the display face. Its geometric precision and tight tracking provide the "architectural" feel required for large date displays and headers.
- **Inter** provides maximum legibility for body text, notes, and task descriptions, ensuring clarity even at smaller sizes on tablet screens.
- **JetBrains Mono** is used sparingly for time-stamps and metadata, reinforcing the system's "tool-like" and technical nature.

Hierarchy is established through weight rather than just size; bold strokes are used for current time/date contexts, while lighter weights are used for the future or past.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model optimized for iPad (Landscape and Portrait).

1. **The Navigation Sidebar (320px):** A fixed-width container on the left for date-selection, month-view overviews, and high-level navigation.
2. **The Agenda Canvas (Fluid):** A flexible area that expands to fill the remaining screen space, divided by a vertical time-line.
3. **The 8px Grid:** Every element (padding, margins, icon sizes) is mapped to an 8px base unit to ensure perfect alignment.

Gutters between time slots are minimized to 1px (using the border color) to maintain a continuous vertical flow, while horizontal margins are generous (32px) to allow for "breathable" content.

## Elevation & Depth

This system avoids heavy shadows in favor of **Tonal Layering and Low-Contrast Outlines**.

- **Surface Levels:** The primary background is Level 0 (White). Pop-overs or modals use a slight Level 1 (F2F2F7) tint or a 1px border.
- **Hairline Borders:** Depth is communicated through 1px solid lines (#E5E5EA). This defines zones without adding visual mass.
- **Active State Elevation:** Only "Active" elements (like a selected time slot or the current day) receive a subtle, high-diffusion shadow (0px 4px 20px rgba(0,0,0,0.05)) to lift them slightly above the grid.

## Shapes

The design system utilizes **Soft Geometry**. 

While the overall layout feels rectangular and structured, UI elements (buttons, chips, active date highlights) use a `0.25rem` (4px) corner radius. This prevents the interface from feeling "sharp" or unfriendly, while maintaining the professional, technical aesthetic. Interactive "Pill" shapes are reserved exclusively for status indicators or floating action buttons.

## Components

### Buttons & Navigation
- **Primary Action:** Solid 'Action Blue' background with white text. 4px rounded corners.
- **Ghost Navigation:** No background, Charcoal icons/text. Use a subtle grey background on hover or tap.
- **Top Bar Tabs:** Underline-style indicators using the Action Blue for the active state (DIA, SEMANA, MÊS).

### Time Grid
- **Time Slots:** Defined by a top-border only. The time (e.g., 09:00) should be set in `label-mono` and right-aligned within the time-column.
- **Current Time Indicator:** A horizontal 1px line in Action Blue spanning the width of the agenda.

### Cards & Tasks
- **Event Blocks:** Solid light-blue tint (10% opacity of Action Blue) with a 2px left-border of solid Action Blue.
- **Checkboxes:** Simple 18px circles. When checked, they fill with Action Blue and display a white checkmark.

### Input Fields
- **Search/Quick Add:** Minimalist design with a bottom-border only. No background fill unless focused. Focus state adds a 1px Action Blue bottom-border.