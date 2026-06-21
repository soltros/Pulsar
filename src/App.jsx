import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Search, Library, Play, Pause, SkipForward, SkipBack, ListMusic, Settings, Mic2, X, RefreshCw, Menu, Trash2, Heart } from 'lucide-react';
import PulsarLogo from './components/PulsarLogo';
import { useAuthStore } from './store/authStore';
import { useLibraryStore } from './store/libraryStore';
import { useSettingsStore } from './store/settingsStore';
import { usePlayerStore } from './store/playerStore';
import { getCoverArtUrl, fetchApi } from './lib/api';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './lib/db';
import Login from './components/Login';
import Home from './pages/Home';
import AlbumView from './pages/AlbumView';
import ArtistView from './pages/ArtistView';
import ExploreView from './pages/ExploreView';
import PlaylistView from './pages/PlaylistView';
import LibraryView from './pages/LibraryView';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import NowPlaying from './components/NowPlaying';
import HeartsView from './pages/HeartsView';

function Sidebar({ isOpen, onClose, onOpenSettings }) {
  const pinnedPlaylists = useSettingsStore(state => state.pinnedPlaylists);
  
  return (
    <>
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />
      )}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-[280px] md:w-72 h-full transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:p-6`}>
        <div className="w-full h-full bg-[#16171d]/80 backdrop-blur-3xl md:border border-white/10 md:rounded-3xl flex flex-col shadow-2xl">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                <PulsarLogo className="text-white w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">Pulsar</h1>
            </div>
            <button className="md:hidden text-white/50 hover:text-white" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto hide-scrollbar pb-24 md:pb-0">
            <NavItem to="/" icon={<HomeIcon />} label="Home" end onClick={onClose} />
            <NavItem to="/explore" icon={<Search />} label="Explore" onClick={onClose} />
            <NavItem to="/library" icon={<Library />} label="Library" onClick={onClose} />
            
            <div className="pt-6">
              <NavItem to="/hearts" icon={<Heart />} label="Hearts" onClick={onClose} />
            </div>

            <div className="pt-6 pb-2">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3">Pinned Playlists</p>
            </div>
            {pinnedPlaylists.map(playlist => (
              <NavItem key={playlist.id} to={`/playlist/${playlist.id}`} icon={<ListMusic />} label={playlist.name} onClick={onClose} />
            ))}
            {pinnedPlaylists.length === 0 && (
              <p className="text-xs text-white/30 px-3 italic">Pin playlists from the Library.</p>
            )}
          </nav>
          
          <div className="p-4 mt-auto hidden md:block">
            <button 
              onClick={() => { onClose(); onOpenSettings(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-white/70 hover:text-white hover:bg-white/5 w-full text-left group"
            >
              <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
              <span className="font-semibold text-sm truncate">Settings</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavItem({ icon, label, to, end, onClick }) {
  return (
    <NavLink 
      to={to || "/"} 
      end={end}
      onClick={onClick}
      className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-primary/20 to-transparent text-white shadow-[inset_2px_0_0_rgba(244,63,94,1)]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-primary' : ''}>
            {icon}
          </span>
          <span className="font-semibold text-sm truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function TopBar({ onOpenSettings, onOpenSidebar }) {
  return (
    <header className="sticky top-0 md:top-6 z-20 flex items-center justify-between px-4 py-3 md:px-6 md:mx-6 bg-[#16171d]/90 backdrop-blur-3xl md:border border-white/10 md:rounded-2xl shadow-xl transition-all">
      <div className="flex items-center flex-1 max-w-2xl gap-4">
        <button onClick={onOpenSidebar} className="md:hidden w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0">
          <Menu className="w-5 h-5 text-white" />
        </button>
        <div className="relative group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search artists, albums, or songs..." 
            className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-white placeholder-white/40 focus:outline-none focus:bg-black/60 focus:border-primary/50 transition-all shadow-inner"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <button onClick={onOpenSettings} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors md:hidden">
          <Settings className="w-5 h-5 text-white" />
        </button>
        <button className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-primary p-0.5">
          <div className="w-full h-full bg-black/50 rounded-[10px] flex items-center justify-center backdrop-blur-sm border border-white/20">
            <span className="text-sm font-bold text-white">D</span>
          </div>
        </button>
      </div>
    </header>
  );
}

function PlayerBar() {
  const { queue, currentIndex, isPlaying, progress, duration, togglePlay, playNext, playPrev, seek, setIsNowPlayingOpen, setNowPlayingTab } = usePlayerStore();
  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;
  const dbAlbum = useLiveQuery(() => currentTrack ? db.albums.get(currentTrack.albumId) : null, [currentTrack?.albumId]);
  const dbSong = useLiveQuery(() => currentTrack ? db.songs.get(currentTrack.id) : null, [currentTrack?.id]);
  const [hasError, setHasError] = useState(false);

  // Reset error state when track changes
  useEffect(() => {
    setHasError(false);
  }, [currentTrack?.id]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const coverUrl = currentTrack?.lastFmArtUrl || dbAlbum?.lastFmArtUrl || (currentTrack ? getCoverArtUrl(currentTrack.coverArt || currentTrack.albumId, 200) : null);

  return (
    <div className="fixed bottom-[85px] md:bottom-8 left-4 right-4 md:left-[320px] md:right-8 h-20 bg-[#16171d]/90 backdrop-blur-3xl border border-white/10 rounded-2xl flex items-center justify-between px-3 md:px-6 z-50 shadow-2xl shadow-primary/10">
      <div 
        className="flex items-center gap-3 md:gap-4 w-auto md:w-1/3 min-w-0 cursor-pointer group"
        onClick={() => setIsNowPlayingOpen(true)}
      >
        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden shadow-lg bg-white/5 flex items-center justify-center group-hover:shadow-primary/20 transition-all border border-white/10 shrink-0">
          {coverUrl && !hasError ? (
            <img 
              src={coverUrl} 
              alt={currentTrack?.title || "Cover"} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
              onError={() => setHasError(true)}
            />
          ) : (
            <PulsarLogo className="w-6 h-6 md:w-8 md:h-8 text-white/20" />
          )}
        </div>
        <div className="flex-1 min-w-0 overflow-hidden pr-2">
          <h4 className="text-white font-bold text-sm truncate group-hover:text-primary transition-colors">{currentTrack ? currentTrack.title : 'Nothing Playing'}</h4>
          <p className="text-white/50 text-xs truncate font-medium">{currentTrack ? currentTrack.artist : 'Pulsar'}</p>
        </div>
        {currentTrack && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              useLibraryStore.getState().toggleStar(currentTrack.id, dbSong ? !!dbSong.starred : false, 'song');
            }}
            className="p-2 rounded-full shrink-0"
          >
            <Heart className={`w-5 h-5 heart-bounce ${dbSong?.starred ? 'heart-liked text-primary' : 'heart-unliked text-white/50'}`} fill={dbSong?.starred ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center flex-1 max-w-md px-2 md:px-4 hidden sm:flex">
        <div className="flex items-center gap-4 md:gap-6 mb-2">
          <button onClick={playPrev} className="text-white/50 hover:text-white transition-colors"><SkipBack className="w-4 h-4 md:w-5 md:h-5" /></button>
          <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            {isPlaying ? <Pause fill="currentColor" className="w-5 h-5" /> : <Play fill="currentColor" className="w-5 h-5 ml-0.5" />}
          </button>
          <button onClick={playNext} className="text-white/50 hover:text-white transition-colors"><SkipForward className="w-4 h-4 md:w-5 md:h-5" /></button>
        </div>
        <div className="flex items-center gap-3 w-full text-[10px] md:text-xs text-white/50 font-medium">
          <span className="w-8 text-right">{formatTime(progress)}</span>
          <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden group cursor-pointer border border-white/5" onClick={handleSeek}>
            <div className="h-full bg-primary group-hover:bg-orange-400 transition-colors relative" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}></div>
          </div>
          <span className="w-8 text-left">{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Mobile inline play button */}
      <div className="sm:hidden flex items-center gap-3 pr-2 shrink-0">
        <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
            {isPlaying ? <Pause fill="currentColor" className="w-5 h-5" /> : <Play fill="currentColor" className="w-5 h-5 ml-0.5" />}
        </button>
      </div>

      <div className="w-1/3 flex justify-end items-center gap-4 hidden md:flex pr-2">
         <button 
           onClick={() => { setIsNowPlayingOpen(true); setNowPlayingTab('queue'); }}
           className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
           title="Up Next"
         >
           <ListMusic className="w-4 h-4" />
         </button>
         <button 
           onClick={() => { setIsNowPlayingOpen(true); setNowPlayingTab('lyrics'); }}
           className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
           title="Lyrics"
         >
           <Mic2 className="w-4 h-4" />
         </button>
         <div className="w-24 h-1.5 bg-black/50 rounded-full overflow-hidden cursor-pointer ml-2 border border-white/5">
            <div className="w-2/3 h-full bg-white/80 rounded-full" />
         </div>
      </div>
    </div>
  );
}

function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 h-[60px] bg-[#16171d]/95 backdrop-blur-3xl border border-white/10 rounded-2xl flex items-center justify-around z-50 shadow-2xl px-2">
      <NavItemMobile to="/" icon={<HomeIcon />} label="Home" end />
      <NavItemMobile to="/explore" icon={<Search />} label="Explore" />
      <NavItemMobile to="/library" icon={<Library />} label="Library" />
      <NavItemMobile to="/hearts" icon={<Heart />} label="Hearts" />
    </nav>
  );
}

function NavItemMobile({ icon, label, to, end }) {
  return (
    <NavLink 
      to={to || "/"} 
      end={end}
      className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full gap-1 p-1 rounded-xl transition-all ${isActive ? 'text-primary' : 'text-white/40 hover:text-white'}`}
    >
      <span className="[&>svg]:w-5 [&>svg]:h-5">{icon}</span>
      <span className="text-[10px] font-bold">{label}</span>
    </NavLink>
  );
}

