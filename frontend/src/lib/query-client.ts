import { QueryClient } from '@tanstack/react-query';

/**
 * Standard TanStack Query Client for 2026 Mini App
 * Optimized for mobile networks with staleTime, retry, and window focus refetch control
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes fresh data
      gcTime: 1000 * 60 * 30, // 30 minutes in garbage collection cache
      retry: 1, // 1 retry on network failure
      refetchOnWindowFocus: false, // Prevent unnecessary refetches inside Telegram WebApp
    },
    mutations: {
      retry: false,
    },
  },
});
