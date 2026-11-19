import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
    try {
        if (req.method === 'POST') {
            const { name, attending, party_size, companions } = req.body || {};
            const n = String(name || '').trim().slice(0, 100);
            if (!n || typeof attending !== 'boolean') {
                return res.status(400).json({ error: 'Name and answer are required.' });
        }
            const size = attending ? Math.min(Math.max(parseInt(party_size) || 1, 1), 20) : 0;
            const comp = String(companions || '').trim().slice(0, 300);
            await sql`
                INSERT INTO rsvps (name, attending, party_size, companions)
                VALUES (${n}, ${attending}, ${size}, ${comp})
                ON CONFLICT (lower(name)) DO UPDATE
                    SET attending = EXCLUDED.attending, party_size = EXCLUDED.party_size,
              companions = EXCLUDED.companions, updated_at = now()`;
            return res.status(200).json({ ok: true });
        }

        if (req.method === 'GET') {
            const token = req.headers['x-admin-token'];
            const [t] = await sql`
                SELECT COALESCE(SUM(party_size) FILTER (WHERE attending), 0)::int AS people,
                    COUNT(*) FILTER (WHERE attending)::int AS yes,
                    COUNT(*) FILTER (WHERE NOT attending)::int AS no
                 FROM rsvps`;
            if (!token || token !== process.env.ADMIN_TOKEN) {
             // Public: only the headcount is exposed, never the names.
            return res.status(200).json({ totals: { people: t.people } });
        }

        const rows = await sql`
            SELECT name, attending, party_size, companions, updated_at
            FROM rsvps ORDER BY updated_at DESC`;
        return res.status(200).json({ totals: t, rows });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
} 
