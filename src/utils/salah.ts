/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SalahTimings {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Sunrise?: string;
  Sunset?: string;
}

export interface SalahSettings {
  enabled: boolean;
  leadMinutes: number; // 0 = at prayer time, 5 = 5m before, 10 = 10m before, 15 = 15m before
  city: string;
  country: string;
  useGps: boolean;
  lat?: number;
  lng?: number;
  lastFetchedDate?: string;
  timings: SalahTimings;
  hijriDate?: string;
}

export const DEFAULT_SALAH_SETTINGS: SalahSettings = {
  enabled: false,
  leadMinutes: 5,
  city: 'Mecca',
  country: 'Saudi Arabia',
  useGps: false,
  timings: {
    Fajr: '04:30',
    Dhuhr: '12:20',
    Asr: '15:45',
    Maghrib: '18:50',
    Isha: '20:15'
  }
};

const SALAH_SETTINGS_KEY = 'iman_tracker_salah_settings';

export function getStoredSalahSettings(): SalahSettings {
  try {
    const raw = localStorage.getItem(SALAH_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SALAH_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to read Salah settings', e);
  }
  return DEFAULT_SALAH_SETTINGS;
}

export function saveStoredSalahSettings(settings: SalahSettings): void {
  try {
    localStorage.setItem(SALAH_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save Salah settings', e);
  }
}

/**
 * Fetch Salah times using Aladhan API by coordinates
 */
export async function fetchTimingsByCoords(
  lat: number,
  lng: number
): Promise<{ timings: SalahTimings; hijriDate: string; city?: string; country?: string }> {
  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=2`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Aladhan API error: ${res.statusText}`);
  const json = await res.json();
  const t = json.data.timings;
  const h = json.data.date.hijri;
  const hijriStr = `${h.day} ${h.month.en} ${h.year} AH`;

  // Standardize time format to HH:MM
  const cleanTime = (timeStr: string) => (timeStr ? timeStr.split(' ')[0] : '00:00');

  let city: string | undefined;
  let country: string | undefined;

  // Attempt reverse geocoding for city & country name
  try {
    const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const geoRes = await fetch(geoUrl);
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      city = geoData.city || geoData.locality || geoData.principalSubdivision;
      country = geoData.countryName;
    }
  } catch (err) {
    console.warn('Reverse geocode failed, using coordinates fallback', err);
  }

  return {
    timings: {
      Fajr: cleanTime(t.Fajr),
      Dhuhr: cleanTime(t.Dhuhr),
      Asr: cleanTime(t.Asr),
      Maghrib: cleanTime(t.Maghrib),
      Isha: cleanTime(t.Isha),
      Sunrise: cleanTime(t.Sunrise),
      Sunset: cleanTime(t.Sunset)
    },
    hijriDate: hijriStr,
    city: city || `GPS (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
    country: country || ''
  };
}

/**
 * Convert 24-hour time string (e.g. "15:45" or "04:30") to 12-hour AM/PM format ("3:45 PM", "4:30 AM")
 */
export function format12HourTime(time24?: string): string {
  if (!time24) return '--:--';
  const clean = time24.split(' ')[0];
  const parts = clean.split(':');
  if (parts.length < 2) return time24;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return time24;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Fetch Salah times using Aladhan API by city and country
 */
export async function fetchTimingsByCity(city: string, country: string = ''): Promise<{ timings: SalahTimings; hijriDate: string }> {
  const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=2`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Aladhan API error: ${res.statusText}`);
  const json = await res.json();
  const t = json.data.timings;
  const h = json.data.date.hijri;
  const hijriStr = `${h.day} ${h.month.en} ${h.year} AH`;

  const cleanTime = (timeStr: string) => timeStr ? timeStr.split(' ')[0] : '00:00';

  return {
    timings: {
      Fajr: cleanTime(t.Fajr),
      Dhuhr: cleanTime(t.Dhuhr),
      Asr: cleanTime(t.Asr),
      Maghrib: cleanTime(t.Maghrib),
      Isha: cleanTime(t.Isha),
      Sunrise: cleanTime(t.Sunrise),
      Sunset: cleanTime(t.Sunset)
    },
    hijriDate: hijriStr
  };
}

/**
 * Request Browser Notification Permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

/**
 * Trigger Browser Notification for Salah
 */
export function sendSalahNotification(prayerName: string, leadMinutes: number): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const title = leadMinutes === 0
    ? `🕌 Time for ${prayerName} Prayer`
    : `🕌 ${prayerName} Prayer in ${leadMinutes} Minutes`;

  const body = leadMinutes === 0
    ? `It is now time for ${prayerName}. Take a moment to offer your Namaz and log your progress in Iman Tracker. 🤲`
    : `${prayerName} prayer time is approaching in ${leadMinutes} minutes. Prepare for wudu and prayer. 🤲`;

  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `salah-${prayerName}-${Date.now()}`
    });
  } catch (e) {
    console.error('Failed to trigger notification', e);
  }
}
