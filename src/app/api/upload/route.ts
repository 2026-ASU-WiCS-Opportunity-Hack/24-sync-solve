import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

const ALLOWED_BUCKETS = ['avatars', 'coach-photos', 'chapter-assets', 'content-images'] as const
type AllowedBucket = (typeof ALLOWED_BUCKETS)[number]

function isAllowedBucket(bucket: string): bucket is AllowedBucket {
  return ALLOWED_BUCKETS.includes(bucket as AllowedBucket)
}

/**
 * POST /api/upload
 *
 * Accepts multipart/form-data with:
 *   file   — the image file
 *   bucket — Supabase Storage bucket name
 *   path   — optional custom storage path prefix
 *
 * Returns: { url: string } on success
 * Auth required: user must be authenticated with a role that can upload
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // --- Auth check ---
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  // Check role — only editors+ can upload
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const allowedRoles = ['super_admin', 'chapter_lead', 'content_editor', 'coach']
  if (!profile || !allowedRoles.includes(profile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 })
  }

  // --- Parse multipart form ---
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
  }

  const file = formData.get('file')
  const bucket = formData.get('bucket')
  const pathPrefix = formData.get('path')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  }

  if (typeof bucket !== 'string' || !isAllowedBucket(bucket)) {
    return NextResponse.json(
      { error: `Invalid bucket. Allowed: ${ALLOWED_BUCKETS.join(', ')}` },
      { status: 400 }
    )
  }

  // --- Validate MIME type ---
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Only JPEG, PNG, WebP, AVIF, and GIF are allowed.' },
      { status: 415 }
    )
  }

  // --- Validate file size ---
  const maxSize = bucket === 'chapter-assets' ? 5 * 1024 * 1024 : MAX_FILE_SIZE_BYTES
  if (file.size > maxSize) {
    const maxMB = maxSize / 1024 / 1024
    return NextResponse.json(
      { error: `File too large. Maximum size is ${maxMB}MB.` },
      { status: 413 }
    )
  }

  // --- Build storage path ---
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).slice(2, 8)
  const filename = `${timestamp}-${randomSuffix}.${ext}`
  const prefix = typeof pathPrefix === 'string' && pathPrefix ? `${pathPrefix}/` : `${user.id}/`
  const storagePath = `${prefix}${filename}`

  // --- Upload to Supabase Storage using admin client ---
  const adminClient = createAdminClient()
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { error: uploadError } = await adminClient.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('[upload] Supabase storage error:', uploadError)
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
  }

  // --- Get public URL ---
  const {
    data: { publicUrl },
  } = adminClient.storage.from(bucket).getPublicUrl(storagePath)

  return NextResponse.json({ url: publicUrl }, { status: 200 })
}
