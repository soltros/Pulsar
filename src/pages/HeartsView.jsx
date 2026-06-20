import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { ConnectedAlbumCard, ArtistCard, SongGridRow } from './Home';
import { Heart } from 'lucide-react';

export default function HeartsView() {
  const albums = useLiveQuery(() => db.albums.where('starred').notEqual('').toArray()) || [];
  const artists = useLiveQuery(() => db.artists.where('starred').notEqual('').toArray()) || [];
  const songs = useLiveQuery(() => db.songs.where('starred').notEqual('').toArray()) || [];

  return (
    <div className="px-6 pb-24 pt-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
          <Heart className="w-8 h-8 text-white" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Your Hearts</h1>
          <p className="text-white/50 mt-1">Everything you've favorited</p>
        </div>
      </div>

      {songs.length > 0 && (
        <SongGridRow title="Songs" songs={songs} />
      )}

      {albums.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {albums.map(album => <ConnectedAlbumCard key={album.id} album={album} />)}
          </div>
        </section>
      )}

      {artists.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {artists.map(artist => <ArtistCard key={artist.id} artist={artist} />)}
          </div>
        </section>
      )}

      {songs.length === 0 && albums.length === 0 && artists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <Heart className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg">You haven't hearted anything yet!</p>
        </div>
      )}
    </div>
  );
}
