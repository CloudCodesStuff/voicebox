"use client";

import { Toaster } from "@/components/ui/sonner";
import { TRPCProvider } from "@/trpc/client";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      {children}
      <Toaster
        // Bottom-right: out of the reading line, next to where the cursor
        // usually is after clicking the action that caused the toast.
        position="bottom-right"
        toastOptions={{
          classNames: { toast: "text-[0.92rem]" },
        }}
      />
    </TRPCProvider>
  );
}
