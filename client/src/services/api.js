let rawBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
rawBase = rawBase.replace(/\/+$/, '');
if (!rawBase.endsWith('/api')) {
  rawBase += '/api';
}
const API_BASE = rawBase;

export async function apiRequest(path, { token, ...options } = {}) {
  const controller = new AbortController();
  // 90-second timeout to accommodate Render free-tier cold starts (50-90s)
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  const isPlainObject = options.body && typeof options.body === 'object' && !(options.body instanceof FormData) && !(options.body instanceof Blob);
  const formattedBody = isPlainObject ? JSON.stringify(options.body) : options.body;

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      body: formattedBody,
      signal: options.signal || controller.signal,
      headers: {
        ...(formattedBody && typeof formattedBody === 'string' ? { 'Content-Type': 'application/json' } : {}),
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

