import re

with open("src/components/CommandPalette.tsx", "r", encoding="utf-8") as f:
    content = f.read()

input_old = """             <input 
                ref={inputRef}
                value={success ? feedback : query}
                onChange={e => setQuery(e.target.value)}"""

input_new = """             <input 
                ref={inputRef}
                value={success ? feedback : query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Shift') {
                    e.preventDefault();
                    executeCommand();
                  }
                }}"""

content = content.replace(input_old, input_new)

with open("src/components/CommandPalette.tsx", "w", encoding="utf-8") as f:
    f.write(content)
