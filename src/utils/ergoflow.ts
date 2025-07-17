  // Dynamically build miner address list from emission contract outputs
  const dynamicMinerAddresses = new Set<string>();
// src/utils/ergoFlow.ts

import { minerAddresses, exchangeAddresses, classifyAddress } from "./knownAddresses";
import * as ergoLib from 'ergo-lib-wasm-browser';


// Emissionsadresse als Konstante
const emissionAddress = "2Z4YBkDsDvQj8BX7xiySFewjitqp2ge9c99jfes2whbtKitZTxdBYqbrVZUvZvKv6aqn9by4kp3LE1c26LCyosFnVnm6b6U1JYvWpYmL2ZnixJbXLjWAWuBThV1D6dLpqZJYQHYDznJCk49g5TUiS4q8khpag2aNmHwREV7JSsypHdHLgJT7MGaw51aJfNubyzSKxZ4AJXFS27EfXwyCLzW1K6GVqwkJtCoPvrcLqmqwacAWJPkmh78nke9H4oT88XmSbRt2n9aWZjosiZCafZ4osUDxmZcc5QVEeTWn8drSraY3eFKe8Mu9MSCcVU";


// Typ für Flow-Objekte
export type TxFlow = {
  fromAddress: string;
  toAddress: string;
  fromType: "Miner" | "Exchange" | "Privat" | "Emission";
  toType: "Miner" | "Exchange" | "Privat" | "Emission";
  fromLabel?: string;
  toLabel?: string;
  value: number; // ERG
};


// Use classifyAddress everywhere instead of getAddressType

// Kleine Hilfsfunktion zum chunking
function chunkArray<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}
// Main function to fetch and classify flows
export async function fetchErgoFlow(): Promise<TxFlow[]> {
  const explorerApi = "https://api.ergoplatform.com/api/v1";
  // 1. Fetch recent block IDs from explorer
  const blockIdsRes = await fetch(`${explorerApi}/blocks?limit=100`);
  const blockData = await blockIdsRes.json();
  const blockIds: string[] = blockData.items.map((b: any) => b.id);

  // 2. Fetch full block details for each block ID
  const blocks: any[] = [];
  for (const blockId of blockIds) {
    try {
      const blockRes = await fetch(`${explorerApi}/blocks/${blockId}`);
      if (blockRes.ok) {
        const blockDetail = await blockRes.json();
        blocks.push(blockDetail);
      }
    } catch (err) {
      // Ignore errors for missing blocks
    }
  }

  // 3. Build boxId -> address map from outputs
  const boxAddrMap: Record<string, string> = {};
  for (const block of blocks) {
    for (const tx of block.transactions || []) {
      for (const output of tx.outputs || []) {
        if (output.boxId && output.address) {
          boxAddrMap[output.boxId] = output.address;
        }
      }
    }
  }

  // 4. Resolve input addresses using explorer API for missing boxIds
  const allInputBoxIds: string[] = [];
  for (const block of blocks) {
    for (const tx of block.transactions || []) {
      for (const input of tx.inputs || []) {
        if (input.boxId) allInputBoxIds.push(input.boxId);
      }
    }
  }
  const missingInputBoxIds = allInputBoxIds.filter(boxId => !boxAddrMap[boxId]);
  let fetchedAddrMap: Record<string, string> = {};
  if (missingInputBoxIds.length > 0) {
    for (const boxId of missingInputBoxIds) {
      try {
        const boxRes = await fetch(`${explorerApi}/boxes/${boxId}`);
        if (boxRes.ok) {
          const boxDetail = await boxRes.json();
          if (boxDetail.address) {
            fetchedAddrMap[boxId] = boxDetail.address;
          }
        }
      } catch (err) {
        // Ignore errors for missing boxes
      }
    }
  }

  // 5. Build flows
  let flows: TxFlow[] = [];
  for (const block of blocks) {
    for (const tx of block.transactions || []) {
      for (const input of tx.inputs || []) {
        let fromAddr = boxAddrMap[input.boxId] || fetchedAddrMap[input.boxId] || "Unknown";
        for (const output of tx.outputs || []) {
          let toAddr = output.address;
          if (!toAddr) continue;
          const fromClass = classifyAddress(fromAddr);
          const toClass = classifyAddress(toAddr);
          if (fromAddr !== toAddr) {
            flows.push({
              fromAddress: fromAddr,
              toAddress: toAddr,
              fromType: fromClass.type,
              toType: toClass.type,
              fromLabel: fromClass.label,
              toLabel: toClass.label,
              value: Math.round((output.value ?? 0) / 1e9 * 1000) / 1000,
            });
          }
        }
      }
    }
  }
  return flows;
}
// 6. Fetch mempool transactions
/*
  // Mempool fetching is not implemented because the explorer API does not provide mempool access.
  // If mempool support is needed in the future, consider using a node API or a different data source.
*/