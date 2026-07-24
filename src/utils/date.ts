/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTH_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export function fmtDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function today(): string {
  const d = new Date();
  return fmtDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function thisYear(): number {
  return new Date().getFullYear();
}

export function thisMonth(): number {
  return new Date().getMonth() + 1;
}

export function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

/**
 * Returns date strings for the current week (Monday to Sunday)
 */
export function weekDates(): string[] {
  const now = new Date();
  // Get current day of week (0 is Sunday, 1 is Monday... 6 is Saturday)
  const currentDay = now.getDay();
  // We want Monday as start. Monday is 1, Tuesday is 2... Sunday is 0.
  // Map currentDay so Monday is 0, Tuesday is 1... Sunday is 6.
  const dow = currentDay === 0 ? 6 : currentDay - 1;
  
  const mon = new Date(now);
  mon.setDate(now.getDate() - dow);
  
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return fmtDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  });
}

/**
 * Returns date strings for all days in the given month of the given year
 */
export function monthDates(y: number, m: number): string[] {
  return Array.from({ length: daysInMonth(y, m) }, (_, i) => fmtDate(y, m, i + 1));
}
