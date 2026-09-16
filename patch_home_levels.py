import re

with open("src/pages/Home.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "import { useLevelSystem, DEV_RANKS, FIT_RANKS } from '../hooks/useLevelSystem';",
    "import { useLevelSystem, DEFAULT_DEV_RANKS, DEFAULT_FIT_RANKS } from '../hooks/useLevelSystem';\nimport { getSettings } from '../utils/settings';"
)

render_logic = """
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {(levelModal === 'dev' ? DEFAULT_DEV_RANKS : DEFAULT_FIT_RANKS).map((rank, idx, arr) => {
                    const settings = getSettings();
                    const title = levelModal === 'dev' ? settings.devRanksNames[idx] : settings.fitRanksNames[idx];
                    const prevMax = idx === 0 ? 0 : arr[idx-1].max;
                    const req = idx === arr.length - 1 ? `${prevMax}+` : `${prevMax + 1}-${rank.max}`;
                    const currentLevel = levelModal === 'dev' ? dev.level : fitness.level;
                    const isUnlocked = currentLevel > prevMax;
                    const isCurrent = currentLevel > prevMax && currentLevel <= rank.max;
                    
                    return (
                      <div key={rank.title} className={`flex items-center justify-between p-3 rounded-xl border ${isCurrent ? 'bg-accent-blue/10 border-accent-blue/30' : 'bg-bg-base border-border-subtle'} ${!isUnlocked && 'opacity-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-accent-blue text-bg-base' : 'bg-bg-surface text-text-muted'}`}>
                            {idx + 1}
                          </div>
                          <span className={`font-medium ${isCurrent ? 'text-accent-blue' : 'text-text-main'}`}>{title || rank.title}</span>
                        </div>
                        <span className="text-xs font-mono text-text-muted">{req} {levelModal === 'dev' ? 'hrs' : 'days'}</span>
                      </div>
                    );
                  })}
                </div>"""

content = re.sub(r'<div className="space-y-3 max-h-\[60vh\] overflow-y-auto pr-2 custom-scrollbar">.*?</div>\s*</div>', render_logic + "\n              </div>", content, flags=re.DOTALL)

with open("src/pages/Home.tsx", "w", encoding="utf-8") as f:
    f.write(content)
