const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    process.env[key] = value;
  }
}

const SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;

const YOOKASSA_API = '/v3/payments';
const YOOKASSA_HOST = 'api.yookassa.ru';
const PORT = 3457;

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function yookassaRequest(amount) {
  return new Promise((resolve, reject) => {
    const idempotenceKey = uuid();
    const body = JSON.stringify({
      amount: {
        value: String(amount),
        currency: 'RUB'
      },
      confirmation: {
        type: 'embedded'
      },
      capture: true,
      description: 'Оплата доступа к API eddytester.com'
    });

    const auth = Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString('base64');

    const options = {
      hostname: YOOKASSA_HOST,
      path: YOOKASSA_API,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
        'Authorization': `Basic ${auth}`
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.description || 'YooKassa error'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, statusCode, data) {
  setCors(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function send404(res) {
  setCors(res);
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
}

const server = http.createServer((req, res) => {
  const { method, url } = req;

  // CORS preflight
  if (method === 'OPTIONS' && url === '/create-payment') {
    setCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // Only POST /create-payment
  if (method === 'POST' && url === '/create-payment') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      let amount = 0;
      try {
        const parsed = JSON.parse(body);
        amount = parsed.amount != null ? parsed.amount : 2900;
      } catch (e) {
        sendJson(res, 500, { success: false, error: e.message });
        return;
      }

      try {
        const payment = await yookassaRequest(amount);
        const result = {
          success: true,
          payment_id: payment.id,
          confirmation_token: payment.confirmation.confirmation_token || payment.confirmation.url,
          status: payment.status
        };
        console.log(`[payment] Created: ${payment.id} amount: ${amount}`);
        sendJson(res, 200, result);
      } catch (e) {
        console.log(`[payment] Error: ${e.message}`);
        sendJson(res, 500, { success: false, error: e.message });
      }
    });
    return;
  }

  // Everything else — 404
  send404(res);
});

server.listen(PORT, () => {
  console.log(`[payment] YooKassa server running on port ${PORT}`);
  console.log(`[payment] Shop ID: ${SHOP_ID}`);
});
