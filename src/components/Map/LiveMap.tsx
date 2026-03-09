import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

type MapDevice = {
  id: string;
  device_name: string;
  is_online: boolean;
  currentLocation?: {
    lat: number;
    lon: number;
    created_at: string;
  };
};

interface LiveMapProps {
  devices: MapDevice[];
  selectedDeviceId: string;
  onDeviceSelect: (deviceId: string) => void;
}

function MapUpdater({ center }: { center: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const deviceIcon = new Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = new Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const offlineIcon = new Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function LiveMap({
  devices,
  selectedDeviceId,
  onDeviceSelect,
}: LiveMapProps) {
  const defaultCenter: LatLngExpression = [48.977345, 20.420361];
  const [center, setCenter] = useState<LatLngExpression>(defaultCenter);

  const firstWithLocation = useMemo(
    () => devices.find((d) => d.currentLocation),
    [devices]
  );

  // centrovanie podľa vybraného zariadenia (ak má lokáciu), inak podľa prvého s lokáciou
  useEffect(() => {
    const selected = devices.find((d) => d.id === selectedDeviceId);
    const loc = selected?.currentLocation ?? firstWithLocation?.currentLocation ?? null;

    if (loc) {
      setCenter([Number(loc.lat), Number(loc.lon)]);
    } else {
      setCenter(defaultCenter);
    }
  }, [devices, selectedDeviceId, firstWithLocation]);

  return (
    <MapContainer
      center={center}
      zoom={16}
      className="h-full w-full rounded-lg"
      style={{ minHeight: '500px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapUpdater center={center} />

      {/* ✅ VŠETKY 3 zariadenia naraz */}
      {devices.map((device) => {
        const isSelected = device.id === selectedDeviceId;

        // ak nemá polohu
        if (!device.currentLocation) {
          return (
            <Marker
              key={device.id}
              position={center}
              icon={offlineIcon}
              eventHandlers={{ click: () => onDeviceSelect(device.id) }}
            >
              <Popup>
                <div className="p-2">
                  <div className="font-bold">{device.device_name}</div>
                  <div className="text-sm text-gray-600">
                    Poloha nie je dostupná.
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        }

        const position: LatLngExpression = [
          Number(device.currentLocation.lat),
          Number(device.currentLocation.lon),
        ];

        const iconToUse = isSelected
          ? selectedIcon
          : device.is_online
          ? deviceIcon
          : offlineIcon;

        return (
          <Marker
            key={device.id}
            position={position}
            icon={iconToUse}
            eventHandlers={{ click: () => onDeviceSelect(device.id) }}
          >
            <Popup>
              <div className="p-2">
                <div className="font-bold text-lg">{device.device_name}</div>
                <div className="text-sm">
                  <span className="font-medium">Stav:</span>{' '}
                  <span className={device.is_online ? 'text-green-600' : 'text-gray-500'}>
                    {device.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Lat:</span>{' '}
                  {Number(device.currentLocation.lat).toFixed(6)}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Lon:</span>{' '}
                  {Number(device.currentLocation.lon).toFixed(6)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Klikni na marker pre výber zariadenia
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}