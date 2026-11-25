export function SiteFooter() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-semibold text-foreground">Revio</span> · Version de démonstration, en cours de
          construction.
        </p>
        <a
          href="#top"
          className="inline-flex min-h-11 w-fit items-center rounded-md underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          Retour en haut
        </a>
      </div>
    </footer>
  );
}
