import {
  MapPin,
  LogOut,
  Info,
  History,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  activeTab: 'map' | 'history' | 'about';
  onTabChange: (tab: 'map' | 'history' | 'about') => void;
  onAIClick: () => void;
}

export function Navbar({ activeTab, onTabChange, onAIClick }: NavbarProps) {
  const { signOut, user } = useAuth();
  const [open, setOpen] = useState(false);

  const navBtn = (tab: 'map' | 'history' | 'about', label: string, Icon: any) => (
    <button
      onClick={() => {
        onTabChange(tab);
        setOpen(false);
      }}
      className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
        activeTab === tab
          ? 'bg-green-600 text-white'
          : 'text-white hover:bg-green-500'
      }`}
    >
      <Icon className="w-4 h-4 text-white" />
      {label}
    </button>
  );

  return (
    <nav className="bg-black border-b border-gray-800 sticky top-0 z-[2000]">
      <div className="max-w-7xl mx-auto px-4 py-0">

        {/* ===== MAIN ROW ===== */}
        <div className="flex items-center justify-between">

          {/* LEFT – LOGO + NAV */}
          <div className="flex items-center gap-4">
            <button onClick={() => onTabChange('map')}>
              <img
                src="/obrazky/logo.png"
                alt="AgriLocate logo"
                className="w-20 sm:w-24 md:w-32 object-contain"
              />
            </button>

            {/* DESKTOP NAV */}
            <div className="hidden md:flex items-center gap-2">
              {navBtn('about', 'O nás', Info)}
              {navBtn('map', 'Mapa', MapPin)}
              {navBtn('history', 'História', History)}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            <button
              onClick={onAIClick}
              className="hidden sm:flex px-4 py-2 bg-green-600 text-white rounded-lg text-sm items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-white" />
              AI Asistent
            </button>

            <span className="hidden md:block text-xs text-white">
              {user?.email}
            </span>

            <button
              onClick={signOut}
              className="hidden md:flex text-white"
            >
              <LogOut className="text-white" />
            </button>

            {/* HAMBURGER */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden text-white"
            >
              {open ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* ===== MOBILE MENU ===== */}
        {open && (
          <div className="md:hidden mt-3 space-y-2 border-t border-gray-800 pt-3">
            {navBtn('about', 'O nás', Info)}
            {navBtn('map', 'Mapa', MapPin)}
            {navBtn('history', 'História', History)}

            <button
              onClick={() => {
                onAIClick();
                setOpen(false);
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-white" />
              AI Asistent
            </button>

            <div className="text-xs text-white mt-2">
              {user?.email}
            </div>

            <button
              onClick={signOut}
              className="text-white text-sm mt-2 hover:text-red-400"
            >
              Odhlásiť sa
            </button>
          </div>
        )}

      </div>
    </nav>
  );
}
