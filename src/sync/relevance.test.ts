import { describe, it, expect } from 'vitest';
import { isRelevantEvent, filterRelevantEvents, RelevanceContext } from './relevance.js';
import { SyncEvent, Slice, Contracts, Graph } from '../schemas/index.js';

describe('isRelevantEvent', () => {
  const contracts: Contracts = {
    version: '1.0.0',
    endpoints: [
      {
        id: 'POST /auth/login',
        method: 'POST',
        path: '/auth/login',
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

  const slices: Slice[] = [
    {
      id: 'auth',
      owner: 'alice',
      paths: ['backend/auth/**'],
      contracts: ['POST /auth/login'],
      depends_on: [],
      acceptance: [],
      blocked: false,
    },
    {
      id: 'users',
      owner: 'bob',
      paths: ['backend/users/**'],
      contracts: ['GET /users/list'],
      depends_on: ['auth'],
      acceptance: [],
      blocked: false,
    },
  ];

  const graph: Graph = {
    edges: [{ from: 'users', to: 'auth' }],
  };

  it('is relevant when I implement a changed contract', () => {
    const event: SyncEvent = {
      author: 'alice',
      at: new Date().toISOString(),
      contract_changes: ['POST /auth/login'],
      files_changed: [],
      blocked: null,
    };

    const context: RelevanceContext = {
      mySlice: slices[0],
      allSlices: slices,
      contracts,
      graph,
    };

    expect(isRelevantEvent(event, context)).toBe(true);
  });

  it('is relevant when I depend on a changed contract', () => {
    const event: SyncEvent = {
      author: 'alice',
      at: new Date().toISOString(),
      contract_changes: ['POST /auth/login'],
      files_changed: [],
      blocked: null,
    };

    const context: RelevanceContext = {
      mySlice: slices[1], // users depends on auth
      allSlices: slices,
      contracts,
      graph,
    };

    expect(isRelevantEvent(event, context)).toBe(true);
  });

  it('is not relevant for unrelated contracts', () => {
    const event: SyncEvent = {
      author: 'charlie',
      at: new Date().toISOString(),
      contract_changes: ['GET /other/endpoint'],
      files_changed: [],
      blocked: null,
    };

    const context: RelevanceContext = {
      mySlice: slices[0],
      allSlices: slices,
      contracts,
      graph,
    };

    expect(isRelevantEvent(event, context)).toBe(false);
  });

  it('is relevant when files touch my owned paths', () => {
    const event: SyncEvent = {
      author: 'alice',
      at: new Date().toISOString(),
      contract_changes: [],
      files_changed: ['backend/auth/login.ts'],
      blocked: null,
    };

    const context: RelevanceContext = {
      mySlice: slices[0],
      allSlices: slices,
      contracts,
      graph,
    };

    expect(isRelevantEvent(event, context)).toBe(true);
  });

  it('is relevant when files touch dependencies', () => {
    const event: SyncEvent = {
      author: 'alice',
      at: new Date().toISOString(),
      contract_changes: [],
      files_changed: ['backend/auth/login.ts'],
      blocked: null,
    };

    const context: RelevanceContext = {
      mySlice: slices[1], // users depends on auth
      allSlices: slices,
      contracts,
      graph,
    };

    expect(isRelevantEvent(event, context)).toBe(true);
  });

  it('is relevant when blocked on me', () => {
    const event: SyncEvent = {
      author: 'bob',
      at: new Date().toISOString(),
      contract_changes: [],
      files_changed: [],
      blocked: 'auth',
    };

    const context: RelevanceContext = {
      mySlice: slices[0],
      allSlices: slices,
      contracts,
      graph,
    };

    expect(isRelevantEvent(event, context)).toBe(true);
  });

  it('is not relevant for unrelated files', () => {
    const event: SyncEvent = {
      author: 'charlie',
      at: new Date().toISOString(),
      contract_changes: [],
      files_changed: ['somewhere/else/file.ts'],
      blocked: null,
    };

    const context: RelevanceContext = {
      mySlice: slices[0],
      allSlices: slices,
      contracts,
      graph,
    };

    expect(isRelevantEvent(event, context)).toBe(false);
  });
});

describe('filterRelevantEvents', () => {
  it('filters events by relevance', () => {
    const contracts: Contracts = {
      version: '1.0.0',
      endpoints: [
        {
          id: 'GET /api/users',
          method: 'GET',
          path: '/api/users',
          response: { type: 'array' },
        },
      ],
    };

    const slices: Slice[] = [
      {
        id: 'api',
        owner: 'alice',
        paths: ['backend/api/**'],
        contracts: ['GET /api/users'],
        depends_on: [],
        acceptance: [],
        blocked: false,
      },
    ];

    const events: SyncEvent[] = [
      {
        author: 'alice',
        at: new Date().toISOString(),
        contract_changes: ['GET /api/users'],
        files_changed: [],
        blocked: null,
      },
      {
        author: 'bob',
        at: new Date().toISOString(),
        contract_changes: ['POST /other/endpoint'],
        files_changed: [],
        blocked: null,
      },
    ];

    const context: RelevanceContext = {
      mySlice: slices[0],
      allSlices: slices,
      contracts,
      graph: { edges: [] },
    };

    const filtered = filterRelevantEvents(events, context);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].author).toBe('alice');
  });
});
