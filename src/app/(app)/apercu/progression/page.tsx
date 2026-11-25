import type { Metadata } from "next";
import { PreviewProgression } from "@/modules/preview/progression";

export const metadata: Metadata = { title: "Aperçu : progression", robots: { index: false, follow: false } };

export default function Page() {
  return <PreviewProgression />;
}
