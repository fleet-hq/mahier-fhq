'use client';

import { useState, useRef, useCallback, useMemo, useEffect, type ReactNode, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks';

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  highlightDate?: string;
  /** YYYY-MM-DD strings that should be disabled in the calendar.
   *  Used to grey out days that overlap admin-set unavailability
   *  blocks or existing bookings. */
  unavailableDates?: string[];
  icon?: ReactNode;
  className?: string;
  'aria-label'?: string;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
const PANEL_HEIGHT = 320;
const GAP = 8;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isSameDay(year: number, month: number, day: number, compare: Date): boolean {
  return compare.getFullYear() === year && compare.getMonth() === month && compare.getDate() === day;
}

function formatDisplay(value: string): string {
  const date = new Date(value + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select Date',
  minDate,
  maxDate,
  highlightDate,
  unavailableDates,
  icon,
  className,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const unavailableSet = useMemo(
    () => new Set(unavailableDates ?? []),
    [unavailableDates],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() =>
    value ? new Date(value + 'T00:00:00') : new Date()
  );
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({ position: 'fixed' });
  const [originClass, setOriginClass] = useState('origin-top');

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setIsOpen(false), []);
  useClickOutside(containerRef, close, isOpen);

  const today = useMemo(() => new Date(), []);

  const { year, month, leadingBlanks, days } = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    return {
      year: y,
      month: m,
      leadingBlanks: Array.from<null>({ length: getFirstDayOfMonth(y, m) }),
      days: Array.from({ length: getDaysInMonth(y, m) }, (_, i) => i + 1),
    };
  }, [viewDate]);

  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < PANEL_HEIGHT && rect.top > PANEL_HEIGHT;

    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 264));

    if (openUp) {
      setDropdownStyle({ position: 'fixed', bottom: window.innerHeight - rect.top + GAP, left });
      setOriginClass('origin-bottom');
    } else {
      setDropdownStyle({ position: 'fixed', top: rect.bottom + GAP, left });
      setOriginClass('origin-top');
    }
  }, []);

  const openDropdown = useCallback(() => {
    computePosition();
    if (value) {
      setViewDate(new Date(value + 'T00:00:00'));
    } else if (minDate) {
      setViewDate(new Date(minDate + 'T00:00:00'));
    }
    setIsOpen(true);
  }, [value, minDate, computePosition]);

  // Recompute position on scroll/resize while open
  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => computePosition();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, computePosition]);

  const toggle = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      openDropdown();
    }
  }, [isOpen, openDropdown]);

  const handleSelect = useCallback(
    (dateStr: string) => {
      onChange(dateStr);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  const prevMonth = useCallback(() => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    },
    [isOpen]
  );

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div ref={containerRef} className={cn('relative', className)} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className="flex cursor-pointer items-center gap-2 p-0"
      >
        {icon}
        <span className={cn('text-sm', value ? 'text-slate-700' : 'text-neutral-placeholder')}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose date"
        style={dropdownStyle}
        className={cn(
          'z-50 w-64 rounded-lg border border-slate-200 bg-white shadow-lg transition-all duration-200 ease-out',
          originClass,
          isOpen ? 'scale-y-100 opacity-100' : 'pointer-events-none scale-y-0 opacity-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Previous month"
            className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronLeftIcon />
          </button>
          <span className="text-sm font-medium text-slate-900">{monthLabel}</span>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next month"
            className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronRightIcon />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 px-3 pt-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="py-1 text-center text-xs font-medium text-slate-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5 px-3 pb-3 pt-1" role="grid">
          {leadingBlanks.map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map((day) => {
            const dateStr = toDateString(year, month, day);
            const selected = dateStr === value;
            const isToday = isSameDay(year, month, day, today);
            const isHighlighted = highlightDate !== undefined && dateStr === highlightDate;
            const disabled =
              (minDate !== undefined && dateStr < minDate) ||
              (maxDate !== undefined && dateStr > maxDate) ||
              unavailableSet.has(dateStr);

            return (
              <button
                key={day}
                type="button"
                role="gridcell"
                aria-selected={selected}
                disabled={disabled}
                onClick={() => handleSelect(dateStr)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors',
                  selected && 'bg-primary font-medium text-white',
                  !selected && isHighlighted && 'bg-primary/10 font-medium text-primary ring-1 ring-primary/30',
                  !selected && !isHighlighted && isToday && 'border border-primary font-medium text-primary',
                  !selected && !isHighlighted && !isToday && !disabled && 'text-slate-700 hover:bg-slate-100',
                  disabled && 'cursor-not-allowed text-slate-300'
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
