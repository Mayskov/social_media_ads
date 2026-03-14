import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FB Ad Creator",
  description: "AI-powered Facebook ad creation tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
