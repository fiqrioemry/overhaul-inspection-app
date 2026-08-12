/* eslint-disable @typescript-eslint/no-explicit-any */

// src/lib/axios.ts
import axios, { type AxiosError } from "axios";
import { useAuthStore } from "@/stores/auth.store";
import type { ResponseError } from "@/types/response.type";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

const SKIP_REDIRECT_URLS = ["/auth/me", "/auth/login", "/auth/logout"];

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

// A `responseType: "blob"` request gets a Blob body even when the server answered with the
// JSON error envelope, so the envelope has to be read back out before it can be reported.
async function readErrorPayload(data: unknown): Promise<any> {
  if (!(data instanceof Blob)) return data;
  try {
    return JSON.parse(await data.text());
  } catch {
    return undefined;
  }
}

// Response interceptor
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const url = error.config?.url ?? "";
    const status = error.response?.status;
    const is401 = status === 401;
    const shouldSkip = SKIP_REDIRECT_URLS.some((path) => url.includes(path));

    if (is401 && !shouldSkip) {
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
    }

    const data = await readErrorPayload(error.response?.data);

    // Transform error to standardized ResponseError format
    const responseError: ResponseError = {
      success: false,
      message: data?.message || error.message || "An unexpected error occurred",
      status: status || 500,
      code: data?.code || error.code || "UNKNOWN_ERROR",
      errors: data?.errors,
    };

    return Promise.reject(responseError);
  },
);

export default api;
