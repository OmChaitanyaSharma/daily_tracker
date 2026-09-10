import re

with open("src/components/Layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

dock_item_old = """          <Link to="/highlight" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">\\U0001f4dd</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">LOG</span>
          </Link>"""

dock_item_new = """          <Link to="/highlight" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">\\U0001f4dd</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">LOG</span>
          </Link>
          <Link to="/calendar" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">\\U0001f4c5</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">PLAN</span>
          </Link>"""

# We need to un-escape the unicode escapes
dock_item_new = dock_item_new.encode('ascii').decode('unicode_escape')
dock_item_old = dock_item_old.encode('ascii').decode('unicode_escape')

content = content.replace(dock_item_old, dock_item_new)

with open("src/components/Layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
