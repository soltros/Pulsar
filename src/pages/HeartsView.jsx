import { useState, useEffect } from 'react';
import { fetchApi, getCoverArtUrl } from '../lib/api';
import { Heart, Loader, Play, Clock, Hash, MoreHorizontal, ChevronRight, Music, User, Disc } from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { useNavigate } from 'react-router-dom';
import PulsarLogo from '../components/PulsarLogo';

export default function HeartsView() {
  const [data, setData] = useState({ songs: [], albums: [], artists: [] });
  const [loading, setLoading] = useState(true);
  const isSyncing = useLibraryStore(state => state.isSyncing);
  const { playTrack, queue, currentIndex, isPlaying } = usePlayerStore();
  const navigate = useNavigate();
  const openContextMenu = useLibraryStore(state => state.openContextMenu);
  const toggleStar = useLibraryStore(state => state.toggleStar);

  useEffect(() => {
    const fetchHearts = async () => {
      try {
        const res = await fetchApi('getStarred2');
        if (res.starred2) {
          setData({
            songs: res.starred2.song || [],
            albums: res.starred2.album || [],
            artists: res.starred2.artist || []
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHearts();
  }, [isSyncing]);

  const { songs, albums, artists } = data;

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleStar = (e, id, type) => {
    e.stopPropagation();
    toggleStar(id, true, type);
    setData(prev => ({
      ...prev,
      [type + 's']: prev[type + 's'].filter(item => item.id !== id)
    }));
  };

  return (
    <div className="px-6 pb-24 pt-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-end gap-6 mb-12 border-b border-white/5 pb-8 bg-gradient-to-b from-white/5 to-transparent p-8 rounded-3xl">
        <div className="w-40 h-40 md:w-56 md:h-56 bg-gradient-to-br from-rose-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-500/20 shrink-0">
          <Heart className="w-20 h-20 md:w-28 md:h-28 text-white" fill="currentColor" />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <span className="text-xs font-bold tracking-wider text-white/50 uppercase">Playlist</span>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">Your Hearts</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="font-semibold text-white">{songs.length} Songs</span>
            <span className="text-white/30">•</span>
            <span className="font-semibold text-white">{albums.length} Albums</span>
            <span className="text-white/30">•</span>
            <span className="font-semibold text-white">{artists.length} Artists</span>
          </div>
          
          <button 
            onClick={() => songs.length > 0 && playTrack(songs[0], songs, 0)}
            className="mt-6 w-14 h-14 rounded-full bg-primary hover:scale-105 transition-transform flex items-center justify-center text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]"
            disabled={songs.length === 0}
          >
            <Play className="w-6 h-6 ml-1" fill="currentColor" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <Loader className="w-10 h-10 animate-spin mb-4 opacity-50" />
          <p>Loading your hearts...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          
          {/* Songs Section */}
          {songs.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><Music className="w-6 h-6 text-rose-500"/> Liked Songs</h2>
              <div className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-2 border-b border-white/10 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                <div className="w-8 text-center"><Hash className="w-4 h-4 inline" /></div>
                <div>Title</div>
                <div className="hidden md:block">Album</div>
                <div className="w-20 text-right"><Clock className="w-4 h-4 inline" /></div>
                <div className="w-8"></div>
              </div>
              
              <div className="flex flex-col">
                {songs.map((track, index) => {
                  const isTrackPlaying = queue.length > 0 && queue[currentIndex]?.id === track.id;
                  
                  return (
                    <div 
                      key={track.id}
                      onClick={() => playTrack(track, songs, index)}
                      className={`grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-3 rounded-lg cursor-pointer group transition-colors items-center ${
                        isTrackPlaying ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="w-8 flex items-center justify-center shrink-0">
                        {isTrackPlaying && isPlaying ? (
                          <PulsarLogo className="w-4 h-4 text-primary animate-[spin_3s_linear_infinite]" />
                        ) : (
                          <span className="text-sm text-white/50 group-hover:hidden">{index + 1}</span>
                        )}
                        {(!isTrackPlaying || !isPlaying) && (
                          <Play className="w-4 h-4 text-white hidden group-hover:block" fill="currentColor" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img src={getCoverArtUrl(track.coverArt || track.albumId, 100)} alt="" className="w-10 h-10 rounded shadow-md shrink-0 object-cover" />
                        <div className="flex flex-col justify-center overflow-hidden pr-2">
                          <span className={`text-sm font-medium truncate ${isTrackPlaying ? 'text-primary' : 'text-white group-hover:underline decoration-white/30'}`}>
                            {track.title}
                          </span>
                          <span 
                            className="text-xs text-white/50 hover:underline hover:text-white truncate"
                            onClick={(e) => { e.stopPropagation(); navigate(`/artist/${track.artistId}`); }}
                          >
                            {track.artist}
                          </span>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center overflow-hidden pr-2">
                        <span 
                          className="text-sm text-white/50 hover:underline hover:text-white truncate"
                          onClick={(e) => { e.stopPropagation(); navigate(`/album/${track.albumId}`); }}
                        >
                          {track.album}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-4 w-20">
                        <button 
                          onClick={(e) => handleToggleStar(e, track.id, 'song')}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <Heart className="w-4 h-4 heart-bounce heart-liked" fill="currentColor" />
                        </button>
                        <span className="text-sm text-white/50">{formatTime(track.duration)}</span>
                      </div>
                      <div className="w-8 flex items-center justify-end">
                        <button 
                          onClick={(e) => openContextMenu(e, track, 'song')}
                          className="text-white/0 group-hover:text-white/50 hover:!text-white transition-colors"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Albums Section */}
          {albums.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><Disc className="w-6 h-6 text-indigo-400"/> Liked Albums</h2>
              <div className="flex flex-col">
                {albums.map((album, index) => (
                  <div 
                    key={album.id}
                    onClick={() => navigate(`/album/${album.id}`)}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer group transition-colors hover:bg-white/5"
                  >
                    <div className="w-8 flex items-center justify-center shrink-0">
                      <span className="text-sm text-white/50 group-hover:hidden">{index + 1}</span>
                      <Play className="w-4 h-4 text-white hidden group-hover:block" fill="currentColor" />
                    </div>
                    <img src={getCoverArtUrl(album.coverArt || album.id, 200)} alt="" className="w-12 h-12 rounded-md shadow-md shrink-0 object-cover" />
                    <div className="flex-1 flex flex-col justify-center overflow-hidden">
                      <span className="text-base font-medium text-white group-hover:underline decoration-white/30 truncate">{album.name}</span>
                      <span 
                        className="text-sm text-white/50 hover:underline hover:text-white truncate"
                        onClick={(e) => { e.stopPropagation(); navigate(`/artist/${album.artistId}`); }}
                      >
                        {album.artist} {album.year ? `• ${album.year}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 px-4">
                      <button 
                        onClick={(e) => handleToggleStar(e, album.id, 'album')}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <Heart className="w-5 h-5 heart-bounce heart-liked" fill="currentColor" />
                      </button>
                      <button 
                        onClick={(e) => openContextMenu(e, album, 'album')}
                        className="text-white/0 group-hover:text-white/50 hover:!text-white transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Artists Section */}
          {artists.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><User className="w-6 h-6 text-orange-400"/> Liked Artists</h2>
              <div className="flex flex-col">
                {artists.map((artist, index) => (
                  <div 
                    key={artist.id}
                    onClick={() => navigate(`/artist/${artist.id}`)}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer group transition-colors hover:bg-white/5"
                  >
                    <div className="w-8 flex items-center justify-center shrink-0">
                      <span className="text-sm text-white/50">{index + 1}</span>
                    </div>
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-white/10 to-white/5 shadow-md shrink-0 flex items-center justify-center border border-white/10">
                      {artist.lastFmArtUrl ? (
                         <img src={artist.lastFmArtUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                         <User className="w-5 h-5 text-white/30" />
                      )}
                    </div>
                    <div className="flex-1 flex items-center overflow-hidden">
                      <span className="text-base font-medium text-white group-hover:underline decoration-white/30 truncate">{artist.name}</span>
                    </div>
                    <div className="flex items-center gap-4 px-4">
                      <button 
                        onClick={(e) => handleToggleStar(e, artist.id, 'artist')}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <Heart className="w-5 h-5 heart-bounce heart-liked" fill="currentColor" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {songs.length === 0 && albums.length === 0 && artists.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-white/40">
              <Heart className="w-24 h-24 mb-6 opacity-20" />
              <h3 className="text-2xl font-bold text-white/50 mb-2">No Hearts Yet</h3>
              <p className="text-base text-white/30">Songs, albums, and artists you heart will appear here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
