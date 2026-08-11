/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { PRAYERS, NamazData, Zikar } from '../types';
import {
  weekDates,
  monthDates,
  thisYear,
  thisMonth,
  MONTH_FULL,
  DAYS_SHORT,
  MONTHS,
  fmtDate,
  today,
  daysInMonth
} from '../utils/date';
import { Flame, Trophy, TrendingUp, HelpCircle } from 'lucide-react';

interface AnalyticsProps {
  namaz: NamazData;
  duas: Zikar[];
  goal: number;
}

export default function Analytics({ namaz, duas, goal }: AnalyticsProps) {
  const [progFilter, setProgFilter] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [chartType, setChartType] = useState<'namaz' | 'zikar' | 'quran'>('namaz');
  const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [hmType, setHmType] = useState<'namaz' | 'zikar' | 'quran'>('namaz');
  const [hmYear, setHmYear] = useState<number>(thisYear());

  const [quranReadTimes, setQuranReadTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('namaztrack_quran_daily_times');
      if (saved) {
        setQuranReadTimes(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);
  const [activeTooltip, setActiveTooltip] = useState<{
    ds: string;
    label: string;
    x: number;
    y: number;
  } | null>(null);

  const heatmapRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (heatmapRef.current) {
    heatmapRef.current.scrollLeft = 0;
  }
}, [hmYear, hmType]);

  const tday = today();

  // STREAK ENGINE
  const { currentStreak, bestStreak } = useMemo(() => {
    // Current streak (counting backwards from today)
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const dd = new Date(now);
      dd.setDate(now.getDate() - i);
      const ds = fmtDate(dd.getFullYear(), dd.getMonth() + 1, dd.getDate());
      
      const allPrayed = PRAYERS.some((p) => (namaz[ds]?.[p.k] ?? 0) > 0);
      if (allPrayed) {
        streak++;
      } else {
        break;
      }
    }

    // Best streak
    let best = 0;
    let cur = 0;
    const scanDate = new Date();
    scanDate.setDate(scanDate.getDate() - 180); // scan past 6 months

    for (let i = 0; i < 181; i++) {
      const dd = new Date(scanDate);
      dd.setDate(scanDate.getDate() + i);
      const ds = fmtDate(dd.getFullYear(), dd.getMonth() + 1, dd.getDate());

      const allPrayed = PRAYERS.some((p) => (namaz[ds]?.[p.k] ?? 0) > 0);
      if (allPrayed) {
        cur++;
        if (cur > best) best = cur;
      } else {
        cur = 0;
      }
    }

    return { currentStreak: streak, bestStreak: Math.max(streak, best) };
  }, [namaz]);

  // DATE ARRAY BASED ON PROGRESS FILTER
  const activeDates = useMemo(() => {
    if (progFilter === 'weekly') {
      return weekDates();
    } else if (progFilter === 'monthly') {
      return monthDates(thisYear(), thisMonth());
    } else {
      // Yearly
      let dates: string[] = [];
      for (let m = 1; m <= 12; m++) {
        dates = dates.concat(monthDates(thisYear(), m));
      }
      return dates;
    }
  }, [progFilter]);

  // STATS CALCULATOR
  const stats = useMemo(() => {
    let prayedCount = 0;
    let missedCount = 0;
    const totalPossible = activeDates.length * 5;

    activeDates.forEach((d) => {
      PRAYERS.forEach((p) => {
        const s = namaz[d]?.[p.k] ?? 0;
        if (s === 1) prayedCount++;
        if (s === 2) missedCount++;
      });
    });

    const completionPct = totalPossible ? Math.round((prayedCount / totalPossible) * 100) : 0;
    const untrackedCount = totalPossible - prayedCount - missedCount;

    return {
      completionPct,
      prayedCount,
      missedCount,
      untrackedCount
    };
  }, [activeDates, namaz]);

  // PER-PRAYER BREAKDOWN
  const prayerProgress = useMemo(() => {
    return PRAYERS.map((p) => {
      let prayedCount = 0;
      activeDates.forEach((d) => {
        if ((namaz[d]?.[p.k] ?? 0) === 1) prayedCount++;
      });
      const pct = activeDates.length ? Math.round((prayedCount / activeDates.length) * 100) : 0;
      return {
        ...p,
        pct
      };
    });
  }, [activeDates, namaz]);

  // ZIKAR STATS GENERATOR FOR ACTIVE CHART OR HEATMAP
  const getZikarCompletionStats = (ds: string) => {
    const total = duas.length;
    if (total === 0) return { completed: 0, total: 0, pct: 0 };
    
    // Check which active zikars have ds in their completedDates
    const completed = duas.filter((d) => d.completedDates?.includes(ds)).length;
    const pct = Math.round((completed / total) * 100);
    return { completed, total, pct };
  };

  // CUSTOM SVG LINE CHART DRAWING INFRASTRUCTURE
  const chartParams = useMemo(() => {
    let labels: string[] = [];
    let dataPoints: number[] = [];

    if (chartPeriod === 'weekly') {
      const dates = weekDates();
      labels = DAYS_SHORT;
      dataPoints = dates.map((d) => {
        if (chartType === 'namaz') {
          let done = 0;
          PRAYERS.forEach((p) => {
            if ((namaz[d]?.[p.k] ?? 0) === 1) done++;
          });
          return Math.round((done / 5) * 100);
        } else if (chartType === 'quran') {
          return (quranReadTimes[d] && quranReadTimes[d] > 0) ? 100 : 0;
        } else {
          return getZikarCompletionStats(d).pct;
        }
      });
    } else {
      const dates = monthDates(thisYear(), thisMonth());
      labels = dates.map((d) => d.split('-')[2]); // Just day numbers
      dataPoints = dates.map((d) => {
        if (chartType === 'namaz') {
          let done = 0;
          PRAYERS.forEach((p) => {
            if ((namaz[d]?.[p.k] ?? 0) === 1) done++;
          });
          return Math.round((done / 5) * 100);
        } else if (chartType === 'quran') {
          return (quranReadTimes[d] && quranReadTimes[d] > 0) ? 100 : 0;
        } else {
          return getZikarCompletionStats(d).pct;
        }
      });
    }

    return { labels, dataPoints };
  }, [chartPeriod, chartType, namaz, duas, quranReadTimes]);

  // SVG Dimension Parameters
  const chartWidth = 360;
  const chartHeight = 150;
  const paddingX = 35;
  const paddingY = 20;

  const svgCoordinates = useMemo(() => {
    const points = chartParams.dataPoints;
    if (points.length === 0) return { pathString: '', pointsList: [], areaString: '' };

    const widthUsable = chartWidth - paddingX * 2;
    const heightUsable = chartHeight - paddingY * 2;

    const pointsList = points.map((val, idx) => {
      const stepX = points.length > 1 ? widthUsable / (points.length - 1) : widthUsable;
      const x = paddingX + idx * stepX;
      // Invert Y because SVG 0,0 is top-left
      const y = paddingY + heightUsable - (val / 100) * heightUsable;
      return { x, y, val };
    });

    // Build cubic bezier path string
    let pathString = '';
    let areaString = '';

    if (pointsList.length > 0) {
      pathString = `M ${pointsList[0].x} ${pointsList[0].y}`;
      for (let i = 1; i < pointsList.length; i++) {
        const curr = pointsList[i];
        const prev = pointsList[i - 1];
        // Control points for smooth curves
        const cpX1 = prev.x + (curr.x - prev.x) / 2;
        const cpY1 = prev.y;
        const cpX2 = prev.x + (curr.x - prev.x) / 2;
        const cpY2 = curr.y;

        pathString += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
      }

      // Complete area path back to bottom baseline
      areaString = `${pathString} L ${pointsList[pointsList.length - 1].x} ${chartHeight - paddingY} L ${pointsList[0].x} ${chartHeight - paddingY} Z`;
    }

    return { pathString, pointsList, areaString };
  }, [chartParams, chartHeight, chartWidth]);

  // HEATMAP DATA CALCULATOR
  const heatmapData = useMemo(() => {
    const startDate = fmtDate(hmYear, 1, 1);
    const endDate = fmtDate(hmYear, 12, 31);
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    // To align properly like GitHub: Sunday is the bottom of column or Saturday?
    // Let's standardise: columns of 7 days, Monday (top) to Sunday (bottom)
    const startDow = start.getDay() === 0 ? 6 : start.getDay() - 1; // 0 for Mon, 6 for Sun
    
    const cols: (string | null)[][] = [];
    let col: (string | null)[] = [];

    // Pad first column
    for (let i = 0; i < startDow; i++) {
      col.push(null);
    }

    const d = new Date(start);
    while (d <= end) {
      const ds = fmtDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
      col.push(ds);
      
      if (col.length === 7) {
        cols.push(col);
        col = [];
      }
      d.setDate(d.getDate() + 1);
    }

    if (col.length > 0) {
      while (col.length < 7) {
        col.push(null);
      }
      cols.push(col);
    }

    // Month Label Markers
    const monthLabels: { colIdx: number; label: string }[] = [];
    let lastMonth = -1;
    cols.forEach((colArray, cIdx) => {
      const firstValidDate = colArray.find((item) => item !== null);
      if (firstValidDate) {
        const m = parseInt(firstValidDate.split('-')[1]);
        if (m !== lastMonth) {
          monthLabels.push({ colIdx: cIdx, label: MONTHS[m - 1] });
          lastMonth = m;
        }
      }
    });

    return { cols, monthLabels };
  }, [hmYear]);

  // YEAR DROPDOWN POPULATOR
  const availableYears = useMemo(() => {
    const currentY = thisYear();
    const yearsSet = new Set<number>([currentY, currentY - 1, currentY - 2]);
    Object.keys(namaz).forEach((ds) => {
      const y = parseInt(ds.split('-')[0]);
      if (!isNaN(y)) {
        yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [namaz]);

const getHeatmapColorClass = (
  type: 'namaz' | 'zikar' | 'quran',
  count: number,
  isFuture: boolean,
  ds: string
) => {
  if (isFuture) return 'bg-[var(--surface3)] opacity-20 pointer-events-none';

  // NAMAZ (Green Gradient - Strong & Clear)
  if (type === 'namaz') {
    if (count === 0) return 'bg-[var(--surface3)] border border-[var(--border)]';

    if (count === 1) return 'bg-green-300 dark:bg-green-400';
    if (count === 2) return 'bg-green-400 dark:bg-green-500';
    if (count === 3) return 'bg-green-500 dark:bg-green-600';
    if (count === 4) return 'bg-green-600 dark:bg-green-700';

    return 'bg-green-700 shadow-md'; // max intensity
  }

  // QURAN (Purple Gradient)
  if (type === 'quran') {
    if (count === 0) return 'bg-[var(--surface3)] border border-[var(--border)]';

    if (count === 1) return 'bg-purple-300 dark:bg-purple-400';
    if (count === 2) return 'bg-purple-400 dark:bg-purple-500';

    return 'bg-purple-600 shadow-md';
  }

  // ZIKAR (Blue Gradient based on ratio)
  const zStats = getZikarCompletionStats(ds);

  if (zStats.total === 0 || zStats.completed === 0) {
    return 'bg-[var(--surface3)] border border-[var(--border)]';
  }

  const ratio = zStats.completed / zStats.total;

  if (ratio <= 0.25) return 'bg-blue-300 dark:bg-blue-400';
  if (ratio <= 0.50) return 'bg-blue-400 dark:bg-blue-500';
  if (ratio <= 0.75) return 'bg-blue-500 dark:bg-blue-600';

  return 'bg-blue-700 shadow-md';
};

  const handleCellInteractive = (e: React.MouseEvent, ds: string | null) => {
    if (!ds || ds > tday) return;
    
    let count = 0;
    if (hmType === 'namaz') {
      count = PRAYERS.reduce((acc, p) => acc + ((namaz[ds]?.[p.k] ?? 0) === 1 ? 1 : 0), 0);
    } else if (hmType === 'quran') {
      count = (quranReadTimes[ds] && quranReadTimes[ds] > 0) ? 1 : 0;
    } else {
      count = getZikarCompletionStats(ds).completed;
    }

    const dateObj = new Date(ds + 'T00:00:00');
    const formattedStr = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    let description = '';
    if (hmType === 'namaz') {
      description = count === 0 ? 'No prayers logged' : count === 5 ? 'All 5 prayers completed' : `${count}/5 prayers completed`;
    } else if (hmType === 'quran') {
      description = count === 0 ? 'No Quran read' : 'Quran read completed';
    } else {
      const zStats = getZikarCompletionStats(ds);
      description = zStats.total === 0 
        ? 'No active Zikar' 
        : `${zStats.completed}/${zStats.total} Zikar completed (${zStats.pct}%)`;
    }

    const rect = (e.target as HTMLElement).getBoundingClientRect();

    setActiveTooltip({
      ds,
      label: `${formattedStr} · ${description}`,
      x: rect.left + rect.width / 2,
      y: rect.top - 6
    });
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in pb-10">
      {/* Tab Filter Row */}
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-bold text-[var(--text)] uppercase tracking-widest">
          Analytics & Insights
        </div>
      </div>

      {/* Streak and Core Stats Grid (Unified 2x3) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Current Streak */}
        <div className="rounded-[22px] p-5 bg-[var(--surface)] border border-[var(--border2)] text-center flex flex-col items-center justify-center gap-1.5 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center">
            <Flame className="w-5 h-5 fill-orange-500 stroke-[1.5]" />
          </div>
          <div className="text-3xl font-black text-[var(--text)] leading-none mt-1">{currentStreak}</div>
          <div className="text-[9px] font-bold text-[var(--text3)] uppercase tracking-wider">Current Streak</div>
        </div>

        {/* Card 2: Best Streak */}
        <div className="rounded-[22px] p-5 bg-[var(--surface)] border border-[var(--border2)] text-center flex flex-col items-center justify-center gap-1.5 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center">
            <Trophy className="w-5 h-5 fill-amber-500 stroke-[1.5]" />
          </div>
          <div className="text-3xl font-black text-[var(--text)] leading-none mt-1">{bestStreak}</div>
          <div className="text-[9px] font-bold text-[var(--text3)] uppercase tracking-wider">Best Streak</div>
        </div>

        {/* Card 3: Completion */}
        <div className="rounded-[22px] p-5 bg-[var(--surface)] border border-[var(--border2)] text-center flex flex-col items-center justify-center gap-1 shadow-sm">
          <div className="text-3xl font-black text-emerald-500 dark:text-emerald-400 leading-none">{stats.completionPct}%</div>
          <div className="text-[9px] font-bold text-[var(--text3)] uppercase tracking-wider mt-2">Completion</div>
        </div>

        {/* Card 4: Prayed */}
        <div className="rounded-[22px] p-5 bg-[var(--surface)] border border-[var(--border2)] text-center flex flex-col items-center justify-center gap-1 shadow-sm">
          <div className="text-3xl font-black text-[var(--text)] leading-none">{stats.prayedCount}</div>
          <div className="text-[9px] font-bold text-[var(--text3)] uppercase tracking-wider mt-2">Prayed</div>
        </div>

        {/* Card 5: Missed */}
        <div className="rounded-[22px] p-5 bg-[var(--surface)] border border-[var(--border2)] text-center flex flex-col items-center justify-center gap-1 shadow-sm">
          <div className="text-3xl font-black text-red-500 dark:text-red-400 leading-none">{stats.missedCount}</div>
          <div className="text-[9px] font-bold text-[var(--text3)] uppercase tracking-wider mt-2">Missed</div>
        </div>

        {/* Card 6: Untracked */}
        <div className="rounded-[22px] p-5 bg-[var(--surface)] border border-[var(--border2)] text-center flex flex-col items-center justify-center gap-1 shadow-sm">
          <div className="text-3xl font-black text-amber-500 dark:text-amber-400 leading-none">{stats.untrackedCount}</div>
          <div className="text-[9px] font-bold text-[var(--text3)] uppercase tracking-wider mt-2">Untracked</div>
        </div>
      </div>

      {/* Per-Prayer Progress bar visuals */}
      <div className="rounded-3xl p-5 bg-[var(--surface2)] border border-[var(--border)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h4 className="text-xs font-black text-[var(--text)] uppercase tracking-widest font-sans">
            Per-Prayer Completion
          </h4>
          <div className="flex gap-0.5 bg-[var(--surface3)] rounded-lg p-0.5 border border-[var(--border)]">
            {(['weekly', 'monthly', 'yearly'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setProgFilter(opt)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider ${
                  progFilter === opt
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-[var(--text2)] hover:text-[var(--text)]'
                }`}
              >
                {opt === 'weekly' ? 'W' : opt === 'monthly' ? 'M' : 'Y'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {prayerProgress.map((p) => (
            <div key={p.k} className="flex items-center gap-3">
              <div className="w-14 text-xs font-bold text-[var(--text)]">{p.label}</div>
              <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full bg-brand-500 rounded-full"
                />
              </div>
              <div className="w-8 text-right text-xs font-black text-brand-500">{p.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Beautiful Custom SVG Line Chart */}
      <div className="rounded-2xl p-4 bg-[var(--surface2)] border border-[var(--border)] shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
          <h4 className="text-xs font-black text-[var(--text)] uppercase tracking-wider">
            {chartPeriod === 'weekly' ? 'Daily' : 'Monthly'} Progress Chart
          </h4>
          
          <div className="flex items-center gap-1.5">
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as 'namaz' | 'zikar' | 'quran')}
              className="px-2.5 py-1.5 rounded-lg border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[11px] font-bold outline-none cursor-pointer focus:border-brand-500"
            >
              <option value="namaz">Namaz</option>
              <option value="zikar">Zikar</option>
              <option value="quran">Quran</option>
            </select>
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value as 'weekly' | 'monthly')}
              className="px-2.5 py-1.5 rounded-lg border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[11px] font-bold outline-none cursor-pointer focus:border-brand-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {/* Custom SVG Rendering Area */}
        <div className="relative w-full overflow-x-auto no-scrollbar">
          <svg className="w-full h-auto min-w-[320px]" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartType === 'namaz' ? 'var(--g2)' : chartType === 'quran' ? '#ad46ff' : '#2563eb'} stopOpacity="0.25" />
                <stop offset="100%" stopColor={chartType === 'namaz' ? 'var(--g2)' : chartType === 'quran' ? '#ad46ff' : '#2563eb'} stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 25, 50, 75, 100].map((v) => {
              const y = paddingY + (chartHeight - paddingY * 2) - (v / 100) * (chartHeight - paddingY * 2);
              return (
                <g key={v}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="currentColor"
                    className="text-[var(--border)] opacity-40"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-[var(--text3)] text-[9px] font-bold"
                  >
                    {v}%
                  </text>
                </g>
              );
            })}

            {/* Area Path */}
            {svgCoordinates.areaString && (
              <path d={svgCoordinates.areaString} fill="url(#chartGrad)" />
            )}

            {/* Line Path */}
            {svgCoordinates.pathString && (
              <path
                d={svgCoordinates.pathString}
                fill="none"
                stroke={chartType === 'namaz' ? 'var(--g2)' : chartType === 'quran' ? '#ad46ff' : '#2563eb'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Data Points */}
            {svgCoordinates.pointsList.map((pt, idx) => {
              const showLabel = chartPeriod === 'weekly' || idx % 5 === 0 || idx === svgCoordinates.pointsList.length - 1;
              return (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="3.5"
                    fill={chartType === 'namaz' ? 'var(--g2)' : chartType === 'quran' ? '#ad46ff' : '#2563eb'}
                    stroke="var(--surface)"
                    strokeWidth="1.5"
                  />
                  {showLabel && (
                    <text
                      x={pt.x}
                      y={chartHeight - paddingY + 12}
                      textAnchor="middle"
                      className="fill-[var(--text3)] text-[9px] font-bold"
                    >
                      {chartParams.labels[idx]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* GitHub Style Imaan Activity Heatmap Map */}
      <div className="rounded-2xl p-4 bg-[var(--surface2)] border border-[var(--border)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="text-xs font-black text-[var(--text)] flex items-center gap-1.5 uppercase tracking-wider">
            Imaan Activity Map
          </div>
          <div className="flex items-center gap-1.5">
            <select
              value={hmType}
              onChange={(e) => setHmType(e.target.value as 'namaz' | 'zikar' | 'quran')}
              className="px-2.5 py-1.5 rounded-lg border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[11px] font-bold outline-none cursor-pointer focus:border-brand-500"
            >
              <option value="namaz">Namaz</option>
              <option value="zikar">Zikar</option>
              <option value="quran">Quran</option>
            </select>
            <select
              value={hmYear}
              onChange={(e) => setHmYear(parseInt(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[11px] font-bold outline-none cursor-pointer focus:border-brand-500"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Heatmap Grid container */}
        <div
          id="heatmapScrollWrapper"
          ref={heatmapRef}
          className="w-full overflow-x-auto no-scrollbar pb-2"
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <div className="inline-flex flex-col gap-1.5 min-w-[500px]">
            {/* Months row header aligned to grid */}
            <div className="flex text-[9px] font-bold text-[var(--text3)] h-4 relative">
              {heatmapData.monthLabels.map(({ colIdx, label }, index) => {
                const leftPos = colIdx * 15; // Adjusted slightly for wider cols
                return (
                  <div
                    key={`${label}-${index}`}
                    className="absolute"
                    style={{ left: `${leftPos}px` }}
                  >
                    {label}
                  </div>
                );
              })}
            </div>

            {/* Grid Columns */}
            <div className="flex gap-[2px]">
              {heatmapData.cols.map((col, cIdx) => (
                <div key={cIdx} className="flex flex-col gap-[2px]">
                  {col.map((ds, rIdx) => {
                    if (!ds) {
                      return <div key={rIdx} className="w-[13px] h-[13px] rounded-[3.5px] bg-transparent pointer-events-none" />;
                    }

                    const isFuture = ds > tday;
                    let count = 0;
                    if (hmType === 'namaz') {
                      PRAYERS.forEach((p) => {
                        if ((namaz[ds]?.[p.k] ?? 0) === 1) count++;
                      });
                    } else if (hmType === 'quran') {
                      if (quranReadTimes[ds] && quranReadTimes[ds] > 0) count = 1;
                    } else {
                      count = getZikarCompletionStats(ds).completed;
                    }

                    const colorClass = getHeatmapColorClass(hmType, count, isFuture, ds);

                    return (
                      <div
                        key={ds}
                        className={`w-[13px] h-[13px] rounded-[3.5px] cursor-pointer transition-all hover:scale-125 ${colorClass}`}
                        onMouseEnter={(e) => handleCellInteractive(e, ds)}
                        onTouchStart={(e) => handleCellInteractive(e, ds)}
                        onClick={(e) => handleCellInteractive(e, ds)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Heatmap Legend */}
        <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-[var(--text3)]">
          <span>Less</span>
          <div className="flex gap-1">
            <div className={`w-[11px] h-[11px] rounded-[3px] bg-[var(--surface3)] border border-[var(--border)]`} />
            <div className={`w-[11px] h-[11px] rounded-[3px] ${hmType === 'namaz' ? 'bg-[#12956a]/30' : hmType === 'quran' ? 'bg-purple-500/30' : 'bg-blue-500/40'}`} />
            <div className={`w-[11px] h-[11px] rounded-[3px] ${hmType === 'namaz' ? 'bg-[#12956a]/50' : hmType === 'quran' ? 'bg-purple-500/50' : 'bg-blue-500/60'}`} />
            <div className={`w-[11px] h-[11px] rounded-[3px] ${hmType === 'namaz' ? 'bg-[#12956a]/70' : hmType === 'quran' ? 'bg-purple-500/70' : 'bg-blue-500/80'}`} />
            <div className={`w-[11px] h-[11px] rounded-[3px] ${hmType === 'namaz' ? 'bg-[#12956a]/90' : hmType === 'quran' ? 'bg-purple-500' : 'bg-blue-500'}`} />
          </div>
          <span>More</span>
          <span className="ml-auto font-medium italic">
            {hmType === 'namaz' ? '0 to 5 prayers' : hmType === 'quran' ? 'Read or Not Read' : '0% to 100% complete'}
          </span>
        </div>
      </div>

      {/* Floating HTML tooltip for heatmap hover/tap */}
      {activeTooltip && (
        <div
          className="fixed z-[100] px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-[var(--text)] text-[var(--surface)] pointer-events-none shadow-xl -translate-x-1/2 -translate-y-full whitespace-nowrap"
          style={{
            left: `${activeTooltip.x}px`,
            top: `${activeTooltip.y}px`
          }}
        >
          {activeTooltip.label}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--text)]" />
        </div>
      )}

      {/* Zikar Performance visual table */}
      <div className="rounded-2xl p-4 bg-[var(--surface2)] border border-[var(--border)] shadow-sm">
        <h4 className="text-xs font-black text-[var(--text)] mb-4 uppercase tracking-wider">
          Zikar Progress Summary
        </h4>
        <div className="flex flex-col gap-3">
          {duas.length === 0 ? (
            <p className="text-[10px] text-[var(--text3)] italic text-center py-2">
              No active Zikar counters logged.
            </p>
          ) : (
            duas.map((d) => {
              const sessionsList = Array.isArray(d.sessions) ? d.sessions : [];
              const done = sessionsList.filter((c) => c >= d.target).length;
              const pct = d.daily ? Math.round((done / d.daily) * 100) : 0;
              return (
                <div key={d.id} className="flex items-center gap-3">
                  <div className="w-20 text-xs font-bold text-[var(--text)] truncate">{d.name}</div>
                  <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                  <div className="w-12 text-right text-xs font-black text-blue-500">
                    {done}/{d.daily}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
