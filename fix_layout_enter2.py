import re

with open("src/components/Layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# I need to fix the 'Enter' case
old_enter = """        case 'Enter':
          if (activeElement) {
            if (isInput) {
              e.preventDefault();
              activeElement.dataset.editMode = "true";
            } else if (!['BUTTON', 'A'].includes(activeTag)) {
              activeElement.click();
            }
          }
          break;"""

new_enter = """        case 'enter':
          if (activeElement) {
            if (isInput) {
              e.preventDefault();
              activeElement.dataset.editMode = "true";
            } else {
              e.preventDefault();
              activeElement.click();
            }
          }
          break;"""

content = content.replace(old_enter, new_enter)

with open("src/components/Layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
