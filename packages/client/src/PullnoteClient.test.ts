import { describe, it, expect } from 'vitest';
import { PullnoteClient } from './PullnoteClient.js';

const TEST_TOKEN = process.env.PULLNOTE_KEY;
const TEST_SLUG = 'iphone-12-pro-repairs-london';

describe('PullnoteClient', () => {
  it('should fetch content for a known slug', async () => {
    if (!TEST_TOKEN) {
      console.warn('No PULLNOTE_TEST_TOKEN set, skipping test.');
      return;
    }
    const pn = new PullnoteClient(TEST_TOKEN);
    const data = await pn.get(TEST_SLUG);
    expect(data).toHaveProperty('title', 'On demand iPhone 12 Pro repairs in Greater London');
    expect(data).toHaveProperty('slug', TEST_SLUG);
  });
}); 