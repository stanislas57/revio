"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // The theme is only known in the browser: the server and the first client render use the same label, then
  // the real one (otherwise a dark-theme visitor gets a hydration mismatch and a wrong aria-label).
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const next = hydrated && resolvedTheme === "dark" ? "light" : "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-11", className)}
      onClick={() => setTheme(next)}
      aria-label={next === "dark" ? "Passer en mode sombre" : "Passer en mode clair"}
    >
      <Sun className="size-4 dark:hidden" aria-hidden />
      <Moon className="hidden size-4 dark:block" aria-hidden />
    </Button>
  );
}
