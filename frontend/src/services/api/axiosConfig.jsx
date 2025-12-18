import axios from 'axios';

const normalizeBaseUrl = (value) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const axiosClient = axios.create({
  baseURL: normalizeBaseUrl(process.env.REACT_APP_API_BASE_URL),
  timeout: Number(process.env.REACT_APP_API_TIMEOUT) || 30000,
});

// Thêm Interceptor để tự động thêm Authorization Header
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Xử lý lỗi toàn cục (nếu cần)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Lỗi từ API:', error.response || error.message);
    return Promise.reject(error);
  }
);

export default axiosClient;
