import { StateManager } from '../state/manager.js';

export interface CheckResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export async function check(projectRoot: string = '.'): Promise<CheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const state = new StateManager(projectRoot);

  // Check config exists
  if (!(await state.configExists())) {
    errors.push('config.yaml not found');
  }

  // Check contracts exist
  if (!(await state.contractsExist())) {
    errors.push('contracts.yaml not found');
  }

  // Check ownership exists
  if (!(await state.ownershipExists())) {
    warnings.push('ownership.yaml not found');
  }

  // Check slices exist
  if (!(await state.slicesExist())) {
    warnings.push('slices.json not found');
  }

  // Check graph exists
  if (!(await state.graphExists())) {
    warnings.push('graph.json not found');
  }

  // Validate contracts + shared_types consistency
  if (await state.contractsExist()) {
    try {
      const contracts = await state.readContracts();
      // ponytail: compare contracts with shared_types; for now just validate parse
      errors.push(...validateContractsFormat(contracts));
    } catch (err) {
      errors.push(`contracts.yaml parse error: ${err}`);
    }
  }

  // Validate slices
  if (await state.slicesExist()) {
    try {
      const slices = await state.readSlices();
      errors.push(...validateSlices(slices));
    } catch (err) {
      errors.push(`slices.json parse error: ${err}`);
    }
  }

  // Validate graph
  if (await state.graphExists()) {
    try {
      const graph = await state.readGraph();
      errors.push(...validateGraph(graph));
    } catch (err) {
      errors.push(`graph.json parse error: ${err}`);
    }
  }

  // Validate ownership
  if (await state.ownershipExists()) {
    try {
      const ownership = await state.readOwnership();
      errors.push(...validateOwnership(ownership));
    } catch (err) {
      errors.push(`ownership.yaml parse error: ${err}`);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

function validateContractsFormat(contracts: any): string[] {
  const errors: string[] = [];
  if (!contracts.endpoints || !Array.isArray(contracts.endpoints)) {
    errors.push('contracts.yaml must have endpoints array');
  }
  return errors;
}

function validateSlices(slices: any): string[] {
  const errors: string[] = [];
  if (!slices.slices || !Array.isArray(slices.slices)) {
    errors.push('slices.json must have slices array');
    return errors;
  }
  const ids = new Set<string>();
  for (const slice of slices.slices) {
    if (ids.has(slice.id)) {
      errors.push(`duplicate slice id: ${slice.id}`);
    }
    ids.add(slice.id);
    if (!slice.owner) {
      errors.push(`slice ${slice.id} missing owner`);
    }
    if (!slice.paths || !Array.isArray(slice.paths)) {
      errors.push(`slice ${slice.id} missing paths`);
    }
  }
  return errors;
}

function validateGraph(graph: any): string[] {
  const errors: string[] = [];
  if (!graph.edges || !Array.isArray(graph.edges)) {
    errors.push('graph.json must have edges array');
  }
  return errors;
}

function validateOwnership(ownership: any): string[] {
  const errors: string[] = [];
  if (!ownership.rules || !Array.isArray(ownership.rules)) {
    errors.push('ownership.yaml must have rules array');
  }
  return errors;
}
