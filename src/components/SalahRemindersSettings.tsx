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
  Check,
  BookOpen,
  Book,
  Quote,
  Sparkles,
  Plus,
  Trash2,
  X
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
import {
  ZikarSettings,
  QuranSettings,
  ReminderItem,
  getStoredZikarSettings,
  saveStoredZikarSettings,
  getStoredQuranSettings,
  saveStoredQuranSettings,
  sendIslamicNotification,
  getRandomMotivation
} from '../utils/reminders';

interface SalahRemindersSettingsProps {
  showToast?: (msg: string) => void;
  onSettingsChange?: (newSettings: SalahSettings) => void;
}

export default function SalahRemindersSettings({ showToast, onSettingsChange }: SalahRemindersSettingsProps) {
  const [settings, setSettings] = useState<SalahSettings>(getStoredSalahSettings());
  const [zikarSettings, setZikarSettings] = useState<ZikarSettings>(getStoredZikarSettings());
  const [quranSettings, setQuranSettings] = useState<QuranSettings>(getStoredQuranSettings());

  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(
    'Notification' in window && Notification.permission === 'granted'
  );

  // Accordion expansion states
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isZikarExpanded, setIsZikarExpanded] = useState<boolean>(false);
  const [isQuranExpanded, setIsQuranExpanded] = useState<boolean>(false);
  
  // Custom manual time edit mode for Salah
  const [isEditingTimes, setIsEditingTimes] = useState<boolean>(false);

  // Zikar add form state
  const [isAddingZikar, setIsAddingZikar] = useState(false);
  const [newZikarName, setNewZikarName] = useState('');
  const [newZikarTime, setNewZikarTime] = useState('09:00');

  // Quran add form state
  const [isAddingQuran, setIsAddingQuran] = useState(false);
  const [newQuranName, setNewQuranName] = useState('');
  const [newQuranTime, setNewQuranTime] = useState('18:00');

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

  const updateZikar = (updated: ZikarSettings) => {
    setZikarSettings(updated);
    saveStoredZikarSettings(updated);
  };

  const updateQuran = (updated: QuranSettings) => {
    setQuranSettings(updated);
    saveStoredQuranSettings(updated);
  };

  const handleToggleEnable = async () => {
    if (!settings.enabled) {
      const granted = await requestNotificationPermission();
      setPermissionGranted(granted);
      if (!granted && showToast) {
        showToast('⚠️ System notification permission is required for device bar alerts');
      }
      unlockAudioContext();
      const updated = { ...settings, enabled: true };
      updateAndSave(updated);
      setIsExpanded(true);
      if (showToast) showToast('🔔 Salah alarm reminders enabled');
    } else {
      const updated = { ...settings, enabled: false };
      updateAndSave(updated);
      setIsExpanded(false);
      if (showToast) showToast('🔕 Salah reminders disabled');
    }
  };

  const handleToggleZikar = async () => {
    if (!zikarSettings.enabled) {
      const granted = await requestNotificationPermission();
      setPermissionGranted(granted);
      unlockAudioContext();
      const updated = { ...zikarSettings, enabled: true };
      updateZikar(updated);
      setIsZikarExpanded(true);
      if (showToast) showToast('📿 Zikar daily reminders enabled');
    } else {
      const updated = { ...zikarSettings, enabled: false };
      updateZikar(updated);
      setIsZikarExpanded(false);
      if (showToast) showToast('🔕 Zikar reminders disabled');
    }
  };

  const handleToggleQuran = async () => {
    if (!quranSettings.enabled) {
      const granted = await requestNotificationPermission();
      setPermissionGranted(granted);
      unlockAudioContext();
      const updated = { ...quranSettings, enabled: true };
      updateQuran(updated);
      setIsQuranExpanded(true);
      if (showToast) showToast('📖 Quran daily reading reminders enabled');
    } else {
      const updated = { ...quranSettings, enabled: false };
      updateQuran(updated);
      setIsQuranExpanded(false);
      if (showToast) showToast('🔕 Quran reminders disabled');
    }
  };

  // --- ZIKAR CUSTOM ITEMS MANAGEMENT ---
  const handleAddZikarItem = () => {
    if (!newZikarName.trim()) {
      if (showToast) showToast('Please enter a Zikar name');
      return;
    }
    const newItem: ReminderItem = {
      id: `zikar-${Date.now()}`,
      name: newZikarName.trim(),
      time: newZikarTime || '09:00',
      enabled: true
    };
    const updatedItems = [...(zikarSettings.items || []), newItem];
    updateZikar({ ...zikarSettings, items: updatedItems });
    setNewZikarName('');
    setIsAddingZikar(false);
    if (showToast) showToast(`✨ Added Zikar reminder: ${newItem.name}`);
  };

  const handleToggleZikarItem = (id: string) => {
    const updatedItems = zikarSettings.items.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    updateZikar({ ...zikarSettings, items: updatedItems });
  };

  const handleUpdateZikarItem = (id: string, name: string, time: string) => {
    const updatedItems = zikarSettings.items.map((item) =>
      item.id === id ? { ...item, name, time } : item
    );
    updateZikar({ ...zikarSettings, items: updatedItems });
  };

  const handleDeleteZikarItem = (id: string) => {
    const updatedItems = zikarSettings.items.filter((item) => item.id !== id);
    updateZikar({ ...zikarSettings, items: updatedItems });
    if (showToast) showToast('🗑️ Zikar reminder removed');
  };

  // --- QURAN CUSTOM ITEMS MANAGEMENT ---
  const handleAddQuranItem = () => {
    if (!newQuranName.trim()) {
      if (showToast) showToast('Please enter a Quran reminder name');
      return;
    }
    const newItem: ReminderItem = {
      id: `quran-${Date.now()}`,
      name: newQuranName.trim(),
      time: newQuranTime || '06:00',
      enabled: true
    };
    const updatedItems = [...(quranSettings.items || []), newItem];
    updateQuran({ ...quranSettings, items: updatedItems });
    setNewQuranName('');
    setIsAddingQuran(false);
    if (showToast) showToast(`✨ Added Quran reminder: ${newItem.name}`);
  };

  const handleToggleQuranItem = (id: string) => {
    const updatedItems = quranSettings.items.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    updateQuran({ ...quranSettings, items: updatedItems });
  };

  const handleUpdateQuranItem = (id: string, name: string, time: string) => {
    const updatedItems = quranSettings.items.map((item) =>
      item.id === id ? { ...item, name, time } : item
    );
    updateQuran({ ...quranSettings, items: updatedItems });
  };

  const handleDeleteQuranItem = (id: string) => {
    const updatedItems = quranSettings.items.filter((item) => item.id !== id);
    updateQuran({ ...quranSettings, items: updatedItems });
    if (showToast) showToast('🗑️ Quran reminder removed');
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
    if (showToast) showToast('🔊 System Prayer notification triggered in Notification Bar!');
  };

  const handleTestZikarNotification = async () => {
    unlockAudioContext();
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    sendIslamicNotification({
      type: 'zikar',
      title: '📿 Zikar System Reminder',
      body: 'Time for your Zikar & Azkar. Unquestionably, by the remembrance of Allah hearts find rest.',
      quote: getRandomMotivation('zikar'),
      tab: 'dua'
    });
    if (showToast) showToast('📿 System Zikar notification triggered in Notification Bar!');
  };

  const handleTestQuranNotification = async () => {
    unlockAudioContext();
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    sendIslamicNotification({
      type: 'quran',
      title: '📖 Quran Reading System Reminder',
      body: 'Take time to recite and reflect upon the Holy Quran today.',
      quote: getRandomMotivation('quran'),
      tab: 'quran'
    });
    if (showToast) showToast('📖 System Quran notification triggered in Notification Bar!');
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
      {/* 1. SALAH REMINDERS & ALARM CARD */}
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

        {/* Accordion Content */}
        <AnimatePresence>
          {settings.enabled && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-col gap-4 pt-3 border-t border-[var(--border)] overflow-hidden"
            >
              {!permissionGranted && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Browser notifications required for device notification area.</span>
                  <button
                    onClick={requestNotificationPermission}
                    className="ml-auto underline font-black text-amber-500 hover:text-amber-600"
                  >
                    Enable
                  </button>
                </div>
              )}

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

              <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between text-[11px] font-bold border-b border-[var(--border)] pb-2">
                  <span className="flex items-center gap-1.5 text-amber-500 font-black uppercase tracking-wider text-[10px]">
                    <Clock className="w-3.5 h-3.5" /> Prayer Timings
                  </span>

                  <div className="flex items-center gap-2">
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

              <button
                onClick={handleTestAudioAndNotification}
                className="w-full py-2.5 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Volume2 className="w-4 h-4 stroke-[2.5]" />
                <span>Test Prayer Notification (Device Bar)</span>
              </button>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. ZIKAR REMINDERS CARD */}
      <div className="p-4 bg-[var(--surface2)] border border-[var(--border)] rounded-2xl flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-sm font-bold text-[var(--text)] truncate">
                Zikar & Azkar Reminders
              </div>
              <div className="text-[10px] font-semibold text-[var(--text3)] flex items-center gap-1.5 truncate">
                <span className={zikarSettings.enabled ? 'text-blue-500 font-extrabold' : 'text-[var(--text3)]'}>
                  {zikarSettings.enabled ? '🔔 Zikar Reminders Enabled' : '🔕 Disabled'}
                </span>
                {zikarSettings.enabled && (
                  <>
                    <span>·</span>
                    <span>{zikarSettings.items.length} Time{zikarSettings.items.length === 1 ? '' : 's'} Set</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsZikarExpanded(!isZikarExpanded)}
              disabled={!zikarSettings.enabled}
              className={`p-1.5 rounded-xl transition-all ${
                zikarSettings.enabled
                  ? 'bg-[var(--surface3)] hover:bg-[var(--border)] text-[var(--text)] cursor-pointer opacity-100'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              {isZikarExpanded ? <ChevronUp className="w-4 h-4 stroke-[2.5]" /> : <ChevronDown className="w-4 h-4 stroke-[2.5]" />}
            </button>

            <button
              onClick={handleToggleZikar}
              className={`w-11 h-6 rounded-full relative p-0.5 border transition-colors cursor-pointer shrink-0 ${
                zikarSettings.enabled ? 'bg-blue-600 border-blue-600' : 'bg-[var(--border2)] border-[var(--border)]'
              }`}
            >
              <motion.div
                animate={{ x: zikarSettings.enabled ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-[18px] h-[18px] rounded-full bg-white shadow-md"
              />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {zikarSettings.enabled && isZikarExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-col gap-3 pt-3 border-t border-[var(--border)] overflow-hidden"
            >
              {/* Zikar Reminder Items List */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text2)] uppercase tracking-wider px-1">
                  <span>Zikar Schedule ({zikarSettings.items.length})</span>
                  <button
                    onClick={() => setIsAddingZikar(!isAddingZikar)}
                    className="text-blue-500 font-extrabold flex items-center gap-1 hover:underline text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Zikar Time
                  </button>
                </div>

                {/* Inline Add Zikar Form */}
                {isAddingZikar && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex flex-col gap-2"
                  >
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400">Add Custom Zikar Reminder</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Zikar Name (e.g. After Dhuhr Tasbeeh)"
                        value={newZikarName}
                        onChange={(e) => setNewZikarName(e.target.value)}
                        className="flex-1 text-xs font-bold bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-lg p-2 outline-none focus:border-blue-500"
                      />
                      <input
                        type="time"
                        value={newZikarTime}
                        onChange={(e) => setNewZikarTime(e.target.value)}
                        className="w-24 text-xs font-black bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-lg p-2 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-1">
                      <button
                        onClick={() => setIsAddingZikar(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text2)] hover:bg-[var(--surface)]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddZikarItem}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      >
                        Save Zikar Reminder
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Items loop */}
                <div className="flex flex-col gap-2">
                  {zikarSettings.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                        item.enabled
                          ? 'bg-[var(--surface)] border-[var(--border)] shadow-2xs'
                          : 'bg-[var(--surface2)] border-dashed border-[var(--border)] opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={() => handleToggleZikarItem(item.id)}
                          className="w-4 h-4 rounded text-blue-600 border-[var(--border)] cursor-pointer"
                        />
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateZikarItem(item.id, e.target.value, item.time)}
                          className="text-xs font-bold text-[var(--text)] bg-transparent border-b border-transparent focus:border-blue-500 outline-none flex-1 truncate"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="time"
                          value={item.time}
                          onChange={(e) => handleUpdateZikarItem(item.id, item.name, e.target.value)}
                          className="text-xs font-black bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)] rounded-lg p-1 outline-none focus:border-blue-500"
                        />
                        <span className="text-[10px] font-bold text-[var(--text3)]">
                          ({format12HourTime(item.time)})
                        </span>
                        <button
                          onClick={() => handleDeleteZikarItem(item.id)}
                          className="p-1 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete Reminder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Motivational Quote Sample */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2 text-xs italic text-blue-700 dark:text-blue-300">
                <Quote className="w-4 h-4 shrink-0 text-blue-500 not-italic mt-0.5" />
                <span>"{getRandomMotivation('zikar')}"</span>
              </div>

              <button
                onClick={handleTestZikarNotification}
                className="w-full py-2 rounded-xl border border-dashed border-blue-500/50 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Test Zikar System Notification (Notification Bar)</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. QURAN REMINDERS CARD */}
      <div className="p-4 bg-[var(--surface2)] border border-[var(--border)] rounded-2xl flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <Book className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-sm font-bold text-[var(--text)] truncate">
                Daily Quran Reading Reminders
              </div>
              <div className="text-[10px] font-semibold text-[var(--text3)] flex items-center gap-1.5 truncate">
                <span className={quranSettings.enabled ? 'text-purple-500 font-extrabold' : 'text-[var(--text3)]'}>
                  {quranSettings.enabled ? '🔔 Quran Reminders Enabled' : '🔕 Disabled'}
                </span>
                {quranSettings.enabled && (
                  <>
                    <span>·</span>
                    <span>{quranSettings.items.length} Time{quranSettings.items.length === 1 ? '' : 's'} Set</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsQuranExpanded(!isQuranExpanded)}
              disabled={!quranSettings.enabled}
              className={`p-1.5 rounded-xl transition-all ${
                quranSettings.enabled
                  ? 'bg-[var(--surface3)] hover:bg-[var(--border)] text-[var(--text)] cursor-pointer opacity-100'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              {isQuranExpanded ? <ChevronUp className="w-4 h-4 stroke-[2.5]" /> : <ChevronDown className="w-4 h-4 stroke-[2.5]" />}
            </button>

            <button
              onClick={handleToggleQuran}
              className={`w-11 h-6 rounded-full relative p-0.5 border transition-colors cursor-pointer shrink-0 ${
                quranSettings.enabled ? 'bg-purple-600 border-purple-600' : 'bg-[var(--border2)] border-[var(--border)]'
              }`}
            >
              <motion.div
                animate={{ x: quranSettings.enabled ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-[18px] h-[18px] rounded-full bg-white shadow-md"
              />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {quranSettings.enabled && isQuranExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-col gap-3 pt-3 border-t border-[var(--border)] overflow-hidden"
            >
              {/* Quran Reminder Items List */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text2)] uppercase tracking-wider px-1">
                  <span>Quran Recitation Schedule ({quranSettings.items.length})</span>
                  <button
                    onClick={() => setIsAddingQuran(!isAddingQuran)}
                    className="text-purple-500 font-extrabold flex items-center gap-1 hover:underline text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Quran Time
                  </button>
                </div>

                {/* Inline Add Quran Form */}
                {isAddingQuran && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl flex flex-col gap-2"
                  >
                    <div className="text-xs font-bold text-purple-600 dark:text-purple-400">Add Custom Quran Reading Time</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Reminder Label (e.g. Night Surah Mulk)"
                        value={newQuranName}
                        onChange={(e) => setNewQuranName(e.target.value)}
                        className="flex-1 text-xs font-bold bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-lg p-2 outline-none focus:border-purple-500"
                      />
                      <input
                        type="time"
                        value={newQuranTime}
                        onChange={(e) => setNewQuranTime(e.target.value)}
                        className="w-24 text-xs font-black bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-lg p-2 outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-1">
                      <button
                        onClick={() => setIsAddingQuran(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text2)] hover:bg-[var(--surface)]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddQuranItem}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                      >
                        Save Quran Reminder
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Items loop */}
                <div className="flex flex-col gap-2">
                  {quranSettings.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                        item.enabled
                          ? 'bg-[var(--surface)] border-[var(--border)] shadow-2xs'
                          : 'bg-[var(--surface2)] border-dashed border-[var(--border)] opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={() => handleToggleQuranItem(item.id)}
                          className="w-4 h-4 rounded text-purple-600 border-[var(--border)] cursor-pointer"
                        />
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateQuranItem(item.id, e.target.value, item.time)}
                          className="text-xs font-bold text-[var(--text)] bg-transparent border-b border-transparent focus:border-purple-500 outline-none flex-1 truncate"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="time"
                          value={item.time}
                          onChange={(e) => handleUpdateQuranItem(item.id, item.name, e.target.value)}
                          className="text-xs font-black bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)] rounded-lg p-1 outline-none focus:border-purple-500"
                        />
                        <span className="text-[10px] font-bold text-[var(--text3)]">
                          ({format12HourTime(item.time)})
                        </span>
                        <button
                          onClick={() => handleDeleteQuranItem(item.id)}
                          className="p-1 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete Reminder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Motivational Quote Sample */}
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-start gap-2 text-xs italic text-purple-700 dark:text-purple-300">
                <Quote className="w-4 h-4 shrink-0 text-purple-500 not-italic mt-0.5" />
                <span>"{getRandomMotivation('quran')}"</span>
              </div>

              <button
                onClick={handleTestQuranNotification}
                className="w-full py-2 rounded-xl border border-dashed border-purple-500/50 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Test Quran System Notification (Notification Bar)</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
