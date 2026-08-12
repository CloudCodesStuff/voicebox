"use client";

import { Toaster } from "@/components/ui/sonner";
import { TRPCProvider } from "@/trpc/client";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          // Shop staff read this at arm's length while holding something.
          classNames: { toast: "text-[0.92rem]" },
        }}
      />
    </TRPCProvider>
  );
}
