import re

with open("src/components/CommandPalette.tsx", "r", encoding="utf-8") as f:
    content = f.read()

func_old = """  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const cmd = query.toLowerCase().trim();"""

func_new = """  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const cmd = query.toLowerCase().trim();
    
    try {"""

content = content.replace(func_old, func_new)

content = content.replace("    // Fallback\n    console.log(\"Unknown command:\", query);\n    setOpen(false);\n  }", "    // Fallback\n    console.log(\"Unknown command:\", query);\n    setOpen(false);\n    } catch (err) {\n      console.error('Command failed:', err);\n      setSuccess(false);\n    }\n  }")

with open("src/components/CommandPalette.tsx", "w", encoding="utf-8") as f:
    f.write(content)
