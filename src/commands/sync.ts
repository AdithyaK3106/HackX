import { Command } from 'commander';
import { StateManager } from '../state/manager.js';
import { createSyncEvent, isTrivialEvent, eventFilename } from '../sync/events.js';
import * as readline from 'readline';
import { execSync } from 'child_process';

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

export async function sync(projectRoot: string = '.'): Promise<void> {
  const state = new StateManager(projectRoot);

  if (!(await state.configExists())) {
    console.error('❌ config.yaml not found. Run hackx init first.');
    process.exit(1);
  }

  console.log('\n📤 Sync Event Creator\n');

  // Get current user (from config or environment)
  const config = await state.readConfig();
  const author = config.team[0] || 'unknown'; // ponytail: simplified; v2 can prompt

  // Infer files changed from git
  let filesChanged: string[] = [];
  try {
    const gitDiff = execSync('git diff --name-only HEAD', { encoding: 'utf-8' });
    filesChanged = gitDiff.trim().split('\n').filter(f => f && !f.startsWith('.hackx'));
  } catch {
    // Not in a git repo or no changes
  }

  console.log(`Author: ${author}`);
  console.log(`Files changed (from git): ${filesChanged.length}`);

  // Contract changes
  const contractChangesStr = await prompt('Contract changes (comma-separated, or empty)', '');
  const contractChanges = contractChangesStr
    .split(',')
    .map(s => s.trim())
    .filter(s => s);

  // Blocked state
  const blockedStr = await prompt('Blocked on (slice name, or empty)', '');
  const blocked = blockedStr || null;

  // Create event
  const event = createSyncEvent(author, contractChanges, filesChanged, blocked);

  // Skip trivial events
  if (isTrivialEvent(event)) {
    console.log('⏭️  No changes detected; skipping sync event (idempotent).');
    return;
  }

  // Write event
  const filename = eventFilename(event);
  await state.writeSyncEvent(filename, event);

  console.log(`✅ Sync event created: sync/${filename}`);
  console.log(`  Contracts: ${contractChanges.length}`);
  console.log(`  Files: ${filesChanged.length}`);
  console.log(`  Blocked: ${blocked || 'no'}`);

  // Commit
  try {
    execSync(`git add .hackx/sync/${filename}`, { stdio: 'inherit' });
    execSync(`git commit -m "Sync event: ${author} (${contractChanges.length} contracts, ${filesChanged.length} files)"`, {
      stdio: 'inherit',
    });
    console.log('✅ Committed to git');
  } catch {
    console.warn('⚠️  Could not auto-commit; commit manually');
  }

  console.log('\nNext: hackx pull (download relevant events)');
}

export function registerSyncCommand(program: Command): void {
  program
    .command('sync')
    .description('Record contract/file changes and blockers')
    .action(async () => {
      try {
        await sync();
      } catch (err) {
        if (!(err instanceof Error && err.message.includes('readline was closed'))) {
          console.error('❌ Error:', err instanceof Error ? err.message : err);
        }
        process.exit(1);
      }
    });
}
