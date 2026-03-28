---
name: a11y-check
description: Perform a focused accessibility audit on a specific component, page, or feature against WCAG 2.1 AA standards.
user-invocable: true
---

# Accessibility Check

Perform a focused WCAG 2.1 AA accessibility audit on a specific area of the codebase.

## Usage

`/a11y-check [target]` — e.g., `/a11y-check coaches/coach-card` or `/a11y-check admin layout` or `/a11y-check all forms`

If `$ARGUMENTS` is empty, audit the entire codebase.

## Audit Categories

### 1. Perceivable

- [ ] **Text alternatives**: All `<img>`, `<Image>`, `<svg>` have meaningful `alt` text or `aria-label`
- [ ] **Video/audio**: Captions and transcripts provided (if applicable)
- [ ] **Color alone**: Information not conveyed by color alone — icons, text, or patterns supplement
- [ ] **Contrast**: Text meets 4.5:1 (normal) or 3:1 (large/bold) against background
- [ ] **Resize**: Content readable at 200% zoom without horizontal scroll
- [ ] **Text spacing**: No loss of content when text spacing is increased

### 2. Operable

- [ ] **Keyboard access**: All interactive elements reachable via Tab, operable via Enter/Space
- [ ] **No keyboard trap**: Focus can always escape any component (especially modals, drawers)
- [ ] **Focus visible**: Focused elements have a visible focus indicator (HeroUI handles this)
- [ ] **Focus order**: Tab order follows logical reading order (DOM order matches visual order)
- [ ] **Skip link**: Skip-to-content link as first focusable element on every page
- [ ] **Page title**: Every page has a unique, descriptive `<title>` via metadata
- [ ] **Link purpose**: Link text is descriptive (no "click here" or "read more" without context)
- [ ] **Motion**: Animations respect `prefers-reduced-motion`. No auto-playing content.

### 3. Understandable

- [ ] **Language**: `<html lang="en">` set correctly
- [ ] **Labels**: Every form input has a visible `<label>` or `aria-label`
- [ ] **Error identification**: Errors described in text, associated with fields via `aria-describedby`
- [ ] **Error prevention**: Confirmation for destructive actions (delete, payment)
- [ ] **Consistent navigation**: Same navigation pattern across all pages
- [ ] **Consistent identification**: Same UI elements behave the same way everywhere

### 4. Robust

- [ ] **Valid HTML**: No duplicate IDs, proper nesting, semantic elements
- [ ] **ARIA usage**: Correct roles, states, and properties. Don't override native semantics.
- [ ] **HeroUI components**: Used for interactive elements (built-in React Aria support)
- [ ] **Dynamic content**: `aria-live` regions for content that updates (errors, toasts, search results count)
- [ ] **Name, Role, Value**: All custom components expose name/role/value to assistive technology

### 5. RTL Readiness (for future i18n)

- [ ] **Logical CSS**: `ms-`/`me-`/`ps-`/`pe-` instead of `ml-`/`mr-`/`pl-`/`pr-`
- [ ] **Logical alignment**: `text-start`/`text-end` instead of `text-left`/`text-right`
- [ ] **Logical layout**: `start`/`end` instead of `left`/`right` in flex/grid
- [ ] **Icons**: Directional icons (arrows) should flip in RTL context

## Severity Levels

- **Critical**: Blocks access for assistive technology users (missing alt, keyboard trap, no focus management)
- **Major**: Significant barrier (poor contrast, missing labels, broken heading hierarchy)
- **Minor**: Usability issue (missing aria-live, suboptimal focus order)

## Output Format

```
## A11y Audit: [target]

### Critical Issues
1. [file:line] — [description] — [WCAG criterion]
   Fix: [specific fix]

### Major Issues
1. [file:line] — [description] — [WCAG criterion]
   Fix: [specific fix]

### Minor Issues
1. [file:line] — [description] — [WCAG criterion]
   Fix: [specific fix]

### Passes
- [what's already correct]

### Summary
- Critical: X | Major: X | Minor: X | Passes: X
```
