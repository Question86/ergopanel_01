import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MempoolPanel: React.FC = () => {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Poll-Ergo-Node for transactions
  useEffect(() => {
    const fetchTxs = async () => {
      try {
        console.log("Fetching transactions...");
        const res = await fetch("http://localhost:9053/transactions/unconfirmed");
        if (!res.ok) {
          console.error("Failed to fetch transactions:", res.status, res.statusText);
          return;
        }
        const data = await res.json();
        console.log("Raw transactions fetched:", JSON.stringify(data, null, 2)); // Log the full structure of the data

        if (Array.isArray(data)) {
          const validTxs = data.filter(tx => tx && tx.id && Array.isArray(tx.inputs) && Array.isArray(tx.outputs));
          console.log("Valid transactions:", JSON.stringify(validTxs, null, 2)); // Log the valid transactions
          setTxs(validTxs.slice(0, 10)); // Display up to 10 transactions
          console.log("State updated with transactions:", validTxs.slice(0, 10)); // Log state update
        } else {
          console.error("Unexpected data format:", JSON.stringify(data, null, 2)); // Log unexpected data format
          setTxs([]); // Clear transactions if data is invalid
        }
      } catch (e) {
        console.error("Error fetching transactions:", e);
        setTxs([]); // Clear transactions on error
      } finally {
        setLoading(false);
      }
    };

    fetchTxs();
    const interval = setInterval(() => {
      console.log("Polling for new transactions...");
      fetchTxs();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  console.log("Rendering MempoolPanel", { loading, txs });

  return (
    <div className="relative min-h-[230px] max-h-[230px] overflow-y-auto">
      {loading ? (
        <div className="h-[200px] flex items-center justify-center text-cyan-200">Lade...</div>
      ) : (
        <div className="min-h-[200px] flex flex-col-reverse justify-end items-end pr-2 gap-2">
          {txs.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] w-full text-cyan-300 font-mono">
              🎉 Mempool ist leer!
            </div>
          ) : (
            <AnimatePresence>
              {txs.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="relative bg-cyan-950/80 border border-cyan-700 rounded-lg shadow-lg px-4 py-2 flex flex-col gap-1 w-[95%] max-w-[340px] min-h-[48px]"
                >
                  <div className="flex justify-between">
                    <a
                      href={`https://explorer.ergoplatform.com/en/boxes/${tx.inputs[0]?.boxId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono truncate text-yellow-400"
                      title={tx.inputs[0]?.boxId || "Box not available"}
                    >
                      {tx.inputs[0]?.boxId ? tx.inputs[0].boxId.slice(0, 8) : "No Box"}...
                    </a>
                    <span className="text-gray-400">→</span>
                    <a
                      href={`https://explorer.ergoplatform.com/en/boxes/${tx.outputs[0]?.boxId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono truncate text-cyan-400"
                      title={tx.outputs[0]?.boxId || "Box not available"}
                    >
                      {tx.outputs[0]?.boxId ? tx.outputs[0].boxId.slice(0, 8) : "No Box"}...
                    </a>
                  </div>
                  <span className="text-xs text-gray-400">
                    Value: {(tx.outputs[0]?.value || 0) / 1e9} ERG ({tx.inputs?.length || 0} In / {tx.outputs?.length || 0} Out)
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
};
export default MempoolPanel;
