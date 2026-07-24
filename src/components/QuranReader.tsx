/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book, 
  Folder, 
  Upload, 
  X, 
  BookOpen, 
  Search, 
  ArrowLeft, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  FileText,
  HelpCircle,
  FileDown
} from 'lucide-react';

interface ParaItem {
  number: number;
  name: string;
  arabicName: string;
}

// Authentic Arabic Names for the 30 Paras
const PARAS_DATA: ParaItem[] = [
  { number: 1, name: "Alif Lam Meem", arabicName: "ألم" },
  { number: 2, name: "Sayaqool", arabicName: "سَيَقُولُ" },
  { number: 3, name: "Tilka-r-rusul", arabicName: "تِلْكَ الرُّسُلُ" },
  { number: 4, name: "Lan Tanaaloo", arabicName: "لَنْ تَنَالُوا" },
  { number: 5, name: "Wal Muhsanat", arabicName: "وَالْمُحْصَنَاتُ" },
  { number: 6, name: "La Yuhibbullah", arabicName: "لَا يُحِبُّ اللَّهُ" },
  { number: 7, name: "Wa Iza Sami'oo", arabicName: "وَإِذَا سَمِعُوا" },
  { number: 8, name: "Wa Lau Annana", arabicName: "وَلَوْ أَنَّنَا" },
  { number: 9, name: "Qal Al-Mala'u", arabicName: "قَالَ الْمَلَأُ" },
  { number: 10, name: "Wa'lamoo", arabicName: "وَاعْلَمُوا" },
  { number: 11, name: "Ya'taziroon", arabicName: "يَعْتَذِرُونَ" },
  { number: 12, name: "Wa Mamin Daabbatin", arabicName: "وَمَا مِنْ دَابَّةٍ" },
  { number: 13, name: "Wa Ma Ubri'u", arabicName: "وَمَا أُبَرِّئُ" },
  { number: 14, name: "Rubama", arabicName: "رُبَمَا" },
  { number: 15, name: "Subhana-allazi", arabicName: "سُبْحَانَ الَّذِي" },
  { number: 16, name: "Qal Alam", arabicName: "قَالَ أَلَمْ" },
  { number: 17, name: "Aqtaraba", arabicName: "اقْتَرَبَ" },
  { number: 18, name: "Qad Aflaha", arabicName: "قَدْ أَفْلَحَ" },
  { number: 19, name: "Wa Qala-allazina", arabicName: "وَقَالَ الَّذِينَ" },
  { number: 20, name: "Amma Man Khalaqa", arabicName: "أَمَّنْ خَلَقَ" },
  { number: 21, name: "Utlu Ma Oohiya", arabicName: "اتْلُ مَا أُوحِيَ" },
  { number: 22, name: "Wa Man Yaqnut", arabicName: "وَمَنْ يَقْنُتْ" },
  { number: 23, name: "Wa Maliya", arabicName: "وَمَا لِيَ" },
  { number: 24, name: "Faman Azlamu", arabicName: "فَمَنْ أَظْلَمُ" },
  { number: 25, name: "Ilaehi Yuraddu", arabicName: "إِلَيْهِ يُرَدُّ" },
  { number: 26, name: "Ha'meem", arabicName: "حٰمٓ" },
  { number: 27, name: "Qala Fama Khatbukum", arabicName: "قَالَ فَمَا خَطْبُكُمْ" },
  { number: 28, name: "Qad Sami'Allahu", arabicName: "قَدْ سَمِعَ اللَّهُ" },
  { number: 29, name: "Tabaraka-allazi", arabicName: "تَبَارَكَ الَّذِي" },
  { number: 30, name: "Amma", arabicName: "عَمَّ" }
];

