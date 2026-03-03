import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  console.warn("VITE_API_BASE_URL não definido. Crie um .env.local");
}

export const http = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url;
    console.error("[HTTP ERROR]", { status, url, error });

    return Promise.reject(error);
  }
);