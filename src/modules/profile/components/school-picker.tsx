"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  describeSchool,
  MIN_QUERY_LENGTH,
  SCHOOL_KIND_LABELS,
  SCHOOL_KINDS,
  type School,
  type SchoolKind,
} from "../domain/schools";
import { saveMySchool, searchSchools } from "../server/school-actions";

/**
 * Choose the school among the lycées and higher-education establishments of France: a kind filter, a
 * search by name or city, and a list of results. The choice is saved only when "Enregistrer" is pressed,
 * and only the user sees it.
 */
export function SchoolPicker({
  current,
  idPrefix = "school",
  onSaved,
  onSelect,
}: {
  current: School | null;
  idPrefix?: string;
  /** Called after a successful save (the first-run card uses it to disappear). */
  onSaved?: () => void;
  /**
   * Selection only (the onboarding): choosing a result calls this instead of offering "Enregistrer"; the caller
   * saves the choice with the other answers.
   */
  onSelect?: (school: School | null) => void;
}) {
  const [kind, setKind] = useState<SchoolKind | "">("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<School[] | null>(null);
  const [selected, setSelected] = useState<School | null>(current);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [searching, startSearch] = useTransition();
  const [saving, startSave] = useTransition();
  const lastSearch = useRef(0);

  function run(nextKind: SchoolKind | "", nextQuery: string) {
    setMessage(null);
    if (nextQuery.trim().length < MIN_QUERY_LENGTH) {
      setResults(null);
      return;
    }
    const ticket = ++lastSearch.current;
    startSearch(async () => {
      const res = await searchSchools({ query: nextQuery, kind: nextKind === "" ? null : nextKind });
      if (ticket !== lastSearch.current) return; // a newer search is already running
      if (res.ok) setResults(res.data);
      else {
        setResults(null);
        setMessage({ ok: false, text: res.error.message });
      }
    });
  }

  function save(school: School | null) {
    startSave(async () => {
      const res = await saveMySchool({ schoolId: school?.id ?? null });
      if (res.ok) {
        setSelected(school);
        setMessage({ ok: true, text: school ? "École enregistrée." : "École retirée." });
        onSaved?.();
      } else {
        setMessage({ ok: false, text: res.error.message });
      }
    });
  }

  const unchanged = (selected?.id ?? null) === (current?.id ?? null);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-kind`}>Type d&apos;établissement</Label>
          <NativeSelect
            id={`${idPrefix}-kind`}
            value={kind}
            onChange={(e) => {
              const next = e.target.value as SchoolKind | "";
              setKind(next);
              run(next, query);
            }}
            className="h-11 w-full"
          >
            <option value="">Tous</option>
            {SCHOOL_KINDS.map((k) => (
              <option key={k} value={k}>
                {SCHOOL_KIND_LABELS[k]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-query`}>Nom ou ville</Label>
          <Input
            id={`${idPrefix}-query`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              run(kind, e.target.value);
            }}
            autoComplete="off"
            maxLength={80}
            placeholder="Ex. Lycée Descartes, Lyon, Sorbonne"
            className="h-11"
          />
        </div>
      </div>

      <div aria-live="polite" className="space-y-2">
        {searching && <p className="text-sm text-muted-foreground">Recherche…</p>}
        {!searching && results !== null && results.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucun établissement trouvé. Essaie avec moins de mots, ou change le type. La liste couvre les
            lycées et les principaux établissements supérieurs.
          </p>
        )}
        {results !== null && results.length > 0 && (
          <ul className="max-h-72 divide-y overflow-auto rounded-lg border" aria-label="Résultats">
            {results.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(s);
                    onSelect?.(s);
                  }}
                  aria-pressed={selected?.id === s.id}
                  className="flex min-h-11 w-full flex-col items-center px-3 py-2 text-center text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-muted"
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {SCHOOL_KIND_LABELS[s.kind]}
                    {describeSchool(s) && ` · ${describeSchool(s)}`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-sm">
        {selected ? (
          <>
            École choisie : <strong>{selected.name}</strong>
            {selected.city ? ` (${selected.city})` : ""}
          </>
        ) : (
          <span className="text-muted-foreground">Aucune école choisie.</span>
        )}
      </p>

      <div className={onSelect ? "hidden" : "flex flex-wrap items-center justify-center gap-2"}>
        <Button type="button" className="h-11" disabled={saving || unchanged} onClick={() => save(selected)}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {current && (
          <Button type="button" variant="ghost" className="h-11" disabled={saving} onClick={() => save(null)}>
            Retirer mon école
          </Button>
        )}
      </div>
      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={message.ok ? "text-sm" : "text-sm text-destructive"}
        >
          {message.text}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Visible par toi seul, jamais par tes amis. Source : annuaire de l&apos;éducation et enseignement
        supérieur (données ouvertes, Licence Ouverte Etalab).
      </p>
    </div>
  );
}
