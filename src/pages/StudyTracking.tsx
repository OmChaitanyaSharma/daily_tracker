import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type HourCategory } from '../db';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, parseISO, isBefore, isSameMonth, isAfter } from 'date-fns';
import { getTodayStr, MIN_DATE_STR } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, ArrowLeft, Edit2, Archive, ArchiveRestore, X, Trash2, Plus, Clock, BookOpen, Activity, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';
import { useSound } from '../hooks/useSound';
import { auth } from '../firebase';
import { deleteHourCategoryFromCloud, deleteDocumentFromCloud } from '../services/cloudSync';

const EMPTY_ARRAY: any[] = [];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const totalItem = payload.find((p: any) => p.dataKey === 'Total');
    const totalVal = totalItem ? totalItem.value : null;
    const fullDate = payload[0]?.payload?.fullDate || '';
    
    return (
      <div className="bg-[#0e0f13]/95 border border-[#23262f] backdrop-blur-md rounded-2xl p-4 shadow-2xl min-w-[200px] text-xs font-sans">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#23262f]">
          <span className="font-mono text-[#71717a] font-medium text-[11px]">
            {fullDate ? format(parseISO(`${fullDate}T12:00:00`), 'EEE, MMM d, yyyy') : `Day ${label}`}
          </span>
          <span className="font-mono text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">
            {totalVal !== null && totalVal !== undefined ? `${totalVal} hrs` : 'No logs'}
          </span>
        </div>
        
        <div className="space-y-1.5">
          {payload.map((item: any, i: number) => {
            if (item.dataKey === 'Total' || item.dataKey === 'RollingAvg') return null;
            if (item.value === null || item.value === undefined || item.value === 0) return null;
            return (
              <div key={i} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.stroke || item.color }} />
                  <span className="text-[#a1a1aa] font-medium">{item.name}</span>
                </div>
                <span className="font-mono font-semibold text-white">
                  {item.value}h
                </span>
              </div>
            );
          })}
          {payload.some((p: any) => p.dataKey === 'RollingAvg' && p.value !== null) && (
            <div className="flex items-center justify-between pt-1 mt-1 border-t border-[#23262f]/60 text-[11px] text-[#71717a]">
              <span>7-Day Trend</span>
              <span className="font-mono font-medium text-[#a1a1aa]">
                {payload.find((p: any) => p.dataKey === 'RollingAvg')?.value ?? 0}h
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function StudyTracking() {
  const { playClick, playSuccess, playThump } = useSound();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Graph state (Monkeytype flow vs categories)
  const [graphViewMode, setGraphViewMode] = useState<'flow' | 'categories'>('flow');
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);

  // Hours input state
  const [hoursDate, setHoursDate] = useState(getTodayStr());
  const [hoursType, setHoursType] = useState<string>('');
  const [hoursAmount, setHoursAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Category management state
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8b5cf6');
  const [editingCat, setEditingCat] = useState<HourCategory | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showManageCategories || editingCat) {
          e.preventDefault();
          setShowManageCategories(false);
          setEditingCat(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showManageCategories, editingCat]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const isCurrentMonth = format(currentDate, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

  const hourLogs = useLiveQuery(() =>
    db.hourLogs.where('date').between(monthStartStr, monthEndStr, true, true).toArray()
  , [monthStartStr, monthEndStr]) ?? EMPTY_ARRAY;

  const hourCategories = useLiveQuery(() => db.hourCategories.toArray()) ?? EMPTY_ARRAY;

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => {
    const prev = subMonths(currentDate, 1);
    const minDate = parseISO(MIN_DATE_STR + "T00:00:00");
    if (!isBefore(endOfMonth(prev), minDate)) {
      setCurrentDate(prev);
    }
  };
  const goToToday = () => setCurrentDate(new Date());

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await db.hourCategories.add({
      id: crypto.randomUUID(),
      name: newCatName.trim(),
      color: newCatColor,
      createdAt: new Date().toISOString()
    });
    setNewCatName('');
    playClick();
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editCatName.trim()) return;

    const oldName = editingCat.name;
    const newName = editCatName.trim();

    if (oldName !== newName) {
      const logsToUpdate = await db.hourLogs.filter(l => l.activity === oldName).toArray();
      for (const log of logsToUpdate) {
        await db.hourLogs.update(log.id, { activity: newName });
      }
    }

    await db.hourCategories.update(editingCat.id, {
      name: newName,
      color: editCatColor
    });
    setEditingCat(null);
    playClick();
  };

  const handleDeleteCategory = async (cat: HourCategory) => {
    if (confirm(`Delete category "${cat.name}"? This will ALSO delete all historical hours logged under this category. This cannot be undone.`)) {
      try {
        await db.transaction('rw', [db.hourCategories, db.hourLogs], async () => {
          const logsToDelete = await db.hourLogs.filter(l => l.activity === cat.name).toArray();
          const keys = logsToDelete.map(l => l.id);
          if (keys.length > 0) {
            await db.hourLogs.bulkDelete(keys);
          }
          await db.hourCategories.delete(cat.id);
        });
        if (auth.currentUser) {
          deleteHourCategoryFromCloud(auth.currentUser.uid, cat.name, cat.id).catch(err => {
            console.warn('[StudyTracking] Cloud category delete failed:', err);
          });
        }
        playClick();
      } catch (err) {
        console.error('[StudyTracking] Failed to delete category:', err);
      }
    }
  };

  const handleToggleArchiveCategory = async (cat: HourCategory) => {
    await db.hourCategories.update(cat.id, { archived: !cat.archived });
    if (!cat.archived && hoursType === cat.name) {
      const nextAvailable = hourCategories.find(c => c.id !== cat.id && !c.archived);
      if (nextAvailable) setHoursType(nextAvailable.name);
      else setHoursType('');
    }
    playClick();
  };

  const handleAddHours = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amount = parseFloat(hoursAmount);
    if (isNaN(amount) || amount <= 0) return;

    const activeCats = hourCategories.filter(c => !c.archived);
    const selectedActivity = hoursType || (activeCats.length > 0 ? activeCats[0].name : '');

    if (!selectedActivity) {
      setErrorMsg('Please select an activity.');
      setTimeout(() => setErrorMsg(''), 5000);
      return;
    }

    const dateHourLogs = await db.hourLogs.where('date').equals(hoursDate).toArray();
    const currentTotal = dateHourLogs.reduce((acc, curr) => acc + curr.hours, 0);
    const subjectTotal = dateHourLogs.filter(log => log.activity === selectedActivity).reduce((acc, curr) => acc + curr.hours, 0);

    if (subjectTotal + amount > 12) {
      setErrorMsg(`Maximum 12 hours can be logged per subject.`);
      setTimeout(() => setErrorMsg(''), 5000);
      return;
    }

    if (currentTotal + amount > 19) {
      setErrorMsg(`Maximum 19 hours total can be logged per day.`);
      setTimeout(() => setErrorMsg(''), 5000);
      return;
    }

    setErrorMsg('');

    await db.hourLogs.add({
      id: crypto.randomUUID(),
      date: hoursDate,
      activity: selectedActivity,
      hours: amount
    });
    setHoursAmount('');
    playSuccess();
  };

  const handleUpdateLogHours = async (logId: string, newHours: number, date: string, activity: string) => {
    if (isNaN(newHours) || newHours <= 0) return;
    const dateHourLogs = await db.hourLogs.where('date').equals(date).toArray();

    const currentTotal = dateHourLogs.reduce((acc, curr) => curr.id === logId ? acc : acc + curr.hours, 0);
    const subjectTotal = dateHourLogs.filter(l => l.activity === activity).reduce((acc, curr) => curr.id === logId ? acc : acc + curr.hours, 0);

    if (subjectTotal + newHours > 12) {
      alert(`Maximum 12 hours can be logged per subject.`);
      return;
    }

    if (currentTotal + newHours > 19) {
      alert(`Maximum 19 hours total can be logged per day.`);
      return;
    }

    await db.hourLogs.update(logId, { hours: newHours });
  };

  const handleUpdateLogActivity = async (logId: string, newActivity: string, date: string, hours: number) => {
    const dateHourLogs = await db.hourLogs.where('date').equals(date).toArray();
    const subjectTotal = dateHourLogs.filter(l => l.activity === newActivity).reduce((acc, curr) => curr.id === logId ? acc : acc + curr.hours, 0);

    if (subjectTotal + hours > 12) {
      alert(`Maximum 12 hours can be logged per subject.`);
      return;
    }

    await db.hourLogs.update(logId, { activity: newActivity });
  };

  const handleDeleteHourLog = async (logId: string) => {
    await db.hourLogs.delete(logId);
    if (auth.currentUser) {
      deleteDocumentFromCloud(auth.currentUser.uid, 'hourLogs', logId).catch(() => {});
    }
    playThump();
  };

  // Aggregate metrics
  const totalMonthHours = useMemo(() => {
    return hourLogs.reduce((acc, curr) => acc + curr.hours, 0);
  }, [hourLogs]);

  const daysElapsedInMonth = useMemo(() => {
    const today = new Date();
    const isCurrent = isSameMonth(currentDate, today);
    if (isCurrent) {
      return Math.min(daysInMonth.length, today.getDate());
    }
    return daysInMonth.length;
  }, [daysInMonth, currentDate]);

  const monthlyDailyAvg = useMemo(() => {
    return daysElapsedInMonth > 0 ? (totalMonthHours / daysElapsedInMonth) : 0;
  }, [totalMonthHours, daysElapsedInMonth]);

  const monthlyPeakHours = useMemo(() => {
    const totalsByDay: Record<string, number> = {};
    hourLogs.forEach(l => {
      totalsByDay[l.date] = (totalsByDay[l.date] || 0) + l.hours;
    });
    const values = Object.values(totalsByDay);
    return values.length > 0 ? Math.max(...values) : 0;
  }, [hourLogs]);

  const yAxisConfig = useMemo(() => {
    const peak = Math.max(12, monthlyPeakHours);
    if (peak <= 12) {
      return {
        domain: [0, 12],
        ticks: [0, 4, 8, 12]
      };
    }
    const roundedMax = Math.ceil(peak / 4) * 4;
    return {
      domain: [0, roundedMax],
      ticks: [0, Math.round(roundedMax * 0.33), Math.round(roundedMax * 0.66), roundedMax]
    };
  }, [monthlyPeakHours]);

  // Prepare graph data with future date suppression and 7-day rolling average
  const graphData = useMemo(() => {
    const today = new Date();
    const todayStr = getTodayStr();
    const isCurrent = isSameMonth(currentDate, today);

    const dailyPoints = daysInMonth.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const isFuture = isCurrent && isAfter(date, today) && dateStr !== todayStr;
      const dailyHours = hourLogs.filter(log => log.date === dateStr);
      const totalHours = dailyHours.reduce((acc, curr) => acc + curr.hours, 0);

      const catHours: Record<string, number | null> = {};
      hourCategories.forEach(cat => {
        if (isFuture) {
          catHours[cat.name] = null;
        } else {
          const h = dailyHours.filter(l => l.activity === cat.name).reduce((acc, curr) => acc + curr.hours, 0);
          catHours[cat.name] = h;
        }
      });

      return {
        date,
        dateStr,
        dayNum: format(date, 'd'),
        isFuture,
        totalHours: isFuture ? null : totalHours,
        catHours
      };
    });

    return dailyPoints.map((dp, idx) => {
      if (dp.isFuture) {
        return {
          date: dp.dayNum,
          fullDate: dp.dateStr,
          Total: null,
          RollingAvg: null,
          ...dp.catHours
        };
      }

      // Compute smooth 7-day rolling average
      const windowStart = Math.max(0, idx - 6);
      const windowSlice = dailyPoints.slice(windowStart, idx + 1).filter(p => !p.isFuture);
      const windowSum = windowSlice.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
      const rollingAvg = windowSlice.length > 0 ? parseFloat((windowSum / windowSlice.length).toFixed(1)) : 0;

      return {
        date: dp.dayNum,
        fullDate: dp.dateStr,
        Total: dp.totalHours,
        RollingAvg: rollingAvg,
        ...dp.catHours
      };
    });
  }, [daysInMonth, hourLogs, hourCategories, currentDate]);

  const topCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    hourLogs.forEach(l => {
      totals[l.activity] = (totals[l.activity] || 0) + l.hours;
    });
    let top = '';
    let max = 0;
    Object.entries(totals).forEach(([cat, hrs]) => {
      if (hrs > max) {
        max = hrs;
        top = cat;
      }
    });
    return top ? `${top} (${max}h)` : 'None';
  }, [hourLogs]);

  const activeCategories = useMemo(() => {
    return hourCategories.filter(c => !c.archived);
  }, [hourCategories]);

  // Only render lines for categories that have tracked hours this month (or active categories if month is fresh)
  const chartCategories = useMemo(() => {
    const categoriesWithHours = hourCategories.filter(cat =>
      hourLogs.some(log => log.activity === cat.name && log.hours > 0)
    );
    if (categoriesWithHours.length > 0) {
      return categoriesWithHours;
    }
    return hourCategories.filter(cat => !cat.archived);
  }, [hourCategories, hourLogs]);

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-fade-in relative space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div className="flex items-center gap-4">
          <Link to="/habits" className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-main transition-colors rounded-full hover:bg-bg-surface tap-press cursor-pointer" aria-label="Go back to habits">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif italic text-text-main font-semibold">Study and Deep Work</h1>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">Logged hours, subject breakdowns, and focus sessions</p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 self-start sm:self-auto bg-bg-surface border border-border-strong rounded-2xl p-1 shadow-sm">
          <button 
            onClick={prevMonth}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-bg-base text-text-muted hover:text-text-main transition-colors cursor-pointer tap-press"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          
          <button 
            onClick={goToToday}
            aria-label={isCurrentMonth ? `Current month: ${format(currentDate, 'MMMM yyyy')}` : "Jump to current month"}
            className="min-h-[44px] px-3.5 py-1 text-sm font-medium text-text-main hover:bg-bg-base rounded-xl transition-colors cursor-pointer tap-press"
          >
            {format(currentDate, 'MMMM yyyy')}
          </button>

          <button 
            onClick={nextMonth}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-bg-base text-text-muted hover:text-text-main transition-colors cursor-pointer tap-press"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-blue/15 text-accent-blue flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Hours</div>
            <div className="text-2xl font-bold font-sans text-text-main mt-0.5">{totalMonthHours.toFixed(1)} <span className="text-sm font-normal text-text-muted">hrs</span></div>
          </div>
        </div>

        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-purple/15 text-accent-purple flex items-center justify-center shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Top Focus Area</div>
            <div className="text-lg font-semibold text-text-main mt-0.5 truncate max-w-[200px]">{topCategory}</div>
          </div>
        </div>

        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-green/15 text-accent-green flex items-center justify-center shrink-0">
            <Plus size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Active Categories</div>
            <div className="text-2xl font-bold font-sans text-text-main mt-0.5">{activeCategories.length}</div>
          </div>
        </div>
      </div>

      {/* Chart & Tracking Studio Container */}
      <section className="bg-bg-surface border border-border-strong rounded-2xl sm:rounded-[2rem] shadow-sm overflow-hidden p-4 sm:p-10 flex flex-col gap-8 sm:gap-10">
        
        {/* Hours Line Chart */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-serif text-text-main font-medium">Hours Tracked</h2>
              <p className="text-xs text-text-muted mt-0.5">Daily hours breakdown across subjects for {format(currentDate, 'MMMM yyyy')}</p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              {/* Monkeytype Mode Switch */}
              <div className="flex items-center bg-bg-base border border-border-strong rounded-xl p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setGraphViewMode('flow')}
                  className={clsx(
                    "min-h-[36px] px-3 py-1 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1.5 tap-press",
                    graphViewMode === 'flow' 
                      ? "bg-text-main text-bg-base font-semibold shadow-sm" 
                      : "text-text-muted hover:text-text-main"
                  )}
                >
                  <Activity size={12} />
                  <span>Flow (Dual Line)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGraphViewMode('categories')}
                  className={clsx(
                    "min-h-[36px] px-3 py-1 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1.5 tap-press",
                    graphViewMode === 'categories' 
                      ? "bg-text-main text-bg-base font-semibold shadow-sm" 
                      : "text-text-muted hover:text-text-main"
                  )}
                >
                  <Layers size={12} />
                  <span>Categories</span>
                </button>
              </div>

              <button 
                onClick={() => setShowManageCategories(!showManageCategories)}
                className="text-xs font-semibold min-h-[36px] px-3.5 py-1.5 rounded-xl border border-border-strong hover:bg-bg-base text-accent-blue transition-colors cursor-pointer tap-press inline-flex items-center"
              >
                {showManageCategories ? 'Hide Categories' : 'Manage Categories'}
              </button>
            </div>
          </div>

          {/* Category Management Drawer */}
          {showManageCategories && (
            <div className="bg-bg-base border border-border-strong rounded-2xl p-5 mb-8 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-text-muted">Manage Track Categories</h3>
                <span className="text-xs text-text-muted">Click color to customize or archive to hide</span>
              </div>

              {/* Existing Categories */}
              <div className="flex flex-wrap gap-2.5">
                {hourCategories.map(cat => (
                  <div 
                    key={cat.id} 
                    className={clsx(
                      "flex items-center gap-2 border rounded-xl px-3 py-1.5 text-sm transition-all",
                      cat.archived ? "bg-bg-base border-border-subtle opacity-50" : "bg-bg-surface border-border-subtle"
                    )}
                  >
                    <div className={clsx("w-3 h-3 rounded-full", cat.archived && "grayscale")} style={{ backgroundColor: cat.color }} />
                    <span className={clsx("font-medium text-text-main", cat.archived && "line-through text-text-muted")}>{cat.name}</span>
                    
                    <button 
                      onClick={() => {
                        let hex = cat.color;
                        if (hex === 'var(--accent-red)') hex = '#ff7e79';
                        if (hex === 'var(--accent-purple)') hex = '#a78bfa';
                        if (hex === 'var(--accent-green)') hex = '#4fb693';
                        if (hex === 'var(--accent-yellow)') hex = '#f1db75';
                        if (hex === 'var(--accent-blue)') hex = '#6ea8fe';
                        setEditingCat(cat);
                        setEditCatName(cat.name);
                        setEditCatColor(hex);
                      }}
                      className="text-text-muted hover:text-text-main ml-1.5 cursor-pointer"
                      title="Edit"
                      aria-label={`Edit category ${cat.name}`}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={() => handleToggleArchiveCategory(cat)}
                      className="text-text-muted hover:text-accent-yellow cursor-pointer"
                      title={cat.archived ? "Unarchive" : "Archive"}
                      aria-label={`${cat.archived ? 'Unarchive' : 'Archive'} category ${cat.name}`}
                    >
                      {cat.archived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-text-muted hover:text-accent-red cursor-pointer"
                      title="Delete"
                      aria-label={`Delete category ${cat.name}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Edit Category Inline Form */}
              {editingCat && (
                <form onSubmit={handleEditCategory} className="flex flex-wrap items-end gap-3 p-4 bg-bg-surface rounded-xl border border-border-subtle animate-fade-in">
                  <div className="space-y-1">
                    <label htmlFor="edit-cat-name" className="text-xs text-text-muted font-medium">Edit Name</label>
                    <input 
                      id="edit-cat-name"
                      type="text" 
                      value={editCatName} 
                      onChange={e => setEditCatName(e.target.value)}
                      className="bg-bg-base border border-border-strong rounded-lg px-3 py-1.5 text-sm text-text-main focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="edit-cat-color" className="text-xs text-text-muted font-medium">Color</label>
                    <div className="flex items-center gap-2">
                      <input 
                        id="edit-cat-color"
                        aria-label="Edit category color"
                        type="color" 
                        value={editCatColor} 
                        onChange={e => setEditCatColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                      />
                      <span className="text-xs font-mono text-text-muted uppercase">{editCatColor}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="submit" className="bg-text-main text-bg-base px-4 py-1.5 rounded-lg text-sm font-medium h-9 cursor-pointer">
                      Save
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setEditingCat(null)} 
                      className="border border-border-strong text-text-main px-3 py-1.5 rounded-lg text-sm font-medium h-9 hover:bg-bg-base cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Add Category Form */}
              <form onSubmit={handleAddCategory} className="flex flex-wrap items-end gap-3 pt-4 border-t border-border-subtle">
                <div className="space-y-1">
                  <label htmlFor="new-cat-name" className="text-xs text-text-muted font-medium">New Category</label>
                  <input 
                    id="new-cat-name"
                    type="text" 
                    placeholder="e.g. Algorithms, Research" 
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="bg-bg-base border border-border-strong rounded-lg px-3 py-1.5 text-sm text-text-main focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="new-cat-color" className="text-xs text-text-muted font-medium">Color</label>
                  <div className="flex items-center gap-2">
                    <input 
                      id="new-cat-color"
                      aria-label="New category color"
                      type="color" 
                      value={newCatColor}
                      onChange={e => setNewCatColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-xs font-mono text-text-muted uppercase">{newCatColor}</span>
                  </div>
                </div>
                <button type="submit" className="bg-text-main text-bg-base px-4 py-1.5 rounded-lg text-sm font-medium h-9 hover:opacity-90 transition-opacity cursor-pointer">
                  Add Category
                </button>
              </form>
            </div>
          )}

          {/* Legend & quick indicators */}
          <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
            {graphViewMode === 'flow' ? (
              <div className="flex items-center gap-5 text-xs font-mono text-text-muted">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-text-main rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                  <span className="text-text-main font-medium">Daily Total Hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-[#525660] rounded-full" />
                  <span className="text-[#8e95a5]">7-Day Trend</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 mr-2 text-xs font-mono text-text-muted">
                  <div className="w-2.5 h-0.5 bg-text-main/70" />
                  <span>Total</span>
                </div>
                {hourCategories.filter(c => !c.archived).map(cat => {
                  const isHidden = hiddenCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setHiddenCategories(prev => 
                          prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                        );
                      }}
                      className={clsx(
                        "px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer tap-press",
                        isHidden 
                          ? "border-transparent bg-transparent text-text-muted opacity-40 line-through" 
                          : "border-border-strong bg-bg-base text-text-main hover:border-text-muted"
                      )}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="text-[11px] font-mono text-text-muted">
              Monthly Avg: {monthlyDailyAvg.toFixed(1)}h / day
            </div>
          </div>

          {/* Monkeytype Chart Area */}
          <div className="h-[380px] w-full relative pt-2">
            {/* Monospace watermark identical to Monkeytype read_ahead_easy */}
            <div className="absolute bottom-6 left-12 pointer-events-none select-none text-[12px] font-mono text-text-muted/40 tracking-wider z-0">
              daily_focus_hours // {graphViewMode === 'flow' ? 'flow_mode' : 'category_breakdown'}
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="var(--border-subtle)" opacity={0.6} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 13, fontFamily: 'monospace' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  domain={yAxisConfig.domain}
                  ticks={yAxisConfig.ticks}
                  tick={{ fill: 'var(--text-muted)', fontSize: 13, fontFamily: 'monospace' }}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                />
                
                {graphViewMode === 'flow' ? (
                  <>
                    {/* Muted Slate Curve (7-day trend) */}
                    <Line 
                      type="monotone" 
                      dataKey="RollingAvg" 
                      name="7-Day Trend"
                      stroke="#525660" 
                      strokeWidth={2.5} 
                      connectNulls={false}
                      dot={(props: any) => {
                        if (props.value === null || props.value === undefined || props.value === 0) return null;
                        return (
                          <circle 
                            key={props.key || props.index} 
                            cx={props.cx} 
                            cy={props.cy} 
                            r={3} 
                            fill="#525660" 
                            stroke="var(--bg-surface)" 
                            strokeWidth={1.5} 
                          />
                        );
                      }}
                      activeDot={{ r: 5, fill: '#525660', stroke: '#8e96a4', strokeWidth: 1.5 }}
                    />

                    {/* Crisp Theme Curve (Total Hours) */}
                    <Line 
                      type="monotone" 
                      dataKey="Total" 
                      name="Total Hours"
                      stroke="var(--text-main)" 
                      strokeWidth={3} 
                      connectNulls={false}
                      dot={(props: any) => {
                        if (props.value === null || props.value === undefined || props.value === 0) return null;
                        return (
                          <circle 
                            key={props.key || props.index} 
                            cx={props.cx} 
                            cy={props.cy} 
                            r={3.5} 
                            fill="var(--text-main)" 
                            stroke="var(--bg-surface)" 
                            strokeWidth={1.5} 
                          />
                        );
                      }}
                      activeDot={{ r: 6, fill: 'var(--text-main)', stroke: 'var(--accent-blue)', strokeWidth: 2, style: { filter: 'drop-shadow(0 0 6px var(--accent-blue))' } }}
                    />
                  </>
                ) : (
                  <>
                    {/* Categories Mode Curves */}
                    {chartCategories.filter(cat => !hiddenCategories.includes(cat.id)).map(cat => (
                      <Line 
                        key={cat.id}
                        type="monotone" 
                        dataKey={cat.name} 
                        name={cat.name}
                        stroke={cat.color} 
                        strokeWidth={2.5} 
                        connectNulls={false}
                        dot={(props: any) => {
                          if (props.value === null || props.value === undefined || props.value === 0) return null;
                          return (
                            <circle 
                              key={props.key || props.index} 
                              cx={props.cx} 
                              cy={props.cy} 
                              r={3} 
                              fill={cat.color} 
                              stroke="var(--bg-surface)" 
                              strokeWidth={1.5} 
                            />
                          );
                        }}
                        activeDot={{ r: 6, fill: cat.color, strokeWidth: 0, style: { filter: `drop-shadow(0 0 8px ${cat.color})` } }} 
                      />
                    ))}
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Add Hours Control Section */}
        <div className="pt-8 border-t border-border-subtle">
          <h3 className="text-lg font-serif text-text-main font-medium mb-4">Log Focus Session</h3>
          
          <div className="flex flex-wrap items-end gap-3 sm:gap-4">
            <div className="space-y-1.5 w-full sm:w-auto">
              <label htmlFor="hours-log-date" className="text-xs font-semibold tracking-widest uppercase text-text-muted">Date</label>
              <input 
                id="hours-log-date"
                type="date" 
                value={hoursDate}
                onChange={e => setHoursDate(e.target.value)}
                className="block w-full sm:w-auto bg-bg-base border border-border-strong rounded-xl px-3.5 py-2.5 min-h-[44px] text-base sm:text-sm text-text-main focus:outline-none focus:border-text-muted"
              />
            </div>

            <div className="space-y-1.5 w-full sm:w-auto">
              <label htmlFor="hours-log-category" className="text-xs font-semibold tracking-widest uppercase text-text-muted">Subject / Category</label>
              <select 
                id="hours-log-category"
                value={hoursType || (activeCategories.length > 0 ? activeCategories[0].name : '')}
                onChange={e => setHoursType(e.target.value)}
                className="block w-full sm:w-auto bg-bg-base border border-border-strong rounded-xl px-3.5 py-2.5 min-h-[44px] text-base sm:text-sm text-text-main focus:outline-none focus:border-text-muted cursor-pointer"
              >
                {activeCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 relative w-full sm:w-auto">
              <label htmlFor="hours-log-amount" className="text-xs font-semibold tracking-widest uppercase text-text-muted">Hours</label>
              <div className="flex flex-wrap items-center gap-2">
                <input 
                  id="hours-log-amount"
                  type="number" 
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={hoursAmount}
                  onChange={e => setHoursAmount(e.target.value)}
                  placeholder="e.g. 1.5"
                  className="block w-28 bg-bg-base border border-border-strong rounded-xl px-3.5 py-2.5 min-h-[44px] text-base sm:text-sm text-text-main focus:outline-none focus:border-text-muted"
                />
                
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5">
                  {[0.5, 1.0, 2.0].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHoursAmount(h.toString())}
                      aria-label={`Preset +${h} hours`}
                      className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-bg-base border border-border-strong text-xs font-semibold text-text-muted hover:text-text-main hover:bg-bg-surface transition-colors cursor-pointer tap-press flex items-center justify-center"
                    >
                      +{h}h
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="absolute top-full left-0 mt-2 w-max bg-accent-red-bg border border-accent-red/20 text-accent-red px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm animate-slide-up z-50">
                  {errorMsg}
                </div>
              )}
            </div>

            <button 
              onClick={handleAddHours}
              className="w-full sm:w-auto bg-text-main text-bg-base px-6 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer tap-press inline-flex items-center justify-center"
            >
              Add Hours
            </button>
          </div>
        </div>

        {/* Logged Hours History Table */}
        {hourLogs.length > 0 && (
          <div className="pt-8 border-t border-border-subtle">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-text-muted">Logged Hours History ({hourLogs.length})</h3>
              <span className="text-xs text-text-muted">Edit dates or hours inline</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
              {[...hourLogs].sort((a,b) => b.date.localeCompare(a.date)).map(log => (
                <div key={log.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 bg-bg-base border border-border-subtle rounded-xl p-3 text-sm">
                  <input 
                    type="date"
                    id={`log-date-${log.id}`}
                    aria-label={`Log date for ${log.activity}`}
                    value={log.date}
                    onChange={async (e) => await db.hourLogs.update(log.id, { date: e.target.value })}
                    className="bg-bg-surface border border-border-strong rounded-lg px-2.5 py-1.5 min-h-[40px] text-base sm:text-xs text-text-main outline-none focus:border-text-muted"
                  />
                  <select 
                    id={`log-activity-${log.id}`}
                    aria-label={`Activity category for log on ${log.date}`}
                    value={log.activity}
                    onChange={async (e) => await handleUpdateLogActivity(log.id, e.target.value, log.date, log.hours)}
                    className="bg-bg-surface border border-border-strong rounded-lg px-2.5 py-1.5 min-h-[40px] text-base sm:text-xs text-text-main outline-none cursor-pointer"
                  >
                    {hourCategories.filter(cat => !cat.archived || cat.name === log.activity).map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="number" 
                      step="0.5"
                      id={`log-hours-${log.id}`}
                      aria-label={`Hours for ${log.activity} on ${log.date}`}
                      value={log.hours}
                      onChange={async (e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) await handleUpdateLogHours(log.id, v, log.date, log.activity);
                      }}
                      className="w-16 bg-bg-surface border border-border-strong rounded-lg px-2 py-1.5 min-h-[40px] text-base sm:text-xs text-text-main outline-none"
                    />
                    <span className="text-xs text-text-muted">hours</span>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteHourLog(log.id)}
                    className="ml-auto w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-accent-red hover:bg-accent-red-bg rounded-xl transition-colors cursor-pointer tap-press"
                    title="Delete log"
                    aria-label={`Delete ${log.activity} on ${log.date}`}
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>
    </div>
  );
}
