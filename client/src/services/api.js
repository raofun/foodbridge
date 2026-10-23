let rawBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
rawBase = rawBase.replace(/\/+$/, '');
if (!rawBase.endsWith('/api')) {
  rawBase += '/api';
}
const API_BASE = rawBase;

export async function apiRequest(path, { token, ...options } = {}) {
  const controller = new AbortController();
  // 25-second timeout to accommodate free-tier cold-starts and bcrypt hashing
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'The request could not be completed.');
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

