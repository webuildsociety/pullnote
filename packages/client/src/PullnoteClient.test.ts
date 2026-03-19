import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { PullnoteClient } from './PullnoteClient.js';
import 'dotenv/config';

// Place a PULLNOTE_TEST_KEY in /packages/client/.env
const TEST_KEY = process.env.PULLNOTE_TEST_KEY;
const TEST_API = process.env.PULLNOTE_TEST_API;
const TEST_NOTE_PATH = 'pullnote-npm-package-test-note-' + Math.random().toString(36).slice(2, 10);
const RUN_INTEGRATION_TESTS = process.env.PULLNOTE_RUN_INTEGRATION_TESTS === '1';
const BLOCK_1_ID = 'firstBlock';
const BLOCK_2_ID = 'secondBlock';
const BLOCK_1_MD = 'Block 1 content';
const BLOCK_2_MD = 'Block 2 content';
const MAIN_MD = 'Main page content';

let pn: PullnoteClient;
let addedNote: any;

describe('PullnoteClient', () => {
  beforeAll(async () => {
    if (!RUN_INTEGRATION_TESTS || !TEST_KEY || !TEST_API) return;
    pn = new PullnoteClient(TEST_KEY, TEST_API);
    // Add the note for subsequent tests
    const note = {
      title: 'Test Note',
      description: 'A note created by a test',
      content: `${MAIN_MD}\n\n<!-- ${BLOCK_1_ID} -->\n${BLOCK_1_MD}\n\n<!-- ${BLOCK_2_ID} -->\n${BLOCK_2_MD}`
    };
    addedNote = await pn.add(TEST_NOTE_PATH, note);
  });

  afterAll(async () => {
    if (!RUN_INTEGRATION_TESTS || !TEST_KEY) return;
    // Remove the note after all tests
    try {
      await pn.remove(TEST_NOTE_PATH);
    } catch (e) {
      // Ignore errors if already removed
    }
  });

  it('should add a note', async () => {
    if (!RUN_INTEGRATION_TESTS || !TEST_KEY) {
      console.warn('No PULLNOTE_TEST_TOKEN set, skipping test.');
      return;
    }
    expect(addedNote).toHaveProperty('title', 'Test Note');
    expect(addedNote).toHaveProperty('path', TEST_NOTE_PATH);
  });

  it('should get a note', async () => {
    if (!RUN_INTEGRATION_TESTS || !TEST_KEY) {
      console.warn('No PULLNOTE_TEST_TOKEN set, skipping test.');
      return;
    }
    const fetched = await pn.get(TEST_NOTE_PATH);
    expect(fetched).toHaveProperty('title', 'Test Note');
    expect(fetched).toHaveProperty('path', TEST_NOTE_PATH);
    expect(fetched).toHaveProperty('content', MAIN_MD);
    expect(fetched.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: BLOCK_1_ID, content: BLOCK_1_MD }),
        expect.objectContaining({ id: BLOCK_2_ID, content: BLOCK_2_MD })
      ])
    );
  });

  it('should get a single block via #selector', async () => {
    if (!RUN_INTEGRATION_TESTS || !TEST_KEY) {
      console.warn('No PULLNOTE_TEST_TOKEN set, skipping test.');
      return;
    }
    const fetched = await pn.get(`${TEST_NOTE_PATH}#${BLOCK_1_ID}`);
    expect(fetched).toHaveProperty('title', 'Test Note');
    expect(fetched).toHaveProperty('path', TEST_NOTE_PATH);
    expect(fetched).toHaveProperty('block_id', BLOCK_1_ID);
    expect(fetched).toHaveProperty('content', BLOCK_1_MD);
    expect(fetched.blocks).toEqual([]);
  });

  it('should update a note', async () => {
    if (!RUN_INTEGRATION_TESTS || !TEST_KEY) {
      console.warn('No PULLNOTE_TEST_TOKEN set, skipping test.');
      return;
    }
    const updated = await pn.update(TEST_NOTE_PATH, { title: 'Updated Test Note' });
    expect(updated).toHaveProperty('title', 'Updated Test Note');
  });

  it('should remove a note', async () => {
    if (!RUN_INTEGRATION_TESTS || !TEST_KEY) {
      console.warn('No PULLNOTE_TEST_TOKEN set, skipping test.');
      return;
    }
    const deleted = await pn.remove(TEST_NOTE_PATH);
    expect(deleted).toBe(1);
    // Re-add for afterAll cleanup
    await pn.add(TEST_NOTE_PATH, {
      title: 'Test Note',
      description: 'A note created by a test',
      content: `${MAIN_MD}\n\n<!-- ${BLOCK_1_ID} -->\n${BLOCK_1_MD}\n\n<!-- ${BLOCK_2_ID} -->\n${BLOCK_2_MD}`
    });
  });

  it('should add a user', async () => {
    if (!RUN_INTEGRATION_TESTS || !TEST_KEY) {
      console.warn('No PULLNOTE_TEST_TOKEN set, skipping test.');
      return;
    }
    await pn.addUser('test@pullnote.com', 'Test User');
  });

  it('should encode # in GET paths (unit)', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        title: 'x',
        path: 'y',
        content: '',
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      })
    }));
    vi.stubGlobal('fetch', fetchMock);

    try {
      vi.resetModules();
      const { PullnoteClient: PullnoteClientLocal } = await import('./PullnoteClient.js');
      const pnLocal = new PullnoteClientLocal('dummy_api_key', 'https://example.com');
      await pnLocal.get(`some/page#${BLOCK_1_ID}`, 'md');

      const calledUrl = (fetchMock as any).mock.calls?.[0]?.[0] as string | undefined;
      expect(calledUrl).toContain(`some/page%23${BLOCK_1_ID}`);
      expect(calledUrl).not.toContain(`#${BLOCK_1_ID}`);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('should strip querystring from MLAuth GET signing (unit)', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        title: 'x',
        path: 'y',
        content: '<p>ok</p>',
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      })
    }));
    vi.stubGlobal('fetch', fetchMock);

    let signedMessage = '';
    try {
      vi.resetModules();
      const { PullnoteClient: PullnoteClientLocal } = await import('./PullnoteClient.js');
      const pnLocal = new PullnoteClientLocal(
        {
          dumbname: 'agent_d1',
          signer: async (message: string) => {
            signedMessage = message;
            return 'c2ln'; // base64 stub
          }
        },
        'https://example.com'
      );

      await pnLocal.get(`some/page#${BLOCK_1_ID}`, 'html');

      expect(signedMessage).toContain(`/some/page%23${BLOCK_1_ID}`);
      expect(signedMessage).not.toContain('format=html');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('getMd should respect #block (unit)', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        title: 'x',
        path: 'y',
        content: BLOCK_1_MD,
        blocks: [],
        block_id: BLOCK_1_ID,
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      })
    }));
    vi.stubGlobal('fetch', fetchMock);

    try {
      vi.resetModules();
      const { PullnoteClient: PullnoteClientLocal } = await import('./PullnoteClient.js');
      const pnLocal = new PullnoteClientLocal('dummy_api_key', 'https://example.com');

      const result = await pnLocal.getMd(`some/page#${BLOCK_1_ID}`);

      const calledUrl = (fetchMock as any).mock.calls?.[0]?.[0] as string | undefined;
      expect(calledUrl).toContain(`some/page%23${BLOCK_1_ID}`);
      expect(calledUrl).not.toContain('format=html');
      expect(result).toBe(BLOCK_1_MD);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('getHtml should respect #block (unit)', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        title: 'x',
        path: 'y',
        content: '<p>block html</p>',
        blocks: [],
        block_id: BLOCK_1_ID,
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      })
    }));
    vi.stubGlobal('fetch', fetchMock);

    try {
      vi.resetModules();
      const { PullnoteClient: PullnoteClientLocal } = await import('./PullnoteClient.js');
      const pnLocal = new PullnoteClientLocal('dummy_api_key', 'https://example.com');

      const result = await pnLocal.getHtml(`some/page#${BLOCK_1_ID}`);

      const calledUrl = (fetchMock as any).mock.calls?.[0]?.[0] as string | undefined;
      expect(calledUrl).toContain(`some/page%23${BLOCK_1_ID}`);
      expect(calledUrl).toContain('format=html');
      expect(result).toBe('<p>block html</p>');
    } finally {
      vi.unstubAllGlobals();
    }
  });

}); 