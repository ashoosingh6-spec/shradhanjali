import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Digital Shradhanjali",
  description: "Personalized Hindi Shradhanjali card maker",
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="hi"><body>{children}</body></html>;
}
