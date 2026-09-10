import re

with open("src/components/Layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Emojis were corrupted to "??" or similar. Let's rebuild the nav block safely using pure Python unicode escapes.
# We will match the entire <nav> block.

nav_regex = re.compile(r'<nav className="bg-bg-surface/80 backdrop-blur-xl border border-border-strong px-4 py-3 rounded-3xl flex items-center gap-2 shadow-2xl">.*?</nav>', re.DOTALL)

home = "\U0001F3E0"      # Home
highlight = "\U0001F4DD" # Memo/Highlight
habits = "\u2694\uFE0F"  # Crossed swords
goals = "\U0001F3AF"     # Direct Hit (Dart board)
logs = "\U0001F4CA"      # Bar chart
calendar = "\U0001F4C5"  # Calendar
health = "\U0001F4AA"    # Flexed bicep
zen = "\U0001F9D8\u200D\u2642\uFE0F" # Zen
eye = "\U0001F441\uFE0F" # Eye
winter = "\u2744\uFE0F"  # Snowflake
spring = "\U0001F338"    # Cherry blossom
summer = "\u2600\uFE0F"  # Sun
autumn = "\U0001F341"    # Maple leaf

new_nav = f"""<nav className="bg-bg-surface/80 backdrop-blur-xl border border-border-strong px-4 py-3 rounded-3xl flex items-center gap-2 shadow-2xl">
          <Link to="/" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">{home}</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">HOME</span>
          </Link>
          <div className="w-[1px] h-8 bg-border-strong mx-1" />
          <Link to="/highlight" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">{highlight}</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">HIGHLIGHT</span>
          </Link>
          <Link to="/habits/productivity" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">{habits}</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">HABITS</span>
          </Link>
          <Link to="/goals" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">{goals}</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">GOALS</span>
          </Link>
          <Link to="/logs" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">{logs}</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">LOGS</span>
          </Link>
          <div className="w-[1px] h-8 bg-border-strong mx-1" />
          <Link to="/calendar" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">{calendar}</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">PLAN</span>
          </Link>
          <Link to="/habits/health" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">{health}</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">FIT</span>
          </Link>
          <div className="w-[1px] h-8 bg-border-strong mx-1" />
          <button onClick={{() => setZenMode(!zenMode)}} className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">{{zenMode ? '{zen}' : '{eye}'}}</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">ZEN</span>
          </button>
          <button onClick={{toggleTheme}} className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">
               {{arcTheme === 'winter' ? '{winter}' : arcTheme === 'spring' ? '{spring}' : arcTheme === 'summer' ? '{summer}' : '{autumn}'}}
             </span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">THEME</span>
          </button>
        </nav>"""

content = nav_regex.sub(new_nav, content)

with open("src/components/Layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
