import { useEffect, useState } from "react";

export function useErgoBalance(address: string) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!address) return;
    fetch(`https://api.ergoplatform.com/api/v1/addresses/${address}/balance/total`)
      .then(res => res.json())
      .then(data => setBalance(parseFloat(data.confirmed.balance) / 1e9)) // 1 ERG = 1e9 nanoErg
      .catch(() => setBalance(null));
  }, [address]);

  return balance;
}
