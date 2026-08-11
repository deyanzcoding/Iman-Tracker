/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, MapPin, Navigation, Clock, CheckCircle, AlertCircle, Volume2 } from 'lucide-react';
import {
  SalahSettings,
  getStoredSalahSettings,
  saveStoredSalahSettings,
  fetchTimingsByCity,
  fetchTimingsByCoords,
  requestNotificationPermission,
  sendSalahNotification,
  format12HourTime
} from '../utils/salah';

interface SalahRemindersSettingsProps {
  showToast?: (msg: string) => void;
  onSettingsChange?: (newSettings: SalahSettings) => void;
}

export default function SalahRemindersSettings({ showToast, onSettingsChange }: SalahRemindersSettingsProps) {
  const [settings, setSettings] = useState<SalahSettings>(getStoredSalahSettings());
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(
    'Notification' in window && Notification.permission === 'granted'
  );

  const [cityInput, setCityInput] = useState(settings.city || 'Mecca');
  const [countryInput, setCountryInput] = useState(settings.country || 'Saudi Arabia');

  useEffect(() => {
    // Check permission status periodically or on mount
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  const updateAndSave = (updated: SalahSettings) => {
    setSettings(updated);
    saveStoredSalahSettings(updated);
    if (onSettingsChange) onSettingsChange(updated);
  };

  const handleToggleEnable = async () => {
    if (!settings.enabled) {
      const granted = await requestNotificationPermission();
      setPermissionGranted(granted);
      if (!granted) {
        if (showToast) showToast('⚠️ Browser notification permission is required for prayer alerts');
      }
      const updated = { ...settings, enabled: true };
      updateAndSave(updated);
      if (showToast) showToast('🔔 Salah reminders enabled');
    } else {
      const updated = { ...settings, enabled: false };
      updateAndSave(updated);
      if (showToast) showToast('🔕 Salah reminders disabled');
    }
  };

  const handleFetchCity = async () => {
    if (!cityInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetchTimingsByCity(cityInput.trim(), countryInput.trim());
      const updated: SalahSettings = {
        ...settings,
        city: cityInput.trim(),
        country: countryInput.trim(),
        useGps: false,
        timings: res.timings,
        hijriDate: res.hijriDate,
        lastFetchedDate: new Date().toISOString()
      };
      updateAndSave(updated);
      if (showToast) showToast(`🕌 Prayer times updated for ${cityInput.trim()}`);
    } catch (e: any) {
      console.error(e);
      if (showToast) showToast('❌ Failed to fetch prayer times. Please check city name.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseGps = () => {
    if (!('geolocation' in navigator)) {
      if (showToast) showToast('GPS is not supported on this device');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const res = await fetchTimingsByCoords(lat, lng);
          const detectedCity = res.city || 'GPS Location';
          const detectedCountry = res.country || '';
          
          const updated: SalahSettings = {
            ...settings,
            useGps: true,
            lat,
            lng,
            city: detectedCity,
            country: detectedCountry,
            timings: res.timings,
            hijriDate: res.hijriDate,
            lastFetchedDate: new Date().toISOString()
          };
          setCityInput(detectedCity);
          setCountryInput(detectedCountry);
          updateAndSave(updated);
          if (showToast) showToast(`📍 Location set to ${detectedCity}: Prayer times updated`);
        } catch (e) {
          console.error(e);
          if (showToast) showToast('Failed to fetch times for current coordinates');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setLoading(false);
        if (showToast) showToast('Unable to access GPS location. Please check browser permissions.');
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    if (!granted) {
      if (showToast) showToast('⚠️ Browser notification permission is not granted');
      return;
    }
    sendSalahNotification('Test Prayer Alert', settings.leadMinutes);
    if (showToast) showToast('🔔 Test notification sent!');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="p-4 bg-[var(--surface2)] border border-[var(--border)] rounded-2xl flex flex-col gap-4 shadow-sm">
        
        {/* Toggle Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--text)]">Salah Reminders & Alerts</div>
              <div className="text-[10px] font-semibold text-[var(--text3)]">
                {settings.enabled ? 'Notifications Active' : 'Notifications Disabled'}
              </div>
            </div>
          </div>

          <button
            onClick={handleToggleEnable}
            className={`w-12 h-6 rounded-full relative p-0.5 border transition-all ${
              settings.enabled ? 'bg-amber-500 border-amber-500' : 'bg-[var(--border2)] border-[var(--border)]'
            }`}
          >
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-[18px] h-[18px] rounded-full bg-white shadow-md"
              style={{ float: settings.enabled ? 'right' : 'left' }}
            />
          </button>
        </div>

        {/* Extended Notification Controls when enabled */}
        {settings.enabled && (
          <div className="flex flex-col gap-4 pt-3 border-t border-[var(--border)] animate-fade-in">
            
            {/* Permission status warning if needed */}
            {!permissionGranted && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Browser notifications are required for background alerts.</span>
                <button
                  onClick={requestNotificationPermission}
                  className="ml-auto underline font-black text-amber-500 hover:text-amber-600"
                >
                  Enable
                </button>
              </div>
            )}

            {/* Alert Timing Selection */}
            <div>
              <label className="text-[11px] font-bold text-[var(--text2)] uppercase tracking-wider block mb-1.5">
                Notification Lead Time
              </label>
              <select
                value={settings.leadMinutes}
                onChange={(e) => updateAndSave({ ...settings, leadMinutes: parseInt(e.target.value) })}
                className="w-full p-3 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs font-bold outline-none focus:border-amber-500 cursor-pointer transition-colors"
              >
                <option value={0}>At Prayer Time (Exact)</option>
                <option value={5}>5 Minutes Before Prayer</option>
                <option value={10}>10 Minutes Before Prayer</option>
                <option value={15}>15 Minutes Before Prayer</option>
              </select>
            </div>

            {/* Location Configurator */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-[var(--text2)] uppercase tracking-wider block">
                Location & City (Aladhan API)
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="City (e.g. Karachi)"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="p-3 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs font-bold outline-none focus:border-amber-500 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Country (Optional)"
                  value={countryInput}
                  onChange={(e) => setCountryInput(e.target.value)}
                  className="p-3 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs font-bold outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleFetchCity}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{loading ? 'Fetching...' : 'Update City'}</span>
                </button>
                
                <button
                  onClick={handleUseGps}
                  disabled={loading}
                  className="py-2.5 px-3 rounded-xl bg-[var(--surface3)] hover:bg-[var(--border)] text-[var(--text)] font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  title="Detect GPS Location"
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden xs:inline">Detect GPS</span>
                </button>
              </div>
            </div>

            {/* Timings Display Card */}
            <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text3)] border-b border-[var(--border)] pb-2">
                <span className="flex items-center gap-1 text-amber-500 font-extrabold uppercase">
                  <Clock className="w-3 h-3" /> Today's Prayer Times
                </span>
                <span>{settings.hijriDate || 'Aladhan Verified'}</span>
              </div>

              <div className="grid grid-cols-5 gap-1 text-center pt-1">
                {[
                  { name: 'Fajr', time: settings.timings.Fajr },
                  { name: 'Dhuhr', time: settings.timings.Dhuhr },
                  { name: 'Asr', time: settings.timings.Asr },
                  { name: 'Maghrib', time: settings.timings.Maghrib },
                  { name: 'Isha', time: settings.timings.Isha }
                ].map((p) => (
                  <div key={p.name} className="flex flex-col items-center bg-[var(--surface2)] p-2 rounded-lg border border-[var(--border)]">
                    <span className="text-[9px] font-extrabold text-[var(--text3)] uppercase">{p.name}</span>
                    <span className="text-[11px] font-black text-[var(--text)] mt-0.5 whitespace-nowrap">
                      {format12HourTime(p.time)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Notification Trigger */}
            <button
              onClick={handleTestNotification}
              className="w-full py-2.5 rounded-xl border border-dashed border-amber-500/40 hover:bg-amber-500/5 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span>Test Prayer Notification Alert</span>
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
