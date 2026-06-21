import { useState } from 'react';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Mic2, ListMusic, Clock, Image as ImageIcon, Heart, Save, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { getCoverArtUrl, fetchApi } from '../lib/api';
import { useLibraryStore } from '../store/libraryStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import PulsarLogo from './PulsarLogo';
import PlaceholderArt from './PlaceholderArt';
import LyricsView from './LyricsView';
import { useNavigate } from 'react-router-dom';

export default function NowPlaying() {
  const navigate = useNavigate();
  const { isNowPlayingOpen, setIsNowPlayingOpen, queue, currentIndex, isPlaying, togglePlay, playNext, playPrev, progress, duration, seek, nowPlayingTab, setNowPlayingTab, playTrack, isShuffle, repeatMode, toggleShuffle, toggleRepeat } = usePlayerStore();
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
  const dbSong = useLiveQuery(() => currentTrack ? db.songs.get(currentTrack.id) : null, [currentTrack?.id]);
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
      <div className="relative z-10 h-full flex flex-col p-4 sm:p-6 md:p-12 max-w-6xl mx-auto overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <button 
            onClick={() => setIsNowPlayingOpen(false)}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          
          <div className="flex bg-white/5 rounded-full p-1 backdrop-blur-md lg:hidden">
            <button 
              onClick={() => setNowPlayingTab('art')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wider transition-all ${nowPlayingTab === 'art' ? 'bg-white/20 text-white shadow-md' : 'text-white/50 hover:text-white'}`}
            >
              ARTWORK
            </button>
            <button 
              onClick={() => setNowPlayingTab('lyrics')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wider transition-all ${nowPlayingTab === 'lyrics' ? 'bg-primary text-white shadow-md' : 'text-white/50 hover:text-white'}`}
            >
              LYRICS
            </button>
            <button 
              onClick={() => setNowPlayingTab('queue')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wider transition-all ${nowPlayingTab === 'queue' ? 'bg-blue-500 text-white shadow-md' : 'text-white/50 hover:text-white'}`}
            >
              UP NEXT
            </button>
          </div>
          
          <div className="hidden lg:flex bg-white/5 rounded-full p-1 backdrop-blur-md">
            <button 
              onClick={() => setNowPlayingTab('lyrics')}
              className={`px-6 py-2 rounded-full text-xs font-bold tracking-wider transition-all ${nowPlayingTab !== 'queue' ? 'bg-white/20 text-white shadow-md' : 'text-white/50 hover:text-white'}`}
            >
              LYRICS
            </button>
            <button 
              onClick={() => setNowPlayingTab('queue')}
              className={`px-6 py-2 rounded-full text-xs font-bold tracking-wider transition-all ${nowPlayingTab === 'queue' ? 'bg-white/20 text-white shadow-md' : 'text-white/50 hover:text-white'}`}
            >
              UP NEXT
            </button>
          </div>
          
          <div className="w-12 h-12" /> {/* Spacer to balance header */}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row items-center lg:items-end justify-center gap-8 lg:gap-16 mt-6 md:mt-0 w-full max-w-full pb-10 overflow-hidden">
          
          {/* LEFT SIDE (Always visible on Desktop, toggled on Mobile) */}
          <div className={`w-full lg:w-1/2 flex-col items-center lg:items-start justify-end lg:h-full lg:pb-12 ${nowPlayingTab === 'art' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="relative w-full max-w-[320px] md:max-w-[460px] aspect-square shrink-0 rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-white/10 mb-8 mx-auto lg:mx-0 group">
              {coverUrl && !hasError ? (
                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" onError={() => setHasError(true)} />
              ) : (
                <PlaceholderArt iconClassName="w-32 h-32" />
              )}
              {currentTrack && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    useLibraryStore.getState().toggleStar(currentTrack.id, dbSong ? !!dbSong.starred : !!currentTrack.starred, 'song');
                  }}
                  className="absolute bottom-4 right-4 md:bottom-6 md:right-6 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-black/60 hover:scale-105 transition-all z-10 shadow-xl opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                >
                  <Heart className={`w-6 h-6 md:w-8 md:h-8 heart-bounce ${(dbSong ? !!dbSong.starred : !!currentTrack.starred) ? 'heart-liked text-primary' : 'heart-unliked text-white'}`} fill={(dbSong ? !!dbSong.starred : !!currentTrack.starred) ? 'currentColor' : 'none'} />
                </button>
              )}
            </div>

            <div className="flex flex-col w-full max-w-md md:max-w-xl mx-auto lg:mx-0 shrink-0 px-4 lg:px-0">
              <div className="mb-8 text-center lg:text-left flex flex-col items-center lg:items-start">
                {currentTrack ? (
                  <>
                    <a 
                      href={`https://www.last.fm/music/${encodeURIComponent(currentTrack.artist)}/_/${encodeURIComponent(currentTrack.title)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight line-clamp-2 hover:underline decoration-white/30 mb-2 w-full"
                      title="View on Last.fm"
                    >
                      {currentTrack.title}
                    </a>
                    <button onClick={() => { setIsNowPlayingOpen(false); navigate(`/artist/${currentTrack.artistId}`); }} className="text-lg md:text-xl font-medium text-white/50 hover:text-white hover:underline transition-colors w-full truncate">
                      {currentTrack.artist}
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">Nothing Playing</h2>
                    <p className="text-lg md:text-xl font-medium text-white/50">Select a track to start</p>
                  </>
                )}
              </div>

              {/* Scrubber */}
              <div className="mb-8 w-full shrink-0">
                <div 
                  className="w-full h-2 md:h-3 bg-white/10 rounded-full overflow-hidden cursor-pointer group mb-3 relative"
                  onClick={handleSeek}
                >
                  <div 
                    className="h-full bg-white relative transition-all duration-100 ease-linear"
                    style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
                  />
                  {/* Subtle hover effect for scrubber */}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-white/40">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center lg:justify-start gap-6 md:gap-8">
                <button onClick={toggleShuffle} className={`transition-colors hover:scale-110 ${isShuffle ? 'text-primary' : 'text-white/30 hover:text-white'}`}>
                  <Shuffle className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button onClick={playPrev} className="text-white/70 hover:text-white transition-colors hover:scale-110">
                  <SkipBack className="w-8 h-8 md:w-10 md:h-10 fill-current" />
                </button>
                <button onClick={togglePlay} className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition-transform shadow-xl shrink-0">
                  {isPlaying ? <Pause fill="currentColor" className="w-8 h-8 sm:w-10 sm:h-10" /> : <Play fill="currentColor" className="w-8 h-8 sm:w-10 sm:h-10 ml-1" />}
                </button>
                <button onClick={playNext} className="text-white/70 hover:text-white transition-colors hover:scale-110">
                  <SkipForward className="w-8 h-8 md:w-10 md:h-10 fill-current" />
                </button>
                <button onClick={toggleRepeat} className={`transition-colors hover:scale-110 ${repeatMode !== 'none' ? 'text-primary' : 'text-white/30 hover:text-white'}`}>
                  {repeatMode === 'one' ? <Repeat1 className="w-5 h-5 md:w-6 md:h-6" /> : <Repeat className="w-5 h-5 md:w-6 md:h-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE (Toggled on Mobile, Toggled between Lyrics/Queue on Desktop) */}
          <div className={`w-full lg:w-1/2 h-[50vh] lg:h-full lg:py-12 ${nowPlayingTab === 'art' ? 'hidden' : 'flex'} lg:flex flex-col`}>
            {nowPlayingTab !== 'queue' && (
              <div className="w-full h-full overflow-hidden relative mask-image-fade" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
                <LyricsView track={currentTrack} progress={progress} />
              </div>
            )}
            
            {nowPlayingTab === 'queue' && (
              <div className="w-full h-full bg-black/20 backdrop-blur-xl rounded-3xl border border-white/5 p-4 md:p-6 overflow-y-auto hide-scrollbar mask-image-fade" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)' }}>
                <div className="flex items-center justify-between mb-6 px-2">
                  <h3 className="text-white/70 font-bold tracking-widest text-sm uppercase">Up Next</h3>
                  <button 
                    onClick={async () => {
                      const name = prompt('Enter a name for the new playlist:');
                      if (name) {
                        try {
                          const res = await fetchApi('createPlaylist', { name });
                          if (res.playlist) {
                            await fetchApi('updatePlaylist', { playlistId: res.playlist.id, songIdToAdd: queue.map(t => t.id) });
                            alert('Saved queue as playlist!');
                            useLibraryStore.getState().syncLibrary();
                          }
                        } catch (e) {
                          alert('Failed to save playlist.');
                        }
                      }
                    }}
                    className="flex items-center gap-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors"
                  >
                    <Save className="w-3 h-3" /> Save Playlist
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {queue.map((track, idx) => {
                    const isTrackPlaying = currentIndex === idx;
                    return (
                      <div 
                        key={`${track.id}-${idx}`}
                        onClick={() => playTrack(track, queue, idx)}
                        className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer group transition-all ${isTrackPlaying ? 'bg-white/10 shadow-lg' : 'hover:bg-white/5'}`}
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 shrink-0 relative flex items-center justify-center shadow-md">
                          <img src={getCoverArtUrl(track.coverArt || track.albumId, 100)} alt="" className="w-full h-full object-cover" />
                          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isTrackPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {isTrackPlaying && isPlaying ? <Pause className="w-5 h-5 text-white" fill="currentColor" /> : <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />}
                          </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className={`font-bold text-base truncate ${isTrackPlaying ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>{track.title}</div>
                          <div className={`text-sm truncate mt-0.5 ${isTrackPlaying ? 'text-white/70' : 'text-white/40'}`}>{track.artist}</div>
                        </div>
                        <div className="text-xs font-semibold text-white/30 mr-2">
                          {formatTime(track.duration)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
