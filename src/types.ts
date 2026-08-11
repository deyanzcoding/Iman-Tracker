/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NamazState = 0 | 1 | 2; // 0: Not set, 1: Prayed, 2: Missed

export interface DayNamaz {
  Fajr: NamazState;
  Dhuhr: NamazState;
  Asr: NamazState;
  Maghrib: NamazState;
  Isha: NamazState;
}

export type NamazData = Record<string, Partial<DayNamaz>>;

export interface Zikar {
  id: number;
  name: string;
  arabic?: string;
  translation?: string;
  target: number;
  daily: number; // sessions per day
  sessions: number[]; // counts for each session, e.g. [33, 10, 0]
  currentSession: number; // active session index
  completedDates: string[]; // dates when all sessions were fully done
}

export interface SyncItem {
  id: string;
  type: 'namaz' | 'zikar';
  date?: string;
  prayer?: string;
  zikarId?: number;
  value?: number;
  timestamp: number;
}

export interface AppState {
  namaz: NamazData;
  duas: Zikar[];
  deletedDuas: Zikar[];
  goal: number; zikarGoal: number; quranGoal: number;
  bestStreak: number;
  dark: boolean;
  lastActiveDate: string;
  pendingSyncQueue?: SyncItem[];
}

export const PRAYERS = [
  { k: 'Fajr', label: 'Fajr', sub: 'Dawn' },
  { k: 'Dhuhr', label: 'Dhuhr', sub: 'Midday' },
  { k: 'Asr', label: 'Asr', sub: 'Afternoon' },
  { k: 'Maghrib', label: 'Maghrib', sub: 'Sunset' },
  { k: 'Isha', label: 'Isha', sub: 'Night' }
] as const;

export type PrayerKey = (typeof PRAYERS)[number]['k'];
