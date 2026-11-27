import { cn } from "@/lib/utils";

/** The hand-drawn underline of the page titles (Revio's organic touch): a pink wave, decorative. */
export function WavyUnderline({ className }: { className?: string }) {
  return (
    <svg
      width="180"
      height="14"
      viewBox="0 0 180 14"
      aria-hidden="true"
      className={cn("text-revio-social", className)}
    >
      <path
        d="M2 8 C 20 1, 38 15, 58 8 S 96 1, 116 8 S 154 15, 178 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
