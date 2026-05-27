const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const apiHeaders = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    };

    // Get available models first
    let modelToUse = 'claude-3-5-sonnet-20241022';
    try {
      const mr = await fetch('https://api.anthropic.com/v1/models', { headers: apiHeaders });
      const md = await mr.json();
      if (md.data?.length > 0) {
        const sonnet = md.data.find(m => m.id.includes('sonnet'));
        const haiku = md.data.find(m => m.id.includes('haiku'));
        modelToUse = (sonnet || haiku || md.data[0]).id;
        console.log('Using model:', modelToUse);
      }
    } catch(e) { console.log('Model fetch failed:', e.message); }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({ ...req.body, model: modelToUse }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
