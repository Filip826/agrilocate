import {
  MapPin,
  LogOut,
  Info,
  History,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  activeTab: 'map' | 'history' | 'about';
  onTabChange: (tab: 'map' | 'history' | 'about') => void;
  onAIClick: () => void;
}

export function Navbar({ activeTab, onTabChange, onAIClick }: NavbarProps) {
  const { signOut, user } = useAuth();

  return (
    <nav className="bg-black shadow-md sticky top-0 z-[2000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">

          {/* LOGO + NAV */}
          <div className="flex items-center gap-6">

            {/* LOGO */}
            <button
              onClick={() => onTabChange('map')}
              className="flex items-center"
            >
              <div className="w-32 h-32 flex items-center justify-center mt-2">
                <img
                  src="/obrazky/logo.png"
                  alt="AgriLocate logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </button>

            {/* NAVIGÁCIA */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => onTabChange('about')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'about'
                    ? 'bg-green-600 text-white'
                    : 'text-white hover:bg-green-500'
                }`}
              >
                <Info className="w-4 h-4 inline mr-2" />
                O nás
              </button>

              <button
                onClick={() => onTabChange('map')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'map'
                    ? 'bg-green-600 text-white'
                    : 'text-white hover:bg-green-500'
                }`}
              >
                <MapPin className="w-4 h-4 inline mr-2" />
                Mapa
              </button>

              <button
                onClick={() => onTabChange('history')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'history'
                    ? 'bg-green-600 text-white'
                    : 'text-white hover:bg-green-500'
                }`}
              >
                <History className="w-4 h-4 inline mr-2" />
                História
              </button>
            </div>
          </div>

          {/* PRAVÁ STRANA */}
          <div className="flex items-center gap-4">
            <button
              onClick={onAIClick}
              className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              AI Asistent
            </button>

            <span className="text-white text-sm">{user?.email}</span>

            <button onClick={signOut} className="text-white">
              <LogOut />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
