// Simple Express proxy for Spectrum.fi and ErgoWatch APIs
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5050;
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// Use CORS middleware for local dev (must be before all routes)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// --- Ergo Explorer Mirror Logic ---
const API_CONFIG = {
  primary: {
    name: 'Ergoplatform',
    base: 'https://api.ergoplatform.com',
    api: 'https://api.ergoplatform.com/api/v1',
  },
  backup: {
    name: 'Cornell',
    base: 'https://api.ergo.aap.cornell.edu',
    api: 'https://api.ergo.aap.cornell.edu/api/v1',
  },
  timeout: 10000,
  retryDelay: 1000
};

function timeoutFetch(url, options = {}, timeout = API_CONFIG.timeout) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    fetch(url, { ...options, signal: controller.signal })
      .then(res => {
        clearTimeout(id);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(id);
        reject(err);
      });
  });
}

async function fetchWithFallback(primaryUrl, backupUrl, options = {}) {
  try {
    logActivity(`Trying primary API: ${primaryUrl}`);
    const response = await timeoutFetch(primaryUrl, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    logActivity(`Primary API successful: ${primaryUrl}`);
    return { response, source: API_CONFIG.primary.name };
  } catch (primaryError) {
    logActivity(`Primary API failed: ${primaryUrl} - ${primaryError.message}`);
    logActivity(`Trying backup API: ${backupUrl}`);
    await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay));
    try {
      const response = await timeoutFetch(backupUrl, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      logActivity(`Backup API successful: ${backupUrl}`);
      return { response, source: API_CONFIG.backup.name };
    } catch (backupError) {
      logActivity(`Both APIs failed: Primary: ${primaryError.message}, Backup: ${backupError.message}`);
      throw new Error(`All APIs failed - Primary: ${primaryError.message}, Backup: ${backupError.message}`);
    }
  }
}
const knownAddresses = require('../src/utils/knownAddresses.cjs');
let addressMirror = {};
let flowMirror = [];
let lastBlockIds = [];
const MIRROR_PATH = path.join(__dirname, 'ergomirror.json');

// Helper: classify address type
function classify(addr) {
  if (!addr) return { type: 'Unknown', label: 'Unknown' };
  // Use the shared JS classifier for consistency
  return knownAddresses.classifyAddress(addr);
}

// Logging helper
function logActivity(...args) {
  const now = new Date().toISOString();
  console.log(`[${now}]`, ...args);
}

// Save mirror to disk
function saveMirror() {
  try {
    fs.writeFileSync(MIRROR_PATH, JSON.stringify({ addresses: addressMirror, flows: flowMirror, lastBlockIds }));
    logActivity('[ErgoMirror] Saved to disk');
  } catch (e) {
    logActivity('[ErgoMirror] Save failed:', e);
  }
}

// Load mirror from disk
function loadMirror() {
  try {
    if (fs.existsSync(MIRROR_PATH)) {
      const data = JSON.parse(fs.readFileSync(MIRROR_PATH, 'utf8'));
      addressMirror = data.addresses || {};
      flowMirror = data.flows || [];
      lastBlockIds = data.lastBlockIds || [];
      logActivity('[ErgoMirror] Loaded from disk');
    }
  } catch (e) {
    logActivity('[ErgoMirror] Load failed:', e);
  }
}

