import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home as HomeIcon, Search, Library, Play, SkipForward, SkipBack, ListMusic, Settings, Mic2, Disc3, X, RefreshCw } from 'lucide-react';
import { useAuthStore } from './store/authStore';
import { useLibraryStore } from './store/libraryStore';
import { useSettingsStore } from './store/settingsStore';
import Login from './components/Login';
import Home from './pages/Home';
import AlbumView from './pages/AlbumView';
import PlaylistView from './pages/PlaylistView';

function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 h-full pb-24">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center">
          <Disc3 className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Pulsar</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        <NavItem icon={<HomeIcon />} label="Home" active />
        <NavItem icon={<Search />} label="Explore" />
        <NavItem icon={<Library />} label="Library" />
        
        <div className="pt-6 pb-2">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider px-2">Playlists</p>
        </div>
        <NavItem icon={<ListMusic />} label="Favorites" />
        <NavItem icon={<ListMusic />} label="Recently Added" />
      </nav>
      
      <div className="p-4 mt-auto">
        <NavItem icon={<Settings />} label="Settings" />
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active }) {
  return (
    <a href="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${active ? 'bg-primary/20 text-white shadow-[0_0_15px_rgba(170,59,255,0.2)]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
      <span className={active ? 'text-primary' : ''}>
        {icon}
      </span>
      <span className="font-medium text-sm">{label}</span>
    </a>
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
  return (
    <div className="fixed bottom-[60px] md:bottom-0 left-0 right-0 h-20 bg-black/60 backdrop-blur-2xl border-t border-white/10 flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-4 w-1/4 min-w-[180px]">
        <div className="relative w-14 h-14 rounded-md overflow-hidden shadow-lg bg-white/5">
        </div>
        <div className="flex-1 overflow-hidden">
          <h4 className="text-white font-medium text-sm truncate hover:underline cursor-pointer">Nothing Playing</h4>
        </div>
      </div>

      <div className="flex flex-col items-center flex-1 max-w-2xl px-4">
        <div className="flex items-center gap-6 mb-2">
          <button className="text-white/50 hover:text-white transition-colors"><SkipBack className="w-5 h-5" /></button>
          <button className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            <Play fill="currentColor" className="w-4 h-4 ml-0.5" />
          </button>
          <button className="text-white/50 hover:text-white transition-colors"><SkipForward className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-2 w-full max-w-md text-xs text-white/50">
          <span>0:00</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden group cursor-pointer">
            <div className="w-0 h-full bg-primary group-hover:bg-primary-light transition-colors relative"></div>
          </div>
          <span>0:00</span>
        </div>
      </div>

      <div className="w-1/4 flex justify-end items-center gap-4 hidden md:flex">
         <button className="text-white/50 hover:text-white transition-colors"><Mic2 className="w-4 h-4" /></button>
         <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
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
          <Route path="/album/:id" element={<AlbumView />} />
          <Route path="/playlist/:id" element={<PlaylistView />} />
        </Routes>
      </main>

      <PlayerBar />
      <MobileNav />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
