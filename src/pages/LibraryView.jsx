import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useSettingsStore } from '../store/settingsStore';
import { ListMusic, Pin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LibraryView() {
  const [activeTab, setActiveTab] = useState('playlists');
  
  const playlists = useLiveQuery(() => db.playlists.toArray());
  const pinnedPlaylists = useSettingsStore(state => state.pinnedPlaylists);
  const togglePinPlaylist = useSettingsStore(state => state.togglePinPlaylist);

  const isPinned = (id) => pinnedPlaylists.some(p => p.id === id);

  return (
    <div className="px-6 pb-24 pt-8">
      <h1 className="text-4xl font-bold text-white mb-8">Your Library</h1>
      
      <div className="flex items-center gap-4 border-b border-white/10 mb-8 pb-2">
        <button 
          onClick={() => setActiveTab('playlists')}
          className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'playlists' ? 'text-primary border-b-2 border-primary -mb-[10px]' : 'text-white/50 hover:text-white'}`}
        >
          Playlists
        </button>
        <button 
          onClick={() => setActiveTab('albums')}
          className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'albums' ? 'text-primary border-b-2 border-primary -mb-[10px]' : 'text-white/50 hover:text-white'}`}
        >
          Albums
        </button>
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
        <p className="text-white/40">Albums view coming soon.</p>
      )}
    </div>
  );
}
