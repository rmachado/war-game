export type CardSymbol = 'triangulo' | 'cuadrado' | 'circulo';

export interface TerritoryCard {
  id: string;         // e.g. "alaska"
  symbol: CardSymbol;
}

export interface JokerCard {
  id: string;         // "joker-1" or "joker-2"
  symbol: 'joker';
}

export type Card = TerritoryCard | JokerCard;

export function isTerritoryCard(card: Card): card is TerritoryCard {
  return card.symbol !== 'joker';
}

export function isJokerCard(card: Card): card is JokerCard {
  return card.symbol === 'joker';
}

export const TERRITORY_CARDS: TerritoryCard[] = [
  { id: 'alaska', symbol: 'triangulo' },
  { id: 'california', symbol: 'cuadrado' },
  { id: 'groenlandia', symbol: 'circulo' },
  { id: 'labrador', symbol: 'cuadrado' },
  { id: 'mackenzie', symbol: 'circulo' },
  { id: 'mexico', symbol: 'cuadrado' },
  { id: 'nuevayork', symbol: 'triangulo' },
  { id: 'ottawa', symbol: 'circulo' },
  { id: 'vancouver', symbol: 'triangulo' },
  { id: 'argentina', symbol: 'cuadrado' },
  { id: 'brasil', symbol: 'circulo' },
  { id: 'peru', symbol: 'triangulo' },
  { id: 'colombia', symbol: 'triangulo' },
  { id: 'alemania', symbol: 'circulo' },
  { id: 'inglaterra', symbol: 'circulo' },
  { id: 'islandia', symbol: 'circulo' },
  { id: 'moscu', symbol: 'triangulo' },
  { id: 'yugoslavia', symbol: 'cuadrado' },
  { id: 'francia', symbol: 'cuadrado' },
  { id: 'suecia', symbol: 'circulo' },
  { id: 'sudafrica', symbol: 'triangulo' },
  { id: 'argelia', symbol: 'circulo' },
  { id: 'congo', symbol: 'cuadrado' },
  { id: 'egipto', symbol: 'triangulo' },
  { id: 'madagascar', symbol: 'circulo' },
  { id: 'sudan', symbol: 'cuadrado' },
  { id: 'aral', symbol: 'triangulo' },
  { id: 'china', symbol: 'circulo' },
  { id: 'chita', symbol: 'triangulo' },
  { id: 'dudinka', symbol: 'circulo' },
  { id: 'india', symbol: 'triangulo' },
  { id: 'japon', symbol: 'cuadrado' },
  { id: 'mediooriente', symbol: 'cuadrado' },
  { id: 'mongolia', symbol: 'circulo' },
  { id: 'omsk', symbol: 'cuadrado' },
  { id: 'siberia', symbol: 'triangulo' },
  { id: 'vietnam', symbol: 'triangulo' },
  { id: 'vladivostok', symbol: 'circulo' },
  { id: 'australia', symbol: 'triangulo' },
  { id: 'borneo', symbol: 'cuadrado' },
  { id: 'nuevaguinea', symbol: 'circulo' },
  { id: 'sumatra', symbol: 'cuadrado' },
];

export const JOKER_CARDS: JokerCard[] = [
  { id: 'joker-1', symbol: 'joker' },
  { id: 'joker-2', symbol: 'joker' },
];

export function createShuffledDeck(): Card[] {
  const cards: Card[] = [...TERRITORY_CARDS, ...JOKER_CARDS];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function createTerritoryOnlyDeck(): TerritoryCard[] {
  const cards = [...TERRITORY_CARDS];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