function GlobalContextMenu() {
  const { contextMenu, closeContextMenu } = useLibraryStore();
  const playlists = useLiveQuery(() => db.playlists.toArray()) || [];
  const [showPlaylists, setShowPlaylists] = useState(false);

  useEffect(() => {
    const handleClick = () => {
      closeContextMenu();
      setShowPlaylists(false);
    };
    if (contextMenu.isOpen) {
      document.addEventListener('click', handleClick);
    }
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu.isOpen, closeContextMenu]);

  if (!contextMenu.isOpen) return null;

  const handlePlayQueue = async (e, action) => {
    e.stopPropagation();
    try {
      let tracks = [];
      if (contextMenu.type === 'song') {
        tracks = [contextMenu.target];
      } else if (contextMenu.type === 'album') {
        const res = await fetchApi('getAlbum', { id: contextMenu.target.id });
        if (res.album?.song) tracks = res.album.song;
      }
      
      if (tracks.length > 0) {
        if (action === 'next') {
          usePlayerStore.getState().addToQueueNext(tracks);
          alert('Added to Play Next!');
        }
        if (action === 'last') {
          usePlayerStore.getState().addToQueueLast(tracks);
          alert('Added to Play Last!');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      closeContextMenu();
      setShowPlaylists(false);
    }
  };

  const handleAddToPlaylist = async (e, playlistId) => {
    e.stopPropagation();
    try {
      let songIdsToAdd = [];
      if (contextMenu.type === 'song') {
        songIdsToAdd = [contextMenu.target.id];
      } else if (contextMenu.type === 'album') {
        const res = await fetchApi('getAlbum', { id: contextMenu.target.id });
        if (res.album?.song) {
          songIdsToAdd = res.album.song.map(s => s.id);
        }
      }

      if (songIdsToAdd.length > 0) {
        if (playlistId === 'new') {
          const name = prompt('Enter new playlist name:');
          if (name) {
             const createRes = await fetchApi('createPlaylist', { name });
             if (createRes.playlist) {
               await fetchApi('updatePlaylist', { playlistId: createRes.playlist.id, songIdToAdd: songIdsToAdd });
               alert(`Created and added to ${name}!`);
             }
          }
        } else {
          await fetchApi('updatePlaylist', { playlistId, songIdToAdd: songIdsToAdd });
          alert('Added to playlist!');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add to playlist.');
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

function SettingsModal({ isOpen, onClose }) {
  const { autoFetchHomeArt, toggleAutoFetchHomeArt } = useSettingsStore();
  const scanLastFmArt = useLibraryStore(state => state.scanLastFmArt);
  const scanLastFmArtists = useLibraryStore(state => state.scanLastFmArtists);
  const scanLastFmTracks = useLibraryStore(state => state.scanLastFmTracks);
  const [isScanning, setIsScanning] = useState(false);
  const [isScanningArtists, setIsScanningArtists] = useState(false);
  const [isScanningTracks, setIsScanningTracks] = useState(false);

  if (!isOpen) return null;

  const handleClearServerCache = async () => {
    if (confirm('Are you sure you want to clear the server metadata cache for all users?')) {
      try {
        await fetch('/api/metadata/refresh', { method: 'POST' });
        alert('Server cache cleared. Metadata will be re-fetched from Last.fm upon next scan.');
      } catch (e) {
        alert('Failed to clear server cache.');
      }
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    await scanLastFmArt();
    setIsScanning(false);
  };

  const handleScanArtists = async () => {
    setIsScanningArtists(true);
    await scanLastFmArtists();
    setIsScanningArtists(false);
  };

  const handleScanTracks = async () => {
    setIsScanningTracks(true);
    await scanLastFmTracks();
    setIsScanningTracks(false);
  };

  const handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
        alert('Offline audio and image caches successfully cleared!');
      } else {
        alert('Offline caching is not supported in this browser.');
      }
    } catch (e) {
      console.error('Failed to clear cache:', e);
      alert('Failed to clear caches.');
    }
  };

  const handleExportHearts = async () => {
    try {
      const res = await fetchApi('getStarred2');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.starred2, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "pulsar_favorites_export.json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (e) {
      alert("Failed to export favorites.");
    }
  };

  const handleImportHearts = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async e => {
      try {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async event => {
          const data = JSON.parse(event.target.result);
          if (data.song) {
            for (let song of data.song) {
              await fetchApi('star', { id: song.id }).catch(() => {});
            }
          }
          if (data.album) {
            for (let album of data.album) {
              await fetchApi('star', { albumId: album.id }).catch(() => {});
            }
          }
          if (data.artist) {
            for (let artist of data.artist) {
              await fetchApi('star', { artistId: artist.id }).catch(() => {});
            }
          }
          alert("Import successful! Resyncing library...");
          useLibraryStore.getState().syncLibrary();
        };
        reader.readAsText(file);
      } catch (err) {
        alert("Failed to import. Make sure the file is a valid Pulsar export JSON.");
      }
    }
    input.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#16171d] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-white mb-6">Settings</h2>
        
        <div className="space-y-4">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white">Server Metadata Integration</h4>
            <p className="text-xs text-white/50 mb-4">
              Pulsar now fetches enhanced metadata from its own backend server. The Last.fm API key is managed via Docker.
            </p>
            <button 
              onClick={handleClearServerCache}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl transition-colors border border-white/10"
            >
              Clear Server Metadata Cache
            </button>
          </div>
          
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
            <div>
              <h4 className="text-sm font-semibold text-white">Auto-fetch Home Cover Art</h4>
              <p className="text-xs text-white/50 mt-1 mr-2">Automatically load images on the home screen. Turn off to prevent 429 errors.</p>
            </div>
            <button 
              onClick={toggleAutoFetchHomeArt}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${autoFetchHomeArt ? 'bg-primary' : 'bg-white/20'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-300 ${autoFetchHomeArt ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <h3 className="text-sm font-semibold text-white mb-3">Library Management</h3>
          <div className="space-y-3">
            <button 
              onClick={handleScan}
              disabled={isScanning || isScanningArtists || isScanningTracks}
              className="w-full flex items-center justify-center gap-2 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning Backend...' : 'Fetch Album Art & Bios'}
            </button>
            <button 
              onClick={handleScanArtists}
              disabled={isScanning || isScanningArtists || isScanningTracks}
              className="w-full flex items-center justify-center gap-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isScanningArtists ? 'animate-spin' : ''}`} />
              {isScanningArtists ? 'Scanning Artists...' : 'Fetch Artist Bios'}
            </button>
            <button 
              onClick={handleScanTracks}
              disabled={isScanning || isScanningArtists || isScanningTracks}
              className="w-full flex items-center justify-center gap-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isScanningTracks ? 'animate-spin' : ''}`} />
              {isScanningTracks ? 'Scanning Tracks...' : 'Fetch Track Bios'}
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <h3 className="text-sm font-semibold text-white mb-3 text-rose-500">Storage & Offline Mode</h3>
          <p className="text-xs text-white/40 mb-3 leading-relaxed">Songs and artwork are automatically cached as you play them so they work offline. If you run low on space, you can clear them here.</p>
          <button 
            onClick={handleClearCache}
            className="w-full flex items-center justify-center gap-2 bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20 font-semibold py-2.5 rounded-xl transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Clear Offline Caches
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <h3 className="text-sm font-semibold text-white mb-3 text-orange-400">Data & Backup</h3>
          <div className="space-y-3">
            <button 
              onClick={handleExportHearts}
              className="w-full flex items-center justify-center gap-2 bg-orange-400/10 text-orange-400 border border-orange-400/30 hover:bg-orange-400/20 font-semibold py-2.5 rounded-xl transition-all"
            >
              Export Hearts
            </button>
            <button 
              onClick={handleImportHearts}
              className="w-full flex items-center justify-center gap-2 bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 font-semibold py-2.5 rounded-xl transition-all"
            >
              Import Hearts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const syncLibrary = useLibraryStore((state) => state.syncLibrary);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const location = useLocation();

  useEffect(() => {
    // Close sidebar on route change
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthenticated) {
      syncLibrary();
    }
  }, [isAuthenticated, syncLibrary]);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="h-screen w-full flex bg-[#09090b] overflow-hidden selection:bg-primary/30 relative font-sans">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth md:pb-36 pb-44">
        {/* Background ambient glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10 pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] -z-10 pointer-events-none" />

        <TopBar 
          onOpenSettings={() => setIsSettingsOpen(true)} 
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
        
        <div className="md:px-6 md:mt-6 mt-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<ExploreView />} />
            <Route path="/library" element={<LibraryView />} />
            <Route path="/hearts" element={<HeartsView />} />
            <Route path="/album/:id" element={<AlbumView />} />
            <Route path="/artist/:id" element={<ArtistView />} />
            <Route path="/playlist/:id" element={<PlaylistView />} />
          </Routes>
        </div>
      </main>

      <GlobalAudioPlayer />
      <NowPlaying />
      <PlayerBar />
      <MobileNav />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <GlobalContextMenu />
    </div>
  );
}

export default App;
