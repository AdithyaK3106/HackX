#!/usr/bin/env node
import { Command } from 'commander';
import { check } from './validators/check.js';
import { registerInitCommand } from './commands/init.js';
import { registerContractCommand } from './commands/contract.js';

const program = new Command();

program
  .name('hackses')
  .description('AI Coordination Protocol for hackathon teams')
  .version('0.1.0');

program
  .command('check')
  .description('Validate .hackses/ consistency')
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

program.parse();
