import { describe, it, expect } from 'vitest';
import { createSyncEvent, isTrivialEvent, eventFilename } from './events.js';

describe('createSyncEvent', () => {
  it('creates event with all fields', () => {
    const event = createSyncEvent(
      'alice',
      ['POST /auth/login'],
      ['backend/auth/login.ts'],
      null,
    );

    expect(event.author).toBe('alice');
    expect(event.contract_changes).toEqual(['POST /auth/login']);
    expect(event.files_changed).toEqual(['backend/auth/login.ts']);
    expect(event.blocked).toBeNull();
    expect(event.at).toBeTruthy();
  });

  it('defaults to empty arrays and null blocked', () => {
    const event = createSyncEvent('bob');

    expect(event.contract_changes).toEqual([]);
    expect(event.files_changed).toEqual([]);
    expect(event.blocked).toBeNull();
  });

  it('sets blocked state', () => {
    const event = createSyncEvent('charlie', [], [], 'api');

    expect(event.blocked).toBe('api');
  });
});

describe('isTrivialEvent', () => {
  it('detects trivial event', () => {
    const event = createSyncEvent('alice');
    expect(isTrivialEvent(event)).toBe(true);
  });

  it('detects non-trivial contract changes', () => {
    const event = createSyncEvent('alice', ['POST /users']);
    expect(isTrivialEvent(event)).toBe(false);
  });

  it('detects non-trivial file changes', () => {
    const event = createSyncEvent('alice', [], ['src/foo.ts']);
    expect(isTrivialEvent(event)).toBe(false);
  });

  it('detects non-trivial blocked state', () => {
    const event = createSyncEvent('alice', [], [], 'upstream');
    expect(isTrivialEvent(event)).toBe(false);
  });
});

describe('eventFilename', () => {
  it('generates filename from timestamp and author', () => {
    const event = createSyncEvent('alice');
    const filename = eventFilename(event);

    expect(filename).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}.*_alice\.json$/);
  });

  it('handles different authors', () => {
    const event1 = createSyncEvent('alice');
    const event2 = createSyncEvent('bob');

    const filename1 = eventFilename(event1);
    const filename2 = eventFilename(event2);

    expect(filename1).toContain('_alice.json');
    expect(filename2).toContain('_bob.json');
  });
});
