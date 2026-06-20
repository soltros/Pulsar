import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useSettingsStore } from '../store/settingsStore';
import { useLibraryStore } from '../store/libraryStore';
import { fetchApi } from '../lib/api';
import { ListMusic, Pin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ConnectedAlbumCard, ArtistCard, SongCard } from './Home';

export default function LibraryView() {
  const [activeTab, setActiveTab] = useState('playlists');
  
  const playlists = useLiveQuery(() => db.playlists.toArray());
  const albums = useLiveQuery(() => db.albums.toArray());
  const artists = useLiveQuery(() => db.artists.toArray());
  
  const [songs, setSongs] = useState([]);
  
  const pinnedPlaylists = useSettingsStore(state => state.pinnedPlaylists);
  const togglePinPlaylist = useSettingsStore(state => state.togglePinPlaylist);
  const homeSongs = useLibraryStore(state => state.homeLists.songs);

  const isPinned = (id) => pinnedPlaylists.some(p => p.id === id);

  useEffect(() => {
    if (activeTab === 'songs') {
      fetchApi('getRandomSongs', { size: 50 })
        .then(res => {
           if (res?.randomSongs?.song) setSongs(res.randomSongs.song);
        })
        .catch(() => setSongs(homeSongs));
    }
  }, [activeTab, homeSongs]);

  return (
    <div className="px-6 pb-24 pt-8">
      <h1 className="text-4xl font-bold text-white mb-8">Your Library</h1>
      
      <div className="flex items-center gap-4 border-b border-white/10 mb-8 pb-2 overflow-x-auto hide-scrollbar">
        {['playlists', 'albums', 'artists', 'songs'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold transition-colors capitalize whitespace-nowrap ${activeTab === tab ? 'text-primary border-b-2 border-primary -mb-[10px]' : 'text-white/50 hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'playlists' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {playlists?.map(playlist => (
            <div key={playlist.id} className="relative group bg-white/5 hover:bg-white/10 rounded-xl overflow-hidden border border-white/5 transition-colors">
              <Link to={`/playlist/${playlist.id}`} className="flex items-center p-4">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-md flex items-center justify-center shrink-0">
                  <ListMusic className="w-8 h-8 text-white/50" />
                </div>
                <div className="ml-4 flex-1 overflow-hidden pr-8">
                  <h3 className="text-white font-semibold truncate">{playlist.name}</h3>
                  <p className="text-white/50 text-sm truncate">{playlist.songCount} Tracks</p>
                </div>
              </Link>
              
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  togglePinPlaylist(playlist);
                }}
                className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isPinned(playlist.id) ? 'text-primary bg-primary/10' : 'text-white/30 hover:text-white bg-black/20 opacity-0 group-hover:opacity-100'}`}
                title={isPinned(playlist.id) ? "Unpin from sidebar" : "Pin to sidebar"}
              >
                <Pin className="w-4 h-4" fill={isPinned(playlist.id) ? "currentColor" : "none"} />
              </button>
            </div>
          ))}
          {(!playlists || playlists.length === 0) && (
             <p className="text-white/40">No playlists found. Try syncing your library.</p>
          )}
        </div>
      )}
      
      {activeTab === 'albums' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {albums?.map(album => (
            <ConnectedAlbumCard key={album.id} album={album} />
          ))}
          {(!albums || albums.length === 0) && (
             <p className="text-white/40 col-span-full">No albums found. Try syncing your library.</p>
          )}
        </div>
      )}

      {activeTab === 'artists' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {artists?.map(artist => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
          {(!artists || artists.length === 0) && (
             <p className="text-white/40 col-span-full">No artists found. Try syncing your library.</p>
          )}
        </div>
      )}

      {activeTab === 'songs' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {songs?.map(song => (
            <SongCard key={song.id} song={song} />
          ))}
          {(!songs || songs.length === 0) && (
             <p className="text-white/40 col-span-full">Loading songs...</p>
          )}
        </div>
      )}
    </div>
  );
}
