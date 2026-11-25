import type { Metadata } from "next";
import { PreviewFocus } from "@/modules/preview/focus";

export const metadata: Metadata = { title: "Aperçu : focus à deux", robots: { index: false, follow: false } };

export default function Page() {
  return <PreviewFocus />;
}
