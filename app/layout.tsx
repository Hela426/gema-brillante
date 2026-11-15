import type { Metadata } from "next";
import { Cormorant_Garamond, Lora } from "next/font/google";
import Providers from "@/components/providers";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora",
});

export const metadata: Metadata = {
  title: "Academia Gema Brillante",
  description:
    "Entre pétalos, promesas y secretos, solo una gema llevará la corona.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${cormorant.variable} ${lora.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
