import { describe, it, expect } from 'vitest';
import { ConfigSchema } from './config.js';

describe('ConfigSchema', () => {
  it('parses valid config', () => {
    const data = {
      stack: 'typescript',
      team: ['alice', 'bob'],
      build: 'npm run build',
      policy: 'strict',
    };
    const result = ConfigSchema.parse(data);
    expect(result.stack).toBe('typescript');
    expect(result.team).toHaveLength(2);
  });

  it('rejects invalid stack', () => {
    const data = {
      stack: 'invalid',
      team: ['alice'],
    };
    expect(() => ConfigSchema.parse(data)).toThrow();
  });

  it('defaults policy to permissive', () => {
    const data = {
      stack: 'python',
      team: ['alice'],
    };
    const result = ConfigSchema.parse(data);
    expect(result.policy).toBe('permissive');
  });

  it('rejects extra fields', () => {
    const data = {
      stack: 'typescript',
      team: ['alice'],
      extra_field: 'nope',
    };
    expect(() => ConfigSchema.parse(data)).toThrow();
  });
});
