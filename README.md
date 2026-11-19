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