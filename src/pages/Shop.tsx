import { ArrowLeft, Coffee, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useEconomy } from '../hooks/useEconomy';
import clsx from 'clsx';
import { useSound } from '../hooks/useSound';

export function Shop() {
  const { coins, isLoading } = useEconomy();
  const profile = useLiveQuery(() => db.userProfile.get('default'));
  const { playSuccess, playClick } = useSound();

  
  const handleBuyHealth = async () => {
    if (!profile || coins < 50) return;
    
    // Actually we don't have a health mechanic yet, so just subtract coins for now
    await db.userProfile.update('default', {
      coinsSpent: (profile.coinsSpent || 0) + 50
    });
    playSuccess();
  };


  const handleBuyCoffee = async () => {
    if (!profile || coins < 10) return;
    
    await db.userProfile.update('default', {
      coinsSpent: (profile.coinsSpent || 0) + 10
    });
    playClick();
  };

  if (isLoading || !profile) return null;

  return (
    <div className="max-w-4xl mx-auto pt-12 pb-24 px-4 animate-fade-in">
      <Link to="/" className="inline-flex items-center text-text-muted hover:text-text-main transition-colors mb-8 font-mono text-sm uppercase tracking-widest">
        <ArrowLeft size={16} className="mr-2" />
        Back to Dashboard
      </Link>

      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-5xl font-serif text-text-main mb-2">The Bazaar</h1>
          <p className="text-text-muted">Spend your hard-earned coins.</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Balance</div>
          <div className="text-4xl font-mono font-bold text-accent-yellow drop-shadow-[0_0_15px_rgba(224,175,104,0.3)] flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent-yellow" />
            {Math.floor(coins)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Item 1 */}
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
        </div>

        {/* Item 2 */}
        <div className="bg-bg-surface border border-border-strong rounded-[2rem] p-8 flex flex-col justify-between group shadow-sm">
          <div>
             <div className="w-16 h-16 rounded-2xl bg-accent-yellow/10 text-accent-yellow flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <Coffee size={32} />
             </div>
             <h3 className="text-2xl font-serif font-bold text-text-main mb-2">Virtual Coffee</h3>
             <p className="text-text-muted text-sm mb-6">Does absolutely nothing except make you feel warm inside. And wastes your coins.</p>
          </div>
          
          <button 
             onClick={handleBuyCoffee}
             disabled={coins < 10}
             className={clsx("w-full py-4 rounded-xl font-mono text-sm tracking-widest uppercase font-bold transition-all", coins >= 10 ? "bg-accent-yellow text-[#09090b] hover:bg-white shadow-[0_0_20px_rgba(224,175,104,0.3)]" : "bg-bg-base text-text-muted cursor-not-allowed")}
          >
             {coins >= 10 ? "Purchase (10 Coins)" : "Insufficient Funds (10)"}
          </button>
        </div>

      </div>
    </div>
  );
}
