import { Play, Pause, Mic2, ListMusic, Heart } from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { getCoverArtUrl } from '../lib/api';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { useState, useMemo, useEffect } from 'react';
import PulsarLogo from '../components/PulsarLogo';
import { useSettingsStore } from '../store/settingsStore';

export function LazyImage({ src, alt, className }) {
  const [hasError, setHasError] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '100px 0px', // Fetch slightly before it enters the viewport
  });

  return (
    <div ref={ref} className={`bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center relative border border-white/5 ${className}`}>
      {inView && !hasError && (
        <img 
          src={src} 
          alt={alt} 
          className={`w-full h-full object-cover transition-opacity duration-700 text-transparent absolute inset-0 z-10`} 
          onError={() => setHasError(true)}
        />
      )}
      {(hasError || !inView) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-80 z-0">
          <PulsarLogo className="w-1/3 h-1/3 text-primary" />
        </div>
      )}
    </div>
  );
}

export function ConnectedAlbumCard({ album }) {
  const dbAlbum = useLiveQuery(() => db.albums.get(album.id), [album.id]) || album;
  
  return (
    <div className="group cursor-pointer w-full block">
      <Link to={`/album/${dbAlbum.id}`}>
        <div 
          onContextMenu={(e) => useLibraryStore.getState().openContextMenu(e, dbAlbum, 'album')}
          className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-lg shadow-black/40 group-hover:shadow-primary/20 transition-all duration-500"
        >
          <LazyImage src={dbAlbum.lastFmArtUrl || getCoverArtUrl(dbAlbum.coverArt)} alt={dbAlbum.name} className="w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out" />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
          <button 
            className="absolute bottom-3 right-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/40 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-20"
          >
            <Play fill="currentColor" className="w-5 h-5 ml-1" />
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              useLibraryStore.getState().toggleStar(dbAlbum.id, !!dbAlbum.starred, 'album');
            }}
            className={`absolute top-2 right-2 p-2 rounded-full transition-all z-20 shadow-md ${dbAlbum.starred ? 'bg-black/40 text-rose-500 backdrop-blur-md' : 'bg-black/20 text-white/50 hover:text-white opacity-0 group-hover:opacity-100 hover:bg-black/40 backdrop-blur-md'}`}
          >
            <Heart className="w-4 h-4" fill={dbAlbum.starred ? 'currentColor' : 'none'} />
          </button>
        </div>
        <h3 className="text-white font-semibold text-sm truncate" title={dbAlbum.name}>{dbAlbum.name}</h3>
        <p className="text-white/60 text-xs truncate mt-0.5" title={dbAlbum.artist}>{dbAlbum.artist}</p>
      </Link>
    </div>
  );
}

export function ArtistCard({ artist }) {
  const dbArtist = useLiveQuery(() => db.artists.get(artist.id), [artist.id]) || artist;
  const [hasError, setHasError] = useState(false);

  return (
    <div className="group cursor-pointer w-full block">
      <Link to={`/artist/${dbArtist.id}`} className="flex flex-col items-center">
        <div className="relative w-full aspect-square rounded-full overflow-hidden mb-3 shadow-lg shadow-black/40 group-hover:shadow-primary/20 transition-all duration-500 bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-white/5 flex items-center justify-center">
          {dbArtist.lastFmArtUrl && !hasError ? (
            <img 
              src={dbArtist.lastFmArtUrl} 
              alt={dbArtist.name} 
              className="w-full h-full object-cover transition-opacity duration-700 group-hover:scale-105" 
              onError={() => setHasError(true)}
            />
          ) : (
            <PulsarLogo className="w-1/2 h-1/2 text-primary opacity-80" />
          )}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
        </div>
        <h3 className="text-white font-semibold text-sm truncate w-full text-center group-hover:text-primary transition-colors" title={dbArtist.name}>{dbArtist.name}</h3>
      </Link>
    </div>
  );
}

