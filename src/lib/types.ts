export type CaseStatus = "Active" | "Pending" | "Closed" | "Disposed";
export type Priority = "High" | "Medium" | "Low";

// Shared role list used for the "Counsel For" field.
export const CASE_ROLES: string[] = [
  "Plaintiff",
  "Petitioner",
  "Applicant",
  "Appellant",
  "Revisionist",
  "Complainant",
  "Private Complainant",
  "Claimant",
  "Objector",
  "Intervenor / Intervener",
  "Aggrieved Person",
  "Victim / Aggrieved Person",
  "Decree Holder",
  "Auction Purchaser",
  "Bank / Financial Institution",
  "Taxpayer",
  "Guardian",
  "Third Party",
  "Convict / Appellant",
  "State",
  "Prosecution",
  "Other",
  "Defendant",
  "Respondent",
  "Respondent in Appeal",
  "Respondent in Revision",
  "Opposite Party",
  "Accused",
  "Federation",
  "Province",
  "Government Department",
  "Government Authority",
  "Regulatory Authority",
  "Creditor",
  "Borrower / Customer",
  "Department / Authority",
];

export interface Party {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

export type TimelineEventType =
  | "filed"
  | "statement"
  | "issues"
  | "evidence"
  | "hearing"
  | "order"
  | "other";

export interface TimelineEvent {
  id: string;
  title: string;
  date: string; // ISO date
  description: string;
  type: TimelineEventType;
}

export interface Hearing {
  id: string;
  caseId: string;
  date: string; // ISO datetime
  purpose: string;
  court: string;
  counselFor?: string;
}

export interface Task {
  id: string;
  caseId?: string;
  title: string;
  dueDate?: string; // ISO date
  status: "Pending" | "Completed";
  priority?: Priority;
}

export interface LegalCase {
  id: string;
  caseNumber: string;
  title: string;
  court: string;
  filingDate: string; // ISO date
  caseType: string;
  counselFor: string;
  stage: string;
  status: CaseStatus;
  priority: Priority;
  lastUpdated: string; // ISO datetime
  parties: Party[];
  timeline: TimelineEvent[];
  notes?: string;
}

export interface CaseDocument {
  id: string;
  caseId: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: string; // ISO datetime
  storedPath: string; // relative path within the uploads directory on disk
}

export interface Database {
  cases: LegalCase[];
  hearings: Hearing[];
  tasks: Task[];
  documents: CaseDocument[];
}

export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  hearingsThisMonth: number;
  pendingTasks: number;
  overdueTasks: number;
}

// -------------------------------------------------------------- Major Acts --
export interface LawSection {
  number: string;
  title: string;
  page: number; // 1-indexed page number in the source PDF
  text: string;
}

export interface LawActMeta {
  slug: string;
  act: string;
  pdfFile: string;
  sectionCount: number;
  hasIndex: boolean;
}

export interface LawActDetail extends LawActMeta {
  sections: LawSection[];
}
