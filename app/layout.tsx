import React from 'react';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "DnyanGPT - AI-Powered UPSC Preparation",
  description: "A comprehensive AI-powered preparation suite for UPSC aspirants. Master your UPSC journey with intelligent quizzes, essay grading, and personalized learning.",
  keywords: "UPSC, IAS, Civil Services, AI, Quiz, Essay Grading, UPSC Preparation",
  authors: [{ name: "DnyanGPT" }],
  openGraph: {
    title: "DnyanGPT - AI-Powered UPSC Preparation",
    description: "Master your UPSC journey with AI-powered quizzes, essay grading, and personalized learning.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
