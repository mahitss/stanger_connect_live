# 3. UI/UX & Design System Specifications

## 3.1 Design Language & Tokens ("Quiet Study Sanctuary")

- **Design Philosophy**: Atmospheric Minimalism & High-Craft Dark/Light UI inspired by kinfolk editorial layouts and tactile study spaces. Warm obsidian surfaces, crisp 1px architectural hairlines (`border-zinc-800/80`), zero neon slop, and tabular monospace telemetry.
- **Color System Tokens**:
  - **Primary Canvas (Dark)**: `#0C0C0E` (Warm Obsidian Charcoal)
  - **Elevated Surface (Dark)**: `#121215` / `#18181C` (Smoked Graphite Card)
  - **Primary Canvas (Light)**: `#F7F4EB` (Warm Alabaster Paper)
  - **Primary Ink**: `#F4F2ED` (Warm Linen White in Dark) / `#1C1B18` (Deep Espresso in Light)
  - **Secondary Muted Ink**: `#9E9B93` (Warm Pewter Stone)
  - **Semantic Accents**:
    - Botanical Sage (Focus / Success / Spotlight): `#5B8C6B` (`emerald-400` / `emerald-500`)
    - Candlelight Amber (Streak / Milestone / Warning): `#C89D54` (`amber-400`)
    - Terracotta Rose (Error / Destructive / Guard Alert): `#B85D53` (`rose-400`)
- **Typography Scale**:
  - `--font-display`: `'Cormorant Garamond', Georgia, serif` (Editorial headings)
  - `--font-sans`: `'Syne', -apple-system, BlinkMacSystemFont, sans-serif` (UI controls & body)
  - `--font-mono`: `'JetBrains Mono', monospace` with `font-variant-numeric: tabular-nums` (Timers, room codes, latency metrics, correlation IDs)
- **Spacing & Grid System**:
  - 4px base spatial unit (`0.25rem` increments: `gap-1.5` = 6px, `gap-3` = 12px, `p-4` = 16px, `p-6` = 24px).
  - Desktop workspace layout: `224px` (`w-56`) fixed left navigation rail + flexible main sanctuary viewport (`max-w-7xl`) with 12-column responsive CSS Grid.

---

## 3.2 Screen & 9-State Specifications

Every interactive module and card implements all 9 deterministic UI states:

| State | Visual & Behavioral Contract |
| :--- | :--- |
| **1. `default`** | Crisp `1px solid` border (`border-zinc-800/80`), high-contrast primary ink (`#F4F2ED`), calm resting elevation. |
| **2. `loading`** | Deterministic skeleton shimmer rows (`buildWorkspaceSkeletonLoaderSpec`) and disabled action button with `aria-busy="true"`. |
| **3. `empty`** | Actionable zero-state card explaining why the list is empty (e.g., *"No pending requests"*) with a direct 1-click CTA. |
| **4. `error`** | Terracotta/rose banner (`bg-rose-950/40 border-rose-800/70 text-rose-300`) with human-readable cause and retry button. |
| **5. `success`** | Botanical sage confirmation badge (`bg-emerald-950/30 border-emerald-500/40 text-emerald-300`) + optional WebAudio chime. |
| **6. `disabled`** | Reduced opacity (`disabled:opacity-45`), `cursor-not-allowed`, and explicit `disabled` attribute preventing duplicate submissions. |
| **7. `hover`** | Subtle surface shift (`hover:bg-zinc-900` / `hover:border-zinc-600`) within 150ms transition window. |
| **8. `focus`** | Accessible keyboard focus ring (`focus:outline-none focus:border-zinc-500 focus-visible:ring-2 focus-visible:ring-[#5B8C6B]/70`). |
| **9. `responsive`** | Collapsible mobile drawer navigation (`< 768px`), single-column stacked cards on mobile, and side-by-side non-overlapping popovers on desktop (`>= 1024px`). |

---

## 3.3 Interaction Design Patterns

- **Skeleton Loading**: Structured placeholder blocks preserve exact card height prior to hydration to eliminate Cumulative Layout Shift (CLS = 0).
- **Optimistic Updates**: Post likes (`toggleUniquePostLike`), mood selection, and Pomodoro quick-starts update UI state immediately (< 16ms) and reconcile asynchronously with WebSocket / REST responses.
- **Toast & Status Notifications**: Non-blocking inline status pills (`role="status"`, `aria-live="polite"`) replace intrusive browser alerts (`window.alert` is strictly forbidden).
- **Modal & Popover Positioning**: Header popovers (`#workspace-header-qr-popover`) and the 4-step tutorial overlay (`#workspace-header-qr-tutorial-overlay`) automatically coordinate horizontal coordinates (`right-6` vs. `left-[16.25rem]`) so both remain 100% visible without overlapping.
