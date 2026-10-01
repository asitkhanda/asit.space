import type { Metadata } from "next";
import { Caveat, Libre_Baskerville } from "next/font/google";
import { InterDisplay } from "next-font-inter";
import { AgentationToolbar } from "@/components/dev/AgentationToolbar";
import { SiteChromeProvider } from "@/components/nav/SiteChromeContext";
import { SiteFloatingNav } from "@/components/nav/SiteFloatingNav";
import "./globals.css";

const display = InterDisplay;

const postcardScript = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const postcardSerif = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre-baskerville",
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
      className={`${display.variable} ${postcardScript.variable} ${postcardSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stage text-ink">
        <SiteChromeProvider>
          <SiteFloatingNav />
          {children}
        </SiteChromeProvider>
        <AgentationToolbar />
      </body>
    </html>
  );
}
