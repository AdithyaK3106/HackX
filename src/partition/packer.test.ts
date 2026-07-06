import { describe, it, expect } from 'vitest';
import { buildContextPack, buildAllContextPacks } from './packer.js';
import { Contracts, Slices } from '../schemas/index.js';

describe('buildContextPack', () => {
  it('generates pack for owner', () => {
    const slices: Slices = {
      slices: [
        {
          id: 'auth',
          owner: 'alice',
          paths: ['backend/auth/**'],
          contracts: ['POST /auth/login'],
          depends_on: [],
          acceptance: ['Endpoints match contracts'],
          blocked: false,
        },
      ],
    };

    const contracts: Contracts = {
      version: '1.0.0',
      endpoints: [
        {
          id: 'POST /auth/login',
          method: 'POST',
          path: '/auth/login',
          response: { type: 'object' },
          description: 'User login',
        },
      ],
    };

    const pack = buildContextPack('alice', slices, contracts, '# Conventions\n', '-- schema\n');

    expect(pack).toContain('Context Pack: auth');
    expect(pack).toContain('**Owner:** alice');
    expect(pack).toContain('POST /auth/login');
    expect(pack).toContain('User login');
    expect(pack).toContain('# Conventions');
  });

  it('includes owned paths', () => {
    const slices: Slices = {
      slices: [
        {
          id: 'api',
          owner: 'bob',
          paths: ['backend/api/**', 'tests/api/**'],
          contracts: [],
          depends_on: [],
          acceptance: [],
          blocked: false,
        },
      ],
    };

    const contracts: Contracts = { version: '1.0.0', endpoints: [] };
    const pack = buildContextPack('bob', slices, contracts, '', '');

    expect(pack).toContain('backend/api/**');
    expect(pack).toContain('tests/api/**');
  });

  it('lists dependencies as read-only reference', () => {
    const slices: Slices = {
      slices: [
        {
          id: 'web',
          owner: 'alice',
          paths: ['frontend/web/**'],
          contracts: [],
          depends_on: ['api'],
          acceptance: [],
          blocked: false,
        },
        {
          id: 'api',
          owner: 'bob',
          paths: ['backend/api/**'],
          contracts: ['GET /users'],
          depends_on: [],
          acceptance: [],
          blocked: false,
        },
      ],
    };

    const contracts: Contracts = {
      version: '1.0.0',
      endpoints: [
        {
          id: 'GET /users',
          method: 'GET',
          path: '/users',
          response: { type: 'array' },
        },
      ],
    };

    const pack = buildContextPack('alice', slices, contracts, '', '');

    expect(pack).toContain('## Dependencies');
    expect(pack).toContain('api');
    expect(pack).toContain('Read-only reference');
    expect(pack).toContain('GET /users');
  });

  it('throws for unknown owner', () => {
    const slices: Slices = { slices: [] };
    const contracts: Contracts = { version: '1.0.0', endpoints: [] };

    expect(() => buildContextPack('unknown', slices, contracts, '', '')).toThrow();
  });

  it('marks blocked slices', () => {
    const slices: Slices = {
      slices: [
        {
          id: 'blocked_slice',
          owner: 'alice',
          paths: ['backend/blocked/**'],
          contracts: [],
          depends_on: [],
          acceptance: [],
          blocked: true,
        },
      ],
    };

    const contracts: Contracts = { version: '1.0.0', endpoints: [] };
    const pack = buildContextPack('alice', slices, contracts, '', '');

    expect(pack).toContain('BLOCKED');
  });
});

describe('buildAllContextPacks', () => {
  it('generates packs for all owners', () => {
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

    const contracts: Contracts = { version: '1.0.0', endpoints: [] };
    const packs = buildAllContextPacks(slices, contracts, '', '');

    expect(packs.size).toBe(2);
    expect(packs.has('alice')).toBe(true);
    expect(packs.has('bob')).toBe(true);
  });

  it('handles single owner with multiple slices', () => {
    const slices: Slices = {
      slices: [
        {
          id: 'slice1',
          owner: 'alice',
          paths: ['path1/**'],
          contracts: [],
          depends_on: [],
          acceptance: [],
          blocked: false,
        },
        {
          id: 'slice2',
          owner: 'alice',
          paths: ['path2/**'],
          contracts: [],
          depends_on: [],
          acceptance: [],
          blocked: false,
        },
      ],
    };

    const contracts: Contracts = { version: '1.0.0', endpoints: [] };
    const packs = buildAllContextPacks(slices, contracts, '', '');

    expect(packs.size).toBe(1);
  });
});
