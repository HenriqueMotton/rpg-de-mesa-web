import axios from "axios";
import { getToken, clearToken } from "../auth/token";

const baseURL = import.meta.env.VITE_API_BASE_URL;

export const http = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      clearToken();
    }
    return Promise.reject(error);
  }
);