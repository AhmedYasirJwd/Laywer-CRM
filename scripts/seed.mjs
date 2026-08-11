// Generates data/db.json — the file-based "database" used for now.
// Run with: node scripts/seed.mjs
import { writeFileSync } from "fs";
import { randomUUID } from "crypto";
import path from "path";

const id = () => randomUUID();

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function iso(date) {
  return new Date(date).toISOString();
}
function isoDate(date) {
  return iso(date).slice(0, 10);
}

const today = new Date();
today.setHours(9, 0, 0, 0);

// ---- Cases -----------------------------------------------------------
const civilSuit = {
  id: id(),
  caseNumber: "123/2025",
  title: "Ali Khan vs Ahmed & Co.",
  court: "City Court, Karachi",
  filingDate: "2025-01-10",
  caseType: "Civil Suit",
  counselFor: "Plaintiff",
  stage: "Evidence",
  status: "Active",
  priority: "High",
  lastUpdated: iso(addDays(today, -3)),
  parties: [
    {
      id: id(),
      name: "Ali Khan",
      role: "Plaintiff",
      phone: "0300-1234567",
      email: "alikhan@gmail.com",
    },
    {
      id: id(),
      name: "Ahmed & Co.",
      role: "Defendant",
      phone: "021-3456789",
      email: "info@ahmedco.com",
    },
  ],
  timeline: [
    {
      id: id(),
      title: "Case Filed",
      date: "2025-01-10",
      description: "Case has been filed in City Court, Karachi.",
      type: "filed",
    },
    {
      id: id(),
      title: "Written Statement",
      date: "2025-02-25",
      description: "Defendant has submitted written statement.",
      type: "statement",
    },
    {
      id: id(),
      title: "Issues Framed",
      date: "2025-03-15",
      description: "Court has framed issues for trial.",
      type: "issues",
    },
    {
      id: id(),
      title: "Evidence Started",
      date: "2025-05-05",
      description: "Plaintiff evidence has started.",
      type: "evidence",
    },
  ],
};

const criminalAppeal = {
  id: id(),
  caseNumber: "45/25",
  title: "State vs Muhammad Raza",
  court: "High Court, Karachi",
  filingDate: "2025-02-02",
  caseType: "Criminal Appeal",
  counselFor: "Petitioner",
  stage: "Arguments",
  status: "Active",
  priority: "High",
  lastUpdated: iso(addDays(today, -1)),
  parties: [
    { id: id(), name: "State", role: "Petitioner" },
    {
      id: id(),
      name: "Muhammad Raza",
      role: "Respondent",
      phone: "0322-9988776",
    },
  ],
  timeline: [
    {
      id: id(),
      title: "Appeal Filed",
      date: "2025-02-02",
      description: "Criminal appeal filed in High Court, Karachi.",
      type: "filed",
    },
    {
      id: id(),
      title: "Notice Issued",
      date: "2025-02-20",
      description: "Notice issued to respondent.",
      type: "order",
    },
    {
      id: id(),
      title: "Arguments Started",
      date: "2025-06-10",
      description: "Counsel for appellant began arguments.",
      type: "hearing",
    },
  ],
};

const writPetition = {
  id: id(),
  caseNumber: "789/26",
  title: "XYZ Pvt Ltd vs State of Sindh",
  court: "High Court, Karachi",
  filingDate: "2026-03-18",
  caseType: "Writ Petition",
  counselFor: "Petitioner",
  stage: "Hearing",
  status: "Active",
  priority: "Medium",
  lastUpdated: iso(addDays(today, -2)),
  parties: [
    { id: id(), name: "XYZ Pvt Ltd", role: "Petitioner", email: "legal@xyzpvt.com" },
    { id: id(), name: "State of Sindh", role: "Respondent" },
  ],
  timeline: [
    {
      id: id(),
      title: "Petition Filed",
      date: "2026-03-18",
      description: "Writ petition filed in High Court, Karachi.",
      type: "filed",
    },
    {
      id: id(),
      title: "Interim Order",
      date: "2026-04-02",
      description: "Court granted interim relief pending hearing.",
      type: "order",
    },
  ],
};

const bailApplication = {
  id: id(),
  caseNumber: "112/26",
  title: "Salman Ahmed (Bail)",
  court: "Sessions Court, Karachi",
  filingDate: "2026-06-01",
  caseType: "Bail Application",
  counselFor: "Petitioner",
  stage: "Filed",
  status: "Pending",
  priority: "High",
  lastUpdated: iso(addDays(today, -1)),
  parties: [
    { id: id(), name: "Salman Ahmed", role: "Petitioner", phone: "0333-1122334" },
    { id: id(), name: "State", role: "Respondent" },
  ],
  timeline: [
    {
      id: id(),
      title: "Application Filed",
      date: "2026-06-01",
      description: "Bail application filed in Sessions Court, Karachi.",
      type: "filed",
    },
  ],
};

