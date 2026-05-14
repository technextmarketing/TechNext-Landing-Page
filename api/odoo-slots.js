/**
 * GET /api/odoo-slots?year=YYYY&month=M
 *
 * Returns all booked appointment slots from Odoo for the given month.
 * Slots are expressed as 'YYYY-MM-DD_HH:MM' strings in SGT (UTC+8),
 * matching the BK_TIMES_24 keys used in the frontend calendar.
 *
 * Since the appointment duration is 1 hour and the calendar shows 30-min
 * increments, each Odoo event blocks every 30-min slot it overlaps.
 */

// Must match BK_TIMES_24 in index.html
// Odoo availability: 09:00–12:00 and 14:00–17:00, 1-hr duration, 30-min step
const BK_TIMES_24 = ['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','15:30','16:00'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Method not allowed' });

  const { year, month } = req.query || {};
  if (!year || !month) return res.status(400).json({ error: 'year and month are required' });

  const ODOO_URL     = process.env.ODOO_URL;
  const ODOO_DB      = process.env.ODOO_DB;
  const ODOO_USER    = process.env.ODOO_USER;
  const ODOO_API_KEY = process.env.ODOO_API_KEY;
  const APPT_TYPE_ID = parseInt(process.env.ODOO_APPT_TYPE_ID || '2', 10);

  if (!ODOO_URL || !ODOO_DB || !ODOO_USER || !ODOO_API_KEY) {
    return res.status(500).json({ error: 'Odoo env vars not configured' });
  }

  const yr = parseInt(year, 10);
  const mo = parseInt(month, 10); // 1-indexed

  // Build UTC search window: cover full month in SGT (UTC+8)
  // Start = 1st of month at 00:00 SGT = 1st at 16:00 UTC (prev day)
  // End   = 1st of next month at 23:59 SGT = 2nd at 15:59 UTC
  const startUTC = new Date(Date.UTC(yr, mo - 1, 1, 0, 0, 0) - 8 * 3600 * 1000);
  const endUTC   = new Date(Date.UTC(yr, mo,     1, 0, 0, 0) + 16 * 3600 * 1000);
  const pad = n => String(n).padStart(2, '0');
  const fmtUTC = d =>
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`;

  try {
    /* ── Step 1: Authenticate ── */
    const authResp = await fetch(`${ODOO_URL}/web/session/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', method: 'call', id: 1,
        params: { db: ODOO_DB, login: ODOO_USER, password: ODOO_API_KEY }
      })
    });
    const authData = await authResp.json();
    if (!authData.result || authData.result.uid === false) {
      return res.status(401).json({ error: 'Odoo authentication failed' });
    }
    const setCookie    = authResp.headers.get('set-cookie') || '';
    const sessionMatch = setCookie.match(/session_id=([^;,\s]+)/);
    const sessionId    = sessionMatch?.[1] || authData.result?.session_id || '';

    /* ── Step 2: Fetch booked calendar events ── */
    const dataResp = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session_id=${sessionId}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0', method: 'call', id: 2,
        params: {
          model: 'calendar.event',
          method: 'search_read',
          args: [[
            ['appointment_type_id', '=', APPT_TYPE_ID],
            ['start', '>=', fmtUTC(startUTC)],
            ['start', '<',  fmtUTC(endUTC)],
            ['active', '=', true]
          ]],
          kwargs: {
            fields: ['start', 'stop', 'name'],
            limit: 500
          }
        }
      })
    });
    const data = await dataResp.json();
    if (data.error) {
      console.error('Odoo search_read error:', data.error);
      return res.status(500).json({ error: data.error.data?.message || 'Odoo query failed' });
    }

    /* ── Step 3: Convert events → blocked 30-min slot keys ── */
    // SGT = UTC + 8h
    const SGT = 8 * 3600 * 1000;
    const bookedSet = new Set();

    for (const evt of data.result || []) {
      // Parse Odoo UTC datetime strings → SGT Date objects
      const startSGT = new Date(new Date(evt.start.replace(' ', 'T') + 'Z').getTime() + SGT);
      const stopSGT  = new Date(new Date(evt.stop.replace(' ', 'T')  + 'Z').getTime() + SGT);

      const dateStr = `${startSGT.getUTCFullYear()}-` +
                      `${pad(startSGT.getUTCMonth() + 1)}-` +
                      `${pad(startSGT.getUTCDate())}`;

      // Event boundaries in minutes-since-midnight (SGT)
      const evtStartMin = startSGT.getUTCHours() * 60 + startSGT.getUTCMinutes();
      const evtStopMin  = stopSGT.getUTCHours()  * 60 + stopSGT.getUTCMinutes();

      // Block every 30-min slot that overlaps with the event
      for (const t of BK_TIMES_24) {
        const [hh, mm] = t.split(':').map(Number);
        const slotStartMin = hh * 60 + mm;
        const slotStopMin  = slotStartMin + 30;
        // Overlap: slot_start < evt_stop AND slot_stop > evt_start
        if (slotStartMin < evtStopMin && slotStopMin > evtStartMin) {
          bookedSet.add(`${dateStr}_${t}`);
        }
      }
    }

    /* ── Step 4: Return ── */
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    return res.status(200).json({ booked: [...bookedSet] });

  } catch (err) {
    console.error('odoo-slots error:', err);
    return res.status(500).json({ error: err.message });
  }
}
