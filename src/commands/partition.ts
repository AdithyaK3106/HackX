import { Command } from 'commander';
import { StateManager } from '../state/manager.js';
import { proposeSlices, validateDependencies } from '../partition/slicer.js';
import { buildAllContextPacks } from '../partition/packer.js';
import fs from 'fs';
import path from 'path';
import * as readline from 'readline';

async function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    const suffix = defaultValue ? ` [${defaultValue}]: ` : ': ';
    rl.question(question + suffix, answer => {
      rl.close();
      resolve(answer || defaultValue || '');
    });
  });
}

export async function partition(projectRoot: string = '.'): Promise<void> {
  const state = new StateManager(projectRoot);

  if (!(await state.contractsExist())) {
    console.error('❌ contracts.yaml not found. Run hackx contract generate first.');
    process.exit(1);
  }

  if (!(await state.configExists())) {
    console.error('❌ config.yaml not found. Run hackx init first.');
    process.exit(1);
  }

  console.log('\n📊 Work Partitioner\n');

  const config = await state.readConfig();
  const contracts = await state.readContracts();

  // Propose slices
  console.log(`Proposing slices for ${contracts.endpoints.length} endpoint(s)...\n`);
  const proposal = proposeSlices(contracts, config.team);

  console.log(`Proposed ${proposal.slices.length} slice(s):\n`);
  for (const slice of proposal.slices) {
    console.log(`  • ${slice.id} (owner: ${slice.owner})`);
    console.log(`    Contracts: ${slice.contracts?.length || 0}`);
    console.log(`    Depends on: ${slice.depends_on?.length || 0}`);
  }

  // Validate
  const errors = validateDependencies(proposal.slices);
  if (errors.length > 0) {
    console.error('\n❌ Dependency validation errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  // Confirm
  const confirm = await prompt('\nAccept proposal? (y/n)', 'y');
  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    process.exit(0);
  }

  // Save slices and graph
  await state.writeSlices({ slices: proposal.slices });
  await state.writeGraph(proposal.graph);

  console.log('✅ Saved slices.json and graph.json');

  // Generate context packs
  console.log('\n📦 Generating context packs...\n');

  const conventions = await state.readConventions();
  const schema = await state.readSchema();

  const packs = buildAllContextPacks(
    { slices: proposal.slices },
    contracts,
    conventions,
    schema,
  );

  const packsDir = path.join(projectRoot, '.hackx', 'packs');
  await fs.promises.mkdir(packsDir, { recursive: true });

  for (const [owner, content] of packs) {
    const packPath = path.join(packsDir, `${owner}.md`);
    await fs.promises.writeFile(packPath, content, 'utf-8');
    console.log(`✅ Generated packs/${owner}.md`);
  }

  console.log(`\n✅ Partitioning complete! ${packs.size} context pack(s) ready.`);
  console.log('\nNext: hackx pull (sync and download your context pack)');
}

export function registerPartitionCommand(program: Command): void {
  program
    .command('partition')
    .description('Partition work into slices and generate context packs')
    .action(async () => {
      try {
        await partition();
      } catch (err) {
        if (!(err instanceof Error && err.message.includes('readline was closed'))) {
          console.error('❌ Error:', err instanceof Error ? err.message : err);
        }
        process.exit(1);
      }
    });
}
