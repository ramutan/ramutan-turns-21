# Prince's 21st Birthday RSVP

A tiny, dependency-light RSVP site for Prince's 21st birthday.
Guests open a link, fill in a short form, and their reply is saved to a
**Neon** Postgres database. The host views a live guest list on a private page.

---

## How it works

```
Browser (guest)            Vercel (serverless)         Neon (Postgres)
────────────────           ──────────────────          ───────────────
index.html  ── POST /api/rsvp ──>  api/rsvp.js  ── SQL ──>  rsvps table
            <── JSON { ok: true } ──                       (name, attending,
                                                       party_size, companions)

                                                       index.html  ── GET  /api/rsvp ──>  api/rsvp.js  ── SQL ──>  COUNT/SUM
            <── JSON { totals: { people } }  (public, headcount only)

guests.html ── GET  /api/rsvp ──>  api/rsvp.js  ── SQL ──>  full rows
   (with        x-admin-token                       (only when token matches
   header)                                            ADMIN_TOKEN env var)
```

### The four pieces

| File | Role |
| --- | --- |
| `public/index.html` | The invitation page guests see. Posts the form to `/api/rsvp` and shows a live "X guests have confirmed" counter. |
| `public/guests.html` | Private admin page. Asks for the admin token, then lists every RSVP, refreshing every 3 seconds. |
| `api/rsvp.js` | A Vercel Serverless Function. Handles `POST` (save a reply) and `GET` (read totals, or full rows if the admin token matches). |
| `schema.sql` | The table definition. Run once in the Neon SQL Editor. |

### Privacy

- **Public** (`GET /api/rsvp` with no token) returns only the **total headcount**.
  Names and answers are never exposed to guests.