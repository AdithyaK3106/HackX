import { describe, it, expect } from 'vitest';
import { emitTypeScript } from './typescript.js';
import { Contracts } from '../schemas/index.js';

describe('emitTypeScript', () => {
  it('emits endpoint types', () => {
    const contracts: Contracts = {
      version: '1.0.0',
      endpoints: [
        {
          id: 'GET /user',
          method: 'GET',
          path: '/user',
          response: { type: 'object' },
          description: 'Get user profile',
        },
      ],
    };

    const output = emitTypeScript(contracts);
    expect(output).toContain('export type GET_userResponse');
    expect(output).toContain('Record<string, unknown>');
    expect(output).toContain('Get user profile');
  });

  it('emits request and response types', () => {
    const contracts: Contracts = {
      version: '1.0.0',
      endpoints: [
        {
          id: 'POST /auth/login',
          method: 'POST',
          path: '/auth/login',
          request: { type: 'object' },
          response: { type: 'object' },
        },
      ],
    };

    const output = emitTypeScript(contracts);
    expect(output).toContain('export type POST_auth_loginRequest');
    expect(output).toContain('export type POST_auth_loginResponse');
  });

  it('emits enum definitions', () => {
    const contracts: Contracts = {
      version: '1.0.0',
      endpoints: [],
      enums: {
        Role: ['admin', 'user', 'guest'],
      },
    };

    const output = emitTypeScript(contracts);
    expect(output).toContain('export const Role');
    expect(output).toContain("admin: 'admin' as const");
    expect(output).toContain("export type Role");
  });

  it('emits endpoint registry', () => {
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

    const output = emitTypeScript(contracts);
    expect(output).toContain('export const Endpoints');
    expect(output).toContain("'GET /health'");
    expect(output).toContain("method: 'GET'");
    expect(output).toContain("path: '/health'");
  });

  it('handles array and primitive types', () => {
    const contracts: Contracts = {
      version: '1.0.0',
      endpoints: [
        {
          id: 'GET /users',
          method: 'GET',
          path: '/users',
          response: { type: 'array' },
        },
        {
          id: 'GET /count',
          method: 'GET',
          path: '/count',
          response: { type: 'number' },
        },
      ],
    };

    const output = emitTypeScript(contracts);
    expect(output).toContain('unknown[]');
    expect(output).toContain('number');
  });
});
