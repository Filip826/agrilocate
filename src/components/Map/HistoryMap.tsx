'use client';

import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Database } from '../../lib/database.types';

type Location = Database['public']['Tables']['locations']['Row'];

const startIcon = new Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const endIcon = new Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface HistoryMapProps {
  locations: Location[];
}

function formatDate(value: string | null) {
  if (!value) return 'Neznámy čas';

  const d = new Date(value);
  if (isNaN(d.getTime())) return 'Neplatný dátum';

  return d.toLocaleString('sk-SK');
}

export function HistoryMap({ locations }: HistoryMapProps) {
  if (!locations || locations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Žiadne GPS dáta pre zvolené obdobie
      </div>
    );
  }

  // odfiltrujeme len body ktoré majú platné súradnice
  const validLocations = locations.filter(
    (l) =>
      l.lat !== null &&
      l.lon !== null &&
      !isNaN(Number(l.lat)) &&
      !isNaN(Number(l.lon))
  );

  if (validLocations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Záznamy existujú, ale neobsahujú platné GPS súradnice
      </div>
    );
  }

  const path: LatLngExpression[] = validLocations.map((l) => [
    Number(l.lat),
    Number(l.lon),
  ]);

  const center = path[Math.floor(path.length / 2)];

  return (
    <div className="relative z-40 h-full w-full">
      <MapContainer center={center} zoom={14} className="h-full w-full">
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {path.length > 1 && <Polyline positions={path} color="blue" weight={4} />}

        <Marker position={path[0]} icon={startIcon}>
          <Popup>
            <strong>Začiatok pohybu</strong>
            <br />
            {formatDate(validLocations[0].created_at)}
          </Popup>
        </Marker>

        <Marker position={path[path.length - 1]} icon={endIcon}>
          <Popup>
            <strong>Koniec pohybu</strong>
            <br />
            {formatDate(validLocations[validLocations.length - 1].created_at)}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}