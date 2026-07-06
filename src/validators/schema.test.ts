import { describe, it, expect } from 'vitest';
import { checkSchemaChanges } from './schema.js';

describe('checkSchemaChanges', () => {
  it('detects DROP TABLE', () => {
    const before = 'CREATE TABLE users (id INT);';
    const after = 'DROP TABLE users;';

    const result = checkSchemaChanges(before, after);
    expect(result.passed).toBe(false);
    expect(result.warnings.some(w => w.includes('DROP'))).toBe(true);
  });

  it('detects DROP COLUMN', () => {
    const before = 'CREATE TABLE users (id INT, name VARCHAR);';
    const after = 'ALTER TABLE users DROP COLUMN name;';

    const result = checkSchemaChanges(before, after);
    expect(result.passed).toBe(false);
    expect(result.warnings.some(w => w.includes('DROP'))).toBe(true);
  });

  it('detects TRUNCATE', () => {
    const before = 'CREATE TABLE users (id INT);';
    const after = 'TRUNCATE TABLE users;';

    const result = checkSchemaChanges(before, after);
    expect(result.passed).toBe(false);
  });

  it('passes for safe additions', () => {
    const before = 'CREATE TABLE users (id INT);';
    const after = 'CREATE TABLE users (id INT); CREATE TABLE posts (id INT);';

    const result = checkSchemaChanges(before, after);
    expect(result.passed).toBe(true);
  });

  it('passes for index additions', () => {
    const before = 'CREATE TABLE users (id INT);';
    const after = 'CREATE TABLE users (id INT); CREATE INDEX idx_id ON users(id);';

    const result = checkSchemaChanges(before, after);
    expect(result.passed).toBe(true);
  });

  it('ignores existing destructive patterns', () => {
    const before = 'DROP TABLE old_users;';
    const after = 'DROP TABLE old_users;';

    const result = checkSchemaChanges(before, after);
    expect(result.passed).toBe(true);
  });
});
