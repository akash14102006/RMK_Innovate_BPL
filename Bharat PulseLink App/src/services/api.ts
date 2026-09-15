import axios, { AxiosError } from 'axios';
import SessionManager from './sessionManager';
import { resolveApiBaseUrl } from '../utils/apiUrl';

const api = axios.create({ baseURL: resolveApiBaseUrl(), timeout: 15000 });

api.interceptors.request.use(async (config) => {
  try {
    const token = await SessionManager.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // noop for scaffold
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError & { config?: any }) => {
    const originalConfig = error.config;
    if (!originalConfig) return Promise.reject(error);

    // If 401 and we have a refresh token, try refresh once
    if (error.response && error.response.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;
      try {
        await SessionManager.refreshIfNeeded();
        const token = await SessionManager.getAccessToken();
        if (token && originalConfig.headers) {
          originalConfig.headers.Authorization = `Bearer ${token}`;
        }
        return api(originalConfig);
      } catch (e) {
        await SessionManager.clear();
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
