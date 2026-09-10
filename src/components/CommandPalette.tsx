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
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-xl">
       <div className="bg-[#09090b] border border-[#27272a] w-full max-w-2xl rounded-none shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-scale-in relative">
          
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-blue to-transparent opacity-50" />
          
          <form onSubmit={handleCommand} className="flex items-center px-6 py-5 border-b border-[#27272a] bg-[#09090b]">
             <Terminal className="text-accent-blue mr-4 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" size={20} />
             <input 
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="EXECUTE COMMAND..."
                className="flex-1 bg-transparent border-none outline-none text-xl text-[#ececf1] font-mono tracking-widest placeholder:text-[#3f3f46] uppercase"
             />
             <div className="text-[10px] text-[#52525b] font-mono tracking-widest uppercase border border-[#27272a] px-2 py-1 bg-[#18181b]">ESC</div>
          </form>
          
          <div className="p-6 font-mono text-sm text-[#a1a1aa] bg-[#09090b]">
             <div className="mb-4 uppercase tracking-[0.3em] text-[10px] text-[#52525b] font-bold">Suggested Operations</div>
             <ul className="space-y-3">
                <li className="flex items-center gap-3 hover:text-accent-blue hover:bg-accent-blue/10 px-3 py-2 -mx-3 transition-colors cursor-pointer border-l-2 border-transparent hover:border-accent-blue" onClick={() => setQuery('log 2h web dev')}><ArrowRight size={14}/> log 2h web dev</li>
                <li className="flex items-center gap-3 hover:text-accent-blue hover:bg-accent-blue/10 px-3 py-2 -mx-3 transition-colors cursor-pointer border-l-2 border-transparent hover:border-accent-blue" onClick={() => setQuery('go habits')}><ArrowRight size={14}/> go habits</li>
                <li className="flex items-center gap-3 hover:text-accent-blue hover:bg-accent-blue/10 px-3 py-2 -mx-3 transition-colors cursor-pointer border-l-2 border-transparent hover:border-accent-blue" onClick={() => setQuery('go exercise')}><ArrowRight size={14}/> go exercise</li>
             </ul>
          </div>
       </div>
    </div>
  )
}
