/* ── Odoo: find-or-create partner, then create calendar.event ── */
async function createOdooAppointment({ name, email, phone, slotISO, slotTime24, serviceLabel }) {
  const ODOO_URL     = process.env.ODOO_URL;
  const ODOO_DB      = process.env.ODOO_DB;
  const ODOO_USER    = process.env.ODOO_USER;
  const ODOO_API_KEY = process.env.ODOO_API_KEY;
  const APPT_TYPE_ID = parseInt(process.env.ODOO_APPT_TYPE_ID || '2', 10);

  if (!ODOO_URL || !ODOO_DB || !ODOO_USER || !ODOO_API_KEY) return null;
  if (!slotISO || !slotTime24) return null;

  /* Authenticate */
  const authResp = await fetch(`${ODOO_URL}/web/session/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', method: 'call', id: 1,
      params: { db: ODOO_DB, login: ODOO_USER, password: ODOO_API_KEY }
    })
  });
  const authData = await authResp.json();
  if (!authData.result || authData.result.uid === false) throw new Error('Odoo auth failed');

  const setCookie    = authResp.headers.get('set-cookie') || '';
  const sessionMatch = setCookie.match(/session_id=([^;,\s]+)/);
  const sessionId    = sessionMatch?.[1] || authData.result?.session_id || '';

  const rpc = (id, model, method, args, kwargs = {}) =>
    fetch(`${ODOO_URL}/web/dataset/call_kw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': `session_id=${sessionId}` },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'call', id,
        params: { model, method, args, kwargs } })
    }).then(r => r.json());

  /* Find or create res.partner */
  const searchRes = await rpc(2, 'res.partner', 'search_read',
    [[['email', '=', email]]], { fields: ['id', 'name'], limit: 1 });
  let partnerId;
  if (searchRes.result?.length > 0) {
    partnerId = searchRes.result[0].id;
  } else {
    const createPartner = await rpc(3, 'res.partner', 'create', [{
      name: name || email,
      email: email,
      phone: phone || '',
      type: 'contact'
    }]);
    if (createPartner.error) throw new Error(createPartner.error.data?.message || 'Partner creation failed');
    partnerId = createPartner.result;
  }

  /* Build UTC start/stop (SGT = UTC+8, appointment = 1 hour) */
  const [yr, mo, dy] = slotISO.split('-').map(Number);
  const [hh, mm]     = slotTime24.split(':').map(Number);
  const startUTC = new Date(Date.UTC(yr, mo - 1, dy, hh - 8, mm));
  const stopUTC  = new Date(startUTC.getTime() + 60 * 60 * 1000);
  const pad = n => String(n).padStart(2, '0');
  const fmtUTC = d =>
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`;

  /* Create calendar.event */
  const evtRes = await rpc(4, 'calendar.event', 'create', [{
    name:                 `Demo — ${name || email} × TechNext`,
    start:                fmtUTC(startUTC),
    stop:                 fmtUTC(stopUTC),
    appointment_type_id:  APPT_TYPE_ID,
    partner_ids:          [[4, partnerId]],
    description:          `Service: ${serviceLabel}\nPhone: ${phone || '—'}\nEmail: ${email}`,
    user_id:              2
  }]);

  if (evtRes.error) throw new Error(evtRes.error.data?.message || 'Calendar event creation failed');
  return evtRes.result;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, slot, phone, company, service, slotISO, slotTime24 } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) return res.status(500).json({ error: 'BREVO_API_KEY not configured' });

  const firstName = name ? name.split(' ')[0] : 'there';
  const SERVICE_LABELS = {
    odoo: 'Odoo ERP Implementation',
    ai:   'AI Automations',
    both: 'Both — Full Package (ERP + AI)',
  };
  const serviceLabel = SERVICE_LABELS[service] || service || 'Not specified';

  /* ── iCalendar invite (.ics) ── */
  function makeICS() {
    if (!slotISO || !slotTime24) return null;
    const [yr, mo, dy] = slotISO.split('-').map(Number);
    const [hh, mm]     = slotTime24.split(':').map(Number);
    // SGT = UTC+8 → subtract 8 h to get UTC
    const startUTC = new Date(Date.UTC(yr, mo - 1, dy, hh - 8, mm));
    const endUTC   = new Date(startUTC.getTime() + 30 * 60 * 1000);
    const fmt = d => d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
    const uid = `${slotISO}T${slotTime24}-${email}@technext.asia`.replace(/[^a-z0-9@.]/gi, '-');
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TechNext Asia//Demo Booking//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${fmt(startUTC)}`,
      `DTEND:${fmt(endUTC)}`,
      `SUMMARY:Demo — ${name || 'New Lead'} × TechNext Asia`,
      `DESCRIPTION:30-minute product demo.\\nService: ${serviceLabel}\\nBooked slot: ${slot}`,
      `ORGANIZER;CN=TechNext Asia:MAILTO:hello@technext.asia`,
      `ATTENDEE;CN=${name || email};RSVP=TRUE;PARTSTAT=ACCEPTED:MAILTO:${email}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Demo with TechNext Asia in 30 minutes',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    return Buffer.from(ics).toString('base64');
  }
  const icsAttachment = makeICS();

  /* ── Shared tokens ── */
  const purple     = '#2563EB';
  const purpleDeep = '#4338CA';
  const purpleXl   = '#EFF6FF';
  const purpleLight= '#DBEAFE';
  const green      = '#059669';
  const bg         = '#F5F7FF';
  const white      = '#FFFFFF';
  const text       = '#1F2937';
  const muted      = '#6B7280';
  const border     = '#E5E7EB';
  const dark       = '#111827';
  const fBody      = "'Plus Jakarta Sans', Arial, Helvetica, sans-serif";
  const fDisplay   = "'Caveat', Georgia, cursive";

  /* ════════════════════════════════════════
     EMAIL 1 — Confirmation to the respondent
     Simple, text-only, no external images
  ════════════════════════════════════════ */
  const confirmHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Demo Confirmed — TechNext Asia</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Caveat:wght@700&display=swap');
    body,table,td{margin:0;padding:0;}
    body{background-color:${bg};font-family:${fBody};}
    @media only screen and (max-width:600px){
      .card{width:100%!important;border-radius:0!important;}
      .pad{padding-left:24px!important;padding-right:24px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${bg};">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${bg}">
<tr><td align="center" style="padding:40px 16px;">

  <table class="card" width="560" cellpadding="0" cellspacing="0" border="0"
    style="max-width:560px;width:100%;background:${white};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(37,99,235,.10);">

    <!-- HEADER -->
    <tr>
      <td class="pad" bgcolor="${purple}"
        style="background:linear-gradient(135deg,${purple} 0%,${purpleDeep} 100%);padding:32px 40px 28px;">
        <p style="margin:0 0 4px 0;font-family:${fBody};font-size:11px;font-weight:700;
          letter-spacing:3px;color:rgba(255,255,255,.6);text-transform:uppercase;">TechNext Asia</p>
        <p style="margin:0;font-family:${fDisplay};font-size:36px;font-weight:700;
          color:${white};line-height:1.1;">Demo Confirmed</p>
      </td>
    </tr>

    <!-- CONFIRMED BAR -->
    <tr>
      <td bgcolor="${green}" class="pad"
        style="background:${green};padding:11px 40px;">
        <p style="margin:0;font-family:${fBody};font-size:13px;font-weight:700;color:${white};letter-spacing:.3px;">
          Your slot is confirmed &mdash; see you soon, ${firstName}!
        </p>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td class="pad" bgcolor="${white}"
        style="background:${white};padding:36px 40px 12px;">

        <!-- Greeting -->
        <p style="margin:0 0 6px;font-family:${fBody};font-size:15px;font-weight:700;color:${text};">
          Hi ${name || 'there'},
        </p>
        <p style="margin:0 0 28px;font-family:${fBody};font-size:14px;color:${muted};line-height:1.7;">
          Thank you for booking a free demo with TechNext Asia. Here are your booking details below.
        </p>

        <!-- SLOT BOX -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
          <tr>
            <td bgcolor="${purpleXl}"
              style="background:${purpleXl};border:1.5px solid ${purpleLight};
                border-radius:12px;padding:20px 24px;">
              <p style="margin:0 0 6px;font-family:${fBody};font-size:10px;font-weight:700;
                color:${purple};text-transform:uppercase;letter-spacing:3px;">Scheduled Demo</p>
              <p style="margin:0 0 6px;font-family:${fDisplay};font-size:26px;font-weight:700;
                color:${text};line-height:1.2;">${slot}</p>
              <p style="margin:0;font-family:${fBody};font-size:12px;color:${muted};">
                30 minutes &nbsp;&middot;&nbsp; Singapore Time (SGT) &nbsp;&middot;&nbsp; Video Call
              </p>
            </td>
          </tr>
        </table>

        <!-- WHAT TO EXPECT -->
        <p style="margin:0 0 16px;font-family:${fBody};font-size:10px;font-weight:700;
          color:${purple};text-transform:uppercase;letter-spacing:3px;">What to Expect</p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:30px;">

          ${[
            ['1', 'Business Discovery',  'We start by understanding your processes and biggest pain points.'],
            ['2', 'Live Product Demo',   'See Odoo ERP and AI automations in action, tailored to your business.'],
            ['3', 'Your Custom Roadmap', 'Leave with a clear implementation plan &mdash; no commitment required.'],
          ].map(([num, title, desc], i, arr) => `
          <tr>
            <td style="padding:12px 0;${i < arr.length - 1 ? `border-bottom:1px solid ${border};` : ''}vertical-align:top;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>

                <!-- Number circle -->
                <td style="width:32px;vertical-align:top;padding-right:14px;padding-top:1px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="${purpleXl}"
                        style="background:${purpleXl};width:28px;height:28px;border-radius:50%;
                          text-align:center;vertical-align:middle;font-family:${fBody};
                          font-size:12px;font-weight:700;color:${purple};line-height:28px;">
                        ${num}
                      </td>
                    </tr>
                  </table>
                </td>

                <!-- Text -->
                <td style="vertical-align:top;">
                  <p style="margin:0 0 3px;font-family:${fBody};font-size:14px;font-weight:700;color:${text};">
                    ${title}
                  </p>
                  <p style="margin:0;font-family:${fBody};font-size:13px;color:${muted};line-height:1.6;">
                    ${desc}
                  </p>
                </td>

              </tr></table>
            </td>
          </tr>`).join('')}

        </table>

        <!-- DIVIDER -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          <tr><td style="height:1px;background:${border};font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>

        <!-- NOTE -->
        <p style="margin:0 0 28px;font-family:${fBody};font-size:13px;color:${muted};line-height:1.7;">
          Have questions before the call? Reply to this email or write to
          <a href="mailto:hello@technext.asia"
            style="color:${purple};font-weight:700;text-decoration:none;">hello@technext.asia</a>
          &mdash; we typically respond within a few hours.
        </p>

        <!-- SIGN OFF -->
        <p style="margin:0 0 4px;font-family:${fBody};font-size:14px;font-weight:600;color:${text};">
          Talk to you soon,
        </p>
        <p style="margin:0 0 36px;font-family:${fBody};font-size:13px;color:${muted};">
          The TechNext Asia Team
        </p>

      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td class="pad" bgcolor="${dark}"
        style="background:${dark};padding:20px 40px;text-align:center;">
        <p style="margin:0 0 4px;font-family:${fBody};font-size:12px;font-weight:600;
          color:rgba(255,255,255,.65);">
          TechNext &nbsp;&middot;&nbsp; hello@technext.asia
        </p>
        <p style="margin:0;font-family:${fBody};font-size:11px;color:rgba(255,255,255,.3);">
          Odoo Partner &nbsp;&middot;&nbsp; Serving businesses worldwide
        </p>
      </td>
    </tr>

  </table>
</td></tr>
</table>
</body>
</html>`;

  /* ════════════════════════════════════════
     EMAIL 2 — Internal notification to TechNext
  ════════════════════════════════════════ */
  const notifyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>New Demo Booking</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Caveat:wght@700&display=swap');
    body{margin:0;padding:0;background-color:${bg};font-family:${fBody};}
  </style>
