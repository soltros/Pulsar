import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchApi, getCoverArtUrl } from '../lib/api';
import { usePlayerStore } from '../store/playerStore';
import { Play, Clock, Hash, Pause } from 'lucide-react';
import PulsarLogo from '../components/PulsarLogo';

export default function PlaylistView() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { playTrack, queue, currentIndex, isPlaying, togglePlay } = usePlayerStore();

  useEffect(() => {
    async function loadPlaylist() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchApi('getPlaylist', { id });
        if (data.playlist) {
          setPlaylist(data.playlist);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadPlaylist();
  }, [id]);

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isCurrentPlaylistPlaying = queue.length > 0 && playlist?.entry && queue[0].id === playlist.entry[0]?.id; // heuristic

  const handlePlayAll = () => {
    if (!playlist?.entry?.length) return;
    if (isCurrentPlaylistPlaying) {
      togglePlay();
    } else {
      playTrack(playlist.entry[0], playlist.entry, 0);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <PulsarLogo className="w-12 h-12 text-primary animate-[spin_15s_linear_infinite]" />
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="p-8 text-center text-white/50">
        <p>Error loading playlist: {error || 'Not found'}</p>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-end gap-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
        <div className="w-48 h-48 md:w-56 md:h-56 shrink-0 rounded-xl overflow-hidden shadow-2xl relative bg-white/5">
          <img 
            src={getCoverArtUrl(playlist.coverArt || playlist.id, 400)} 
            alt={playlist.name} 
            className="w-full h-full object-cover" 
          />
        </div>
        <div className="flex-1 flex flex-col items-start gap-2">
          <span className="text-xs font-bold tracking-wider text-white/50 uppercase">Playlist</span>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{playlist.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-semibold text-white">Playlist</span>
            <span className="text-white/30">•</span>
            <span className="text-white/70">{playlist.songCount} tracks</span>
            <span className="text-white/30">•</span>
            <span className="text-white/70">{Math.floor(playlist.duration / 60)} mins</span>
          </div>
          
          <button 
            onClick={handlePlayAll}
            className="mt-4 w-14 h-14 rounded-full bg-primary hover:scale-105 transition-transform flex items-center justify-center text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]"
          >
            {(isCurrentPlaylistPlaying && isPlaying) ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" fill="currentColor" />}
          </button>
        </div>
      </div>

      {/* Tracklist */}
      <div className="p-8">
        <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2 border-b border-white/10 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
          <div className="w-8 text-center"><Hash className="w-4 h-4 inline" /></div>
          <div>Title</div>
          <div><Clock className="w-4 h-4 inline" /></div>
        </div>
        
        <div className="flex flex-col">
          {playlist.entry?.map((track, index) => {
            const isTrackPlaying = isCurrentPlaylistPlaying && currentIndex === index;
            
            return (
              <div 
                key={track.id}
                onClick={() => playTrack(track, playlist.entry, index)}
                className={`grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-3 rounded-lg cursor-pointer group transition-colors ${
                  isTrackPlaying ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="w-8 flex items-center justify-center">
                  {isTrackPlaying && isPlaying ? (
                    <PulsarLogo className="w-4 h-4 text-primary animate-[spin_3s_linear_infinite]" />
                  ) : (
                    <span className="text-sm text-white/50 group-hover:hidden">{index + 1}</span>
                  )}
                  {(!isTrackPlaying || !isPlaying) && (
                    <Play className="w-4 h-4 text-white hidden group-hover:block" fill="currentColor" />
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <span className={`text-sm font-medium ${isTrackPlaying ? 'text-primary' : 'text-white'}`}>
                    {track.title}
                  </span>
                  <span className="text-xs text-white/50">{track.artist}</span>
                </div>
                <div className="flex items-center text-sm text-white/50">
                  {formatTime(track.duration)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