export function SongCard({ song }) {
  const { playTrack, currentIndex, queue, isPlaying, togglePlay } = usePlayerStore();
  const dbSong = useLiveQuery(() => db.songs.get(song.id), [song.id]) || song;
  const isThisPlaying = queue[currentIndex]?.id === dbSong.id;
  const isStarred = !!dbSong.starred;

  const handleStar = (e) => {
    e.stopPropagation();
    useLibraryStore.getState().toggleStar(dbSong.id, isStarred, 'song');
  };

  return (
    <div 
      className="group cursor-pointer w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors relative"
      onClick={() => isThisPlaying ? togglePlay() : playTrack(dbSong)}
      onContextMenu={(e) => useLibraryStore.getState().openContextMenu(e, dbSong, 'song')}
    >
      <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0">
        <LazyImage src={getCoverArtUrl(dbSong.coverArt || dbSong.albumId)} className="w-full h-full" alt="" />
        <button className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {(isThisPlaying && isPlaying) ? (
            <Pause fill="currentColor" className="w-4 h-4 text-white" />
          ) : (
            <Play fill="currentColor" className="w-4 h-4 text-white ml-0.5" />
          )}
        </button>
      </div>
      <div className="flex-1 overflow-hidden pr-8">
        <h3 className="text-white font-semibold text-sm truncate">{dbSong.title}</h3>
        <p className="text-white/50 text-xs truncate">{dbSong.artist}</p>
      </div>
      <button 
        onClick={handleStar}
        className={`absolute right-3 p-2 rounded-full transition-colors ${isStarred ? 'text-rose-500' : 'text-white/20 hover:text-white opacity-0 group-hover:opacity-100 hover:bg-white/10'}`}
      >
        <Heart className="w-4 h-4" fill={isStarred ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}

function RadioCard({ radio }) {
  return (
    <div className="group cursor-pointer w-full bg-gradient-to-br from-rose-500/20 to-orange-500/20 hover:from-rose-500/30 hover:to-orange-500/30 p-4 rounded-xl transition-colors border border-white/5">
      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-3">
        <Mic2 className="text-white w-5 h-5" />
      </div>
      <h3 className="text-white font-semibold text-sm truncate">{radio.name}</h3>
    </div>
  );
}

export function HorizontalRow({ title, items, renderItem, isSyncing }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {isSyncing && <span className="text-xs font-medium text-primary animate-pulse bg-primary/20 px-2 py-0.5 rounded-full">Syncing...</span>}
        </div>
        <a href="#" className="text-xs font-semibold text-white/50 hover:text-white uppercase tracking-wider transition-colors">See all</a>
      </div>
      <div className="flex overflow-x-auto gap-5 pb-4 snap-x snap-mandatory hide-scrollbar -mx-6 px-6">
        {items.map((item) => (
          <div key={item.id} className="w-[140px] md:w-[160px] lg:w-[180px] shrink-0 snap-start flex-none">
            {renderItem(item)}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SongGridRow({ title, songs }) {
  if (!songs || songs.length === 0) return null;
  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {songs.map(song => <SongCard key={song.id} song={song} />)}
      </div>
    </section>
  );
}

export default function Home() {
  const playlists = useLiveQuery(() => db.playlists.toArray());
  const homeLists = useLibraryStore((state) => state.homeLists);
  const isSyncing = useLibraryStore((state) => state.isSyncing);

  const randomPlaylists = useMemo(() => {
    if (!playlists) return [];
    return [...playlists].sort(() => 0.5 - Math.random()).slice(0, 6);
  }, [playlists]);

  return (
    <div className="px-6 pb-24">
      <section className="mb-10 mt-4">
        <h2 className="text-2xl font-bold text-white mb-6">Your Playlists</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {randomPlaylists?.length > 0 ? randomPlaylists.map((playlist) => (
            <Link to={`/playlist/${playlist.id}`} key={playlist.id} className="flex items-center bg-white/5 hover:bg-white/10 rounded-md overflow-hidden cursor-pointer transition-colors group">
              <div className="w-16 h-16 bg-white/10 flex items-center justify-center shadow-md shrink-0">
                 <ListMusic className="text-white/50 w-6 h-6" />
              </div>
              <div className="px-4 flex-1 overflow-hidden">
                <span className="font-semibold text-white block truncate">{playlist.name}</span>
                <span className="text-xs text-white/50 block truncate">{playlist.songCount} Tracks</span>
              </div>
              <div className="pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-md shadow-primary/40 hover:scale-105 transition-transform">
                  <Play fill="currentColor" className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </Link>
          )) : (
             <p className="text-white/40 text-sm">No playlists found.</p>
          )}
        </div>
      </section>

      {/* Categorized Rows */}
      <HorizontalRow title="Favorites" items={homeLists.favorites} renderItem={(album) => <ConnectedAlbumCard album={album} />} />
      <HorizontalRow title="Top Rated" items={homeLists.topRated} renderItem={(album) => <ConnectedAlbumCard album={album} />} />
      <HorizontalRow title="Recently Added" items={homeLists.recentlyAdded} isSyncing={isSyncing} renderItem={(album) => <ConnectedAlbumCard album={album} />} />
      <HorizontalRow title="Recently Played" items={homeLists.recentlyPlayed} renderItem={(album) => <ConnectedAlbumCard album={album} />} />
      <HorizontalRow title="Most Played" items={homeLists.mostPlayed} renderItem={(album) => <ConnectedAlbumCard album={album} />} />
      
      <HorizontalRow title="Artists" items={homeLists.artists} renderItem={(artist) => <ArtistCard artist={artist} />} />
      
      <SongGridRow title="Random Songs" songs={homeLists.songs} />
      
      <HorizontalRow title="Internet Radios" items={homeLists.radios} renderItem={(radio) => <RadioCard radio={radio} />} />
      
      <HorizontalRow title="Random Albums" items={homeLists.random} renderItem={(album) => <ConnectedAlbumCard album={album} />} />
      
      {(!homeLists.recentlyAdded || homeLists.recentlyAdded.length === 0) && !isSyncing && (
        <p className="text-white/40 text-sm">No albums found in your library. Is your Navidrome scanning?</p>
      )}
    </div>
  );
}
