export default async function handler(req, res) {
  /* CORS — allow requests from Casa Escondida website */
  res.setHeader('Access-Control-Allow-Origin', 'https://www.casaescondida-anilao.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) {
    return res.status(500).json({ error: 'Brevo API key not configured' });
  }

  const { name, phone, email, checkin, guests } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const htmlBody = `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f5f5f5;padding:0;">
  <div style="background:#0a1628;padding:28px 32px 20px;">
    <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#4dc2e8;">Casa Escondida Anilao</p>
    <h1 style="margin:6px 0 0;font-size:22px;font-weight:400;color:#ffffff;">New Booking Inquiry</h1>
  </div>
  <div style="background:#ffffff;padding:28px 32px;">
    <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6;">A visitor submitted a reservation request on the website. Details below:</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:10px 0;color:#888;width:38%;">Full Name</td>
        <td style="padding:10px 0;color:#111;font-weight:600;">${name}</td>
      </tr>
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:10px 0;color:#888;">Contact Number</td>
        <td style="padding:10px 0;color:#111;font-weight:600;">${phone || '—'}</td>
      </tr>
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:10px 0;color:#888;">Email Address</td>
        <td style="padding:10px 0;color:#111;font-weight:600;"><a href="mailto:${email}" style="color:#1a6b98;">${email}</a></td>
      </tr>
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:10px 0;color:#888;">Check-in Date</td>
        <td style="padding:10px 0;color:#111;font-weight:600;">${checkin || '—'}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#888;">Guests</td>
        <td style="padding:10px 0;color:#111;font-weight:600;">${guests || '—'}</td>
      </tr>
    </table>
    <div style="margin-top:24px;padding:16px;background:#f0f8ff;border-left:3px solid #4dc2e8;border-radius:2px;">
      <p style="margin:0;font-size:13px;color:#555;">Reply directly to <a href="mailto:${email}" style="color:#1a6b98;">${email}</a> to confirm the reservation.</p>
    </div>
  </div>
  <div style="background:#0a1628;padding:14px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#4a6a88;">casaescondida-anilao.com &nbsp;·&nbsp; Anilao, Mabini, Batangas</p>
  </div>
</div>`;

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender:      { name: 'Casa Escondida Website', email: 'hello@technext.asia' },
        to:          [{ email: 'hello@technext.asia', name: 'TechNext Asia' }],
        replyTo:     { email, name },
        subject:     `📋 New Booking Inquiry — ${name} (${guests || '?'} guest${guests === '1' ? '' : 's'})`,
        htmlContent: htmlBody
      })
    });

    if (!brevoRes.ok) {
      const errText = await brevoRes.text();
      console.error('[casa-booking] Brevo error:', errText);
      return res.status(502).json({ error: 'Email delivery failed' });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[casa-booking] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