const cases = [civilSuit, criminalAppeal, writPetition, bailApplication];

// ---- Hearings ----------------------------------------------------------
const hearings = [
  {
    id: id(),
    caseId: civilSuit.id,
    date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0)),
    purpose: "Cross examination of plaintiff witness",
    court: civilSuit.court,
    counselFor: civilSuit.counselFor,
  },
  {
    id: id(),
    caseId: criminalAppeal.id,
    date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0)),
    purpose: "Continuation of arguments",
    court: criminalAppeal.court,
    counselFor: criminalAppeal.counselFor,
  },
  {
    id: id(),
    caseId: writPetition.id,
    date: iso(new Date(addDays(today, 2).setHours(10, 30, 0, 0))),
    purpose: "Hearing on maintainability",
    court: writPetition.court,
    counselFor: writPetition.counselFor,
  },
  {
    id: id(),
    caseId: bailApplication.id,
    date: iso(new Date(addDays(today, 5).setHours(9, 30, 0, 0))),
    purpose: "Bail hearing",
    court: bailApplication.court,
    counselFor: bailApplication.counselFor,
  },
  {
    id: id(),
    caseId: civilSuit.id,
    date: iso(new Date(addDays(today, 14).setHours(11, 0, 0, 0))),
    purpose: "Continuation of evidence",
    court: civilSuit.court,
    counselFor: civilSuit.counselFor,
  },
];

// ---- Tasks --------------------------------------------------------------
const tasks = [
  {
    id: id(),
    caseId: civilSuit.id,
    title: "Prepare cross-examination questions",
    dueDate: isoDate(today),
    status: "Pending",
    priority: "High",
  },
  {
    id: id(),
    caseId: criminalAppeal.id,
    title: "File written arguments",
    dueDate: isoDate(addDays(today, 1)),
    status: "Pending",
    priority: "High",
  },
  {
    id: id(),
    caseId: writPetition.id,
    title: "Draft rejoinder to State's reply",
    dueDate: isoDate(addDays(today, 3)),
    status: "Pending",
    priority: "Medium",
  },
  {
    id: id(),
    caseId: bailApplication.id,
    title: "Collect surety documents",
    dueDate: isoDate(addDays(today, 2)),
    status: "Pending",
    priority: "High",
  },
  {
    id: id(),
    caseId: civilSuit.id,
    title: "Share hearing notice with client",
    dueDate: isoDate(addDays(today, -1)),
    status: "Completed",
    priority: "Low",
  },
  {
    id: id(),
    title: "Renew bar council membership",
    dueDate: isoDate(addDays(today, 20)),
    status: "Pending",
    priority: "Low",
  },
];

// Pad out totals so dashboard counters resemble the reference design
// (48 total cases / 32 active / 18 pending tasks) without hand-writing
// dozens of fixtures. Extra records are lightweight but fully valid.
const extraCaseTypes = ["Civil Suit", "Criminal Appeal", "Writ Petition", "Rent Case", "Family Suit", "Bail Application"];
const extraCourts = ["City Court, Karachi", "High Court, Karachi", "Sessions Court, Karachi", "Banking Court, Karachi"];
const extraStatuses = ["Active", "Active", "Pending", "Closed"];
for (let i = 5; i <= 48; i++) {
  const status = extraStatuses[i % extraStatuses.length];
  cases.push({
    id: id(),
    caseNumber: `${100 + i}/25`,
    title: `Case Party ${i} vs Respondent ${i}`,
    court: extraCourts[i % extraCourts.length],
    filingDate: isoDate(addDays(today, -i * 5)),
    caseType: extraCaseTypes[i % extraCaseTypes.length],
    counselFor: "Plaintiff",
    stage: "Filed",
    status,
    priority: i % 3 === 0 ? "High" : i % 3 === 1 ? "Medium" : "Low",
    lastUpdated: iso(addDays(today, -i)),
    parties: [],
    timeline: [
      {
        id: id(),
        title: "Case Filed",
        date: isoDate(addDays(today, -i * 5)),
        description: "Case has been filed.",
        type: "filed",
      },
    ],
  });
}
for (let i = tasks.length + 1; i <= 18; i++) {
  tasks.push({
    id: id(),
    title: `Follow up on pending matter ${i}`,
    dueDate: isoDate(addDays(today, (i % 7) - 2)),
    status: "Pending",
    priority: i % 3 === 0 ? "High" : "Medium",
  });
}

const db = { cases, hearings, tasks };

const outPath = path.join(process.cwd(), "data", "db.json");
writeFileSync(outPath, JSON.stringify(db, null, 2));
console.log(`Seeded ${cases.length} cases, ${hearings.length} hearings, ${tasks.length} tasks -> ${outPath}`);
