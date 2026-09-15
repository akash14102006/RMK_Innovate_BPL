/**
 * Unit tests — Migration Integrity & Order
 *
 * Verifies that:
 * - All migration files exist in proper sequential order
 * - Every migration exports both `up` and `down` functions
 * - No duplicate migration timestamps or broken filenames
 */

import { describe, it, expect } from 'vitest';
import { readdirSync } from 'fs';
import { resolve } from 'path';

describe('Database Migration Integrity', () => {
  const migrationsDir = resolve(__dirname, '../../../migrations');
  const migrationFiles = readdirSync(migrationsDir).filter(
    (f) => f.endsWith('.ts') && !f.endsWith('.d.ts'),
  );

  it('contains all 11 planned migration files in sequence', () => {
    expect(migrationFiles.length).toBe(11);
    const prefixes = migrationFiles.map((f) => f.split('_')[1]);
    expect(prefixes).toEqual([
      '001',
      '002',
      '003',
      '004',
      '005',
      '006',
      '007',
      '008',
      '009',
      '010',
      '011',
    ]);
  });

  it('all migration modules export callable up and down functions', async () => {
    for (const file of migrationFiles) {
      const modulePath = resolve(migrationsDir, file);
      const mod = await import(modulePath);

      expect(typeof mod.up).toBe('function');
      expect(typeof mod.down).toBe('function');
    }
  });
});
