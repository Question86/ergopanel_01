import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getHummingbotStatus, startHummingbot, stopHummingbot, setGridParams } from "../utils/hummingbotApi";
import { comparePrices } from "../utils/spectrumErgoCompare";

const neonGreen = "text-[#39ff14]";


export default function HummingbotPanel() {
  const [status, setStatus] = useState<{ online: boolean; lastTrades: any[]; gridParams: any }>({
    online: false,
    lastTrades: [],
    gridParams: {
      lower: 0,
      upper: 0,
      steps: 0,
      amount: 0,
    },
  });
  const [loading, setLoading] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [gridParams, setGridParams] = useState(status.gridParams);
  const [priceDiffs, setPriceDiffs] = useState<any>(null);

  // Fetch status and price diffs on mount and every 5 seconds
  useEffect(() => {
    let interval: number;
    const fetchAll = async () => {
      setLoading(true);
      const status = await getHummingbotStatus();
      setStatus(status);
      // Fetch price diffs
      try {
        const diffs = await comparePrices();
        setPriceDiffs(diffs);
      } catch (e) {
        setPriceDiffs(null);
      }
      setLoading(false);
    };

    fetchAll();
    interval = setInterval(fetchAll, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    setLoading(true);
    await startHummingbot();
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    await stopHummingbot();
    setLoading(false);
  };

  // Safe extraction for price diffs
  let sigusdDiff = null;
  let sigrsvDiff = null;
  if (priceDiffs && typeof priceDiffs === 'object') {
    if (priceDiffs.sigusd && typeof priceDiffs.sigusd.diff === 'number') {
      sigusdDiff = priceDiffs.sigusd.diff;
    }
    if (priceDiffs.sigrsv && typeof priceDiffs.sigrsv.diff === 'number') {
      sigrsvDiff = priceDiffs.sigrsv.diff;
    }
  }

  // Update grid params state safely
  const updateGridParams = (updater: (prev: any) => any) => {
    setGridParams((prev) => {
      const newParams = updater(prev);
      // Ensure new params are within bounds
      return {
        lower: Math.min(newParams.lower, newParams.upper),
        upper: Math.max(newParams.lower, newParams.upper),
        steps: Math.max(1, newParams.steps),
        amount: Math.max(0, newParams.amount),
      };
    });
  };

  const handleGridSave = async () => {
    setLoading(true);
    await setGridParams(gridParams);
    setShowGrid(false);
    setLoading(false);
  };

  return (
    <motion.div className="bg-main-panel rounded-xl p-6 shadow-neon flex flex-col gap-4 w-full max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-main-accent">Hummingbot Status</h2>
        <span className={status.online ? `${neonGreen} font-bold` : "text-red-400 font-bold"}>
          {status.online ? "Online" : "Offline"}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <span>ERG/SigUSD Price Diff:</span>
          {sigusdDiff !== null ? (
            <span className={Math.abs(sigusdDiff) > 0.05 ? `${neonGreen} text-2xl font-mono` : "text-yellow-300 text-2xl font-mono"}>
              {(sigusdDiff * 100).toFixed(2)}%
            </span>
          ) : (
            <span className="text-gray-400">Loading...</span>
          )}
          {sigusdDiff !== null && Math.abs(sigusdDiff) > 0.05 && (
            <span className="ml-2 px-2 py-1 rounded bg-main-accent text-black font-bold animate-pulse">Arbitrage!</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>ERG/SigRSV Price Diff:</span>
          {sigrsvDiff !== null ? (
            <span className={Math.abs(sigrsvDiff) > 0.05 ? `${neonGreen} text-2xl font-mono` : "text-yellow-300 text-2xl font-mono"}>
              {(sigrsvDiff * 100).toFixed(2)}%
            </span>
          ) : (
            <span className="text-gray-400">Loading...</span>
          )}
          {sigrsvDiff !== null && Math.abs(sigrsvDiff) > 0.05 && (
            <span className="ml-2 px-2 py-1 rounded bg-main-accent text-black font-bold animate-pulse">Arbitrage!</span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          className="bg-main-accent px-4 py-2 rounded shadow hover:bg-cyan-400 transition"
          onClick={handleStart}
          disabled={loading || status.online}
        >
          Start the bot
        </button>
        <button
          className="bg-main-highlight px-4 py-2 rounded shadow hover:bg-pink-400 transition"
          onClick={handleStop}
          disabled={loading || !status.online}
        >
          End the bot
        </button>
        <button
          className="bg-main-accent px-3 py-2 rounded shadow hover:bg-cyan-400 transition ml-auto"
          onClick={() => setShowGrid((v) => !v)}
        >
          Grid Setup
        </button>
      </div>
      {showGrid && (
        <div className="bg-main-bg p-4 rounded-xl flex flex-col gap-2">
          <label className="flex gap-2 items-center">
            Lower: <input type="number" value={gridParams.lower} onChange={e => updateGridParams(p => ({ ...p, lower: +e.target.value }))} className="bg-main-panel px-2 py-1 rounded text-black" />
          </label>
          <label className="flex gap-2 items-center">
            Upper: <input type="number" value={gridParams.upper} onChange={e => updateGridParams(p => ({ ...p, upper: +e.target.value }))} className="bg-main-panel px-2 py-1 rounded text-black" />
          </label>
          <label className="flex gap-2 items-center">
            Steps: <input type="number" value={gridParams.steps} onChange={e => updateGridParams(p => ({ ...p, steps: +e.target.value }))} className="bg-main-panel px-2 py-1 rounded text-black" />
          </label>
          <label className="flex gap-2 items-center">
            Amount: <input type="number" value={gridParams.amount} onChange={e => updateGridParams(p => ({ ...p, amount: +e.target.value }))} className="bg-main-panel px-2 py-1 rounded text-black" />
          </label>
          <button className="bg-main-accent px-4 py-2 rounded shadow hover:bg-cyan-400 transition mt-2" onClick={handleGridSave} disabled={loading}>
            Save Grid
          </button>
        </div>
      )}
      <div>
        <h3 className="font-bold mb-2">Last Trades</h3>
        <div className="text-sm font-mono bg-main-bg rounded p-2 max-h-32 overflow-y-auto">
          {status.lastTrades.length === 0 ? (
            <span className="text-gray-400">No trades yet.</span>
          ) : (
            status.lastTrades.map((t, i) => (
              <div key={i} className="flex gap-2 border-b border-main-highlight py-1 last:border-b-0">
                <span>{t.time}</span>
                <span>{t.pair}</span>
                <span>{t.side}</span>
                <span>{t.price}</span>
                <span>{t.amount}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
