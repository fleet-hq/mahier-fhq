'use client';

import { useState, useMemo, useCallback } from 'react';

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const cellFont: React.CSSProperties = {
  fontFamily: 'Geist, Inter, sans-serif',
  fontWeight: 500,
  fontSize: 10,
  lineHeight: '24px',
  textAlign: 'center',
};

interface DualMonthCalendarProps {
  startDate: string;
  endDate: string;
  onSelectStart: (date: string) => void;
  onSelectEnd: (date: string) => void;
  minDate?: string;
  isOpen: boolean;
  /** YYYY-MM-DD strings the customer cannot select (admin blocks +
   *  existing bookings). Rendered greyed out and non-clickable. */
  unavailableDates?: string[];
}

function MonthGrid({
  year,
  month,
  label,
  startDate,
  endDate,
  minDate,
  unavailableSet,
  onSelect,
}: {
  year: number;
  month: number;
  label: string;
  startDate: string;
  endDate: string;
  minDate?: string;
  unavailableSet: Set<string>;
  onSelect: (dateStr: string) => void;
}) {
  const today = useMemo(() => {
    const d = new Date();
    return toDateString(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const leadingBlanks = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);

  return (
    <div className="flex-1 min-w-0">
      <p className="text-center font-semibold text-slate-900 mb-2" style={{ fontSize: 11 }}>{label}</p>

      <div className="grid grid-cols-7">
        {DAYS_OF_WEEK.map((day, i) => (
          <div key={i} className="h-6 flex items-center justify-center text-slate-400" style={{ ...cellFont, fontWeight: 600 }}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`b-${i}`} className="h-6" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const dateStr = toDateString(year, month, day);
          const isStart = dateStr === startDate;
          const isEnd = dateStr === endDate;
          const inRange = startDate && endDate && dateStr > startDate && dateStr < endDate;
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          const isBlocked = unavailableSet.has(dateStr);
          const disabled = !!(minDate && dateStr < minDate) || isBlocked;

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(dateStr)}
              style={cellFont}
              title={isBlocked ? 'Unavailable' : undefined}
              className={`
                h-6 flex items-center justify-center transition-colors relative
                ${isStart ? 'bg-primary text-white rounded-full z-10' : ''}
                ${isEnd ? 'bg-primary text-white rounded-full z-10' : ''}
                ${inRange && !isBlocked ? 'bg-primary/10 text-primary' : ''}
                ${!isStart && !isEnd && !inRange && isToday && !isBlocked ? 'text-primary font-semibold' : ''}
                ${!isStart && !isEnd && !inRange && !isToday && !disabled && !isPast ? 'text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer' : ''}
                ${(isPast || disabled) && !isStart && !isEnd && !isBlocked ? 'text-slate-300 cursor-not-allowed' : ''}
                ${isBlocked && !isStart && !isEnd ? 'text-slate-300 line-through cursor-not-allowed' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DualMonthCalendar({
  startDate,
  endDate,
  onSelectStart,
  onSelectEnd,
  minDate,
  isOpen,
  unavailableDates,
}: DualMonthCalendarProps) {
  const unavailableSet = useMemo(
    () => new Set(unavailableDates ?? []),
    [unavailableDates],
  );
  const [baseDate, setBaseDate] = useState<Date>(() => {
    if (startDate) return new Date(startDate + 'T00:00:00');
    return new Date();
  });
  const [selectingEnd, setSelectingEnd] = useState(false);

  const leftYear = baseDate.getFullYear();
  const leftMonth = baseDate.getMonth();
  const rightDate = new Date(leftYear, leftMonth + 1, 1);
  const rightYear = rightDate.getFullYear();
  const rightMonth = rightDate.getMonth();

  const handleSelect = useCallback(
    (dateStr: string) => {
      if (unavailableSet.has(dateStr)) return;
      if (!selectingEnd) {
        onSelectStart(dateStr);
        setSelectingEnd(true);
      } else {
        if (dateStr <= startDate) {
          onSelectStart(dateStr);
        } else {
          // Reject ranges that span an unavailable day — the new
          // window must not cover any blocked / booked date.
          for (const blocked of unavailableSet) {
            if (blocked > startDate && blocked < dateStr) return;
          }
          onSelectEnd(dateStr);
          setSelectingEnd(false);
        }
      }
    },
    [selectingEnd, startDate, onSelectStart, onSelectEnd, unavailableSet]
  );

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        isOpen ? 'opacity-100 mt-3' : 'max-h-0 opacity-0 overflow-hidden'
      }`}
      style={{ width: 520 }}
    >
      <div
        className="rounded-xl bg-white px-4 py-3"
        style={{ boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.12)', border: '1px solid #eee' }}
      >
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => setBaseDate(new Date(leftYear, leftMonth - 1, 1))}
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div />
          <button
            type="button"
            onClick={() => setBaseDate(new Date(leftYear, leftMonth + 1, 1))}
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="flex gap-4">
          <MonthGrid
            year={leftYear} month={leftMonth}
            label={formatMonthYear(leftYear, leftMonth)}
            startDate={startDate} endDate={endDate}
            minDate={minDate} unavailableSet={unavailableSet}
            onSelect={handleSelect}
          />
          <div className="w-px bg-slate-100 shrink-0" />
          <MonthGrid
            year={rightYear} month={rightMonth}
            label={formatMonthYear(rightYear, rightMonth)}
            startDate={startDate} endDate={endDate}
            minDate={minDate} unavailableSet={unavailableSet}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>
  );
}