// Fetch and update mirror from explorer
async function updateMirror() {
  try {
    logActivity('Starting mirror update...');
    // Fetch block IDs with fallback
    const primaryBlocksUrl = `${API_CONFIG.primary.api}/blocks?limit=100`;
    const backupBlocksUrl = `${API_CONFIG.backup.api}/blocks?limit=100`;
    const { response: blockIdsRes, source: blocksSource } = await fetchWithFallback(primaryBlocksUrl, backupBlocksUrl);
    logActivity(`Fetched block IDs from explorer (${blocksSource})`);
    const blockData = await blockIdsRes.json();
    const blockIds = blockData.items.map(b => b.id);
    // Only fetch new blocks
    const newBlockIds = blockIds.filter(id => !lastBlockIds.includes(id));
    logActivity(`New block IDs: ${newBlockIds.length}`);
    lastBlockIds = blockIds;
    if (newBlockIds.length === 0 && flowMirror.length > 0) {
      logActivity('No new blocks. Skipping update.');
      return; // No new blocks
    }
    let blocks = [];
    let newAddresses = 0;
    let newFlows = 0;
    for (const blockId of newBlockIds) {
      try {
        // Try /transactions/byBlockId first (primary then backup)
        let transactions = null;
        let txRes, txSource;
        try {
          const primaryTxUrl = `${API_CONFIG.primary.api}/transactions/byBlockId/${blockId}`;
          const backupTxUrl = `${API_CONFIG.backup.api}/transactions/byBlockId/${blockId}`;
          const txResult = await fetchWithFallback(primaryTxUrl, backupTxUrl);
          txRes = txResult.response;
          txSource = txResult.source;
        } catch (txErr) {
          logActivity(`Both /transactions/byBlockId failed for block ${blockId}: ${txErr.message}`);
        }
        if (txRes && txRes.ok) {
          transactions = await txRes.json();
          if (!Array.isArray(transactions) || transactions.length === 0) {
            logActivity(`No transactions from /transactions/byBlockId for block ${blockId} (${txSource}), trying /blocks/{blockId}`);
            transactions = null;
          } else {
            logActivity(`Fetched ${transactions.length} txs from /transactions/byBlockId for block ${blockId} (${txSource})`);
          }
        }
        if (!transactions) {
          // fallback to /blocks/{blockId} and then fetch each tx by ID
          let blockRes, blockSource;
          try {
            const primaryBlockUrl = `${API_CONFIG.primary.api}/blocks/${blockId}`;
            const backupBlockUrl = `${API_CONFIG.backup.api}/blocks/${blockId}`;
            const blockResult = await fetchWithFallback(primaryBlockUrl, backupBlockUrl);
            blockRes = blockResult.response;
            blockSource = blockResult.source;
          } catch (blockErr) {
            logActivity(`Both /blocks/{blockId} failed for block ${blockId}: ${blockErr.message}`);
          }
          if (blockRes && blockRes.ok) {
            const blockObj = await blockRes.json();
            // Always log type and keys of block object for diagnostics
            logActivity(`[DEBUG] Block object for ${blockId} (${blockSource}): type=${typeof blockObj}, keys=${blockObj ? Object.keys(blockObj).join(',') : 'null/undefined'}`);
            // Use blockObj.block.blockTransactions if available, else blockObj.block.transactions
            let txIds = [];
            const block = blockObj && blockObj.block ? blockObj.block : null;
            if (block && Array.isArray(block.blockTransactions) && block.blockTransactions.length > 0) {
              txIds = block.blockTransactions.map(tx => tx.id);
              logActivity(`Fetched block ${blockId} with ${txIds.length} tx IDs (via block.blockTransactions, ${blockSource}), fetching each tx...`);
            } else if (block && Array.isArray(block.transactions) && block.transactions.length > 0) {
              txIds = block.transactions;
              logActivity(`Fetched block ${blockId} with ${txIds.length} tx IDs (via block.transactions, ${blockSource}), fetching each tx...`);
            } else {
              logActivity(`No transaction IDs found in block ${blockId} (${blockSource})`);
              // Debug: log the full block response (truncated for safety)
              try {
                const blockStr = JSON.stringify(blockObj);
                logActivity(`[DEBUG] Full block response for ${blockId} (${blockSource}):`, blockStr && blockStr.length > 2000 ? blockStr.slice(0, 2000) + '... [truncated]' : blockStr);
              } catch (e) {
                logActivity(`[DEBUG] Could not stringify block for ${blockId}:`, e);
              }
              continue;
            }
            transactions = [];
            for (const txId of txIds) {
              let txDetailRes, txDetailSource;
              try {
                const primaryTxDetailUrl = `${API_CONFIG.primary.api}/transactions/${txId}`;
                const backupTxDetailUrl = `${API_CONFIG.backup.api}/transactions/${txId}`;
                const txDetailResult = await fetchWithFallback(primaryTxDetailUrl, backupTxDetailUrl);
                txDetailRes = txDetailResult.response;
                txDetailSource = txDetailResult.source;
              } catch (txDetailErr) {
                logActivity(`Both /transactions/{txId} failed for tx ${txId} in block ${blockId}: ${txDetailErr.message}`);
                continue;
              }
              if (txDetailRes && txDetailRes.ok) {
                const txDetail = await txDetailRes.json();
                transactions.push(txDetail);
                logActivity(`Fetched tx ${txId} for block ${blockId} (${txDetailSource})`);
              } else {
                logActivity(`Failed to fetch tx ${txId} for block ${blockId}`);
              }
            }
            logActivity(`Fetched ${transactions.length} tx details for block ${blockId}`);
            if (transactions.length === 0) {
              logActivity(`No transaction details found for block ${blockId}`);
              continue;
            }
          } else {
            logActivity(`Failed to fetch /blocks/{blockId} for block ${blockId}`);
            continue;
          }
        }
        // ...existing code...
        // Analyze transactions for addresses, flows, and ERG volume
        let blockErgVolume = 0;
        for (const tx of transactions) {
          for (const input of tx.inputs || []) {
            if (input.address) {
              if (!addressMirror[input.address]) newAddresses++;
              addressMirror[input.address] = classify(input.address);
            }
          }
          for (const output of tx.outputs || []) {
            if (output.address) {
              if (!addressMirror[output.address]) newAddresses++;
              addressMirror[output.address] = classify(output.address);
            }
            if (typeof output.value === 'number') {
              blockErgVolume += output.value;
            }
          }
          // Build flows
          for (const input of tx.inputs || []) {
            for (const output of tx.outputs || []) {
              if (input.address && output.address && input.address !== output.address) {
                flowMirror.push({
                  fromAddress: input.address,
                  toAddress: output.address,
                  fromType: classify(input.address).type,
                  toType: classify(output.address).type,
                  value: Math.round((output.value ?? 0) / 1e9 * 1000) / 1000,
                });
                newFlows++;
              }
            }
          }
        }
        logActivity(`Block ${blockId} ERG volume: ${Math.round(blockErgVolume / 1e9 * 1000) / 1000} ERG`);
      } catch (err) {
        logActivity(`Error fetching transactions for block ${blockId}:`, err);
      }
    }
    // Cap flows to last 500
    if (flowMirror.length > 500) flowMirror = flowMirror.slice(-500);
    logActivity(`[ErgoMirror] Updated: ${Object.keys(addressMirror).length} addresses, ${flowMirror.length} flows. (+${newAddresses} new addresses, +${newFlows} new flows)`);
    saveMirror();
  } catch (err) {
    logActivity('[ErgoMirror] Update failed:', err);
  }
}