// IndexedDB Helper Functions
const DB_NAME = "QuranPdfsDB";
const STORE_NAME = "pdfs";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePdf(paraNum: number, file: Blob): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(file, paraNum);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getPdf(paraNum: number): Promise<Blob | null> {
  const db = await openDB();
  return new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(paraNum);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function deletePdf(paraNum: number): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(paraNum);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllLoadedParaNumbers(): Promise<number[]> {
  try {
    const db = await openDB();
    return new Promise<number[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      request.onsuccess = () => resolve((request.result as number[]) || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

interface QuranReaderProps {
  isOnline: boolean;
  showToast: (msg: string) => void;
}

export default function QuranReader({ isOnline, showToast }: QuranReaderProps) {
  const [loadedParaNumbers, setLoadedParaNumbers] = useState<number[]>([]);
  const [activePara, setActivePara] = useState<ParaItem | null>(null);
  const [activeBlobUrl, setActiveBlobUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHoveredInfo, setIsHoveredInfo] = useState(false);

  // Read time tracker (saved in localStorage as { [paraNumber]: seconds })
  const [readTimes, setReadTimes] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem('namaztrack_quran_read_times');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Track active reading time session
  const readSessionRef = useRef<number>(0);
  const activeParaRef = useRef<ParaItem | null>(null);

  // Sync activeParaRef
  useEffect(() => {
    activeParaRef.current = activePara;
  }, [activePara]);

  // Load loaded list from IndexedDB on mount
  useEffect(() => {
    getAllLoadedParaNumbers().then(setLoadedParaNumbers);
  }, []);

  // Save read times to local storage on change
  useEffect(() => {
    localStorage.setItem('namaztrack_quran_read_times', JSON.stringify(readTimes));
  }, [readTimes]);

  // Track timer when reading is active
  useEffect(() => {
    if (!activePara) {
      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl);
        setActiveBlobUrl(null);
      }
      return;
    }

    // Set up timer
    readSessionRef.current = 0;
    const interval = setInterval(() => {
      readSessionRef.current += 1;
      setReadTimes(prev => {
        const num = activePara.number;
        return {
          ...prev,
          [num]: (prev[num] || 0) + 1
        };
      });

      // Update daily times for analytics
      try {
        const dStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const saved = localStorage.getItem('namaztrack_quran_daily_times');
        const daily = saved ? JSON.parse(saved) : {};
        daily[dStr] = (daily[dStr] || 0) + 1;
        localStorage.setItem('namaztrack_quran_daily_times', JSON.stringify(daily));
      } catch (e) {}
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [activePara]);

  // Helper to load blob and open reader
  const handleOpenPara = async (para: ParaItem) => {
    try {
      const blob = await getPdf(para.number);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setActiveBlobUrl(url);
        setActivePara(para);
        showToast(`📖 Reading Para ${para.number} offline natively!`);
      } else {
        showToast(`❌ Para ${para.number} PDF is not loaded. Please load it first!`);
      }
    } catch (err) {
      console.error(err);
      showToast("❌ Error loading PDF from browser storage.");
    }
  };

  // Helper to parse para number from filename
  const parseParaNumberFromFilename = (name: string): number | null => {
    // Look for patterns like "Para-01", "Para 01", "Para_01", "Para1", "01.pdf", etc.
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, ' ');
    const tokens = cleanName.split(' ');
    
    // First try checking tokens starting with "para"
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === 'para' && i + 1 < tokens.length) {
        const num = parseInt(tokens[i + 1]);
        if (!isNaN(num) && num >= 1 && num <= 30) return num;
      }
    }

    // Try finding any number between 1 and 30
    const numbers = name.match(/\d+/g);
    if (numbers) {
      for (const numStr of numbers) {
        const num = parseInt(numStr);
        if (num >= 1 && num <= 30) return num;
      }
    }

    return null;
  };

  // Bulk / Multiple files upload handler
  const handleMultipleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let successCount = 0;
    let failedFiles: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== "application/pdf") {
        failedFiles.push(`${file.name} (Not a PDF)`);
        continue;
      }

      const paraNum = parseParaNumberFromFilename(file.name);
      if (paraNum) {
        await savePdf(paraNum, file);
        successCount++;
      } else {
        failedFiles.push(`${file.name} (Couldn't detect Para 1-30)`);
      }
    }

    // Refresh loaded list
    const updated = await getAllLoadedParaNumbers();
    setLoadedParaNumbers(updated);

    if (successCount > 0) {
      showToast(`✅ Successfully loaded ${successCount} Para file(s) persistently!`);
    }
    if (failedFiles.length > 0) {
      showToast(`⚠️ Could not auto-detect Para number for: ${failedFiles.slice(0, 2).join(', ')}...`);
    }
  };

  // Single file manual loader for specific Para card
  const handleSingleParaFile = async (paraNum: number, file: File) => {
    if (file.type !== "application/pdf") {
      showToast("❌ Please select a valid PDF file.");
      return;
    }
    try {
      await savePdf(paraNum, file);
      const updated = await getAllLoadedParaNumbers();
      setLoadedParaNumbers(updated);
      showToast(`✅ Saved Para ${paraNum} PDF securely offline!`);
    } catch {
      showToast("❌ Error saving file persistently.");
    }
  };

  // Delete a loaded para
  const handleDeletePara = async (paraNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the cached PDF for Para ${paraNum}?`)) {
      await deletePdf(paraNum);
      const updated = await getAllLoadedParaNumbers();
      setLoadedParaNumbers(updated);
      showToast(`🗑️ Deleted Para ${paraNum} from storage.`);
    }
  };

  // Format tracked time beautifully
  const formatTimeStr = (seconds: number): string => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) {
      return `${mins}m ${secs}s`;
    }
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  // Top header stats
  const totalReadCount = useMemo(() => {
    return Object.keys(readTimes).filter(k => readTimes[parseInt(k)] > 0).length;
  }, [readTimes]);

  const totalReadTimeSecs = useMemo(() => {
    return (Object.values(readTimes) as number[]).reduce((acc, v) => acc + v, 0);
  }, [readTimes]);

  const filteredParas = useMemo(() => {
    return PARAS_DATA.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.arabicName.includes(searchQuery) ||
      p.number.toString() === searchQuery
    );
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in pb-12">
      
      {/* Quran Tab Branding Header */}
      <div className="relative overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#12956a] to-[#1dbf87] p-5 pb-6 rounded-3xl text-white shadow-sm">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-black/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <span className="font-arabic font-extrabold text-2xl leading-none">القرآن الكريم</span>
            </div>
            <h1 className="font-sans font-extrabold text-lg tracking-wide leading-none text-white/95 mt-2">THE HOLY QURAN</h1>
            <div className="text-[9px] uppercase font-bold tracking-wider text-white/80 mt-1.5">30 Juz / Paras Reader</div>
          </div>

          <div className="flex gap-1.5">
            {/* Read Count Badge */}
            <div className="rounded-xl py-1 px-2.5 text-center bg-white/10 backdrop-blur-md border border-white/20 text-white min-w-[50px]">
              <div className="text-sm font-black leading-none">{totalReadCount}</div>
              <div className="text-[7px] font-extrabold uppercase mt-0.5 tracking-wider text-white/90">Read</div>
            </div>
            {/* Total Time Badge */}
            <div className="rounded-xl py-1 px-2.5 text-center bg-white/10 backdrop-blur-md border border-white/20 text-white min-w-[64px]">
              <div className="text-sm font-black leading-none truncate">{formatTimeStr(totalReadTimeSecs)}</div>
              <div className="text-[7px] font-extrabold uppercase mt-0.5 tracking-wider text-white/90">Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input bar */}
      <div className="w-full bg-[var(--surface)] border border-[var(--border2)] rounded-[20px] px-4 py-3 flex items-center gap-3 shadow-sm">
        <Search className="w-4 h-4 text-[var(--text3)] shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Para..."
          className="bg-transparent border-none outline-none text-sm font-medium text-[var(--text)] w-full placeholder:text-[var(--text3)]"
        />
      </div>

      {/* Upload files box (Persistent Local Storage) */}
      <div className="rounded-2xl p-5 border-2 border-dashed border-[#1dbf87]/30 bg-emerald-500/5 dark:bg-emerald-500/10 flex flex-col items-center text-center relative overflow-hidden">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5">
          <Folder className="w-6 h-6 fill-amber-500 text-amber-500 stroke-[1.5]" />
        </div>
        <h4 className="text-sm font-bold text-[var(--text)]">Load Your Para PDFs</h4>
        <p className="text-[10px] text-[var(--text2)] max-w-[280px] leading-relaxed mt-1">
          Select all 30 Para files at once. They stay saved in your secure local browser storage permanently.
        </p>
        
        <label className="mt-4 px-4 py-2.5 bg-[#1dbf87] hover:bg-[#13956a] text-white text-[11px] font-extrabold uppercase tracking-widest rounded-xl shadow-sm cursor-pointer transition-all flex items-center gap-2">
          <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
          Select Para Files (up to 30)
          <input 
            type="file" 
            multiple 
            accept="application/pdf" 
            onChange={handleMultipleFilesChange} 
            className="hidden" 
          />
        </label>
      </div>

      {/* Grid Legend */}
      <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text3)] uppercase px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Loaded</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          <span>Not Loaded</span>
        </div>
      </div>

      {/* Elegant 3-column Grid for 30 Paras */}
      <div className="grid grid-cols-3 gap-2 pb-6">
        {filteredParas.map((para) => {
          const isLoaded = loadedParaNumbers.includes(para.number);
          const readSecs = readTimes[para.number] || 0;

          return (
            <div
              key={para.number}
              onClick={() => isLoaded ? handleOpenPara(para) : null}
              className={`relative rounded-[20px] p-3 border flex flex-col items-center text-center justify-between min-h-[114px] transition-all group ${
                isLoaded 
                  ? 'bg-[var(--surface)] border-[var(--border2)] hover:border-[#1dbf87]/50 hover:shadow-sm cursor-pointer' 
                  : 'bg-[var(--surface2)] border-[var(--border)] opacity-75'
              }`}
            >
              {/* Folder Icon Top Left */}
              <div className="absolute top-2.5 left-2.5">
                <Folder className="w-3.5 h-3.5 fill-amber-500 text-amber-500 stroke-[1.5]" />
              </div>

              {/* Loader Dot Indicator Top Right */}
              <div className="absolute top-2.5 right-2.5 flex items-center">
                <span className={`w-1.5 h-1.5 rounded-full ${isLoaded ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
              </div>

              {/* Para Name & Number */}
              <div className="mt-4 flex flex-col items-center">
                <span className="text-[10px] font-extrabold text-[var(--text3)] uppercase tracking-tight leading-none">
                  {para.number} PARA
                </span>
                <span className="font-arabic text-[#13956a] text-sm font-bold mt-1.5 h-5 flex items-center truncate max-w-[90px]">
                  {para.arabicName}
                </span>
              </div>

              {/* Read button or Load button at the bottom */}
              <div className="w-full mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-center">
                {isLoaded ? (
                  <div className="flex items-center justify-between w-full text-[9px] font-bold text-[var(--text2)] px-0.5">
                    <span className="flex items-center gap-0.5 opacity-80">
                      ⏱ {formatTimeStr(readSecs)}
                    </span>
                    
                    {/* Delete file button on click */}
                    <button 
                      onClick={(e) => handleDeletePara(para.number, e)}
                      className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="text-[9px] font-extrabold uppercase tracking-wide text-amber-600 hover:text-amber-800 dark:text-amber-400 cursor-pointer flex items-center gap-1">
                    <span>LOAD</span>
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSingleParaFile(para.number, file);
                      }} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reader Modal (Active Para) */}
      <AnimatePresence>
        {activePara && activeBlobUrl && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute inset-0 bg-neutral-950 z-50 flex flex-col"
          >
            {/* Header bar */}
            <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900 text-white">
              <button
                onClick={() => setActivePara(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Close
              </button>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[11px] font-black text-emerald-400">Juz {activePara.number}</span>
                  <span className="font-arabic text-emerald-400 font-bold">{activePara.arabicName}</span>
                </div>
                <h2 className="text-xs font-bold text-neutral-300 leading-none mt-0.5">{activePara.name}</h2>
              </div>

              {/* Timer indicator */}
              <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <Clock className="w-3 h-3 animate-pulse" />
                <span>⏱ {formatTimeStr(readTimes[activePara.number] || 0)}</span>
              </div>
            </div>

            {/* Sub Info Status Bar */}
            <div className="px-4 py-1.5 bg-neutral-950 text-neutral-400 text-[9px] font-bold flex items-center justify-between border-b border-neutral-900 shrink-0 select-none">
              <span>NATIVE BROWSER OFFLINE READER</span>
              <span className="text-emerald-400 uppercase">File loaded securely from device</span>
            </div>

            {/* Native PDF Render Canvas Area */}
            <div className="flex-1 bg-neutral-900 overflow-hidden relative flex flex-col">
              {/* Fallback & Fullscreen Help Bar */}
              <div className="p-3 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold text-center flex flex-wrap items-center justify-center gap-2 border-b border-emerald-500/20">
                <span>If the PDF doesn't load below, you can:</span>
                <a 
                  href={activeBlobUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-black transition-colors uppercase text-[9px]"
                >
                  Open Fullscreen ↗
                </a>
                <span>or</span>
                <a 
                  href={activeBlobUrl} 
                  download={`Para-${String(activePara.number).padStart(2, '0')}.pdf`}
                  className="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white rounded font-black transition-colors uppercase text-[9px]"
                >
                  Download File ⬇
                </a>
              </div>

              <div className="flex-1 relative bg-neutral-900">
                <iframe
                  src={activeBlobUrl}
                  className="w-full h-full bg-neutral-900 border-none"
                  title={`Para ${activePara.number} Reader`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
