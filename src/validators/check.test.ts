import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { check } from './check.js';
import { StateManager } from '../state/manager.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('check command', () => {
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

  it('fails when config missing', async () => {
    const result = await check(tempDir);
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('config.yaml not found');
  });

  it('fails when contracts missing', async () => {
    await manager.writeConfig({
      stack: 'typescript' as const,
      team: ['alice'],
      policy: 'permissive' as const,
    });
    const result = await check(tempDir);
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('contracts.yaml not found');
  });

  it('warns when ownership missing', async () => {
    await manager.writeConfig({
      stack: 'typescript' as const,
      team: ['alice'],
      policy: 'permissive' as const,
    });
    await manager.writeContracts({
      version: '1.0.0',
      endpoints: [],
    });
    const result = await check(tempDir);
    expect(result.warnings).toContain('ownership.yaml not found');
  });

  it('passes when core files exist', async () => {
    await manager.writeConfig({
      stack: 'typescript' as const,
      team: ['alice'],
      policy: 'permissive' as const,
    });
    await manager.writeContracts({
      version: '1.0.0',
      endpoints: [],
    });
    await manager.writeOwnership({
      rules: [
        {
          glob: 'backend/**',
          owner: 'alice',
        },
      ],
    });
    const result = await check(tempDir);
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validates slices format', async () => {
    await manager.writeConfig({
      stack: 'typescript' as const,
      team: ['alice'],
      policy: 'permissive' as const,
    });
    await manager.writeContracts({
      version: '1.0.0',
      endpoints: [],
    });
    await manager.writeSlices({
      slices: [
        {
          id: 'auth',
          owner: 'alice',
          paths: ['backend/auth/**'],
          contracts: [],
          depends_on: [],
          acceptance: [],
          blocked: false,
        },
      ],
    });
    const result = await check(tempDir);
    expect(result.errors).not.toContain('slices.json must have slices array');
  });

  it('detects duplicate slice IDs', async () => {
    await manager.writeConfig({
      stack: 'typescript' as const,
      team: ['alice'],
      policy: 'permissive' as const,
    });
    await manager.writeContracts({
      version: '1.0.0',
      endpoints: [],
    });
    await manager.writeSlices({
      slices: [
        {
          id: 'auth',
          owner: 'alice',
          paths: ['backend/auth/**'],
          contracts: [],
          depends_on: [],
          acceptance: [],
          blocked: false,
        },
        {
          id: 'auth',
          owner: 'bob',
          paths: ['backend/api/**'],
          contracts: [],
          depends_on: [],
          acceptance: [],
          blocked: false,
        },
      ],
    });
    const result = await check(tempDir);
    expect(result.errors).toContain('duplicate slice id: auth');
  });

  it('detects malformed slices.json', async () => {
    await manager.writeConfig({
      stack: 'typescript' as const,
      team: ['alice'],
      policy: 'permissive' as const,
    });
    await manager.writeContracts({
      version: '1.0.0',
      endpoints: [],
    });
    // Write invalid slices.json directly to bypass schema validation
    await (await import('fs')).promises.writeFile(
      path.join(tempDir, '.hackx', 'slices.json'),
      '{ invalid json',
    );
    const result = await check(tempDir);
    expect(result.errors.some(e => e.includes('slices.json'))).toBe(true);
  });
});
