export type Grade = 10 | 11 | 12;
export type InterestTag =
  | "ai"
  | "programming"
  | "research"
  | "robotics"
  | "data-science"
  | "technology";
export type Category =
  | "competition"
  | "hackathon"
  | "research"
  | "program"
  | "scholarship";
export type ParticipationMode = "individual" | "team";
export type DeliveryMode = "online" | "in-person" | "hybrid";
export type LocationScope = "online" | "national" | "province" | "city";
export type DeadlineKind = "fixed" | "rolling" | "none";
export type PublicationStatus = "draft" | "published" | "archived";
export type IndonesianTimezone =
  | "Asia/Jakarta"
  | "Asia/Makassar"
  | "Asia/Jayapura";

export interface Opportunity {
  id: string;
  slug: string;
  title: string;
  organizerName: string;
  summary: string;
  description: string;
  category: Category;
  interestTags: InterestTag[];
  eligibleGrades: Grade[];
  eligibilityNotes: string;
  participationModes: ParticipationMode[];
  deliveryMode: DeliveryMode | null;
  locationScope: LocationScope | null;
  province: string | null;
  city: string | null;
  applicationOpenDate: string | null;
  deadlineKind: DeadlineKind;
  deadlineAt: string | null;
  deadlineTimezone: IndonesianTimezone | null;
  costNote: string;
  officialSourceUrl: string;
  applicationUrl: string | null;
  publicationStatus: PublicationStatus;
  verifiedAt: string | null;
  verifiedBy: string | null;
  verificationNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  grade: Grade;
  interests: InterestTag[];
  province: string;
  city: string;
  participationPreference: ParticipationMode | "either";
  timezone: string;
}

export interface SavedOpportunity {
  opportunityId: string;
  savedAt: string;
  reminderEnabled: boolean;
}

export interface ReminderPreview {
  offsetDays: 7 | 1;
  sendAt: Date;
}
