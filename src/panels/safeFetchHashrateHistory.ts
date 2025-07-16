// Helper for safe fetch with error handling
// Fetch last 60 blocks from Ergo Explorer and calculate hashrate history
export async function safeFetchHashrateHistory() {
  try {
    const res = await fetch(
      "http://localhost:5050/proxy/ergowatch?url=" +
        encodeURIComponent("https://api.ergoplatform.com/api/v1/blocks?limit=60")
    );
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.items) || data.items.length < 2) {
      return null;
    }
    // Sort blocks by height ascending (oldest first)
    const blocks = [...data.items].sort((a, b) => a.height - b.height);
    // Calculate hashrate for each block (except the first, since we need a delta)
    const timestamps: number[] = [];
    const values: number[] = [];
    for (let i = 1; i < blocks.length; i++) {
      const prev = blocks[i - 1];
      const curr = blocks[i];
      const dt = (curr.timestamp - prev.timestamp) / 1000; // seconds
      // Hashrate = difficulty / block_time (block_time in seconds)
      // Difficulty is in hashes
      if (dt > 0 && curr.difficulty) {
        const hashrate = curr.difficulty / dt;
        timestamps.push(curr.timestamp / 1000); // convert ms to s
        values.push(hashrate);
      }
    }
    return { timestamps, values };
  } catch (e) {
    return null;
  }
}
