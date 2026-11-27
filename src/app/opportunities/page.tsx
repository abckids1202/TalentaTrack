"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownWideNarrow, ArrowUpRight, Filter, Search, ShieldCheck } from "lucide-react";
import { OpportunityCard } from "@/components/opportunity-card";
import { useApp } from "@/components/providers";
import { CATEGORY_LABELS, INTEREST_OPTIONS } from "@/lib/fixtures";
import {
  compareByMatch,
  isOpportunityVisible,
  scoreOpportunity,
} from "@/lib/matching";
import { compareDeadlineInstants } from "@/lib/deadlines";
import type { Category, InterestTag } from "@/lib/types";

const categoryOptions: Array<{ value: Category | "all"; label: string }> = [
  { value: "all", label: "Semua kategori" },
  { value: "competition", label: CATEGORY_LABELS.competition },
  { value: "hackathon", label: CATEGORY_LABELS.hackathon },
  { value: "research", label: CATEGORY_LABELS.research },
  { value: "program", label: CATEGORY_LABELS.program },
  { value: "scholarship", label: CATEGORY_LABELS.scholarship },
];

export default function OpportunitiesPage() {
  const router = useRouter();
  const { hydrated, profile, opportunities } = useApp();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [interest, setInterest] = useState<InterestTag | "all">("all");
  const [sort, setSort] = useState<"match" | "deadline">("match");

  useEffect(() => {
    if (hydrated && !profile) router.replace("/onboarding");
  }, [hydrated, profile, router]);

  const visible = useMemo(() => {
    if (!profile) return [];
    const query = search.trim().toLocaleLowerCase("id-ID");
    const records = opportunities
      .filter((item) => isOpportunityVisible(item))
      .filter((item) => category === "all" || item.category === category)
      .filter((item) => interest === "all" || item.interestTags.includes(interest))
      .filter((item) => {
        if (!query) return true;
        return [
          item.title,
          item.organizerName,
          item.summary,
          item.description,
          ...item.interestTags,
        ]
          .join(" ")
          .toLocaleLowerCase("id-ID")
          .includes(query);
      })
      .map((opportunity) => ({
        opportunity,
        match: scoreOpportunity(opportunity, profile),
      }))
      .filter(({ match }) => match.eligible)
      .map(({ opportunity, match }) => ({ opportunity, score: match.score }));
    if (sort === "match") return records.sort(compareByMatch);
    return records.sort(
      (left, right) =>
        compareDeadlineInstants(
          left.opportunity.deadlineAt,
          right.opportunity.deadlineAt,
        ) || compareByMatch(left, right),
    );
  }, [opportunities, profile, category, interest, search, sort]);

  if (!hydrated || !profile) return <div className="loading-screen" />;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Dikurasi untukmu · Kelas {profile.grade}</p>
          <h1>Peluang yang layak kamu kejar.</h1>
          <p>
            Kompetisi, riset, dan program teknologi dengan informasi yang ditautkan ke sumber resminya.
          </p>
        </div>
        <div className="heading-actions">
          <Link className="button secondary small" href="/profile">
            Ubah preferensi
          </Link>
        </div>
      </div>

      <section className="dashboard-intro">
        <div>
          <h2>Mulai dari peluang yang cocok.</h2>
          <p>
            Skor kecocokan memakai minat, lokasi, dan pilihan formatmu. Syarat kelas menjadi
            penyaring utama; peluang daring dan nasional tetap terlihat.
          </p>
        </div>
        <div className="intro-stat">
          <span className="intro-stat-number">{visible.length}</span>
          <span className="intro-stat-copy">
            <strong>peluang terverifikasi</strong>
            <span>sesuai filter saat ini</span>
          </span>
        </div>
      </section>

      <div className="feed-toolbar">
        <div className="feed-toolbar-left">
          <span className="feed-count">
            <strong>{visible.length}</strong> peluang
          </span>
          <label className="select-wrap">
            <span className="sr-only">Kategori</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as Category | "all")}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="select-wrap sort-select">
            <span className="sr-only">Urutkan</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as "match" | "deadline")}
            >
              <option value="match">Terbaik untukmu</option>
              <option value="deadline">Tenggat terdekat</option>
            </select>
          </label>
        </div>
        <div className="feed-toolbar-right">
          <label className="search-box">
            <Search size={16} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari judul, penyelenggara..."
            />
          </label>
        </div>
      </div>

      <div className="filter-row" aria-label="Filter minat">
        <span className="filter-label">
          <Filter size={14} /> Minat:
        </span>
        <button
          className={interest === "all" ? "filter-chip active" : "filter-chip"}
          type="button"
          onClick={() => setInterest("all")}
        >
          Semua
        </button>
        {INTEREST_OPTIONS.filter((item) => profile.interests.includes(item.id)).map((item) => (
          <button
            className={interest === item.id ? "filter-chip active" : "filter-chip"}
            key={item.id}
            type="button"
            onClick={() => setInterest(item.id)}
          >
            {item.shortLabel}
          </button>
        ))}
      </div>

      {visible.length ? (
        <div className="opportunity-grid">
          {visible.map(({ opportunity }) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              profile={profile}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ArrowDownWideNarrow size={20} />
          </div>
          <h2>Belum ada yang cocok dengan filter ini.</h2>
          <p>
            Hapus sebagian filter atau ubah preferensi. Peluang nasional dan daring tetap tersedia
            saat lokasimu berbeda.
          </p>
          <button
            className="button secondary small"
            type="button"
            onClick={() => {
              setSearch("");
              setCategory("all");
              setInterest("all");
            }}
          >
            Reset filter
          </button>
        </div>
      )}

      <div className="section-heading">
        <div>
          <h2>Standar verifikasi</h2>
          <p>Setiap listing memuat sumber resmi dan tanggal pemeriksaan.</p>
        </div>
        <Link href="/admin" className="text-link">
          Lihat cara kurasi <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="verification-banner">
        <ShieldCheck size={18} />
        <span>
          <strong>Terhubung ke sumber resmi.</strong> Kami memeriksa syarat, tenggat, dan tautan
          pendaftaran secara manual sebelum listing diterbitkan.
        </span>
      </div>
    </>
  );
}
