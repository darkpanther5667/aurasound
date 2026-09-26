import React, { useState, useEffect } from 'react';
import { useMusicStore } from './store/useMusicStore';
import { Sidebar } from './components/Sidebar';
import { WorkstationHeader } from './components/WorkstationHeader';
import { HomeHeroNowPlaying } from './components/HomeHeroNowPlaying';
import { FriendsListeningBar } from './components/FriendsListeningBar';
import { ProAudioModal } from './components/ProAudioModal';
import { TrackCard } from './components/TrackCard';
import { TrackTable } from './components/TrackTable';
import { SearchResultsView } from './components/SearchResultsView';
import { LibraryView } from './components/LibraryView';
import { SettingsView } from './components/SettingsView';
import { PlayerBar } from './components/PlayerBar';
import { QueueDrawer } from './components/QueueDrawer';
import { AudioVisualizer } from './components/AudioVisualizer';
import {
  LayoutGrid,
  List,
  Sparkles,
  Heart,
  Sliders,
  Radio,
  Flame,
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';

export function App() {
  const {
    allTracks,
    searchResults,
    isSearching,
    fetchCatalog,
    toast,
    dismissToast,
    activeTab,
    setActiveTab,
    searchQuery,
    selectedGenre,
    favorites,
    spatialMode,
    setSpatialMode,
    eqPreset,
    setEqPreset
  } = useMusicStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isProAudioOpen, setIsProAudioOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Filter catalog or search results
  const baseTracks = searchQuery.trim().length > 0 ? searchResults : allTracks;
  const filteredTracks = baseTracks.filter((track) => {
    const matchesGenre =
      selectedGenre === 'ALL VIBES' ||
      selectedGenre === 'ALL WORKSTATIONS' ||
      selectedGenre === 'All Vibes' ||
      track.genre?.toLowerCase() === selectedGenre.toLowerCase();

    return matchesGenre;
  });

  return (
    <div className="min-h-screen bg-[#06070A] text-[#F4F4F6] flex font-sans selection:bg-white/20 selection:text-white relative overflow-x-hidden">
      {/* Vision Pro Spatial Environment Backdrop */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[20%] left-[20%] w-[800px] h-[800px] rounded-full bg-indigo-950/25 blur-[180px]" />
        <div className="absolute top-[40%] right-[10%] w-[600px] h-[600px] rounded-full bg-violet-950/20 blur-[160px]" />
      </div>

      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
        isQueueOpen={isQueueOpen}
        onOpenProAudio={() => setIsProAudioOpen(true)}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 pb-36">
        {/* Sticky Header with Search & Pro Audio pill */}
        <WorkstationHeader
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenProAudio={() => setIsProAudioOpen(true)}
        />

        {/* Dynamic Route Body */}
        <main className="p-4 md:p-8 space-y-7 max-w-7xl w-full mx-auto">
          {/* TAB 1: HOME / FOR YOU (DIRECTION 1: HYPER-GLOW & FLUID GLASS) */}
          {activeTab === 'discover' && (
            searchQuery.trim().length > 0 ? (
              <SearchResultsView />
            ) : (
              <div className="space-y-7 animate-in fade-in duration-300">
                {/* 1. Social Bar: Friends Listening Now */}
                <FriendsListeningBar />

                {/* 2. Dominant Now-Playing Hero with Dynamic Ambient Color Glow */}
                <HomeHeroNowPlaying onOpenProAudio={() => setIsProAudioOpen(true)} />

                {/* 3. Catalog Section: For You Tracks */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                        {selectedGenre === 'ALL VIBES' || selectedGenre === 'ALL WORKSTATIONS' || selectedGenre === 'All Vibes'
                          ? 'Trending in India'
                          : `${selectedGenre} Hits`}
                      </h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {filteredTracks.length} lossless spatial audio masterings
                      </p>
                    </div>

                    {/* View Switcher */}
                    <div className="flex items-center gap-1 p-0.5 bg-white/[0.04] border border-white/[0.06] rounded-xl">
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

                  {/* Catalog Body */}
                  {filteredTracks.length === 0 ? (
                    <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/[0.06] text-center text-slate-400 text-sm">
                      No tracks found matching your query.
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {filteredTracks.map((track) => (
                        <TrackCard key={track.id} track={track} />
                      ))}
                    </div>
                  ) : (
                    <TrackTable tracks={filteredTracks} />
                  )}
                </div>
              </div>
            )
          )}

          {/* TAB 2: LIBRARY (FAVORITES & UP NEXT/QUEUE) */}
          {activeTab === 'library' && <LibraryView />}

          {/* TAB 3: SOUND LAB (UNTOUCHED UNTIL APPROVAL) */}
          {activeTab === 'soundlab' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-3 border-b border-white/[0.08]">
                <h1 className="text-2xl font-black uppercase tracking-tight text-white">
                  Sound Lab · DSP Processing Matrix
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Native Web Audio Biquad Filter Bank & Parametric Response
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Real-time Visualizer
                </span>
                <AudioVisualizer height={200} showModeSelector={true} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                    <Sliders className="w-4 h-4 text-violet-400" />
                    <h3 className="text-xs font-bold text-white uppercase">
                      Equalizer Presets
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {[
                      { id: 'reference', label: 'Studio Reference', desc: 'Neutral flat curve' },
                      { id: 'warm-analog', label: 'Warm Vinyl', desc: '+3.5dB Bass, smooth highs' },
                      { id: 'club-sub', label: 'Club Subwoofer', desc: '+5.8dB Sub punch' },
                      { id: 'vocal-air', label: 'Vocal Presence', desc: '+4.2dB High clarity' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setEqPreset(item.id as any)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                          eqPreset === item.id
                            ? 'bg-violet-600 text-white font-bold border-violet-500 shadow-md'
                            : 'bg-white/[0.02] border-white/[0.04] text-slate-300 hover:text-white'
                        }`}
                      >
                        <div>
                          <p>{item.label}</p>
                          <p className={`text-[10px] ${eqPreset === item.id ? 'text-violet-100' : 'text-slate-500'}`}>
                            {item.desc}
                          </p>
                        </div>
                        {eqPreset === item.id && (
                          <span className="text-[10px] text-violet-200 uppercase font-mono">ACTIVE</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                    <Radio className="w-4 h-4 text-violet-400" />
                    <h3 className="text-xs font-bold text-white uppercase">
                      Spatial Acoustic Staging
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {[
                      { id: 'stereo', label: 'Stereo Field Wide', desc: 'Standard dual-channel field' },
                      { id: 'binaural', label: 'Binaural 3D Headphone HRTF', desc: 'Immersive acoustic model' },
                      { id: 'mono', label: 'Mono Monitor Sum', desc: 'Single-channel mix check' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSpatialMode(item.id as any)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                          spatialMode === item.id
                            ? 'bg-violet-600 text-white font-bold border-violet-500 shadow-md'
                            : 'bg-white/[0.02] border-white/[0.04] text-slate-300 hover:text-white'
                        }`}
                      >
                        <div>
                          <p>{item.label}</p>
                          <p className={`text-[10px] ${spatialMode === item.id ? 'text-violet-100' : 'text-slate-500'}`}>
                            {item.desc}
                          </p>
                        </div>
                        {spatialMode === item.id && (
                          <span className="text-[10px] text-violet-200 uppercase font-mono">ACTIVE</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE BROADCAST / JAMS (UNTOUCHED UNTIL APPROVAL) */}
          {activeTab === 'broadcast' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="pb-3 border-b border-white/[0.08]">
                <h1 className="text-2xl font-black uppercase tracking-tight text-white">
                  Live Jams & Broadcast
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Synchronized Social Listening Room
                </p>
              </div>

              <FriendsListeningBar />
            </div>
          )}

          {/* TAB 5: ACCOUNT & SETTINGS */}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* 3. Docked Compact Player Bar */}
      <PlayerBar
        isQueueOpen={isQueueOpen}
        onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
      />

      {/* 4. Sliding Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
      />

      {/* 5. Pro Audio Modal (Collapsed Sound Lab Sheet) */}
      <ProAudioModal
        isOpen={isProAudioOpen}
        onClose={() => setIsProAudioOpen(false)}
      />

      {/* 6. Inline Toast Notification for Stream Errors & Alerts */}
      {toast && (
        <div
          role="alert"
          className="fixed top-20 right-4 sm:right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#150F24]/95 border border-violet-500/40 text-violet-200 shadow-2xl shadow-violet-950/80 backdrop-blur-xl animate-in slide-in-from-top-2 fade-in duration-300 max-w-md"
        >
          <AlertCircle className="w-4 h-4 text-violet-400 shrink-0" />
          <p className="text-xs font-semibold text-slate-100 flex-1 leading-snug">
            {toast.message}
          </p>
          <button
            onClick={dismissToast}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
export default App;
