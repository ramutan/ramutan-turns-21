-- Run once in the Neon SQL Editor
CREATE TABLE IF NOT EXISTS rsvps (
  id          SERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  attending   BOOLEAN     NOT NULL,
  party_size  INT         NOT NULL DEFAULT 0,
  companions  TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Same name answering again updates their RSVP instead of duplicating it
CREATE UNIQUE INDEX IF NOT EXISTS rsvps_name_key ON rsvps (lower(name));
