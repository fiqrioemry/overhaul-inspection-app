import axios from "axios";
import { useAuthStore } from "@/features/auth/auth.store";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

const SKIP_REDIRECT_URLS = ["/auth/me", "/auth/login", "/auth/logout"];

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url ?? "";
    const is401 = error.response?.status === 401;
    const shouldSkip = SKIP_REDIRECT_URLS.some((path) => url.includes(path));

    if (is401 && !shouldSkip) {
      useAuthStore.getState().clearUser();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
