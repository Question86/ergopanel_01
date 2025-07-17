import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
// Remove direct node-based extraction logic. Use backend API route instead.
import { exchangeAddresses, minerAddresses, minerNameMap } from "../utils/knownAddresses";

// Map exchange addresses to names for display
const exchangeNameMap: Record<string, string> = {
  // Coinex
  "9fPiW45mZwoTxSwTLLXaZcdekqi72emebENmScyTGsjryzrntUe": "Coinex",
  "9fowPvQ2GXdmhD2bN54EL9dRnio3kBQGyrD3fkbHwuTXD6z1wBU": "Coinex",
  "9gD9khJaxi3SvcX9VVPQ3vnV3xUTonVQe3Fvg5X7cGGbXMRgd8i": "Coinex",
  "9i51m3reWk99iw8WF6PgxbUT6ZFKhzJ1PmD11vEuGu125hRaKAH": "Coinex",
  // Gate.io
  "9enQZco9hPuqaHvR7EpPRWvYbkDYoWu3NK7pQk8VFwgVnv5taQE": "Gate.io",
  "9gQYrh6yubA4z55u4TtsacKnaEteBEdnY4W2r5BLcFZXcQoQDcq": "Gate.io",
  "9iKFBBrryPhBYVGDKHuZQW7SuLfuTdUJtTPzecbQ5pQQzD4VykC": "Gate.io",
  // Huobi
  "9feMGM1qwNG8NnNuk3pz4yeCGm59s2RbjFnS7DxwUxCbzUrNnJw": "Huobi",
  // Kucoin
  "9fpUtN7d22jS3cMWeZxBbzkdnHCB46YRJ8qiiaVo2wRCkaBar1Z": "Kucoin",
  "9fs7HkPGY9fhN6WsHd7V7LMcuMqsgseXzNahyToxJKwHCc1zc1c": "Kucoin",
  "9guZaxPoe4jecHi6ZxtMotKUL4AzpomFf3xqXsFSuTyZoLbmUBr": "Kucoin",
  "9hU5VUSUAmhEsTehBKDGFaFQSJx574UPoCquKBq59Ushv5XYgAu": "Kucoin",
  "9how9k2dp67jXDnCM6TeRPKtQrToCs5MYL2JoSgyGHLXm1eHxWs": "Kucoin",
  "9i8Mci4ufn8iBQhzohh4V3XM3PjiJbxuDG1hctouwV4fjW5vBi3": "Kucoin",
  "9iNt6wfxSc3DSaBVp22E7g993dwKUCvbGdHoEjxF8SRqj35oXvT": "Kucoin",
  // Mexc
  "9heCed7HKoDwUXAnKU6P4mZZq1emzX7s4wLgaKziaEtxnVQEod2": "Mexc",
  // Probit
  "9eg2Rz3tGogzLaVZhG1ycPj1dJtN4Jn8ySa2mnVLJyVJryb13QB": "Probit",
  // Tidex
  "9fnmngbD5dHoKjAPYhX9FZcUVM8yxnNNM4JuYW3AHzcTZRyPUgo": "Tidex",
  // Trade Ogre
  "9fs99SejQxDjnjwrZ13YMZZ3fwMEVXFewpWWj63nMhZ6zDf2gif": "Trade Ogre",
  // Waves
  "9gNYeyfRFUipiWZ3JR1ayDMoeh28E6J7aDQosb7yrzsuGSDqzCC": "Waves",
  // Xeggex
  "9hphYTmicjazd45pz2ovoHVPz5LTq9EvXoEK9JMGsfWuMtX6eDu": "Xeggex",
};


