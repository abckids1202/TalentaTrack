import type { Metadata } from "next";
import { AppFrame } from "@/components/app-frame";
import { AppProvider } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentaTrack — Peluang terverifikasi untuk siswa SMA",
  description:
    "Temukan kompetisi, riset, dan program teknologi yang relevan dan terverifikasi untuk siswa SMA Indonesia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <AppProvider>
          <AppFrame>{children}</AppFrame>
        </AppProvider>
      </body>
    </html>
  );
}
