import { Ownership, Slices } from '../schemas/index.js';
import { minimatch } from 'minimatch';

export interface OwnershipCheckResult {
  passed: boolean;
  violations: OwnershipViolation[];
}

export interface OwnershipViolation {
  path: string;
  expectedOwner: string;
  actualAuthor: string;
  policy: 'permissive' | 'strict';
}

function pathMatchesGlob(glob: string, path: string): boolean {
  return minimatch(path, glob);
}

export function findOwnerForPath(ownership: Ownership, path: string): string | null {
  for (const rule of ownership.rules) {
    if (pathMatchesGlob(rule.glob, path)) {
      return rule.owner;
    }
  }
  return null;
}

export function checkOwnership(
  changedFiles: string[],
  author: string,
  ownership: Ownership,
  slices: Slices,
  policy: 'permissive' | 'strict',
): OwnershipCheckResult {
  const violations: OwnershipViolation[] = [];

  // Find author's slice
  const authorSlice = slices.slices.find(s => s.owner === author);
  if (!authorSlice) {
    return {
      passed: false,
      violations: [
        {
          path: '*',
          expectedOwner: 'unknown',
          actualAuthor: author,
          policy,
        },
      ],
    };
  }

  // Check each file
  for (const file of changedFiles) {
    // Skip .hackx/ files
    if (file.startsWith('.hackx/')) {
      continue;
    }

    const owner = findOwnerForPath(ownership, file);
    if (owner && owner !== author) {
      violations.push({
        path: file,
        expectedOwner: owner,
        actualAuthor: author,
        policy,
      });
    }
  }

  // Determine if passed
  if (violations.length === 0) {
    return { passed: true, violations: [] };
  }

  if (policy === 'strict') {
    return { passed: false, violations };
  }

  // permissive: just warn
  return { passed: true, violations };
}
