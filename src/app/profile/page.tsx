"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Compass, GraduationCap, MapPin, Users } from "lucide-react";
import { useApp } from "@/components/providers";
import { INTEREST_OPTIONS, PROVINCES } from "@/lib/fixtures";
import type { Grade, InterestTag, StudentProfile } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const { hydrated, profile } = useApp();

  useEffect(() => {
    if (hydrated && !profile) router.replace("/onboarding");
  }, [hydrated, profile, router]);

  if (!hydrated || !profile) return <div className="loading-screen" />;
  return (
    <ProfileForm key="profile-form" profile={profile} />
  );
}

function ProfileForm({ profile }: { profile: StudentProfile }) {
  const { setProfile } = useApp();
  const [grade, setGrade] = useState<Grade>(profile.grade);
  const [interests, setInterests] = useState<InterestTag[]>(profile.interests);
  const [province, setProvince] = useState(profile.province);
  const [city, setCity] = useState(profile.city);
  const [preference, setPreference] = useState<StudentProfile["participationPreference"]>(
    profile.participationPreference,
  );
  const [timezone, setTimezone] = useState(profile.timezone);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const toggleInterest = (tag: InterestTag) => {
    setInterests((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : current.length < 5
          ? [...current, tag]
          : current,
    );
    setMessage("");
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!interests.length || !province.trim()) {
      setError("Pilih minimal satu minat dan provinsimu.");
      setMessage("");
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
    setError("");
    setMessage("Preferensimu tersimpan di browser ini.");
    window.setTimeout(() => setMessage(""), 3500);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Personalisasi</p>
          <h1>Profil siswa.</h1>
          <p>Perbarui preferensimu kapan saja untuk menyusun ulang feed peluang.</p>
        </div>
      </div>

      <form className="profile-panel" onSubmit={submit}>
        <div className="form-section">
          <label className="form-label">Kelas</label>
          <div className="choice-row">
            {([10, 11, 12] as const).map((item) => (
              <button
                className={grade === item ? "choice-button selected" : "choice-button"}
                key={item}
                type="button"
                aria-pressed={grade === item}
                onClick={() => setGrade(item)}
              >
                <GraduationCap size={15} /> Kelas {item}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label className="form-label">Minat (pilih 1–5)</label>
          <div className="interest-grid">
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
        </div>

        <div className="form-section">
          <label className="form-label" htmlFor="profile-province">Lokasi</label>
          <div className="form-grid">
            <select
              id="profile-province"
              className="form-control"
              value={province}
              onChange={(event) => setProvince(event.target.value)}
            >
              <option value="">Pilih provinsi</option>
              {PROVINCES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input
              className="form-control"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Kota/kabupaten (opsional)"
            />
          </div>
          <span className="form-hint">Lokasi membantu mengurutkan peluang tatap muka.</span>
        </div>

        <div className="form-section">
          <label className="form-label">Preferensi peserta</label>
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
                {option.icon}{option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label className="form-label" htmlFor="profile-timezone">Zona waktu</label>
          <div className="select-wrap">
            <select
              id="profile-timezone"
              className="form-control"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            >
              <option value="Asia/Jakarta">WIB</option>
              <option value="Asia/Makassar">WITA</option>
              <option value="Asia/Jayapura">WIT</option>
            </select>
          </div>
          <span className="form-hint">Waktu pengingat lokal: 09.00.</span>
        </div>

        {error && <p className="error-note" role="alert">{error}</p>}
        <div className="profile-actions">
          <span className="onboarding-footer-note">
            <MapPin size={14} /> Data tersimpan di browser ini selama mode demo.
          </span>
          <button className="button" type="submit">Simpan perubahan</button>
        </div>
        {message && <p className="success-note" role="status">{message}</p>}
      </form>
    </>
  );
}