// Load mirror from disk if available
loadMirror();
// Initial mirror build
updateMirror();
// Schedule updates every 2 minutes
setInterval(updateMirror, 120000);

// API endpoint for frontend to fetch categorized addresses and flows
app.get('/api/ergoflow-mirror', (req, res) => {
  logActivity('API /api/ergoflow-mirror requested');
  logActivity(`[DEBUG] Mirror state: addresses=${Object.keys(addressMirror).length}, flows=${flowMirror.length}`);
  // Optionally log a sample flow for inspection
  if (flowMirror.length > 0) {
    logActivity('[DEBUG] Sample flow:', JSON.stringify(flowMirror[0]));
  }
  res.json({ addresses: addressMirror, flows: flowMirror });
});

// ...existing code...

// Proxy for Spectrum.fi
app.get('/proxy/spectrum', async (req, res) => {
  const { url } = req.query;
  logActivity('Proxy /proxy/spectrum requested:', url);
  if (!url || !url.startsWith('https://api.spectrum.fi/')) {
    logActivity('Proxy /proxy/spectrum invalid or missing url param');
    return res.status(400).json({ error: 'Invalid or missing url param' });
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      logActivity(`[Proxy][Spectrum] Upstream error: ${response.status} ${response.statusText} - ${text}`);
      return res.status(502).json({ error: `Upstream error: ${response.status} ${response.statusText}`, details: text });
    }
    const data = await response.json();
    logActivity('Proxy /proxy/spectrum success');
    res.json(data);
  } catch (e) {
    logActivity('[Proxy][Spectrum] Fetch failed:', e);
    res.status(500).json({ error: e.message });
  }
});

// Proxy for ErgoWatch
app.get('/proxy/ergowatch', async (req, res) => {
  const { url } = req.query;
  logActivity('Proxy /proxy/ergowatch requested:', url);
  // Allow https://api.ergo.watch/, https://api.ergowatch.org/, and https://api.ergoplatform.com/
  if (!url || (!url.startsWith('https://api.ergo.watch/') && !url.startsWith('https://api.ergowatch.org/') && !url.startsWith('https://api.ergoplatform.com/'))) {
    logActivity('Proxy /proxy/ergowatch invalid or missing url param');
    return res.status(400).json({ error: 'Invalid or missing url param' });
  }
  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) {
      const text = await response.text();
      logActivity(`[Proxy][ErgoWatch] Upstream error: ${response.status} ${response.statusText} - ${text}`);
      return res.status(502).json({ error: `Upstream error: ${response.status} ${response.statusText}`, details: text });
    }
    if (!contentType.includes('application/json')) {
      const rawText = await response.text();
      logActivity(`[Proxy][ErgoWatch] Upstream returned non-JSON content-type (${contentType}) for 200 response. Raw:`, rawText);
      return res.status(502).json({ error: `Upstream returned non-JSON content-type (${contentType})`, details: rawText });
    }
    const data = await response.json();
    logActivity('Proxy /proxy/ergowatch success');
    res.json(data);
  } catch (e) {
    logActivity('[Proxy][ErgoWatch] Fetch failed:', e);
    res.status(500).json({ error: e.message });
  }
});

// Manual save endpoint for ergomirror
app.post('/api/save-ergomirror', (req, res) => {
  saveMirror();
  logActivity('Manual save triggered via /api/save-ergomirror');
  res.json({ status: 'saved' });
});

app.listen(PORT, () => {
  logActivity(`Proxy server running on http://localhost:${PORT}`);
});
