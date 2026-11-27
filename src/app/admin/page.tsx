"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Archive,
  Check,
  CircleAlert,
  ClipboardCheck,
  FilePlus2,
  Pencil,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { isVerificationFresh } from "@/lib/matching";
import { formatDeadlineAt, isDeadlineFuture } from "@/lib/deadlines";
import type { Opportunity } from "@/lib/types";

export default function AdminPage() {
  const {
    hydrated,
    opportunities,
    saveOpportunity,
    resetDemo,
  } = useApp();
  const [filter, setFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [confirmReset, setConfirmReset] = useState(false);

  const published = opportunities.filter((item) => item.publicationStatus === "published");
  const drafts = opportunities.filter((item) => item.publicationStatus === "draft");
  const stale = published.filter((item) => !isVerificationFresh(item));
  const rows = useMemo(
    () =>
      opportunities
        .filter((item) => filter === "all" || item.publicationStatus === filter)
        .sort((a, b) => {
          const rank = { draft: 0, published: 1, archived: 2 };
          return rank[a.publicationStatus] - rank[b.publicationStatus] ||
            a.title.localeCompare(b.title, "id");
        }),
    [opportunities, filter],
  );

  if (!hydrated) return <div className="loading-screen" />;

  const archiveOpportunity = (opportunity: Opportunity) => {
    saveOpportunity({
      ...opportunity,
      publicationStatus: "archived",
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  };

  const verifyAndPublish = (opportunity: Opportunity) => {
    const complete =
      opportunity.title.trim() &&
      opportunity.organizerName.trim() &&
      opportunity.summary.trim() &&
      opportunity.description.trim() &&
      opportunity.officialSourceUrl.startsWith("https://") &&
      opportunity.interestTags.length &&
      opportunity.eligibleGrades.length &&
      opportunity.participationModes.length &&
      opportunity.costNote.trim() &&
      opportunity.eligibilityNotes.trim() &&
      opportunity.verificationNotes.trim() &&
      opportunity.deliveryMode &&
      opportunity.locationScope &&
      (opportunity.locationScope !== "province" || opportunity.province) &&
      (opportunity.locationScope !== "city" ||
        (opportunity.province && opportunity.city)) &&
      (opportunity.deadlineKind !== "fixed" ||
        isDeadlineFuture(opportunity.deadlineAt));
    if (!complete) {
      window.alert("Lengkapi eligibility, format, lokasi, sumber, biaya, dan tenggat aktif sebelum menerbitkan.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    saveOpportunity({
      ...opportunity,
      publicationStatus: "published",
      verifiedAt: today,
      verifiedBy: "Admin demo",
      updatedAt: today,
    });
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Ruang kurasi</p>
          <h1>Panel admin.</h1>
          <p>Kelola listing, pastikan sumbernya, dan terbitkan peluang yang siap dibuka siswa.</p>
        </div>
        <div className="heading-actions">
          <Link className="button" href="/admin/opportunities/new">
            <FilePlus2 size={15} /> Tambah peluang
          </Link>
        </div>
      </div>

      <div className="admin-demo-strip">
        <span>
          <strong>Mode admin lokal.</strong> Data hanya tersimpan di browser ini. Admin belum
          dilindungi login; jangan publikasikan demo ini sebagai panel produksi.
        </span>
        {confirmReset ? (
          <span className="reset-confirm">
            <button
              className="table-action reset-action"
              type="button"
              onClick={() => {
                resetDemo();
                setConfirmReset(false);
              }}
            >
              Ya, reset data
            </button>
            <button
              className="table-action"
              type="button"
              onClick={() => setConfirmReset(false)}
            >
              Batal
            </button>
          </span>
        ) : (
          <button
            className="table-action"
            type="button"
            onClick={() => setConfirmReset(true)}
          >
            <RotateCcw size={13} /> Reset demo
          </button>
        )}
      </div>

      <div className="admin-stats">
        <StatCard label="Listing diterbitkan" value={published.length} foot="Termasuk perlu tinjau" />
        <StatCard label="Draft menunggu" value={drafts.length} foot="Belum tampil di feed" />
        <StatCard label="Perlu verifikasi ulang" value={stale.length} foot="Lebih dari 30 hari" />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Daftar peluang</h2>
            <p>Setiap listing terbit harus punya sumber dan tanggal verifikasi.</p>
          </div>
          <label className="select-wrap">
            <span className="sr-only">Filter status</span>
            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as "all" | "draft" | "published" | "archived")
              }
            >
              <option value="all">Semua status</option>
              <option value="draft">Draft</option>
              <option value="published">Diterbitkan</option>
              <option value="archived">Arsip</option>
            </select>
          </label>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Peluang</th>
                <th>Status</th>
                <th>Verifikasi</th>
                <th>Tenggat</th>
                <th><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((opportunity) => {
                const fresh = isVerificationFresh(opportunity);
                return (
                  <tr key={opportunity.id}>
                    <td className="listing-cell">
                      <strong>{opportunity.title}</strong>
                      <span>{opportunity.organizerName}</span>
                    </td>
                    <td>
                      <span className={"status-pill " + opportunity.publicationStatus}>
                        {opportunity.publicationStatus === "published"
                          ? "Diterbitkan"
                          : opportunity.publicationStatus === "draft"
                            ? "Draft"
                            : "Arsip"}
                      </span>
                    </td>
                    <td>
                      <span className={fresh ? "status-pill verified" : "status-pill"}>
                        {fresh ? <Check size={12} /> : <CircleAlert size={12} />}
                        {fresh
                          ? "Diperiksa " +
                            new Intl.DateTimeFormat("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }).format(new Date(opportunity.verifiedAt + "T12:00:00"))
                          : opportunity.verifiedAt
                            ? "Perlu cek"
                            : "Belum"}
                      </span>
                    </td>
                    <td>
                      {opportunity.deadlineKind === "fixed"
                        ? opportunity.deadlineAt
                          ? formatDeadlineAt(opportunity.deadlineAt, opportunity.deadlineTimezone)
                          : "Tenggat belum ditentukan"
                        : opportunity.deadlineKind === "rolling"
                          ? "Bergulir"
                          : "Tanpa tenggat"}
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <Link
                          className="table-action"
                          href={"/admin/opportunities/" + opportunity.id}
                        >
                          <Pencil size={13} /> Edit
                        </Link>
                        {opportunity.publicationStatus === "draft" && (
                          <button
                            className="table-action"
                            type="button"
                            onClick={() => verifyAndPublish(opportunity)}
                          >
                            <ClipboardCheck size={13} /> Terbitkan
                          </button>
                        )}
                        {opportunity.publicationStatus !== "archived" && (
                          <button
                            className="table-action archive-action"
                            type="button"
                            aria-label={"Arsipkan " + opportunity.title}
                            title="Arsipkan"
                            onClick={() => archiveOpportunity(opportunity)}
                          >
                            <Archive size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr><td colSpan={5} className="admin-empty">Tidak ada listing di status ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="verification-guidance">
        <div className="verification-guidance-icon"><ShieldCheck size={17} /></div>
        <div>
          <strong>Sebelum menerbitkan</strong>
          <span>
            Cocokkan syarat kelas, format peserta, kota/provinsi, tenggat, biaya, dan tautan
            pendaftaran dengan sumber resmi. Perubahan penting membuat status kembali menjadi draft.
          </span>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, foot }: { label: string; value: number; foot: string }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value.toString().padStart(2, "0")}</div>
      <div className="stat-card-foot">{foot}</div>
    </div>
  );
}
