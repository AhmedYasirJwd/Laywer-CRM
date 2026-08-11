import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "LexCase | Legal Case Management",
  description: "Case, hearing, and task management for lawyers and law firms.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f6f8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-ink">
        <AppShell>{children}</AppShell>
        <Analytics />
      </body>
    </html>
  );
}
