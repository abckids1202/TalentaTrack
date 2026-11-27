"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers";

export default function HomePage() {
  const router = useRouter();
  const { hydrated, profile } = useApp();

  useEffect(() => {
    if (!hydrated) return;
    router.replace(profile ? "/opportunities" : "/onboarding");
  }, [hydrated, profile, router]);

  return <div className="loading-screen" aria-label="Memuat TalentaTrack" />;
}
