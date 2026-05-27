const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200); res.end(); return;
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body);
        const apiKey = process.env.ANTHROPIC_API_KEY;
        const apiHeaders = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        };

        let modelToUse = 'claude-3-5-sonnet-20241022';
        try {
          const mr = await fetch('https://api.anthropic.com/v1/models', { headers: apiHeaders });
          const md = await mr.json();
          if (md.data?.length > 0) {
            const s = md.data.find(m => m.id.includes('sonnet'));
            const h = md.data.find(m => m.id.includes('haiku'));
            modelToUse = (s || h || md.data[0]).id;
            console.log('Using model:', modelToUse);
          }
        } catch(e) { console.log('Model fetch error:', e.message); }

        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: apiHeaders,
          body: JSON.stringify({ ...parsed, model: modelToUse }),
        });
        const data = await r.json();
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(data));
      } catch(e) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'GET') {
    const file = req.url === '/' ? '/index.html' : req.url;
    const fp = path.join(__dirname, 'public', file);
    if (fs.existsSync(fp)) {
      const ext = path.extname(fp);
      const mime = ext === '.html' ? 'text/html' : ext === '.js' ? 'application/javascript' : 'text/plain';
      res.writeHead(200, {'Content-Type': mime});
      res.end(fs.readFileSync(fp));
    } else {
      res.writeHead(404); res.end('Not found');
    }
    return;
  }

  res.writeHead(405); res.end();
}).listen(PORT, () => console.log('Server running on port', PORT));
