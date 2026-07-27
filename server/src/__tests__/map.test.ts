import { describe, it, expect } from 'vitest';
import {
  CONTINENTS,
  ALL_TERRITORIES,
  TERRITORY_NAMES,
  ADJACENCY,
  getTerritoryContinent,
} from '../game/map.js';

describe('Map Data', () => {
  describe('ALL_TERRITORIES', () => {
    it('has exactly 42 territories', () => {
      expect(ALL_TERRITORIES).toHaveLength(42);
    });

    it('matches TERRITORY_NAMES keys', () => {
      expect(ALL_TERRITORIES.sort()).toEqual(
        Object.keys(TERRITORY_NAMES).sort(),
      );
    });
  });

  describe('CONTINENTS', () => {
    it('has 6 continents', () => {
      expect(Object.keys(CONTINENTS)).toHaveLength(6);
    });

    it('all territories belong to exactly one continent', () => {
      const assigned = new Set<string>();
      for (const continent of Object.values(CONTINENTS)) {
        for (const t of continent.territories) {
          expect(assigned.has(t)).toBe(false);
          assigned.add(t);
        }
      }
      expect(assigned.size).toBe(42);
    });

    it('América del Norte has 9 territories and bonus 5', () => {
      const na = CONTINENTS['america-del-norte'];
      expect(na.territories).toHaveLength(9);
      expect(na.bonus).toBe(5);
    });

    it('América del Sur has 4 territories and bonus 2', () => {
      const sa = CONTINENTS['america-del-sur'];
      expect(sa.territories).toHaveLength(4);
      expect(sa.bonus).toBe(2);
    });

    it('Europa has 7 territories and bonus 5', () => {
      const eu = CONTINENTS['europa'];
      expect(eu.territories).toHaveLength(7);
      expect(eu.bonus).toBe(5);
    });

    it('África has 6 territories and bonus 3', () => {
      const af = CONTINENTS['africa'];
      expect(af.territories).toHaveLength(6);
      expect(af.bonus).toBe(3);
    });

    it('Asia has 12 territories and bonus 7', () => {
      const asia = CONTINENTS['asia'];
      expect(asia.territories).toHaveLength(12);
      expect(asia.bonus).toBe(7);
    });

    it('Oceanía has 4 territories and bonus 2', () => {
      const oc = CONTINENTS['oceania'];
      expect(oc.territories).toHaveLength(4);
      expect(oc.bonus).toBe(2);
    });
  });

  describe('getTerritoryContinent', () => {
    it('returns correct continent for a territory', () => {
      expect(getTerritoryContinent('brasil')).toBe('america-del-sur');
      expect(getTerritoryContinent('alaska')).toBe('america-del-norte');
      expect(getTerritoryContinent('china')).toBe('asia');
      expect(getTerritoryContinent('alemania')).toBe('europa');
      expect(getTerritoryContinent('egipto')).toBe('africa');
      expect(getTerritoryContinent('australia')).toBe('oceania');
    });

    it('returns null for unknown territory', () => {
      expect(getTerritoryContinent('atlantis')).toBeNull();
    });
  });

  describe('ADJACENCY', () => {
    it('has adjacency entries for all 42 territories', () => {
      expect(Object.keys(ADJACENCY).sort()).toEqual(ALL_TERRITORIES.sort());
    });

    it('adjacency is symmetric (if A adjacent to B, then B adjacent to A)', () => {
      for (const [territory, neighbors] of Object.entries(ADJACENCY)) {
        for (const neighbor of neighbors) {
          expect(ADJACENCY[neighbor]).toBeDefined();
          expect(ADJACENCY[neighbor]).toContain(territory);
        }
      }
    });

    it('Brasil connects to Argelia (dotted line across Atlantic)', () => {
      expect(ADJACENCY['brasil']).toContain('argelia');
      expect(ADJACENCY['argelia']).toContain('brasil');
    });

    it('Alaska connects to Vladivostok (dotted line across Pacific)', () => {
      expect(ADJACENCY['alaska']).toContain('vladivostok');
      expect(ADJACENCY['vladivostok']).toContain('alaska');
    });

    it('every neighbor is a valid territory', () => {
      const validTerritories = new Set(ALL_TERRITORIES);
      for (const neighbors of Object.values(ADJACENCY)) {
        for (const n of neighbors) {
          expect(validTerritories.has(n)).toBe(true);
        }
      }
    });
  });
});
