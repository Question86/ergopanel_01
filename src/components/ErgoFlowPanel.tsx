import React, { useEffect, useState } from "react";
import { fetchErgoFlow } from "../utils/ergoFlow"; // <-- nur das holen!

export const ErgoFlowPanel: React.FC = () => {
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout;
    const fetchAndSchedule = () => {
      console.log("[ErgoFlowPanel] Calling fetchErgoFlow...");
      setLoading(true);
      fetchErgoFlow()
        .then(data => {
          if (!cancelled) {
            console.log("[ErgoFlowPanel] fetchErgoFlow result:", data);
            setFlows(data);
            setLoading(false);
          }
        })
        .catch(err => {
          if (!cancelled) {
            console.error("[ErgoFlowPanel] fetchErgoFlow error:", err);
            setError(err.message || "Fehler");
            setLoading(false);
          }
        })
        .finally(() => {
          if (!cancelled) {
            timeoutId = setTimeout(fetchAndSchedule, 10000); // 10 seconds
          }
        });
    };
    fetchAndSchedule();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (loading) return <div style={{ color: "#0ff" }}>Lädt...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!flows.length) return <div style={{ color: "yellow" }}>Keine Flows gefunden</div>;

  return (
    <div>
      <div style={{ color: "#0ff", fontWeight: "bold" }}>Flows:</div>
      <pre style={{
        color: "#fff",
        background: "#111",
        maxHeight: 200,
        overflowY: "auto",
        fontSize: 12,
        borderRadius: 8,
        padding: 8,
      }}>
        {JSON.stringify(flows, null, 2)}
      </pre>
    </div>
  );
};
