const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const baseFetch = (endpoint: string, options: RequestInit) =>
  fetch(`${API}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  }).then(async (res) => {
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || res.statusText);
    }
    return res.json();
  });

export const api = {
  get: (endpoint: string) => baseFetch(endpoint, { method: 'GET' }),
  post: (endpoint: string, body: any) => baseFetch(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) => baseFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint: string, body?: any) => baseFetch(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: (endpoint: string) => baseFetch(endpoint, { method: 'DELETE' }),
};