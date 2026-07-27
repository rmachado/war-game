import { describe, it, expect } from 'vitest';
import { OBJECTIVES, getObjective } from '../game/objectives.js';

describe('Objectives', () => {
  it('has exactly 14 objectives', () => {
    expect(OBJECTIVES).toHaveLength(14);
  });

  describe('getObjective', () => {
    it('returns objective by id', () => {
      const obj = getObjective('obj-1');
      expect(obj).toBeDefined();
      expect(obj!.type).toBe('conquer_24');
    });

    it('returns undefined for nonexistent id', () => {
      expect(getObjective('nonexistent')).toBeUndefined();
    });
  });

  describe('objective types', () => {
    it('has 2 conquest objectives', () => {
      const conquest = OBJECTIVES.filter(
        (o) => o.type === 'conquer_24' || o.type === 'conquer_18_with_2',
      );
      expect(conquest).toHaveLength(2);
    });

    it('has 6 continent-based objectives', () => {
      const continent = OBJECTIVES.filter((o) =>
        o.type.startsWith('continents_'),
      );
      expect(continent).toHaveLength(6);
    });

    it('has 6 destroy-player objectives', () => {
      const destroy = OBJECTIVES.filter((o) => o.type.startsWith('destroy_'));
      expect(destroy).toHaveLength(6);
    });

    it('each destroy objective targets a different color', () => {
      const destroyColors = OBJECTIVES.filter((o) => o.type.startsWith('destroy_'))
        .map((o) => o.targetColor)
        .filter(Boolean);
      expect(new Set(destroyColors).size).toBe(6);
    });
  });

  describe('continent objective descriptions', () => {
    it('obj-3 requires NA + Africa', () => {
      const o = getObjective('obj-3')!;
      expect(o.type).toBe('continents_na_africa');
      expect(o.description).toContain('AMÉRICA DEL NORTE');
      expect(o.description).toContain('ÁFRICA');
    });

    it('obj-4 requires Europa + Oceanía + a third', () => {
      const o = getObjective('obj-4')!;
      expect(o.type).toBe('continents_eu_oceania_plus_one');
    });

    it('obj-5 requires Europa + SA + a third', () => {
      const o = getObjective('obj-5')!;
      expect(o.type).toBe('continents_eu_sa_plus_one');
    });

    it('obj-6 requires Asia + Africa', () => {
      const o = getObjective('obj-6')!;
      expect(o.type).toBe('continents_asia_africa');
    });

    it('obj-7 requires Asia + SA', () => {
      const o = getObjective('obj-7')!;
      expect(o.type).toBe('continents_asia_sa');
    });

    it('obj-8 requires NA + Oceania', () => {
      const o = getObjective('obj-8')!;
      expect(o.type).toBe('continents_na_oceania');
    });
  });
});
