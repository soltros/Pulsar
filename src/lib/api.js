import { useAuthStore } from '../store/authStore';

export const getApiUrl = (endpoint, params = {}) => {
  const { serverUrl, username, token, salt } = useAuthStore.getState();
  if (!serverUrl || !username || !token || !salt) return null;
  
  const query = new URLSearchParams({
    u: username,
    t: token,
    s: salt,
    v: '1.16.1',
    c: 'pulsar',
    f: 'json',
    ...params
  });
  
  return `${serverUrl}/rest/${endpoint}?${query.toString()}`;
};

export const getCoverArtUrl = (id, size = 300) => {
  if (!id) return '';
  return getApiUrl('getCoverArt.view', { id, size });
};

export const fetchApi = async (endpoint, params = {}) => {
  const url = getApiUrl(endpoint, params);
  if (!url) throw new Error('Not authenticated');
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API HTTP error: ${response.status}`);
  
  const data = await response.json();
  if (data['subsonic-response']?.status !== 'ok') {
    throw new Error(data['subsonic-response']?.error?.message || 'API error');
  }
  
  return data['subsonic-response'];
};
