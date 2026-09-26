import React, { useState, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Sparkles,
  Music
} from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { TrackCard } from './TrackCard';
import { TrackTable } from './TrackTable';

type SortOption = 'relevance' | 'duration-asc' | 'duration-desc' | 'title-asc';
type SourceFilter = 'all' | 'audius' | 'youtube';
type DurationFilter = 'all' | 'short' | 'standard';

const SUGGESTED_SEARCHES = [
  'Arijit Singh',
  'Diljit Dosanjh',
  'Anirudh Ravichander',
  'Seedhe Maut',
  'A.R. Rahman',
  'AP Dhillon',
  'DIVINE',
  'Karan Aujla',
  'Shreya Ghoshal',
  'Prateek Kuhad',
  'Sidhu Moose Wala',
  'Anuv Jain'
];

export const SearchResultsView: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    selectedGenre
  } = useMusicStore();

  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter & Sort Results
  const processedTracks = useMemo(() => {
    let list = [...searchResults];

    // 1. Source filter
    if (sourceFilter !== 'all') {
      list = list.filter((t) => t.source === sourceFilter);
    }

    // 2. Duration filter
    if (durationFilter === 'short') {
      list = list.filter((t) => (t.duration || 0) < 180); // < 3 mins
    } else if (durationFilter === 'standard') {
      list = list.filter((t) => (t.duration || 0) >= 180); // >= 3 mins
    }

    // 3. Genre filter (if active)
    if (
      selectedGenre !== 'ALL VIBES' &&
      selectedGenre !== 'ALL WORKSTATIONS' &&
      selectedGenre !== 'All Vibes'
    ) {
      list = list.filter(
        (t) => t.genre?.toLowerCase() === selectedGenre.toLowerCase()
      );
    }

    // 4. Sorting
    if (sortBy === 'duration-asc') {
      list.sort((a, b) => (a.duration || 0) - (b.duration || 0));
    } else if (sortBy === 'duration-desc') {
      list.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    } else if (sortBy === 'title-asc') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [searchResults, sourceFilter, durationFilter, selectedGenre, sortBy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
            Search Results
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            “{searchQuery}”
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Found {processedTracks.length} tracks across Audius & YouTube
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-0.5 bg-white/[0.04] border border-white/[0.06] rounded-xl self-start md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Source filters */}
          {(['all', 'audius', 'youtube'] as SourceFilter[]).map((src) => {
            const isSelected = sourceFilter === src;
            return (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`px-3 py-1.5 rounded-full capitalize transition-all ${
                  isSelected
                    ? 'bg-white text-black font-medium shadow-sm'
                    : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.05]'
                }`}
              >
                {src === 'all' ? 'All Sources' : src}
              </button>
            );
          })}

          <span className="text-zinc-600 px-1">|</span>

          {/* Duration filters */}
          {(['all', 'short', 'standard'] as DurationFilter[]).map((dur) => {
            const isSelected = durationFilter === dur;
            return (
              <button
                key={dur}
                onClick={() => setDurationFilter(dur)}
                className={`px-3 py-1.5 rounded-full capitalize transition-all ${
                  isSelected
                    ? 'bg-white text-black font-medium shadow-sm'
                    : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.05]'
                }`}
              >
                {dur === 'all' ? 'All Durations' : dur === 'short' ? '< 3 mins' : '3+ mins'}
              </button>
            );
          })}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-xs">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-white/20 transition-all cursor-pointer"
          >
            <option value="relevance" className="bg-[#12141D] text-white">Relevance</option>
            <option value="duration-asc" className="bg-[#12141D] text-white">Shortest first</option>
            <option value="duration-desc" className="bg-[#12141D] text-white">Longest first</option>
            <option value="title-asc" className="bg-[#12141D] text-white">Title A–Z</option>
          </select>
        </div>
      </div>

      {/* Catalog Results Grid / Table */}
      {isSearching ? (
        /* Minimalist Skeleton Loading Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-3 animate-pulse"
            >
              <div className="aspect-square w-full rounded-xl bg-white/[0.05]" />
              <div className="h-3.5 bg-white/[0.08] rounded-md w-3/4" />
              <div className="h-2.5 bg-white/[0.04] rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : processedTracks.length === 0 ? (
        /* Clean Invitation Empty State */
        <div className="p-12 sm:p-16 rounded-3xl bg-white/[0.02] border border-white/[0.06] text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              No matching tracks found
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Try searching with another keyword or explore popular artists below:
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
            {SUGGESTED_SEARCHES.map((query) => (
              <button
                key={query}
                onClick={() => setSearchQuery(query)}
                className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-300 hover:text-white border border-white/[0.06] transition-all"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {processedTracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      ) : (
        <TrackTable tracks={processedTracks} />
      )}
    </div>
  );
};
