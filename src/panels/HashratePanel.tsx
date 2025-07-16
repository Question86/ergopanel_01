
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import { safeFetchHashrateHistory } from "./safeFetchHashrateHistory";

export default function HashratePanel() {
  const [hashrate, setHashrate] = useState<{ timestamps: number[]; values: number[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    safeFetchHashrateHistory().then((data) => {
      if (!data) {
        setError(true);
      } else {
        setHashrate(data);
      }
      setLoading(false);
    });
  }, []);

  const chartData = {
    labels:
      hashrate && hashrate.timestamps && hashrate.values
        ? hashrate.timestamps.map((t) => new Date(t * 1000).toLocaleTimeString())
        : [],
    datasets:
      hashrate && hashrate.timestamps && hashrate.values
        ? [
            {
              label: "Hashrate (TH/s)",
              data: hashrate.values.map((v) => v / 1e12),
              borderColor: "#ff00cc",
              backgroundColor: "rgba(255,0,204,0.2)",
              borderWidth: 4,
              pointRadius: 0,
              tension: 0.3,
            },
          ]
        : [],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Ergo Network Hashrate (24h)",
        color: "#ff00cc",
        font: { size: 22, weight: 'bold' as const },
      },
    },
    scales: {
      x: {
        ticks: { color: "#39ff14" },
        grid: { color: "#222" },
      },
      y: {
        ticks: { color: "#39ff14" },
        grid: { color: "#222" },
      },
    },
  };

  // Calculate average hashrate (TH/s) from the last 100 blocks (or all available if less), filter outliers
  let avgHashrate: number | null = null;
  if (hashrate && hashrate.values && hashrate.values.length > 0) {
    const last100 = hashrate.values.slice(-100);
    const sorted = [...last100].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    // Filter out values that are more than 2x the median (outliers)
    const filtered = last100.filter(v => v < median * 2);
    if (filtered.length > 0) {
      avgHashrate = filtered.reduce((a, b) => a + b, 0) / filtered.length / 1e12;
    }
  }

  return (
    <div
      className="rounded-xl p-6 shadow-neon"
      style={{
        background: "linear-gradient(135deg, #0f0026 60%, #1a0033 100%)",
        border: "2px solid #ff9900",
        // Reduced glow/corona to match other panels
        boxShadow: "0 0 12px #ff9900cc, 0 0 4px #39ff14cc",
      }}
    >
      <div className="w-full h-full flex items-center justify-center" style={{ minHeight: 0, minWidth: 0 }}>
        <div className="flex flex-col items-center justify-center w-full h-full" style={{ minHeight: 0, minWidth: 0 }}>
          {loading ? (
            <div className="text-orange-400 text-xl animate-pulse w-full h-full flex items-center justify-center">Loading hashrate...</div>
          ) : error ? (
            <div className="text-red-400 text-lg w-full h-full flex items-center justify-center">Fehler beim Laden der Hashrate-Daten.</div>
          ) : hashrate && hashrate.timestamps && hashrate.values && hashrate.timestamps.length > 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div style={{ transform: 'scale(0.85)', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="text-2xl font-bold mb-1 text-center" style={{ color: '#ff9900', fontSize: '1.6rem' }}>
                  Ergo Network Hashrate (24h)
                </div>
                {/* Average Hashrate Stat */}
                {typeof avgHashrate === 'number' && !isNaN(avgHashrate) && (
                  <div className="text-lg font-mono mb-2 text-center" style={{ color: '#ff9900' }}>
                    Ø Hashrate: {avgHashrate.toFixed(2)} TH/s
                  </div>
                )}
                <div className="flex-1 flex items-center justify-center w-full h-full" style={{ minHeight: 0, minWidth: 0 }}>
                  <Line data={{
                    ...chartData,
                    datasets: chartData.datasets.map(ds => ({
                      ...ds,
                      borderColor: '#ff9900',
                      backgroundColor: 'rgba(255,153,0,0.2)',
                    }))
                  }} options={{
                    ...chartOptions,
                    plugins: { ...chartOptions.plugins, title: { display: false } },
                    scales: {
                      ...chartOptions.scales,
                      x: { ...chartOptions.scales.x, ticks: { color: '#ff9900' }, grid: { color: '#222' } },
                      y: { ...chartOptions.scales.y, ticks: { color: '#ff9900' }, grid: { color: '#222' } },
                    },
                  }} style={{ width: '100%', height: '100%' }} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
