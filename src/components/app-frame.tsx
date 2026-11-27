"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  ChevronDown,
  Compass,
  GraduationCap,
  LifeBuoy,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useApp } from "./providers";

const navItems = [
  { href: "/opportunities", label: "Peluang", icon: Compass },
  { href: "/saved", label: "Tersimpan", icon: Bookmark },
  { href: "/admin", label: "Panel admin", icon: ShieldCheck },
];

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile, saved } = useApp();
  const onboarding = pathname === "/onboarding";

  if (onboarding) {
    return (
      <div className="onboarding-frame">
        <div className="onboarding-brand">
          <Brand />
          <span>Temukan peluang yang tepat untukmu.</span>
        </div>
        <main>{children}</main>
        <p className="onboarding-footnote">Dikurasi dengan sumber resmi.</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <Brand />
          <div className="product-tagline">Peluang untuk talenta muda</div>
        </div>

        <div className="nav-label">RUANG KERJA</div>
        <nav className="main-nav" aria-label="Navigasi utama">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href === "/opportunities" && pathname.startsWith("/opportunities/"));
            return (
              <Link
                key={href}
                href={href}
                className={active ? "nav-link active" : "nav-link"}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
                {href === "/saved" && <span className="nav-count">{saved.length || ""}</span>}
                {href === "/admin" && <span className="demo-chip">Demo</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-rule" />
        <div className="nav-label">PREFERENSI</div>
        <Link
          href="/profile"
          className={pathname === "/profile" ? "nav-link active" : "nav-link"}
        >
          <Settings2 size={18} strokeWidth={1.8} />
          <span>Profil siswa</span>
        </Link>

        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <div className="sidebar-note-icon">
            <LifeBuoy size={17} />
          </div>
          <div>
            <strong>Temukan yang tepercaya</strong>
            <span>Setiap peluang punya sumber resmi.</span>
          </div>
        </div>
        <Link href="/profile" className="profile-switcher">
          <div className="avatar-mark">{profile?.grade ?? "S"}</div>
          <div className="profile-switcher-copy">
            <strong>{profile ? "Profil siswa" : "Atur profilmu"}</strong>
            <span>
              {profile
                ? "Kelas " + profile.grade + " · " + (profile.province || "Indonesia")
                : "Sesuaikan peluang"}
            </span>
          </div>
          <ChevronDown size={16} />
        </Link>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand />
          </div>
          <div className="topbar-context">
            <span className="topbar-overline">TALENTATRACK / {sectionName(pathname)}</span>
            <span className="topbar-caption">Peluang terkurasi untuk langkah berikutnya</span>
          </div>
          <div className="topbar-right">
            <span className="demo-indicator">
              <span className="demo-dot" />
              Mode demo
            </span>
            <Link href="/profile" aria-label="Buka profil">
              <div className="top-avatar">{profile?.grade ?? <GraduationCap size={16} />}</div>
            </Link>
          </div>
        </header>
        <main className="main-content">{children}</main>
        <footer className="page-footer">
          <span>TalentaTrack · Sumber resmi, langkah yang lebih terarah.</span>
          <span>
            <Sparkles size={13} /> Dikurasi untuk siswa SMA Indonesia
          </span>
        </footer>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/" className="brand-lockup" aria-label="TalentaTrack beranda">
      <span className="brand-mark">
        <span />
        <span />
        <span />
      </span>
      <span className="brand-word">talenta<span>track</span></span>
    </Link>
  );
}

function sectionName(pathname: string) {
  if (pathname.startsWith("/admin")) return "ADMIN";
  if (pathname.startsWith("/saved")) return "TERSIMPAN";
  if (pathname.startsWith("/profile")) return "PROFIL";
  if (pathname.startsWith("/opportunities/")) return "DETAIL PELUANG";
  return "PELUANG";
}
