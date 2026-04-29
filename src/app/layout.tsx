import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { MotionProvider } from "@/components/providers/motion-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Double Check",
  description: "Precision-driven dining for the uncompromising.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col tracking-tight">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
