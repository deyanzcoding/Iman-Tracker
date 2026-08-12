/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  MapPin,
  Navigation,
  Clock,
  AlertCircle,
  Volume2,
  ChevronDown,
  ChevronUp,
  Edit3,
  RotateCcw,
  Check
} from 'lucide-react';
import {
  SalahSettings,
  SalahTimings,
  getStoredSalahSettings,
  saveStoredSalahSettings,
  fetchTimingsByCity,
  fetchTimingsByCoords,
  requestNotificationPermission,
  sendSalahNotification,
  playSalahAlarmSound,
  unlockAudioContext,
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

  // Accordion expansion state to save screen space
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  // Custom manual time edit mode
  const [isEditingTimes, setIsEditingTimes] = useState<boolean>(false);

  const [cityInput, setCityInput] = useState(settings.city || 'Mecca');
  const [countryInput, setCountryInput] = useState(settings.country || 'Saudi Arabia');

  useEffect(() => {
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
      if (!granted && showToast) {
        showToast('⚠️ Browser notification permission is required for popup alerts');
      }
      unlockAudioContext();
      const updated = { ...settings, enabled: true };
      updateAndSave(updated);
      setIsExpanded(true); // Open accordion on enable so user can review/edit
      if (showToast) showToast('🔔 Salah alarm reminders enabled');
    } else {
      const updated = { ...settings, enabled: false };
      updateAndSave(updated);
      setIsExpanded(false);
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
        if (showToast) showToast('Unable to access GPS location. Please check permissions.');
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  const handleCustomTimeChange = (key: keyof SalahTimings, val: string) => {
    if (!val) return;
    const updatedTimings: SalahTimings = {
      ...settings.timings,
      [key]: val
    };
    const updated: SalahSettings = {
      ...settings,
      timings: updatedTimings
    };
    updateAndSave(updated);
  };

  const handleResetToAutoTimes = async () => {
    if (showToast) showToast('🔄 Resetting to automatic city prayer times...');
    await handleFetchCity();
    setIsEditingTimes(false);
  };

  const handleTestAudioAndNotification = async () => {
    unlockAudioContext();
    playSalahAlarmSound();

    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);

    sendSalahNotification('Test Prayer Alert', settings.leadMinutes);

    if (showToast) {
      showToast('🔊 Playing test audio chime! Audio context unlocked for mobile PWA.');
    }
  };

  const prayerList: { name: keyof SalahTimings; label: string }[] = [
    { name: 'Fajr', label: 'Fajr' },
    { name: 'Dhuhr', label: 'Dhuhr' },
    { name: 'Asr', label: 'Asr' },
    { name: 'Maghrib', label: 'Maghrib' },
    { name: 'Isha', label: 'Isha' }
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="p-4 bg-[var(--surface2)] border border-[var(--border)] rounded-2xl flex flex-col gap-3 shadow-sm">
        
        {/* Toggle & Compact Dropdown Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-sm font-bold text-[var(--text)] truncate">
                Salah Reminders & Alarm
              </div>
              <div className="text-[10px] font-semibold text-[var(--text3)] flex items-center gap-1.5 truncate">
                <span className={settings.enabled ? 'text-amber-500 font-extrabold' : 'text-[var(--text3)]'}>
                  {settings.enabled ? '🔔 Alarm Active' : '🔕 Disabled'}
                </span>
                {settings.enabled && (
                  <>
                    <span>·</span>
                    <span className="truncate">{settings.city || 'Custom Location'}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Accordion Expand/Collapse Dropdown Icon */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              disabled={!settings.enabled}
              className={`p-1.5 rounded-xl transition-all ${
                settings.enabled
                  ? 'bg-[var(--surface3)] hover:bg-[var(--border)] text-[var(--text)] cursor-pointer opacity-100'
                  : 'opacity-0 pointer-events-none'
              }`}
              title={isExpanded ? 'Collapse options' : 'Expand options'}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <ChevronDown className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>

            {/* Alarm Main Toggle Switch */}
            <button
              onClick={handleToggleEnable}
              className={`w-11 h-6 rounded-full relative p-0.5 border transition-colors cursor-pointer shrink-0 ${
                settings.enabled ? 'bg-amber-500 border-amber-500' : 'bg-[var(--border2)] border-[var(--border)]'
              }`}
              title={settings.enabled ? 'Turn off alarm' : 'Turn on alarm'}
            >
              <motion.div
                animate={{ x: settings.enabled ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-[18px] h-[18px] rounded-full bg-white shadow-md"
              />
            </button>
          </div>
        </div>

        {/* Extended Notification & Prayer Time Options (Accordion Content) */}
        <AnimatePresence>
          {settings.enabled && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-col gap-4 pt-3 border-t border-[var(--border)] overflow-hidden"
            >
              
              {/* Permission status warning if needed */}
              {!permissionGranted && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Browser notifications recommended for banner alerts.</span>
                  <button
                    onClick={requestNotificationPermission}
                    className="ml-auto underline font-black text-amber-500 hover:text-amber-600"
                  >
                    Enable
                  </button>
                </div>
              )}

              {/* Alert Lead Time Selection */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text2)] uppercase tracking-wider block mb-1.5">
                  Notification Lead Time
                </label>
                <select
                  value={settings.leadMinutes}
                  onChange={(e) => updateAndSave({ ...settings, leadMinutes: parseInt(e.target.value, 10) })}
                  className="w-full p-2.5 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs font-bold outline-none focus:border-amber-500 cursor-pointer transition-colors"
                >
                  <option value={0}>At Prayer Time (Exact)</option>
                  <option value={5}>5 Minutes Before Prayer</option>
                  <option value={10}>10 Minutes Before Prayer</option>
                  <option value={15}>15 Minutes Before Prayer</option>
                </select>
              </div>

              {/* Today's Prayer Times with Editable Times Option */}
              <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between text-[11px] font-bold border-b border-[var(--border)] pb-2">
                  <span className="flex items-center gap-1.5 text-amber-500 font-black uppercase tracking-wider text-[10px]">
                    <Clock className="w-3.5 h-3.5" /> Prayer Timings
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Toggle Manual Edit Mode */}
                    <button
                      onClick={() => setIsEditingTimes(!isEditingTimes)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                        isEditingTimes
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-[var(--surface2)] text-[var(--text2)] hover:text-[var(--text)] border border-[var(--border)]'
                      }`}
                    >
                      {isEditingTimes ? (
                        <>
                          <Check className="w-3 h-3 stroke-[3]" /> Done Editing
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-3 h-3" /> Edit Prayer Times
                        </>
                      )}
                    </button>

                    {isEditingTimes && (
                      <button
                        onClick={handleResetToAutoTimes}
                        className="p-1 text-[var(--text3)] hover:text-amber-500"
                        title="Reset to City Automatic Times"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {isEditingTimes && (
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 p-2 rounded-lg">
                    ✏️ You can manually adjust the time for any prayer below. Times will be saved for your alarm alerts.
                  </div>
                )}

                {/* Grid of 5 Prayers */}
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {prayerList.map((p) => {
                    const currentTime = settings.timings[p.name] || '12:00';
                    return (
                      <div
                        key={p.name}
                        className="flex flex-col items-center bg-[var(--surface2)] p-2 rounded-xl border border-[var(--border)]"
                      >
                        <span className="text-[9px] font-extrabold text-[var(--text3)] uppercase mb-1">
                          {p.label}
                        </span>

                        {isEditingTimes ? (
                          <input
                            type="time"
                            value={currentTime}
                            onChange={(e) => handleCustomTimeChange(p.name, e.target.value)}
                            className="w-full text-center text-[10px] font-black bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded p-0.5 outline-none focus:border-amber-500"
                          />
                        ) : (
                          <span className="text-[11px] font-black text-[var(--text)] whitespace-nowrap">
                            {format12HourTime(currentTime)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Location Configurator */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-[var(--text2)] uppercase tracking-wider block">
                  Location & Automatic City Sync
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City (e.g. Mecca)"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    className="p-2.5 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs font-bold outline-none focus:border-amber-500 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Country (Optional)"
                    value={countryInput}
                    onChange={(e) => setCountryInput(e.target.value)}
                    className="p-2.5 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs font-bold outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleFetchCity}
                    disabled={loading}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{loading ? 'Fetching...' : 'Update Times'}</span>
                  </button>
                  
                  <button
                    onClick={handleUseGps}
                    disabled={loading}
                    className="py-2 px-3 rounded-xl bg-[var(--surface3)] hover:bg-[var(--border)] text-[var(--text)] font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                    title="Detect GPS Location"
                  >
                    <Navigation className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden xs:inline">GPS</span>
                  </button>
                </div>
              </div>

              {/* Test Notification & Sound Trigger */}
              <button
                onClick={handleTestAudioAndNotification}
                className="w-full py-2.5 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Volume2 className="w-4 h-4 stroke-[2.5]" />
                <span>Test Audio & Alarm Sound (Unlock Mobile Audio)</span>
              </button>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
