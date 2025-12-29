import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterFormProps {
  onToggleForm: () => void;
}

export function RegisterForm({ onToggleForm }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Heslá sa nezhodujú');
      return;
    }

    if (password.length < 6) {
      setError('Heslo musí mať aspoň 6 znakov');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      onToggleForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrácia zlyhala');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">

      {/* LOGO */}
      <div className="flex justify-center mb-3">
        <img
          src="/obrazky/logo.png"
          alt="AgriLocate logo"
          className="w-32 h-32 object-contain"
        />
      </div>

      <h2 className="text-xl font-semibold text-center mb-1 text-gray-800">
        Registrácia
      </h2>
      <p className="text-sm text-center text-gray-600 mb-5">
        Vytvorte si nový účet
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Heslo
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Potvrdiť heslo
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-green-600 hover:bg-green-700
                     text-white rounded-lg font-medium transition
                     disabled:opacity-50"
        >
          {loading ? 'Registrácia...' : 'Zaregistrovať sa'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={onToggleForm}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Prihlásiť sa
        </button>
      </div>
    </div>
  );
}
