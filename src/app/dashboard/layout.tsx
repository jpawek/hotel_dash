import type { Metadata } from "next";
import { Inter } from "next/font/google";
import React from 'react';
import "@/app/ui/global.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hotel Dashboard"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <h1>DASHBOARD TEST</h1>
        {children}
      </body>
    </html>
  );
}
