import { NavLink } from 'react-router-dom';
import { Home as HomeIcon, Search, Library, Heart, ListMusic, Settings, X } from 'lucide-react';
import PulsarLogo from './PulsarLogo';
import { useSettingsStore } from '../store/settingsStore';

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

export default function Sidebar({ isOpen, onClose, onOpenSettings }) {
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
