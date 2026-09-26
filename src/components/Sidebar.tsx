import React from 'react';
import {
  Compass,
  Library,
  Radio,
  Sliders,
  ListMusic,
  Heart,
  Sparkles,
  Settings,
  Disc3
} from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { ActiveTab } from '../types';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleQueue: () => void;
  isQueueOpen: boolean;
  onOpenProAudio?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  onToggleQueue,
  isQueueOpen,
  onOpenProAudio
}) => {
  const { activeTab, setActiveTab, isPlaying, favorites, queue, spatialMode, eqPreset } = useMusicStore();

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'discover', label: 'Listen Now', icon: Compass },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'broadcast', label: 'Live Sessions', icon: Radio, badge: 'LIVE' },
    { id: 'soundlab', label: 'Audio Lab', icon: Sliders },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 md:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#0A0B10]/95 backdrop-blur-2xl border-r border-white/[0.06] p-4 flex flex-col justify-between z-40 transition-transform duration-300 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Brand Mark: Apple Music / Tidal Minimal Header */}
          <div className="flex items-center gap-3 px-2 pt-1 pb-2">
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-white to-zinc-400 flex items-center justify-center shadow-lg shadow-white/10">
              <Disc3 className="w-4 h-4 text-black animate-[spin_8s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight text-white">
                  AuraSound
                </span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/10 text-zinc-300 uppercase">
                  Hi-Fi
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-normal">
                Lossless Audio Gateway
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-0.5">
            <p className="text-[11px] font-medium tracking-wider text-zinc-400 uppercase px-3 pb-1">
              Discover
            </p>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 ${
                    isActive
                      ? 'bg-white/10 text-white font-medium shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Library Links */}
          <div className="pt-3 border-t border-white/[0.06] space-y-0.5">
            <p className="text-[11px] font-medium tracking-wider text-zinc-400 uppercase px-3 pb-1">
              My Collection
            </p>

            <button
              onClick={() => handleNavClick('library')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 ${
                activeTab === 'library'
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-pink-400" />
                <span>Favorites</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                {favorites.length}
              </span>
            </button>

            <button
              onClick={onToggleQueue}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 ${
                isQueueOpen
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-3">
                <ListMusic className="w-4 h-4 text-zinc-300" />
                <span>Up Next</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                {queue.length}
              </span>
            </button>
          </div>
        </div>

        {/* Minimal Hi-Fi Audio Status Pill */}
        {onOpenProAudio && (
          <div
            onClick={onOpenProAudio}
            className="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                <span className="text-[11px] font-semibold text-zinc-200 uppercase tracking-wider">
                  DSP Studio
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono group-hover:text-zinc-300 transition-colors">
                TUNE →
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug">
              {spatialMode.toUpperCase()} · {eqPreset.replace('-', ' ').toUpperCase()}
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
