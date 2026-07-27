const BASE = '/api';

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function getAuthHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function createGame(name: string, color: string) {
  return request('/games', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  });
}

export function joinGame(code: string, name: string, color: string) {
  return request(`/games/${code}/join`, {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  });
}

export function rejoinGame(code: string, color: string) {
  return request(`/games/${code}/rejoin`, {
    method: 'POST',
    body: JSON.stringify({ color }),
  });
}

export function startGame(code: string, token: string) {
  return request(`/games/${code}/start`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export function getGameState(code: string, token: string) {
  return request(`/games/${code}?token=${encodeURIComponent(token)}`);
}

export function exchangeCards(code: string, token: string, cardIds: string[]) {
  return request(`/games/${code}/exchange`, {
    method: 'POST',
    body: JSON.stringify({ token, cardIds }),
  });
}

export function placeArmies(code: string, token: string, placements: Record<string, number>) {
  return request(`/games/${code}/place-armies`, {
    method: 'POST',
    body: JSON.stringify({ token, placements }),
  });
}

export function attack(code: string, token: string, from: string, to: string, armies: number) {
  return request(`/games/${code}/attack`, {
    method: 'POST',
    body: JSON.stringify({ token, from, to, armies }),
  });
}

export function conquer(code: string, token: string, armies: number) {
  return request(`/games/${code}/conquer`, {
    method: 'POST',
    body: JSON.stringify({ token, armies }),
  });
}

export function moveArmies(code: string, token: string, from: string, to: string, count: number) {
  return request(`/games/${code}/move`, {
    method: 'POST',
    body: JSON.stringify({ token, from, to, count }),
  });
}

export function endAttacks(code: string, token: string) {
  return request(`/games/${code}/end-attacks`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export function kickPlayer(code: string, token: string, targetColor: string) {
  return request(`/games/${code}/kick`, {
    method: 'POST',
    body: JSON.stringify({ token, targetColor }),
  });
}

export function endMoves(code: string, token: string) {
  return request(`/games/${code}/end-moves`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}
