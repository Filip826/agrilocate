import {
  MapPin,
  Info,
  History,
  MessageSquare,
  Menu,
  X,
  Settings,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  activeTab: 'map' | 'history' | 'about' | 'settings';
  onTabChange: (tab: 'map' | 'history' | 'about' | 'settings') => void;
  onAIClick: () => void;
}

export function Navbar({ activeTab, onTabChange, onAIClick }: NavbarProps) {
  const { user, signIn, signOut } = useAuth();

  const [open, setOpen] = useState(false);

  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string>('');

  const NAV_BTN =
    'px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-white';

  const goTab = (tab: 'map' | 'history' | 'about' | 'settings') => {
    if (!user && tab !== 'about') {
      setShowAuth(true);
      setAuthError('');
      setOpen(false);
      return;
    }

    onTabChange(tab);
    setOpen(false);
  };

  const navBtn = (
    tab: 'map' | 'history' | 'about' | 'settings',
    label: string,
    Icon: any
  ) => (
    <button
      onClick={() => goTab(tab)}
      className={`${NAV_BTN} ${
        activeTab === tab ? 'bg-green-600' : 'hover:bg-green-500'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  const doLogin = async () => {
    setAuthError('');
    setAuthLoading(true);

    try {
      await signIn(email, password);
      setShowAuth(false);
      setEmail('');
      setPassword('');
    } catch (e: any) {
      setAuthError(e?.message ?? 'Prihlásenie zlyhalo.');
    } finally {
      setAuthLoading(false);
    }
  };

  const doLogout = async () => {
    try {
      await signOut();
      onTabChange('about');
      setOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <nav className="bg-black border-b border-gray-800 sticky top-0 z-[2000]">
        <div className="max-w-7xl mx-auto px-4 py-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => goTab('about')}>
                <img
                  src="/obrazky/logo.png"
                  alt="AgriLocate logo"
                  className="w-20 sm:w-24 md:w-32 object-contain"
                />
              </button>

              <div className="hidden md:flex items-center gap-2">
                {navBtn('about', 'O nás', Info)}

                {user && (
                  <>
                    {navBtn('map', 'Mapa', MapPin)}
                    {navBtn('history', 'História', History)}
                    {navBtn('settings', 'Nastavenia', Settings)}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onAIClick}
                className={`hidden sm:flex ${NAV_BTN} bg-green-600`}
              >
                <MessageSquare className="w-4 h-4" />
                AI Asistent
              </button>

              {!user ? (
                <button
                  onClick={() => {
                    setShowAuth(true);
                    setAuthError('');
                  }}
                  className={`hidden sm:flex ${NAV_BTN} bg-gray-800 hover:bg-gray-700`}
                >
                  <LogIn className="w-4 h-4" />
                  Prihlásiť
                </button>
              ) : (
                <>
                  <span className="hidden md:flex items-center px-4 py-2 text-sm text-white">
                    {user?.email}
                  </span>

                  <button
                    onClick={doLogout}
                    className={`hidden sm:flex ${NAV_BTN} bg-gray-800 hover:bg-gray-700`}
                  >
                    <LogOut className="w-4 h-4" />
                    Odhlásiť
                  </button>
                </>
              )}

              <button
                onClick={() => setOpen(!open)}
                className="md:hidden text-white"
              >
                {open ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>

          {open && (
            <div className="md:hidden mt-3 space-y-2 border-t border-gray-800 pt-3">
              {navBtn('about', 'O nás', Info)}

              {user && (
                <>
                  {navBtn('map', 'Mapa', MapPin)}
                  {navBtn('history', 'História', History)}
                  {navBtn('settings', 'Nastavenia', Settings)}
                </>
              )}

              <button
                onClick={() => {
                  onAIClick();
                  setOpen(false);
                }}
                className={`w-full ${NAV_BTN} bg-green-600`}
              >
                <MessageSquare className="w-4 h-4" />
                AI Asistent
              </button>

              {!user ? (
                <button
                  onClick={() => {
                    setShowAuth(true);
                    setAuthError('');
                    setOpen(false);
                  }}
                  className={`w-full ${NAV_BTN} bg-gray-800 hover:bg-gray-700`}
                >
                  <LogIn className="w-4 h-4" />
                  Prihlásiť
                </button>
              ) : (
                <>
                  <button
                    onClick={doLogout}
                    className={`w-full ${NAV_BTN} bg-gray-800 hover:bg-gray-700`}
                  >
                    <LogOut className="w-4 h-4" />
                    Odhlásiť
                  </button>

                  <div className="px-4 py-2 text-xs text-white">
                    {user?.email}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {showAuth && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Prihlásenie</h3>
              <button
                onClick={() => setShowAuth(false)}
                className="text-gray-600 hover:text-black"
              >
                <X />
              </button>
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {authError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heslo
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>

            <button
              disabled={authLoading || !email || !password}
              onClick={doLogin}
              className={`w-full px-5 py-3 rounded-lg font-medium text-white ${
                authLoading || !email || !password
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {authLoading ? 'Spracúvam…' : 'Prihlásiť'}
            </button>

            <p className="text-xs text-gray-500">
              Neprihlásený používateľ vidí iba stránku „O nás“, ale AI Asistent
              je dostupný pre všetkých.
            </p>
          </div>
        </div>
      )}
    </>
  );
}