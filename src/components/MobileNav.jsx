import { NavLink } from 'react-router-dom';
import { Home as HomeIcon, Search, Library, Heart } from 'lucide-react';

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

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 h-[60px] bg-[#16171d]/95 backdrop-blur-3xl border border-white/10 rounded-2xl flex items-center justify-around z-50 shadow-2xl px-2">
      <NavItemMobile to="/" icon={<HomeIcon />} label="Home" end />
      <NavItemMobile to="/explore" icon={<Search />} label="Explore" />
      <NavItemMobile to="/library" icon={<Library />} label="Library" />
      <NavItemMobile to="/hearts" icon={<Heart />} label="Hearts" />
    </nav>
  );
}
