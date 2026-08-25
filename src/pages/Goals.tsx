import { Link } from 'react-router-dom';
import { Target, Heart, ArrowLeft } from 'lucide-react';

export function Goals() {
  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in space-y-12">
      <header className="flex items-center gap-6 border-b border-border-subtle pb-6">
        <Link to="/" className="text-text-muted hover:text-text-main transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-serif italic text-text-main">Goals</h1>
          <p className="text-sm text-text-muted mt-2">Long-term personal progress</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link to="/goals/end-of-year" className="block group">
          <div className="bg-bg-surface border border-border-strong rounded-3xl p-8 hover:bg-bg-surface-hover transition-colors h-full flex flex-col items-center justify-center text-center gap-6">
            <div className="w-16 h-16 bg-bg-base rounded-full border border-border-strong flex items-center justify-center text-text-main group-hover:scale-110 transition-transform duration-300">
              <Target size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-serif italic text-text-main mb-3">Goals Till End of Year</h2>
              <p className="text-text-muted max-w-sm mx-auto leading-relaxed">
                Track everything I want to achieve before the end of the year.
              </p>
            </div>
          </div>
        </Link>

        <Link to="/goals/health" className="block group">
          <div className="bg-bg-surface border border-border-strong rounded-3xl p-8 hover:bg-bg-surface-hover transition-colors h-full flex flex-col items-center justify-center text-center gap-6">
            <div className="w-16 h-16 bg-bg-base rounded-full border border-border-strong flex items-center justify-center text-[#ef4444] group-hover:scale-110 transition-transform duration-300">
              <Heart size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-serif italic text-text-main mb-3">Health Goals</h2>
              <p className="text-text-muted max-w-sm mx-auto leading-relaxed">
                Track physical measurements, fitness and health-related progress.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
