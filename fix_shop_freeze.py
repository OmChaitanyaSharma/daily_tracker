import re

with open("src/pages/Shop.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace handleBuyFreeze with handleBuyHealth
health_func = """
  const handleBuyHealth = async () => {
    if (!profile || coins < 50) return;
    
    // Actually we don't have a health mechanic yet, so just subtract coins for now
    await db.userProfile.update('default', {
      coinsSpent: (profile.coinsSpent || 0) + 50
    });
    playSuccess();
  };
"""

content = re.sub(r"const handleBuyFreeze = async \(\) => \{.*?\};", health_func, content, flags=re.DOTALL)

# Replace the HTML for the Freeze
freeze_html_old = """        {/* Item 1 */}
        <div className="bg-bg-surface border border-border-strong rounded-[2rem] p-8 flex flex-col justify-between group shadow-sm">
          <div>
             <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 text-accent-blue flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <Shield size={32} />
             </div>
             <h3 className="text-2xl font-serif font-bold text-text-main mb-2">Streak Freeze</h3>
             <p className="text-text-muted text-sm mb-6">Protects your streak if you miss a day. (You currently own {profile.freezes || 0})</p>
          </div>
          
          <button 
             onClick={handleBuyFreeze}
             disabled={coins < 50}
             className={clsx("w-full py-4 rounded-xl font-mono text-sm tracking-widest uppercase font-bold transition-all", coins >= 50 ? "bg-accent-blue text-[#09090b] hover:bg-white shadow-[0_0_20px_rgba(59,130,246,0.3)]" : "bg-bg-base text-text-muted cursor-not-allowed")}
          >
             {coins >= 50 ? "Purchase (50 Coins)" : "Insufficient Funds (50)"}
          </button>
        </div>"""

health_html_new = """        {/* Item 1 */}
        <div className="bg-bg-surface border border-border-strong rounded-[2rem] p-8 flex flex-col justify-between group shadow-sm">
          <div>
             <div className="w-16 h-16 rounded-2xl bg-accent-green/10 text-accent-green flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <Shield size={32} />
             </div>
             <h3 className="text-2xl font-serif font-bold text-text-main mb-2">Health Potion</h3>
             <p className="text-text-muted text-sm mb-6">Instantly defeats 100 HP of the Weekly Boss. (Feature coming soon)</p>
          </div>
          
          <button 
             onClick={handleBuyHealth}
             disabled={coins < 50}
             className={clsx("w-full py-4 rounded-xl font-mono text-sm tracking-widest uppercase font-bold transition-all", coins >= 50 ? "bg-accent-green text-[#09090b] hover:bg-white shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-bg-base text-text-muted cursor-not-allowed")}
          >
             {coins >= 50 ? "Purchase (50 Coins)" : "Insufficient Funds (50)"}
          </button>
        </div>"""

content = content.replace(freeze_html_old, health_html_new)

with open("src/pages/Shop.tsx", "w", encoding="utf-8") as f:
    f.write(content)
