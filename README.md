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

### Option B - via the Vercel CLI

```bash
npm i -g vercel
cd prince-21st-rsvp
vercel            # follow the prompts; this creates a preview deployment
vercel env add DATABASE_URL      # paste the Neon connection string
vercel env add ADMIN_TOKEN       # paste your chosen admin token
vercel --prod     # deploy to production
```

---

## 4. Run it locally (so the API actually works)

The error `Unexpected token '<', "<!DOCTYPE "... is not valid JSON` in your
screenshot happens when `index.html` is opened directly (or served by a plain
static server like VS Code Live Server). In that case `/api/rsvp` does not exist,
so the server returns a 404 **HTML** page, and `fetch().json()` chokes on the
`<!DOCTYPE html>` at the start.

**Fix:** run the project through Vercel's dev server, which serves both the
static files in `public/` and the serverless function in `api/`.

```bash
npm install
npm run dev          # = vercel dev
```

On first run, `vercel dev` will ask you to link the project and will pull down
your env vars from Vercel (or let you set them locally). Open the URL it prints
(usually `http://localhost:3000`) and the form will work end-to-end.

To set env vars only on your machine for local dev, create a `.env.local` file
in the project root (it is git-ignored):

```
DATABASE_URL=postgresql://neondb_owner:xxxx@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
ADMIN_TOKEN=prince-nov-28
```

`vercel dev` reads `.env.local` automatically.

---

## 5. Share it

- **Guests**: send them `https://YOUR-SITE.vercel.app/`
- **You (admin)**: bookmark `https://YOUR-SITE.vercel.app/guests.html` and type
  your `ADMIN_TOKEN` when prompted. The list refreshes every 3 seconds.

---

## Project structure

```
prince-21st-rsvp/
├── api/
│   └── rsvp.js          Serverless function (POST saves, GET reads)
├── public/
│   ├── index.html       Invitation + RSVP form (guest-facing)
│   ├── guests.html      Live guest list (admin-only)
│   ├── invite.png       Your invitation image — add this yourself
│   └── photo.png        Your photo image — add this yourself
├── package.json
├── schema.sql           Run once in Neon to create the table
├── vercel.json          Tells Vercel: static files live in public/
└── README.md            This file
```

---

## Troubleshooting

**`Unexpected token '<' ... is not valid JSON` on submit / on page load**
You are opening `index.html` directly or serving it with a static server.
Run `vercel dev` instead — see section 4.

**`Something went wrong. Please try again.` on submit**
Check the Vercel function logs (Vercel dashboard → your project → Logs, or
`vercel logs <deployment-url>`). Most often `DATABASE_URL` is missing or the
table from `schema.sql` has not been created yet.