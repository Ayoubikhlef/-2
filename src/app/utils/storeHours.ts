/**
 * Store opening hours, evaluated in Africa/Algiers time.
 *
 * The schedule mirrors `brand.contact.workingHours` ("Sat - Thu: 08:00 - 19:00")
 * and is deliberately hard-coded: parsing a translated sentence is fragile, and
 * a wrong "open now" badge is worse than none. Change the two constants below if
 * the shop ever changes its hours.
 */
export const OPEN_MINUTES = 8 * 60; // 08:00
export const CLOSE_MINUTES = 19 * 60; // 19:00
/** JS day numbers that the shop is open. Friday (5) is closed. */
const OPEN_DAYS = new Set([0, 1, 2, 3, 4, 6]); // Sun..Thu + Sat

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface StoreStatus {
  open: boolean;
  /** "08:00" / "19:00" in Algiers local time. */
  opensAt: string;
  closesAt: string;
  dayIndex: number;
  minutes: number;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function algeriaClock(date: Date): { dayIndex: number; minutes: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Algiers',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const weekday = parts.find((part) => part.type === 'weekday')?.value || 'Mon';
    const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0) % 24;
    const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
    return {
      dayIndex: WEEKDAY_INDEX[weekday] ?? date.getDay(),
      minutes: hour * 60 + minute,
    };
  } catch {
    return { dayIndex: date.getDay(), minutes: date.getHours() * 60 + date.getMinutes() };
  }
}

export function getStoreStatus(now: Date = new Date()): StoreStatus {
  const { dayIndex, minutes } = algeriaClock(now);
  const open = OPEN_DAYS.has(dayIndex) && minutes >= OPEN_MINUTES && minutes < CLOSE_MINUTES;
  return {
    open,
    opensAt: `${pad(Math.floor(OPEN_MINUTES / 60))}:${pad(OPEN_MINUTES % 60)}`,
    closesAt: `${pad(Math.floor(CLOSE_MINUTES / 60))}:${pad(CLOSE_MINUTES % 60)}`,
    dayIndex,
    minutes,
  };
}

/**
 * 0 = opens later today, otherwise how many days until the next opening day.
 * Returns 1 when the shop is already closed today.
 */
export function nextOpeningDayOffset(now: Date = new Date()): number {
  const { dayIndex, minutes } = algeriaClock(now);
  if (OPEN_DAYS.has(dayIndex) && minutes < OPEN_MINUTES) return 0;
  for (let offset = 1; offset <= 7; offset++) {
    if (OPEN_DAYS.has((dayIndex + offset) % 7)) return offset;
  }
  return 1;
}
