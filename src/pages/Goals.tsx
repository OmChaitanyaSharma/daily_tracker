import { Link } from 'react-router-dom';
import { getSettings } from '../utils/settings';
import { Target, Heart, ArrowLeft } from 'lucide-react';

export function Goals() {
  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in space-y-12">
      <header className="flex items-center gap-4 sm:gap-6 border-b border-border-subtle pb-6">
        <Link
          to="/"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-surface border border-transparent hover:border-border-subtle transition-all tap-press"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif italic text-text-main">Goals</h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">Milestones, physical measurements, and target dates</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <Link to="/goals/end-of-year" className="block group">
          <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 sm:p-10 hover-lift transition-all h-full flex flex-col items-center justify-center text-center gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent-yellow-bg rounded-full text-accent-yellow flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
              <Target size={28} className="sm:w-8 sm:h-8" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif text-text-main mb-2 sm:mb-3 font-medium">End of {getSettings().seasonName}</h2>
              <p className="text-text-muted text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                Core milestones and qualitative targets for the season.
              </p>
            </div>
          </div>
        </Link>

        <Link to="/goals/health" className="block group">
          <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 sm:p-10 hover-lift transition-all h-full flex flex-col items-center justify-center text-center gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent-red-bg rounded-full text-accent-red flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
              <Heart size={28} className="sm:w-8 sm:h-8" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif text-text-main mb-2 sm:mb-3 font-medium">Health & Fitness</h2>
              <p className="text-text-muted text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                Weight tracking, body measurements, and athletic benchmarks.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
