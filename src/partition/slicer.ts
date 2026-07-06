import { Contracts, Slice, Graph } from '../schemas/index.js';

// ponytail: naive greedy partition; sophisticated clustering deferred to v2
export function proposeSlices(contracts: Contracts, team: string[]): { slices: Slice[]; graph: Graph } {
  const slices: Slice[] = [];
  const edges: Array<{ from: string; to: string }> = [];

  // Group endpoints by path prefix → assign to owners
  const ownerMap = new Map<string, string>();
  const pathGroups = new Map<string, string[]>();

  // Group contracts by path prefix
  for (const endpoint of contracts.endpoints) {
    const parts = endpoint.path.split('/').filter(p => p);
    const prefix = parts[0] || 'root';
    if (!pathGroups.has(prefix)) {
      pathGroups.set(prefix, []);
    }
    pathGroups.get(prefix)!.push(endpoint.id);
  }

  // Assign each group to a team member (round-robin)
  let teamIdx = 0;
  for (const [prefix, contractIds] of pathGroups.entries()) {
    const owner = team[teamIdx % team.length];
    const sliceId = prefix;

    ownerMap.set(sliceId, owner);

    const slice: Slice = {
      id: sliceId,
      owner,
      paths: [`backend/${prefix}/**`, `tests/${prefix}/**`],
      contracts: contractIds,
      depends_on: [],
      acceptance: [
        `Endpoints match contracts.yaml for ${prefix}`,
        'No edits outside owned paths',
      ],
      blocked: false,
    };

    slices.push(slice);
    teamIdx++;
  }

  // Detect dependencies: if slice A's contracts are consumed by slice B's paths
  for (let i = 0; i < slices.length; i++) {
    for (let j = 0; j < slices.length; j++) {
      if (i !== j) {
        const sliceA = slices[i];
        const sliceB = slices[j];

        // B depends on A if B's contracts reference A's contracts
        if (sliceB.contracts?.some(c => sliceA.contracts?.includes(c))) {
          if (!sliceB.depends_on?.includes(sliceA.id)) {
            edges.push({ from: sliceB.id, to: sliceA.id });
            if (!sliceB.depends_on) sliceB.depends_on = [];
            sliceB.depends_on.push(sliceA.id);
          }
        }
      }
    }
  }

  return {
    slices,
    graph: { edges },
  };
}

export function validateDependencies(slices: Slice[]): string[] {
  const errors: string[] = [];
  const sliceIds = new Set(slices.map(s => s.id));

  // Check for undefined dependencies
  for (const slice of slices) {
    for (const dep of slice.depends_on || []) {
      if (!sliceIds.has(dep)) {
        errors.push(`Slice ${slice.id} depends on undefined slice ${dep}`);
      }
    }
  }

  // Check for cycles using DFS
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(id: string): boolean {
    visited.add(id);
    recStack.add(id);

    const slice = slices.find(s => s.id === id);
    for (const dep of slice?.depends_on || []) {
      if (!visited.has(dep)) {
        if (hasCycle(dep)) return true;
      } else if (recStack.has(dep)) {
        return true;
      }
    }

    recStack.delete(id);
    return false;
  }

  for (const slice of slices) {
    if (!visited.has(slice.id)) {
      if (hasCycle(slice.id)) {
        errors.push(`Circular dependency detected involving ${slice.id}`);
      }
    }
  }

  return errors;
}
