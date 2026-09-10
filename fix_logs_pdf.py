import re

with open("src/pages/Logs.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_old = "import { CityHeatmap3D } from '../components/CityHeatmap3D';"
import_new = "import { CityHeatmap3D } from '../components/CityHeatmap3D';\nimport jsPDF from 'jspdf';\nimport html2canvas from 'html2canvas';"
content = content.replace(import_old, import_new)

# Add PDF function
pdf_func = """
  const handleExportPDF = async () => {
    const element = document.getElementById('logs-report-container');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { backgroundColor: '#000011', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('DailyTracker_Report.pdf');
    } catch (e) {
      console.error("PDF generation failed", e);
    }
  };
"""

state_search = "const [viewMode, setViewMode] = useState<'calendar' | 'digest'>('calendar');"
content = content.replace(state_search, state_search + "\n" + pdf_func)

# Add ID to container
container_old = '<div className="max-w-5xl mx-auto pt-12 pb-24 px-4 animate-fade-in">'
container_new = '<div id="logs-report-container" className="max-w-5xl mx-auto pt-12 pb-24 px-4 animate-fade-in">'
content = content.replace(container_old, container_new)

# Add Export PDF button
btn_old = """          <Download size={16} /> Export JSON
        </button>
      </header>"""

btn_new = """          <Download size={16} /> Export JSON
        </button>
        <button 
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-accent-blue/10 text-accent-blue rounded-xl font-bold font-mono text-sm tracking-widest uppercase hover:bg-accent-blue/20 transition-all border border-accent-blue/20 ml-2"
        >
          <Download size={16} /> PDF Report
        </button>
      </header>"""

content = content.replace(btn_old, btn_new)

with open("src/pages/Logs.tsx", "w", encoding="utf-8") as f:
    f.write(content)
