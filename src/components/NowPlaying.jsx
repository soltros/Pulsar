import { useState } from 'react';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Mic2 } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { getCoverArtUrl } from '../lib/api';
import PulsarLogo from './PulsarLogo';
import LyricsView from './LyricsView';

export default function NowPlaying() {
  const { isNowPlayingOpen, setIsNowPlayingOpen, queue, currentIndex, isPlaying, togglePlay, playNext, playPrev, progress, duration, seek } = usePlayerStore();
  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;
  const [showLyrics, setShowLyrics] = useState(false);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const coverUrl = currentTrack ? getCoverArtUrl(currentTrack.coverArt || currentTrack.albumId, 800) : null;

  return (
    <div className={`fixed inset-0 z-[100] bg-[#0d0e12] text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isNowPlayingOpen ? 'translate-y-0' : 'translate-y-full'}`}>
      {/* Background blurred cover */}
      {coverUrl && (
        <div className="absolute inset-0 z-0 overflow-hidden opacity-40">
          <img src={coverUrl} alt="bg" className="w-full h-full object-cover blur-3xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12]/60 to-transparent" />
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col p-6 md:p-12 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <button 
            onClick={() => setIsNowPlayingOpen(false)}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <span className="text-xs font-semibold tracking-[0.2em] text-white/50 uppercase">Now Playing</span>
          <button 
            onClick={() => setShowLyrics(!showLyrics)}
            className={`p-3 rounded-full transition-colors backdrop-blur-md ${showLyrics ? 'bg-primary text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'}`}
            title="Toggle Lyrics"
          >
            <Mic2 className="w-6 h-6" />
          </button>
        </div>

        {/* Art and Controls Container */}
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24 mt-8 md:mt-0">
          {/* Left Column: Cover Art or Lyrics */}
          <div className={`w-full max-w-[320px] md:max-w-[460px] aspect-square shrink-0 flex items-center justify-center transition-all duration-500 ${showLyrics ? '' : 'rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-white/10'}`}>
            {showLyrics ? (
              <LyricsView track={currentTrack} progress={progress} />
            ) : coverUrl ? (
              <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <PulsarLogo className="w-32 h-32 text-primary opacity-50" />
            )}
          </div>

          {/* Info & Controls */}
          <div className="flex flex-col w-full max-w-md md:max-w-xl">
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight line-clamp-2">{currentTrack ? currentTrack.title : 'Nothing Playing'}</h2>
              <p className="text-xl md:text-2xl font-medium text-white/50">{currentTrack ? currentTrack.artist : 'Select a track to start listening'}</p>
              {currentTrack?.album && <p className="text-base text-white/30 mt-1">{currentTrack.album}</p>}
            </div>

            {/* Scrubber */}
            <div className="mb-10 w-full">
              <div className="flex items-center justify-between text-sm font-medium text-white/40 mb-4">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div 
                className="w-full h-2 md:h-3 bg-white/10 rounded-full overflow-hidden cursor-pointer group"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 to-orange-400 relative transition-all duration-100 ease-linear"
                  style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center md:justify-start gap-8">
              <button onClick={playPrev} className="text-white/50 hover:text-white transition-colors hover:scale-110">
                <SkipBack className="w-8 h-8 md:w-10 md:h-10 fill-current" />
              </button>
              
              <button 
                onClick={togglePlay} 
                className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]"
              >
                {isPlaying ? <Pause fill="currentColor" className="w-10 h-10 md:w-12 md:h-12" /> : <Play fill="currentColor" className="w-10 h-10 md:w-12 md:h-12 ml-2" />}
              </button>
              
              <button onClick={playNext} className="text-white/50 hover:text-white transition-colors hover:scale-110">
                <SkipForward className="w-8 h-8 md:w-10 md:h-10 fill-current" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
