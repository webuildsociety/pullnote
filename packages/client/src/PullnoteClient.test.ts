import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PullnoteClient } from './PullnoteClient.js';
import 'dotenv/config';

// Place a PULLNOTE_TEST_KEY in /packages/client/.env
const TEST_KEY = process.env.PULLNOTE_TEST_KEY;
const TEST_API = process.env.PULLNOTE_TEST_API;
const TEST_NOTE_PATH = 'pullnote-npm-package-test-note-' + Math.random().toString(36).slice(2, 10);

let pn: PullnoteClient;
let addedNote: any;

describe('PullnoteClient', () => {
  beforeAll(async () => {
    if (!TEST_KEY) return;
    pn = new PullnoteClient(TEST_KEY, TEST_API);
    // Add the note for subsequent tests
    const note = {
      title: 'Test Note',
      description: 'A note created by a test',
      content: 'Initial content'
    };
    addedNote = await pn.add(TEST_NOTE_PATH, note);
  });

  afterAll(async () => {
    if (!TEST_KEY) return;
    // Remove the note after all tests
    try {
      await pn.remove(TEST_NOTE_PATH);
    } catch (e) {
      // Ignore errors if already removed
    }
  });

  it('should add a note', async () => {
    if (!TEST_KEY) {
      console.warn('No PULLNOTE_TEST_TOKEN set, skipping test.');
      return;
    }
    expect(addedNote).toHaveProperty('title', 'Test Note');
    expect(addedNote).toHaveProperty('path', TEST_NOTE_PATH);
  });

  it('should get a note', async () => {
    if (!TEST_KEY) {
      console.warn('No PULLNOTE_TEST_TOKEN set, skipping test.');
      return;
    }
    const fetched = await pn.get(TEST_NOTE_PATH);
    expect(fetched).toHaveProperty('title', 'Test Note');
    expect(fetched).toHaveProperty('path', TEST_NOTE_PATH);
  });

  it('should update a note', async () => {
    if (!TEST_KEY) {
      console.warn('No PULLNOTE_TEST_TOKEN set, skipping test.');
      return;
    }
    const updated = await pn.update(TEST_NOTE_PATH, { title: 'Updated Test Note' });
    expect(updated).toHaveProperty('title', 'Updated Test Note');
  });

  it('should remove a note', async () => {
    if (!TEST_KEY) {
      console.warn('No PULLNOTE_TEST_TOKEN set, skipping test.');
      return;
    }
    const deleted = await pn.remove(TEST_NOTE_PATH);
    expect(deleted).toBe(1);
    // Re-add for afterAll cleanup
    await pn.add(TEST_NOTE_PATH, {
      title: 'Test Note',
      description: 'A note created by a test',
      content: 'Initial content'
    });
  });

  it('should add a user', async () => {
    if (!TEST_KEY) {
      console.warn('No PULLNOTE_TEST_TOKEN set, skipping test.');
      return;
    }
    await pn.addUser('test@pullnote.com', 'Test User');
  });

}); 