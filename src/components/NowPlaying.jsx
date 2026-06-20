import { useState } from 'react';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Mic2, ListMusic, Clock, Image as ImageIcon } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { getCoverArtUrl } from '../lib/api';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import PulsarLogo from './PulsarLogo';
import LyricsView from './LyricsView';
import { useNavigate } from 'react-router-dom';

export default function NowPlaying() {
  const navigate = useNavigate();
  const { isNowPlayingOpen, setIsNowPlayingOpen, queue, currentIndex, isPlaying, togglePlay, playNext, playPrev, progress, duration, seek, nowPlayingTab, setNowPlayingTab, playTrack } = usePlayerStore();
  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

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

  const dbAlbum = useLiveQuery(() => currentTrack ? db.albums.get(currentTrack.albumId) : null, [currentTrack?.albumId]);
  const [hasError, setHasError] = useState(false);

  const coverUrl = currentTrack?.lastFmArtUrl || dbAlbum?.lastFmArtUrl || (currentTrack ? getCoverArtUrl(currentTrack.coverArt || currentTrack.albumId, 800) : null);

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
          
          <div className="flex bg-white/5 rounded-full p-1 backdrop-blur-md">
            <button 
              onClick={() => setNowPlayingTab('art')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all ${nowPlayingTab === 'art' ? 'bg-white/20 text-white shadow-md' : 'text-white/50 hover:text-white'}`}
            >
              ARTWORK
            </button>
            <button 
              onClick={() => setNowPlayingTab('lyrics')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all ${nowPlayingTab === 'lyrics' ? 'bg-primary text-white shadow-md' : 'text-white/50 hover:text-white'}`}
            >
              LYRICS
            </button>
            <button 
              onClick={() => setNowPlayingTab('queue')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all ${nowPlayingTab === 'queue' ? 'bg-blue-500 text-white shadow-md' : 'text-white/50 hover:text-white'}`}
            >
              UP NEXT
            </button>
          </div>
          
          <div className="w-12 h-12" /> {/* Spacer to balance header */}
        </div>

        {/* Art, Queue, Lyrics, and Controls Container */}
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24 mt-8 md:mt-0">
          {/* Left Column: Cover Art, Lyrics, or Queue */}
          <div className={`w-full max-w-[320px] md:max-w-[460px] ${nowPlayingTab === 'art' ? 'aspect-square shrink-0 rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-white/10' : 'h-[60vh] md:h-[500px] flex flex-col'} flex items-center justify-center transition-all duration-500`}>
            {nowPlayingTab === 'lyrics' && (
              <div className="w-full h-full overflow-hidden relative mask-image-fade" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
                <LyricsView track={currentTrack} progress={progress} />
              </div>
            )}
            
            {nowPlayingTab === 'queue' && (
              <div className="w-full h-full bg-black/40 rounded-3xl border border-white/10 p-4 overflow-y-auto hide-scrollbar mask-image-fade" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)' }}>
                <h3 className="text-white font-bold mb-4 px-2">Up Next</h3>
                <div className="flex flex-col gap-1">
                  {queue.map((track, idx) => {
                    const isTrackPlaying = currentIndex === idx;
                    return (
                      <div 
                        key={`${track.id}-${idx}`}
                        onClick={() => playTrack(track, queue, idx)}
                        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer group transition-colors ${isTrackPlaying ? 'bg-blue-500/20' : 'hover:bg-white/10'}`}
                      >
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-white/5 shrink-0 relative flex items-center justify-center">
                          <img src={getCoverArtUrl(track.coverArt || track.albumId, 100)} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            {isTrackPlaying && isPlaying ? <Pause className="w-4 h-4 text-white" fill="currentColor" /> : <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />}
                          </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className={`font-semibold text-sm truncate ${isTrackPlaying ? 'text-blue-400' : 'text-white group-hover:text-white'}`}>{track.title}</div>
                          <div className="text-white/50 text-xs truncate">{track.artist}</div>
                        </div>
                        <div className="text-xs font-medium text-white/30 mr-2">
                          {formatTime(track.duration)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {nowPlayingTab === 'art' && (
              coverUrl && !hasError ? (
                <img 
                  src={coverUrl} 
                  alt="Cover" 
                  className="w-full h-full object-cover" 
                  onError={() => setHasError(true)}
                />
              ) : (
                <PulsarLogo className="w-32 h-32 text-primary opacity-50" />
              )
            )}
          </div>

          {/* Info & Controls */}
          <div className="flex flex-col w-full max-w-md md:max-w-xl">
            <div className="mb-8 text-center md:text-left flex flex-col items-center md:items-start">
              {currentTrack ? (
                <>
                  <a 
                    href={`https://www.last.fm/music/${encodeURIComponent(currentTrack.artist)}/_/${encodeURIComponent(currentTrack.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight line-clamp-2 hover:underline decoration-white/30"
                    title="View on Last.fm"
                  >
                    {currentTrack.title}
                  </a>
                  <button 
                    onClick={() => { setIsNowPlayingOpen(false); navigate(`/artist/${currentTrack.artistId}`); }}
                    className="text-xl md:text-2xl font-medium text-white/50 hover:text-white hover:underline transition-colors"
                  >
                    {currentTrack.artist}
                  </button>
                  {currentTrack.album && (
                    <button 
                      onClick={() => { setIsNowPlayingOpen(false); navigate(`/album/${currentTrack.albumId}`); }}
                      className="text-base text-white/30 mt-1 hover:text-white/70 hover:underline transition-colors"
                    >
                      {currentTrack.album}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight line-clamp-2">Nothing Playing</h2>
                  <p className="text-xl md:text-2xl font-medium text-white/50">Select a track to start listening</p>
                </>
              )}
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
