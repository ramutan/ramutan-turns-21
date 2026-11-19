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
- **Admin** (`GET /api/rsvp` with the correct `x-admin-token` header) returns every
row. `guests.html` sends the token you type into the prompt.
- The same name replying twice **updates** the existing row instead of creating a
  duplicate (enforced by a unique index on `lower(name)`).

---

## 1. Set up the database (Neon)

1. Sign in at **https://neon.tech** and create a free project
   (region: `AWS Asia Pacific (Singapore)` is closest to the Philippines).
2. Open the project's **SQL Editor**.
3. Copy the contents of [`schema.sql`](./schema.sql) and run it. You should see
   `rsvps` appear under **Tables**.
4. On the project **Dashboard**, find the **Connection string**. It looks like:
   ```
   postgresql://neondb_owner:xxxxxxxx@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
   Copy it. You will paste it into Vecel as `DATABASE_URL`.

---

## 2. Push the project to Github

```bash
cd prince-21st-rsvp
git init
git add .
git commit -m "Prince's 21st RSVP"
git branch -M main
git remote add origin https://github.com/<you>/prince-21st-rsvp.git
git push -u origin main
```

> Add your `invite.png` and `photo.png` files into `public/` before committing.
> They are referenced by `index.html` and are not included in this repo.

---

## 3. Deploy to Vercel

### Option A - via the Vercel dashboard (easiest)

1. Go to **https://vercel.com/new**.
2. Import the GitHub repo you just pushed.
3. **Framework Preset** should auto-detect as **Other**. Leave it.
4. **Root Directory** = `./` (the repo root).
5. Skip build settings — Vercel reads `vercel.json` (`outputDirectory: "public"`)
   and auto-detects `api/rsvp.js` as a Serverless Function.
6. Open **Environment Variables** and add:

   | Name | Value | Environments |
   | --- | --- | --- |
   | `DATABASE_URL` | your Neon connection string | Production, Preview, Development |
   | `ADMIN_TOKEN` | any secret word, e.g. `prince-nov-28` | Production, Preview, Development |

7. Click **Deploy**. After ~30 seconds you'll get a URL like
   `https://prince-21st-rsvp.vercel.app`.