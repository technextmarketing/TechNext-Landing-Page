export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, phone, email, company, message, service } = req.body || {};
  const ODOO_URL = process.env.ODOO_URL;
  const ODOO_DB  = process.env.ODOO_DB;
  const ODOO_USER = process.env.ODOO_USER;
  const ODOO_API_KEY = process.env.ODOO_API_KEY;

  if (!ODOO_URL || !ODOO_DB || !ODOO_USER || !ODOO_API_KEY) {
    return res.status(500).json({ error: 'Odoo env vars not configured' });
  }

  try {
    /* Step 1 — Authenticate with API key */
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

    /* Extract session cookie */
    const setCookie = authResp.headers.get('set-cookie') || '';
    const sessionMatch = setCookie.match(/session_id=([^;,\s]+)/);
    const sessionId = sessionMatch?.[1] || authData.result?.session_id || '';

    /* Step 2 — Create CRM lead */
    const leadName = `Demo Request — ${name}${company ? ` (${company})` : ''}`;
    const description = [
      service   ? `Service: ${service}`     : '',
      phone     ? `Phone: ${phone}`         : '',
      email     ? `Email: ${email}`         : '',
      message   ? `Challenge: ${message}`   : ''
    ].filter(Boolean).join('\n');

    const createResp = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session_id=${sessionId}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0', method: 'call', id: 2,
        params: {
          model: 'crm.lead',
          method: 'create',
          args: [{
            name:         leadName,
            contact_name: name    || '',
            email_from:   email   || '',
            phone:        phone   || '',
            partner_name: company || '',
            description:  description,
            type:         'lead'
          }],
          kwargs: {}
        }
      })
    });

    const createData = await createResp.json();
    if (createData.error) {
      console.error('Odoo create error:', createData.error);
      return res.status(500).json({ error: createData.error.data?.message || 'Lead creation failed' });
    }

    return res.status(200).json({ success: true, lead_id: createData.result });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
