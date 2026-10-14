import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type HourCategory } from '../db';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, parseISO, isBefore } from 'date-fns';
import { getTodayStr, MIN_DATE_STR } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, ArrowLeft, Edit2, Archive, ArchiveRestore, X, Trash2, Plus, Clock, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import clsx from 'clsx';
import { useSound } from '../hooks/useSound';

const EMPTY_ARRAY: any[] = [];

export function StudyTracking() {
  const { playClick, playSuccess } = useSound();
  const [currentDate, setCurrentDate] = useState(new Date());

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
      const logsToDelete = await db.hourLogs.filter(l => l.activity === cat.name).toArray();
      const keys = logsToDelete.map(l => l.id);
      await db.hourLogs.bulkDelete(keys);
      await db.hourCategories.delete(cat.id);
      playClick();
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
    playClick();
  };

  // Prepare graph data
  const graphData = useMemo(() => {
    return daysInMonth.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dailyHours = hourLogs.filter(log => log.date === dateStr);

      const dataPoint: any = {
        date: format(date, 'd'),
        fullDate: dateStr,
      };

      hourCategories.forEach(cat => {
        const hours = dailyHours.filter(l => l.activity === cat.name).reduce((acc, curr) => acc + curr.hours, 0);
        dataPoint[cat.name] = hours;
      });

      return dataPoint;
    });
  }, [daysInMonth, hourLogs, hourCategories]);

  // Aggregate metrics
  const totalMonthHours = useMemo(() => {
    return hourLogs.reduce((acc, curr) => acc + curr.hours, 0);
  }, [hourLogs]);

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

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-fade-in relative space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div className="flex items-center gap-4">
          <Link to="/habits" className="text-text-muted hover:text-text-main transition-colors p-1 rounded-full hover:bg-bg-surface">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-serif italic text-text-main font-semibold">Study and Deep Work</h1>
            <p className="text-sm text-text-muted mt-1">Visualize hours logged, subject categories, and focus sessions</p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-bg-surface border border-border-strong rounded-2xl p-1.5 shadow-sm">
          <button 
            onClick={prevMonth}
            className="p-1.5 rounded-xl hover:bg-bg-base text-text-muted hover:text-text-main transition-colors cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          
          <button 
            onClick={goToToday}
            className="px-3 py-1 text-sm font-medium text-text-main hover:bg-bg-base rounded-xl transition-colors cursor-pointer"
          >
            {format(currentDate, 'MMMM yyyy')}
          </button>

          <button 
            onClick={nextMonth}
            className="p-1.5 rounded-xl hover:bg-bg-base text-text-muted hover:text-text-main transition-colors cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-blue/15 text-accent-blue flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Hours</div>
            <div className="text-2xl font-bold font-sans text-text-main mt-0.5">{totalMonthHours.toFixed(1)} <span className="text-sm font-normal text-text-muted">hrs</span></div>
          </div>
        </div>

        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-purple/15 text-accent-purple flex items-center justify-center shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Top Focus Area</div>
            <div className="text-lg font-semibold text-text-main mt-0.5 truncate max-w-[200px]">{topCategory}</div>
          </div>
        </div>

        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-5 flex items-center gap-4">
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
      <section className="bg-bg-surface border border-border-strong rounded-[2rem] shadow-sm overflow-hidden p-6 sm:p-10 flex flex-col gap-10">
        
        {/* Hours Line Chart */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-2xl font-serif text-text-main font-medium">Hours Tracked</h2>
              <p className="text-xs text-text-muted mt-1">Daily hours breakdown across subjects for {format(currentDate, 'MMMM yyyy')}</p>
            </div>
            
            <button 
              onClick={() => setShowManageCategories(!showManageCategories)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-border-strong hover:bg-bg-base text-accent-blue transition-colors self-start sm:self-auto cursor-pointer"
            >
              {showManageCategories ? 'Hide Categories' : 'Manage Categories'}
            </button>
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
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={() => handleToggleArchiveCategory(cat)}
                      className="text-text-muted hover:text-accent-yellow cursor-pointer"
                      title={cat.archived ? "Unarchive" : "Archive"}
                    >
                      {cat.archived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-text-muted hover:text-accent-red cursor-pointer"
                      title="Delete"
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
                    <label className="text-xs text-text-muted font-medium">Edit Name</label>
                    <input 
                      type="text" 
                      value={editCatName} 
                      onChange={e => setEditCatName(e.target.value)}
                      className="bg-bg-base border border-border-strong rounded-lg px-3 py-1.5 text-sm text-text-main focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted font-medium">Color</label>
                    <div className="flex items-center gap-2">
                      <input 
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
                  <label className="text-xs text-text-muted font-medium">New Category</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Algorithms, Research" 
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="bg-bg-base border border-border-strong rounded-lg px-3 py-1.5 text-sm text-text-main focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted font-medium">Color</label>
                  <div className="flex items-center gap-2">
                    <input 
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

          {/* Recharts LineChart */}
          <div className="h-[380px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="var(--border-strong)" opacity={0.4} />
                <XAxis 
                  dataKey="date" 
                  axisLine={{ stroke: 'var(--border-strong)' }} 
                  tickLine={{ stroke: 'var(--border-strong)' }} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={{ stroke: 'var(--border-strong)' }} 
                  tickLine={{ stroke: 'var(--border-strong)' }} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(23, 23, 28, 0.95)', 
                    backdropFilter: 'blur(16px)',
                    borderColor: 'var(--border-strong)', 
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '6px' }}
                />
                <Legend verticalAlign="top" height={44} wrapperStyle={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }} />
                
                {hourCategories.map(cat => (
                  <Line 
                    key={cat.id}
                    type="linear" 
                    dataKey={cat.name} 
                    stroke={cat.color} 
                    strokeWidth={2.5} 
                    connectNulls={false}
                    dot={(props: any) => props.value ? <circle key={props.key || props.index} cx={props.cx} cy={props.cy} r={3.5} fill={props.stroke} stroke="var(--bg-surface)" strokeWidth={1} /> : null} 
                    activeDot={{ r: 6, fill: cat.color, strokeWidth: 0, style: { filter: `drop-shadow(0 0 8px ${cat.color})` } }} 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Add Hours Control Section */}
        <div className="pt-8 border-t border-border-subtle">
          <h3 className="text-lg font-serif text-text-main font-medium mb-4">Log Focus Session</h3>
          
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted">Date</label>
              <input 
                type="date" 
                value={hoursDate}
                onChange={e => setHoursDate(e.target.value)}
                className="block bg-bg-base border border-border-strong rounded-xl px-3.5 py-2 text-sm text-text-main focus:outline-none focus:border-text-muted"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted">Subject / Category</label>
              <select 
                value={hoursType || (activeCategories.length > 0 ? activeCategories[0].name : '')}
                onChange={e => setHoursType(e.target.value)}
                className="block bg-bg-base border border-border-strong rounded-xl px-3.5 py-2 text-sm text-text-main focus:outline-none focus:border-text-muted"
              >
                {activeCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-xs font-semibold tracking-widest uppercase text-text-muted">Hours</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={hoursAmount}
                  onChange={e => setHoursAmount(e.target.value)}
                  placeholder="e.g. 1.5"
                  className="block w-24 bg-bg-base border border-border-strong rounded-xl px-3.5 py-2 text-sm text-text-main focus:outline-none focus:border-text-muted"
                />
                
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5">
                  {[0.5, 1.0, 2.0].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHoursAmount(h.toString())}
                      className="px-2.5 py-2 rounded-xl bg-bg-base border border-border-strong text-xs font-semibold text-text-muted hover:text-text-main hover:bg-bg-surface transition-colors cursor-pointer"
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
              className="bg-text-main text-bg-base px-6 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity mb-[2px] cursor-pointer"
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
                <div key={log.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-bg-base border border-border-subtle rounded-xl p-3 text-sm">
                  <input 
                    type="date"
                    value={log.date}
                    onChange={async (e) => await db.hourLogs.update(log.id, { date: e.target.value })}
                    className="bg-bg-surface border border-border-strong rounded-lg px-2.5 py-1 text-xs text-text-main outline-none focus:border-text-muted"
                  />
                  <select 
                    value={log.activity}
                    onChange={async (e) => await handleUpdateLogActivity(log.id, e.target.value, log.date, log.hours)}
                    className="bg-bg-surface border border-border-strong rounded-lg px-2.5 py-1 text-xs text-text-main outline-none"
                  >
                    {hourCategories.filter(cat => !cat.archived || cat.name === log.activity).map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="number" 
                      step="0.5"
                      value={log.hours}
                      onChange={async (e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) await handleUpdateLogHours(log.id, v, log.date, log.activity);
                      }}
                      className="w-16 bg-bg-surface border border-border-strong rounded-lg px-2 py-1 text-xs text-text-main outline-none"
                    />
                    <span className="text-xs text-text-muted">hours</span>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteHourLog(log.id)}
                    className="ml-auto p-1.5 text-accent-red hover:bg-accent-red-bg rounded-lg transition-colors cursor-pointer"
                    title="Delete log"
                    aria-label={`Delete ${log.activity} on ${log.date}`}
                  >
                    <X size={16} />
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
