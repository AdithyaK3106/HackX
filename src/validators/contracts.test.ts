import { describe, it, expect } from 'vitest';
import { checkContractChanges, findContractChanges } from './contracts.js';
import { Contracts, SyncEvent } from '../schemas/index.js';

describe('findContractChanges', () => {
  it('detects added endpoints', () => {
    const before: Contracts = {
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

    const after: Contracts = {
      version: '1.0.0',
      endpoints: [
        {
          id: 'GET /users',
          method: 'GET',
          path: '/users',
          response: { type: 'array' },
        },
        {
          id: 'POST /users',
          method: 'POST',
          path: '/users',
          response: { type: 'object' },
        },
      ],
    };

    const changes = findContractChanges(before, after);
    expect(changes.added).toContain('POST /users');
    expect(changes.removed).toHaveLength(0);
  });

  it('detects removed endpoints', () => {
    const before: Contracts = {
      version: '1.0.0',
      endpoints: [
        {
          id: 'GET /users',
          method: 'GET',
          path: '/users',
          response: { type: 'array' },
        },
        {
          id: 'DELETE /users/:id',
          method: 'DELETE',
          path: '/users/:id',
          response: { type: 'object' },
        },
      ],
    };

    const after: Contracts = {
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

    const changes = findContractChanges(before, after);
    expect(changes.removed).toContain('DELETE /users/:id');
  });

  it('detects modified endpoints', () => {
    const before: Contracts = {
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

    const after: Contracts = {
      version: '1.0.0',
      endpoints: [
        {
          id: 'GET /users',
          method: 'GET',
          path: '/users',
          response: { type: 'object' },
        },
      ],
    };

    const changes = findContractChanges(before, after);
    expect(changes.modified).toContain('GET /users');
  });
});

describe('checkContractChanges', () => {
  it('passes when no changes', () => {
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

    const result = checkContractChanges(contracts, contracts, [], 'alice');
    expect(result.passed).toBe(true);
  });

  it('fails for undeclared additions', () => {
    const before: Contracts = {
      version: '1.0.0',
      endpoints: [],
    };

    const after: Contracts = {
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

    const result = checkContractChanges(after, before, [], 'alice');
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.includes('not declared'))).toBe(true);
  });

  it('passes when changes are declared in sync events', () => {
    const before: Contracts = {
      version: '1.0.0',
      endpoints: [],
    };

    const after: Contracts = {
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

    const events: SyncEvent[] = [
      {
        author: 'alice',
        at: new Date().toISOString(),
        contract_changes: ['GET /users'],
        files_changed: [],
        blocked: null,
      },
    ];

    const result = checkContractChanges(after, before, events, 'alice');
    expect(result.passed).toBe(true);
  });
});
