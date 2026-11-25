"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import type { StudyStats } from "../../contracts";

/**
 * The charts (Recharts, about 100 kB of JavaScript) are loaded only when they come near the screen:
 * they sit below the figures and the heatmap, so most visits to the page never need them at first.
 * The placeholder keeps the height of a chart so nothing jumps when it appears. The numbers are the
 * same: only the moment the code loads changes.
 */
const PLACEHOLDER_HEIGHT = "min-h-[22rem]";

function Placeholder() {
  return (
    <div
      aria-hidden
      className={`${PLACEHOLDER_HEIGHT} rounded-xl border bg-muted/40 motion-safe:animate-pulse`}
    />
  );
}

/**
 * Renders `children` once the placeholder is within 100 px of the viewport (at once without
 * IntersectionObserver). The first render is the placeholder on the server and in the browser, so
 * hydration always matches.
 */
const noop = () => () => {};
/** True in a browser without IntersectionObserver; false on the server, so hydration matches. */
const lacksObserver = () => typeof IntersectionObserver === "undefined";

function OnceNearScreen({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const unsupported = useSyncExternalStore(noop, lacksObserver, () => false);

  useEffect(() => {
    const node = ref.current;
    if (visible || unsupported || !node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, unsupported]);

  return <div ref={ref}>{visible || unsupported ? children : <Placeholder />}</div>;
}

const load = <P extends object>(pick: (m: typeof import("./charts")) => ComponentType<P>) =>
  dynamic(() => import("./charts").then((m) => pick(m)), { ssr: false, loading: Placeholder });

const DailyMinutes = load((m) => m.DailyMinutesChart);
const WeeklyMinutes = load((m) => m.WeeklyMinutesChart);
const DailyXp = load((m) => m.DailyXpChart);
const SubjectMinutes = load((m) => m.SubjectMinutesChart);

type Daily = StudyStats["daily"];

export function LazyDailyMinutesChart({ daily }: { daily: Daily }) {
  return (
    <OnceNearScreen>
      <DailyMinutes daily={daily} />
    </OnceNearScreen>
  );
}
export function LazyWeeklyMinutesChart({ daily }: { daily: Daily }) {
  return (
    <OnceNearScreen>
      <WeeklyMinutes daily={daily} />
    </OnceNearScreen>
  );
}
export function LazyDailyXpChart({ daily }: { daily: Daily }) {
  return (
    <OnceNearScreen>
      <DailyXp daily={daily} />
    </OnceNearScreen>
  );
}
export function LazySubjectMinutesChart({ bySubject }: { bySubject: StudyStats["bySubject"] }) {
  return (
    <OnceNearScreen>
      <SubjectMinutes bySubject={bySubject} />
    </OnceNearScreen>
  );
}
