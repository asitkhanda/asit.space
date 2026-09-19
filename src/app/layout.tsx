import type { Metadata } from "next";
import { InterDisplay } from "next-font-inter";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const display = InterDisplay;

const pixel = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "asit.space",
  description: "A personal timeline of events, outings, and moments.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${pixel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stage text-ink">
        {children}
      </body>
    </html>
  );
}
