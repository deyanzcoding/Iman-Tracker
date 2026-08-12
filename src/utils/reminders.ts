/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { playSalahAlarmSound, unlockAudioContext } from './salah';

export interface ReminderItem {
  id: string;
  name: string;
  time: string; // "HH:MM" e.g. "08:00"
  enabled: boolean;
}

export interface IslamicBannerAlertData {
  id: string;
  type: 'namaz' | 'zikar' | 'quran';
  title: string;
  body: string;
  quote: string;
  tab: 'namaz' | 'dua' | 'quran';
}

export interface ZikarSettings {
  enabled: boolean;
  items: ReminderItem[];
}

export interface QuranSettings {
  enabled: boolean;
  items: ReminderItem[];
}

export const DEFAULT_ZIKAR_ITEMS: ReminderItem[] = [
  { id: 'zikar-morning', name: 'Morning Azkar', time: '08:00', enabled: true },
  { id: 'zikar-evening', name: 'Evening Azkar', time: '17:00', enabled: true }
];

export const DEFAULT_QURAN_ITEMS: ReminderItem[] = [
  { id: 'quran-fajr', name: 'Morning after Fajr', time: '06:00', enabled: true }
];

export const DEFAULT_ZIKAR_SETTINGS: ZikarSettings = {
  enabled: false,
  items: DEFAULT_ZIKAR_ITEMS
};

export const DEFAULT_QURAN_SETTINGS: QuranSettings = {
  enabled: false,
  items: DEFAULT_QURAN_ITEMS
};

const ZIKAR_SETTINGS_KEY = 'iman_tracker_zikar_settings';
const QURAN_SETTINGS_KEY = 'iman_tracker_quran_settings';

export function getStoredZikarSettings(): ZikarSettings {
  try {
    const raw = localStorage.getItem(ZIKAR_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Backward compatibility handling for older schema
      if (Array.isArray(parsed.items)) {
        return { enabled: parsed.enabled ?? false, items: parsed.items };
      }
      if (parsed.morningTime || parsed.eveningTime) {
        return {
          enabled: parsed.enabled ?? false,
          items: [
            { id: 'zikar-m', name: 'Morning Azkar', time: parsed.morningTime || '08:00', enabled: true },
            { id: 'zikar-e', name: 'Evening Azkar', time: parsed.eveningTime || '17:00', enabled: true }
          ]
        };
      }
    }
  } catch (e) {
    console.error('Failed to load Zikar settings', e);
  }
  return DEFAULT_ZIKAR_SETTINGS;
}

export function saveStoredZikarSettings(settings: ZikarSettings): void {
  try {
    localStorage.setItem(ZIKAR_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save Zikar settings', e);
  }
}

export function getStoredQuranSettings(): QuranSettings {
  try {
    const raw = localStorage.getItem(QURAN_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Backward compatibility handling for older schema
      if (Array.isArray(parsed.items)) {
        return { enabled: parsed.enabled ?? false, items: parsed.items };
      }
      if (parsed.dailyTime) {
        return {
          enabled: parsed.enabled ?? false,
          items: [
            { id: 'quran-fajr', name: 'Morning after Fajr', time: parsed.dailyTime || '06:00', enabled: true }
          ]
        };
      }
    }
  } catch (e) {
    console.error('Failed to load Quran settings', e);
  }
  return DEFAULT_QURAN_SETTINGS;
}

export function saveStoredQuranSettings(settings: QuranSettings): void {
  try {
    localStorage.setItem(QURAN_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save Quran settings', e);
  }
}

export const ISLAMIC_MOTIVATIONS = {
  namaz: [
    "\"Indeed, prayer prohibits immorality and wrongdoing.\" — Surah Al-Ankabut (29:45)",
    "\"Successful indeed are the believers who are humble in their prayers.\" — Surah Al-Mu'minun (23:1-2)",
    "\"Establish prayer, for prayer at set times has been enjoined upon the believers.\" — Surah An-Nisa (4:103)",
    "\"The key to Paradise is Salah (prayer).\" — Prophet Muhammad ﷺ (Sunan al-Tirmidhi)",
    "\"The first thing for which a servant will be called to account on Resurrection Day is Salah.\" — Prophet Muhammad ﷺ"
  ],
  zikar: [
    "\"Unquestionably, by the remembrance of Allah hearts find rest.\" — Surah Ar-Ra'd (13:28)",
    "\"So remember Me; I will remember you.\" — Surah Al-Baqarah (2:152)",
    "\"The comparison of one who remembers his Lord and one who does not is like that of the living and the dead.\" — Prophet Muhammad ﷺ (Sahih Bukhari)",
    "\"Keep your tongue wet with the remembrance of Allah.\" — Prophet Muhammad ﷺ (Sunan al-Tirmidhi)",
    "\"There are two phrases that are light on the tongue but heavy on the scale: SubhanAllahi wa bihamdihi, SubhanAllahil Adheem.\" — Sahih Bukhari"
  ],
  quran: [
    "\"The best among you are those who learn the Quran and teach it.\" — Prophet Muhammad ﷺ (Sahih Bukhari)",
    "\"Recite the Quran, for it will come on the Day of Resurrection as an intercessor for its companions.\" — Prophet Muhammad ﷺ (Sahih Muslim)",
    "\"This is a blessed Book which We have revealed to you, that they might reflect upon its verses.\" — Surah Sad (38:29)",
    "\"Whoever recites a letter from the Book of Allah will receive ten good deeds for it.\" — Sunan al-Tirmidhi",
    "\"Verily the one who recites the Quran beautifully, smoothly, and precisely will be in the company of noble angels.\" — Sahih Bukhari"
  ]
};

export function getRandomMotivation(type: 'namaz' | 'zikar' | 'quran'): string {
  const list = ISLAMIC_MOTIVATIONS[type];
  return list[Math.floor(Math.random() * list.length)];
}

export async function sendIslamicNotification(options: {
  type: 'namaz' | 'zikar' | 'quran';
  title: string;
  body: string;
  quote?: string;
  tab: 'namaz' | 'dua' | 'quran';
}) {
  unlockAudioContext();
  playSalahAlarmSound();

  const notificationTitle = options.title;
  const notificationBody = options.body;
  const notificationData = {
    url: `/${options.tab}`,
    tab: options.tab,
    type: options.type
  };

  // 1. Try ServiceWorker Registration showNotification for persistent PWA notifications
  if ('serviceWorker' in navigator && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          const swOptions: NotificationOptions & { requireInteraction?: boolean } = {
            body: notificationBody,
            icon: '/favicon_192_x_192.png',
            badge: '/favicon_32_x_32.png',
            tag: `${options.type}-${Date.now()}`,
            requireInteraction: true,
            data: notificationData
          };
          await registration.showNotification(notificationTitle, swOptions as NotificationOptions);
          return;
        }
      } catch (err) {
        console.warn('ServiceWorker showNotification failed, falling back to standard Notification:', err);
      }
    } else if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        sendIslamicNotification(options);
        return;
      }
    }
  }

  // 2. Fallback to standard Browser Notification object
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(notificationTitle, {
          body: notificationBody,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `${options.type}-${Date.now()}`,
          data: notificationData
        });

        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('open_islamic_tab', { detail: { tab: options.tab } })
            );
          }
        };
      } catch (e) {
        console.error('Failed to trigger native browser notification', e);
      }
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          sendIslamicNotification(options);
        }
      });
    }
  }
}
