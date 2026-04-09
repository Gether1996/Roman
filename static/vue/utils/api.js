export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop().split(';').shift());
  }
  return '';
}

export async function fetchJSON(url, options = {}) {
  const config = {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    ...options,
  };

  const method = (config.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    config.headers['X-CSRFToken'] = getCookie('csrftoken');
  }

  const response = await fetch(url, config);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error('Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function localizedBackendMessage(data, locale, fallback) {
  if (!data || typeof data !== 'object') {
    return fallback;
  }

  if (locale === 'en' && data.message_en) {
    return data.message_en;
  }
  if (locale === 'sk' && data.message_sk) {
    return data.message_sk;
  }
  return data.message || fallback;
}
