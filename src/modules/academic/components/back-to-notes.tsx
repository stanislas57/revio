import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Back to « Mes notes », at the top of the sub-pages (the way back on a small screen). */
export function BackToNotes() {
  return (
    <Link
      href="/notes"
      className="mb-2 inline-flex min-h-11 items-center gap-2 rounded-full border bg-card px-4 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <ArrowLeft className="size-4" aria-hidden /> Mes notes
    </Link>
  );
}
