import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { fetchApi, getCoverArtUrl } from '../lib/api';
import { usePlayerStore } from '../store/playerStore';
import { Play, Clock, Hash, Pause, Calendar } from 'lucide-react';
import PulsarLogo from '../components/PulsarLogo';
import { Link } from 'react-router-dom';

export default function AlbumView() {
  const { id } = useParams();
  const dbAlbum = useLiveQuery(() => db.albums.get(id), [id]);
  const [albumData, setAlbumData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { playTrack, queue, currentIndex, isPlaying, togglePlay } = usePlayerStore();

  useEffect(() => {
    async function loadAlbum() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchApi('getAlbum', { id });
        if (data.album) {
          setAlbumData(data.album);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadAlbum();
  }, [id]);

  const album = dbAlbum || albumData;

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isCurrentAlbumPlaying = queue.length > 0 && albumData?.song && queue[0].albumId === albumData.id;

  const handlePlayAll = () => {
    if (!albumData?.song?.length) return;
    if (isCurrentAlbumPlaying) {
      togglePlay();
    } else {
      playTrack(albumData.song[0], albumData.song, 0);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <PulsarLogo className="w-12 h-12 text-primary animate-[spin_15s_linear_infinite]" />
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="p-8 text-center text-white/50">
        <p>Error loading album: {error || 'Not found'}</p>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-end gap-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
        <div className="w-48 h-48 md:w-56 md:h-56 shrink-0 rounded-xl overflow-hidden shadow-2xl relative bg-white/5">
          <img 
            src={album.lastFmArtUrl || getCoverArtUrl(album.coverArt || album.id, 400)} 
            alt={album.name} 
            className="w-full h-full object-cover" 
          />
        </div>
        <div className="flex-1 flex flex-col items-start gap-2">
          <span className="text-xs font-bold tracking-wider text-white/50 uppercase">Album</span>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{album.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Link to={`/artist/${album.artistId || albumData?.artistId}`} className="font-semibold text-white hover:underline">{album.artist}</Link>
            <span className="text-white/30">•</span>
            <span className="text-white/70">{album.year || 'Unknown Year'}</span>
            <span className="text-white/30">•</span>
            <span className="text-white/70">{album.songCount} tracks</span>
          </div>
          
          <button 
            onClick={handlePlayAll}
            className="mt-4 w-14 h-14 rounded-full bg-primary hover:scale-105 transition-transform flex items-center justify-center text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]"
          >
            {(isCurrentAlbumPlaying && isPlaying) ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" fill="currentColor" />}
          </button>
        </div>
      </div>

      {album.description && (
        <div className="px-8 pt-8">
          <div className="bg-white/5 rounded-2xl p-6 text-white/80 leading-relaxed max-w-4xl text-sm border border-white/5">
            <h3 className="font-semibold text-white mb-2 uppercase tracking-wider text-xs">About this album</h3>
            <div dangerouslySetInnerHTML={{ __html: album.description.replace(/\n/g, '<br />') }} />
          </div>
        </div>
      )}

      {/* Tracklist */}
      <div className="p-8">
        <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2 border-b border-white/10 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
          <div className="w-8 text-center"><Hash className="w-4 h-4 inline" /></div>
          <div>Title</div>
          <div><Clock className="w-4 h-4 inline" /></div>
        </div>
        
        <div className="flex flex-col">
          {albumData?.song?.map((track, index) => {
            const isTrackPlaying = isCurrentAlbumPlaying && currentIndex === index;
            
            return (
              <div 
                key={track.id}
                onClick={() => playTrack(track, albumData.song, index)}
                className={`grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-3 rounded-lg cursor-pointer group transition-colors ${
                  isTrackPlaying ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="w-8 flex items-center justify-center">
                  {isTrackPlaying && isPlaying ? (
                    <PulsarLogo className="w-4 h-4 text-primary animate-[spin_3s_linear_infinite]" />
                  ) : (
                    <span className="text-sm text-white/50 group-hover:hidden">{track.track || index + 1}</span>
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
