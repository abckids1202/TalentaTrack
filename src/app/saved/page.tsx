"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Bookmark, CalendarClock, Compass, Mail } from "lucide-react";
import { OpportunityCard } from "@/components/opportunity-card";
import { useApp } from "@/components/providers";
import { isOpportunityVisible } from "@/lib/matching";

export default function SavedPage() {
  const router = useRouter();
  const { hydrated, profile, saved, opportunities } = useApp();
  const [showClosed, setShowClosed] = useState(false);

  useEffect(() => {
    if (hydrated && !profile) router.replace("/onboarding");
  }, [hydrated, profile, router]);

  const savedRecords = useMemo(() => {
    const records = saved
      .map((item) => ({
        save: item,
        opportunity: opportunities.find((opportunity) => opportunity.id === item.opportunityId),
      }))
      .filter(
        (item): item is typeof item & { opportunity: NonNullable<typeof item.opportunity> } =>
          Boolean(item.opportunity),
      )
      .sort((left, right) => right.save.savedAt.localeCompare(left.save.savedAt));
    return showClosed
      ? records
      : records.filter((item) => isOpportunityVisible(item.opportunity));
  }, [saved, opportunities, showClosed]);

  if (!hydrated || !profile) return <div className="loading-screen" />;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Ruang pribadi</p>
          <h1>Daftar yang kamu simpan.</h1>
          <p>Tempat kembali ke peluang pilihanmu dan memantau tenggatnya.</p>
        </div>
        <div className="heading-actions">
          <button
            className={showClosed ? "button secondary small" : "button ghost small"}
            type="button"
            onClick={() => setShowClosed((current) => !current)}
          >
            {showClosed ? "Sembunyikan yang tutup" : "Tampilkan semua"}
          </button>
        </div>
      </div>

      <div className="demo-notice">
        <Mail size={16} />
        <span>
          <strong>Pengingat email belum aktif di mode demo.</strong> Jadwal lokal di bawah ini
          membantu melihat kapan pengingat akan dikirim setelah akun email tersambung.
        </span>
      </div>

      {savedRecords.length ? (
        <>
          <div className="section-heading compact-heading">
            <div>
              <h2>{savedRecords.length} peluang tersimpan</h2>
              <p>Urut berdasarkan yang terakhir kamu simpan.</p>
            </div>
            <span className="source-date">
              <CalendarClock size={14} /> Pengingat default: 7 hari & 1 hari sebelumnya
            </span>
          </div>
          <div className="opportunity-grid">
            {savedRecords.map(({ opportunity }) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                profile={profile}
                savedView
              />
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Bookmark size={20} />
          </div>
          <h2>{showClosed ? "Belum ada peluang tersimpan." : "Belum ada peluang aktif tersimpan."}</h2>
          <p>
            Simpan peluang dari feed atau halaman detail. Pengingat untuk peluang dengan tenggat
            tetap akan muncul di daftar ini.
          </p>
          <Link className="button" href="/opportunities">
            Jelajahi peluang <Compass size={15} />
          </Link>
        </div>
      )}

      <div className="section-heading">
        <div>
          <h2>Ingatkan dirimu</h2>
          <p>Pengiriman otomatis akan aktif pada versi dengan akun.</p>
        </div>
      </div>
      <div className="reminder-summary panel">
        <div className="reminder-summary-icon"><Bell size={17} /></div>
        <div>
          <strong>Pengingat berjalan setelah tersambung ke email.</strong>
          <span>
            TalentaTrack akan mengirim pengingat 7 dan 1 hari sebelum tenggat, pukul 09.00{" "}
            {profile.timezone === "Asia/Makassar"
              ? "WITA"
              : profile.timezone === "Asia/Jayapura"
                ? "WIT"
                : "WIB"}.
            Ubah pengaturan pada detail peluang yang tersimpan.
          </span>
        </div>
      </div>
    </>
  );
}
