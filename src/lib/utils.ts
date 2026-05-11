import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a date string without shifting the calendar day across
 * timezones. JS spec interprets bare "YYYY-MM-DD" as UTC midnight,
 * so a customer in NY (GMT-4) seeing pickupDate=2026-05-09 would
 * render it as "May 8 20:00 local" — exactly the bug Lucas reported.
 * For pure date strings we anchor to LOCAL midnight instead; full
 * ISO strings (with time) are passed through so timezone-aware
 * backend datetimes still work as before.
 */
function parseDateLocal(date: Date | string): Date {
  if (date instanceof Date) return date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Date(date + 'T00:00:00');
  return new Date(date);
}

/**
 * Today's date as YYYY-MM-DD in the **viewer's local timezone**. Use
 * this anywhere you'd previously have written
 * `new Date().toISOString().split('T')[0]` — that idiom is UTC-based,
 * so a NY user (GMT-4) at 11pm local sees "tomorrow" as today and
 * loses the ability to pick today in date pickers. Same flavour of
 * bug as Lucas reported on dates: pick May 9, see May 8.
 */
export function todayLocalISODate(): string {
  return localISODate(new Date());
}

/**
 * Convert a Date to YYYY-MM-DD using its **local** components rather
 * than UTC. Used by date pickers (minDate, etc.) where the value is
 * compared against user-picked YYYY-MM-DD strings.
 */
export function localISODate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDate(date: Date | string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(parseDateLocal(date));
}

/**
 * Format a date string for display with day-of-week, e.g. "Wed. 05 Mar, 2025"
 */
export function formatDateForDisplay(dateStr: string): string {
  const date = parseDateLocal(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}. ${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

/**
 * Format a date string with time, e.g. "January 5, 2025 at 9:00 AM"
 */
export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  return parseDateLocal(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
