/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Document, Page, pdfjs } from 'react-pdf';
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
  FileDown,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';

// Configure pdfjs worker to run in browser matching react-pdf version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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

import { User } from 'firebase/auth';
import { saveUserFileMetadata } from '../utils/firebase';

interface QuranReaderProps {
  isOnline: boolean;
  showToast: (msg: string) => void;
  currentUser?: User | null;
  onReadingStateChange?: (isReading: boolean) => void;
}

export default function QuranReader({ isOnline, showToast, currentUser, onReadingStateChange }: QuranReaderProps) {
  const [loadedParaNumbers, setLoadedParaNumbers] = useState<number[]>([]);
  const [activePara, setActivePara] = useState<ParaItem | null>(null);
  const [activeBlobUrl, setActiveBlobUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [isHoveredInfo, setIsHoveredInfo] = useState(false);

  // PDF & Zoom controls
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(300);

  // Notify parent App component when user opens or closes a Para (to hide bottom navigation bar)
  useEffect(() => {
    if (onReadingStateChange) {
      onReadingStateChange(!!(activePara && activeBlobUrl));
    }
  }, [activePara, activeBlobUrl, onReadingStateChange]);

  // Touch gesture handling for Swipe and Pinch-Zoom
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef<number>(1.0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      pinchStartDist.current = null;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDist.current = dist;
      pinchStartScale.current = zoomScale;
      touchStartX.current = null;
      touchStartY.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / pinchStartDist.current;
      const newScale = Math.min(Math.max(pinchStartScale.current * factor, 0.6), 3.0);
      setZoomScale(parseFloat(newScale.toFixed(2)));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0 && touchStartX.current !== null && touchStartY.current !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const diffX = touchEndX - touchStartX.current;
      const diffY = touchEndY - touchStartY.current;

      // Allow horizontal swipe page turn if swipe distance > 40px and horizontal movement is dominant
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.3 && zoomScale <= 1.3) {
        if (diffX < 0) {
          // Swiped Left -> Next page
          setPageNumber(p => (numPages ? Math.min(p + 1, numPages) : p + 1));
        } else {
          // Swiped Right -> Previous page
          setPageNumber(p => Math.max(p - 1, 1));
        }
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    pinchStartDist.current = null;
  };

  // Keyboard navigation & zoom shortcuts
  useEffect(() => {
    if (!activePara) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'PageDown') {
        setPageNumber(p => (numPages ? Math.min(p + 1, numPages) : p + 1));
      } else if (e.key === 'ArrowRight' || e.key === 'PageUp') {
        setPageNumber(p => Math.max(p - 1, 1));
      } else if (e.key === '+' || e.key === '=') {
        setZoomScale(z => Math.min(parseFloat((z + 0.25).toFixed(2)), 3.0));
      } else if (e.key === '-') {
        setZoomScale(z => Math.max(parseFloat((z - 0.25).toFixed(2)), 0.6));
      } else if (e.key === '0') {
        setZoomScale(1.0);
      } else if (e.key === 'Escape') {
        setActivePara(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePara, numPages]);

  // Measure container for responsive PDF
  useEffect(() => {
    if (activeBlobUrl && containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth);
    }
    const handleResize = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.clientWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeBlobUrl]);

  // Bookmarks tracker (saved in localStorage as { [paraNumber]: pageNumber })
  const [bookmarks, setBookmarks] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem('namaztrack_quran_bookmarks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save bookmarks to local storage
  useEffect(() => {
    localStorage.setItem('namaztrack_quran_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

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
        setPageNumber(bookmarks[para.number] || 1);
        setNumPages(null);
        setZoomScale(1.0);
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
        if (currentUser) {
          saveUserFileMetadata(currentUser.uid, {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || 'application/pdf',
            uploadDate: new Date().toISOString(),
            paraNumber: paraNum
          }).catch(console.error);
        }
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
      if (currentUser) {
        saveUserFileMetadata(currentUser.uid, {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/pdf',
          uploadDate: new Date().toISOString(),
          paraNumber: paraNum
        }).catch(console.error);
      }
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
    if (confirm(`Are you sure you want to remove Para ${paraNum} from storage?`)) {
      await deletePdf(paraNum);
      const updated = await getAllLoadedParaNumbers();
      setLoadedParaNumbers(updated);
      showToast(`🗑️ Removed Para ${paraNum} from storage.`);
    }
  };

  // Delete all loaded paras
  const handleClearAllParas = async () => {
    if (loadedParaNumbers.length === 0) return;
    if (confirm(`Are you sure you want to remove ALL ${loadedParaNumbers.length} loaded Paras from storage?`)) {
      for (const num of loadedParaNumbers) {
        await deletePdf(num);
      }
      const updated = await getAllLoadedParaNumbers();
      setLoadedParaNumbers(updated);
      showToast("🗑️ All loaded Paras removed from storage.");
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
  const handleBookmarkCurrentPage = () => {
    if (activePara) {
      setBookmarks(prev => ({
        ...prev,
        [activePara.number]: pageNumber
      }));
      showToast(`🔖 Bookmarked page ${pageNumber} for Para ${activePara.number}!`);
    }
  };

  const handleRemoveBookmark = (paraNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks(prev => {
      const updated = { ...prev };
      delete updated[paraNum];
      return updated;
    });
    showToast(`🗑️ Bookmark removed for Para ${paraNum}`);
  };

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
      
      {/* Search, Upload and Bookmarks Header */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-[var(--surface)] border border-[var(--border2)] rounded-[20px] px-4 py-3 flex items-center gap-3 shadow-sm">
          <Search className="w-4 h-4 text-[var(--text3)] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Para..."
            className="bg-transparent border-none outline-none text-sm font-medium text-[var(--text)] w-full placeholder:text-[var(--text3)]"
          />
        </div>
        <label 
          className="p-2.5 rounded-2xl border border-[var(--border2)] bg-[var(--surface)] text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/40 cursor-pointer shrink-0 transition-all flex items-center justify-center active:scale-95 shadow-xs" 
          title="Upload Para PDFs"
        >
          <Upload className="w-4 h-4" />
          <input 
            type="file" 
            multiple 
            accept="application/pdf" 
            onChange={handleMultipleFilesChange} 
            className="hidden" 
          />
        </label>
        {/* Bookmark Button */}
        <button
          onClick={() => setShowBookmarks(!showBookmarks)}
          className={`p-2.5 rounded-2xl border shrink-0 transition-all active:scale-95 flex items-center gap-1.5 shadow-xs ${
            showBookmarks 
              ? 'bg-purple-600 border-purple-600 text-white shadow-sm' 
              : 'bg-[var(--surface)] border-[var(--border2)] text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/40'
          }`}
          title="Saved Bookmarks"
        >
          <Bookmark className="w-4 h-4 fill-current" />
          {Object.keys(bookmarks).length > 0 && (
            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
              showBookmarks ? 'bg-purple-800 text-purple-100' : 'bg-purple-500 text-white'
            }`}>
              {Object.keys(bookmarks).length}
            </span>
          )}
        </button>

        {/* Download all Quran Paras from Google Drive (Right side of Bookmark icon) */}
        <a
          href="https://drive.google.com/drive/folders/1kcIia5HHQhJ0KTioSzt0F8sESB03Ik5z?usp=drive_link"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-2xl border border-[var(--border2)] bg-[var(--surface)] text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/40 shrink-0 transition-all active:scale-95 flex items-center gap-1.5 font-bold text-xs shadow-xs"
          title="Download all Quran Paras from Google Drive"
        >
          <FileDown className="w-4 h-4" />
          <span className="hidden sm:inline">Download Paras</span>
        </a>
      </div>

      {/* Redesigned Bookmarks Section */}
      {showBookmarks && (
        <div className="bg-[var(--surface)] border border-[var(--border2)] rounded-2xl p-4 flex flex-col gap-3 shadow-md animate-fade-in">
          <div className="flex items-center justify-between border-b border-[var(--border2)] pb-3">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
              <Bookmark className="w-4 h-4 fill-purple-600 dark:fill-purple-400" />
              <span>Saved Bookmarks</span>
              <span className="text-[11px] font-semibold text-[var(--text3)] bg-[var(--surface2)] px-2 py-0.5 rounded-full">
                {Object.keys(bookmarks).length}
              </span>
            </div>
            {Object.keys(bookmarks).length > 0 && (
              <button
                onClick={() => {
                  setBookmarks({});
                  showToast("🗑️ All bookmarks cleared");
                }}
                className="text-[11px] font-medium text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>

          {Object.keys(bookmarks).length === 0 ? (
            <div className="text-[var(--text3)] text-xs text-center py-6 flex flex-col items-center gap-2">
              <Bookmark className="w-8 h-8 opacity-20" />
              <span>No bookmarks saved yet. Bookmark pages while reading!</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {Object.entries(bookmarks).map(([paraNumStr, page]) => {
                const paraNum = parseInt(paraNumStr);
                const pInfo = PARAS_DATA.find(p => p.number === paraNum);
                return (
                  <div 
                    key={paraNum} 
                    className="flex items-center justify-between bg-[var(--surface2)] p-3 rounded-xl border border-[var(--border2)] hover:border-purple-500/40 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {paraNum}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--text)] truncate">{pInfo?.name || `Para ${paraNum}`}</span>
                          <span className="text-[10px] text-purple-500 font-arabic">{pInfo?.arabicName}</span>
                        </div>
                        <span className="text-[10px] text-[var(--text3)] font-medium">Page {page}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={() => pInfo && handleOpenPara(pInfo)}
                        className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm"
                      >
                        Resume
                      </button>
                      <button
                        onClick={(e) => handleRemoveBookmark(paraNum, e)}
                        className="p-1.5 text-[var(--text3)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Remove bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Grid Legend & Mass Action */}
      <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text3)] uppercase px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Loaded ({loadedParaNumbers.length}/30)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            <span>Not Loaded</span>
          </div>
        </div>

        {loadedParaNumbers.length > 0 && (
          <button
            onClick={handleClearAllParas}
            className="text-[10px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded-lg transition-colors capitalize normal-case"
            title="Remove all loaded Paras from storage"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove All</span>
          </button>
        )}
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
                  ? 'bg-[var(--surface)] border-[var(--border2)] hover:border-purple-500/50 hover:shadow-sm cursor-pointer' 
                  : 'bg-[var(--surface2)] border-[var(--border)] opacity-75'
              }`}
            >
              {/* Folder Icon Top Left */}
              <div className="absolute top-2.5 left-2.5">
                <Folder className="w-3.5 h-3.5 fill-amber-500 text-amber-500 stroke-[1.5]" />
              </div>

              {/* Loader Dot Indicator Top Right */}
              <div className="absolute top-2.5 right-2.5 flex items-center">
                <span className={`w-1.5 h-1.5 rounded-full ${isLoaded ? 'bg-purple-500' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
              </div>

              {/* Para Name & Number */}
              <div className="mt-4 flex flex-col items-center">
                <span className="text-[10px] font-extrabold text-[var(--text3)] uppercase tracking-tight leading-none">
                  {para.number} PARA
                </span>
                <span className="font-arabic text-purple-600 dark:text-purple-400 text-sm font-bold mt-1.5 h-5 flex items-center truncate max-w-[90px]">
                  {para.arabicName}
                </span>
              </div>

              {/* Read button or Load button at the bottom */}
              <div className="w-full mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-center">
                {isLoaded ? (
                  <div className="flex items-center justify-between w-full text-[9px] font-bold text-[var(--text2)] px-0.5">
                    <span className="flex items-center gap-0.5 opacity-80" title="Reading duration">
                      ⏱ {formatTimeStr(readSecs)}
                    </span>
                    
                    {/* Delete file button on click (Always visible for easy removal) */}
                    <button 
                      onClick={(e) => handleDeletePara(para.number, e)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-500/10 transition-colors flex items-center"
                      title={`Remove loaded Para ${para.number}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
            className="fixed inset-0 bg-neutral-950 z-[100] flex flex-col"
          >
            {/* Header bar */}
            <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900 text-white shrink-0">
              <button
                onClick={() => setActivePara(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-white transition-colors bg-neutral-800/80 px-2.5 py-1.5 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                Close
              </button>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[11px] font-black text-purple-400">Juz {activePara.number}</span>
                  <span className="font-arabic text-purple-400 font-bold">{activePara.arabicName}</span>
                </div>
                <h2 className="text-xs font-bold text-neutral-300 leading-none mt-0.5">{activePara.name}</h2>
              </div>

              {/* Timer indicator */}
              <div className="text-[10px] font-bold text-purple-400 flex items-center gap-1 bg-purple-950/40 px-2.5 py-1.5 rounded-lg border border-purple-800/30">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>⏱ {formatTimeStr(readTimes[activePara.number] || 0)}</span>
              </div>
            </div>

            {/* Sub Info Status & Zoom Control Bar */}
            <div className="px-4 py-2 bg-neutral-950 text-neutral-300 text-[11px] font-bold flex flex-wrap items-center justify-between gap-2 border-b border-neutral-900 shrink-0 select-none">
              <button 
                onClick={handleBookmarkCurrentPage}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1 rounded-lg text-xs transition-all active:scale-95 shadow-sm"
              >
                <Bookmark className="w-3.5 h-3.5 fill-current" />
                <span>Bookmark Pg {pageNumber}</span>
              </button>

              {/* Zoom Controls Bar */}
              <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
                <button
                  onClick={() => setZoomScale(z => Math.max(parseFloat((z - 0.2).toFixed(2)), 0.6))}
                  className="p-1 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setZoomScale(1.0)}
                  className="px-2 py-0.5 text-[10px] font-black text-purple-400 hover:text-purple-300 bg-neutral-800 rounded-md transition-colors min-w-[42px] text-center"
                  title="Reset Zoom to 100%"
                >
                  {Math.round(zoomScale * 100)}%
                </button>

                <button
                  onClick={() => setZoomScale(z => Math.min(parseFloat((z + 0.2).toFixed(2)), 3.0))}
                  className="p-1 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {zoomScale !== 1.0 && (
                  <button
                    onClick={() => setZoomScale(1.0)}
                    className="p-1 text-neutral-400 hover:text-amber-400 rounded-lg transition-colors ml-0.5"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Native PDF Render Canvas Area with Touch Gestures */}
            <div 
              className="flex-1 bg-neutral-900 overflow-hidden relative flex flex-col items-center justify-between"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Swipe Hint Banner */}
              <div className="absolute top-2 z-10 bg-black/60 backdrop-blur-md text-white/80 text-[10px] font-semibold px-3 py-1 rounded-full border border-white/10 pointer-events-none select-none">
                👈 Swipe Left / Right to Turn Pages 👉
              </div>

              {/* Scrollable PDF Container */}
              <div 
                ref={containerRef}
                className="flex-1 w-full max-w-4xl overflow-auto bg-neutral-900 flex justify-center items-start pb-8 pt-10 custom-scrollbar"
              >
                <Document
                  file={activeBlobUrl}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  loading={<div className="text-purple-400 text-sm font-bold mt-16 animate-pulse">Loading PDF...</div>}
                >
                  <Page
                    pageNumber={pageNumber}
                    width={containerWidth ? Math.min(containerWidth - 24, 800) * zoomScale : 300 * zoomScale}
                    className="shadow-2xl rounded-sm overflow-hidden my-auto"
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
              </div>

              {/* Pagination Controls */}
              <div className="w-full max-w-3xl flex items-center justify-between bg-neutral-950 p-3.5 border-t border-neutral-800 shrink-0 shadow-2xl z-20">
                <button 
                  disabled={numPages ? pageNumber >= numPages : false} 
                  onClick={() => setPageNumber(p => p + 1)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl disabled:opacity-30 active:scale-95 transition-all flex items-center gap-1 text-xs font-bold"
                  title="Next Page (Swipe Left)"
                >
                  <ChevronLeft className="w-5 h-5 text-purple-400" />
                  <span>Next</span>
                </button>

                <div className="flex flex-col items-center">
                  <span className="text-white font-extrabold text-sm tracking-wider">
                    PAGE {pageNumber} {numPages ? <span className="text-neutral-500">/ {numPages}</span> : ''}
                  </span>
                  <span className="text-[9px] text-neutral-400 font-medium">Swipe screen to navigate</span>
                </div>

                <button 
                  disabled={pageNumber <= 1} 
                  onClick={() => setPageNumber(p => p - 1)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl disabled:opacity-30 active:scale-95 transition-all flex items-center gap-1 text-xs font-bold"
                  title="Previous Page (Swipe Right)"
                >
                  <span>Prev</span>
                  <ChevronRight className="w-5 h-5 text-purple-400" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
