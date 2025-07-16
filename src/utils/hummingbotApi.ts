// Mock API for HummingbotPanel

export async function getHummingbotStatus() {
  // Simulate network delay
  await new Promise(res => setTimeout(res, 200));
  return {
    online: Math.random() > 0.3, // random online/offline
    priceDiff: Math.random() * 0.15, // up to 15%
    lastTrades: [
      { time: "12:01:23", pair: "ERG/USDT", side: "buy", price: 1.23, amount: 100 },
      { time: "12:00:10", pair: "ERG/USDT", side: "sell", price: 1.25, amount: 50 },
    ],
    gridParams: { lower: 1, upper: 2, steps: 5, amount: 10 },
  };
}

export async function startHummingbot() {
  await new Promise(res => setTimeout(res, 400));
  return { ok: true };
}

export async function stopHummingbot() {
  await new Promise(res => setTimeout(res, 400));
  return { ok: true };
}

export async function setGridParams(params: any) {
  await new Promise(res => setTimeout(res, 300));
  return { ok: true };
}
