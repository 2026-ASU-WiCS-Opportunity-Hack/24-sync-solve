---
name: component
description: Scaffold a new React component following project conventions — Server/Client, HeroUI, accessible, i18n-ready, with proper types and tests.
user-invocable: true
---

# Create Component

Scaffold a new component following project conventions.

## Usage

`/component [directory/ComponentName]` — e.g., `/component coaches/CoachCard` or `/component layout/MobileNav`

Parse `$ARGUMENTS` to extract:

- **directory**: Where in `src/components/` to place it (ui, layout, editor, coaches, chapters, payments, common)
- **component name**: PascalCase name

If no directory specified, ask the user which directory it belongs in.

## Rules

### File Naming

- File: `src/components/{directory}/{kebab-case-name}.tsx`
- Example: `/component coaches/CoachCard` → `src/components/coaches/coach-card.tsx`

### Component Template

**Server Component** (default):

```tsx
import { getTranslations } from 'next-intl/server';

interface CoachCardProps {
  // typed props
}

export async function CoachCard({ ...props }: CoachCardProps) {
  const t = await getTranslations('coaches');

  return (
    // JSX using HeroUI components, Tailwind classes
    // Logical CSS properties (ms-, me-, ps-, pe-) not physical (ml-, mr-)
    // All images with alt text
    // Semantic HTML (article, section, nav, etc.)
  );
}
```

**Client Component** (only if interactivity needed):

```tsx
'use client';

import { useTranslations } from 'next-intl';

interface SearchBarProps {
  // typed props
}

export function SearchBar({ ...props }: SearchBarProps) {
  const t = useTranslations('coaches');

  return (
    // JSX
  );
}
```

### Critical: Verify Before Creating

**Always check the latest HeroUI v3 component API** at https://heroui.com/docs/react/components before using any HeroUI component. APIs change between versions.

### Checklist Before Creating

1. **Server or Client?** — Does it need hooks, event handlers, or browser APIs? If no → Server Component
2. **HeroUI components** — Use HeroUI for buttons, inputs, cards, modals, etc. Don't reinvent. Check latest API docs.
3. **Accessibility** — aria labels, keyboard handling, focus management, semantic HTML. HeroUI's React Aria provides this baseline but verify edge cases.
4. **i18n** — All visible strings via `useTranslations()` (client) or `getTranslations()` (server, must await)
5. **Logical CSS** — `ms-4` not `ml-4`, `text-start` not `text-left`, `ps-4` not `pl-4` (RTL-ready)
6. **Props interface** — Named `{ComponentName}Props`, above the component
7. **No default export** — Use named export (except Next.js pages/layouts)
8. **No framer-motion** — HeroUI v3 uses native CSS transitions. Do NOT import framer-motion.

### Test File

Create a colocated test: `src/components/{directory}/{kebab-case-name}.test.tsx`

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CoachCard } from './coach-card'

describe('CoachCard', () => {
  it('renders coach name and certification level', () => {
    // test
  })
})
```

### Translation Keys

Add any new strings to `messages/en.json` under the appropriate namespace.

## Output

After creating the component, report:

1. Files created
2. Translation keys added
3. Reminder: check accessibility with keyboard navigation
