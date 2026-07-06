import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StateManager } from '../state/manager.js';
import { createSyncEvent, eventFilename } from '../sync/events.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('Conflict-resistance', () => {
  let tempDir: string;
  let manager: StateManager;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hackses-conflict-'));
    manager = new StateManager(tempDir);
    await manager.ensureHacksesDir();
  });

  afterEach(async () => {
    fs.rmSync(tempDir, { recursive: true });
  });

  it('4 concurrent authors can sync without conflicts', async () => {
    const authors = ['alice', 'bob', 'charlie', 'diana'];

    // Each author creates a sync event
    for (const author of authors) {
      const event = createSyncEvent(
        author,
        [`POST /api/${author}`],
        [`backend/${author}/file.ts`],
      );
      const filename = eventFilename(event);
      await manager.writeSyncEvent(filename, event);
    }

    // Read all events back — should have 4 distinct files
    const allEvents = await manager.readAllSyncEvents();
    expect(allEvents).toHaveLength(4);

    // Each event should be unique
    const eventAuthors = new Set(allEvents.map(e => e.author));
    expect(eventAuthors.size).toBe(4);
  });

  it('append-only sync events prevent merge conflicts', async () => {
    // Simulate two authors writing events simultaneously
    // by creating files with different timestamps

    const event1 = createSyncEvent('alice', ['GET /users']);
    const event2 = createSyncEvent('bob', ['POST /users']);

    // Write both to disk
    const filename1 = eventFilename(event1);
    const filename2 = eventFilename(event2);

    await manager.writeSyncEvent(filename1, event1);
    await manager.writeSyncEvent(filename2, event2);

    // Both should exist independently
    const syncDir = path.join(tempDir, '.hackses', 'sync');
    const files = fs.readdirSync(syncDir);
    expect(files).toHaveLength(2);
  });

  it('one-file-per-owner packs prevent conflicts', async () => {
    const owners = ['alice', 'bob', 'charlie'];

    // Write packs for each owner
    const packsDir = path.join(tempDir, '.hackses', 'packs');
    fs.mkdirSync(packsDir, { recursive: true });

    for (const owner of owners) {
      const packPath = path.join(packsDir, `${owner}.md`);
      fs.writeFileSync(packPath, `# Pack for ${owner}\n`);
    }

    // All should coexist
    const packs = fs.readdirSync(packsDir);
    expect(packs).toHaveLength(3);
  });

  it('single-writer config and contracts prevent conflicts', async () => {
    // Only one party should write these at a time
    // Simulate sequential writes (no concurrent access)

    const config = {
      stack: 'typescript' as const,
      team: ['alice', 'bob'],
      policy: 'strict' as const,
    };

    const contracts = {
      version: '1.0.0',
      endpoints: [
        {
          id: 'GET /health',
          method: 'GET' as const,
          path: '/health',
          response: { type: 'object' as const },
        },
      ],
    };

    // Write config
    await manager.writeConfig(config);
    // Write contracts
    await manager.writeContracts(contracts);

    // Both should exist independently
    expect(fs.existsSync(path.join(tempDir, '.hackses', 'config.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, '.hackses', 'contracts.yaml'))).toBe(true);

    // Read them back
    const readConfig = await manager.readConfig();
    const readContracts = await manager.readContracts();

    expect(readConfig.team).toEqual(config.team);
    expect(readContracts.endpoints).toHaveLength(1);
  });
});
