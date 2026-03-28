---
name: block
description: Scaffold a new content block for the inline editing system — display component, editor component, Zod schema, and registry entry.
user-invocable: true
---

# Create Content Block

Scaffold a new content block type for the CMS / inline editing system.

## Usage

`/block [blockType]` — e.g., `/block testimonial` or `/block stats`

Parse `$ARGUMENTS` to extract the block type name (kebab-case).

## Critical: Verify Against Live Docs

Before using any HeroUI form components in the editor, check https://heroui.com/docs/react/components for the latest API. Before using Zod patterns, check https://zod.dev for current syntax.

## Context

Content blocks are the building units of chapter pages. Each block type has:

- A **Zod schema** defining the shape of its JSONB content
- A **display component** (Server Component, zero JS, renders published content)
- An **editor component** (Client Component, form-based, loaded only in edit mode)
- A **registry entry** in `src/features/content/blocks/registry.ts`

## Files Created

### 1. Schema: `src/features/content/blocks/{block-type}/schema.ts`

```typescript
import { z } from 'zod';

export const {blockType}Schema = z.object({
  // Define the shape of this block's JSONB content
  // Example for a testimonial block:
  // quote: z.string().min(1).max(1000),
  // author: z.string().min(1).max(200),
  // authorTitle: z.string().max(200).optional(),
  // authorPhoto: z.string().url().optional(),
  // rating: z.number().int().min(1).max(5).optional(),
});

export type {BlockType}Content = z.infer<typeof {blockType}Schema>;
```

### 2. Display Component: `src/features/content/blocks/{block-type}/{block-type}-display.tsx`

```tsx
import { getTranslations } from 'next-intl/server';
import type { {BlockType}Content } from './schema';

interface {BlockType}DisplayProps {
  content: {BlockType}Content;
}

export async function {BlockType}Display({ content }: {BlockType}DisplayProps) {
  const t = await getTranslations('blocks.{blockType}');

  return (
    <section aria-label={t('sectionLabel')}>
      {/* Render content using HeroUI components */}
      {/* Server Component — no 'use client', no hooks */}
      {/* All strings via translations */}
      {/* Images with alt text, lazy loaded */}
      {/* Semantic HTML, proper heading level (h2 or h3) */}
      {/* Logical CSS: ms-/me-/ps-/pe- not ml-/mr-/pl-/pr- */}
    </section>
  );
}
```

### 3. Editor Component: `src/features/content/blocks/{block-type}/{block-type}-editor.tsx`

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { {blockType}Schema, type {BlockType}Content } from './schema';

interface {BlockType}EditorProps {
  content: {BlockType}Content;
  onSave: (content: {BlockType}Content) => Promise<void>;
  onCancel: () => void;
}

export function {BlockType}Editor({ content, onSave, onCancel }: {BlockType}EditorProps) {
  const t = useTranslations('blocks.{blockType}');
  const [draft, setDraft] = useState(content);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = useCallback(async () => {
    const result = {blockType}Schema.safeParse(draft);
    if (!result.success) {
      // Map Zod errors to field-level errors
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await onSave(result.data);
  }, [draft, onSave]);

  return (
    <div role="form" aria-label={t('editorLabel')}>
      {/* Form fields for each property in the schema */}
      {/* Use HeroUI form components (TextField, TextArea, etc.) */}
      {/* Show validation errors with aria-live="polite" */}
      {/* Save and Cancel buttons */}
    </div>
  );
}
```

### 4. Registry Entry

Add to `src/features/content/blocks/registry.ts`:

```typescript
import { {BlockType}Display } from './{block-type}/{block-type}-display';
import { {BlockType}Editor } from './{block-type}/{block-type}-editor';
import { {blockType}Schema } from './{block-type}/schema';

// Add to blockRegistry:
{blockType}: {
  display: {BlockType}Display,
  editor: {BlockType}Editor,
  schema: {blockType}Schema,
  requiresApproval: false, // Set true for brand-sensitive blocks (hero, main about)
  label: '{Block Type}',
  icon: '{icon-name}',     // lucide-react icon name
},
```

## Checklist

1. **Schema**: All fields validated. Strings have length limits. URLs validated. Optional fields marked.
2. **Display**: Server Component. No client JS. Semantic HTML. Accessible. i18n strings.
3. **Editor**: Client Component. Zod validation on save. Error display with aria-live. Keyboard accessible.
4. **Registry**: Entry added with correct `requiresApproval` flag.
5. **i18n**: Translation keys added under `blocks.{blockType}` namespace.
6. **Approval**: Is this a brand-sensitive block? Set `requiresApproval: true` if so.

## Approval Tier Guide

- `requiresApproval: true` — Hero, main about text, core messaging, CTA blocks
- `requiresApproval: false` — Events, team grid, testimonials, stats, FAQ, contact, divider

## Output

After creating the block, report:

1. Files created
2. Registry entry added
3. Translation keys needed
4. Approval tier assigned and why
