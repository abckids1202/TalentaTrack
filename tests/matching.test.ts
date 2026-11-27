import { describe, expect, it } from "vitest";
import { FIXTURE_OPPORTUNITIES } from "../src/lib/fixtures";
import {
  compareByMatch,
  isOpportunityVisible,
  scoreOpportunity,
} from "../src/lib/matching";
import type { Grade, ParticipationMode, StudentProfile } from "../src/lib/types";

const profile: StudentProfile = {
  grade: 11,
  interests: ["ai", "programming"],
  province: "Jawa Barat",
  city: "Bandung",
  participationPreference: "individual",
  timezone: "Asia/Jakarta",
};

describe("scoreOpportunity", () => {
  it("applies the V1 interest, location, and participation weights", () => {
    const doai = FIXTURE_OPPORTUNITIES[1];
    const result = scoreOpportunity(doai, profile);

    expect(result.interestScore).toBe(30);
    expect(result.locationScore).toBe(15);
    expect(result.participationScore).toBe(15);
    expect(result.score).toBe(60);
    expect(result.eligible).toBe(true);
  });

  it("excludes a listing when the selected grade is ineligible", () => {
    const listing = {
      ...FIXTURE_OPPORTUNITIES[0],
      eligibleGrades: [10] as Grade[],
    };
    const result = scoreOpportunity(listing, { ...profile, grade: 12 });

    expect(result.eligible).toBe(false);
    expect(result.score).toBe(0);
  });

  it("does not exclude a student for a different location or team preference", () => {
    const listing = {
      ...FIXTURE_OPPORTUNITIES[0],
      participationModes: ["team"] as ParticipationMode[],
      locationScope: "province" as const,
      province: "Jawa Timur",
    };
    const result = scoreOpportunity(listing, profile);

    expect(result.eligible).toBe(true);
    expect(result.locationScore).toBe(5);
    expect(result.participationScore).toBe(0);
  });

  it("does not treat a same-named city in another province as a location match", () => {
    const cityListing = {
      ...FIXTURE_OPPORTUNITIES[0],
      locationScope: "city" as const,
      province: "Jawa Timur",
      city: "Bandung",
    };
    expect(scoreOpportunity(cityListing, profile).locationScore).toBe(5);
  });

  it("prefers a same-city opportunity over a nationwide one", () => {
    const cityListing = {
      ...FIXTURE_OPPORTUNITIES[0],
      locationScope: "city" as const,
      province: "Jawa Barat",
      city: "Bandung",
    };
    expect(scoreOpportunity(cityListing, profile).locationScore).toBe(25);
    expect(scoreOpportunity(FIXTURE_OPPORTUNITIES[1], profile).locationScore).toBe(15);
  });

  it("sorts equal scores by closing date and then title", () => {
    const earlier = {
      ...FIXTURE_OPPORTUNITIES[0],
      deadlineAt: "2026-12-01T16:59:00.000Z",
    };
    const later = {
      ...FIXTURE_OPPORTUNITIES[1],
      deadlineAt: "2026-12-10T16:59:00.000Z",
    };
    expect(
      compareByMatch(
        { opportunity: later, score: 50 },
        { opportunity: earlier, score: 50 },
      ),
    ).toBeGreaterThan(0);
  });
});

describe("isOpportunityVisible", () => {
  const now = new Date("2026-11-26T12:00:00.000Z");

  it("shows only published records with fresh verification and future deadlines", () => {
    expect(isOpportunityVisible(FIXTURE_OPPORTUNITIES[0], now)).toBe(true);
    expect(isOpportunityVisible(FIXTURE_OPPORTUNITIES[2], now)).toBe(false);
  });

  it("hides verification older than 30 days and expired fixed deadlines", () => {
    const oldReview = {
      ...FIXTURE_OPPORTUNITIES[0],
      verifiedAt: "2026-10-01",
    };
    const expired = {
      ...FIXTURE_OPPORTUNITIES[0],
      deadlineAt: "2026-11-20T16:59:00.000Z",
    };
    expect(isOpportunityVisible(oldReview, now)).toBe(false);
    expect(isOpportunityVisible(expired, now)).toBe(false);
  });

  it("shows a same-day deadline before its exact WIB cutoff", () => {
    const listing = {
      ...FIXTURE_OPPORTUNITIES[0],
      verifiedAt: "2027-01-10",
    };
    expect(
      isOpportunityVisible(listing, new Date("2027-01-10T16:58:59.999Z")),
    ).toBe(true);
  });

  it("hides a same-day deadline after its exact WIB cutoff", () => {
    const listing = {
      ...FIXTURE_OPPORTUNITIES[0],
      verifiedAt: "2027-01-10",
    };
    expect(isOpportunityVisible(listing, new Date("2027-01-10T17:00:00.000Z"))).toBe(false);
  });

  it("hides a deadline that has already passed", () => {
    const listing = {
      ...FIXTURE_OPPORTUNITIES[0],
      verifiedAt: "2027-01-10",
    };
    expect(isOpportunityVisible(listing, new Date("2027-01-11T00:00:00.000Z"))).toBe(false);
  });

  it("hides a fixed deadline that lacks an explicit timezone offset", () => {
    const listing = {
      ...FIXTURE_OPPORTUNITIES[0],
      deadlineAt: "2027-01-10T23:59:00",
      verifiedAt: "2027-01-10",
    };
    expect(isOpportunityVisible(listing, new Date("2027-01-10T10:00:00.000Z"))).toBe(false);
  });
});
