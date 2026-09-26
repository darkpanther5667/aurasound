import React from 'react';
import { useMusicStore } from '../store/useMusicStore';
import { Users2, Radio } from 'lucide-react';

export const SocialGraph: React.FC = () => {
  const { socialFriends, playTrack, allTracks } = useMusicStore();

  const handleTuneIn = (friendTrackName: string) => {
    const match = allTracks.find(
      (t) => t.title.toLowerCase().includes(friendTrackName.toLowerCase())
    );
    if (match) {
      playTrack(match);
    }
  };

  return (
    <div className="bg-[#121417] border border-white/[0.08] rounded-xl p-3.5">
      {/* Title */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Users2 className="w-3.5 h-3.5 text-studio-accent" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-white font-bold">
            Listening Together
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-studio-muted uppercase">
            {socialFriends.filter((f) => f.isLive).length} IN SESSION
          </span>
        </div>
      </div>

      {/* Friends Horizontal / Compact List */}
      <div className="space-y-2">
        {socialFriends.map((friend) => (
          <div
            key={friend.id}
            onClick={() => handleTuneIn(friend.currentTrack)}
            className="group flex items-center justify-between p-2 rounded-lg bg-[#181A1F]/70 hover:bg-[#181A1F] border border-white/[0.04] hover:border-white/10 transition-all cursor-pointer"
          >
            {/* Avatar & Name */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10">
                <img
                  src={friend.avatar}
                  alt={friend.name}
                  className="w-full h-full object-cover"
                />
                {friend.isLive && (
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[#121417]" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                    {friend.name}
                  </p>
                  {friend.city && (
                    <span className="text-[9px] font-mono text-studio-dim">
                      · {friend.city}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-studio-muted truncate">
                  {friend.currentTrack} <span className="text-studio-dim">· {friend.artist}</span>
                </p>
              </div>
            </div>

            {/* Live Micro-frequency Indicator & Sync status */}
            <div className="flex items-center gap-2 shrink-0">
              {friend.isLive ? (
                <div className="flex items-center gap-1">
                  {/* Tiny animated 3-bar frequency meter */}
                  <div className="flex items-end gap-0.5 h-3 px-1">
                    <span className="w-0.5 h-2 bg-studio-accent rounded-full animate-pulse" />
                    <span className="w-0.5 h-3 bg-studio-amber rounded-full animate-pulse delay-75" />
                    <span className="w-0.5 h-1.5 bg-studio-accent rounded-full animate-pulse delay-150" />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 hidden sm:inline">
                    {friend.syncedTime}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] font-mono text-studio-dim">
                  {friend.syncedTime}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
