"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/trpc/client";

export function AcceptInvite({
  token,
  orgName,
}: {
  token: string;
  orgName: string;
}) {
  const [error, setError] = useState<string | null>(null);

  const accept = api.org.acceptInvite.useMutation({
    onSuccess(result) {
      toast.success(`You're in. Welcome to ${result.orgName}.`);
      // A full document load rather than router.replace: accepting switches
      // the active workspace, and a soft navigation would carry the previous
      // one's cached queries into it. It also spends the token, so the back
      // button must not return to a page that will now fail.
      window.location.replace("/app");
    },
    onError(e) {
      setError(e.message);
    },
  });

  return (
    <>
      <button
        type="button"
        disabled={accept.isPending}
        onClick={() => {
          setError(null);
          accept.mutate({ token });
        }}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 text-[0.94rem] font-semibold text-mint-ink transition-all hover:brightness-[0.96] disabled:opacity-60"
      >
        {accept.isPending && <Loader2 className="size-4 animate-spin" />}
        Join {orgName}
      </button>

      {error && (
        <p className="mt-3 text-[0.83rem] leading-relaxed text-negative">
          {error}
        </p>
      )}
    </>
  );
}
