import { SyncEvent, Slice, Graph, Contracts } from '../schemas/index.js';
import * as minimatch from 'minimatch';

export interface RelevanceContext {
  mySlice: Slice;
  allSlices: Slice[];
  contracts: Contracts;
  graph: Graph;
}

// ponytail: minimatch for simple path glob matching; sophisticated regex deferred to v2
function pathMatches(glob: string, path: string): boolean {
  return minimatch.minimatch(path, glob);
}

export function isRelevantEvent(event: SyncEvent, context: RelevanceContext): boolean {
  const { mySlice, allSlices } = context;

  // 1. Contract changes: relevant if I depend on or implement any changed contract
  if (event.contract_changes.length > 0) {
    for (const contractId of event.contract_changes) {
      // Do I implement it?
      if (mySlice.contracts?.includes(contractId)) {
        return true;
      }

      // Do I depend on it?
      for (const depId of mySlice.depends_on || []) {
        const depSlice = allSlices.find(s => s.id === depId);
        if (depSlice?.contracts?.includes(contractId)) {
          return true;
        }
      }
    }
  }

  // 2. File changes: relevant if touching adjacent paths
  if (event.files_changed.length > 0) {
    const eventAuthor = event.author;
    const eventSlice = allSlices.find(s => s.owner === eventAuthor);

    if (eventSlice) {
      // My paths and my dependencies' paths
      const adjacentPaths = new Set<string>();
      for (const path of mySlice.paths) {
        adjacentPaths.add(path);
      }
      for (const depId of mySlice.depends_on || []) {
        const depSlice = allSlices.find(s => s.id === depId);
        if (depSlice) {
          for (const path of depSlice.paths) {
            adjacentPaths.add(path);
          }
        }
      }

      for (const filePath of event.files_changed) {
        for (const adjacentPath of adjacentPaths) {
          if (pathMatches(adjacentPath, filePath)) {
            return true;
          }
        }
      }
    }
  }

  // 3. Blocked state: relevant if blocking me or resolving my block
  if (event.blocked !== null) {
    // Event is blocking something
    if (event.blocked === mySlice.id) {
      return true;
    }

    // Event is resolving a block on me
    if (mySlice.blocked && event.blocked === '') {
      return true;
    }
  }

  return false;
}

export function filterRelevantEvents(
  events: SyncEvent[],
  context: RelevanceContext,
): SyncEvent[] {
  return events.filter(event => isRelevantEvent(event, context));
}
