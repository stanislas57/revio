"use client";

import { useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setSessionVisibility } from "../server/actions";

export function ShareToggle({ sessionId, shared }: { sessionId: string; shared: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col items-center gap-2 text-sm sm:flex-row sm:justify-between">
      <p className="flex items-center gap-2 text-muted-foreground">
        {shared ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
        {shared ? "Visible par tes amis dans leur fil." : "Séance privée : tes amis ne la voient pas."}
      </p>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await setSessionVisibility(sessionId, !shared);
            if (!res.ok) toast.error(res.error.message);
          })
        }
      >
        {shared ? "Rendre privée" : "Partager avec mes amis"}
      </Button>
    </div>
  );
}
