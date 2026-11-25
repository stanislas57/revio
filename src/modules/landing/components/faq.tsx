const QUESTIONS = [
  {
    q: "Mes notes sont-elles visibles par mes amis ?",
    a: "Non. Tes matières et tes notes restent privées. Tes amis voient seulement les séances de révision que tu choisis de partager, sans aucune note.",
  },
  {
    q: "Les moyennes calculées sont-elles officielles ?",
    a: "Non. Revio applique une convention simple et commune (notes ramenées sur 20, pondérées par les coefficients). Les règles réelles varient selon les établissements : compense toujours avec le règlement de ta formation.",
  },
  {
    q: "Comment gagne-t-on des XP et une série ?",
    a: "Chaque séance de révision terminée rapporte des XP. Un jour compte dans ta série à partir de quelques minutes de révision terminées. Les XP sont calculés par le serveur, pas par ton navigateur.",
  },
  {
    q: "Puis-je ne pas partager mes séances ?",
    a: "Oui. Tu choisis pour chaque séance si tes amis la voient. Une séance privée n'apparaît nulle part dans leur fil.",
  },
  {
    q: "C'est payant ?",
    a: "Aujourd'hui, rien n'est à payer. Une offre Premium est envisagée plus tard, sans tarif défini à ce jour.",
  },
  {
    q: "Existe-t-il une application mobile ?",
    a: "Revio est une application web qui s'utilise aussi sur téléphone. Des applications iOS et Android pourront venir plus tard.",
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h2 id="faq-title" className="text-center text-3xl font-bold tracking-tight">
          Questions fréquentes
        </h2>
        <div className="mt-10 divide-y rounded-xl border">
          {QUESTIONS.map(({ q, a }) => (
            <details key={q} className="group px-5 py-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-md font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                {q}
                <span
                  aria-hidden
                  className="text-xl leading-none text-muted-foreground transition-transform group-open:rotate-45 motion-reduce:transition-none"
                >
                  +
                </span>
              </summary>
              <p className="pt-2 pr-8 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
