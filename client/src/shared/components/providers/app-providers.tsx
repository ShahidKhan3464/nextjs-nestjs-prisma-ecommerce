"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BlockedSessionGuard } from "@/shared/components/providers/blocked-session-guard";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        enableSystem
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
      >
        {children}
        <BlockedSessionGuard />
        <Toaster richColors position="top-center" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
