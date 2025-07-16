// Utility to compare ERG/SigUSD and ERG/SigRSV prices between Spectrum and ErgoWatch

export async function getSpectrumPrice(pair: string) {
  // pair: "ERG_SIGUSD" or "ERG_SIGRSV"
  const res = await fetch(`http://localhost:5050/proxy/spectrum?url=${encodeURIComponent('https://api.spectrum.fi/v1/price-tracking/markets')}`);
  const data = await res.json();
  let quoteSymbol = pair === "ERG_SIGUSD" ? "SigUSD" : "SigRSV";
  const market = data.find((m: any) => m.baseSymbol === "ERG" && m.quoteSymbol === quoteSymbol);
  return market ? market.lastPrice : null;
}

export async function getErgoWatchSigUSD() {
  const url = "https://api.ergo.watch/sigmausd/state";
  const res = await fetch(`http://localhost:5050/proxy/ergowatch?url=${encodeURIComponent(url)}`);
  const data = await res.json();
  // Calculate ERG/SigUSD reference price from peg_rate_nano (nanoERG per USD)
  // ERG per 1 USD = 1e9 / peg_rate_nano
  if (data && typeof data.peg_rate_nano === 'number' && data.peg_rate_nano > 0) {
    return 1e9 / data.peg_rate_nano;
  }
  return null;
}

export async function getErgoWatchSigRSV() {
  // Use TokenJay API for SigRSV price (returns nanoERG per 1 SigRSV)
  const url = "https://api.tokenjay.app/sigrsv/price";
  const res = await fetch(url);
  const data = await res.json();
  // data.price is nanoERG per 1 SigRSV
  if (data && typeof data.price === 'number' && data.price > 0) {
    // Convert nanoERG to ERG
    const priceInERG = data.price / 1e9;
    // We want ERG/SigRSV, so invert
    return 1 / priceInERG;
  }
  return null;
}

export async function comparePrices() {
  // Compare ERG/SigUSD
  const [specSigusd, ewSigusd, specSigrsv, ewSigrsv] = await Promise.all([
    getSpectrumPrice("ERG_SIGUSD"),
    getErgoWatchSigUSD(),
    getSpectrumPrice("ERG_SIGRSV"),
    getErgoWatchSigRSV()
  ]);
  // Debug log the raw values for sigrsv
  console.log('[comparePrices] Spectrum SigRSV:', specSigrsv, 'TokenJay SigRSV:', ewSigrsv);
  return {
    sigusd: {
      spectrum: specSigusd,
      ergowatch: ewSigusd,
      diff: specSigusd && ewSigusd ? (specSigusd - ewSigusd) / ewSigusd : null
    },
    sigrsv: {
      spectrum: specSigrsv,
      ergowatch: ewSigrsv,
      diff: specSigrsv && ewSigrsv ? (specSigrsv - ewSigrsv) / ewSigrsv : null
    }
  };
}
