---
name: feature
description: Scaffold a new feature module with the full directory structure — hooks, actions, queries, types, and boilerplate files.
user-invocable: true
---

# Create Feature Module

Scaffold a new feature module following the project's feature-based architecture.

## Usage

`/feature [featureName]` — e.g., `/feature notifications` or `/feature analytics`

Parse `$ARGUMENTS` to extract the feature name (camelCase or kebab-case).

## Critical: Verify Against Live Docs

Before writing Supabase queries or server actions, verify current patterns at:

- https://supabase.com/docs/guides/auth/server-side/nextjs — Supabase SSR client setup
- https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations — Server Actions API

## Structure Created

```
src/features/{feature-name}/
├── hooks/
│   └── .gitkeep
├── actions/
│   └── .gitkeep
├── queries/
│   └── .gitkeep
├── types.ts
└── utils.ts (only if needed)
```

## File Templates

### `types.ts`

```typescript
// Types for the {featureName} feature
// Import database types from @/types/database if needed

export interface {FeatureName}Config {
  // Feature configuration
}
```

### Query Template (when specific queries are known)

```typescript
// src/features/{feature-name}/queries/get-{entity}.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export async function get{Entity}(
  supabase: SupabaseClient<Database>,
  // params
) {
  const { data, error } = await supabase
    .from('{table}')
    .select('*');

  if (error) throw error;
  return data;
}
```

### Server Action Template (when specific actions are known)

```typescript
// src/features/{feature-name}/actions/{action-name}.ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  // validation schema
});

export async function {actionName}(formData: FormData) {
  const validated = schema.parse(Object.fromEntries(formData));
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // implementation
}
```

### Hook Template (when specific hooks are known)

```typescript
// src/features/{feature-name}/hooks/use-{hook-name}.ts
'use client';

import { useState, useCallback } from 'react';

export function use{HookName}() {
  // implementation
}
```

## Checklist

1. **Database**: Does this feature need new tables? If yes, remind user to create a migration via `/migration`
2. **RLS**: Does the new table need RLS policies?
3. **Components**: Does this feature need UI components? If yes, remind user to create them via `/component`
4. **Routes**: Does this feature need new pages? If yes, remind user to create them via `/page`
5. **i18n**: Add a new namespace in `messages/en.json` for this feature
6. **Security**: What auth/validation does this feature need?

## Output

After creating the module, report:

1. Directory structure created
2. Files created with descriptions
3. Reminders for related tasks (migrations, components, pages, i18n keys)
