import { StateManager } from '../state/manager.js';
import { emitTypeScript } from './typescript.js';
import { emitPython } from './python.js';
import path from 'path';
import fs from 'fs';

export async function regenerateSharedTypes(projectRoot: string = '.'): Promise<void> {
  const state = new StateManager(projectRoot);

  if (!(await state.contractsExist())) {
    console.error('❌ contracts.yaml not found');
    return;
  }

  if (!(await state.configExists())) {
    console.error('❌ config.yaml not found');
    return;
  }

  const contracts = await state.readContracts();
  const config = await state.readConfig();

  // Create shared_types directory
  const sharedTypesDir = path.join(projectRoot, '.hackx', 'shared_types');
  await fs.promises.mkdir(sharedTypesDir, { recursive: true });

  // Emit TypeScript types
  if (['typescript', 'mixed'].includes(config.stack)) {
    const tsCode = emitTypeScript(contracts);
    const tsPath = path.join(sharedTypesDir, 'index.ts');
    await fs.promises.writeFile(tsPath, tsCode, 'utf-8');
    console.log(`✅ Generated ${tsPath}`);
  }

  // Emit Python types
  if (['python', 'mixed'].includes(config.stack)) {
    const pyCode = emitPython(contracts);
    const pyPath = path.join(sharedTypesDir, 'types.py');
    await fs.promises.writeFile(pyPath, pyCode, 'utf-8');
    console.log(`✅ Generated ${pyPath}`);
  }
}
