import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface AddDeviceModalProps {
  onClose: () => void;
  onAdd: (deviceName: string, deviceId: string) => Promise<void>;
}

export function AddDeviceModal({ onClose, onAdd }: AddDeviceModalProps) {
  const [deviceName, setDeviceName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateRandomId = () => {
    const id = 'ESP32_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setDeviceId(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onAdd(deviceName, deviceId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo sa pridať zariadenie');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Pridať zariadenie</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="deviceName" className="block text-sm font-medium text-gray-700 mb-2">
              Názov zariadenia
            </label>
            <input
              id="deviceName"
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Napr. Moje auto"
              required
            />
          </div>

          <div>
            <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700 mb-2">
              ID zariadenia
            </label>
            <div className="flex gap-2">
              <input
                id="deviceId"
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ESP32_XXXXXXXX"
                required
              />
              <button
                type="button"
                onClick={generateRandomId}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                title="Generovať náhodné ID"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Toto ID použijete v ESP32 pre identifikáciu zariadenia
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Pridávanie...' : 'Pridať'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            Po pridaní zariadenia dostanete API kľúč, ktorý použijete v ESP32 pre odosielanie GPS dát.
          </p>
        </div>
      </div>
    </div>
  );
}
