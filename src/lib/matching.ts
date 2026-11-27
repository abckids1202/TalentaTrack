import type { Opportunity, StudentProfile } from "./types";
import { isDeadlineFuture } from "./deadlines";

export interface MatchResult {
  score: number;
  interestScore: number;
  locationScore: number;
  participationScore: number;
  eligible: boolean;
  reasons: string[];
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLocaleLowerCase("id-ID");
}

export function scoreOpportunity(
  opportunity: Opportunity,
  profile: StudentProfile,
): MatchResult {
  const eligible = opportunity.eligibleGrades.includes(profile.grade);
  const matchedInterests = profile.interests.filter((tag) =>
    opportunity.interestTags.includes(tag),
  );
  const interestScore = profile.interests.length
    ? Math.round((60 * matchedInterests.length) / profile.interests.length)
    : 0;

  let locationScore = 5;
  let locationReason = "Wilayah lain di Indonesia";
  if (
    opportunity.locationScope === "online" ||
    opportunity.locationScope === "national"
  ) {
    locationScore = 15;
    locationReason =
      opportunity.locationScope === "online" ? "Dapat diikuti daring" : "Terbuka nasional";
  } else if (
    opportunity.locationScope === "city" &&
    normalize(opportunity.city) === normalize(profile.city) &&
    normalize(opportunity.province) === normalize(profile.province) &&
    profile.city
  ) {
    locationScore = 25;
    locationReason = "Lokasi sesuai kota";
  } else if (
    opportunity.province &&
    normalize(opportunity.province) === normalize(profile.province)
  ) {
    locationScore = 20;
    locationReason = "Lokasi sesuai provinsi";
  }

  const participationScore =
    profile.participationPreference === "either" ||
    opportunity.participationModes.includes(profile.participationPreference)
      ? 15
      : 0;
  const reasons = [
    matchedInterests.length
      ? matchedInterests.map((tag) => tag.replace("-", " ")).join(", ")
      : "Belum cocok dengan minat pilihan",
    locationReason,
    participationScore ? "Format sesuai preferensi" : "Format berbeda dari preferensi",
  ];

  return {
    score: eligible ? interestScore + locationScore + participationScore : 0,
    interestScore,
    locationScore,
    participationScore,
    eligible,
    reasons,
  };
}

export function isVerificationFresh(
  opportunity: Opportunity,
  now = new Date(),
  maxAgeDays = 30,
) {
  if (!opportunity.verifiedAt) return false;
  const verifiedAt = new Date(opportunity.verifiedAt + "T00:00:00");
  const ageDays = (now.getTime() - verifiedAt.getTime()) / 86_400_000;
  return ageDays >= 0 && ageDays <= maxAgeDays;
}

export function isOpportunityVisible(
  opportunity: Opportunity,
  now = new Date(),
) {
  if (
    opportunity.publicationStatus !== "published" ||
    !isVerificationFresh(opportunity, now)
  ) {
    return false;
  }
  if (opportunity.deadlineKind === "fixed" && !isDeadlineFuture(opportunity.deadlineAt, now)) {
    return false;
  }
  return true;
}

export function compareByMatch(
  left: { opportunity: Opportunity; score: number },
  right: { opportunity: Opportunity; score: number },
) {
  const scoreDiff = right.score - left.score;
  if (scoreDiff) return scoreDiff;
  const leftDate = left.opportunity.deadlineAt ?? "9999-12-31T23:59:59.999Z";
  const rightDate = right.opportunity.deadlineAt ?? "9999-12-31T23:59:59.999Z";
  return (
    leftDate.localeCompare(rightDate) ||
    left.opportunity.title.localeCompare(right.opportunity.title, "id")
  );
}
