import type { Metadata } from "next";
import { PreviewAccueil } from "@/modules/preview/accueil";

export const metadata: Metadata = {
  title: "Aperçu : accueil de révision",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PreviewAccueil />;
}
