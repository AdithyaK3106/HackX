import { Contracts, Slices } from '../schemas/index.js';

export function buildContextPack(
  owner: string,
  slices: Slices,
  contracts: Contracts,
  conventions: string,
  schema: string,
): string {
  const slice = slices.slices.find(s => s.owner === owner);
  if (!slice) {
    throw new Error(`No slice found for owner ${owner}`);
  }

  let content = `# Context Pack: ${slice.id}\n\n`;
  content += `**Owner:** ${owner}\n`;
  content += `**Slice ID:** ${slice.id}\n`;
  content += `**Status:** ${slice.blocked ? 'BLOCKED' : 'Ready'}\n\n`;

  // Acceptance criteria
  content += `## Acceptance Criteria\n`;
  for (const criterion of slice.acceptance || []) {
    content += `- [ ] ${criterion}\n`;
  }
  content += '\n';

  // Owned paths
  content += `## Owned Paths\n`;
  content += `Touch **only** these paths:\n`;
  for (const glob of slice.paths) {
    content += `- \`${glob}\`\n`;
  }
  content += '\n';

  // Contracts this slice implements
  if (slice.contracts && slice.contracts.length > 0) {
    content += `## Endpoints to Implement\n`;
    content += `These endpoints are owned by this slice:\n\n`;
    for (const contractId of slice.contracts) {
      const endpoint = contracts.endpoints.find(e => e.id === contractId);
      if (endpoint) {
        content += `### ${endpoint.method} ${endpoint.path}\n`;
        if (endpoint.description) {
          content += `${endpoint.description}\n\n`;
        }
        content += `\`\`\`\n`;
        content += `Method: ${endpoint.method}\n`;
        content += `Path: ${endpoint.path}\n`;
        if (endpoint.request) {
          content += `Request: ${JSON.stringify(endpoint.request, null, 2)}\n`;
        }
        content += `Response: ${JSON.stringify(endpoint.response, null, 2)}\n`;
        content += `\`\`\`\n\n`;
      }
    }
  }

  // Dependencies (consumed contracts)
  if (slice.depends_on && slice.depends_on.length > 0) {
    content += `## Dependencies\n`;
    content += `This slice depends on these other slices:\n\n`;
    for (const depId of slice.depends_on) {
      const depSlice = slices.slices.find(s => s.id === depId);
      if (depSlice) {
        content += `### Slice: ${depId} (owner: ${depSlice.owner})\n`;
        content += `Read-only reference. Do not modify.\n\n`;
        if (depSlice.contracts) {
          content += `Available endpoints:\n`;
          for (const contractId of depSlice.contracts) {
            const endpoint = contracts.endpoints.find(e => e.id === contractId);
            if (endpoint) {
              content += `- \`${endpoint.method} ${endpoint.path}\`\n`;
            }
          }
          content += '\n';
        }
      }
    }
  }

  // Schema (relevant excerpt)
  if (schema) {
    content += `## Database Schema\n`;
    content += `\`\`\`sql\n`;
    content += schema;
    content += `\n\`\`\`\n\n`;
  }

  // Conventions
  if (conventions) {
    content += `## Conventions\n`;
    content += conventions;
    content += '\n\n';
  }

  // Implementation prompt
  content += `## Implementation Prompt\n`;
  content += `\`\`\`\n`;
  content += `You are implementing the ${slice.id} slice for the HackSES hackathon project.\n\n`;
  content += `Your responsibilities:\n`;
  for (const criterion of slice.acceptance || []) {
    content += `- ${criterion}\n`;
  }
  content += `\nOwned paths (edit ONLY these):\n`;
  for (const glob of slice.paths) {
    content += `- ${glob}\n`;
  }
  if (slice.depends_on && slice.depends_on.length > 0) {
    content += `\nDo NOT edit these paths (owned by other slices):\n`;
    for (const depId of slice.depends_on) {
      const depSlice = slices.slices.find(s => s.id === depId);
      if (depSlice) {
        for (const glob of depSlice.paths) {
          content += `- ${glob}\n`;
        }
      }
    }
  }
  content += `\`\`\`\n`;

  return content;
}

export function buildAllContextPacks(
  slices: Slices,
  contracts: Contracts,
  conventions: string,
  schema: string,
): Map<string, string> {
  const packs = new Map<string, string>();

  // Get unique owners
  const owners = new Set(slices.slices.map(s => s.owner));

  for (const owner of owners) {
    const pack = buildContextPack(owner, slices, contracts, conventions, schema);
    packs.set(owner, pack);
  }

  return packs;
}
