"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Compass, GraduationCap, MapPin, Users } from "lucide-react";
import { INTEREST_OPTIONS, PROVINCES } from "@/lib/fixtures";
import type { Grade, InterestTag, StudentProfile } from "@/lib/types";
import { useApp } from "@/components/providers";

const timezones = [
  { value: "Asia/Jakarta", label: "WIB" },
  { value: "Asia/Makassar", label: "WITA" },
  { value: "Asia/Jayapura", label: "WIT" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { hydrated, profile, setProfile } = useApp();
  const [grade, setGrade] = useState<Grade | null>(null);
  const [interests, setInterests] = useState<InterestTag[]>([]);
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [preference, setPreference] = useState<StudentProfile["participationPreference"]>("either");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [error, setError] = useState("");

  useEffect(() => {
    if (hydrated && profile) router.replace("/opportunities");
  }, [hydrated, profile, router]);

  const toggleInterest = (tag: InterestTag) => {
    setInterests((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : current.length < 5
          ? [...current, tag]
          : current,
    );
    setError("");
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!grade || interests.length === 0 || !province.trim()) {
      setError("Lengkapi kelas, minimal satu minat, dan provinsi agar rekomendasi lebih tepat.");
      return;
    }
    setProfile({
      grade,
      interests,
      province: province.trim(),
      city: city.trim(),
      participationPreference: preference,
      timezone,
    });
    router.push("/opportunities");
  };

  if (!hydrated) return <div className="loading-screen" />;

  return (
    <section className="onboarding-card">
      <div className="onboarding-step">01 · Profil siswa</div>
      <h1 className="onboarding-title">Mulai dari minatmu.</h1>
      <p className="onboarding-description">
        Pilih beberapa hal tentang dirimu. TalentaTrack akan mengurutkan peluang yang paling relevan.
      </p>

      <form onSubmit={submit}>
        <div className="form-section">
          <label className="form-label">Kamu sekarang duduk di kelas berapa?</label>
          <div className="choice-row" role="group" aria-label="Pilih kelas">
            {([10, 11, 12] as const).map((item) => (
              <button
                className={grade === item ? "choice-button selected" : "choice-button"}
                key={item}
                type="button"
                aria-pressed={grade === item}
                onClick={() => {
                  setGrade(item);
                  setError("");
                }}
              >
                <GraduationCap size={15} /> Kelas {item}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label className="form-label">Bidang yang ingin kamu eksplor</label>
          <div className="interest-grid" role="group" aria-label="Pilih minat">
            {INTEREST_OPTIONS.map((item) => {
              const selected = interests.includes(item.id);
              return (
                <button
                  className={selected ? "interest-choice selected" : "interest-choice"}
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleInterest(item.id)}
                >
                  <span className="interest-square">{selected && <Check size={12} />}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
          <span className="form-hint">Pilih 1–5 minat. Kamu bisa mengubahnya nanti.</span>
        </div>

        <div className="form-section">
          <label className="form-label" htmlFor="province">
            Lokasimu
          </label>
          <div className="form-grid">
            <select
              className="form-control"
              id="province"
              value={province}
              onChange={(event) => {
                setProvince(event.target.value);
                setError("");
              }}
            >
              <option value="">Pilih provinsi</option>
              {PROVINCES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              className="form-control"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Kota/kabupaten (opsional)"
              aria-label="Kota atau kabupaten opsional"
            />
          </div>
          <span className="form-hint">Peluang nasional dan daring tetap ditampilkan.</span>
        </div>

        <div className="form-section">
          <label className="form-label">Kamu lebih nyaman ikut...</label>
          <div className="choice-row">
            {[
              { value: "individual", label: "Sendiri", icon: <GraduationCap size={14} /> },
              { value: "team", label: "Dalam tim", icon: <Users size={14} /> },
              { value: "either", label: "Keduanya", icon: <Compass size={14} /> },
            ].map((option) => (
              <button
                className={preference === option.value ? "choice-button selected" : "choice-button"}
                key={option.value}
                type="button"
                aria-pressed={preference === option.value}
                onClick={() =>
                  setPreference(option.value as StudentProfile["participationPreference"])
                }
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label className="form-label" htmlFor="timezone">
            Zona waktu untuk pengingat
          </label>
          <div className="select-wrap">
            <select
              className="form-control"
              id="timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            >
              {timezones.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <span className="form-hint">
            Profil demo tersimpan di browser ini. Email pengingat aktif setelah akun tersambung.
          </span>
        </div>

        {error && <p className="error-note" role="alert">{error}</p>}

        <div className="onboarding-footer">
          <span className="onboarding-footer-note">
            <MapPin size={14} /> Tidak perlu alamat lengkap.
          </span>
          <button className="button" type="submit">
            Lihat peluang <Compass size={15} />
          </button>
        </div>
      </form>
    </section>
  );
}
