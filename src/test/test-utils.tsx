import { type ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Creates a fresh QueryClient for each test with aggressive disabling
 * of retries and refetching to make tests predictable.
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperOptions {
  routerProps?: MemoryRouterProps;
  queryClient?: QueryClient;
}

/**
 * Creates a wrapper component with all needed providers.
 */
export function createWrapper(options: WrapperOptions = {}) {
  const queryClient = options.queryClient || createTestQueryClient();

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter {...options.routerProps}>
          <TooltipProvider>{children}</TooltipProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

/**
 * Custom render that wraps components with all providers.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: WrapperOptions & Omit<RenderOptions, "wrapper"> = {}
) {
  const { routerProps, queryClient, ...renderOptions } = options;
  return render(ui, {
    wrapper: createWrapper({ routerProps, queryClient }),
    ...renderOptions,
  });
}

export { render };
