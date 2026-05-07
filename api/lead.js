// Vercel serverless function - POST form data, create a lead in Odoo CRM.
// Env vars (set in Vercel → Project → Settings → Environment Variables):
//   ODOO_URL      e.g. https://technext.odoo.com
//   ODOO_DB       database name (visible at /web/database/selector or in Settings)
//   ODOO_USER     login email, e.g. sky@technext.asia
//   ODOO_API_KEY  Odoo user API key (Settings → Users → Account Security → New API Key)
//   ODOO_TEAM_ID  optional, numeric Sales Team ID
//   ODOO_SOURCE   optional, free-text UTM source label (default "Landing Page")

async function odooRpc(url, service, method, args) {
  const r = await fetch(url + '/jsonrpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { service, method, args },
      id: Math.floor(Math.random() * 1e9),
    }),
  });
  if (!r.ok) throw new Error(`Odoo HTTP ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(j.error.data?.message || j.error.message || 'Odoo RPC error');
  return j.result;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ODOO_URL, ODOO_DB, ODOO_USER, ODOO_API_KEY, ODOO_TEAM_ID, ODOO_SOURCE } = process.env;
    if (!ODOO_URL || !ODOO_DB || !ODOO_USER || !ODOO_API_KEY) {
      return res.status(500).json({ error: 'Odoo env vars not configured' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const fname = (body.fname || '').toString().trim();
    const lname = (body.lname || '').toString().trim();
    const email = (body.email || '').toString().trim();
    const company = (body.company || '').toString().trim();
    const message = (body.message || '').toString().trim();
    const service = (body.service || '').toString().trim();

    if (!fname || !email) return res.status(400).json({ error: 'Name and email required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });

    const fullName = [fname, lname].filter(Boolean).join(' ');
    const serviceLabel = { odoo: 'Odoo ERP Implementation', ai: 'AI Automations', both: 'Both - Full Package' }[service] || service || 'Unspecified';

    const uid = await odooRpc(ODOO_URL, 'common', 'login', [ODOO_DB, ODOO_USER, ODOO_API_KEY]);
    if (!uid) return res.status(502).json({ error: 'Odoo authentication failed' });

    const lead = {
      name: `[Landing Page] ${fullName}${company ? ' - ' + company : ''} (${serviceLabel})`,
      contact_name: fullName,
      partner_name: company || false,
      email_from: email,
      description: [
        `Service interest: ${serviceLabel}`,
        message ? `\nChallenge: ${message}` : '',
        `\nSubmitted: ${new Date().toISOString()}`,
        `Source: ${ODOO_SOURCE || 'Landing Page'}`,
      ].join('\n'),
      type: 'opportunity',
    };
    if (ODOO_TEAM_ID) lead.team_id = Number(ODOO_TEAM_ID);

    const leadId = await odooRpc(ODOO_URL, 'object', 'execute_kw', [
      ODOO_DB, uid, ODOO_API_KEY, 'crm.lead', 'create', [lead],
    ]);

    return res.status(200).json({ ok: true, id: leadId });
  } catch (e) {
    console.error('lead error:', e);
    return res.status(500).json({ error: 'Failed to create lead', detail: String(e.message || e) });
  }
}
