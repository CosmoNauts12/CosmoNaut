import type { Metadata } from "next";
import { Geist, Geist_Mono, Allura } from "next/font/google"; // Changed Dancing_Script to Allura
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import { ThemeProvider } from "./components/ThemeContext";
import { SettingsProvider } from "./components/SettingsProvider";
import SettingsModal from "./components/SettingsModal";

// Fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const allura = Allura({
  variable: "--font-cursive",
  subsets: ["latin"],
  weight: "400", // Allura is single weight
});

// Metadata
export const metadata: Metadata = {
  title: "Space Auth System",
  description: "Modern authentication system with Firebase",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${allura.variable} antialiased min-h-screen`}
      >
        <SettingsProvider>
          <AuthProvider>
            <ThemeProvider>
              {children}
              <SettingsModal />
            </ThemeProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
