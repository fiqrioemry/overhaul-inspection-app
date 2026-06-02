/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/query.ts
import { toast } from "sonner";
import type { ResponseError } from "@/types/response.type";
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";

// Global error handler function
function handleQueryError(error: any) {
  const responseError = error as ResponseError;

  // Don't show toast for auth errors (handled by axios interceptor)
  if (responseError.status === 401) {
    return;
  }

  // Show error toast for other errors
  toast.error(responseError.message || "An error occurred");
}

function handleMutationError(error: any) {
  const responseError = error as ResponseError;

  // Don't show toast for auth errors
  if (responseError.status === 401) {
    return;
  }

  // Show error toast
  toast.error(responseError.message || "An error occurred");
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
