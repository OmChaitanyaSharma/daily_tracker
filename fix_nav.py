import re

with open("src/components/Layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

bad_nav_pattern = r'<nav.*?<\/nav>'

good_nav = """<nav className="bg-bg-surface/80 backdrop-blur-xl border border-border-strong px-4 py-3 rounded-3xl flex items-center gap-2 shadow-2xl">
          <Link to="/" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">\\U0001f3e0</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">HOME</span>
          </Link>
          <div className="w-[1px] h-8 bg-border-strong mx-1" />
          <Link to="/highlight" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">\\U0001f4dd</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">LOG</span>
          </Link>
          <Link to="/habits/productivity" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">\\u2694\\ufe0f</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">HABITS</span>
          </Link>
          <Link to="/habits/health" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">\\U0001f4aa</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">FIT</span>
          </Link>
          <div className="w-[1px] h-8 bg-border-strong mx-1" />
          <button onClick={() => setZenMode(!zenMode)} className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">{zenMode ? '\\U0001f441\\ufe0f' : '\\U0001f9d8'}</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">ZEN</span>
          </button>
          <button onClick={toggleTheme} className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-text-muted group-hover:text-text-main group-hover:scale-125 transition-all duration-300">
               {isDark ? <Sun size={20} /> : <Moon size={20} />}
             </span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">THEME</span>
          </button>
        </nav>"""

good_nav = good_nav.encode('ascii').decode('unicode_escape')

content = re.sub(bad_nav_pattern, good_nav, content, flags=re.DOTALL)

with open("src/components/Layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
