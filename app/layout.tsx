import type { Metadata } from "next";
import { Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
const deva = Noto_Sans_Devanagari({ subsets: ["devanagari", "latin"], weight: ["500", "600", "700", "800"], variable: "--font-deva", display: "swap" });
export const metadata: Metadata = {
  title: "Digital Shradhanjali",
  description: "Personalized Hindi Shradhanjali card maker",
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="hi" className={deva.variable}><body>{children}</body></html>;
}
