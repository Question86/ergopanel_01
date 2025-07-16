// Simple Express proxy for Spectrum.fi and ErgoWatch APIs
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5050;

// Allow CORS for local dev
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Proxy for Spectrum.fi
app.get('/proxy/spectrum', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('https://api.spectrum.fi/')) {
    return res.status(400).json({ error: 'Invalid or missing url param' });
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      console.error(`[Proxy][Spectrum] Upstream error: ${response.status} ${response.statusText} - ${text}`);
      return res.status(502).json({ error: `Upstream error: ${response.status} ${response.statusText}`, details: text });
    }
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('[Proxy][Spectrum] Fetch failed:', e);
    res.status(500).json({ error: e.message });
  }
});

// Proxy for ErgoWatch
app.get('/proxy/ergowatch', async (req, res) => {
  const { url } = req.query;
  // Allow all endpoints under https://api.ergo.watch/
  if (!url || !url.startsWith('https://api.ergo.watch/')) {
    return res.status(400).json({ error: 'Invalid or missing url param' });
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      console.error(`[Proxy][ErgoWatch] Upstream error: ${response.status} ${response.statusText} - ${text}`);
      return res.status(502).json({ error: `Upstream error: ${response.status} ${response.statusText}`, details: text });
    }
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('[Proxy][ErgoWatch] Fetch failed:', e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
