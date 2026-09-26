import React from 'react';
import { useMusicStore } from '../store/useMusicStore';
import { SocialFriend } from '../types';
import { Radio } from 'lucide-react';

interface FriendsListeningBarProps {
  onJoinJam?: (friend: SocialFriend) => void;
  className?: string;
}

export const FriendsListeningBar: React.FC<FriendsListeningBarProps> = ({
  onJoinJam,
  className = ''
}) => {
  const { socialFriends, allTracks, playTrack, currentTrack } = useMusicStore();

  const handleTuneIn = (friend: SocialFriend) => {
    if (onJoinJam) {
      onJoinJam(friend);
      return;
    }
    const match = allTracks.find(
      (t) =>
        t.title.toLowerCase().includes(friend.currentTrack.toLowerCase()) ||
        t.artist.toLowerCase().includes(friend.artist.toLowerCase())
    );
    if (match) {
      playTrack(match);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Listening With Friends
          </h3>
          <span className="text-[10px] text-zinc-500 font-mono">
            ({socialFriends.filter((f) => f.isLive).length} LIVE)
          </span>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {socialFriends.map((friend) => {
          const isTunedIn = currentTrack?.title.toLowerCase().includes(friend.currentTrack.toLowerCase());

          return (
            <div
              key={friend.id}
              onClick={() => handleTuneIn(friend)}
              className={`group flex items-center gap-2.5 p-2 pr-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border transition-all duration-200 cursor-pointer shrink-0 ${
                isTunedIn
                  ? 'border-white/20 bg-white/[0.06] shadow-md'
                  : 'border-white/[0.04] hover:border-white/[0.1]'
              }`}
            >
              {/* Avatar */}
              <div className="relative w-8 h-8 rounded-full shrink-0 overflow-hidden border border-white/10">
                <img
                  src={friend.avatar}
                  alt={friend.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-medium text-white truncate max-w-[120px]">
                    {friend.name}
                  </h4>
                  {friend.isLive && (
                    <span className="text-[9px] font-mono text-emerald-400">
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 truncate max-w-[140px]">
                  {friend.currentTrack}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
