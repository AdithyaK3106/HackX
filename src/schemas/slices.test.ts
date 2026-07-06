import { describe, it, expect } from 'vitest';
import { SlicesSchema } from './slices.js';

describe('SlicesSchema', () => {
  it('parses valid slices', () => {
    const data = {
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
    const result = SlicesSchema.parse(data);
    expect(result.slices).toHaveLength(1);
    expect(result.slices[0].owner).toBe('alice');
  });

  it('requires owner and paths', () => {
    const data = {
      slices: [
        {
          id: 'auth',
          // missing owner, paths
        },
      ],
    };
    expect(() => SlicesSchema.parse(data)).toThrow();
  });

  it('defaults optional fields', () => {
    const data = {
      slices: [
        {
          id: 'api',
          owner: 'bob',
          paths: ['backend/api/**'],
        },
      ],
    };
    const result = SlicesSchema.parse(data);
    const slice = result.slices[0];
    expect(slice.contracts).toEqual([]);
    expect(slice.depends_on).toEqual([]);
    expect(slice.blocked).toBe(false);
  });
});
