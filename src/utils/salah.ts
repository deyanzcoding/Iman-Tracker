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
 * Global Web Audio Context reference for mobile playback
 */
let globalAudioCtx: AudioContext | null = null;

export function unlockAudioContext(): void {
  try {
    if (!globalAudioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        globalAudioCtx = new AudioContextClass();
      }
    }
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume();
    }
  } catch (e) {
    console.warn('Failed to unlock audio context:', e);
  }
}

/**
 * Automatically unlock Web Audio API on first user tap/click on mobile screen
 */
export function initAudioUnlockListener(): void {
  if (typeof window === 'undefined') return;
  const handleInteraction = () => {
    unlockAudioContext();
    window.removeEventListener('click', handleInteraction);
    window.removeEventListener('touchstart', handleInteraction);
    window.removeEventListener('keydown', handleInteraction);
  };
  window.addEventListener('click', handleInteraction, { passive: true });
  window.addEventListener('touchstart', handleInteraction, { passive: true });
  window.addEventListener('keydown', handleInteraction, { passive: true });
}

/**
 * Play a soothing, harmonic Islamic Prayer Chime / Alarm sound
 */
export function playSalahAlarmSound(): void {
  try {
    unlockAudioContext();
    if (!globalAudioCtx) return;

    // Harmonious Islamic prayer chime sequence (E4, A4, B4, E5) with resonance
    const notes = [
      { freq: 329.63, duration: 0.6, delay: 0 },
      { freq: 440.00, duration: 0.8, delay: 0.5 },
      { freq: 493.88, duration: 0.8, delay: 1.1 },
      { freq: 659.25, duration: 1.4, delay: 1.7 }
    ];

    const now = globalAudioCtx.currentTime;

    notes.forEach((note) => {
      const osc = globalAudioCtx!.createOscillator();
      const gain = globalAudioCtx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.delay);

      // Smooth envelope for gentle chime
      gain.gain.setValueAtTime(0, now + note.delay);
      gain.gain.linearRampToValueAtTime(0.35, now + note.delay + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.delay + note.duration);

      osc.connect(gain);
      gain.connect(globalAudioCtx!.destination);

      osc.start(now + note.delay);
      osc.stop(now + note.delay + note.duration);
    });

    // Mobile vibration if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 200, 300, 200, 500]);
    }
  } catch (e) {
    console.error('Error playing alarm sound:', e);
  }
}

/**
 * Request Browser Notification Permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // Always unlock audio when user interacts with permission
  unlockAudioContext();

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

import { sendIslamicNotification, getRandomMotivation } from './reminders';

/**
 * Trigger Browser Notification, Audio Alarm, and In-App Banner for Salah
 */
export function sendSalahNotification(prayerName: string, leadMinutes: number): void {
  const title = leadMinutes === 0
    ? `🕌 Time for ${prayerName} Prayer`
    : `🕌 ${prayerName} Prayer in ${leadMinutes} Minutes`;

  const body = leadMinutes === 0
    ? `It is now time for ${prayerName}. Take a moment to offer your Namaz and log your progress. 🤲`
    : `${prayerName} prayer time is approaching in ${leadMinutes} minutes. Prepare for wudu and prayer. 🤲`;

  const quote = getRandomMotivation('namaz');

  sendIslamicNotification({
    type: 'namaz',
    title,
    body,
    quote,
    tab: 'namaz'
  });
}
