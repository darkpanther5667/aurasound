import React from 'react';
import { X, Trash2, ArrowUp, ArrowDown, Play, Music, ListOrdered } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({ isOpen, onClose }) => {
  const {
    queue,
    currentTrack,
    playTrack,
    removeFromQueue,
    clearQueue,
    reorderQueue
  } = useMusicStore();

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 w-full sm:w-80 z-50 bg-[#0B0C0E]/95 backdrop-blur-md border-l border-white/[0.08] shadow-2xl flex flex-col transition-all duration-200 animate-in slide-in-from-right">
      {/* Header */}
      <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-studio-accent" />
          <h2 className="font-mono text-xs uppercase tracking-wider text-white font-bold">
            Master Queue
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-studio-muted">
            {queue.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {queue.length > 1 && (
            <button
              onClick={clearQueue}
              className="text-[11px] font-mono text-studio-muted hover:text-studio-accent flex items-center gap-1 p-1 rounded hover:bg-white/5 transition-colors"
              title="Clear Queue"
            >
              <Trash2 className="w-3 h-3" />
              <span>FLUSH</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded text-studio-muted hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Queue Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-studio-muted p-4">
            <Music className="w-8 h-8 text-studio-dim mb-2" />
            <p className="font-mono text-xs text-slate-300 uppercase">Queue Empty</p>
            <p className="text-[11px] text-studio-dim mt-1">
              Select tracks from the archive to populate the playback buffer.
            </p>
          </div>
        ) : (
          queue.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;

            return (
              <div
                key={`${track.id}-${idx}`}
                className={`group relative flex items-center gap-2.5 p-2 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-[#181A1F] border-white/20 shadow-sm'
                    : 'bg-[#121417] hover:bg-[#181A1F] border-white/[0.04]'
                }`}
              >
                {/* Index / Status */}
                <div className="w-5 text-center text-[10px] font-mono text-studio-dim shrink-0">
                  {isCurrent ? (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-studio-accent animate-ping" />
                  ) : (
                    idx + 1 < 10 ? `0${idx + 1}` : idx + 1
                  )}
                </div>

                {/* Cover Artwork */}
                <div className="relative w-9 h-9 rounded overflow-hidden shrink-0 border border-white/5 bg-black">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-full h-full object-cover grayscale contrast-125"
                  />
                  <button
                    onClick={() => playTrack(track)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                {/* Track Details */}
                <div className="min-w-0 flex-1">
                  <h4
                    onClick={() => playTrack(track)}
                    className={`text-xs font-mono font-bold uppercase truncate cursor-pointer transition-colors ${
                      isCurrent ? 'text-studio-accent' : 'text-slate-200 group-hover:text-white'
                    }`}
                  >
                    {track.title}
                  </h4>
                  <p className="text-[10px] text-studio-muted truncate font-sans">
                    {track.artist}
                  </p>
                </div>

                {/* Micro Reorder / Delete */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {idx > 0 && (
                    <button
                      onClick={() => reorderQueue(idx, idx - 1)}
                      className="p-1 rounded text-studio-dim hover:text-white hover:bg-white/10"
                      title="Move up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                  )}
                  {idx < queue.length - 1 && (
                    <button
                      onClick={() => reorderQueue(idx, idx + 1)}
                      className="p-1 rounded text-studio-dim hover:text-white hover:bg-white/10"
                      title="Move down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => removeFromQueue(track.id)}
                    className="p-1 rounded text-studio-dim hover:text-studio-accent hover:bg-white/10"
                    title="Remove"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-white/[0.08] bg-[#08080A] text-center text-[10px] font-mono text-studio-dim uppercase">
        PLAYLIST BUFFER · PERSISTENT CACHE ACTIVE
      </div>
    </aside>
  );
};
