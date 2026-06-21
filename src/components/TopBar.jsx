import { Search, Menu, Settings } from 'lucide-react';
import PulsarLogo from './PulsarLogo';

export default function TopBar({ onOpenSettings, onOpenSidebar }) {
  return (
    <header className="sticky top-0 md:top-6 z-20 flex items-center justify-between px-4 py-3 md:px-6 md:mx-6 md:mt-6 bg-[#16171d]/90 backdrop-blur-3xl border-b md:border border-white/5 md:rounded-2xl shadow-xl transition-all overflow-hidden">
      <div className="flex items-center flex-1 max-w-2xl gap-4">
        <button onClick={onOpenSidebar} className="md:hidden w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0">
          <Menu className="w-5 h-5 text-white" />
        </button>
        <div className="relative group w-full flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search artists, albums, or songs..." 
            className="w-full bg-transparent border-none py-2.5 pl-11 pr-4 text-sm font-medium text-white placeholder-white/40 focus:outline-none focus:ring-0 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <button onClick={onOpenSettings} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors md:hidden">
          <Settings className="w-5 h-5 text-white" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-white/5 hover:bg-primary/20 hover:text-primary hidden md:flex items-center justify-center text-white cursor-pointer shadow-lg border border-white/10 transition-colors" onClick={onOpenSettings}>
          <PulsarLogo className="w-5 h-5" />
        </div>
      </div>
    </header>
  );
}
