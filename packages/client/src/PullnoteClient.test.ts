import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PullnoteClient } from './PullnoteClient.js';

const TEST_KEY = process.env.PULLNOTE_TEST_KEY;
const TEST_NOTE_SLUG = 'pullnote-npm-package-test-note-' + Math.random().toString(36).slice(2, 10);

let pn: PullnoteClient;
let addedNote: any;

describe('PullnoteClient', () => {
  beforeAll(async () => {
    if (!TEST_KEY) return;
    pn = new PullnoteClient(TEST_KEY);
    // Add the note for subsequent tests
    const note = {
      title: 'Test Note',
      description: 'A note created by a test',
      content_md: 'Initial content',
      params: { slug: TEST_NOTE_SLUG },
    };
    addedNote = await pn.add(note);
  });

  afterAll(async () => {
    if (!TEST_KEY) return;
    // Remove the note after all tests
    try {
      await pn.remove(TEST_NOTE_SLUG);
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
    expect(addedNote).toHaveProperty('slug', TEST_NOTE_SLUG);
  });

  it('should get a note', async () => {
    if (!TEST_KEY) {
      console.warn('No PULLNOTE_TEST_TOKEN set, skipping test.');
      return;
    }
    const fetched = await pn.get(TEST_NOTE_SLUG);
    expect(fetched).toHaveProperty('title', 'Test Note');
    expect(fetched).toHaveProperty('slug', TEST_NOTE_SLUG);
  });

  it('should update a note', async () => {
    if (!TEST_KEY) {
      console.warn('No PULLNOTE_TEST_TOKEN set, skipping test.');
      return;
    }
    const updated = await pn.update({ title: 'Updated Test Note' }, TEST_NOTE_SLUG);
    expect(updated).toHaveProperty('title', 'Updated Test Note');
  });

  it('should remove a note', async () => {
    if (!TEST_KEY) {
      console.warn('No PULLNOTE_TEST_TOKEN set, skipping test.');
      return;
    }
    await pn.remove(TEST_NOTE_SLUG);
    let error = null;
    try {
      await pn.get(TEST_NOTE_SLUG);
    } catch (e) {
      error = e;
    }
    expect(error).toBeTruthy();
    // Re-add for afterAll cleanup
    await pn.add({
      title: 'Test Note',
      description: 'A note created by a test',
      content_md: 'Initial content',
      params: { slug: TEST_NOTE_SLUG },
    });
  });
}); 