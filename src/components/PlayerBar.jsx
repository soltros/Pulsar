import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, ListMusic, Mic2, Heart, Shuffle, Repeat, Repeat1, Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { getCoverArtUrl } from '../lib/api';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import PulsarLogo from './PulsarLogo';
import PlaceholderArt from './PlaceholderArt';

export default function PlayerBar() {
  const { queue, currentIndex, isPlaying, progress, duration, togglePlay, playNext, playPrev, seek, setIsNowPlayingOpen, setNowPlayingTab, isShuffle, repeatMode, toggleShuffle, toggleRepeat, volume, setVolume } = usePlayerStore();
  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;
  const dbAlbum = useLiveQuery(() => currentTrack ? db.albums.get(currentTrack.albumId) : null, [currentTrack?.albumId]);
  const dbSong = useLiveQuery(() => currentTrack ? db.songs.get(currentTrack.id) : null, [currentTrack?.id]);
  const [hasError, setHasError] = useState(false);

  // Reset error state when track changes
  useEffect(() => {
    setHasError(false);
  }, [currentTrack?.id]);

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

  const coverUrl = currentTrack?.lastFmArtUrl || dbAlbum?.lastFmArtUrl || (currentTrack ? getCoverArtUrl(currentTrack.coverArt || currentTrack.albumId, 200) : null);

  return (
    <div className="fixed bottom-[85px] md:bottom-8 left-4 right-4 md:left-[320px] md:right-8 h-20 bg-[#16171d]/90 backdrop-blur-3xl border border-white/10 rounded-2xl flex items-center justify-between px-3 md:px-6 z-50 shadow-2xl shadow-primary/10">
      <div 
        className="flex items-center gap-3 md:gap-4 w-auto md:w-1/3 min-w-0 cursor-pointer group"
        onClick={() => setIsNowPlayingOpen(true)}
      >
        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden shadow-lg bg-white/5 flex items-center justify-center group-hover:shadow-primary/20 transition-all border border-white/10 shrink-0">
          {coverUrl && !hasError ? (
            <img 
              src={coverUrl} 
              alt={currentTrack?.title || "Cover"} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
              onError={() => setHasError(true)}
            />
          ) : (
            <PlaceholderArt iconClassName="w-6 h-6 md:w-8 md:h-8" />
          )}
        </div>
        <div className="flex flex-col justify-center min-w-0 shrink pr-2 md:pr-4">
          <h4 className="text-white font-bold text-sm truncate group-hover:text-primary transition-colors">{currentTrack ? currentTrack.title : 'Nothing Playing'}</h4>
          <p className="text-white/50 text-xs truncate font-medium">{currentTrack ? currentTrack.artist : 'Pulsar'}</p>
        </div>
        {currentTrack && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              useLibraryStore.getState().toggleStar(currentTrack.id, dbSong ? !!dbSong.starred : (currentTrack.starred ?? false), 'song');
            }}
            className="p-2 rounded-full shrink-0 -ml-2 hover:bg-white/5 transition-colors"
          >
            <Heart className={`w-5 h-5 heart-bounce ${(dbSong ? !!dbSong.starred : (currentTrack.starred ?? false)) ? 'heart-liked text-primary' : 'heart-unliked text-white/50'}`} fill={(dbSong ? !!dbSong.starred : (currentTrack.starred ?? false)) ? 'currentColor' : 'none'} />
          </button>
        )}
        <div className="flex-1 hidden md:block" />
      </div>

      <div className="flex flex-col items-center flex-1 max-w-md px-2 md:px-4 hidden sm:flex">
        <div className="flex items-center gap-4 md:gap-6 mb-2">
          <button onClick={toggleShuffle} className={`transition-colors hover:scale-110 ${isShuffle ? 'text-primary' : 'text-white/30 hover:text-white'}`}>
            <Shuffle className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button onClick={playPrev} className="text-white/50 hover:text-white transition-colors hover:scale-110"><SkipBack className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" /></button>
          <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.3)] shrink-0">
            {isPlaying ? <Pause fill="currentColor" className="w-5 h-5" /> : <Play fill="currentColor" className="w-5 h-5 ml-0.5" />}
          </button>
          <button onClick={playNext} className="text-white/50 hover:text-white transition-colors hover:scale-110"><SkipForward className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" /></button>
          <button onClick={toggleRepeat} className={`transition-colors hover:scale-110 ${repeatMode !== 'none' ? 'text-primary' : 'text-white/30 hover:text-white'}`}>
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4 md:w-5 md:h-5" /> : <Repeat className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
        </div>
        <div className="flex items-center gap-3 w-full text-[10px] md:text-xs text-white/50 font-medium">
          <span className="w-8 text-right">{formatTime(progress)}</span>
          <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden group cursor-pointer border border-white/5" onClick={handleSeek}>
            <div className="h-full bg-primary group-hover:bg-orange-400 transition-colors relative" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}></div>
          </div>
          <span className="w-8 text-left">{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Mobile inline play button */}
      <div className="sm:hidden flex items-center gap-3 pr-2 shrink-0">
        <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
            {isPlaying ? <Pause fill="currentColor" className="w-5 h-5" /> : <Play fill="currentColor" className="w-5 h-5 ml-0.5" />}
        </button>
      </div>

      <div className="w-1/3 flex justify-end items-center gap-4 hidden md:flex pr-2">
         <button 
           onClick={() => { setIsNowPlayingOpen(true); setNowPlayingTab('queue'); }}
           className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
           title="Up Next"
         >
           <ListMusic className="w-4 h-4" />
         </button>
         <button 
           onClick={() => { setIsNowPlayingOpen(true); setNowPlayingTab('lyrics'); }}
           className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
           title="Lyrics"
         >
           <Mic2 className="w-4 h-4" />
         </button>
         <div className="flex items-center gap-2 ml-2 w-28 group">
           <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="text-white/50 hover:text-white transition-colors">
             {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
           </button>
           <div 
             className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden cursor-pointer border border-white/5 relative"
             onClick={(e) => {
               const rect = e.currentTarget.getBoundingClientRect();
               const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
               setVolume(percent);
             }}
           >
              <div className="h-full bg-white/80 group-hover:bg-primary rounded-full transition-colors" style={{ width: `${volume * 100}%` }} />
           </div>
         </div>
      </div>
    </div>
  );
}
