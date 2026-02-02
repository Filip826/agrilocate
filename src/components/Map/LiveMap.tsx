

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Database } from '../../lib/database.types';

type Device = Database['public']['Tables']['devices']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

interface DeviceWithLocation extends Device {
  currentLocation?: Location;
}

interface LiveMapProps {
  devices: DeviceWithLocation[];
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

export function LiveMap({ devices }: LiveMapProps) {
  const [center, setCenter] = useState<LatLngExpression>([48.1486, 17.1077]); // default SK

  // centrovanie mapy podľa POSLEDNEJ ZNÁMEJ POLOHY
  useEffect(() => {
    const withLocation = devices.filter(d => d.currentLocation);
    if (withLocation.length > 0) {
      const loc = withLocation[0].currentLocation!;
      setCenter([Number(loc.lat), Number(loc.lon)]);
    }
  }, [devices]);

  return (
    <MapContainer
      center={center}
      zoom={15}
      className="h-full w-full rounded-lg"
      style={{ minHeight: '500px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapUpdater center={center} />

      {devices.map(device => {
        // 🔴 AK ZARIADENIE NEMÁ ŽIADNU POLOHU
        if (!device.currentLocation) {
          return (
            <Marker
              key={device.id}
              position={center}
              icon={offlineIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg mb-2">
                    {device.device_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Zatiaľ nebola zaznamenaná žiadna poloha
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        }

        // 🟢 POSLEDNÁ ZNÁMA POLOHA (AJ KEĎ JE OFFLINE)
        const position: LatLngExpression = [
          Number(device.currentLocation.lat),
          Number(device.currentLocation.lon),
        ];

        return (
          <Marker
            key={device.id}
            position={position}
            icon={device.is_online ? deviceIcon : offlineIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg mb-2">
                  {device.device_name}
                </h3>

                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Stav:</span>{' '}
                    <span
                      className={
                        device.is_online
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }
                    >
                      {device.is_online ? 'Online' : 'Offline'}
                    </span>
                  </p>

                  <p>
                    <span className="font-medium">Lat:</span>{' '}
                    {Number(device.currentLocation.lat).toFixed(6)}
                  </p>

                  <p>
                    <span className="font-medium">Lon:</span>{' '}
                    {Number(device.currentLocation.lon).toFixed(6)}
                  </p>

                  <p className="text-xs text-gray-500 mt-2">
                    Posledná poloha:{' '}
                    {new Date(
                      device.currentLocation.created_at
                    ).toLocaleString('sk-SK')}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
