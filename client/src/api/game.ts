const BASE = '/api'

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export function createGame(name: string, color: string) {
  return request('/games', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  })
}

export function joinGame(code: string, name: string, color: string) {
  return request(`/games/${code}/join`, {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  })
}

export function rejoinGame(code: string, color: string, name: string) {
  return request(`/games/${code}/rejoin?color=${encodeURIComponent(color)}&name=${encodeURIComponent(name)}`)
}
