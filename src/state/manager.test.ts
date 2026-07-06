import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StateManager } from './manager.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('StateManager', () => {
  let tempDir: string;
  let manager: StateManager;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hackx-'));
    manager = new StateManager(tempDir);
    await manager.ensureHacksesDir();
  });

  afterEach(async () => {
    fs.rmSync(tempDir, { recursive: true });
  });

  describe('Config', () => {
    it('round-trips config', async () => {
      const config = {
        stack: 'typescript' as const,
        team: ['alice', 'bob'],
        build: 'npm run build',
        policy: 'strict' as const,
      };
      await manager.writeConfig(config);
      const read = await manager.readConfig();
      expect(read).toEqual(config);
    });

    it('detects missing config', async () => {
      expect(await manager.configExists()).toBe(false);
    });
  });

  describe('Contracts', () => {
    it('round-trips contracts', async () => {
      const contracts = {
        version: '1.0.0',
        endpoints: [
          {
            id: 'POST /auth/login',
            method: 'POST' as const,
            path: '/auth/login',
            response: { type: 'object' as const },
          },
        ],
      };
      await manager.writeContracts(contracts);
      const read = await manager.readContracts();
      expect(read.endpoints).toHaveLength(1);
      expect(read.endpoints[0].method).toBe('POST');
    });
  });

  describe('Slices', () => {
    it('round-trips slices', async () => {
      const slices = {
        slices: [
          {
            id: 'auth',
            owner: 'alice',
            paths: ['backend/auth/**'],
            contracts: ['POST /auth/login'],
            depends_on: [],
            acceptance: [],
            blocked: false,
          },
        ],
      };
      await manager.writeSlices(slices);
      const read = await manager.readSlices();
      expect(read.slices).toHaveLength(1);
      expect(read.slices[0].owner).toBe('alice');
    });
  });

  describe('Sync Events', () => {
    it('round-trips sync event', async () => {
      const event = {
        author: 'alice',
        at: new Date().toISOString(),
        contract_changes: ['POST /auth/refresh'],
        files_changed: ['backend/auth/refresh.ts'],
        blocked: null,
      };
      await manager.writeSyncEvent('test.json', event);
      const read = await manager.readSyncEvent('test.json');
      expect(read.author).toBe('alice');
      expect(read.contract_changes).toContain('POST /auth/refresh');
    });

    it('reads all sync events sorted by timestamp', async () => {
      const now = new Date();
      const event1 = {
        author: 'alice',
        at: new Date(now.getTime() + 1000).toISOString(),
        contract_changes: [],
        files_changed: [],
        blocked: null,
      };
      const event2 = {
        author: 'bob',
        at: new Date(now.getTime()).toISOString(),
        contract_changes: [],
        files_changed: [],
        blocked: null,
      };
      await manager.writeSyncEvent('2.json', event1);
      await manager.writeSyncEvent('1.json', event2);
      const all = await manager.readAllSyncEvents();
      expect(all).toHaveLength(2);
      expect(all[0].author).toBe('bob');
      expect(all[1].author).toBe('alice');
    });
  });

  describe('Integration State', () => {
    it('defaults to empty state if missing', async () => {
      const state = await manager.readIntegrationState();
      expect(state.last_validated_commit).toBeNull();
      expect(state.merge_history).toEqual([]);
    });

    it('round-trips integration state', async () => {
      const state = {
        last_validated_commit: 'abc123',
        merge_history: [
          {
            commit: 'abc123',
            at: new Date().toISOString(),
            author: 'alice',
            results: [
              {
                name: 'ownership',
                passed: true,
              },
            ],
          },
        ],
      };
      await manager.writeIntegrationState(state);
      const read = await manager.readIntegrationState();
      expect(read.last_validated_commit).toBe('abc123');
      expect(read.merge_history).toHaveLength(1);
    });
  });

  describe('Text files', () => {
    it('round-trips conventions', async () => {
      const content = '# Conventions\n- Use camelCase\n';
      await manager.writeConventions(content);
      const read = await manager.readConventions();
      expect(read).toBe(content);
    });

    it('round-trips schema', async () => {
      const content = 'CREATE TABLE users (id INT PRIMARY KEY);';
      await manager.writeSchema(content);
      const read = await manager.readSchema();
      expect(read).toBe(content);
    });
  });
});
