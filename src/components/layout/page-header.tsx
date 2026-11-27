import { WavyUnderline } from "@/components/revio/wavy-underline";

/**
 * Page title of the charter: Inter 800, 32 px on mobile and 36 px from 768 px, tight, with the hand-drawn pink
 * underline that every Revio page shares.
 */
export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 flex flex-col items-center gap-1 text-center">
      <h1 className="text-[2rem] leading-tight font-extrabold tracking-[-0.03em] md:text-4xl">{title}</h1>
      <WavyUnderline />
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
