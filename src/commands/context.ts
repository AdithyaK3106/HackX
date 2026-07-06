import { Command } from 'commander';
import { StateManager } from '../state/manager.js';
import { buildContextPack } from '../partition/packer.js';
import fs from 'fs';
import path from 'path';

export async function context(owner: string, projectRoot: string = '.'): Promise<void> {
  const state = new StateManager(projectRoot);

  // Check all required files
  if (!(await state.slicesExist())) {
    console.error('❌ slices.json not found. Run hackses partition first.');
    process.exit(1);
  }

  if (!(await state.contractsExist())) {
    console.error('❌ contracts.yaml not found.');
    process.exit(1);
  }

  const slices = await state.readSlices();
  const contracts = await state.readContracts();
  const conventions = await state.readConventions();
  const schema = await state.readSchema();

  // Find slice for owner
  const slice = slices.slices.find(s => s.owner === owner);
  if (!slice) {
    console.error(`❌ No slice found for owner: ${owner}`);
    console.error(`Available owners: ${Array.from(new Set(slices.slices.map(s => s.owner))).join(', ')}`);
    process.exit(1);
  }

  // Build pack
  const pack = buildContextPack(owner, slices, contracts, conventions, schema);

  // Write to packs/ directory
  const packsDir = path.join(projectRoot, '.hackses', 'packs');
  await fs.promises.mkdir(packsDir, { recursive: true });

  const packPath = path.join(packsDir, `${owner}.md`);
  await fs.promises.writeFile(packPath, pack, 'utf-8');

  console.log(`✅ Generated ${path.relative(projectRoot, packPath)}`);
  console.log(`\nContext pack ready for ${owner}:`);
  console.log(`  Slice: ${slice.id}`);
  console.log(`  Endpoints: ${slice.contracts?.length || 0}`);
  console.log(`  Owned paths: ${slice.paths.length}`);
  if (slice.depends_on?.length) {
    console.log(`  Dependencies: ${slice.depends_on.join(', ')}`);
  }
}

export function registerContextCommand(program: Command): void {
  program
    .command('context <owner>')
    .description('Build/refresh context pack for an owner')
    .action(async (owner: string) => {
      try {
        await context(owner);
      } catch (err) {
        console.error('❌ Error:', err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}
