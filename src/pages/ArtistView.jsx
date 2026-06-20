import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { fetchApi } from '../lib/api';
import PulsarLogo from '../components/PulsarLogo';
import { ConnectedAlbumCard } from './Home';

export default function ArtistView() {
  const { id } = useParams();
  const dbArtist = useLiveQuery(() => db.artists.get(id), [id]);
  const [artistData, setArtistData] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadArtist() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchApi('getArtist', { id });
        if (data.artist) {
          setArtistData(data.artist);
          setAlbums(data.artist.album || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadArtist();
  }, [id]);

  const artist = dbArtist || artistData;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-[60vh]">
        <PulsarLogo className="w-12 h-12 text-primary animate-[spin_15s_linear_infinite]" />
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="p-8 text-center text-white/50">
        <p>Error loading artist: {error || 'Not found'}</p>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="relative pt-32 pb-16 px-8 md:px-12 flex flex-col items-center justify-center text-center overflow-hidden border-b border-white/5 bg-[#0d0e12]">
        {artist.lastFmArtUrl && (
          <div className="absolute inset-0 z-0">
            <img 
              src={artist.lastFmArtUrl} 
              alt={artist.name} 
              className="w-full h-full object-cover opacity-30 mask-image-fade"
              style={{
                maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)'
              }}
            />
          </div>
        )}
        
        <div className="relative z-10 w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden shadow-2xl mb-6 bg-gradient-to-br from-rose-500/20 to-orange-500/20 border-2 border-white/10 flex items-center justify-center">
          {artist.lastFmArtUrl ? (
            <img src={artist.lastFmArtUrl} alt={artist.name} className="w-full h-full object-cover" />
          ) : (
            <PulsarLogo className="w-1/2 h-1/2 text-primary opacity-50" />
          )}
        </div>
        
        <div className="relative z-10 max-w-4xl">
          <span className="text-sm font-bold tracking-[0.2em] text-primary uppercase mb-2 block">Artist</span>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-4">{artist.name}</h1>
          <div className="flex items-center justify-center gap-2 text-white/50 font-medium">
            <span>{artist.albumCount || albums.length} Albums</span>
          </div>
        </div>
      </div>

      {artist.bio && (
        <div className="px-8 md:px-12 pt-12">
          <div className="bg-white/5 rounded-3xl p-8 text-white/80 leading-relaxed text-base border border-white/5 shadow-xl max-w-5xl mx-auto">
            <h3 className="font-bold text-white mb-4 uppercase tracking-[0.1em] text-sm text-primary">Biography</h3>
            <div dangerouslySetInnerHTML={{ __html: artist.bio.replace(/\n/g, '<br />') }} />
          </div>
        </div>
      )}

      {/* Albums Grid */}
      <div className="px-8 md:px-12 pt-12 max-w-[1600px] mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Discography</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {albums.map(album => (
            <ConnectedAlbumCard key={album.id} album={album} />
          ))}
        </div>
      </div>
    </div>
  );
}
