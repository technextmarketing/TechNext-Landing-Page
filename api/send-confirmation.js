export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, slot } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) return res.status(500).json({ error: 'BREVO_API_KEY not configured' });

  const firstName = name ? name.split(' ')[0] : 'there';

  /* ─── Design tokens (mirrors Landing Page.html :root) ─── */
  const C = {
    purple:      '#2563EB',
    purpleDeep:  '#4338CA',
    purpleLight: '#DBEAFE',
    purpleXl:    '#EFF6FF',
    green:       '#059669',
    greenLight:  '#D1FAE5',
    bg:          '#FAFAF7',
    white:       '#FFFFFF',
    text:        '#1F2937',
    text2:       '#374151',
    muted:       '#6B7280',
    border:      '#E5E7EB',
    dark:        '#111827',
  };

  /* ─── Icon URLs (hosted PNG, Gmail-safe) ─── */
  const LOGO = 'https://technextmarketing.github.io/TechNext-Landing-Page/images/TechNext-Logo.png';
  const ICON_SEARCH  = 'https://cdn-icons-png.flaticon.com/128/1320/1320974.png';
  const ICON_SCREEN  = 'https://cdn-icons-png.flaticon.com/128/1320/1320988.png';
  const ICON_ROCKET  = 'https://cdn-icons-png.flaticon.com/128/1320/1320960.png';
  const ICON_FB      = 'https://img.icons8.com/ios-filled/100/94A3B8/facebook-new.png';
  const ICON_LI      = 'https://img.icons8.com/ios-filled/100/94A3B8/linkedin.png';
  const ICON_X       = 'https://img.icons8.com/ios-filled/100/94A3B8/twitterx--v1.png';
  const ICON_IG      = 'https://img.icons8.com/ios-filled/100/94A3B8/instagram-new.png';

  /* ─── Font stack ─── */
  /* Caveat (display) + Plus Jakarta Sans (body) via Google Fonts.
     Supported by Apple Mail, Outlook desktop, Thunderbird.
     Gmail webmail falls back to the Arial/Georgia stacks. */
  const FONT_BODY    = "'Plus Jakarta Sans', Arial, Helvetica, sans-serif";
  const FONT_DISPLAY = "'Caveat', Georgia, cursive";

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Your TechNext Demo is Confirmed</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Caveat:wght@700&display=swap');
    body { margin:0; padding:0; background-color:${C.bg}; }
    .body-wrap { background-color:${C.bg}; }
    @media only screen and (max-width:620px) {
      .card { width:100% !important; border-radius:0 !important; }
      .pad  { padding-left:24px !important; padding-right:24px !important; }
      .slot-card { padding:18px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};" class="body-wrap">

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="background-color:${C.bg};">
<tr><td align="center" style="padding:32px 16px;">

  <!-- ── CARD ── -->
  <table class="card" width="600" cellpadding="0" cellspacing="0" border="0"
         style="max-width:600px;width:100%;background-color:${C.white};border-radius:20px;overflow:hidden;box-shadow:0 12px 48px rgba(37,99,235,.13);">

    <!-- ── HEADER ── -->
    <tr>
      <td bgcolor="${C.purple}"
          style="background:linear-gradient(160deg,${C.purple} 0%,${C.purpleDeep} 100%);padding:36px 40px 32px;text-align:center;"
          class="pad">

        <!-- Logo -->
        <img src="${LOGO}" width="140" alt="TechNext Asia"
             style="display:inline-block;height:auto;margin-bottom:20px;filter:brightness(0) invert(1);">

        <!-- Divider accent -->
        <div style="width:40px;height:3px;background:rgba(255,255,255,.45);border-radius:2px;margin:0 auto 20px;"></div>

        <!-- Display heading -->
        <p style="margin:0;font-family:${FONT_DISPLAY};font-size:38px;font-weight:700;color:${C.white};line-height:1.15;letter-spacing:0.5px;">
          Demo Confirmed
        </p>
        <p style="margin:10px 0 0;font-family:${FONT_BODY};font-size:13px;font-weight:500;color:rgba(255,255,255,.72);letter-spacing:0.3px;">
          Odoo ERP &amp; AI Automations for Growing Businesses
        </p>

      </td>
    </tr>

    <!-- ── CONFIRMED STRIP ── -->
    <tr>
      <td bgcolor="${C.green}"
          style="background:${C.green};padding:12px 40px;text-align:center;" class="pad">
        <p style="margin:0;font-family:${FONT_BODY};font-size:13px;font-weight:700;color:${C.white};letter-spacing:0.4px;">
          Booking Confirmed &mdash; See you soon, ${firstName}!
        </p>
      </td>
    </tr>

    <!-- ── BODY ── -->
    <tr>
      <td bgcolor="${C.white}"
          style="background:${C.white};padding:40px 40px 12px;" class="pad">

        <!-- Greeting -->
        <p style="margin:0 0 8px;font-family:${FONT_BODY};font-size:16px;font-weight:700;color:${C.text};">
          Hi ${name || 'there'},
        </p>
        <p style="margin:0 0 28px;font-family:${FONT_BODY};font-size:14px;font-weight:400;color:${C.text2};line-height:1.75;">
          Thank you for booking a free demo with TechNext Asia. We are looking forward to showing you
          how <span style="font-weight:700;color:${C.text};">Odoo ERP</span> and
          <span style="font-weight:700;color:${C.text};">AI Automations</span> can streamline your
          business operations &mdash; from accounting and inventory to intelligent workflows.
        </p>

        <!-- ── SLOT CARD ── -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
          <tr>
            <td bgcolor="${C.purpleXl}"
                style="background:${C.purpleXl};border:1.5px solid ${C.purpleLight};border-radius:14px;padding:24px 28px;"
                class="slot-card">

              <!-- Label -->
              <p style="margin:0 0 10px;font-family:${FONT_BODY};font-size:10px;font-weight:700;
                         color:${C.purple};text-transform:uppercase;letter-spacing:3px;">
                Your Scheduled Demo
              </p>

              <!-- Slot value in Caveat -->
              <p style="margin:0 0 8px;font-family:${FONT_DISPLAY};font-size:28px;font-weight:700;
                         color:${C.text};line-height:1.2;">
                ${slot}
              </p>

              <!-- Meta row -->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:16px;">
                    <p style="margin:0;font-family:${FONT_BODY};font-size:12px;font-weight:600;color:${C.muted};">
                      30 minutes
                    </p>
                  </td>
                  <td style="padding-right:16px;">
                    <p style="margin:0;font-family:${FONT_BODY};font-size:12px;font-weight:600;color:${C.muted};">
                      Singapore Time (SGT)
                    </p>
                  </td>
                  <td>
                    <p style="margin:0;font-family:${FONT_BODY};font-size:12px;font-weight:600;color:${C.muted};">
                      Video Call
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- ── SECTION LABEL ── -->
        <p style="margin:0 0 16px;font-family:${FONT_BODY};font-size:10px;font-weight:700;
                   color:${C.purple};text-transform:uppercase;letter-spacing:3px;">
          What to Expect
        </p>

        <!-- ── EXPECT ROWS ── -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">

          <!-- Row 1 -->
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid ${C.border};vertical-align:middle;">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="padding-right:16px;vertical-align:middle;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr><td bgcolor="${C.purpleXl}"
                             style="background:${C.purpleXl};width:40px;height:40px;border-radius:10px;text-align:center;vertical-align:middle;">
                      <img src="${ICON_SEARCH}" width="20" height="20" alt=""
                           style="display:inline-block;vertical-align:middle;margin-top:10px;">
                    </td></tr>
                  </table>
                </td>
                <td style="vertical-align:middle;">
                  <p style="margin:0 0 3px;font-family:${FONT_BODY};font-size:14px;font-weight:700;color:${C.text};">
                    Business Discovery
                  </p>
                  <p style="margin:0;font-family:${FONT_BODY};font-size:13px;font-weight:400;color:${C.muted};line-height:1.55;">
                    We start by understanding your current processes and biggest pain points.
                  </p>
                </td>
              </tr></table>
            </td>
          </tr>

          <!-- Row 2 -->
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid ${C.border};vertical-align:middle;">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="padding-right:16px;vertical-align:middle;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr><td bgcolor="${C.purpleXl}"
                             style="background:${C.purpleXl};width:40px;height:40px;border-radius:10px;text-align:center;vertical-align:middle;">
                      <img src="${ICON_SCREEN}" width="20" height="20" alt=""
                           style="display:inline-block;vertical-align:middle;margin-top:10px;">
                    </td></tr>
                  </table>
                </td>
                <td style="vertical-align:middle;">
                  <p style="margin:0 0 3px;font-family:${FONT_BODY};font-size:14px;font-weight:700;color:${C.text};">
                    Live Product Demo
                  </p>
                  <p style="margin:0;font-family:${FONT_BODY};font-size:13px;font-weight:400;color:${C.muted};line-height:1.55;">
                    See Odoo ERP and AI automations in action, tailored to your industry.
                  </p>
                </td>
              </tr></table>
            </td>
          </tr>

          <!-- Row 3 -->
          <tr>
            <td style="padding:12px 0;vertical-align:middle;">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="padding-right:16px;vertical-align:middle;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr><td bgcolor="${C.purpleXl}"
                             style="background:${C.purpleXl};width:40px;height:40px;border-radius:10px;text-align:center;vertical-align:middle;">
                      <img src="${ICON_ROCKET}" width="20" height="20" alt=""
                           style="display:inline-block;vertical-align:middle;margin-top:10px;">
                    </td></tr>
                  </table>
                </td>
                <td style="vertical-align:middle;">
                  <p style="margin:0 0 3px;font-family:${FONT_BODY};font-size:14px;font-weight:700;color:${C.text};">
                    Your Custom Roadmap
                  </p>
                  <p style="margin:0;font-family:${FONT_BODY};font-size:13px;font-weight:400;color:${C.muted};line-height:1.55;">
                    You will leave with a clear implementation plan &mdash; no commitment required.
                  </p>
                </td>
              </tr></table>
            </td>
          </tr>

        </table>

        <!-- ── QUESTION NOTE ── -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
          <tr>
            <td bgcolor="${C.purpleXl}"
                style="background:${C.purpleXl};border-left:3px solid ${C.purple};border-radius:0 10px 10px 0;padding:14px 18px;">
              <p style="margin:0;font-family:${FONT_BODY};font-size:13px;font-weight:400;color:${C.text2};line-height:1.65;">
                <span style="font-weight:700;color:${C.text};">Have questions before the call?</span><br>
                Reply to this email or write to us at
                <a href="mailto:hello@technext.asia"
                   style="color:${C.purple};font-weight:700;text-decoration:none;">hello@technext.asia</a>
                &mdash; we respond within a few hours.
              </p>
            </td>
          </tr>
        </table>

        <!-- Sign-off -->
        <p style="margin:0 0 4px;font-family:${FONT_BODY};font-size:14px;font-weight:600;color:${C.text};">
          Talk to you soon,
        </p>
        <p style="margin:0 0 40px;font-family:${FONT_BODY};font-size:13px;font-weight:400;color:${C.muted};">
          The TechNext Asia Team
        </p>

      </td>
    </tr>

    <!-- ── FOOTER ── -->
    <tr>
      <td bgcolor="${C.dark}"
          style="background:${C.dark};padding:28px 40px 32px;text-align:center;" class="pad">

        <!-- Social icons -->
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
          <tr>
            <td style="padding:0 8px;">
              <a href="https://web.facebook.com/technextasia" style="text-decoration:none;">
                <img src="${ICON_FB}" width="20" height="20" alt="Facebook" style="display:block;">
              </a>
            </td>
            <td style="padding:0 8px;">
              <a href="https://www.linkedin.com/company/technextasia/" style="text-decoration:none;">
                <img src="${ICON_LI}" width="20" height="20" alt="LinkedIn" style="display:block;">
              </a>
            </td>
            <td style="padding:0 8px;">
              <a href="https://x.com/technextasia" style="text-decoration:none;">
                <img src="${ICON_X}" width="20" height="20" alt="X" style="display:block;">
              </a>
            </td>
            <td style="padding:0 8px;">
              <a href="https://www.instagram.com/technextasia/" style="text-decoration:none;">
                <img src="${ICON_IG}" width="20" height="20" alt="Instagram" style="display:block;">
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 5px;font-family:${FONT_BODY};font-size:12px;font-weight:600;color:rgba(255,255,255,.75);">
          TechNext Asia &nbsp;&middot;&nbsp; hello@technext.asia
        </p>
        <p style="margin:0;font-family:${FONT_BODY};font-size:11px;font-weight:400;color:rgba(255,255,255,.38);">
          Certified Odoo Ready Partner &nbsp;&middot;&nbsp; Serving businesses worldwide
        </p>

      </td>
    </tr>

  </table>
  <!-- ── END CARD ── -->

</td></tr>
</table>

</body>
</html>`;

  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender:      { name: 'TechNext Asia', email: 'hello@technext.asia' },
        to:          [{ email, name: name || email }],
        subject:     `Your TechNext Demo is Confirmed — ${slot}`,
        htmlContent
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error('Brevo error:', data);
      return res.status(500).json({ error: data.message || 'Email send failed' });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('send-confirmation error:', err);
    return res.status(500).json({ error: err.message });
  }
}
