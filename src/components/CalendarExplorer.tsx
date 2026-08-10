"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import type { Hearing, LegalCase } from "@/lib/types";
import { HearingRow } from "./HearingRow";
import { PageHeader } from "./PageHeader";

function localDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarExplorer({ hearings, cases }: { hearings: Hearing[]; cases: LegalCase[] }) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const casesById = useMemo(() => new Map(cases.map((c) => [c.id, c])), [cases]);

  const hearingsByDate = useMemo(() => {
    const map = new Map<string, Hearing[]>();
    for (const h of hearings) {
      const key = localDateKey(h.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    }
    for (const list of map.values()) list.sort((a, b) => a.date.localeCompare(b.date));
    return map;
  }, [hearings]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedHearings = hearingsByDate.get(selectedKey) ?? [];

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle={`${hearings.length} scheduled hearings`}
        action={
          <Link
            href="/calendar/new"
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Hearing</span>
          </Link>
        }
      />

      <div className="card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">{format(currentMonth, "MMMM yyyy")}</h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setCurrentMonth(startOfMonth(today));
                setSelectedDate(today);
              }}
              className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-muted hover:bg-background"
            >
              Today
            </button>
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-background"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-background"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const count = hearingsByDate.get(key)?.length ?? 0;
            const inMonth = isSameMonth(day, currentMonth);
            const selected = isSameDay(day, selectedDate);
            const today = isToday(day);

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors ${
                  selected
                    ? "bg-ink text-white"
                    : count > 0
                      ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
                      : "text-ink hover:bg-background"
                } ${!inMonth ? "opacity-35" : ""}`}
              >
                <span className={`font-medium ${today && !selected ? "text-brand-700" : ""}`}>{format(day, "d")}</span>
                {today && (
                  <span
                    className={`absolute bottom-1.5 h-1 w-1 rounded-full ${selected ? "bg-white" : "bg-brand-600"}`}
                  />
                )}
                {count > 0 && !today && (
                  <span
                    className={`mt-0.5 text-[9px] font-semibold leading-none ${selected ? "text-white" : "text-brand-600"}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 card p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink">
          {isToday(selectedDate) ? "Today" : format(selectedDate, "EEEE, d MMMM yyyy")}
          {isToday(selectedDate) && (
            <span className="ml-2 text-xs font-normal text-muted">{format(selectedDate, "d MMMM yyyy")}</span>
          )}
        </h2>
        {selectedHearings.length === 0 ? (
          <p className="text-sm text-muted">No hearings scheduled for this date.</p>
        ) : (
          selectedHearings.map((h) => <HearingRow key={h.id} hearing={h} legalCase={casesById.get(h.caseId)} />)
        )}
      </div>
    </div>
  );
}
