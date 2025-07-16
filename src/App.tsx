import React from "react";
import MempoolPanel from "./components/MempoolPanel";
import { ErgoFlowPanel } from "./components/ErgoFlowPanel";
import HummingbotPanel from "./components/HummingbotPanel";
import HashratePanel from "./panels/HashratePanel";

// ...existing code...
const Panel = ({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) => {
  // Special style for the hashrate panel (orange-green glow, tight content)
  const isHashratePanel =
    children &&
    React.Children.toArray(children).some(
      (child) =>
        child &&
        typeof child === 'object' &&
        'type' in child &&
        child.type &&
        typeof child.type === 'function' &&
        child.type.name === 'HashratePanel'
    );
  return (
    <div
      className={
        'relative rounded-2xl p-6 m-3 min-w-[320px] min-h-[180px] flex flex-col justify-between transition ' +
        (isHashratePanel
          ? ''
          : 'bg-main-panel shadow-neon hover:shadow-[0_0_30px_0_#21c4d6]')
      }
      style={
        isHashratePanel
          ? {
              background: undefined,
              border: '2px solid #ff9900',
              overflow: 'visible',
            }
          : undefined
      }
    >
      {/* Tighter orange-green outer glow for hashrate panel only */}
      {isHashratePanel && (
        <span
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            zIndex: 0,
            top: '-6px',
            left: '-6px',
            right: '-6px',
            bottom: '-6px',
            borderRadius: 'inherit',
            background: 'linear-gradient(135deg, #ff9900 0%, #39ff14 100%)',
            filter: 'blur(6px)',
            opacity: 0.5,
          }}
        />
      )}
      <div
        style={
          isHashratePanel
            ? {
                position: 'relative',
                zIndex: 1,
                borderRadius: 'inherit',
                background: 'var(--color-main-panel, #181c27)',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                padding: 0,
              }
            : { position: 'relative', zIndex: 1 }
        }
        className={isHashratePanel ? '' : ''}
      >
        {title && <div className="text-lg font-bold text-main-accent">{title}</div>}
        <div className={isHashratePanel ? "flex-1 flex flex-col justify-center items-center" : "mt-2 flex-1"}>
          {children || <span className="text-gray-400">Demo Content</span>}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-main-bg flex flex-col">
      <header className="w-full p-4 flex justify-between items-center bg-main-panel shadow-neon">
        <span className="text-2xl font-bold tracking-wider text-main-accent drop-shadow">ERGO Cockpit</span>
        <span className="font-mono text-gray-300">wallet: <span className="text-main-accent">Demo-Address</span></span>
      </header>
      <main className="flex-1 grid grid-cols-3 gap-4 p-8">
        <Panel title="Wallet-Connection" />
        <Panel title="Hummingbot Schnittstelle">
          <HummingbotPanel />
        </Panel>
        <Panel title="Smart Contract Anteil" />
        <Panel title="Portfolio in Gold" />
        <Panel title="Ergo Flow">
          <ErgoFlowPanel />
        </Panel>
        <Panel title="SigmaUSD Schnittstelle" />
        <Panel title="Transaktion erstellen" />
        <Panel title="Hashrate & Difficulty">
          <HashratePanel />
        </Panel>
        <Panel title="">
          <MempoolPanel />
        </Panel>
      </main>
      <footer className="text-center text-gray-500 p-3 text-xs font-mono bg-main-panel mt-8">
        {`© ${new Date().getFullYear()} – Y's Cockpit (Ergo Dashboard)`} – Built with Vite+React+Tailwind
      </footer>
    </div>
  );
}
