import { describe, it, expect } from 'vitest';
import {
  createShuffledDeck,
  createTerritoryOnlyDeck,
  isJokerCard,
  isTerritoryCard,
  TERRITORY_CARDS,
  JOKER_CARDS,
} from '../game/cards.js';

describe('Card Deck', () => {
  describe('TERRITORY_CARDS', () => {
    it('has exactly 42 territory cards', () => {
      expect(TERRITORY_CARDS).toHaveLength(42);
    });

    it('each card has a valid id and symbol', () => {
      for (const card of TERRITORY_CARDS) {
        expect(card.id).toBeTruthy();
        expect(['triangulo', 'cuadrado', 'circulo']).toContain(card.symbol);
      }
    });
  });

  describe('JOKER_CARDS', () => {
    it('has exactly 2 joker cards', () => {
      expect(JOKER_CARDS).toHaveLength(2);
    });

    it('each joker has symbol "joker"', () => {
      for (const card of JOKER_CARDS) {
        expect(card.symbol).toBe('joker');
      }
    });
  });

  describe('createShuffledDeck', () => {
    it('returns a deck of 44 cards', () => {
      const deck = createShuffledDeck();
      expect(deck).toHaveLength(44);
    });

    it('contains 2 jokers and 42 territory cards', () => {
      const deck = createShuffledDeck();
      const jokers = deck.filter((c) => isJokerCard(c));
      const territories = deck.filter((c) => isTerritoryCard(c));
      expect(jokers).toHaveLength(2);
      expect(territories).toHaveLength(42);
    });

    it('shuffles cards (different order with high probability)', () => {
      const deck1 = createShuffledDeck();
      const deck2 = createShuffledDeck();
      const ids1 = deck1.map((c) => c.id).join(',');
      const ids2 = deck2.map((c) => c.id).join(',');
      expect(ids1).not.toBe(ids2);
    });
  });

  describe('createTerritoryOnlyDeck', () => {
    it('returns 42 territory cards (no jokers)', () => {
      const deck = createTerritoryOnlyDeck();
      expect(deck).toHaveLength(42);
      for (const card of deck) {
        expect(card.symbol).not.toBe('joker');
      }
    });
  });

  describe('isJokerCard / isTerritoryCard', () => {
    it('correctly identifies a joker card', () => {
      expect(isJokerCard({ id: 'joker-1', symbol: 'joker' })).toBe(true);
      expect(isTerritoryCard({ id: 'joker-1', symbol: 'joker' })).toBe(false);
    });

    it('correctly identifies a territory card', () => {
      expect(isTerritoryCard({ id: 'alaska', symbol: 'triangulo' })).toBe(true);
      expect(isJokerCard({ id: 'alaska', symbol: 'triangulo' })).toBe(false);
    });
  });
});
