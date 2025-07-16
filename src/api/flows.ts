// src/api/flows.ts
// API endpoint for normalized Ergo flows
import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchErgoFlow } from '../utils/ergoflow';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const flows = await fetchErgoFlow();
    res.status(200).json(flows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch flows', details: e?.toString() });
  }
}
