import { Contracts } from '../schemas/index.js';
import { emitTypeScript } from '../emitters/typescript.js';
import { emitPython } from '../emitters/python.js';
import fs from 'fs';
import path from 'path';

export interface TypeCheckResult {
  passed: boolean;
  errors: string[];
}

export async function checkTypeConsistency(
  contracts: Contracts,
  sharedTypesDir: string,
  stack: 'typescript' | 'python' | 'mixed',
): Promise<TypeCheckResult> {
  const errors: string[] = [];

  // Check TypeScript types
  if (['typescript', 'mixed'].includes(stack)) {
    const tsPath = path.join(sharedTypesDir, 'index.ts');
    if (fs.existsSync(tsPath)) {
      const expectedTs = emitTypeScript(contracts);
      const actualTs = fs.readFileSync(tsPath, 'utf-8');
      if (expectedTs !== actualTs) {
        errors.push('TypeScript types out of sync with contracts.yaml (hand-edit detected)');
      }
    }
  }

  // Check Python types
  if (['python', 'mixed'].includes(stack)) {
    const pyPath = path.join(sharedTypesDir, 'types.py');
    if (fs.existsSync(pyPath)) {
      const expectedPy = emitPython(contracts);
      const actualPy = fs.readFileSync(pyPath, 'utf-8');
      if (expectedPy !== actualPy) {
        errors.push('Python types out of sync with contracts.yaml (hand-edit detected)');
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

export async function regenerateTypesIfNeeded(
  contracts: Contracts,
  sharedTypesDir: string,
  stack: 'typescript' | 'python' | 'mixed',
): Promise<{ regenerated: boolean; errors: string[] }> {
  const result = await checkTypeConsistency(contracts, sharedTypesDir, stack);

  if (!result.passed) {
    // Regenerate
    if (['typescript', 'mixed'].includes(stack)) {
      const tsPath = path.join(sharedTypesDir, 'index.ts');
      const tsCode = emitTypeScript(contracts);
      fs.writeFileSync(tsPath, tsCode, 'utf-8');
    }

    if (['python', 'mixed'].includes(stack)) {
      const pyPath = path.join(sharedTypesDir, 'types.py');
      const pyCode = emitPython(contracts);
      fs.writeFileSync(pyPath, pyCode, 'utf-8');
    }

    return { regenerated: true, errors: [] };
  }

  return { regenerated: false, errors: [] };
}
