/** Page title of the charter: Inter 800, 32 px on mobile and 36 px from 768 px, tight. */
export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 space-y-1 text-center">
      <h1 className="text-[2rem] leading-tight font-extrabold tracking-[-0.03em] md:text-4xl">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
