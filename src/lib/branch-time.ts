/**
 * Branch-aware time utilities for the customer-facing booking flow.
 *
 * Two responsibilities:
 *   1. Generate the set of pickup/return time slots that fall inside a
 *      branch's operational window (e.g. 09:00–18:00).
 *   2. Provide a friendly label for the timezone we're displaying so the
 *      customer always knows which clock they're on.
 *
 * The functions here intentionally take primitive ``HH:mm[:ss]`` strings
 * — not Date objects — because the backend stores branch hours as
 * ``TimeField`` and the customer-facing UI never needs full datetime math.
 */

export interface BranchHours {
  /** ``HH:mm:ss`` (or ``HH:mm``). */
  start: string | null;
  /** ``HH:mm:ss`` (or ``HH:mm``). */
  end: string | null;
  /** IANA timezone like ``"America/Anchorage"``. */
  timezone: string | null;
}

/** Parse ``HH:mm[:ss]`` into total minutes since midnight. */
export function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const parts = value.split(':').map((part) => parseInt(part, 10));
  const h = parts[0];
  const m = parts[1];
  if (h == null || m == null || Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** Format total-minutes-since-midnight back to ``HH:mm`` (24-hour). */
export function formatMinutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface TimeSlot {
  value: string;
  label: string;
}

function format12HourLabel(hours: number, minutes: number): string {
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Build the list of selectable time slots for a branch.
 *
 * - When ``start`` and ``end`` are missing, returns a full 24-hour grid
 *   so the picker stays usable for branches without configured hours.
 * - When ``end <= start`` (e.g. configuration error or 24h spec), returns
 *   the full 24-hour grid so we never produce an empty list that strands
 *   the user mid-booking.
 * - The returned slots are inclusive of ``start`` and exclusive of ``end``,
 *   matching how operational hours conventionally work ("open 9, close 18"
 *   = last bookable slot is 17:30 for a 30-min interval).
 */
export function buildBranchTimeSlots(
  hours: BranchHours,
  intervalMinutes = 30,
): TimeSlot[] {
  const startMin = parseTimeToMinutes(hours.start) ?? 0;
  const endMin = parseTimeToMinutes(hours.end) ?? 24 * 60;

  const lower = endMin > startMin ? startMin : 0;
  const upper = endMin > startMin ? endMin : 24 * 60;

  const slots: TimeSlot[] = [];
  for (let minutes = lower; minutes < upper; minutes += intervalMinutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    slots.push({
      value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      label: format12HourLabel(h, m),
    });
  }
  return slots;
}

/**
 * Human-readable timezone label for the caption beneath time pickers.
 *
 * Falls back to the user's local timezone when the branch hasn't been
 * configured with one — and notes that explicitly so customers aren't
 * confused about which clock they're looking at.
 */
export function formatTimezoneCaption(timezone: string | null | undefined): string {
  if (timezone) {
    return `Times shown in branch local time (${timezone})`;
  }
  let local = '';
  try {
    local = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    local = '';
  }
  return local
    ? `Times shown in your local time (${local})`
    : 'Times shown in your local time';
}
