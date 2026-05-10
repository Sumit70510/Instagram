import axios from 'axios';
import store from '../Redux/store.js';
import { setAuthUser } from '../Redux/authslice.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(setAuthUser(null));
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;