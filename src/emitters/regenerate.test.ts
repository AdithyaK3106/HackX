import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { regenerateSharedTypes } from './regenerate.js';
import { StateManager } from '../state/manager.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('regenerateSharedTypes', () => {
  let tempDir: string;
  let manager: StateManager;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hackses-'));
    manager = new StateManager(tempDir);
    await manager.ensureHacksesDir();
  });

  afterEach(async () => {
    fs.rmSync(tempDir, { recursive: true });
  });

  it('generates TypeScript types for typescript stack', async () => {
    await manager.writeConfig({
      stack: 'typescript' as const,
      team: ['alice'],
      policy: 'permissive' as const,
    });
    await manager.writeContracts({
      version: '1.0.0',
      endpoints: [
        {
          id: 'GET /user',
          method: 'GET',
          path: '/user',
          response: { type: 'object' },
        },
      ],
    });

    await regenerateSharedTypes(tempDir);

    const tsPath = path.join(tempDir, '.hackses', 'shared_types', 'index.ts');
    expect(fs.existsSync(tsPath)).toBe(true);
    const content = fs.readFileSync(tsPath, 'utf-8');
    expect(content).toContain('export type');
    expect(content).toContain('GET_userResponse');
  });

  it('generates Python types for python stack', async () => {
    await manager.writeConfig({
      stack: 'python' as const,
      team: ['alice'],
      policy: 'permissive' as const,
    });
    await manager.writeContracts({
      version: '1.0.0',
      endpoints: [
        {
          id: 'GET /user',
          method: 'GET',
          path: '/user',
          response: { type: 'object' },
        },
      ],
    });

    await regenerateSharedTypes(tempDir);

    const pyPath = path.join(tempDir, '.hackses', 'shared_types', 'types.py');
    expect(fs.existsSync(pyPath)).toBe(true);
    const content = fs.readFileSync(pyPath, 'utf-8');
    expect(content).toContain('class');
    expect(content).toContain('GET_userResponse');
  });

  it('generates both for mixed stack', async () => {
    await manager.writeConfig({
      stack: 'mixed' as const,
      team: ['alice'],
      policy: 'permissive' as const,
    });
    await manager.writeContracts({
      version: '1.0.0',
      endpoints: [
        {
          id: 'GET /user',
          method: 'GET',
          path: '/user',
          response: { type: 'object' },
        },
      ],
    });

    await regenerateSharedTypes(tempDir);

    const tsPath = path.join(tempDir, '.hackses', 'shared_types', 'index.ts');
    const pyPath = path.join(tempDir, '.hackses', 'shared_types', 'types.py');
    expect(fs.existsSync(tsPath)).toBe(true);
    expect(fs.existsSync(pyPath)).toBe(true);
  });

  it('creates shared_types directory if missing', async () => {
    await manager.writeConfig({
      stack: 'typescript' as const,
      team: ['alice'],
      policy: 'permissive' as const,
    });
    await manager.writeContracts({
      version: '1.0.0',
      endpoints: [],
    });

    const dir = path.join(tempDir, '.hackses', 'shared_types');
    expect(fs.existsSync(dir)).toBe(false);

    await regenerateSharedTypes(tempDir);

    expect(fs.existsSync(dir)).toBe(true);
  });
});
