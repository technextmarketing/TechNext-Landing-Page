export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, slot, phone, company, service } = req.body || {};
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

  /* ── Design tokens ── */
  const C = {
    purple:      '#2563EB',
    purpleDeep:  '#4338CA',
    purpleLight: '#DBEAFE',
    purpleXl:    '#EFF6FF',
    green:       '#059669',
    bg:          '#FAFAF7',
    white:       '#FFFFFF',
    text:        '#1F2937',
    text2:       '#374151',
    muted:       '#6B7280',
    border:      '#E5E7EB',
    dark:        '#111827',
  };

  const LOGO       = 'https://technextmarketing.github.io/TechNext-Landing-Page/images/TechNext-Logo.png';
  const ICON_SEARCH = 'https://cdn-icons-png.flaticon.com/128/1320/1320974.png';
  const ICON_SCREEN = 'https://cdn-icons-png.flaticon.com/128/1320/1320988.png';
  const ICON_ROCKET = 'https://cdn-icons-png.flaticon.com/128/1320/1320960.png';
  const ICON_FB    = 'https://img.icons8.com/ios-filled/100/94A3B8/facebook-new.png';
  const ICON_LI    = 'https://img.icons8.com/ios-filled/100/94A3B8/linkedin.png';
  const ICON_X     = 'https://img.icons8.com/ios-filled/100/94A3B8/twitterx--v1.png';
  const ICON_IG    = 'https://img.icons8.com/ios-filled/100/94A3B8/instagram-new.png';

  const FONT_BODY    = "'Plus Jakarta Sans', Arial, Helvetica, sans-serif";
  const FONT_DISPLAY = "'Caveat', Georgia, cursive";

  /* ════════════════════════════════════════════
     EMAIL 1 — Confirmation to the respondent
  ════════════════════════════════════════════ */
  const confirmationHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Your TechNext Demo is Confirmed</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Caveat:wght@700&display=swap');
    body { margin:0; padding:0; background-color:${C.bg}; }
    @media only screen and (max-width:620px) {
      .card { width:100% !important; border-radius:0 !important; }
      .pad  { padding-left:24px !important; padding-right:24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}">
<tr><td align="center" style="padding:32px 16px;">

  <table class="card" width="600" cellpadding="0" cellspacing="0" border="0"
         style="max-width:600px;width:100%;background-color:${C.white};border-radius:20px;overflow:hidden;box-shadow:0 12px 48px rgba(37,99,235,.13);">

    <!-- HEADER -->
    <tr>
      <td bgcolor="${C.purple}"
          style="background:linear-gradient(160deg,${C.purple} 0%,${C.purpleDeep} 100%);padding:36px 40px 32px;text-align:center;" class="pad">
        <img src="${LOGO}" width="140" alt="TechNext Asia"
             style="display:inline-block;height:auto;margin-bottom:20px;filter:brightness(0) invert(1);">
        <div style="width:40px;height:3px;background:rgba(255,255,255,.45);border-radius:2px;margin:0 auto 20px;"></div>
        <p style="margin:0;font-family:${FONT_DISPLAY};font-size:38px;font-weight:700;color:${C.white};line-height:1.15;">
          Demo Confirmed
        </p>
        <p style="margin:10px 0 0;font-family:${FONT_BODY};font-size:13px;font-weight:500;color:rgba(255,255,255,.72);">
          Odoo ERP &amp; AI Automations for Growing Businesses
        </p>
      </td>
    </tr>

    <!-- CONFIRMED STRIP -->
    <tr>
      <td bgcolor="${C.green}" style="background:${C.green};padding:12px 40px;text-align:center;" class="pad">
        <p style="margin:0;font-family:${FONT_BODY};font-size:13px;font-weight:700;color:${C.white};letter-spacing:0.4px;">
          Booking Confirmed &mdash; See you soon, ${firstName}!
        </p>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td bgcolor="${C.white}" style="background:${C.white};padding:40px 40px 12px;" class="pad">

        <p style="margin:0 0 8px;font-family:${FONT_BODY};font-size:16px;font-weight:700;color:${C.text};">
          Hi ${name || 'there'},
        </p>
        <p style="margin:0 0 28px;font-family:${FONT_BODY};font-size:14px;color:${C.text2};line-height:1.75;">
          Thank you for booking a free demo with TechNext Asia. We are looking forward to showing you
          how <span style="font-weight:700;color:${C.text};">Odoo ERP</span> and
          <span style="font-weight:700;color:${C.text};">AI Automations</span> can streamline your
          business operations &mdash; from accounting and inventory to intelligent workflows.
        </p>

        <!-- SLOT CARD -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
          <tr>
            <td bgcolor="${C.purpleXl}"
                style="background:${C.purpleXl};border:1.5px solid ${C.purpleLight};border-radius:14px;padding:24px 28px;">
              <p style="margin:0 0 10px;font-family:${FONT_BODY};font-size:10px;font-weight:700;
                         color:${C.purple};text-transform:uppercase;letter-spacing:3px;">Your Scheduled Demo</p>
              <p style="margin:0 0 8px;font-family:${FONT_DISPLAY};font-size:28px;font-weight:700;color:${C.text};line-height:1.2;">
                ${slot}
              </p>
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="padding-right:16px;"><p style="margin:0;font-family:${FONT_BODY};font-size:12px;font-weight:600;color:${C.muted};">30 minutes</p></td>
                <td style="padding-right:16px;"><p style="margin:0;font-family:${FONT_BODY};font-size:12px;font-weight:600;color:${C.muted};">Singapore Time (SGT)</p></td>
                <td><p style="margin:0;font-family:${FONT_BODY};font-size:12px;font-weight:600;color:${C.muted};">Video Call</p></td>
              </tr></table>
            </td>
          </tr>
        </table>

        <!-- WHAT TO EXPECT -->
        <p style="margin:0 0 16px;font-family:${FONT_BODY};font-size:10px;font-weight:700;
                   color:${C.purple};text-transform:uppercase;letter-spacing:3px;">What to Expect</p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
          ${[
            [ICON_SEARCH, 'Business Discovery',   'We start by understanding your current processes and biggest pain points.'],
            [ICON_SCREEN, 'Live Product Demo',     'See Odoo ERP and AI automations in action, tailored to your industry.'],
            [ICON_ROCKET, 'Your Custom Roadmap',   'You will leave with a clear implementation plan &mdash; no commitment required.'],
          ].map(([icon, title, desc], i, arr) => `
          <tr>
            <td style="padding:12px 0;${i < arr.length - 1 ? `border-bottom:1px solid ${C.border};` : ''}vertical-align:middle;">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="padding-right:16px;vertical-align:middle;">
                  <table cellpadding="0" cellspacing="0" border="0"><tr>
                    <td bgcolor="${C.purpleXl}" style="background:${C.purpleXl};width:40px;height:40px;border-radius:10px;text-align:center;vertical-align:middle;">
                      <img src="${icon}" width="20" height="20" alt="" style="display:inline-block;vertical-align:middle;margin-top:10px;">
                    </td>
                  </tr></table>
                </td>
                <td style="vertical-align:middle;">
                  <p style="margin:0 0 3px;font-family:${FONT_BODY};font-size:14px;font-weight:700;color:${C.text};">${title}</p>
                  <p style="margin:0;font-family:${FONT_BODY};font-size:13px;color:${C.muted};line-height:1.55;">${desc}</p>
                </td>
              </tr></table>
            </td>
          </tr>`).join('')}
        </table>

        <!-- QUESTION NOTE -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
          <tr>
            <td bgcolor="${C.purpleXl}"
                style="background:${C.purpleXl};border-left:3px solid ${C.purple};border-radius:0 10px 10px 0;padding:14px 18px;">
              <p style="margin:0;font-family:${FONT_BODY};font-size:13px;color:${C.text2};line-height:1.65;">
                <span style="font-weight:700;color:${C.text};">Have questions before the call?</span><br>
                Reply to this email or write to us at
                <a href="mailto:hello@technext.asia" style="color:${C.purple};font-weight:700;text-decoration:none;">hello@technext.asia</a>
                &mdash; we respond within a few hours.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 4px;font-family:${FONT_BODY};font-size:14px;font-weight:600;color:${C.text};">Talk to you soon,</p>
        <p style="margin:0 0 40px;font-family:${FONT_BODY};font-size:13px;color:${C.muted};">The TechNext Asia Team</p>

      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td bgcolor="${C.dark}" style="background:${C.dark};padding:28px 40px 32px;text-align:center;" class="pad">
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
          <tr>
            <td style="padding:0 8px;"><a href="https://web.facebook.com/technextasia"><img src="${ICON_FB}" width="20" height="20" alt="Facebook" style="display:block;"></a></td>
            <td style="padding:0 8px;"><a href="https://www.linkedin.com/company/technextasia/"><img src="${ICON_LI}" width="20" height="20" alt="LinkedIn" style="display:block;"></a></td>
            <td style="padding:0 8px;"><a href="https://x.com/technextasia"><img src="${ICON_X}" width="20" height="20" alt="X" style="display:block;"></a></td>
            <td style="padding:0 8px;"><a href="https://www.instagram.com/technextasia/"><img src="${ICON_IG}" width="20" height="20" alt="Instagram" style="display:block;"></a></td>
          </tr>
        </table>
        <p style="margin:0 0 5px;font-family:${FONT_BODY};font-size:12px;font-weight:600;color:rgba(255,255,255,.75);">TechNext Asia &nbsp;&middot;&nbsp; hello@technext.asia</p>
        <p style="margin:0;font-family:${FONT_BODY};font-size:11px;color:rgba(255,255,255,.38);">Certified Odoo Ready Partner &nbsp;&middot;&nbsp; Serving businesses worldwide</p>
      </td>
    </tr>

  </table>
</td></tr>
</table>
</body>
</html>`;

  /* ════════════════════════════════════════════
     EMAIL 2 — Internal notification to TechNext
  ════════════════════════════════════════════ */
  const notifyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
    body { margin:0; padding:0; background-color:${C.bg}; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}">
<tr><td align="center" style="padding:32px 16px;">

  <table width="560" cellpadding="0" cellspacing="0" border="0"
         style="max-width:560px;width:100%;background-color:${C.white};border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.08);">

    <!-- HEADER -->
    <tr>
      <td bgcolor="${C.purple}"
          style="background:linear-gradient(160deg,${C.purple} 0%,${C.purpleDeep} 100%);padding:22px 32px;">
        <p style="margin:0 0 2px;font-family:${FONT_BODY};font-size:10px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,.6);text-transform:uppercase;">
          TechNext Asia &mdash; Internal
        </p>
        <p style="margin:0;font-family:${FONT_DISPLAY};font-size:26px;font-weight:700;color:${C.white};">
          New Demo Booking
        </p>
      </td>
    </tr>

    <!-- SLOT HIGHLIGHT -->
    <tr>
      <td bgcolor="${C.green}" style="background:${C.green};padding:10px 32px;">
        <p style="margin:0;font-family:${FONT_BODY};font-size:13px;font-weight:700;color:${C.white};">
          ${slot}
        </p>
      </td>
    </tr>

    <!-- DETAILS -->
    <tr>
      <td bgcolor="${C.white}" style="background:${C.white};padding:28px 32px 8px;">

        <p style="margin:0 0 18px;font-family:${FONT_BODY};font-size:10px;font-weight:700;
                   color:${C.purple};text-transform:uppercase;letter-spacing:3px;">Lead Details</p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          ${[
            ['Name',             name    || '—'],
            ['Email',            email],
            ['Phone',            phone   || '—'],
            ['Company',          company || '—'],
            ['Service Interest', serviceLabel],
            ['Booked Slot',      slot],
          ].map(([label, value], i, arr) => `
          <tr>
            <td style="padding:10px 0;${i < arr.length - 1 ? `border-bottom:1px solid ${C.border};` : ''}vertical-align:top;width:36%;">
              <p style="margin:0;font-family:${FONT_BODY};font-size:11px;font-weight:700;
                         color:${C.muted};text-transform:uppercase;letter-spacing:1.5px;">${label}</p>
            </td>
            <td style="padding:10px 0 10px 16px;${i < arr.length - 1 ? `border-bottom:1px solid ${C.border};` : ''}vertical-align:top;">
              <p style="margin:0;font-family:${FONT_BODY};font-size:14px;font-weight:600;color:${C.text};">
                ${label === 'Email'
                  ? `<a href="mailto:${value}" style="color:${C.purple};text-decoration:none;">${value}</a>`
                  : value}
              </p>
            </td>
          </tr>`).join('')}
        </table>

        <!-- ACTION NOTE -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
          <tr>
            <td bgcolor="${C.purpleXl}"
                style="background:${C.purpleXl};border-left:3px solid ${C.purple};border-radius:0 10px 10px 0;padding:12px 16px;">
              <p style="margin:0;font-family:${FONT_BODY};font-size:13px;color:${C.text2};line-height:1.6;">
                A confirmation email has been sent to
                <a href="mailto:${email}" style="color:${C.purple};font-weight:700;text-decoration:none;">${email}</a>.
                Please prepare the video call link and send it to the client before the session.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td bgcolor="${C.bg}" style="background:${C.bg};padding:16px 32px;text-align:center;border-top:1px solid ${C.border};">
        <p style="margin:0;font-family:${FONT_BODY};font-size:11px;color:${C.muted};">
          TechNext Asia &nbsp;&middot;&nbsp; Internal booking notification &nbsp;&middot;&nbsp; hello@technext.asia
        </p>
      </td>
    </tr>

  </table>
</td></tr>
</table>
</body>
</html>`;

  /* ── Send both emails in parallel ── */
  const sendEmail = (to, toName, subject, htmlContent) =>
    fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
      body: JSON.stringify({
        sender:  { name: 'TechNext Asia', email: 'hello@technext.asia' },
        to:      [{ email: to, name: toName }],
        subject,
        htmlContent,
      })
    });

  try {
    const [confirmResp, notifyResp] = await Promise.all([
      sendEmail(email, name || email, `Your TechNext Demo is Confirmed — ${slot}`, confirmationHtml),
      sendEmail('hello@technext.asia', 'TechNext Team', `New Demo Booking: ${name || email} — ${slot}`, notifyHtml),
    ]);

    const confirmData = await confirmResp.json();
    const notifyData  = await notifyResp.json();

    if (!confirmResp.ok) {
      console.error('Confirmation email error:', confirmData);
      return res.status(500).json({ error: confirmData.message || 'Confirmation email failed' });
    }
    if (!notifyResp.ok) {
      console.error('Notify email error:', notifyData);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('send-confirmation error:', err);
    return res.status(500).json({ error: err.message });
  }
}
