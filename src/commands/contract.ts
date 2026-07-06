import { Command } from 'commander';
import { StateManager } from '../state/manager.js';
import { Endpoint } from '../schemas/index.js';
import { regenerateSharedTypes } from '../emitters/regenerate.js';
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

async function promptEndpoint(): Promise<Endpoint | null> {
  console.log('\n--- Add Endpoint ---');
  const method = await prompt('HTTP Method (GET/POST/PUT/DELETE/PATCH)');
  if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    console.log('❌ Invalid method');
    return null;
  }

  const path = await prompt('Path (e.g., /auth/login)');
  if (!path.startsWith('/')) {
    console.log('❌ Path must start with /');
    return null;
  }

  const description = await prompt('Description (optional)');

  // Response type
  const responseType = await prompt('Response type (object/array/string/number/boolean)', 'object');
  if (!['object', 'array', 'string', 'number', 'boolean'].includes(responseType)) {
    console.log('❌ Invalid response type');
    return null;
  }

  const endpoint: Endpoint = {
    id: `${method} ${path}`,
    method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path,
    response: { type: responseType as any },
    description: description || undefined,
  };

  // Request (optional)
  const hasRequest = await prompt('Add request schema? (y/n)', 'n');
  if (hasRequest.toLowerCase() === 'y') {
    endpoint.request = { type: 'object' as const };
  }

  return endpoint;
}

export async function generateContracts(projectRoot: string = '.'): Promise<void> {
  const state = new StateManager(projectRoot);

  if (!(await state.contractsExist())) {
    console.error('❌ contracts.yaml not found. Run hackx init first.');
    process.exit(1);
  }

  console.log('\n📝 Contract Generator\n');
  console.log('Add endpoints to define your API contracts.');
  console.log('Press Ctrl+C to finish.\n');

  const contracts = await state.readContracts();
  const endpoints = contracts.endpoints || [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const endpoint = await promptEndpoint();
    if (!endpoint) {
      console.log('Skipped.\n');
      continue;
    }

    // Check for duplicates
    if (endpoints.some(e => e.id === endpoint.id)) {
      console.log(`⚠️  Endpoint ${endpoint.id} already exists (skipped)`);
      continue;
    }

    endpoints.push(endpoint);
    console.log(`✅ Added ${endpoint.id}`);

    const another = await prompt('Add another? (y/n)', 'y');
    if (another.toLowerCase() !== 'y') {
      break;
    }
  }

  // Update contracts
  const updated = {
    ...contracts,
    endpoints,
  };
  await state.writeContracts(updated);

  // Regenerate shared types
  await regenerateSharedTypes(projectRoot);

  console.log(`\n✅ Saved ${endpoints.length} endpoint(s) to contracts.yaml`);
  console.log('✅ Regenerated shared types');
  console.log('\nNext: hackx partition');
}

export function registerContractCommand(program: Command): void {
  program
    .command('contract <action>')
    .description('Manage API contracts')
    .option('--file <path>', 'Path to import from (for generate)')
    .action(async (action) => {
      try {
        if (action === 'generate') {
          await generateContracts();
        } else {
          console.error('❌ Unknown action:', action);
          process.exit(1);
        }
      } catch (err) {
        if (!(err instanceof Error && err.message.includes('readline was closed'))) {
          console.error('❌ Error:', err instanceof Error ? err.message : err);
        }
        process.exit(1);
      }
    });
}
