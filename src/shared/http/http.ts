import axios from "axios";
import { getToken } from "../auth/token";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  config.headers["ngrok-skip-browser-warning"] = "1";
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});