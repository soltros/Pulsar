import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Search, Library, Play, Pause, SkipForward, SkipBack, ListMusic, Settings, Mic2, X, RefreshCw, Menu, Trash2, Heart, Shuffle, Repeat, Repeat1, Volume2, VolumeX } from 'lucide-react';
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
import HeartsView from './pages/HeartsView';import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import PlayerBar from './components/PlayerBar';
import MobileNav from './components/MobileNav';
import SettingsModal from './components/SettingsModal';
import GlobalContextMenu from './components/GlobalContextMenu';



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
