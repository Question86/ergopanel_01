// src/utils/ergoFlow.ts

import { minerAddresses, exchangeAddresses } from "./knownAddresses";
import * as ergoLib from 'ergo-lib-wasm-browser';

// Typ für Flow-Objekte
export type TxFlow = {
  fromType: "Miner" | "Exchange" | "Privat";
  toType: "Miner" | "Exchange" | "Privat";
  value: number; // ERG
};

function getAddressType(address: string): "Miner" | "Exchange" | "Privat" {
  if (minerAddresses.includes(address)) return "Miner";
  if (exchangeAddresses.includes(address)) return "Exchange";
  return "Privat";
}

// Kleine Hilfsfunktion zum chunking
function chunkArray<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

// Lädt für eine Liste von boxIds die ursprünglichen Output-Adressen nach
async function fetchBoxAddresses(boxIds: string[], throttleMs = 60): Promise<Record<string, string>> {
  // Log the entire ergoLib object for debugging
  console.log('[ErgoFlow] ergoLib exports:', Object.keys(ergoLib));
  const out: Record<string, string> = {};
  // No explicit init needed for ergo-lib-wasm-browser
  const chunks = chunkArray(Array.from(new Set(boxIds)), 12); // 12 Requests pro Batch
  for (const chunk of chunks) {
    const fetched = await Promise.all(
      chunk.map(async boxId => {
        console.log('[ErgoFlow] Fetching box address for boxId:', boxId);
        const res = await fetch(`/blockchain/box/${boxId}`).then(r => r.json()).catch(() => null);
        console.log('[ErgoFlow] Box response for', boxId, ':', res);
        return res;
      })
    );
    for (let i = 0; i < chunk.length; i++) {
      const box = fetched[i];
      if (i === 0 && box) {
        console.log('[ErgoFlow] First non-null box response:', box);
      }
      const ergoTree = box?.ergoTree;
      let address = undefined;
      // (Decoding logic will go here after we see the logs)
      if (address) out[chunk[i]] = address;
    }
    await new Promise(res => setTimeout(res, throttleMs));
  }
  return out;
}

// Hauptfunktion
export async function fetchErgoFlow(): Promise<TxFlow[]> {
  // 1. Hole die letzten 50 Block-Hashes (mehr ist oft zu viel für localhost!)
  const blocksRes = await fetch("/blocks?limit=50");
  const blockIds: string[] = await blocksRes.json();
  console.log("[ErgoFlow] Block IDs fetched:", blockIds.length, blockIds.slice(0, 5));

  // 2. Paralleles Laden aller Blockdaten
  const blockPromises = blockIds.map(blockId =>
    fetch(`/blocks/${blockId}`).then(res => res.json())
  );
  const blocks = await Promise.all(blockPromises);
  console.log("[ErgoFlow] Blocks fetched:", blocks.length);
  if (blocks.length > 0) {
    console.log("[ErgoFlow] First block object:", blocks[0]);
    console.log("[ErgoFlow] block.blockTransactions:", blocks[0].blockTransactions);
  }

  // 3. Sammle ALLE boxIds aus Inputs aller TXs
  const allInputBoxIds: string[] = [];
  let txCount = 0;
  let inputCount = 0;
  for (const block of blocks) {
    // block.blockTransactions is likely an object, not an array
    const txs = Array.isArray(block.blockTransactions)
      ? block.blockTransactions
      : (block.blockTransactions && Array.isArray(block.blockTransactions.transactions))
        ? block.blockTransactions.transactions
        : [];
    for (const tx of txs) {
      txCount++;
      for (const input of tx.inputs || []) {
        inputCount++;
        if (input.boxId) allInputBoxIds.push(input.boxId);
      }
    }
  }
  console.log(`[ErgoFlow] Transactions: ${txCount}, Inputs: ${inputCount}, Unique Input BoxIds: ${[...new Set(allInputBoxIds)].length}`);

  // 4. Adressen für die Inputs nachladen
  const inputAddrMap = await fetchBoxAddresses(allInputBoxIds);
  console.log("[ErgoFlow] Input address map size:", Object.keys(inputAddrMap).length);

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
        const fromAddr = inputAddrMap[input.boxId];
        if (!fromAddr) continue; // überspringe, falls nicht gefunden
        for (const output of tx.outputs || []) {
          const toAddr = output.address;
          if (toAddr && fromAddr !== toAddr) {
            flows.push({
              fromType: getAddressType(fromAddr),
              toType: getAddressType(toAddr),
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
        const fromAddr = input.address || ""; // nur wenn vorhanden!
        for (const output of tx.outputs || []) {
          if (fromAddr && output.address && fromAddr !== output.address) {
            flows.push({
              fromType: getAddressType(fromAddr),
              toType: getAddressType(output.address),
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
