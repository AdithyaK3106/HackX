import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StateManager } from '../state/manager.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Helper to set up a project without prompts
async function setupProject(tempDir: string, config: {
  stack: 'typescript' | 'python' | 'mixed';
  team: string[];
  build?: string;
  test?: string;
  lint?: string;
  policy: 'permissive' | 'strict';
}): Promise<void> {
  const state = new StateManager(tempDir);
  await state.ensureHacksesDir();
  await state.writeConfig(config);
  await state.writeContracts({
    version: '1.0.0',
    endpoints: [],
  });
  await state.writeOwnership({
    rules: config.team.map(t => ({
      glob: `backend/${t}/**`,
      owner: t,
    })),
  });
  await state.writeSlices({
    slices: [],
  });
  await state.writeGraph({
    edges: [],
  });
  const conventions = `# Conventions\n\n## Naming\n- Use camelCase\n`;
  await state.writeConventions(conventions);
  await state.writeSchema(`-- Database schema\n`);
}

describe('initProject setup', () => {
  let tempDir: string;
  let manager: StateManager;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hackses-'));
    manager = new StateManager(tempDir);
  });

  afterEach(async () => {
    fs.rmSync(tempDir, { recursive: true });
  });

  it('creates .hackses directory with all files', async () => {
    await setupProject(tempDir, {
      stack: 'typescript',
      team: ['alice', 'bob'],
      policy: 'permissive',
    });

    expect(await manager.configExists()).toBe(true);
    expect(await manager.contractsExist()).toBe(true);
    expect(await manager.ownershipExists()).toBe(true);
    expect(await manager.slicesExist()).toBe(true);
    expect(await manager.graphExists()).toBe(true);
    expect(await manager.conventionsExist()).toBe(true);
    expect(await manager.schemaExists()).toBe(true);
  });

  it('initializes config with provided options', async () => {
    await setupProject(tempDir, {
      stack: 'python',
      team: ['alice', 'bob'],
      build: 'python setup.py build',
      policy: 'strict',
    });

    const config = await manager.readConfig();
    expect(config.stack).toBe('python');
    expect(config.team).toEqual(['alice', 'bob']);
    expect(config.build).toBe('python setup.py build');
    expect(config.policy).toBe('strict');
  });

  it('creates ownership rules for each team member', async () => {
    await setupProject(tempDir, {
      stack: 'typescript',
      team: ['alice', 'bob', 'charlie'],
      policy: 'permissive',
    });

    const ownership = await manager.readOwnership();
    expect(ownership.rules).toHaveLength(3);
    expect(ownership.rules[0].owner).toBe('alice');
    expect(ownership.rules[1].owner).toBe('bob');
    expect(ownership.rules[2].owner).toBe('charlie');
  });

  it('initializes empty contracts', async () => {
    await setupProject(tempDir, {
      stack: 'typescript',
      team: ['alice'],
      policy: 'permissive',
    });

    const contracts = await manager.readContracts();
    expect(contracts.endpoints).toEqual([]);
    expect(contracts.version).toBe('1.0.0');
  });

  it('initializes empty slices and graph', async () => {
    await setupProject(tempDir, {
      stack: 'typescript',
      team: ['alice'],
      policy: 'permissive',
    });

    const slices = await manager.readSlices();
    expect(slices.slices).toEqual([]);

    const graph = await manager.readGraph();
    expect(graph.edges).toEqual([]);
  });

  it('creates conventions template', async () => {
    await setupProject(tempDir, {
      stack: 'typescript',
      team: ['alice'],
      policy: 'permissive',
    });

    const conventions = await manager.readConventions();
    expect(conventions).toContain('# Conventions');
    expect(conventions).toContain('camelCase');
  });

  it('creates schema template', async () => {
    await setupProject(tempDir, {
      stack: 'typescript',
      team: ['alice'],
      policy: 'permissive',
    });

    const schema = await manager.readSchema();
    expect(schema).toContain('Database schema');
  });

  it('handles mixed stack', async () => {
    await setupProject(tempDir, {
      stack: 'mixed',
      team: ['alice'],
      policy: 'permissive',
    });

    const config = await manager.readConfig();
    expect(config.stack).toBe('mixed');
  });
});
