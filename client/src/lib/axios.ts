/* eslint-disable @typescript-eslint/no-explicit-any */
// import axios from "axios";
// import { useAuthStore } from "@/features/auth/auth.store";

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL,
//   withCredentials: true,
// });

// const SKIP_REDIRECT_URLS = ["/auth/me", "/auth/login", "/auth/logout"];

// api.interceptors.response.use(
//   (res) => res,
//   (error) => {
//     const url = error.config?.url ?? "";
//     const is401 = error.response?.status === 401;
//     const shouldSkip = SKIP_REDIRECT_URLS.some((path) => url.includes(path));

//     if (is401 && !shouldSkip) {
//       useAuthStore.getState().clearUser();
//       window.location.href = "/login";
//     }

//     return Promise.reject(error);
//   },
// );

// export default api;

// src/lib/axios.ts
import axios, { type AxiosError } from "axios";
import { useAuthStore } from "@/stores/auth.store";
import type { ResponseError } from "@/types/response.type";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

const SKIP_REDIRECT_URLS = ["/auth/me", "/auth/login", "/auth/logout"];

// Request interceptor (optional - untuk future use)
api.interceptors.request.use(
  (config) => {
    // Bisa tambahkan token bearer jika diperlukan
    // const token = localStorage.getItem("token");
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<any>) => {
    const url = error.config?.url ?? "";
    const status = error.response?.status;
    const is401 = status === 401;
    const shouldSkip = SKIP_REDIRECT_URLS.some((path) => url.includes(path));

    // Handle 401 Unauthorized - redirect to login (existing feature)
    if (is401 && !shouldSkip) {
      useAuthStore.getState().clearUser();
      window.location.href = "/login";
    }

    // Transform error to standardized ResponseError format
    const responseError: ResponseError = {
      success: false,
      message: error.response?.data?.message || error.message || "An unexpected error occurred",
      status: status || 500,
      code: error.response?.data?.code || error.code || "UNKNOWN_ERROR",
      errors: error.response?.data?.errors,
    };

    return Promise.reject(responseError);
  },
);

export default api;
