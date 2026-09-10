const fs = require('fs');

let content = fs.readFileSync('src/components/Layout.tsx', 'utf-8');

const regex = /<nav className="bg-bg-surface\/80 backdrop-blur-xl border border-border-strong px-4 py-3 rounded-3xl flex items-center gap-2 shadow-2xl">([\s\S]*?)<\/nav>/m;

const correctNav = `
          <Link to="/" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">??</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">HOME</span>
          </Link>
          <div className="w-[1px] h-8 bg-border-strong mx-1" />
          <Link to="/highlight" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">??</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">HIGHLIGHT</span>
          </Link>
          <Link to="/habits/productivity" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">??</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">HABITS</span>
          </Link>
          <Link to="/goals" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">??</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">GOALS</span>
          </Link>
          <Link to="/logs" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">??</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">LOGS</span>
          </Link>
          <div className="w-[1px] h-8 bg-border-strong mx-1" />
          <Link to="/calendar" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">??</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">PLAN</span>
          </Link>
          <Link to="/habits/health" className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">??</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">FIT</span>
          </Link>
          <div className="w-[1px] h-8 bg-border-strong mx-1" />
          <button onClick={() => setZenMode(!zenMode)} className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">{zenMode ? '?????' : '???'}</span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">ZEN</span>
          </button>
          <button onClick={toggleTheme} className="group p-3 rounded-2xl hover:bg-bg-base transition-all flex flex-col items-center gap-1 min-w-[64px]">
             <span className="text-xl group-hover:scale-125 transition-transform duration-300">
               {arcTheme === 'winter' ? '??' : arcTheme === 'spring' ? '??' : arcTheme === 'summer' ? '??' : '??'}
             </span>
             <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">THEME</span>
          </button>
`;

content = content.replace(regex, `<nav className="bg-bg-surface/80 backdrop-blur-xl border border-border-strong px-4 py-3 rounded-3xl flex items-center gap-2 shadow-2xl">\n${correctNav}\n</nav>`);

fs.writeFileSync('src/components/Layout.tsx', content, 'utf-8');
