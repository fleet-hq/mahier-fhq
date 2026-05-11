'use client';

import { useState, useRef, useCallback, useMemo, useEffect, type ReactNode, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks';
import { buildBranchTimeSlots, type TimeSlot } from '@/lib/branch-time';

export interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  interval?: number;
  icon?: ReactNode;
  className?: string;
  'aria-label'?: string;
  /**
   * Optional branch operational hours. When supplied, the picker only
   * exposes slots that fall inside ``[minTime, maxTime)``. Format is
   * ``HH:mm`` or ``HH:mm:ss``.
   */
  minTime?: string | null;
  maxTime?: string | null;
  disabled?: boolean;
}

const PANEL_HEIGHT = 260;
const GAP = 8;

function formatTimeDisplay(value: string): string {
  const parts = value.split(':');
  const hours = parseInt(parts[0] ?? '0', 10);
  const minutes = parts[1] ?? '00';
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes} ${period}`;
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'Select Time',
  interval = 30,
  icon,
  className,
  'aria-label': ariaLabel,
  minTime,
  maxTime,
  disabled = false,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({ position: 'fixed' });
  const [originClass, setOriginClass] = useState('origin-top');

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setIsOpen(false), []);
  useClickOutside(containerRef, close, isOpen);

  // Slot list reflects the branch operational window when supplied. When
  // ``minTime``/``maxTime`` are missing the helper falls back to a full
  // 24-hour grid so the picker stays usable for unconfigured branches.
  const timeSlots = useMemo<TimeSlot[]>(
    () =>
      buildBranchTimeSlots(
        { start: minTime ?? null, end: maxTime ?? null, timezone: null },
        interval,
      ),
    [minTime, maxTime, interval],
  );

  // If the currently-selected value is no longer in the (possibly
  // narrower) slot list — e.g. the user just changed pickup location to
  // a branch that closes earlier — clear it so the form can't submit a
  // time the branch isn't open for.
  useEffect(() => {
    if (!value) return;
    if (!timeSlots.some((slot) => slot.value === value)) {
      onChange('');
    }
  }, [timeSlots, value, onChange]);

  // Auto-scroll to selected time when dropdown opens
  useEffect(() => {
    if (isOpen && selectedRef.current && listRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen]);

  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < PANEL_HEIGHT && rect.top > PANEL_HEIGHT;

    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 168));

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
    setIsOpen(true);
  }, [computePosition]);

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
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
    } else {
      openDropdown();
    }
  }, [disabled, isOpen, openDropdown]);

  const handleSelect = useCallback(
    (slotValue: string) => {
      onChange(slotValue);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [onChange]
  );

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

  return (
    <div ref={containerRef} className={cn('relative', className)} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        disabled={disabled}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={cn(
          'flex items-center gap-2 p-0',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        )}
      >
        {icon}
        <span className={cn('text-sm', value ? 'text-slate-700' : 'text-neutral-placeholder')}>
          {value ? formatTimeDisplay(value) : placeholder}
        </span>
      </button>

      <div
        role="listbox"
        aria-label="Select time"
        style={dropdownStyle}
        className={cn(
          'z-50 min-w-40 rounded-lg border border-slate-200 bg-white shadow-lg transition-all duration-200 ease-out',
          originClass,
          isOpen ? 'scale-y-100 opacity-100' : 'pointer-events-none scale-y-0 opacity-0'
        )}
      >
        <div ref={listRef} className="max-h-60 overflow-y-auto py-1">
          {timeSlots.map((slot) => {
            const selected = slot.value === value;
            return (
              <button
                key={slot.value}
                ref={selected ? selectedRef : undefined}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => handleSelect(slot.value)}
                className={cn(
                  'flex w-full px-4 py-2 text-left text-sm transition-colors',
                  selected ? 'bg-slate-100 font-medium text-primary' : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
