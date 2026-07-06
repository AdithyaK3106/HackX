import { describe, it, expect } from 'vitest';
import { proposeSlices, validateDependencies } from './slicer.js';
import { Contracts, Slice } from '../schemas/index.js';

describe('proposeSlices', () => {
  it('creates slices from endpoint path prefixes', () => {
    const contracts: Contracts = {
      version: '1.0.0',
      endpoints: [
        {
          id: 'GET /auth/login',
          method: 'GET',
          path: '/auth/login',
          response: { type: 'object' },
        },
        {
          id: 'POST /auth/refresh',
          method: 'POST',
          path: '/auth/refresh',
          response: { type: 'object' },
        },
        {
          id: 'GET /users/list',
          method: 'GET',
          path: '/users/list',
          response: { type: 'array' },
        },
      ],
    };

    const result = proposeSlices(contracts, ['alice', 'bob']);
    expect(result.slices).toHaveLength(2);

    const authSlice = result.slices.find(s => s.id === 'auth');
    expect(authSlice).toBeDefined();
    expect(authSlice!.contracts).toHaveLength(2);
  });

  it('assigns owners round-robin', () => {
    const contracts: Contracts = {
      version: '1.0.0',
      endpoints: [
        { id: 'GET /a/x', method: 'GET', path: '/a/x', response: { type: 'object' } },
        { id: 'GET /b/x', method: 'GET', path: '/b/x', response: { type: 'object' } },
        { id: 'GET /c/x', method: 'GET', path: '/c/x', response: { type: 'object' } },
      ],
    };

    const result = proposeSlices(contracts, ['alice', 'bob']);
    const sliceA = result.slices.find(s => s.id === 'a');
    const sliceB = result.slices.find(s => s.id === 'b');
    const sliceC = result.slices.find(s => s.id === 'c');

    expect(sliceA?.owner).toBe('alice');
    expect(sliceB?.owner).toBe('bob');
    expect(sliceC?.owner).toBe('alice');
  });

  it('includes paths and acceptance criteria', () => {
    const contracts: Contracts = {
      version: '1.0.0',
      endpoints: [
        {
          id: 'POST /api/users',
          method: 'POST',
          path: '/api/users',
          response: { type: 'object' },
        },
      ],
    };

    const result = proposeSlices(contracts, ['alice']);
    const slice = result.slices[0];

    expect(slice.paths).toContain('backend/api/**');
    expect(slice.paths).toContain('tests/api/**');
    expect(slice.acceptance.length).toBeGreaterThan(0);
  });
});

describe('validateDependencies', () => {
  it('detects undefined dependencies', () => {
    const slices: Slice[] = [
      {
        id: 'auth',
        owner: 'alice',
        paths: ['backend/auth/**'],
        contracts: [],
        depends_on: ['undefined_slice'],
        acceptance: [],
        blocked: false,
      },
    ];

    const errors = validateDependencies(slices);
    expect(errors.some(e => e.includes('undefined'))).toBe(true);
  });

  it('detects cycles', () => {
    const slices: Slice[] = [
      {
        id: 'a',
        owner: 'alice',
        paths: ['a/**'],
        contracts: [],
        depends_on: ['b'],
        acceptance: [],
        blocked: false,
      },
      {
        id: 'b',
        owner: 'bob',
        paths: ['b/**'],
        contracts: [],
        depends_on: ['c'],
        acceptance: [],
        blocked: false,
      },
      {
        id: 'c',
        owner: 'charlie',
        paths: ['c/**'],
        contracts: [],
        depends_on: ['a'],
        acceptance: [],
        blocked: false,
      },
    ];

    const errors = validateDependencies(slices);
    expect(errors.some(e => e.includes('Circular'))).toBe(true);
  });

  it('passes valid acyclic dependencies', () => {
    const slices: Slice[] = [
      {
        id: 'api',
        owner: 'alice',
        paths: ['api/**'],
        contracts: [],
        depends_on: [],
        acceptance: [],
        blocked: false,
      },
      {
        id: 'web',
        owner: 'bob',
        paths: ['web/**'],
        contracts: [],
        depends_on: ['api'],
        acceptance: [],
        blocked: false,
      },
    ];

    const errors = validateDependencies(slices);
    expect(errors).toHaveLength(0);
  });

  it('handles empty dependencies', () => {
    const slices: Slice[] = [
      {
        id: 'a',
        owner: 'alice',
        paths: ['a/**'],
        contracts: [],
        depends_on: [],
        acceptance: [],
        blocked: false,
      },
    ];

    const errors = validateDependencies(slices);
    expect(errors).toHaveLength(0);
  });
});
