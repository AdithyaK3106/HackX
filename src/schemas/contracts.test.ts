import { describe, it, expect } from 'vitest';
import { ContractsSchema, EndpointSchema } from './contracts.js';

describe('EndpointSchema', () => {
  it('parses valid endpoint', () => {
    const data = {
      id: 'POST /auth/login',
      method: 'POST',
      path: '/auth/login',
      response: { type: 'object' },
    };
    const result = EndpointSchema.parse(data);
    expect(result.id).toBe('POST /auth/login');
    expect(result.method).toBe('POST');
  });

  it('requires response', () => {
    const data = {
      id: 'GET /user',
      method: 'GET',
      path: '/user',
    };
    expect(() => EndpointSchema.parse(data)).toThrow();
  });
});

describe('ContractsSchema', () => {
  it('parses valid contracts', () => {
    const data = {
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
    const result = ContractsSchema.parse(data);
    expect(result.endpoints).toHaveLength(1);
  });

  it('defaults version', () => {
    const data = {
      endpoints: [],
    };
    const result = ContractsSchema.parse(data);
    expect(result.version).toBe('1.0.0');
  });
});
