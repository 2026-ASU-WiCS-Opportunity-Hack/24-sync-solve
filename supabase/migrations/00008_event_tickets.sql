-- ============================================================
-- Migration 00008: Event Tickets & Registrations
-- ============================================================
-- Adds ticket_price to events and a new event_registrations
-- table to track attendees (free RSVP or paid via Stripe).
-- ============================================================

-- ── Add ticket_price to events ───────────────────────────────────────────────

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS ticket_price INTEGER DEFAULT NULL
    CHECK (ticket_price IS NULL OR ticket_price >= 0);

COMMENT ON COLUMN events.ticket_price IS
  'Price in smallest currency unit (cents). NULL or 0 = free event.';

-- ── Event registration status enum ──────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_status') THEN
    CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'cancelled');
  END IF;
END
$$;

-- ── event_registrations table ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_registrations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  event_id                  UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Guest registration fields (used when user is not authenticated)
  guest_name                TEXT,
  guest_email               TEXT,

  -- Link to payment if this was a paid registration
  payment_id                UUID REFERENCES payments(id) ON DELETE SET NULL,

  status                    registration_status NOT NULL DEFAULT 'pending',

  registered_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A user can only register once per event
  CONSTRAINT event_registrations_unique_user
    UNIQUE NULLS NOT DISTINCT (event_id, user_id),

  -- Guest must supply at least email if not authenticated
  CONSTRAINT event_registrations_identity_check
    CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL)
);

COMMENT ON TABLE event_registrations IS
  'Tracks attendee registrations for events (free RSVP or paid via Stripe).';

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id
  ON event_registrations(event_id);

CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id
  ON event_registrations(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_registrations_payment_id
  ON event_registrations(payment_id)
  WHERE payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_registrations_status
  ON event_registrations(status);

-- ── updated_at trigger ───────────────────────────────────────────────────────

CREATE TRIGGER event_registrations_updated_at
  BEFORE UPDATE ON event_registrations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── Row-Level Security ───────────────────────────────────────────────────────

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Public: anyone can register (needed for unauthenticated guest RSVP)
CREATE POLICY "event_registrations_public_insert"
  ON event_registrations
  FOR INSERT
  WITH CHECK (true);

-- Users: read their own registrations
CREATE POLICY "event_registrations_own_read"
  ON event_registrations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users: cancel their own registration
CREATE POLICY "event_registrations_own_update"
  ON event_registrations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Chapter leads: read all registrations for events in their chapter
CREATE POLICY "event_registrations_chapter_lead_read"
  ON event_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_registrations.event_id
        AND can_edit_chapter(e.chapter_id)
    )
  );

-- Chapter leads: update registrations for events in their chapter
CREATE POLICY "event_registrations_chapter_lead_update"
  ON event_registrations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_registrations.event_id
        AND can_edit_chapter(e.chapter_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_registrations.event_id
        AND can_edit_chapter(e.chapter_id)
    )
  );

-- Super admins: full access
CREATE POLICY "event_registrations_super_admin"
  ON event_registrations
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ── Storage: no new buckets needed (events use chapter-assets) ───────────────

-- ── Add event_id to payments metadata for event registrations ────────────────
-- The event_id is stored in Stripe metadata and propagated here on webhook.
-- No schema change needed — payments.chapter_id links to the chapter.
-- We store event_id as metadata in the Stripe session and look it up in
-- the webhook handler. A separate denormalized column could be added later.
