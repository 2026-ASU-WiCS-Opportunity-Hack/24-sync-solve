---
name: page
description: Scaffold a new Next.js App Router page with proper layout, metadata, accessibility, i18n, and SSG/ISR configuration.
user-invocable: true
---

# Create Page

Scaffold a new Next.js App Router page following project conventions.

## Usage

`/page [route/path]` — e.g., `/page admin/analytics` or `/page [chapter]/testimonials`

Parse `$ARGUMENTS` to extract:

- **Route path**: Where in `src/app/` this page lives
- **Route group**: Determine if it belongs in (global)/, (auth)/, admin/, [chapter]/, or api/

## Determine Page Type

Ask or infer:

1. **Public or protected?** — Does it need auth? What role?
2. **Global or chapter-scoped?** — Is it under `[chapter]/` or `(global)/`?
3. **Static or dynamic?** — Can it be SSG, or does it need ISR/SSR?
4. **Does it need a layout?** — Shared layout with sibling routes?

## Critical: Verify Against Live Docs

Before scaffolding, check the latest patterns at:

- https://nextjs.org/docs/app — Next.js App Router API (params, metadata, middleware)
- https://next-intl.dev/docs/getting-started/app-router/without-i18n-routing — next-intl setup
- https://supabase.com/docs/guides/auth/server-side/nextjs — Supabase auth patterns

**Next.js 15 breaking change**: `params` and `searchParams` are `Promise<>` types and MUST be awaited.

## Files Created

### Page File: `src/app/{route}/page.tsx`

**Public SSG page:**

```tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const revalidate = 3600; // ISR: revalidate every hour

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('{namespace}');
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

export default async function {PageName}Page() {
  const t = await getTranslations('{namespace}');

  return (
    <main>
      <h1>{t('heading')}</h1>
      {/* Page content */}
    </main>
  );
}
```

**Protected admin page:**

```tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { requireAuth, requireRole } from '@/features/auth/actions';

export const metadata: Metadata = {
  title: '{Page Title} | WIAL Admin',
};

export default async function Admin{PageName}Page() {
  await requireAuth();
  await requireRole(['super_admin']);
  const t = await getTranslations('admin.{pageName}');

  return (
    <main>
      <h1>{t('heading')}</h1>
      {/* Page content — all strings via t() */}
    </main>
  );
}
```

**Chapter-scoped page:**

```tsx
import { notFound } from 'next/navigation';
import { getChapterBySlug } from '@/features/chapters/queries';
import { getTranslations } from 'next-intl/server';

export const revalidate = 60; // ISR: revalidate every minute

interface ChapterPageProps {
  params: Promise<{ chapter: string }>;
}

export default async function Chapter{PageName}Page({ params }: ChapterPageProps) {
  const { chapter: slug } = await params;
  const chapter = await getChapterBySlug(slug);
  if (!chapter) notFound();

  const t = await getTranslations('{namespace}');

  return (
    <main>
      <h1>{t('heading')}</h1>
      {/* Page content using chapter data */}
    </main>
  );
}
```

### Layout File (if needed): `src/app/{route}/layout.tsx`

Only create if this route group needs a shared layout different from the parent.

## Checklist

1. **Metadata**: `generateMetadata()` or static `metadata` export for SEO
2. **Auth**: Protected pages use `requireAuth()` + `requireRole()`
3. **i18n**: All strings via `getTranslations()`, keys added to `messages/en.json`
4. **Accessibility**: Single `<h1>`, semantic HTML, proper heading hierarchy
5. **Performance**: Set appropriate `revalidate` value (3600 for static, 60 for dynamic content)
6. **Error handling**: Chapter pages call `notFound()` for invalid slugs
7. **Loading state**: Consider adding `loading.tsx` for dynamic pages

## Output

After creating the page, report:

1. Files created with their paths
2. Translation keys added
3. Auth requirements
4. SSG/ISR configuration
5. Reminder: add route to navigation if it should be in the nav
