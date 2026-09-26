import React from 'react';
import { Search, Menu, X, Sliders, Settings } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { GENRES } from '../data/mockTracks';

interface WorkstationHeaderProps {
  onToggleMobileMenu: () => void;
  onOpenProAudio: () => void;
}

export const WorkstationHeader: React.FC<WorkstationHeaderProps> = ({
  onToggleMobileMenu,
  onOpenProAudio
}) => {
  const {
    searchQuery,
    setSearchQuery,
    selectedGenre,
    setSelectedGenre,
    spatialMode,
    eqPreset,
    activeTab,
    setActiveTab
  } = useMusicStore();

  return (
    <header className="sticky top-0 z-30 bg-[#08090D]/85 backdrop-blur-2xl border-b border-white/[0.06] px-4 md:px-8 py-3.5 transition-all">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Mobile Menu & Search Input */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-lg">
          <button
            onClick={onToggleMobileMenu}
            className="p-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white md:hidden"
            title="Toggle Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Search Input: Tidal / Apple Music Sleek Style */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Bollywood, Punjabi, artists, songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] focus:border-white/30 focus:bg-white/[0.08] text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none transition-all duration-200"
              id="track-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Controls: Pro Audio & Settings */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onOpenProAudio}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white transition-all shadow-sm"
            title="Open Pro Audio Equalizer"
          >
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Pro Audio</span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {spatialMode.toUpperCase()}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-medium ${
              activeTab === 'settings'
                ? 'bg-white text-black border-white shadow-md'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border-white/[0.08]'
            }`}
            title="Settings & Profile"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Genre Filter Pills: Editorial Curated Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-0.5 scrollbar-none max-w-7xl mx-auto">
        {GENRES.map((genre) => {
          const isSelected = selectedGenre === genre;
          return (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                isSelected
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.07] border border-white/[0.05]'
              }`}
            >
              {genre === 'ALL WORKSTATIONS' ? 'All Vibes' : genre}
            </button>
          );
        })}
      </div>
    </header>
  );
};
