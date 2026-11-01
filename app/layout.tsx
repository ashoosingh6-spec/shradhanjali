import type { Metadata } from "next";
// Fonts are bundled from npm (@fontsource) - no font files or Google requests needed.
import "@fontsource/noto-serif-devanagari/700.css";
import "@fontsource/noto-serif-devanagari/800.css";
import "@fontsource/noto-sans-devanagari/400.css";
import "@fontsource/noto-sans-devanagari/500.css";
import "@fontsource/mukta/600.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Digital Shradhanjali",
  description: "Personalized Hindi Shradhanjali card maker",
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="hi"><body>{children}</body></html>;
}
