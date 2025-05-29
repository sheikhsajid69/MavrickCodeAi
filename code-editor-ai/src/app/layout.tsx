import type { Metadata } from "next";
import "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";

export const metadata: Metadata = {
  title: "Code Editor AI",
  description: "A modern web-based code editor with AI integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <ClientBody>{children}</ClientBody>
    </html>
  );
}
