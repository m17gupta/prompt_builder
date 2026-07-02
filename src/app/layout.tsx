import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/src/AppContext";
import RootLayoutClient from "./layout-client";

export const metadata: Metadata = {
  title: "EcoPrompt - Modular Prompt Ecosystem",
  description: "Nurture and manage your prompt libraries with version control and domain variables.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <RootLayoutClient>{children}</RootLayoutClient>
        </AppProvider>
      </body>
    </html>
  );
}
