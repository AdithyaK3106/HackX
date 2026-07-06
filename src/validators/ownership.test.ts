import { describe, it, expect } from 'vitest';
import { checkOwnership, findOwnerForPath } from './ownership.js';
import { Ownership, Slices } from '../schemas/index.js';

describe('findOwnerForPath', () => {
  const ownership: Ownership = {
    rules: [
      { glob: 'backend/auth/**', owner: 'alice' },
      { glob: 'backend/users/**', owner: 'bob' },
      { glob: 'frontend/**', owner: 'charlie' },
    ],
  };

  it('finds owner for matching glob', () => {
    expect(findOwnerForPath(ownership, 'backend/auth/login.ts')).toBe('alice');
    expect(findOwnerForPath(ownership, 'backend/users/list.ts')).toBe('bob');
    expect(findOwnerForPath(ownership, 'frontend/app.tsx')).toBe('charlie');
  });

  it('returns null for unmatched path', () => {
    expect(findOwnerForPath(ownership, 'other/file.ts')).toBeNull();
  });
});

describe('checkOwnership', () => {
  const ownership: Ownership = {
    rules: [
      { glob: 'backend/auth/**', owner: 'alice' },
      { glob: 'backend/users/**', owner: 'bob' },
    ],
  };

  const slices: Slices = {
    slices: [
      {
        id: 'auth',
        owner: 'alice',
        paths: ['backend/auth/**'],
        contracts: [],
        depends_on: [],
        acceptance: [],
        blocked: false,
      },
      {
        id: 'users',
        owner: 'bob',
        paths: ['backend/users/**'],
        contracts: [],
        depends_on: [],
        acceptance: [],
        blocked: false,
      },
    ],
  };

  it('passes when author edits only owned paths', () => {
    const result = checkOwnership(
      ['backend/auth/login.ts', 'backend/auth/register.ts'],
      'alice',
      ownership,
      slices,
      'strict',
    );

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('fails in strict mode for unowned edits', () => {
    const result = checkOwnership(
      ['backend/auth/login.ts', 'backend/users/list.ts'],
      'alice',
      ownership,
      slices,
      'strict',
    );

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].path).toBe('backend/users/list.ts');
  });

  it('passes but warns in permissive mode for unowned edits', () => {
    const result = checkOwnership(
      ['backend/users/list.ts'],
      'alice',
      ownership,
      slices,
      'permissive',
    );

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(1);
  });

  it('skips .hackses/ files', () => {
    const result = checkOwnership(
      ['.hackses/slices.json', 'backend/auth/login.ts'],
      'alice',
      ownership,
      slices,
      'strict',
    );

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('fails if author not in slices', () => {
    const result = checkOwnership(
      ['backend/auth/login.ts'],
      'unknown',
      ownership,
      slices,
      'strict',
    );

    expect(result.passed).toBe(false);
  });
});
