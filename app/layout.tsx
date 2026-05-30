import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calabrese Interattivo",
  description: "Collaborative planning board for shared date selection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" data-scroll-behavior="smooth">
      <body className="min-h-dvh text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
