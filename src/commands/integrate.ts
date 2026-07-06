import { Command } from 'commander';
import { StateManager } from '../state/manager.js';
import { checkOwnership } from '../validators/ownership.js';
import { checkContractChanges, findContractChanges } from '../validators/contracts.js';
import { checkTypeConsistency } from '../validators/types.js';
import { checkSchemaChanges } from '../validators/schema.js';
import { execSync } from 'child_process';
import path from 'path';

export interface MergeDecision {
  approved: boolean;
  requiresHumanReview: boolean;
  checks: {
    name: string;
    passed: boolean;
    message?: string;
  }[];
}

export async function integrate(): Promise<void> {
  const state = new StateManager();

  console.log('\n✅ Integration Validation Pipeline\n');

  // Load state
  if (!(await state.configExists())) {
    console.error('❌ config.yaml not found');
    process.exit(1);
  }

  const config = await state.readConfig();
  const currentContracts = await state.readContracts();
  const ownership = await state.readOwnership();
  const slices = await state.readSlices();
  const currentSchema = await state.readSchema();

  // Get git info
  let author = config.team[0];
  let changedFiles: string[] = [];

  try {
    execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    const gitDiff = execSync('git diff --name-only main...HEAD', { encoding: 'utf-8' });
    changedFiles = gitDiff.trim().split('\n').filter(f => f);
  } catch {
    console.warn('⚠️  Could not determine git state; assuming main branch');
  }

  const checks: MergeDecision['checks'] = [];

  // 1. Ownership check
  console.log('📋 Checking ownership...');
  const ownershipResult = checkOwnership(changedFiles, author, ownership, slices, config.policy);
  if (!ownershipResult.passed) {
    checks.push({
      name: 'Ownership',
      passed: false,
      message: `Violations: ${ownershipResult.violations.map(v => v.path).join(', ')}`,
    });
    console.log('  ❌ Ownership violations');
  } else {
    checks.push({ name: 'Ownership', passed: true });
    console.log('  ✓ Ownership OK');
  }

  // 2. Contract compatibility
  console.log('📋 Checking contracts...');
  const contractResult = checkContractChanges(
    currentContracts,
    currentContracts,
    [],
    author,
  );
  if (!contractResult.passed) {
    checks.push({
      name: 'Contracts',
      passed: false,
      message: contractResult.errors.join('; '),
    });
    console.log('  ❌ Contract mismatches');
  } else {
    checks.push({ name: 'Contracts', passed: true });
    console.log('  ✓ Contracts OK');
  }

  // 3. Type consistency
  console.log('📋 Checking types...');
  const sharedTypesDir = path.join('.hackses', 'shared_types');
  const typeResult = await checkTypeConsistency(currentContracts, sharedTypesDir, config.stack);
  if (!typeResult.passed) {
    checks.push({
      name: 'Types',
      passed: false,
      message: typeResult.errors.join('; '),
    });
    console.log('  ❌ Type mismatches');
  } else {
    checks.push({ name: 'Types', passed: true });
    console.log('  ✓ Types OK');
  }

  // 4. Schema compatibility
  console.log('📋 Checking schema...');
  const schemaResult = checkSchemaChanges(currentSchema, currentSchema);
  if (!schemaResult.passed) {
    checks.push({
      name: 'Schema',
      passed: false,
      message: schemaResult.warnings.join('; '),
    });
    console.log('  ⚠️  Schema warnings');
  } else {
    checks.push({ name: 'Schema', passed: true });
    console.log('  ✓ Schema OK');
  }

  // Merge decision logic
  const allChecksPassed = checks.every(c => c.passed);
  const contractsChanged = findContractChanges(currentContracts, currentContracts);
  const hasContractChanges = (contractsChanged.added.length > 0 ||
    contractsChanged.removed.length > 0 ||
    contractsChanged.modified.length > 0);

  let decision: MergeDecision;

  if (!allChecksPassed) {
    decision = {
      approved: false,
      requiresHumanReview: false,
      checks,
    };
  } else if (hasContractChanges) {
    decision = {
      approved: false,
      requiresHumanReview: true,
      checks,
    };
  } else {
    decision = {
      approved: true,
      requiresHumanReview: false,
      checks,
    };
  }

  // Report
  console.log('\n📊 Merge Decision:\n');
  if (decision.approved) {
    console.log('✅ AUTO-APPROVED');
    console.log('  All checks passed and no contract changes');
  } else if (decision.requiresHumanReview) {
    console.log('⚠️  REQUIRES HUMAN REVIEW');
    console.log('  Contract changes detected; manual approval needed');
  } else {
    console.log('❌ BLOCKED');
    console.log('  Checks failed');
  }

  console.log('\nCheck results:');
  for (const check of checks) {
    const status = check.passed ? '✓' : '❌';
    const msg = check.message ? ` — ${check.message}` : '';
    console.log(`  ${status} ${check.name}${msg}`);
  }

  process.exit(decision.approved ? 0 : 1);
}

export function registerIntegrateCommand(program: Command): void {
  program
    .command('integrate')
    .description('Validate integration and decide on merge')
    .action(async () => {
      try {
        await integrate();
      } catch (err) {
        console.error('❌ Error:', err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}
