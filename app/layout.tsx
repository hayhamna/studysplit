import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "StudySplit — Fair task splits for group projects",
  description:
    "Turn any assignment into a fair task split for your group, and rebalance instantly when someone drops out.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-paper text-ink font-body antialiased">
        {children}
      </body>
    </html>
  );
}