export const ErgoFlowPanel: React.FC = () => {
  const [fullscreen, setFullscreen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelRect, setPanelRect] = useState<{left: number, top: number, width: number, height: number} | null>(null);
  const [animating, setAnimating] = useState(false);

  // ESC key closes fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fullscreen]);

  // Capture panel position before going fullscreen
  const handlePanelClick = () => {
    if (!fullscreen && panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setPanelRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      setAnimating(true);
      setFullscreen(true);
      setTimeout(() => setAnimating(false), 350); // match transition duration
    } else {
      setAnimating(true);
      setFullscreen(false);
      setTimeout(() => setAnimating(false), 350);
    }
  };
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // For deduplication and accumulation
  const seenFlows = useRef<Set<string>>(new Set());


  // --- Fetch flows from backend API route using explorer data ---
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    // Fetch flows from API
    const fetchFlows = () => {
      fetch('/api/ergoflow-mirror')
        .then(res => res.json())
        .then(data => {
          if (!cancelled) {
            setFlows(prev => {
              const seen = seenFlows.current;
              const newFlows = [...prev];
              for (const flow of (data.flows || [])) {
                const key = `${flow.fromAddress}-${flow.toAddress}-${flow.value}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  newFlows.push(flow);
                }
              }
              // Cap to last 500 flows for memory
              if (newFlows.length > 500) newFlows.splice(0, newFlows.length - 500);
              return newFlows;
            });
            setLoading(false);
          }
        })
        .catch(err => {
          if (!cancelled) {
            setError(err.message || "Fehler");
            setLoading(false);
          }
        });
    };
    // Poll every 2 minutes
    const schedulePolling = () => {
      fetchFlows();
      timeoutId = setTimeout(schedulePolling, 120000);
    };
    schedulePolling();
    // Listen for tab visibility change to trigger immediate refresh
    const handleVisibility = () => {
      if (!document.hidden) fetchFlows();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);



  if (loading) return <div style={{ color: "#0ff" }}>Lädt...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!flows.length) return <div style={{ color: "yellow" }}>Keine Flows gefunden</div>;


  // --- Neon Style Colors for Entities (less glow, more style) ---
  const entityColors: Record<string, string> = {
    Miner: '#ffe066', // Soft yellow
    Exchange: '#00bfff', // Cyan blue
    Private: '#00ff99', // Green
    Emission: '#ff6b6b', // Red-orange
    Contract: '#7f8cff', // Violet
  };

  // --- Emission Address ---
  const emissionAddress = "2Z4YBkDsDvQj8BX7xiySFewjitqp2ge9c99jfes2whbtKitZTxdBYqbrVZUvZvKv6aqn9by4kp3LE1c26LCyosFnVnm6b6U1JYvWpYmL2ZnixJbXLjWAWuBThV1D6dLpqZJYQHYDznJCk49g5TUiS4q8khpag2aNmHwREV7JSsypHdHLgJT7MGaw51aJfNubyzSKxZ4AJXFS27EfXwyCLzW1K6GVqwkJtCoPvrcLqmqwacAWJPkmh78nke9H4oT88XmSbRt2n9aWZjosiZCafZ4osUDxmZcc5QVEeTWn8drSraY3eFKe8Mu9MSCcVU";

  // --- Helper: Map address to unified node key/type/label ---
  // Build dynamic miner address set from flows where emission is sender
  const dynamicMinerSet = new Set<string>();
  flows.forEach((flow: any) => {
    if (flow.fromAddress === emissionAddress) {
      dynamicMinerSet.add(flow.toAddress);
    }
  });
  function getNodeKey(addr: string): { key: string, type: string, label: string } {
    if (addr === emissionAddress) return { key: 'emission', type: 'Emission', label: 'Emission' };
    if (exchangeAddresses.includes(addr)) {
      const name = exchangeNameMap[addr] || 'Exchange';
      return { key: `exchange-${name}`, type: 'Exchange', label: name };
    }
    // Dynamic miner detection: emission recipients and 88dhg prefix
    if (dynamicMinerSet.has(addr) || addr.startsWith('88dhg')) {
      const minerName = minerNameMap[addr] || 'Miner';
      return { key: `miner-${minerName}`, type: 'Miner', label: minerName };
    }
    if (minerAddresses.includes(addr)) {
      const minerName = minerNameMap[addr] || 'Miner';
      return { key: `miner-${minerName}`, type: 'Miner', label: minerName };
    }
    // TODO: Bridge/SmartContract detection if needed
    return { key: addr, type: 'Private', label: addr.slice(0, 6) + '...' };
  }

  // --- Build Entities from Flows ---
  // Each unique node key becomes a node
  type NodeType = { type: string, label: string, key: string, _gridX?: number, _gridY?: number };
  const nodeMap = new Map<string, NodeType>();
  flows.forEach((flow: any) => {
    if (flow.fromAddress) {
      const c = getNodeKey(flow.fromAddress);
      nodeMap.set(c.key, { type: c.type, label: c.label, key: c.key });
    }
    if (flow.toAddress) {
      const c = getNodeKey(flow.toAddress);
      nodeMap.set(c.key, { type: c.type, label: c.label, key: c.key });
    }
  });

  // --- Node Layout: emission left, miners middle-left, privates spread, exchanges right ---
  const width = 640, height = 360;
  const centerY = height / 2;
  const margin = 40;
  const emissionX = margin;
  const minerX = width * 0.20;
  const privateMinerX = width * 0.35;
  const privateExchangeX = width * 0.50;
  const exchangeX = width - margin;

  const nodes = Array.from(nodeMap.values());
  const emissionNode = nodes.find(n => n.type === 'Emission');
  const minerNodes = nodes.filter(n => n.type === 'Miner');
  const exchangeNodes = nodes.filter(n => n.type === 'Exchange');
  const privateNodes: NodeType[] = nodes.filter(n => n.type === 'Private');

  // Stack miners vertically on left
  const minerYStep = minerNodes.length > 1 ? height / (minerNodes.length + 1) : 0;
  // Stack exchanges vertically on right
  const exchangeYStep = exchangeNodes.length > 1 ? height / (exchangeNodes.length + 1) : 0;
  // Organize p2p nodes (green privates) in the middle, full height
  const p2pNodes: NodeType[] = privateNodes.map(n => ({ ...n, label: 'p2p' }));
  const p2pCount = p2pNodes.length;
  const p2pX = width * 0.5;
  const p2pTop = 32 + 24; // leave space for title/legend
  const p2pBottom = height - 32;
  const p2pYStep = p2pCount > 1 ? (p2pBottom - p2pTop) / (p2pCount - 1) : 0;

  const positionedNodes = [
    ...(emissionNode ? [{ ...emissionNode, x: emissionX, y: centerY }] : []),
    ...minerNodes.map((n, i) => ({ ...n, x: minerX, y: minerYStep * (i + 1) })),
    // p2p nodes centered horizontally, spread vertically
    ...p2pNodes.map((n, i) => ({ ...n, x: p2pX, y: p2pCount > 1 ? p2pTop + i * p2pYStep : centerY })),
    ...exchangeNodes.map((n, i) => ({ ...n, x: exchangeX, y: exchangeYStep * (i + 1) })),
  ];

  // --- Helper: Find node by address ---
  // Map address to unified node in positionedNodes
  const getNode = (address: string) => {
    const { key } = getNodeKey(address);
    return positionedNodes.find(n => n.key === key);
  };

  // --- SVG Layout ---
  // Calculate animated style for fullscreen
  let fullscreenStyle = {};
  if (fullscreen && panelRect) {
    if (animating) {
      fullscreenStyle = {
        position: 'fixed',
        left: panelRect.left,
        top: panelRect.top,
        width: panelRect.width,
        height: panelRect.height,
        boxShadow: '0 0 8px #00fff7, 0 0 1px #0ff inset',
        cursor: 'zoom-out',
        zIndex: 10001,
        transition: 'all 0.3s cubic-bezier(.4,2,.6,1)',
      };
      setTimeout(() => {
        if (panelRef.current) {
          panelRef.current.style.left = '2vw';
          panelRef.current.style.top = '2vh';
          panelRef.current.style.width = '96vw';
          panelRef.current.style.height = '96vh';
        }
      }, 10);
    } else {
      fullscreenStyle = {
        position: 'fixed',
        left: '2vw',
        top: '2vh',
        width: '96vw',
        height: '96vh',
        boxShadow: '0 0 8px #00fff7, 0 0 1px #0ff inset',
        cursor: 'zoom-out',
        zIndex: 10001,
        transition: 'all 0.3s cubic-bezier(.4,2,.6,1)',
      };
    }
  }

  const panelContent = (
    <div
      ref={panelRef}
      className={`w-full h-[400px] bg-[#10131a] rounded-xl shadow-lg relative overflow-hidden border border-cyan-400/30 transition-all duration-300 ${fullscreen ? 'z-50 rounded-none' : ''}`}
      style={fullscreen ? fullscreenStyle : {
        boxShadow: '0 0 24px #00fff7, 0 0 2px #0ff inset',
        cursor: fullscreen ? 'zoom-out' : 'zoom-in',
      }}
      tabIndex={0}
      onClick={handlePanelClick}
    >
      <svg width="100%" height="100%" viewBox="0 0 640 360" style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Flows (Curved Lines) */}
        {(() => {
          // Find min/max value for scaling
          let minValue = Infinity, maxValue = -Infinity;
          flows.forEach((flow: any) => {
            const v = flow.value || flow.amount || 1;
            if (v < minValue) minValue = v;
            if (v > maxValue) maxValue = v;
          });
          if (!isFinite(minValue) || !isFinite(maxValue) || minValue === maxValue) {
            minValue = 1; maxValue = 10;
          }
          const minThick = 1.2, maxThick = 5.5;
          function scaleThickness(v: number) {
            return minThick + ((v - minValue) / (maxValue - minValue)) * (maxThick - minThick);
          }
          return flows.map((flow: any, idx: number) => {
            const from = getNode(flow.fromAddress);
            const to = getNode(flow.toAddress);
            if (!from || !to) return null;
            const v = flow.value || flow.amount || 1;
            const thickness = scaleThickness(v);
            const color = entityColors[from.type] || '#fff';
            // Use a cubic Bezier for smooth curves
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const curve = Math.abs(dx) * 0.25;
            const c1x = from.x + curve;
            const c1y = from.y;
            const c2x = to.x - curve;
            const c2y = to.y;
            const key = flow.txId || `${flow.fromAddress}-${flow.toAddress}-${flow.value}-${idx}`;
            return (
              <path
                key={key}
                d={`M${from.x},${from.y} C${c1x},${c1y} ${c2x},${c2y} ${to.x},${to.y}`}
                stroke={color}
                strokeWidth={thickness}
                fill="none"
                opacity={0.55}
                style={{ filter: `drop-shadow(0 0 2px ${color})` }}
              />
            );
          });
        })()}
        {/* Entities (Nodes) */}
        {positionedNodes.map((e) => {
          // Exchange: rounded rectangle, Miner: circle, Emission: hexagon, Private: small circle
          if (e.type === 'Exchange') {
            return (
              <g key={e.key}>
                <rect
                  x={e.x - 18}
                  y={e.y - 12}
                  rx={10}
                  ry={10}
                  width={36}
                  height={24}
                  fill="#181c24"
                  stroke={entityColors[e.type]}
                  strokeWidth={2.5}
                  style={{ filter: `drop-shadow(0 0 4px ${entityColors[e.type]})` }}
                />
                <text
                  x={e.x}
                  y={e.y + 5}
                  textAnchor="middle"
                  fontSize={15}
                  fill={entityColors[e.type]}
                  fontWeight="bold"
                  style={{ textShadow: `0 0 2px ${entityColors[e.type]}` }}
                >
                  {e.label}
                </text>
              </g>
            );
          }
          if (e.type === 'Emission') {
            // Hexagon
            const r = 16;
            const points = Array.from({length: 6}, (_, i) => {
              const angle = Math.PI / 3 * i;
              return `${e.x + r * Math.cos(angle)},${e.y + r * Math.sin(angle)}`;
            }).join(' ');
            return (
              <g key={e.key}>
                <polygon
                  points={points}
                  fill="#181c24"
                  stroke={entityColors[e.type]}
                  strokeWidth={2.5}
                  style={{ filter: `drop-shadow(0 0 4px ${entityColors[e.type]})` }}
                />
                <text
                  x={e.x}
                  y={e.y + 6}
                  textAnchor="middle"
                  fontSize={15}
                  fill={entityColors[e.type]}
                  fontWeight="bold"
                  style={{ textShadow: `0 0 2px ${entityColors[e.type]}` }}
                >
                  {e.label}
                </text>
              </g>
            );
          }
          if (e.type === 'Miner') {
            return (
              <g key={e.key}>
                <circle
                  cx={e.x}
                  cy={e.y}
                  r={14}
                  fill="#181c24"
                  stroke={entityColors[e.type]}
                  strokeWidth={2.5}
                  style={{ filter: `drop-shadow(0 0 4px ${entityColors[e.type]})` }}
                />
                <text
                  x={e.x}
                  y={e.y + 5}
                  textAnchor="middle"
                  fontSize={15}
                  fill={entityColors[e.type]}
                  fontWeight="bold"
                  style={{ textShadow: `0 0 2px ${entityColors[e.type]}` }}
                >
                  {e.label}
                </text>
              </g>
            );
          }
          // Private: small circle, labeled 'p2p'
          return (
            <g key={e.key}>
              <circle
                cx={e.x}
                cy={e.y}
                r={8}
                fill="#181c24"
                stroke={entityColors[e.type]}
                strokeWidth={2}
                style={{ filter: `drop-shadow(0 0 2px ${entityColors[e.type]})` }}
              />
              <text
                x={e.x}
                y={e.y + 4}
                textAnchor="middle"
                fontSize={12}
                fill={entityColors[e.type]}
                fontWeight="bold"
                style={{ textShadow: `0 0 1px ${entityColors[e.type]}` }}
              >
                {e.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="absolute left-4 top-4 text-cyan-300 font-bold text-xl tracking-wide flex items-center gap-2" style={{letterSpacing: '0.08em', textShadow: '0 0 8px #00bfff'}}>
        TRANSACTIONS BETWEEN
      </div>
      {/* Legend at right, vertical */}
      <div className="absolute right-8 top-16 flex flex-col gap-3 text-xs items-start" style={{background: 'rgba(16,19,26,0.85)', borderRadius: '12px', padding: '18px 18px 18px 24px', boxShadow: '0 0 12px #10131a'}}>
        {Object.entries(entityColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            {type === 'Exchange' ? (
              <span style={{ background: color, width: 24, height: 16, borderRadius: 8, display: 'inline-block', boxShadow: `0 0 4px ${color}` }}></span>
            ) : type === 'Emission' ? (
              <span style={{ width: 18, height: 18, display: 'inline-block', background: 'none', borderRadius: 0 }}>
                <svg width="18" height="18" viewBox="0 0 18 18"><polygon points="9,2 16,6.5 16,13.5 9,17 2,13.5 2,6.5" fill={color} /></svg>
              </span>
            ) : type === 'Miner' ? (
              <span style={{ background: color, width: 18, height: 18, borderRadius: 9, display: 'inline-block', boxShadow: `0 0 4px ${color}` }}></span>
            ) : (
              <span style={{ background: color, width: 12, height: 12, borderRadius: 6, display: 'inline-block', boxShadow: `0 0 2px ${color}` }}></span>
            )}
            <span className="text-cyan-100" style={{ color, fontWeight: 'bold', fontSize: '1em', textShadow: `0 0 2px ${color}` }}>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // When fullscreen, animate from original rect to full viewport
  if (fullscreen && panelRect) {
    return createPortal(
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 10000,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.3s',
        }}
        onClick={() => setFullscreen(false)}
      >
        <div
          style={{
            position: 'absolute',
            left: `calc(50vw - ${panelRect.width / 2}px)`,
            top: `calc(50vh - ${panelRect.height / 2}px)`,
            width: panelRect.width,
            height: panelRect.height,
            transition: 'all 0.3s cubic-bezier(.4,2,.6,1)',
          }}
        >
          {panelContent}
        </div>
      </div>,
      document.body
    );
  }
  return panelContent;
};
