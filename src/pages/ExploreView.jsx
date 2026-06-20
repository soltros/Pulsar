import { useEffect, useState } from 'react';
import { fetchApi } from '../lib/api';
import { ConnectedAlbumCard, SongGridRow, HorizontalRow } from './Home';
import PulsarLogo from '../components/PulsarLogo';
import { Sparkles } from 'lucide-react';

export default function ExploreView() {
  const [data, setData] = useState({
    topSongs: [],
    mostPlayedAlbums: [],
    favoriteSongs: [],
    favoriteAlbums: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExploreData() {
      setLoading(true);
      try {
        const [topSongsRes, frequentAlbumsRes, starredRes] = await Promise.allSettled([
          fetchApi('getTopSongs', { count: 12 }),
          fetchApi('getAlbumList2', { type: 'frequent', size: 15 }),
          fetchApi('getStarred2')
        ]);

        const topSongs = topSongsRes.status === 'fulfilled' ? topSongsRes.value?.topSongs?.song || [] : [];
        const mostPlayedAlbums = frequentAlbumsRes.status === 'fulfilled' ? frequentAlbumsRes.value?.albumList2?.album || [] : [];
        
        const favoriteSongs = starredRes.status === 'fulfilled' ? starredRes.value?.starred2?.song || [] : [];
        const favoriteAlbums = starredRes.status === 'fulfilled' ? starredRes.value?.starred2?.album || [] : [];

        setData({
          topSongs,
          mostPlayedAlbums,
          favoriteSongs: favoriteSongs.slice(0, 12),
          favoriteAlbums
        });
      } catch (error) {
        console.error("Failed to load explore data", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadExploreData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-[60vh]">
        <PulsarLogo className="w-12 h-12 text-primary animate-[spin_15s_linear_infinite]" />
      </div>
    );
  }

  return (
    <div className="px-6 pb-32 pt-8">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Explore</h1>
          <p className="text-white/50 font-medium">Your most played tracks, albums, and favorites.</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.topSongs.length > 0 && (
          <SongGridRow title="Most Played Songs" songs={data.topSongs} />
        )}
        
        {data.mostPlayedAlbums.length > 0 && (
          <HorizontalRow 
            title="Most Played Albums" 
            items={data.mostPlayedAlbums} 
            renderItem={(album) => <ConnectedAlbumCard album={album} />} 
          />
        )}

        {data.favoriteSongs.length > 0 && (
          <SongGridRow title="Favorite Songs" songs={data.favoriteSongs} />
        )}

        {data.favoriteAlbums.length > 0 && (
          <HorizontalRow 
            title="Favorite Albums" 
            items={data.favoriteAlbums} 
            renderItem={(album) => <ConnectedAlbumCard album={album} />} 
          />
        )}
      </div>
      
      {data.topSongs.length === 0 && data.mostPlayedAlbums.length === 0 && data.favoriteSongs.length === 0 && (
        <div className="text-center text-white/40 mt-20">
          <p>Play some music or star some tracks to see them here!</p>
        </div>
      )}
    </div>
  );
}
