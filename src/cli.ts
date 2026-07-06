#!/usr/bin/env node
import { Command } from 'commander';
import { check } from './validators/check.js';
import { registerInitCommand } from './commands/init.js';
import { registerContractCommand } from './commands/contract.js';
import { registerPartitionCommand } from './commands/partition.js';
import { registerContextCommand } from './commands/context.js';
import { registerSyncCommand } from './commands/sync.js';
import { registerPullCommand } from './commands/pull.js';
import { registerIntegrateCommand } from './commands/integrate.js';

const program = new Command();

program
  .name('hackx')
  .description('AI Coordination Protocol for hackathon teams')
  .version('0.1.0');

program
  .command('check')
  .description('Validate .hackx/ consistency')
  .action(async () => {
    const result = await check();
    if (result.errors.length > 0) {
      console.error('❌ Validation failed:');
      result.errors.forEach(e => console.error(`  - ${e}`));
    }
    if (result.warnings.length > 0) {
      console.warn('⚠️  Warnings:');
      result.warnings.forEach(w => console.warn(`  - ${w}`));
    }
    if (result.passed) {
      console.log('✅ All checks passed');
    }
    process.exit(result.passed ? 0 : 1);
  });

registerInitCommand(program);
registerContractCommand(program);
registerPartitionCommand(program);
registerContextCommand(program);
registerSyncCommand(program);
registerPullCommand(program);
registerIntegrateCommand(program);

program.parse();
