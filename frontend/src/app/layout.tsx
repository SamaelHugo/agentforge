import type { Metadata } from "next";
import { EB_Garamond, Inter_Tight, JetBrains_Mono } from "next/font/google";

import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const helvetica = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-helvetica",
  display: "swap",
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgentForge — AI Agent Platform",
  description:
    "Build AI agents, give them tools and knowledge, and watch them reason in real time. Custom ReAct engine, RAG pipeline, and live execution tracing.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${helvetica.variable} ${garamond.variable} ${mono.variable} font-sans antialiased`}
      >
        <div className="flex min-h-screen flex-col md:flex-row">
          <Sidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
