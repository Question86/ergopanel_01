import { describe, it, expect } from 'vitest';
import { fetchErgoFlow } from './ergoflow';

describe('Utils - Ergoflow', () => {
  it('fetchErgoFlow should be defined', () => {
    expect(fetchErgoFlow).toBeDefined();
  });
});