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
  // 1. Fetch recent block IDs from node
  const blockIdsRes = await fetch("/blocks?limit=500");
  const blockIds: string[] = await blockIdsRes.json();
  console.log(`[ErgoFlow] Block IDs fetched:`, blockIds.length);

  // 2. Fetch full block details for each block ID
  const blocks: any[] = [];
  for (const blockId of blockIds) {
    try {
      const blockRes = await fetch(`/blocks/${blockId}`);
      if (blockRes.ok) {
        const blockData = await blockRes.json();
        blocks.push(blockData);
      } else {
        console.warn(`[ErgoFlow] Failed to fetch block ${blockId}: ${blockRes.status}`);
      }
    } catch (err) {
      console.warn(`[ErgoFlow] Error fetching block ${blockId}:`, err);
    }
  }
  console.log(`[ErgoFlow] Full blocks fetched:`, blocks.length);

  // 3. Build boxId -> address map from outputs
  const boxAddrMap: Record<string, string> = {};
  let txCount = 0, inputCount = 0;
  for (const block of blocks) {
    const txs = Array.isArray(block.blockTransactions)
      ? block.blockTransactions
      : (block.blockTransactions && Array.isArray(block.blockTransactions.transactions))
        ? block.blockTransactions.transactions
        : [];
    for (const tx of txs) {
      txCount++;
      for (const output of tx.outputs || []) {
        if (output.boxId && output.address) {
          boxAddrMap[output.boxId] = output.address;
          console.debug(`[ErgoFlow][DEBUG] Output: boxId=${output.boxId} address=${output.address}`);
        } else if (output.boxId) {
          console.debug(`[ErgoFlow][DEBUG] Output: boxId=${output.boxId} has NO address field`);
        }
      }
      for (const input of tx.inputs || []) {
        inputCount++;
        if (input.boxId) {
          const resolved = boxAddrMap[input.boxId];
          if (resolved) {
            console.debug(`[ErgoFlow][DEBUG] Input: boxId=${input.boxId} resolved address=${resolved}`);
          } else {
            console.debug(`[ErgoFlow][DEBUG] Input: boxId=${input.boxId} address NOT FOUND in local map`);
          }
        }
      }
    }
  }

  // 3. Log dynamic miner addresses for debugging
  console.log(`[ErgoFlow] Dynamic miner addresses from emission contract:`, Array.from(dynamicMinerAddresses));
  console.log(`[ErgoFlow] Transactions: ${txCount}, Inputs: ${inputCount}, Output boxIds mapped: ${Object.keys(boxAddrMap).length}`);

  // 4. Resolve input addresses using local boxAddrMap
  const allInputBoxIds: string[] = [];
  for (const block of blocks) {
    const txs = Array.isArray(block.blockTransactions)
      ? block.blockTransactions
      : (block.blockTransactions && Array.isArray(block.blockTransactions.transactions))
        ? block.blockTransactions.transactions
        : [];
    for (const tx of txs) {
      for (const input of tx.inputs || []) {
        if (input.boxId) allInputBoxIds.push(input.boxId);
      }
    }
  }
  const missingInputBoxIds = allInputBoxIds.filter(boxId => !boxAddrMap[boxId]);
  let fetchedAddrMap: Record<string, string> = {};
  if (missingInputBoxIds.length > 0) {
    fetchedAddrMap = await fetchBoxAddresses(missingInputBoxIds);
  }

  // 5. Flows berechnen
  let flows: TxFlow[] = [];
  let blockFlowCount = 0;
  for (const block of blocks) {
    const txs = Array.isArray(block.blockTransactions)
      ? block.blockTransactions
      : (block.blockTransactions && Array.isArray(block.blockTransactions.transactions))
        ? block.blockTransactions.transactions
        : [];
    for (const tx of txs) {
      for (const input of tx.inputs || []) {
        let fromAddr = boxAddrMap[input.boxId] || fetchedAddrMap[input.boxId];
        if (!fromAddr) {
          fromAddr = "Unknown";
          // Optionally log: console.warn(`[ErgoFlow] Input boxId ${input.boxId} unresolved, using 'Unknown'`);
        }
        for (const output of tx.outputs || []) {
          let toAddr = output.address;
          if (!toAddr && typeof output.ergoTree === 'string') {
            try {
              const tree = ergoLib.ErgoTree.from_base16_bytes(output.ergoTree);
              toAddr = ergoLib.Address.recreate_from_ergo_tree(tree).to_base58(ergoLib.NetworkPrefix.Mainnet);
              console.log(`[ErgoFlow] Decoded output address from ergoTree: ${toAddr}`);
            } catch (e) {
              // Could not decode
            }
          }
          if (!toAddr) {
            console.warn(`[ErgoFlow] Skipping output (no address field and could not decode):`, output);
            continue;
          }
          // Dynamically classify miner addresses
          let toType: "Miner" | "Exchange" | "Privat" | "Emission" = "Privat";
          let toLabel = "Privat";
          if (fromAddr === emissionAddress) {
            toType = "Miner";
            toLabel = "Miner (dynamic)";
            dynamicMinerAddresses.add(toAddr);
          } else if (toAddr.startsWith('88dhg')) {
            toType = "Miner";
            toLabel = "Miner (88dhg prefix)";
          } else if (exchangeAddresses.includes(toAddr)) {
            toType = "Exchange";
            toLabel = "Exchange";
          }
          // Use classifyAddress for fromAddr
          const fromClass = classifyAddress(fromAddr);
          // Print debug info
          console.log(`[ErgoFlow][CLASSIFY] fromAddr: '${fromAddr}' => type: ${fromClass.type}, label: ${fromClass.label}`);
          console.log(`[ErgoFlow][CLASSIFY] toAddr:   '${toAddr}' => type: ${toType}, label: ${toLabel}`);
          if (fromAddr !== toAddr) {
            flows.push({
              fromAddress: fromAddr,
              toAddress: toAddr,
              fromType: fromClass.type,
              toType,
              fromLabel: fromClass.label,
              toLabel,
              value: Math.round((output.value ?? 0) / 1e9 * 1000) / 1000,
            });
            blockFlowCount++;
          }
        }
      }
    }
  }
  console.log(`[ErgoFlow] Flows from blocks: ${blockFlowCount}`);

  // 6. Mempool genauso behandeln, aber da stehen oft noch Adressen direkt drin!
  let mempoolFlowCount = 0;
  try {
    const memRes = await fetch("/transactions/unconfirmed");
    const memTxs = await memRes.json();
    for (const tx of memTxs || []) {
      for (const input of tx.inputs || []) {
        const fromAddr = input.address || "";
        for (const output of tx.outputs || []) {
          if (fromAddr && output.address && fromAddr !== output.address) {
            const fromClass = classifyAddress(fromAddr);
            const toClass = classifyAddress(output.address);
            flows.push({
              fromAddress: fromAddr,
              toAddress: output.address,
              fromType: fromClass.type,
              toType: toClass.type,
              fromLabel: fromClass.label,
              toLabel: toClass.label,
              value: Math.round((output.value ?? 0) / 1e9 * 1000) / 1000,
            });
            mempoolFlowCount++;
          }
        }
      }
    }
    console.log(`[ErgoFlow] Flows from mempool: ${mempoolFlowCount}`);
  } catch (e) {
    // Mempool ist optional, ignoriere Fehler
    console.warn("Konnte Mempool nicht laden", e);
  }

  console.log(`[ErgoFlow] Total flows returned: ${flows.length}`);
  return flows;
}

// Lädt für eine Liste von boxIds die ursprünglichen Output-Adressen nach (nur Node-API, keine Explorer-Fallback)
async function fetchBoxAddresses(boxIds: string[], throttleMs = 60): Promise<Record<string, string>> {
  // Log the entire ergoLib object for debugging
  console.log('[ErgoFlow] ergoLib exports:', Object.keys(ergoLib));
  const addrMap: Record<string, string> = {};
  // Node does not return box details for spent boxes, only IDs. Cannot resolve addresses this way.
  // Only use local boxId → address map built from recent blocks.
  // This function now does nothing and returns an empty map.
  return {};
  return addrMap;
}
  // Debug logging must be inside fetchErgoFlow, after flows is constructed and before return
