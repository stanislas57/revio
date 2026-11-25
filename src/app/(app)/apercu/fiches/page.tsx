import type { Metadata } from "next";
import { PreviewFiches } from "@/modules/preview/fiches";

export const metadata: Metadata = { title: "Aperçu : mes fiches", robots: { index: false, follow: false } };

export default function Page() {
  return <PreviewFiches />;
}
