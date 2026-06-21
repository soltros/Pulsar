import { useEffect, useState } from 'react';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { fetchApi } from '../lib/api';

export default function GlobalContextMenu() {
  const { contextMenu, closeContextMenu } = useLibraryStore();
  const [showPlaylists, setShowPlaylists] = useState(false);
  const playlists = useLibraryStore(state => state.playlists);

  useEffect(() => {
    if (!contextMenu.isOpen) {
      setShowPlaylists(false);
    }
  }, [contextMenu.isOpen]);

  if (!contextMenu.isOpen) return null;

  const handlePlayQueue = (e, action) => {
    e.stopPropagation();
    const tracks = contextMenu.type === 'album' ? contextMenu.target.song : [contextMenu.target];
    if (!tracks) return;
    
    if (action === 'next') {
      usePlayerStore.getState().addToQueueNext(tracks);
    } else {
      usePlayerStore.getState().addToQueueLast(tracks);
    }
    closeContextMenu();
    setShowPlaylists(false);
  };

  const handleAddToPlaylist = async (e, playlistId) => {
    e.stopPropagation();
    try {
      const tracks = contextMenu.type === 'album' ? contextMenu.target.song : [contextMenu.target];
      if (!tracks || tracks.length === 0) return;
      
      const songIds = tracks.map(t => t.id);
      
      if (playlistId === 'new') {
        const name = prompt("Enter new playlist name:");
        if (!name) return;
        const res = await fetchApi('createPlaylist', { name });
        if (res.playlist) {
          await fetchApi('updatePlaylist', { playlistId: res.playlist.id, songIdToAdd: songIds });
          useLibraryStore.getState().syncLibrary();
        }
      } else {
        await fetchApi('updatePlaylist', { playlistId, songIdToAdd: songIds });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add to playlist.');
    } finally {
      closeContextMenu();
      setShowPlaylists(false);
    }
  };

  const handleStartRadio = async (e) => {
    e.stopPropagation();
    try {
      if (contextMenu.type === 'song') {
        const res = await fetchApi('getSimilarSongs2', { id: contextMenu.target.id, count: 50 });
        if (res.similarSongs2?.song) {
          const radioQueue = [contextMenu.target, ...res.similarSongs2.song];
          usePlayerStore.getState().playTrack(radioQueue[0], radioQueue, 0);
        } else {
          alert('No similar songs found for radio.');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to start radio.');
    } finally {
      closeContextMenu();
      setShowPlaylists(false);
    }
  };

  // Prevent menu from overflowing screen
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const menuWidth = 220;
  const menuHeight = 300; // approximate
  const x = contextMenu.x + menuWidth > windowWidth ? windowWidth - menuWidth - 10 : contextMenu.x;
  const y = contextMenu.y + menuHeight > windowHeight ? windowHeight - menuHeight - 10 : contextMenu.y;

  return (
    <div 
      className="fixed z-[100] w-56 bg-[#1e2029] border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden backdrop-blur-xl"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-2 border-b border-white/5 mb-2">
        <p className="text-xs font-semibold text-white/50 truncate">
          {contextMenu.target?.title || contextMenu.target?.name || 'Selected Item'}
        </p>
      </div>

      {!showPlaylists ? (
        <>
          <button 
            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
            onClick={(e) => handlePlayQueue(e, 'next')}
          >
            Play Next
          </button>
          <button 
            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
            onClick={(e) => handlePlayQueue(e, 'last')}
          >
            Play Last
          </button>
          <button 
            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors flex justify-between items-center group"
            onClick={(e) => { e.stopPropagation(); setShowPlaylists(true); }}
          >
            <span>Add to Playlist</span>
            <span className="text-white/30 group-hover:text-white">&rarr;</span>
          </button>
          {contextMenu.type === 'song' && (
            <button 
              className="w-full text-left px-4 py-2.5 text-sm text-orange-400 hover:bg-orange-400/10 transition-colors border-t border-white/5 mt-1"
              onClick={handleStartRadio}
            >
              Start Track Radio
            </button>
          )}
        </>
      ) : (
        <div className="max-h-64 overflow-y-auto hide-scrollbar">
          <button 
            className="w-full text-left px-4 py-2 text-xs text-white/50 hover:bg-white/10 transition-colors"
            onClick={(e) => { e.stopPropagation(); setShowPlaylists(false); }}
          >
            &larr; Back
          </button>
          <div className="my-1 border-t border-white/5" />
          <button 
            className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/20 transition-colors"
            onClick={(e) => handleAddToPlaylist(e, 'new')}
          >
            + Create New Playlist
          </button>
          {playlists.map(p => (
            <button 
              key={p.id}
              className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors truncate"
              onClick={(e) => handleAddToPlaylist(e, p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
