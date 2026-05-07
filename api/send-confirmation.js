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

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f0f4ff">
  <tr><td align="center" style="padding:32px 16px;">

    <!-- Card -->
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(37,99,235,.12);">

      <!-- Header -->
      <tr>
        <td bgcolor="#1e3a8a" style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:36px 40px 28px;text-align:center;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:4px;color:rgba(255,255,255,.65);text-transform:uppercase;">TechNext Asia</p>
          <p style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Your Demo is Confirmed!</p>
          <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,.75);">Odoo ERP &amp; AI Automations</p>
        </td>
      </tr>

      <!-- Green check banner -->
      <tr>
        <td bgcolor="#16a34a" style="background:#16a34a;padding:14px 40px;text-align:center;">
          <p style="margin:0;font-size:13px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
            &#10003;&nbsp;&nbsp;Booking Confirmed — See you soon, ${firstName}!
          </p>
        </td>
      </tr>

      <!-- White body -->
      <tr>
        <td bgcolor="#ffffff" style="background:#ffffff;padding:40px 40px 32px;">

          <!-- Greeting -->
          <p style="margin:0 0 20px;font-size:16px;color:#1f2937;line-height:1.6;">
            Hi <strong>${name || 'there'}</strong>,
          </p>
          <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">
            Thank you for booking a free demo with TechNext Asia. We're excited to show you how
            <strong>Odoo ERP</strong> and <strong>AI Automations</strong> can transform your business operations.
          </p>

          <!-- Slot detail card -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
            <tr>
              <td bgcolor="#eff6ff" style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:14px;padding:24px 28px;">
                <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:3px;color:#2563eb;text-transform:uppercase;">Your Scheduled Demo</p>
                <p style="margin:0 0 4px;font-size:22px;font-weight:900;color:#1e3a8a;">${slot}</p>
                <p style="margin:0;font-size:13px;color:#6b7280;">30 minutes &nbsp;·&nbsp; Singapore Time (SGT) &nbsp;·&nbsp; Video Call</p>
              </td>
            </tr>
          </table>

          <!-- What to expect -->
          <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#1f2937;text-transform:uppercase;letter-spacing:1px;">What to Expect</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;">
                <table cellpadding="0" cellspacing="0" border="0"><tr>
                  <td style="padding-right:14px;vertical-align:top;">
                    <div style="width:32px;height:32px;background:#eff6ff;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">&#128269;</div>
                  </td>
                  <td style="vertical-align:top;">
                    <p style="margin:2px 0 2px;font-size:14px;font-weight:700;color:#1f2937;">Business Discovery</p>
                    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">We'll understand your current processes and pain points first.</p>
                  </td>
                </tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;">
                <table cellpadding="0" cellspacing="0" border="0"><tr>
                  <td style="padding-right:14px;vertical-align:top;">
                    <div style="width:32px;height:32px;background:#eff6ff;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">&#128187;</div>
                  </td>
                  <td style="vertical-align:top;">
                    <p style="margin:2px 0 2px;font-size:14px;font-weight:700;color:#1f2937;">Live Product Demo</p>
                    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">See Odoo ERP and AI automations live, tailored to your industry.</p>
                  </td>
                </tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;vertical-align:top;">
                <table cellpadding="0" cellspacing="0" border="0"><tr>
                  <td style="padding-right:14px;vertical-align:top;">
                    <div style="width:32px;height:32px;background:#eff6ff;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">&#128200;</div>
                  </td>
                  <td style="vertical-align:top;">
                    <p style="margin:2px 0 2px;font-size:14px;font-weight:700;color:#1f2937;">Custom Roadmap</p>
                    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">You'll leave with a clear implementation plan and next steps — no commitment required.</p>
                  </td>
                </tr></table>
              </td>
            </tr>
          </table>

          <!-- Questions note -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
            <tr>
              <td bgcolor="#fefce8" style="background:#fefce8;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;">
                <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">
                  <strong>Have questions before the call?</strong><br>
                  Reply to this email or reach us at
                  <a href="mailto:hello@technext.asia" style="color:#2563eb;text-decoration:none;font-weight:700;">hello@technext.asia</a> —
                  we typically respond within a few hours.
                </p>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 4px;font-size:15px;color:#1f2937;">Talk to you soon!</p>
          <p style="margin:0;font-size:14px;color:#6b7280;">The TechNext Asia Team</p>

        </td>
      </tr>

      <!-- Divider -->
      <tr><td bgcolor="#ffffff" style="background:#ffffff;padding:0 40px;"><div style="height:1px;background:#e5e7eb;"></div></td></tr>

      <!-- Footer -->
      <tr>
        <td bgcolor="#ffffff" style="background:#ffffff;padding:24px 40px 32px;text-align:center;">

          <!-- Social icons -->
          <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
            <tr>
              <td style="padding:0 6px;">
                <a href="https://web.facebook.com/technextasia" style="text-decoration:none;">
                  <img src="https://img.icons8.com/ios-filled/100/94A3B8/facebook-new.png" width="22" height="22" alt="Facebook" style="display:block;">
                </a>
              </td>
              <td style="padding:0 6px;">
                <a href="https://www.linkedin.com/company/technextasia/" style="text-decoration:none;">
                  <img src="https://img.icons8.com/ios-filled/100/94A3B8/linkedin.png" width="22" height="22" alt="LinkedIn" style="display:block;">
                </a>
              </td>
              <td style="padding:0 6px;">
                <a href="https://x.com/technextasia" style="text-decoration:none;">
                  <img src="https://img.icons8.com/ios-filled/100/94A3B8/twitterx--v1.png" width="22" height="22" alt="X" style="display:block;">
                </a>
              </td>
              <td style="padding:0 6px;">
                <a href="https://www.instagram.com/technextasia/" style="text-decoration:none;">
                  <img src="https://img.icons8.com/ios-filled/100/94A3B8/instagram-new.png" width="22" height="22" alt="Instagram" style="display:block;">
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">TechNext Asia &nbsp;·&nbsp; hello@technext.asia</p>
          <p style="margin:0;font-size:11px;color:#d1d5db;">Certified Odoo Ready Partner &nbsp;·&nbsp; Serving businesses worldwide</p>

        </td>
      </tr>

    </table>
    <!-- End card -->

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
