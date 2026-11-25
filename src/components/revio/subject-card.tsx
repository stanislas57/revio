"use client";

// Inspiration : shadcn/ui — Card (MIT) · implémentation originale pour Revio
import Link from "next/link";
import { cn } from "@/lib/utils";
import { RevioRing } from "./revio-ring";

export type SubjectSummary = {
  id: string;
  name: string;
  /** Mastery, 0 to 1. */
  value: number;
  sheets: number;
  due: number;
  /** "Contrôle J-12" */
  deadline?: string;
  /** The deadline is close: its text uses the magenta text colour. */
  soon?: boolean;
  href: string;
};

/** A subject: small ring with the percentage, number of sheets and due cards, and the next deadline. */
export function RevioSubjectCard({ subject, className }: { subject: SubjectSummary; className?: string }) {
  return (
    <Link
      href={subject.href}
      className={cn(
        "flex min-h-11 items-center gap-4 rounded-lg border bg-card p-4 transition-colors outline-none hover:border-revio-violet focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none",
        className,
      )}
    >
      <RevioRing
        variant="progress"
        label={`Maîtrise de ${subject.name}`}
        value={subject.value}
        size={56}
        stroke={6}
      >
        <span className="font-heading text-xs font-bold tabular-nums">
          {Math.round(subject.value * 100)}%
        </span>
      </RevioRing>
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-base font-semibold">{subject.name}</span>
        <span className="block text-xs text-muted-foreground">
          {subject.sheets} fiches · {subject.due} dues
        </span>
        {subject.deadline && (
          <span
            className={cn(
              "block text-xs font-semibold",
              subject.soon ? "text-revio-magenta-text" : "text-muted-foreground",
            )}
          >
            {subject.deadline}
          </span>
        )}
      </span>
    </Link>
  );
}
