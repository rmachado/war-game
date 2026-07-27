import { describe, it, expect } from 'vitest';
import { ALL_COLORS, getExchangeArmies, EXCHANGE_TABLE } from '../game/types.js';

describe('Exchange Table', () => {
  it('1st exchange gives 4 armies', () => {
    expect(getExchangeArmies(1)).toBe(4);
  });

  it('2nd exchange gives 6 armies', () => {
    expect(getExchangeArmies(2)).toBe(6);
  });

  it('3rd exchange gives 8 armies', () => {
    expect(getExchangeArmies(3)).toBe(8);
  });

  it('4th exchange gives 10 armies', () => {
    expect(getExchangeArmies(4)).toBe(10);
  });

  it('5th exchange gives 12 armies', () => {
    expect(getExchangeArmies(5)).toBe(12);
  });

  it('6th exchange gives 15 armies', () => {
    expect(getExchangeArmies(6)).toBe(15);
  });

  it('7th exchange gives 20 armies', () => {
    expect(getExchangeArmies(7)).toBe(20);
  });

  it('8th exchange gives 25 armies (+5 increment)', () => {
    expect(getExchangeArmies(8)).toBe(25);
  });

  it('9th exchange gives 30 armies', () => {
    expect(getExchangeArmies(9)).toBe(30);
  });

  it('10th exchange gives 35 armies', () => {
    expect(getExchangeArmies(10)).toBe(35);
  });

  it('nth exchange follows 20 + (n-7)*5 formula', () => {
    for (let n = 8; n <= 50; n++) {
      expect(getExchangeArmies(n)).toBe(20 + (n - 7) * 5);
    }
  });

  it('EXCHANGE_TABLE has entries for exchanges 1-7', () => {
    expect(Object.keys(EXCHANGE_TABLE)).toHaveLength(7);
    expect(EXCHANGE_TABLE[1]).toBe(4);
    expect(EXCHANGE_TABLE[7]).toBe(20);
  });
});

describe('Colors', () => {
  it('has exactly 6 colors', () => {
    expect(ALL_COLORS).toHaveLength(6);
    expect(ALL_COLORS).toContain('white');
    expect(ALL_COLORS).toContain('red');
    expect(ALL_COLORS).toContain('black');
    expect(ALL_COLORS).toContain('blue');
    expect(ALL_COLORS).toContain('yellow');
    expect(ALL_COLORS).toContain('green');
  });
});
