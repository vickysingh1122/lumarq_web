export async function adminRequest(resource, { method = 'GET', id, query, body, signal } = {}) {
  const params = new URLSearchParams({ resource, ...query });
  if (id) params.set('id', id);
  const response = await fetch('/api/admin?' + params, {
    method,
    signal,
    ...(method !== 'GET' && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    }),
  }).catch(error => {
    if (error.name === 'AbortError') throw error;
    throw new Error('Cannot reach the admin API. Check that the backend is running.');
  }).catch(error => {
    if (error.name === 'AbortError') throw error;
    throw new Error('Cannot reach the admin API. Check that the backend is running.');
  });
  if (response.status === 204) return null;
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) {
    const message = response.status === 502 || response.status === 504
      ? 'The admin API is unreachable. Start the backend and reload this page.'
      : 'The admin API returned an unexpected response. Check the backend URL.';
    const error = new Error(result?.error || message);
    error.status = response.status;
    throw error;
  }
  return result;
}

export async function uploadImage(file) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read the selected image.'));
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return (await adminRequest('media', { method: 'POST', body: { base64 } })).url;
}
