import Axios from 'axios';

const axios = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// Tambahkan token pada request API
axios.interceptors.request.use(
  (config) => {
    if (typeof window === 'undefined') {
      return config;
    }

    const endpoint = (config.url || '')
      .split('?')[0]
      .replace(/\/+$/, '');

    const isAuthEndpoint = /\/(login|register)$/.test(endpoint);

    if (isAuthEndpoint) {
      return config;
    }

    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('meetspace_auth_token');

    if (token && !config.headers.has('Authorization')) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Tangani token kedaluwarsa
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window === 'undefined') {
      return Promise.reject(error);
    }

    const endpoint = (error.config?.url || '')
      .split('?')[0]
      .replace(/\/+$/, '');

    const isAuthEndpoint = /\/(login|register)$/.test(endpoint);

    if (error.response?.status === 401 && !isAuthEndpoint) {
      const token =
        localStorage.getItem('access_token') ||
        localStorage.getItem('meetspace_auth_token');

      if (token) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('meetspace_auth_token');
        localStorage.removeItem('user_data');

        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axios;
