import { QueryClient } from '@tanstack/react-query';
import { translateError } from '@/utils/translateError';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        // Notifikasi global ditangani komponen; ini hanya fallback konsol.
        console.error(translateError(error));
      },
    },
  },
});
