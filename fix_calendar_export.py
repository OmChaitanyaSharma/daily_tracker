import re

with open("src/pages/Calendar.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_old = "import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';"
import_new = "import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, Download } from 'lucide-react';\nimport { downloadCalendarICS } from '../utils/calendarSync';"
content = content.replace(import_old, import_new)

btn_old = """      <header className="flex justify-between items-center mb-8 border-b border-border-subtle pb-6">
        <div className="flex items-center gap-4">"""
btn_new = """      <header className="flex justify-between items-center mb-8 border-b border-border-subtle pb-6">
        <div className="flex items-center gap-4">"""
# Wait, I want to add the export button at the end of the header
header_end = """        <div className="flex gap-4">
          <button 
            onClick={() => {
              setEditingEvent(null);
              setEventDate(getTodayStr());
              setEventTitle('');
              setEventDescription('');
              setEventType('event');
              setShowModal(true);
            }}
            className="px-4 py-2 bg-accent-blue text-[#09090b] rounded-xl font-bold font-mono text-sm tracking-widest uppercase hover:bg-white transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            <Plus size={16} /> Add Event
          </button>
        </div>"""
header_end_new = """        <div className="flex gap-4">
          <button 
            onClick={downloadCalendarICS}
            className="px-4 py-2 border border-border-strong text-text-muted rounded-xl font-bold font-mono text-sm tracking-widest uppercase hover:text-text-main hover:bg-bg-surface transition-all flex items-center gap-2"
          >
            <Download size={16} /> Sync (.ics)
          </button>
          <button 
            onClick={() => {
              setEditingEvent(null);
              setEventDate(getTodayStr());
              setEventTitle('');
              setEventDescription('');
              setEventType('event');
              setShowModal(true);
            }}
            className="px-4 py-2 bg-accent-blue text-[#09090b] rounded-xl font-bold font-mono text-sm tracking-widest uppercase hover:bg-white transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            <Plus size={16} /> Add Event
          </button>
        </div>"""
content = content.replace(header_end, header_end_new)

with open("src/pages/Calendar.tsx", "w", encoding="utf-8") as f:
    f.write(content)
