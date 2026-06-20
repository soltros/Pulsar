import { useState, useEffect } from 'react';
import { Home, Search, Library, Play, SkipForward, SkipBack, ListMusic, Settings, Mic2, Disc3 } from 'lucide-react';
import { useAuthStore } from './store/authStore';
import { useLibraryStore } from './store/libraryStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './lib/db';
import { getCoverArtUrl } from './lib/api';
import Login from './components/Login';

function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center">
          <Disc3 className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Pulsar</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        <NavItem icon={<Home />} label="Home" active />
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
    <a href="#" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${active ? 'bg-primary/20 text-white shadow-[0_0_15px_rgba(170,59,255,0.2)]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
      <span className={active ? 'text-primary' : ''}>
        {icon}
      </span>
      <span className="font-medium text-sm">{label}</span>
    </a>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-transparent">
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
        <button className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-primary p-0.5">
          <div className="w-full h-full bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
            <span className="text-sm font-bold text-white">D</span>
          </div>
        </button>
      </div>
    </header>
  );
}

function AlbumCard({ title, artist, imgUrl }) {
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-lg shadow-black/40 group-hover:shadow-primary/20 transition-all duration-500">
        <img src={imgUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
        <button className="absolute bottom-3 right-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/40 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
          <Play fill="currentColor" className="w-5 h-5 ml-1" />
        </button>
      </div>
      <h3 className="text-white font-semibold text-sm truncate">{title}</h3>
      <p className="text-white/60 text-xs truncate mt-0.5">{artist}</p>
    </div>
  );
}

function MainContent() {
  const albums = useLiveQuery(() => db.albums.toArray());
  const isSyncing = useLibraryStore((state) => state.isSyncing);

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10 pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] -z-10 pointer-events-none" />

      <TopBar />
      
      <div className="px-6 pb-24">
        <section className="mb-10 mt-4">
          <h2 className="text-2xl font-bold text-white mb-6">Good Evening</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Quick Play Cards */}
            {[
              { title: "Liked Songs", img: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=100&h=100" },
              { title: "Daily Mix 1", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=100&h=100" },
              { title: "Discover Weekly", img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=100&h=100" },
              { title: "Synthwave", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100&h=100" },
            ].map((item, i) => (
              <div key={i} className="flex items-center bg-white/5 hover:bg-white/10 rounded-md overflow-hidden cursor-pointer transition-colors group">
                <img src={item.img} alt="" className="w-16 h-16 object-cover shadow-md" />
                <span className="font-semibold text-white px-4 flex-1">{item.title}</span>
                <div className="pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-md shadow-primary/40 hover:scale-105 transition-transform">
                    <Play fill="currentColor" className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">Recently Added</h2>
              {isSyncing && <span className="text-xs font-medium text-primary animate-pulse bg-primary/20 px-2 py-0.5 rounded-full">Syncing...</span>}
            </div>
            <a href="#" className="text-xs font-semibold text-white/50 hover:text-white uppercase tracking-wider transition-colors">See all</a>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {albums?.length > 0 ? (
              albums.map(album => (
                <AlbumCard 
                  key={album.id} 
                  title={album.name} 
                  artist={album.artist} 
                  imgUrl={getCoverArtUrl(album.coverArt)} 
                />
              ))
            ) : (
              <p className="text-white/40 text-sm col-span-full">
                {isSyncing ? "Importing library..." : "No albums found in your library."}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function PlayerBar() {
  return (
    <div className="fixed bottom-[60px] md:bottom-0 left-0 right-0 h-20 bg-black/60 backdrop-blur-2xl border-t border-white/10 flex items-center justify-between px-4 z-50">
      {/* Track Info */}
      <div className="flex items-center gap-4 w-1/4 min-w-[180px]">
        <div className="relative w-14 h-14 rounded-md overflow-hidden shadow-lg">
          <img src="https://images.unsplash.com/photo-1619983081563-430f63602796?auto=format&fit=crop&q=80&w=100&h=100" className="w-full h-full object-cover" alt="Album Art" />
        </div>
        <div className="flex-1 overflow-hidden">
          <h4 className="text-white font-medium text-sm truncate hover:underline cursor-pointer">Midnight City</h4>
          <p className="text-white/60 text-xs truncate hover:underline cursor-pointer">M83</p>
        </div>
      </div>

      {/* Controls */}
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
            <div className="w-1/3 h-full bg-primary group-hover:bg-primary-light transition-colors relative">
               <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <span>4:03</span>
        </div>
      </div>

      {/* Right Controls */}
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
      <NavItemMobile icon={<Home />} label="Home" active />
      <NavItemMobile icon={<Search />} label="Search" />
      <NavItemMobile icon={<Library />} label="Library" />
    </nav>
  );
}

function NavItemMobile({ icon, label, active }) {
  return (
    <a href="#" className={`flex flex-col items-center gap-1 p-2 ${active ? 'text-primary' : 'text-white/50'}`}>
      <span className="[&>svg]:w-5 [&>svg]:h-5">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </a>
  );
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const syncLibrary = useLibraryStore((state) => state.syncLibrary);

  useEffect(() => {
    if (isAuthenticated) {
      syncLibrary();
    }
  }, [isAuthenticated, syncLibrary]);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="h-screen w-full flex bg-[#0d0e12] overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <MainContent />
      <PlayerBar />
      <MobileNav />
    </div>
  );
}

export default App;
