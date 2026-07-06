import { Command } from 'commander';
import { StateManager } from '../state/manager.js';
import * as readline from 'readline';

interface InitOptions {
  stack?: string;
  team?: string;
  build?: string;
  test?: string;
  lint?: string;
  policy?: string;
}

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

export async function initProject(optionsOrRoot: InitOptions | string = '.', options?: InitOptions): Promise<void> {
  let projectRoot = '.';
  let opts: InitOptions;

  if (typeof optionsOrRoot === 'string') {
    projectRoot = optionsOrRoot;
    opts = options || {};
  } else {
    opts = optionsOrRoot;
  }

  const state = new StateManager(projectRoot);

  console.log('\n🚀 Initializing HackSES project...\n');

  // Check if already initialized
  if (await state.configExists()) {
    console.log('⚠️  .hackses/ already initialized');
    return;
  }

  // Stack
  let stack = opts.stack;
  if (!stack) {
    const answer = await prompt(
      'Stack (typescript/python/mixed)',
      'typescript',
    );
    stack = answer || 'typescript';
  }
  if (!['typescript', 'python', 'mixed'].includes(stack)) {
    throw new Error('Invalid stack');
  }

  // Team
  let teamStr = opts.team;
  if (!teamStr) {
    teamStr = await prompt(
      'Team members (comma-separated usernames)',
      'alice,bob',
    );
  }
  const team = teamStr.split(',').map(t => t.trim()).filter(t => t);
  if (team.length === 0) {
    throw new Error('Team cannot be empty');
  }

  // Commands
  const build = opts.build || (await prompt('Build command (optional)', ''));
  const test = opts.test || (await prompt('Test command (optional)', ''));
  const lint = opts.lint || (await prompt('Lint command (optional)', ''));

  // Policy
  let policy = opts.policy;
  if (!policy) {
    const answer = await prompt(
      'Ownership policy (permissive/strict)',
      'permissive',
    );
    policy = answer || 'permissive';
  }
  if (!['permissive', 'strict'].includes(policy)) {
    throw new Error('Invalid policy');
  }

  // Create .hackses directory
  await state.ensureHacksesDir();

  // Write config
  const config = {
    stack: stack as 'typescript' | 'python' | 'mixed',
    team,
    build: build || undefined,
    test: test || undefined,
    lint: lint || undefined,
    policy: policy as 'permissive' | 'strict',
  };
  await state.writeConfig(config);

  // Initialize empty contracts
  await state.writeContracts({
    version: '1.0.0',
    endpoints: [],
  });

  // Initialize ownership
  await state.writeOwnership({
    rules: team.map(t => ({
      glob: `backend/${t}/**`,
      owner: t,
    })),
  });

  // Initialize slices
  await state.writeSlices({
    slices: [],
  });

  // Initialize graph
  await state.writeGraph({
    edges: [],
  });

  // Initialize conventions
  const conventions = `# Conventions

## Naming
- Use camelCase for variables and functions
- Use PascalCase for classes and types
- Use UPPER_SNAKE_CASE for constants

## Error Format
Errors should follow this format:
\`\`\`json
{
  "error": "ErrorType",
  "message": "Human-readable message",
  "code": "ERROR_CODE"
}
\`\`\`

## Folder Layout
- \`backend/\` — backend services
- \`frontend/\` — frontend applications
- \`shared/\` — shared types and utilities
`;
  await state.writeConventions(conventions);

  // Initialize schema
  const schema = `-- Database schema (to be populated)
`;
  await state.writeSchema(schema);

  console.log('✅ HackSES initialized!\n');
  console.log('Next steps:');
  console.log('  1. hackses contract generate   — Define your API contracts');
  console.log('  2. hackses partition           — Partition work into slices');
  console.log('  3. hackses context <owner>     — Generate context packs for agents');
}

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize a HackSES project')
    .option('--stack <type>', 'Stack (typescript/python/mixed)')
    .option('--team <members>', 'Team members (comma-separated)')
    .option('--build <cmd>', 'Build command')
    .option('--test <cmd>', 'Test command')
    .option('--lint <cmd>', 'Lint command')
    .option('--policy <type>', 'Ownership policy (permissive/strict)')
    .action(async options => {
      try {
        await initProject(options);
      } catch (err) {
        console.error('❌ Error:', err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}
