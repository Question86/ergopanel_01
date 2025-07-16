# Ergo Dashboard Project: Code Structure & Process Summary (July 2025)

## Project Overview
The Ergo Dashboard is a live visualization tool for tracking real-time flows on the Ergo blockchain, focusing on emission, miners, exchanges, and private wallets. It uses your own node for data, with explorer API fallback for address resolution, and displays flows in a modern React dashboard.

---

## Main Processes

### 1. Data Fetching
- **Blocks & Transactions:**
  - Fetches recent block hashes from your node (`/blocks?limit=50`).
  - Loads full block data and extracts all transaction inputs and outputs.
- **Mempool:**
  - Optionally fetches unconfirmed transactions for live updates.

### 2. Address Resolution
- **Inputs:**
  - Tries to decode input box addresses from node data using `ergo-lib-wasm-browser` (P2PK only).
  - If decoding fails, queries the explorer API (via proxy) for the address.
- **Outputs:**
  - Uses output `address` field if present.
  - If missing, decodes from `ergoTree` or falls back to explorer API.

### 3. Flow Construction
- For each transaction, builds flow objects:
  - `fromAddress`, `toAddress`, `fromType`, `toType`, `value` (ERG)
  - Classifies addresses as Emission, Miner, Exchange, or Private using `knownAddresses.ts`.
- Skips flows if either address cannot be resolved.

### 4. Visualization
- **Frontend:**
  - React + Vite app displays flows in a heatmap/graph panel.
  - Color codes for entity types (Emission, Miner, Exchange, Private).
  - Updates when new flows are fetched.

### 5. Explorer Proxy
- **Proxy Server:**
  - Express server (`proxy-server.cjs`) proxies explorer API requests to avoid CORS issues.
  - All explorer API calls from backend/frontend go through `http://localhost:5050/proxy/ergowatch?url=...`.

---

## Code Structure

- `src/utils/ergoflow.ts`: Main backend logic for fetching, decoding, and classifying flows.
- `src/utils/knownAddresses.ts`: Maps addresses to entity types (miner, exchange, emission, private).
- `proxy/proxy-server.cjs`: Express proxy for explorer and other APIs.
- `src/components/`: React components for dashboard panels and visualizations.
- `public/`, `index.html`, `main.tsx`: Standard Vite/React app structure.

---

## Key Lessons & Limitations
- Node API only decodes P2PK addresses; explorer fallback is needed for contracts/miners/exchanges.
- CORS issues require a proxy for explorer API requests.
- Flows only update if new blocks/transactions are fetched and processed; regular polling is needed for live updates.
- Some addresses/flows may remain unresolved if not present in explorer or node data.

---

## Fallback Version
This summary serves as a fallback reference for the current working state and architecture. If further changes are made, refer to this document for the original process and code structure.

---

## Next Steps
- Update backend to use proxy for all explorer API requests.
- Add regular polling to frontend for live updates.
- Refine entity classification and error handling as needed.

---

**Contact:** For further development or troubleshooting, refer to this summary and the codebase structure above.
