import { Smartphone, Circle, Trash2 } from 'lucide-react';
import { Database } from '../../lib/database.types';

type Device = Database['public']['Tables']['devices']['Row'];

interface DeviceListProps {
  devices: Device[];
  onDelete: (deviceId: string) => void;
  onSelect: (deviceId: string) => void;
  selectedDeviceId?: string;
}

export function DeviceList({ devices, onDelete, onSelect, selectedDeviceId }: DeviceListProps) {
  if (devices.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Smartphone className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg">Nemáte žiadne zariadenia</p>
        <p className="text-sm mt-2">Pridajte svoje prvé GPS zariadenie</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {devices.map((device) => (
        <div
          key={device.id}
          onClick={() => onSelect(device.id)}
          className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
            selectedDeviceId === device.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Smartphone className="w-5 h-5 text-gray-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{device.device_name}</h3>
                <p className="text-sm text-gray-500 mt-1">ID: {device.device_id}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Circle
                    className={`w-3 h-3 ${
                      device.is_online ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'
                    }`}
                  />
                  <span className={`text-sm ${device.is_online ? 'text-green-600' : 'text-gray-500'}`}>
                    {device.is_online ? 'Online' : 'Offline'}
                  </span>
                  {device.last_seen && (
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(device.last_seen).toLocaleString('sk-SK')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(device.id);
              }}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Odstrániť zariadenie"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