</head>
<body style="margin:0;padding:0;background-color:${bg};">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${bg}">
<tr><td align="center" style="padding:40px 16px;">

  <table width="520" cellpadding="0" cellspacing="0" border="0"
    style="max-width:520px;width:100%;background:${white};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

    <!-- HEADER -->
    <tr>
      <td bgcolor="${purple}"
        style="background:linear-gradient(135deg,${purple} 0%,${purpleDeep} 100%);padding:24px 32px;">
        <p style="margin:0 0 3px;font-family:${fBody};font-size:10px;font-weight:700;
          letter-spacing:3px;color:rgba(255,255,255,.6);text-transform:uppercase;">
          TechNext Asia &mdash; Internal
        </p>
        <p style="margin:0;font-family:${fDisplay};font-size:28px;font-weight:700;color:${white};">
          New Demo Booking
        </p>
      </td>
    </tr>

    <!-- SLOT STRIP -->
    <tr>
      <td bgcolor="${green}"
        style="background:${green};padding:11px 32px;">
        <p style="margin:0;font-family:${fBody};font-size:13px;font-weight:700;color:${white};">
          ${slot}
        </p>
      </td>
    </tr>

    <!-- DETAILS -->
    <tr>
      <td bgcolor="${white}" style="background:${white};padding:28px 32px 8px;">

        <p style="margin:0 0 16px;font-family:${fBody};font-size:10px;font-weight:700;
          color:${purple};text-transform:uppercase;letter-spacing:3px;">Lead Details</p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          ${[
            ['Name',             name    || '&mdash;'],
            ['Email',            email],
            ['Phone',            phone   || '&mdash;'],
            ['Company',          company || '&mdash;'],
            ['Service Interest', serviceLabel],
          ].map(([label, value], i, arr) => `
          <tr>
            <td style="padding:10px 0;${i < arr.length - 1 ? `border-bottom:1px solid ${border};` : ''}
              width:35%;vertical-align:top;">
              <p style="margin:0;font-family:${fBody};font-size:11px;font-weight:700;
                color:${muted};text-transform:uppercase;letter-spacing:1.5px;">${label}</p>
            </td>
            <td style="padding:10px 0 10px 16px;${i < arr.length - 1 ? `border-bottom:1px solid ${border};` : ''}
              vertical-align:top;">
              <p style="margin:0;font-family:${fBody};font-size:14px;font-weight:600;color:${text};">
                ${label === 'Email'
                  ? `<a href="mailto:${value}" style="color:${purple};text-decoration:none;">${value}</a>`
                  : value}
              </p>
            </td>
          </tr>`).join('')}
        </table>

        <!-- NOTE -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
          <tr>
            <td bgcolor="${purpleXl}"
              style="background:${purpleXl};border-left:3px solid ${purple};
                border-radius:0 8px 8px 0;padding:12px 16px;">
              <p style="margin:0;font-family:${fBody};font-size:13px;color:${text};line-height:1.65;">
                A confirmation email has been sent to
                <a href="mailto:${email}" style="color:${purple};font-weight:700;text-decoration:none;">${email}</a>.
                Please prepare the video call link and send it to the client before the session.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td bgcolor="${bg}"
        style="background:${bg};padding:16px 32px;text-align:center;border-top:1px solid ${border};">
        <p style="margin:0;font-family:${fBody};font-size:11px;color:${muted};">
          TechNext Asia &nbsp;&middot;&nbsp; Internal booking notification
        </p>
      </td>
    </tr>

  </table>
