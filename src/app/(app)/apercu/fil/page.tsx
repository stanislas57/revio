import type { Metadata } from "next";
import { PreviewFil } from "@/modules/preview/fil";

export const metadata: Metadata = { title: "Aperçu : fil", robots: { index: false, follow: false } };

export default function Page() {
  return <PreviewFil />;
}
