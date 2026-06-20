import { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { Home as HomeIcon, Search, Library, Play, Pause, SkipForward, SkipBack, ListMusic, Settings, Mic2, X, RefreshCw } from 'lucide-react';
import PulsarLogo from './components/PulsarLogo';
import { useAuthStore } from './store/authStore';
import { useLibraryStore } from './store/libraryStore';
import { useSettingsStore } from './store/settingsStore';
import { usePlayerStore } from './store/playerStore';
import { getCoverArtUrl } from './lib/api';
import Login from './components/Login';
import Home from './pages/Home';
import AlbumView from './pages/AlbumView';
import PlaylistView from './pages/PlaylistView';
import LibraryView from './pages/LibraryView';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import NowPlaying from './components/NowPlaying';

function Sidebar() {
  const pinnedPlaylists = useSettingsStore(state => state.pinnedPlaylists);
  
  return (
    <aside className="hidden md:flex flex-col w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 h-full pb-24">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)]">
          <PulsarLogo className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Pulsar</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto hide-scrollbar">
        <NavItem to="/" icon={<HomeIcon />} label="Home" end />
        <NavItem to="/explore" icon={<Search />} label="Explore" />
        <NavItem to="/library" icon={<Library />} label="Library" />
        
        <div className="pt-6 pb-2">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider px-2">Pinned Playlists</p>
        </div>
        {pinnedPlaylists.map(playlist => (
          <NavItem key={playlist.id} to={`/playlist/${playlist.id}`} icon={<ListMusic />} label={playlist.name} />
        ))}
        {pinnedPlaylists.length === 0 && (
          <p className="text-xs text-white/30 px-2 italic">Pin playlists from the Library.</p>
        )}
      </nav>
      
      <div className="p-4 mt-auto">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 text-white/70 hover:text-white hover:bg-white/5 w-full text-left">
          <Settings className="w-5 h-5" />
          <span className="font-medium text-sm truncate">Settings</span>
        </button>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, to, end }) {
  return (
    <NavLink 
      to={to || "/"} 
      end={end}
      className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${isActive ? 'bg-primary/20 text-white shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-primary' : ''}>
            {icon}
          </span>
          <span className="font-medium text-sm truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function TopBar({ onOpenSettings }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#0d0e12]/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search artists, albums, or songs..." 
            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all shadow-inner"
          />
        </div>
      </div>
      <div className="flex items-center gap-4 ml-4">
        <button onClick={onOpenSettings} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <Settings className="w-5 h-5 text-white" />
        </button>
        <button className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-primary p-0.5">
          <div className="w-full h-full bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
            <span className="text-sm font-bold text-white">D</span>
          </div>
        </button>
      </div>
    </header>
  );
}

function PlayerBar() {
  const { queue, currentIndex, isPlaying, progress, duration, togglePlay, playNext, playPrev, seek, setIsNowPlayingOpen } = usePlayerStore();
  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

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

  return (
    <div className="fixed bottom-[60px] md:bottom-0 left-0 right-0 h-20 bg-black/60 backdrop-blur-2xl border-t border-white/10 flex items-center justify-between px-4 z-50">
      <div 
        className="flex items-center gap-4 w-1/4 min-w-[180px] cursor-pointer group"
        onClick={() => setIsNowPlayingOpen(true)}
      >
        <div className="relative w-14 h-14 rounded-md overflow-hidden shadow-lg bg-white/5 flex items-center justify-center group-hover:shadow-primary/20 transition-all">
          {currentTrack ? (
            <img src={getCoverArtUrl(currentTrack.coverArt || currentTrack.albumId, 200)} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <PulsarLogo className="w-6 h-6 text-white/20" />
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <h4 className="text-white font-medium text-sm truncate group-hover:text-primary transition-colors">{currentTrack ? currentTrack.title : 'Nothing Playing'}</h4>
          <p className="text-white/50 text-xs truncate">{currentTrack ? currentTrack.artist : ''}</p>
        </div>
      </div>

      <div className="flex flex-col items-center flex-1 max-w-2xl px-4">
        <div className="flex items-center gap-6 mb-2">
          <button onClick={playPrev} className="text-white/50 hover:text-white transition-colors"><SkipBack className="w-5 h-5" /></button>
          <button onClick={togglePlay} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            {isPlaying ? <Pause fill="currentColor" className="w-4 h-4" /> : <Play fill="currentColor" className="w-4 h-4 ml-0.5" />}
          </button>
          <button onClick={playNext} className="text-white/50 hover:text-white transition-colors"><SkipForward className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-2 w-full max-w-md text-xs text-white/50">
          <span className="w-8 text-right">{formatTime(progress)}</span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden group cursor-pointer" onClick={handleSeek}>
            <div className="h-full bg-primary group-hover:bg-orange-400 transition-colors relative" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}></div>
          </div>
          <span className="w-8 text-left">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="w-1/4 flex justify-end items-center gap-4 hidden md:flex">
         <button className="text-white/50 hover:text-white transition-colors"><Mic2 className="w-4 h-4" /></button>
         <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer">
            <div className="w-2/3 h-full bg-white/80" />
         </div>
      </div>
    </div>
  );
}

function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-black/80 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around z-50">
      <NavItemMobile icon={<HomeIcon />} label="Home" active />
      <NavItemMobile icon={<Search />} label="Search" />
      <NavItemMobile icon={<Library />} label="Library" />
    </nav>
  );
}

function NavItemMobile({ icon, label, active }) {
  return (
    <a href="/" className={`flex flex-col items-center gap-1 p-2 ${active ? 'text-primary' : 'text-white/50'}`}>
      <span className="[&>svg]:w-5 [&>svg]:h-5">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </a>
  );
}

function SettingsModal({ isOpen, onClose }) {
  const { lastFmApiKey, setLastFmCredentials } = useSettingsStore();
  const scanLastFmArt = useLibraryStore(state => state.scanLastFmArt);
  const [apiKey, setApiKey] = useState(lastFmApiKey);
  const [isScanning, setIsScanning] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setLastFmCredentials(apiKey, '');
    onClose();
  };

  const handleScan = async () => {
    if (!lastFmApiKey) return;
    setIsScanning(true);
    await scanLastFmArt();
    setIsScanning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#16171d] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-white mb-6">Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider pl-1 mb-2 block">Last.fm API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Enter your Last.fm API Key"
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-all"
            />
            <p className="text-xs text-white/40 mt-2 pl-1">Required to download high-res album art.</p>
          </div>
          
          <button onClick={handleSave} className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-xl transition-colors">
            Save Settings
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <h3 className="text-sm font-semibold text-white mb-3">Library Management</h3>
          <button 
            onClick={handleScan}
            disabled={!lastFmApiKey || isScanning}
            className="w-full flex items-center justify-center gap-2 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning Last.fm...' : 'Scan & Download Last.fm Art'}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const syncLibrary = useLibraryStore((state) => state.syncLibrary);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      syncLibrary();
    }
  }, [isAuthenticated, syncLibrary]);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="h-screen w-full flex bg-[#0d0e12] overflow-hidden selection:bg-primary/30 relative">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
        {/* Background ambient glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10 pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] -z-10 pointer-events-none" />

        <TopBar onOpenSettings={() => setIsSettingsOpen(true)} />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<LibraryView />} />
          <Route path="/album/:id" element={<AlbumView />} />
          <Route path="/playlist/:id" element={<PlaylistView />} />
        </Routes>
      </main>

      <GlobalAudioPlayer />
      <NowPlaying />
      <PlayerBar />
      <MobileNav />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
