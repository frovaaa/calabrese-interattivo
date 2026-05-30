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
      <body className="flex min-h-dvh flex-col text-zinc-900 antialiased">
        <div className="flex-1">{children}</div>
        <footer className="px-4 py-6 text-center text-sm text-zinc-500 sm:px-6 lg:px-8">
          Made with ❤️ by{" "}
          <a
            href="https://github.com/frovaaa"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition hover:text-zinc-950"
          >
            frovaaa
          </a>
        </footer>
      </body>
    </html>
  );
}
