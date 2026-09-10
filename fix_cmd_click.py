import re

with open("src/components/CommandPalette.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# I need to decouple the execution from the event.
func_old = """  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const cmd = query.toLowerCase().trim();"""

func_new = """  const executeCommand = async (overrideQuery?: string) => {
    const q = overrideQuery || query;
    if (!q.trim()) return;
    const cmd = q.toLowerCase().trim();"""

content = content.replace(func_old, func_new)

content = content.replace("    } catch (err) {\n      console.error('Command failed:', err);\n      setSuccess(false);\n    }\n  }", "    } catch (err) {\n      console.error('Command failed:', err);\n      setSuccess(false);\n    }\n  }\n\n  const handleCommand = (e: React.FormEvent) => {\n    e.preventDefault();\n    executeCommand();\n  }")

content = content.replace("onClick={() => setQuery('log 2h web dev')}", "onClick={() => executeCommand('log 2h web dev')}")
content = content.replace("onClick={() => setQuery('go habits')}", "onClick={() => executeCommand('go habits')}")
content = content.replace("onClick={() => setQuery('go exercise')}", "onClick={() => executeCommand('go exercise')}")

with open("src/components/CommandPalette.tsx", "w", encoding="utf-8") as f:
    f.write(content)
