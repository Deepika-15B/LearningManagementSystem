import axios from 'axios';

export const getMediaUrl = (assetPath) => {
  if (!assetPath) return '';
  if (/^https?:\/\//i.test(assetPath)) return assetPath;

  const baseUrl = (axios.defaults.baseURL || (process.env.REACT_APP_API_URL || '').trim() || '').replace(/\/+$/, '');
  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;

  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
};
