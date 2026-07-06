import { Contracts, SyncEvent } from '../schemas/index.js';

export interface ContractCheckResult {
  passed: boolean;
  errors: string[];
}

// ponytail: simple string matching; semantic diff deferred to v2
export function checkContractChanges(
  currentContracts: Contracts,
  previousContracts: Contracts | null,
  syncEvents: SyncEvent[],
  author: string,
): ContractCheckResult {
  const errors: string[] = [];

  // If no previous contracts, can't compare
  if (!previousContracts) {
    return { passed: true, errors: [] };
  }

  // Find contracts that changed
  const currentIds = new Set(currentContracts.endpoints.map(e => e.id));
  const previousIds = new Set(previousContracts.endpoints.map(e => e.id));

  const added = Array.from(currentIds).filter(id => !previousIds.has(id));
  const removed = Array.from(previousIds).filter(id => !currentIds.has(id));

  // Check for undeclared changes
  const authorEvents = syncEvents.filter(e => e.author === author);
  const declaredContracts = new Set<string>();
  for (const event of authorEvents) {
    event.contract_changes.forEach(c => declaredContracts.add(c));
  }

  for (const id of added) {
    if (!declaredContracts.has(id)) {
      errors.push(`Contract added but not declared in sync: ${id}`);
    }
  }

  for (const id of removed) {
    if (!declaredContracts.has(id)) {
      errors.push(`Contract removed but not declared in sync: ${id}`);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

export function findContractChanges(
  before: Contracts,
  after: Contracts,
): { added: string[]; removed: string[]; modified: string[] } {
  const beforeIds = new Map(before.endpoints.map(e => [e.id, e]));
  const afterIds = new Map(after.endpoints.map(e => [e.id, e]));

  const added = Array.from(afterIds.keys()).filter(id => !beforeIds.has(id));
  const removed = Array.from(beforeIds.keys()).filter(id => !afterIds.has(id));

  const modified = Array.from(afterIds.keys())
    .filter(id => beforeIds.has(id))
    .filter(id => {
      const before = beforeIds.get(id)!;
      const after = afterIds.get(id)!;
      return JSON.stringify(before) !== JSON.stringify(after);
    });

  return { added, removed, modified };
}
