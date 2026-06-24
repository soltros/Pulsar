import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { fetchApi } from '../lib/api';
import DOMPurify from 'dompurify';
import PulsarLogo from '../components/PulsarLogo';
import { ConnectedAlbumCard } from './Home';

export default function ArtistView() {
  const { id } = useParams();
  const dbArtist = useLiveQuery(() => db.artists.get(id), [id]);
  const [artistData, setArtistData] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bioExpanded, setBioExpanded] = useState(false);
  const [mbReleases, setMbReleases] = useState([]);
  const [mbLoading, setMbLoading] = useState(false);

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

  useEffect(() => {
    async function loadMB() {
      if (!artist?.name) return;
      setMbLoading(true);
      try {
        const res = await fetch(`https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(artist.name)}&fmt=json`, { headers: { 'User-Agent': 'PulsarApp/1.0.0 ( github.com/pulsar )' }});
        const data = await res.json();
        if (data.artists && data.artists.length > 0) {
          const mbid = data.artists[0].id;
          const res2 = await fetch(`https://musicbrainz.org/ws/2/release-group?artist=${mbid}&limit=100&fmt=json`, { headers: { 'User-Agent': 'PulsarApp/1.0.0 ( github.com/pulsar )' }});
          const data2 = await res2.json();
          const releases = (data2['release-groups'] || [])
            .filter(r => r['first-release-date'] && (r['primary-type'] === 'Album' || r['primary-type'] === 'EP' || r['primary-type'] === 'Single'))
            .sort((a, b) => new Date(b['first-release-date']) - new Date(a['first-release-date']))
            .slice(0, 6);
          setMbReleases(releases);
        }
      } catch (err) {
        console.error("MusicBrainz fetch failed:", err);
      } finally {
        setMbLoading(false);
      }
    }
    loadMB();
  }, [artist?.name]);

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
    <div className="pb-32 max-w-[1600px] mx-auto px-6 md:px-12">
      {/* Sleek Header */}
      <div className="pt-24 pb-8 flex flex-col md:flex-row gap-8 items-end border-b border-white/5 relative">
        <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 shrink-0 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center">
          {artist.lastFmArtUrl ? (
            <img src={artist.lastFmArtUrl} alt={artist.name} className="w-full h-full object-cover" />
          ) : (
            <PulsarLogo className="w-1/2 h-1/2 text-primary opacity-50" />
          )}
        </div>
        
        <div className="relative z-10 flex-1 w-full pb-2">
          <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-2 block">Artist</span>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">{artist.name}</h1>
          <div className="flex items-center gap-2 text-white/50 font-medium text-sm">
            <span>{artist.albumCount || albums.length} Albums</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 pt-8">
        {/* Main Content (Albums) */}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-6">Discography</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {albums.map(album => (
              <ConnectedAlbumCard key={album.id} album={album} />
            ))}
          </div>
        </div>

        {/* Sidebar (Bio & News) */}
        <div className="lg:w-80 xl:w-96 shrink-0 flex flex-col gap-6">
          {artist.bio && (
            <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
              <h3 className="font-bold text-white mb-3 uppercase tracking-wider text-xs text-primary">Biography</h3>
              <div className={`text-white/70 text-sm leading-relaxed relative ${!bioExpanded ? 'max-h-48 overflow-hidden' : ''}`}>
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(artist.bio.replace(/\n/g, '<br />')) }} />
                {!bioExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#16171d] to-transparent pointer-events-none" />
                )}
              </div>
              <button 
                onClick={() => setBioExpanded(!bioExpanded)}
                className="mt-4 text-xs font-semibold text-primary hover:text-white transition-colors uppercase tracking-wider"
              >
                {bioExpanded ? 'Show Less' : 'Read More'}
              </button>
            </div>
          )}

          {/* MusicBrainz Latest Releases */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
            <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-xs text-primary">Latest Releases</h3>
            {mbLoading ? (
              <div className="flex justify-center p-4">
                <PulsarLogo className="w-6 h-6 text-white/20 animate-[spin_15s_linear_infinite]" />
              </div>
            ) : mbReleases.length > 0 ? (
              <div className="space-y-4">
                {mbReleases.map(rel => (
                  <div key={rel.id} className="flex flex-col gap-1 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    <span className="font-medium text-white/90 text-sm leading-tight">{rel.title}</span>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span className="uppercase tracking-wider font-semibold text-white/30">{rel['primary-type']}</span>
                      <span>•</span>
                      <span>{rel['first-release-date']}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-sm">No recent releases found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
