import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Database, LegalCase, Hearing, Task, DashboardStats, CaseDocument } from "./types";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Simple mutex so concurrent API requests don't interleave read-modify-write
// cycles and clobber each other. Good enough for a single-process JSON file;
// swap for a real database when this grows beyond a prototype.
let queue: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function readDb(): Promise<Database> {
  const raw = await fs.readFile(DB_PATH, "utf-8");
  const db = JSON.parse(raw) as Database;
  if (!db.documents) db.documents = [];
  return db;
}

async function writeDb(db: Database): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export const newId = () => randomUUID();

// ---------------------------------------------------------------- Cases --
export async function getCases(): Promise<LegalCase[]> {
  const db = await readDb();
  return db.cases;
}

export async function getCaseById(id: string): Promise<LegalCase | undefined> {
  const db = await readDb();
  return db.cases.find((c) => c.id === id);
}

export async function createCase(
  data: Omit<LegalCase, "id" | "lastUpdated" | "timeline" | "parties"> &
    Partial<Pick<LegalCase, "timeline" | "parties">>
): Promise<LegalCase> {
  return locked(async () => {
    const db = await readDb();
    const newCase: LegalCase = {
      ...data,
      id: newId(),
      parties: data.parties ?? [],
      timeline: data.timeline ?? [
        {
          id: newId(),
          title: "Case Filed",
          date: data.filingDate,
          description: `Case has been filed in ${data.court}.`,
          type: "filed",
        },
      ],
      lastUpdated: new Date().toISOString(),
    };
    db.cases.unshift(newCase);
    await writeDb(db);
    return newCase;
  });
}

export async function updateCase(
  id: string,
  patch: Partial<LegalCase>
): Promise<LegalCase | undefined> {
  return locked(async () => {
    const db = await readDb();
    const idx = db.cases.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    db.cases[idx] = {
      ...db.cases[idx],
      ...patch,
      id: db.cases[idx].id,
      lastUpdated: new Date().toISOString(),
    };
    await writeDb(db);
    return db.cases[idx];
  });
}

export async function deleteCase(id: string): Promise<boolean> {
  return locked(async () => {
    const db = await readDb();
    const before = db.cases.length;
    db.cases = db.cases.filter((c) => c.id !== id);
    db.hearings = db.hearings.filter((h) => h.caseId !== id);
    db.tasks = db.tasks.filter((t) => t.caseId !== id);
    await writeDb(db);
    return db.cases.length < before;
  });
}

export async function addTimelineEvent(
  caseId: string,
  event: Omit<LegalCase["timeline"][number], "id">
): Promise<LegalCase | undefined> {
  return locked(async () => {
    const db = await readDb();
    const idx = db.cases.findIndex((c) => c.id === caseId);
    if (idx === -1) return undefined;
    db.cases[idx].timeline.push({ ...event, id: newId() });
    db.cases[idx].lastUpdated = new Date().toISOString();
    await writeDb(db);
    return db.cases[idx];
  });
}

// -------------------------------------------------------------- Hearings --
export async function getHearings(): Promise<Hearing[]> {
  const db = await readDb();
  return db.hearings;
}

export async function getHearingsForCase(caseId: string): Promise<Hearing[]> {
  const db = await readDb();
  return db.hearings.filter((h) => h.caseId === caseId);
}

export async function createHearing(data: Omit<Hearing, "id">): Promise<Hearing> {
  return locked(async () => {
    const db = await readDb();
    const hearing: Hearing = { ...data, id: newId() };
    db.hearings.push(hearing);

    const caseIdx = db.cases.findIndex((c) => c.id === data.caseId);
    if (caseIdx !== -1) {
      db.cases[caseIdx].timeline.push({
        id: newId(),
        title: "Hearing Scheduled",
        date: data.date.slice(0, 10),
        description: data.purpose,
        type: "hearing",
      });
      db.cases[caseIdx].lastUpdated = new Date().toISOString();
    }

    await writeDb(db);
    return hearing;
  });
}

export async function deleteHearing(id: string): Promise<boolean> {
  return locked(async () => {
    const db = await readDb();
    const before = db.hearings.length;
    db.hearings = db.hearings.filter((h) => h.id !== id);
    await writeDb(db);
    return db.hearings.length < before;
  });
}

// ----------------------------------------------------------------- Tasks --
export async function getTasks(): Promise<Task[]> {
  const db = await readDb();
  return db.tasks;
}

export async function getTasksForCase(caseId: string): Promise<Task[]> {
  const db = await readDb();
  return db.tasks.filter((t) => t.caseId === caseId);
}

export async function createTask(data: Omit<Task, "id" | "status"> & { status?: Task["status"] }): Promise<Task> {
  return locked(async () => {
    const db = await readDb();
    const task: Task = { ...data, id: newId(), status: data.status ?? "Pending" };
    db.tasks.unshift(task);
    await writeDb(db);
    return task;
  });
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task | undefined> {
  return locked(async () => {
    const db = await readDb();
    const idx = db.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    db.tasks[idx] = { ...db.tasks[idx], ...patch, id: db.tasks[idx].id };
    await writeDb(db);
    return db.tasks[idx];
  });
}

export async function deleteTask(id: string): Promise<boolean> {
  return locked(async () => {
    const db = await readDb();
    const before = db.tasks.length;
    db.tasks = db.tasks.filter((t) => t.id !== id);
    await writeDb(db);
    return db.tasks.length < before;
  });
}

// ------------------------------------------------------------- Documents --
export async function getDocumentsForCase(caseId: string): Promise<CaseDocument[]> {
  const db = await readDb();
  return db.documents.filter((d) => d.caseId === caseId).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export async function getDocumentById(id: string): Promise<CaseDocument | undefined> {
  const db = await readDb();
  return db.documents.find((d) => d.id === id);
}

export async function addDocument(data: Omit<CaseDocument, "id" | "uploadedAt">): Promise<CaseDocument> {
  return locked(async () => {
    const db = await readDb();
    const doc: CaseDocument = { ...data, id: newId(), uploadedAt: new Date().toISOString() };
    db.documents.push(doc);
    await writeDb(db);
    return doc;
  });
}

export async function deleteDocument(id: string): Promise<CaseDocument | undefined> {
  return locked(async () => {
    const db = await readDb();
    const idx = db.documents.findIndex((d) => d.id === id);
    if (idx === -1) return undefined;
    const [removed] = db.documents.splice(idx, 1);
    await writeDb(db);
    return removed;
  });
}

// -------------------------------------------------------------- Dashboard --
export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await readDb();
  const now = new Date();
  const hearingsThisMonth = db.hearings.filter((h) => {
    const d = new Date(h.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const overdueTasks = db.tasks.filter(
    (t) => t.status === "Pending" && t.dueDate && new Date(t.dueDate).getTime() < todayStart
  ).length;

  return {
    totalCases: db.cases.length,
    activeCases: db.cases.filter((c) => c.status === "Active").length,
    hearingsThisMonth,
    pendingTasks: db.tasks.filter((t) => t.status === "Pending").length,
    overdueTasks,
  };
}
