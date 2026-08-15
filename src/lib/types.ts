export type CaseStatus = "Active" | "Pending" | "Closed" | "Disposed";
export type Priority = "High" | "Medium" | "Low";

// Shared role list used for the "Counsel For" field.
export const CASE_ROLES: string[] = [
  "Plaintiff",
  "Defendant",
  "Petitioner",
  "Respondent",
  "Appellant",
  "Accused",
  "Complainant",
  "Decree Holder",
  "Judgment Debtor",
  "Other",
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
