/**
 * Reads the text of a transcript ("relevé de notes", "bulletin") or of a subjects and coefficients sheet
 * and proposes subjects, coefficients and grades. Plain rules, no AI, no network: the result is only a
 * PROPOSAL that the user checks and corrects before anything is saved (see import-review.tsx).
 */

export type ParsedGrade = { value: number; maxValue: number };

export type ParsedSubject = {
  name: string;
  /** null when the document does not give one. */
  coefficient: number | null;
  semester: string | null;
  grades: ParsedGrade[];
  /** Why the line deserves a second look (shown next to it). */
  notes: string[];
};

export type ParsedDocument = { subjects: ParsedSubject[]; warnings: string[] };

export const MAX_SUBJECTS = 40;
export const MAX_GRADES_PER_SUBJECT = 20;

const NUMBER = String.raw`\d+(?:[.,]\d+)?`;
const toNumber = (s: string) => Number(s.replace(",", "."));

/** First words (accents and case ignored) that mark a line as not being a subject. */
const NOT_A_SUBJECT = [
  "moyenne generale",
  "moyenne de la classe",
  "moyenne classe",
  "moyenne",
  "total",
  "rang",
  "classement",
  "appreciation",
  "absence",
  "retard",
  "date",
  "nom",
  "prenom",
  "classe",
  "annee",
  "bulletin",
  "releve",
  "college",
  "lycee",
  "universite",
  "ecole",
  "etablissement",
  "page",
  "signature",
  "observation",
  "avis",
  "decision",
  "mention",
  "credits",
  "ects",
  "matiere",
  "matieres",
  "discipline",
  "disciplines",
  "intitule",
  "unite",
  "coefficient",
  "coef",
  "note",
  "notes",
  "semestre",
  "trimestre",
];

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function isNotASubject(name: string): boolean {
  const f = fold(name).trim();
  return NOT_A_SUBJECT.some((w) => f === w || f.startsWith(`${w} `));
}

function cleanName(raw: string): string {
  return raw
    .replace(/[|;:\t]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-–—•*·.\d)]+(?=[A-Za-zÀ-ÿ])/, "") // list bullets and numbering
    .replace(/[\s\-–—•*·.,(/]+$/, "")
    .trim();
}

function semesterOf(line: string): string | null {
  const m = fold(line).match(/\b(semestre|trimestre|sem\.?|s)\s*([0-9]{1,2})\b/);
  if (!m) return null;
  const word = m[1] === "trimestre" ? "Trimestre" : "Semestre";
  return `${word} ${m[2]}`;
}

type Columns = { name: number; coef: number; grade: number; max: number | null };

/** CSV / spreadsheet export with a header row: the columns are found by their titles. */
function detectColumns(cells: string[]): Columns | null {
  const find = (re: RegExp) => cells.findIndex((c) => re.test(fold(c)));
  const name = find(/^(matiere|discipline|intitule|ue|enseignement|cours|libelle)/);
  const coef = find(/^(coef|coefficient|coeff)/);
  const grade = find(/^(note|moyenne|resultat|moy)/);
  if (name < 0 || (coef < 0 && grade < 0)) return null;
  const max = find(/^(bareme|sur)$/);
  return { name, coef, grade, max: max < 0 ? null : max };
}

function splitCells(line: string): string[] | null {
  for (const sep of [";", "\t", "|"]) {
    if (line.split(sep).length >= 3) return line.split(sep).map((c) => c.trim());
  }
  if ((line.match(/,/g) ?? []).length >= 2 && !/\d,\d/.test(line))
    return line.split(",").map((c) => c.trim());
  return null;
}

function readCell(cell: string | undefined): { value: number; max: number | null } | null {
  if (!cell) return null;
  const m = cell.trim().match(new RegExp(`^(${NUMBER})(?:\\s*/\\s*(${NUMBER}))?$`));
  if (!m?.[1]) return null;
  return { value: toNumber(m[1]), max: m[2] ? toNumber(m[2]) : null };
}

