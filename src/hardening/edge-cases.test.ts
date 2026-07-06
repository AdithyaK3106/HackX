import { describe, it, expect } from 'vitest';
import { proposeSlices, validateDependencies } from '../partition/slicer.js';
import { checkOwnership } from '../validators/ownership.js';
import { Contracts, Ownership, Slices, Slice } from '../schemas/index.js';

describe('Edge cases', () => {
  it('handles empty contracts gracefully', () => {
    const contracts: Contracts = {
      version: '1.0.0',
      endpoints: [],
    };

    const result = proposeSlices(contracts, ['alice']);
    expect(result.slices).toHaveLength(0);
    expect(result.graph.edges).toHaveLength(0);
  });

  it('handles single team member', () => {
    const contracts: Contracts = {
      version: '1.0.0',
      endpoints: [
        {
          id: 'GET /health',
          method: 'GET',
          path: '/health',
          response: { type: 'object' },
        },
      ],
    };

    const result = proposeSlices(contracts, ['alice']);
    expect(result.slices).toHaveLength(1);
    expect(result.slices[0].owner).toBe('alice');
  });

  it('handles many team members', () => {
    const team = Array.from({ length: 20 }, (_, i) => `user${i}`);
    const contracts: Contracts = {
      version: '1.0.0',
      endpoints: Array.from({ length: 50 }, (_, i) => ({
        id: `GET /endpoint${i}`,
        method: 'GET',
        path: `/endpoint${i}`,
        response: { type: 'object' },
      })),
    };

    const result = proposeSlices(contracts, team);
    expect(result.slices.length).toBeGreaterThan(0);

    // All owners should be from the team
    for (const slice of result.slices) {
      expect(team).toContain(slice.owner);
    }
  });

  it('rejects circular dependencies', () => {
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
        depends_on: ['a'],
        acceptance: [],
        blocked: false,
      },
    ];

    const errors = validateDependencies(slices);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('handles self-loops (slice depending on itself)', () => {
    const slices: Slice[] = [
      {
        id: 'a',
        owner: 'alice',
        paths: ['a/**'],
        contracts: [],
        depends_on: ['a'],
        acceptance: [],
        blocked: false,
      },
    ];

    const errors = validateDependencies(slices);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('handles unknown owner gracefully', () => {
    const ownership: Ownership = {
      rules: [
        { glob: 'backend/auth/**', owner: 'alice' },
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
      ],
    };

    const result = checkOwnership(
      ['backend/auth/login.ts'],
      'unknown',
      ownership,
      slices,
      'strict',
    );

    expect(result.passed).toBe(false);
  });

  it('handles paths with special glob characters', () => {
    const contracts: Contracts = {
      version: '1.0.0',
      endpoints: [
        {
          id: 'GET /api/v1/users',
          method: 'GET',
          path: '/api/v1/users',
          response: { type: 'array' },
        },
      ],
    };

    const result = proposeSlices(contracts, ['alice']);
    expect(result.slices.length).toBeGreaterThan(0);
  });

  it('handles empty team', () => {
    const contracts: Contracts = {
      version: '1.0.0',
      endpoints: [
        {
          id: 'GET /health',
          method: 'GET',
          path: '/health',
          response: { type: 'object' },
        },
      ],
    };

    expect(() => proposeSlices(contracts, [])).not.toThrow();
  });

  it('handles slice with no contracts', () => {
    const slices: Slice[] = [
      {
        id: 'empty',
        owner: 'alice',
        paths: ['backend/empty/**'],
        contracts: [],
        depends_on: [],
        acceptance: [],
        blocked: false,
      },
    ];

    const errors = validateDependencies(slices);
    expect(errors).toHaveLength(0);
  });

  it('handles slice with many contracts', () => {
    const contracts = Array.from({ length: 100 }, (_, i) => `GET /api/endpoint${i}`);

    const slices: Slice[] = [
      {
        id: 'api',
        owner: 'alice',
        paths: ['backend/api/**'],
        contracts,
        depends_on: [],
        acceptance: [],
        blocked: false,
      },
    ];

    const errors = validateDependencies(slices);
    expect(errors).toHaveLength(0);
  });
});
