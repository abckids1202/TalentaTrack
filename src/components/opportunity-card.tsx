"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Check,
  CircleAlert,
  Clock3,
  MapPin,
  Users,
} from "lucide-react";
import { CATEGORY_LABELS, TAG_LABELS } from "@/lib/fixtures";
import { isVerificationFresh, scoreOpportunity } from "@/lib/matching";
import { formatDeadlineAt } from "@/lib/deadlines";
import type { Opportunity, StudentProfile } from "@/lib/types";
import { useApp } from "./providers";

export function OpportunityCard({
  opportunity,
  profile,
  savedView = false,
}: {
  opportunity: Opportunity;
  profile: StudentProfile;
  savedView?: boolean;
}) {
  const { saved, toggleSaved, setReminder } = useApp();
  const isSaved = saved.some((item) => item.opportunityId === opportunity.id);
  const savedItem = saved.find((item) => item.opportunityId === opportunity.id);
  const match = scoreOpportunity(opportunity, profile);
  const verificationFresh = isVerificationFresh(opportunity);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setNow(Date.now()), 0);
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  const remainingUntilDeadline = opportunity.deadlineAt
    ? new Date(opportunity.deadlineAt).getTime() - now
    : null;
  const isClosingSoon =
    remainingUntilDeadline !== null &&
    remainingUntilDeadline >= 0 &&
    remainingUntilDeadline <= 7 * 86_400_000;

  return (
    <article className="opportunity-card">
      <div className="card-topline">
        <div className="card-tags">
          <span className="category-label">{CATEGORY_LABELS[opportunity.category]}</span>
          <span className={verificationFresh ? "verified-label" : "verified-label stale"}>
            {verificationFresh ? (
              <Check size={12} strokeWidth={2.5} />
            ) : (
              <CircleAlert size={12} />
            )}
            {verificationFresh ? "Terverifikasi" : "Perlu cek ulang"}
          </span>
        </div>
        <button
          type="button"
          className={isSaved ? "icon-button saved" : "icon-button"}
          aria-label={isSaved ? "Hapus dari tersimpan" : "Simpan peluang"}
          title={isSaved ? "Hapus dari tersimpan" : "Simpan peluang"}
          onClick={() => toggleSaved(opportunity.id)}
        >
          <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      <Link href={"/opportunities/" + opportunity.slug} className="card-title-link">
        <h2>{opportunity.title}</h2>
      </Link>
      <p className="card-organizer">{opportunity.organizerName}</p>
      <p className="card-summary">{opportunity.summary}</p>

      <div className="card-meta-row">
        <span className={isClosingSoon ? "deadline-meta urgent" : "deadline-meta"}>
          <CalendarDays size={15} />
          {opportunity.deadlineKind === "fixed"
            ? opportunity.deadlineAt
              ? "Tutup " + formatDeadlineAt(opportunity.deadlineAt, opportunity.deadlineTimezone)
              : "Tenggat belum dikonfirmasi"
            : opportunity.deadlineKind === "rolling"
              ? "Pendaftaran bergulir"
              : "Tanpa tenggat tetap"}
        </span>
        <span className="location-meta">
          <MapPin size={15} />
          {opportunity.locationScope === "national"
            ? "Nasional"
            : opportunity.city || "Daring"}
        </span>
        <span className="mode-meta">
          <Users size={15} />
          {opportunity.participationModes.includes("individual") &&
          opportunity.participationModes.includes("team")
            ? "Individu / tim"
            : opportunity.participationModes.includes("individual")
              ? "Individu"
              : "Tim"}
        </span>
      </div>

      {savedView && (
        <div className="saved-reminder-note">
          <Clock3 size={14} />
          {savedItem?.reminderEnabled
            ? "Pengingat lokal aktif · email belum tersedia di demo"
            : "Pengingat lokal dijeda"}
          <label className="saved-reminder-toggle">
            <input
              type="checkbox"
              checked={savedItem?.reminderEnabled ?? false}
              aria-label="Aktifkan pengingat lokal"
              onChange={(event) => setReminder(opportunity.id, event.target.checked)}
            />
            <span>{savedItem?.reminderEnabled ? "Aktif" : "Jeda"}</span>
          </label>
        </div>
      )}

      <div className="card-bottom">
        <div className="match-line">
          <span className="match-score">{match.score}</span>
          <span className="match-label">kecocokan</span>
          <span className="match-separator">·</span>
          <span className="match-reason">
            {opportunity.interestTags
              .slice(0, 2)
              .map((tag) => TAG_LABELS[tag])
              .join(" · ")}
          </span>
        </div>
        <Link href={"/opportunities/" + opportunity.slug} className="text-link">
          Lihat detail <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  );
}
