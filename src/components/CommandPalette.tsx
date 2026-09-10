import { useState, useEffect, useRef } from 'react';
import { Terminal, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { getTodayStr } from '../utils/dateUtils';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery('');
    }
  }, [open]);

  if (!open) return null;

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const cmd = query.toLowerCase().trim();
    
    // Natural Language Parsing Logic
    if (cmd.startsWith('log ') && cmd.includes('h ')) {
        // e.g. "log 2h web dev"
        const match = cmd.match(/log ([\d.]+)h (.*)/);
        if (match) {
           const hours = parseFloat(match[1]);
           const activity = match[2];
           await db.hourLogs.add({
             id: crypto.randomUUID(),
             date: getTodayStr(),
             activity,
             hours
           });
           setOpen(false);
           return;
        }
    }
    
    if (cmd === 'go habits') { navigate('/habits'); setOpen(false); return; }
    if (cmd === 'go exercise') { navigate('/exercise'); setOpen(false); return; }
    if (cmd === 'go journal') { navigate('/highlight'); setOpen(false); return; }
    
    // Fallback
    console.log("Unknown command:", query);
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-bg-base/80 backdrop-blur-md">
       <div className="bg-bg-surface border border-border-strong w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
          <form onSubmit={handleCommand} className="flex items-center px-4 py-4 border-b border-border-subtle">
             <Terminal className="text-accent-blue mr-3" size={24} />
             <input 
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type a command... (e.g., 'log 2h web dev')"
                className="flex-1 bg-transparent border-none outline-none text-xl text-text-main font-mono placeholder:text-text-muted/50"
             />
             <div className="text-xs text-text-muted font-mono bg-bg-base px-2 py-1 rounded">ESC to close</div>
          </form>
          
          <div className="p-4 font-mono text-sm text-text-muted">
             <div className="mb-2 uppercase tracking-widest text-[10px] text-text-muted/70">Suggested</div>
             <ul className="space-y-2">
                <li className="flex items-center gap-2 hover:text-text-main cursor-pointer" onClick={() => setQuery('log 2h web dev')}><ArrowRight size={14}/> log 2h web dev</li>
                <li className="flex items-center gap-2 hover:text-text-main cursor-pointer" onClick={() => setQuery('go habits')}><ArrowRight size={14}/> go habits</li>
                <li className="flex items-center gap-2 hover:text-text-main cursor-pointer" onClick={() => setQuery('go exercise')}><ArrowRight size={14}/> go exercise</li>
             </ul>
          </div>
       </div>
    </div>
  )
}
