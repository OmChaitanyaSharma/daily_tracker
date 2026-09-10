import re

with open("src/components/CommandPalette.tsx", "r", encoding="utf-8") as f:
    content = f.read()

input_old = """             <div className="text-[10px] text-[#52525b] font-mono tracking-widest uppercase border border-[#27272a] px-2 py-1 bg-[#18181b]">ESC</div>
          </form>"""

input_new = """             <button type="submit" className="hidden">Submit</button>
             <div className="text-[10px] text-[#52525b] font-mono tracking-widest uppercase border border-[#27272a] px-2 py-1 bg-[#18181b]">ESC</div>
          </form>"""

content = content.replace(input_old, input_new)

with open("src/components/CommandPalette.tsx", "w", encoding="utf-8") as f:
    f.write(content)
