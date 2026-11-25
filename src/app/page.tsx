import type { Metadata } from "next";
import { CtaBand } from "@/modules/landing/components/cta-band";
import { Faq } from "@/modules/landing/components/faq";
import { Hero } from "@/modules/landing/components/hero";
import { Offer } from "@/modules/landing/components/offer";
import { Pillars } from "@/modules/landing/components/pillars";
import { Preview } from "@/modules/landing/components/preview";
import { SiteFooter } from "@/modules/landing/components/site-footer";
import { SiteHeader } from "@/modules/landing/components/site-header";
import { landingSerif } from "@/modules/landing/fonts";
import "@/modules/landing/landing.css";

export const metadata: Metadata = {
  description:
    "Revio aide les étudiants à suivre leurs notes, organiser leurs révisions et rester motivés avec leurs amis. Version de démonstration.",
};

export default function LandingPage() {
  return (
    <div id="top" className={`landing-root ${landingSerif.variable}`}>
      <SiteHeader />
      <main>
        <Hero />
        <Pillars />
        <Preview />
        <Offer />
        <Faq />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  );
}
