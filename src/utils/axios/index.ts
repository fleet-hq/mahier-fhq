import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add user auth token to requests when logged in
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const userToken = localStorage.getItem('access_token');
      if (userToken) {
        config.headers.Authorization = `Bearer ${userToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
