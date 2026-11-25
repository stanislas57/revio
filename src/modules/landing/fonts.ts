import { Instrument_Serif } from "next/font/google";

/**
 * Serif of the landing headings (the second line is set in italic). Loaded here, for the landing only,
 * so the shared root layout and the app pages do not download it.
 */
export const landingSerif = Instrument_Serif({
  variable: "--font-landing-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});
