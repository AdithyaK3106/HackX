import { Command } from 'commander';
import { StateManager } from '../state/manager.js';
import { filterRelevantEvents, RelevanceContext } from '../sync/relevance.js';

export async function pull(owner: string, projectRoot: string = '.'): Promise<void> {
  const state = new StateManager(projectRoot);

  // Check required files
  if (!(await state.slicesExist())) {
    console.error('❌ slices.json not found. Run hackx partition first.');
    process.exit(1);
  }

  if (!(await state.contractsExist())) {
    console.error('❌ contracts.yaml not found.');
    process.exit(1);
  }

  console.log(`\n📥 Pull: Relevant Events for ${owner}\n`);

  // Load state
  const slices = await state.readSlices();
  const contracts = await state.readContracts();
  const graph = await state.readGraph();
  const allEvents = await state.readAllSyncEvents();

  // Find owner's slice
  const mySlice = slices.slices.find(s => s.owner === owner);
  if (!mySlice) {
    console.error(`❌ No slice found for owner: ${owner}`);
    console.error(`Available owners: ${Array.from(new Set(slices.slices.map(s => s.owner))).join(', ')}`);
    process.exit(1);
  }

  // Filter relevant events
  const context: RelevanceContext = {
    mySlice,
    allSlices: slices.slices,
    contracts,
    graph,
  };

  const relevantEvents = filterRelevantEvents(allEvents, context);

  if (relevantEvents.length === 0) {
    console.log('✓ No relevant events.');
    return;
  }

  console.log(`📋 ${relevantEvents.length} relevant event(s):\n`);

  for (const event of relevantEvents) {
    const timestamp = new Date(event.at).toLocaleString();
    console.log(`[${timestamp}] ${event.author}`);

    if (event.contract_changes.length > 0) {
      console.log(`  📝 Contracts: ${event.contract_changes.join(', ')}`);
    }

    if (event.files_changed.length > 0) {
      const fileCount = event.files_changed.length;
      const preview = event.files_changed.slice(0, 3).join(', ');
      const more = fileCount > 3 ? ` (+${fileCount - 3} more)` : '';
      console.log(`  📄 Files: ${preview}${more}`);
    }

    if (event.blocked) {
      console.log(`  🚫 Blocked on: ${event.blocked}`);
    }

    console.log();
  }

  console.log(`✅ ${relevantEvents.length} event(s) relevant to your slice.\n`);
  console.log(`Your slice: ${mySlice.id}`);
  console.log(`Implements: ${mySlice.contracts?.length || 0} contract(s)`);
  console.log(`Depends on: ${mySlice.depends_on?.length || 0} slice(s)`);
}

export function registerPullCommand(program: Command): void {
  program
    .command('pull <owner>')
    .description('Show relevant sync events for an owner')
    .action(async (owner: string) => {
      try {
        await pull(owner);
      } catch (err) {
        console.error('❌ Error:', err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}