</td></tr>
</table>
</body>
</html>`;

  /* ── Send both emails in parallel ── */
  const send = (to, toName, subject, html, attachment) =>
    fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
      body: JSON.stringify({
        sender:      { name: 'TechNext Asia', email: 'hello@technext.asia' },
        to:          [{ email: to, name: toName }],
        subject,
        htmlContent: html,
        ...(attachment ? { attachment: [{ content: attachment, name: 'demo-invite.ics' }] } : {}),
      }),
    });

  try {
    const [r1, r2] = await Promise.all([
      send(email, name || email, `Demo Confirmed — ${slot}`, confirmHtml, icsAttachment),
      send('hello@technext.asia', 'TechNext Team', `New Booking: ${name || email} — ${slot}`, notifyHtml, icsAttachment),
    ]);

    const d1 = await r1.json();
    const d2 = await r2.json();

    if (!r1.ok) {
      console.error('Confirm email failed:', d1);
      return res.status(500).json({ error: d1.message || 'Confirmation email failed' });
    }
    if (!r2.ok) console.error('Notify email failed:', d2);

    /* ── Create Odoo appointment (fire-and-forget, non-blocking) ── */
    createOdooAppointment({ name, email, phone, slotISO, slotTime24, serviceLabel })
      .then(id => console.log('Odoo appointment created:', id))
      .catch(err => console.error('Odoo appointment error (non-fatal):', err.message));

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('send-confirmation error:', err);
    return res.status(500).json({ error: err.message });
  }
}
