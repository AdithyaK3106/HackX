import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { check } from '../validators/check.js';
import { StateManager } from '../state/manager.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('Performance budgets', () => {
  let tempDir: string;
  let manager: StateManager;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hackses-perf-'));
    manager = new StateManager(tempDir);
    await manager.ensureHacksesDir();
  });

  afterEach(async () => {
    fs.rmSync(tempDir, { recursive: true });
  });

  it('check command runs in < 1s', async () => {
    await manager.writeConfig({
      stack: 'typescript' as const,
      team: ['alice'],
      policy: 'permissive' as const,
    });
    await manager.writeContracts({
      version: '1.0.0',
      endpoints: Array.from({ length: 100 }, (_, i) => ({
        id: `GET /api/endpoint${i}`,
        method: 'GET' as const,
        path: `/api/endpoint${i}`,
        response: { type: 'object' as const },
      })),
    });

    const start = Date.now();
    const result = await check(tempDir);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000);
    expect(result.passed).toBe(true);
  });

  it('check with many slices completes quickly', async () => {
    await manager.writeConfig({
      stack: 'typescript' as const,
      team: Array.from({ length: 10 }, (_, i) => `user${i}`),
      policy: 'permissive' as const,
    });
    await manager.writeContracts({
      version: '1.0.0',
      endpoints: [],
    });
    await manager.writeSlices({
      slices: Array.from({ length: 50 }, (_, i) => ({
        id: `slice${i}`,
        owner: `user${i % 10}`,
        paths: [`backend/slice${i}/**`],
        contracts: [],
        depends_on: [],
        acceptance: [],
        blocked: false,
      })),
    });

    const start = Date.now();
    const result = await check(tempDir);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000);
    expect(result.passed).toBe(true);
  });
});
