"use client";

import Link from "next/link";
import { cloneElement, useState, type FormEvent, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CircleAlert, Save, ShieldCheck } from "lucide-react";
import { useApp } from "@/components/providers";
import {
  DEADLINE_TIMEZONES,
  DEFAULT_DEADLINE_TIMEZONE,
  deadlineInputValue,
  getDeadlineTimezone,
  isDeadlineFuture,
  localDeadlineToIso,
} from "@/lib/deadlines";
import {
  CATEGORY_LABELS,
  INTEREST_OPTIONS,
  PROVINCES,
} from "@/lib/fixtures";
import type {
  Category,
  DeadlineKind,
  DeliveryMode,
  Grade,
  InterestTag,
  LocationScope,
  Opportunity,
  ParticipationMode,
} from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

function makeSlug(value: string) {
  return value
    .toLocaleLowerCase("id-ID")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function blankOpportunity(): Opportunity {
  return {
    id: "",
    slug: "",
    title: "",
    organizerName: "",
    summary: "",
    description: "",
    category: "competition",
    interestTags: [],
    eligibleGrades: [],
    eligibilityNotes: "",
    participationModes: [],
    deliveryMode: null,
    locationScope: null,
    province: null,
    city: null,
    applicationOpenDate: null,
    deadlineKind: "fixed",
    deadlineAt: null,
    deadlineTimezone: DEFAULT_DEADLINE_TIMEZONE,
    costNote: "",
    officialSourceUrl: "",
    applicationUrl: "",
    publicationStatus: "draft",
    verifiedAt: null,
    verifiedBy: null,
    verificationNotes: "",
    createdAt: today(),
    updatedAt: today(),
  };
}

function validUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function OpportunityForm({ id }: { id?: string }) {
  const { hydrated, opportunities } = useApp();
  const current = id ? opportunities.find((item) => item.id === id) : undefined;

  if (!hydrated) return <div className="loading-screen" />;
  if (id && !current) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><CircleAlert size={20} /></div>
        <h2>Listing tidak ditemukan.</h2>
        <p>Data lokal mungkin sudah direset atau dihapus.</p>
        <Link className="button secondary small" href="/admin">Kembali ke panel</Link>
      </div>
    );
  }
  return (
    <OpportunityFormEditor
      key={id ?? "new-opportunity"}
      id={id}
      initialRecord={current ?? blankOpportunity()}
    />
  );
}

