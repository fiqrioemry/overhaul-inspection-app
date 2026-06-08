/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/query.ts
import { toast } from "sonner";
import i18n from "@/i18n";
import type { ResponseError } from "@/types/response.type";
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";

function translateApiError(error: any): string {
  const responseError = error as ResponseError;
  const code = responseError.code;
  if (code) {
    return i18n.t(`api:${code}`, { defaultValue: responseError.message || i18n.t("api:UNKNOWN_ERROR") });
  }
  return responseError.message || i18n.t("api:UNKNOWN_ERROR");
}

function handleQueryError(error: any) {
  const responseError = error as ResponseError;
  if (responseError.status === 401) return;
  toast.error(translateApiError(error));
}

function handleMutationError(error: any) {
  const responseError = error as ResponseError;
  if (responseError.status === 401) return;
  toast.error(translateApiError(error));
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
  mutationCache: new MutationCache({
    onError: handleMutationError,
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        const responseError = error as ResponseError;

        // except retry for error 400 to 500
        if (typeof responseError.status === "number" && responseError.status >= 400 && responseError.status < 500) {
          return false;
        }

        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
