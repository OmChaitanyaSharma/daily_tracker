import re

with open("src/components/Layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

shop_jsx = """            <Link to="/shop" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
               <span className="text-xl group-hover:scale-125 transition-transform duration-300">\U0001f6cd\uFE0F</span>
               <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">SHOP</span>
            </Link>
            <div className="w-[1px] h-8 bg-border-strong mx-1" />"""

# I will place it after the first separator
first_sep = """<div className="w-[1px] h-8 bg-border-strong mx-1" />"""
content = content.replace(first_sep, first_sep + "\n" + shop_jsx, 1)

with open("src/components/Layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