function OpportunityFormEditor({
  id,
  initialRecord,
}: {
  id?: string;
  initialRecord: Opportunity;
}) {
  const router = useRouter();
  const { opportunities, saveOpportunity } = useApp();
  const [record, setRecord] = useState<Opportunity>(initialRecord);
  const [deadlineInput, setDeadlineInput] = useState(
    deadlineInputValue(
      initialRecord.deadlineAt,
      getDeadlineTimezone(initialRecord.deadlineTimezone),
    ),
  );
  const [error, setError] = useState("");

  const update = <K extends keyof Opportunity>(key: K, value: Opportunity[K]) =>
    setRecord((currentRecord) => ({ ...currentRecord, [key]: value }));

  const updateDeadlineInput = (value: string) => {
    setDeadlineInput(value);
    setRecord((currentRecord) => ({
      ...currentRecord,
      deadlineAt: localDeadlineToIso(value, currentRecord.deadlineTimezone),
    }));
    setError("");
  };

  const updateDeadlineTimezone = (value: string) => {
    const timezone = getDeadlineTimezone(value);
    setRecord((currentRecord) => ({
      ...currentRecord,
      deadlineTimezone: timezone,
      deadlineAt: localDeadlineToIso(deadlineInput, timezone),
    }));
    setError("");
  };

  const toggleListValue = <T extends string | number>(
    key: "interestTags" | "eligibleGrades" | "participationModes",
    value: T,
  ) => {
    setRecord((currentRecord) => {
      const existing = currentRecord[key] as T[];
      const next = existing.includes(value)
        ? existing.filter((item) => item !== value)
        : [...existing, value];
      return { ...currentRecord, [key]: next } as Opportunity;
    });
  };

  const validate = (publishing: boolean) => {
    if (!record.title.trim() || !record.organizerName.trim() || !record.summary.trim()) {
      return "Isi judul, penyelenggara, dan ringkasan.";
    }
    if (!validUrl(record.officialSourceUrl)) {
      return "Masukkan URL sumber resmi yang diawali https://.";
    }
    if (record.applicationUrl && !validUrl(record.applicationUrl)) {
      return "Tautan pendaftaran harus menggunakan https://.";
    }
    if (!record.eligibleGrades.length || !record.participationModes.length) {
      return "Pilih minimal satu kelas dan format peserta.";
    }
    if (publishing && !record.costNote.trim()) {
      return "Cantumkan biaya atau tulis bahwa biaya belum tercantum di sumber.";
    }
    if (record.deadlineKind === "fixed" && (!deadlineInput || !record.deadlineAt)) {
      return "Pilih tanggal dan jam tenggat.";
    }
    if (record.deadlineKind === "fixed" && !isDeadlineFuture(record.deadlineAt)) {
      return "Tenggat sudah lewat. Pilih waktu tenggat yang akan datang.";
    }
    if (publishing) {
      if (!record.interestTags.length) return "Pilih minimal satu bidang minat.";
      if (!record.description.trim() || !record.eligibilityNotes.trim()) {
        return "Isi deskripsi dan catatan eligibility sebelum menerbitkan.";
      }
      if (!record.deliveryMode || !record.locationScope) {
        return "Konfirmasi format dan cakupan lokasi sebelum menerbitkan.";
      }
      if (record.locationScope === "province" && !record.province) {
        return "Pilih provinsi peluang ini.";
      }
      if (record.locationScope === "city" && (!record.city || !record.province)) {
        return "Pilih kota dan provinsi peluang ini.";
      }
      if (!record.verificationNotes.trim()) {
        return "Catat apa yang sudah diperiksa dari sumber resmi.";
      }
    }
    return "";
  };

  const persist = (publishing: boolean) => {
    const validationError = validate(publishing);
    if (validationError) {
      setError(validationError);
      return;
    }
    const nextSlug = makeSlug(record.title);
    if (
      opportunities.some(
        (item) => item.slug === nextSlug && item.id !== record.id,
      )
    ) {
      setError("Judul ini menghasilkan slug yang sudah dipakai. Tambahkan nama penyelenggara atau tahun.");
      return;
    }
    const next: Opportunity = {
      ...record,
      id: record.id || crypto.randomUUID(),
      slug: nextSlug,
      applicationOpenDate: record.applicationOpenDate || null,
      deadlineAt: record.deadlineKind === "fixed" ? record.deadlineAt : null,
      deadlineTimezone:
        record.deadlineKind === "fixed"
          ? getDeadlineTimezone(record.deadlineTimezone)
          : null,
      province: record.province || null,
      city: record.city || null,
      applicationUrl: record.applicationUrl || null,
      publicationStatus: publishing ? "published" : "draft",
      verifiedAt: publishing ? today() : null,
      verifiedBy: publishing ? "Admin demo" : null,
      verificationNotes: record.verificationNotes.trim(),
      createdAt: record.createdAt || today(),
      updatedAt: today(),
    };
    saveOpportunity(next);
    router.push("/admin");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    persist(false);
  };

  return (
    <div className="admin-form-wrap">
      <Link href="/admin" className="detail-back">
        <ArrowLeft size={15} /> Kembali ke panel admin
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Kurasi peluang</p>
          <h1>{id ? "Edit listing." : "Tambah peluang."}</h1>
          <p>
            Simpan sebagai draft untuk melanjutkan nanti. Terbitkan hanya setelah data cocok dengan sumber resmi.
          </p>
        </div>
      </div>

      <form className="panel admin-form-panel" onSubmit={submit}>
        <section className="admin-form-section">
          <h2>Informasi utama</h2>
          <div className="admin-form-grid">
            <Field label="Nama peluang" full>
              <input
                className="form-control"
                required
                value={record.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Contoh: Kompetisi AI Nasional"
              />
            </Field>
            <Field label="Penyelenggara">
              <input
                className="form-control"
                required
                value={record.organizerName}
                onChange={(event) => update("organizerName", event.target.value)}
              />
            </Field>
            <Field label="Kategori">
              <select
                className="form-control"
                value={record.category}
                onChange={(event) => update("category", event.target.value as Category)}
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option value={value} key={value}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="Ringkasan" full>
              <textarea
                className="form-control"
                required
                value={record.summary}
                onChange={(event) => update("summary", event.target.value)}
              />
            </Field>
            <Field label="Deskripsi" full>
              <textarea
                className="form-control"
                value={record.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder="Jelaskan peluang secara ringkas dan faktual."
              />
            </Field>
          </div>
        </section>

        <section className="admin-form-section">
          <h2>Eligibility dan format</h2>
          <div className="form-field">
            <label className="form-label">Kelas yang dapat ikut</label>
            <div className="checkbox-line">
              {([10, 11, 12] as const).map((grade) => (
                <label className="checkbox-choice" key={grade}>
                  <input
                    type="checkbox"
                    checked={record.eligibleGrades.includes(grade)}
                    onChange={() => toggleListValue("eligibleGrades", grade as Grade)}
                  />
                  Kelas {grade}
                </label>
              ))}
            </div>
          </div>
          <div className="form-field form-gap">
            <label className="form-label">Bidang minat</label>
            <div className="checkbox-line">
              {INTEREST_OPTIONS.map((item) => (
                <label className="checkbox-choice" key={item.id}>
                  <input
                    type="checkbox"
                    checked={record.interestTags.includes(item.id)}
                    onChange={() => toggleListValue("interestTags", item.id as InterestTag)}
                  />
                  {item.shortLabel}
                </label>
              ))}
            </div>
          </div>
          <div className="form-field form-gap">
            <label className="form-label">Format peserta</label>
            <div className="checkbox-line">
              {[
                { value: "individual", label: "Individu" },
                { value: "team", label: "Tim" },
              ].map((mode) => (
                <label className="checkbox-choice" key={mode.value}>
                  <input
                    type="checkbox"
                    checked={record.participationModes.includes(mode.value as ParticipationMode)}
                    onChange={() =>
                      toggleListValue("participationModes", mode.value as ParticipationMode)
                    }
                  />
                  {mode.label}
                </label>
              ))}
            </div>
          </div>
          <div className="admin-form-grid form-gap">
            <Field label="Catatan eligibility" full>
              <textarea
                className="form-control"
                value={record.eligibilityNotes}
                onChange={(event) => update("eligibilityNotes", event.target.value)}
                placeholder="Syarat kelas, pendamping, jumlah anggota, dan batas lain."
              />
            </Field>
          </div>
        </section>

        <section className="admin-form-section">
          <h2>Lokasi dan tenggat</h2>
          <div className="admin-form-grid">
            <Field label="Format kegiatan">
              <select
                className="form-control"
                value={record.deliveryMode ?? ""}
                onChange={(event) =>
                  update("deliveryMode", (event.target.value || null) as DeliveryMode | null)
                }
              >
                <option value="">Pilih format</option>
                <option value="online">Daring</option>
                <option value="in-person">Tatap muka</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </Field>
            <Field label="Cakupan lokasi">
              <select
                className="form-control"
                value={record.locationScope ?? ""}
                onChange={(event) =>
                  update("locationScope", (event.target.value || null) as LocationScope | null)
                }
              >
                <option value="">Pilih cakupan</option>
                <option value="online">Daring</option>
                <option value="national">Nasional</option>
                <option value="province">Provinsi</option>
                <option value="city">Kota</option>
              </select>
            </Field>
            <Field label="Provinsi">
              <select
                className="form-control"
                value={record.province ?? ""}
                onChange={(event) => update("province", event.target.value || null)}
              >
                <option value="">Pilih provinsi</option>
                {PROVINCES.map((province) => (
                  <option value={province} key={province}>{province}</option>
                ))}
              </select>
            </Field>
            <Field label="Kota/kabupaten">
              <input
                className="form-control"
                value={record.city ?? ""}
                onChange={(event) => update("city", event.target.value || null)}
                placeholder="Opsional"
              />
            </Field>
            <Field label="Pendaftaran dibuka">
              <input
                className="form-control"
                type="date"
                value={record.applicationOpenDate ?? ""}
                onChange={(event) => update("applicationOpenDate", event.target.value || null)}
              />
            </Field>
            <Field label="Jenis tenggat">
              <select
                className="form-control"
                value={record.deadlineKind}
                onChange={(event) => {
                  const nextKind = event.target.value as DeadlineKind;
                  update("deadlineKind", nextKind);
                  if (nextKind !== "fixed") {
                    setDeadlineInput("");
                    update("deadlineAt", null);
                  }
                }}
              >
                <option value="fixed">Tanggal tetap</option>
                <option value="rolling">Bergulir</option>
                <option value="none">Tanpa tenggat</option>
              </select>
            </Field>
            {record.deadlineKind === "fixed" && (
              <>
                <Field label="Tanggal dan waktu tenggat">
                  <input
                    className="form-control"
                    type="datetime-local"
                    required
                    value={deadlineInput}
                    onChange={(event) => updateDeadlineInput(event.target.value)}
                  />
                </Field>
                <Field label="Zona waktu sumber (default WIB bila tidak disebut)">
                  <select
                    className="form-control"
                    value={getDeadlineTimezone(record.deadlineTimezone)}
                    onChange={(event) => updateDeadlineTimezone(event.target.value)}
                  >
                    {DEADLINE_TIMEZONES.map((timezone) => (
                      <option value={timezone.value} key={timezone.value}>
                        {timezone.label} · {timezone.value}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}
            <Field label="Biaya pendaftaran">
              <input
                className="form-control"
                value={record.costNote}
                onChange={(event) => update("costNote", event.target.value)}
                placeholder="Gratis / nominal / lihat sumber resmi"
              />
            </Field>
          </div>
        </section>

        <section className="admin-form-section">
          <h2>Sumber dan verifikasi</h2>
          <div className="admin-form-grid">
            <Field label="URL sumber resmi" full>
              <input
                className="form-control"
                type="url"
                required
                value={record.officialSourceUrl}
                onChange={(event) => update("officialSourceUrl", event.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="URL pendaftaran" full>
              <input
                className="form-control"
                type="url"
                value={record.applicationUrl ?? ""}
                onChange={(event) => update("applicationUrl", event.target.value)}
                placeholder="Boleh kosong jika proses dimulai dari sumber resmi"
              />
            </Field>
            <Field label="Catatan pemeriksaan" full>
              <textarea
                className="form-control"
                value={record.verificationNotes}
                onChange={(event) => update("verificationNotes", event.target.value)}
                placeholder="Contoh: tanggal, syarat kelas, tenggat, lokasi, dan tautan telah dicocokkan."
              />
            </Field>
          </div>
          <div className="verification-checklist">
            <span><Check size={13} /> Syarat kelas dan format peserta</span>
            <span><Check size={13} /> Tenggat dan zona waktu dari sumber</span>
            <span><Check size={13} /> Lokasi dan mode kegiatan</span>
            <span><Check size={13} /> Tautan resmi dapat dibuka</span>
          </div>
        </section>

        {error && <p className="error-note" role="alert">{error}</p>}
        <div className="admin-form-actions">
          <span className="onboarding-footer-note">
            <ShieldCheck size={14} /> Perubahan listing terbit kembali menjadi draft.
          </span>
          <div>
            <Link className="button secondary small" href="/admin">Batal</Link>
            <button className="button secondary small" type="submit">
              <Save size={14} /> Simpan draft
            </button>
            <button
              className="button small"
              type="button"
              onClick={() => persist(true)}
            >
              <Check size={14} /> Verifikasi & terbitkan
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: ReactElement<{ id?: string }>;
}) {
  const fieldId =
    "opportunity-field-" +
    label
      .toLocaleLowerCase("id-ID")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  return (
    <div className={full ? "form-field full" : "form-field"}>
      <label className="form-label" htmlFor={fieldId}>{label}</label>
      {cloneElement(children, { id: fieldId })}
    </div>
  );
}
