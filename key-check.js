const http = require('http');
const url = require('url');

const PORT = 3456;
const API_HOST = 'localhost';
const API_PORT = 3000;

http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const key = parsed.query.key;

  if (!key || key.length < 5) {
    res.writeHead(400, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ valid: false }));
    return;
  }

  const options = {
    hostname: API_HOST,
    port: API_PORT,
    path: '/v1/api/users?limit=1',
    method: 'GET',
    headers: { 'X-Fix-Bug': key }
  };

  const proxyReq = http.request(options, (apiRes) => {
    let body = '';
    apiRes.on('data', chunk => body += chunk);
    apiRes.on('end', () => {
      const valid = apiRes.statusCode === 200;
      res.writeHead(valid ? 200 : 401, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ valid }));
    });
  });

  proxyReq.on('error', () => {
    res.writeHead(500, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ valid: false, error: 'server error' }));
  });

  proxyReq.end();
}).listen(PORT, () => {
  console.log(`Key validation proxy running on port ${PORT}`);
});
