"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Bookmark,
  CalendarDays,
  Check,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { CATEGORY_LABELS, TAG_LABELS } from "@/lib/fixtures";
import { isOpportunityVisible, scoreOpportunity } from "@/lib/matching";
import { getReminderPreviews } from "@/lib/reminders";
import { formatDeadlineAt } from "@/lib/deadlines";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function OpportunityDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const { hydrated, profile, opportunities, saved, toggleSaved, setReminder } = useApp();
  const opportunity = opportunities.find((item) => item.slug === slug);
  const savedItem = saved.find((item) => item.opportunityId === opportunity?.id);
  const match =
    opportunity && profile ? scoreOpportunity(opportunity, profile) : null;
  const isVisible = opportunity ? isOpportunityVisible(opportunity) : false;

  useEffect(() => {
    if (hydrated && !profile) router.replace("/onboarding");
  }, [hydrated, profile, router]);

  if (!hydrated || !profile) return <div className="loading-screen" />;
  if (!opportunity || !isVisible) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <ShieldCheck size={20} />
        </div>
        <h2>Peluang ini tidak tersedia di feed.</h2>
        <p>Listing hanya ditampilkan jika masih terbit dan verifikasinya masih berlaku.</p>
        <Link className="button secondary small" href="/opportunities">
          Kembali ke peluang
        </Link>
      </div>
    );
  }

  const reminders = getReminderPreviews(
    opportunity,
    profile.timezone,
    savedItem ? new Date(savedItem.savedAt) : new Date(),
  );
  const deadlineText =
    opportunity.deadlineKind === "fixed" && opportunity.deadlineAt
      ? formatDeadlineAt(opportunity.deadlineAt, opportunity.deadlineTimezone)
      : opportunity.deadlineKind === "fixed"
        ? "Tenggat belum dikonfirmasi"
      : opportunity.deadlineKind === "rolling"
        ? "Pendaftaran bergulir"
        : "Tidak ada tenggat tetap";
  const participationText =
    opportunity.participationModes.length === 2
      ? "Individu atau tim"
      : opportunity.participationModes[0] === "individual"
        ? "Individu"
        : "Tim";

  return (
    <>
      <Link href="/opportunities" className="detail-back">
        <ArrowLeft size={15} /> Kembali ke daftar peluang
      </Link>

      <div className="detail-layout">
        <article className="detail-main">
          <div className="card-tags">
            <span className="category-label">{CATEGORY_LABELS[opportunity.category]}</span>
            <span className="verified-label">
              <Check size={12} strokeWidth={2.5} /> Terverifikasi
            </span>
          </div>
          <h1 className="detail-title">{opportunity.title}</h1>
          <p className="detail-organizer">{opportunity.organizerName}</p>
          <div className="verification-note">
            <ShieldCheck size={14} /> Diperiksa {dateFormatter.format(new Date(opportunity.verifiedAt + "T12:00:00"))}
            <span>·</span>
            Skor kecocokan {match?.score ?? 0}/100
          </div>

          <p className="detail-lede">{opportunity.summary}</p>
          <div className="detail-copy">{opportunity.description}</div>

          <section className="detail-section">
            <h2>Siapa yang bisa ikut?</h2>
            <p>
              Siswa kelas {opportunity.eligibleGrades.join(", ")}. {opportunity.eligibilityNotes}
            </p>
          </section>

          <section className="detail-section">
            <h2>Bidang yang relevan</h2>
            <div className="detail-tag-row">
              {opportunity.interestTags.map((tag) => (
                <span className="detail-tag" key={tag}>{TAG_LABELS[tag]}</span>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <h2>Catatan penting</h2>
            <p>
              Informasi di TalentaTrack diringkas dari sumber resmi. Periksa kembali panduan
              penyelenggara untuk aturan lengkap, berkas yang dibutuhkan, dan perubahan jadwal.
            </p>
          </section>
        </article>

        <aside className="detail-aside">
          <div className="detail-aside-card">
            <p className="aside-kicker">Batas pendaftaran</p>
            <p className="aside-deadline">{deadlineText}</p>
            <dl className="aside-data">
              <div>
                <CalendarDays size={16} />
                <span>
                  <dt>Dibuka</dt>
                  <dd>
                    {opportunity.applicationOpenDate
                      ? dateFormatter.format(new Date(opportunity.applicationOpenDate + "T12:00:00"))
                      : "Lihat sumber resmi"}
                  </dd>
                </span>
              </div>
              <div>
                <MapPin size={16} />
                <span>
                  <dt>Lokasi</dt>
                  <dd>
                    {opportunity.locationScope === "national"
                      ? "Nasional"
                      : [opportunity.city, opportunity.province].filter(Boolean).join(", ") ||
                        "Periksa sumber resmi"}
                  </dd>
                </span>
              </div>
              <div>
                <Users size={16} />
                <span>
                  <dt>Format peserta</dt>
                  <dd>{participationText}</dd>
                </span>
              </div>
              <div>
                <span className="aside-icon-spacer" />
                <span>
                  <dt>Biaya</dt>
                  <dd>{opportunity.costNote || "Periksa sumber resmi"}</dd>
                </span>
              </div>
            </dl>

            <div className="aside-actions">
              <a
                className="button"
                href={opportunity.applicationUrl || opportunity.officialSourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Buka laman resmi <ExternalLink size={15} />
              </a>
              <button
                className="button secondary"
                type="button"
                onClick={() => toggleSaved(opportunity.id)}
              >
                <Bookmark size={15} fill={savedItem ? "currentColor" : "none"} />
                {savedItem ? "Tersimpan" : "Simpan peluang"}
              </button>
            </div>
          </div>

          <div className="detail-aside-card">
            <p className="aside-kicker">Pengingat tenggat</p>
            {savedItem ? (
              <>
                <label className="reminder-toggle">
                  <input
                    type="checkbox"
                    checked={savedItem.reminderEnabled}
                    onChange={(event) => setReminder(opportunity.id, event.target.checked)}
                  />
                  <span>
                    <strong>Pengingat aktif</strong>
                    <small>Email menyusul setelah akun tersambung.</small>
                  </span>
                </label>
                {savedItem.reminderEnabled && reminders.length > 0 && (
                  <ul className="reminder-list">
                    {reminders.map((reminder) => (
                      <li key={reminder.offsetDays}>
                        <Bell size={13} />
                        {reminder.offsetDays} hari sebelumnya ·{" "}
                        {new Intl.DateTimeFormat("id-ID", {
                          day: "numeric",
                          month: "short",
                        }).format(reminder.sendAt)}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="reminder-disclaimer">
                  Ini pratinjau lokal, belum mengirim email.
                </p>
              </>
            ) : (
              <p className="reminder-prompt">
                Simpan peluang ini untuk mengatur pengingat tenggat.
              </p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