/** One free-text line: "Mathématiques  coef 4  14,5 / 20", "Anglais (coef. 2) 12.5", "Histoire 3 15". */
function parseLine(line: string): Omit<ParsedSubject, "semester"> | null {
  let rest = line;
  const notes: string[] = [];

  // Things that look like numbers but are not grades: dates, hours, ECTS, credits, percentages, rank (3e, 2/30).
  rest = rest
    .replace(/\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/g, " ")
    .replace(/\b\d{1,2}\s*h\s*\d{0,2}\b/gi, " ")
    .replace(new RegExp(`${NUMBER}\\s*(?:ects|cr[ée]dits?|%|h\\b|heures?)`, "gi"), " ")
    .replace(new RegExp(`(?:ects|cr[ée]dits?)\\s*[:=]?\\s*${NUMBER}`, "gi"), " ")
    .replace(/\b\d+\s*(?:e|er|ème|eme)\b/gi, " ");

  let coefficient: number | null = null;
  const coefMatch = rest.match(
    new RegExp(`\\b(?:coef(?:ficient)?s?|coeff?)\\.?\\s*[:=]?\\s*(${NUMBER})`, "i"),
  );
  if (coefMatch?.[1]) {
    coefficient = toNumber(coefMatch[1]);
    rest = rest.replace(coefMatch[0], " ");
  }

  // The name is what comes before the first number.
  const firstDigit = rest.search(/\d/);
  const name = cleanName(firstDigit < 0 ? rest : rest.slice(0, firstDigit));
  if (name.replace(/[^A-Za-zÀ-ÿ]/g, "").length < 3 || name.length > 80 || isNotASubject(name)) return null;
  const numbersPart = firstDigit < 0 ? "" : rest.slice(firstDigit);

  const found = [...numbersPart.matchAll(new RegExp(`(${NUMBER})(?:\\s*/\\s*(${NUMBER}))?`, "g"))].map(
    (m) => ({
      value: toNumber(m[1] ?? "0"),
      max: m[2] ? toNumber(m[2]) : null,
    }),
  );
  if (found.length === 0 && coefficient === null) return null;

  // Without the word "coef", "Histoire 3 15" is read as coefficient 3, grade 15 (a guess, said so).
  if (coefficient === null && found.length >= 2) {
    const first = found[0];
    const second = found[1];
    if (
      first &&
      second &&
      first.max === null &&
      Number.isInteger(first.value) &&
      first.value >= 1 &&
      first.value <= 12
    ) {
      coefficient = first.value;
      found.shift();
      notes.push("Coefficient deviné d'après la position du nombre : à vérifier.");
    }
  }

  const grades: ParsedGrade[] = [];
  for (const f of found) {
    const maxValue = f.max ?? 20;
    if (maxValue <= 0 || maxValue > 1000 || f.value > maxValue) continue;
    grades.push({ value: f.value, maxValue });
  }
  if (grades.length > 1) {
    notes.push(
      "Plusieurs nombres sur la ligne (moyenne de la classe, note la plus haute…) : seul le premier est repris comme note.",
    );
    grades.length = 1;
  }
  if (grades.length === 0 && coefficient === null) return null;
  return { name, coefficient, grades, notes };
}

/** Parses the text of a document. Subjects with the same name are merged. */
export function parseAcademicText(text: string): ParsedDocument {
  const warnings: string[] = [];
  const subjects: ParsedSubject[] = [];
  const byName = new Map<string, ParsedSubject>();
  let semester: string | null = null;
  let columns: Columns | null = null;

  const add = (s: Omit<ParsedSubject, "semester">) => {
    const key = fold(s.name);
    const existing = byName.get(key);
    if (existing) {
      existing.grades.push(...s.grades);
      existing.coefficient ??= s.coefficient;
      return;
    }
    const subject: ParsedSubject = { ...s, semester };
    byName.set(key, subject);
    subjects.push(subject);
  };

  for (const rawLine of text.replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const sem = semesterOf(line);
    if (sem && !/\d[.,]\d/.test(line) && line.length < 40) {
      semester = sem;
      continue;
    }
    const cells = splitCells(line);
    if (cells) {
      const header = detectColumns(cells);
      if (header) {
        columns = header;
        continue;
      }
      if (columns) {
        const name = cleanName(cells[columns.name] ?? "");
        if (name.replace(/[^A-Za-zÀ-ÿ]/g, "").length >= 3 && !isNotASubject(name)) {
          const coef = columns.coef >= 0 ? readCell(cells[columns.coef]) : null;
          const g = columns.grade >= 0 ? readCell(cells[columns.grade]) : null;
          const maxCell = columns.max !== null ? readCell(cells[columns.max]) : null;
          const maxValue = g?.max ?? maxCell?.value ?? 20;
          add({
            name,
            coefficient: coef?.value ?? null,
            grades: g && g.value <= maxValue && maxValue > 0 ? [{ value: g.value, maxValue }] : [],
            notes: [],
          });
          continue;
        }
      }
    }
    const parsed = parseLine(line);
    if (parsed) add(parsed);
  }

  if (subjects.length > MAX_SUBJECTS) {
    warnings.push(`Seules les ${MAX_SUBJECTS} premières matières sont proposées.`);
    subjects.length = MAX_SUBJECTS;
  }
  for (const s of subjects) {
    if (s.grades.length > MAX_GRADES_PER_SUBJECT) s.grades.length = MAX_GRADES_PER_SUBJECT;
    s.coefficient =
      s.coefficient !== null && s.coefficient >= 0 && s.coefficient <= 100 ? s.coefficient : null;
  }
  if (subjects.length === 0) warnings.push("Aucune matière n'a pu être lue dans ce document.");
  return { subjects, warnings };
}
