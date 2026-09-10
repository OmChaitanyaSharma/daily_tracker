import re

with open("src/components/CommandPalette.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add a state for success
state_old = "  const [query, setQuery] = useState('');"
state_new = "  const [query, setQuery] = useState('');\n  const [success, setSuccess] = useState(false);\n  const [feedback, setFeedback] = useState('');"
content = content.replace(state_old, state_new)

# Modify the handler
handler_old = '''    if (cmd.startsWith('log ') && cmd.includes('h ')) {
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
    }'''

handler_new = '''    if (cmd.startsWith('log ') && cmd.includes('h ')) {
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
           setSuccess(true);
           setFeedback(`LOGGED ${hours}H OF ${activity.toUpperCase()}`);
           setTimeout(() => {
              setSuccess(false);
              setFeedback('');
              setOpen(false);
           }, 1000);
           return;
        }
    }'''
content = content.replace(handler_old, handler_new)

# Reset success when opened
effect_old = '''  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery('');
    }
  }, [open]);'''

effect_new = '''  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      setSuccess(false);
      setFeedback('');
    } else {
      setQuery('');
    }
  }, [open]);'''
content = content.replace(effect_old, effect_new)

# Update UI to reflect success
ui_old = '''          <form onSubmit={handleCommand} className="flex items-center px-6 py-5 border-b border-[#27272a] bg-[#09090b]">
             <Terminal className="text-accent-blue mr-4 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" size={20} />
             <input 
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="EXECUTE COMMAND..."
                className="flex-1 bg-transparent border-none outline-none text-xl text-[#ececf1] font-mono tracking-widest placeholder:text-[#3f3f46] uppercase"
             />
             <div className="text-[10px] text-[#52525b] font-mono tracking-widest uppercase border border-[#27272a] px-2 py-1 bg-[#18181b]">ESC</div>
          </form>'''

ui_new = '''          <form onSubmit={handleCommand} className="flex items-center px-6 py-5 border-b border-[#27272a] bg-[#09090b] relative">
             <Terminal className={success ? "text-accent-green mr-4 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "text-accent-blue mr-4 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"} size={20} />
             <input 
                ref={inputRef}
                value={success ? feedback : query}
                onChange={e => setQuery(e.target.value)}
                placeholder="EXECUTE COMMAND..."
                disabled={success}
                className={`flex-1 bg-transparent border-none outline-none text-xl font-mono tracking-widest placeholder:text-[#3f3f46] uppercase ${success ? "text-accent-green" : "text-[#ececf1]"}`}
             />
             <div className="text-[10px] text-[#52525b] font-mono tracking-widest uppercase border border-[#27272a] px-2 py-1 bg-[#18181b]">ESC</div>
          </form>'''

content = content.replace(ui_old, ui_new)

with open("src/components/CommandPalette.tsx", "w", encoding="utf-8") as f:
    f.write(content)
