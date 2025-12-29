import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Database } from '../lib/database.types';
import { LiveMap } from '../components/Map/LiveMap';

type Device = Database['public']['Tables']['devices']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

interface DeviceWithLocation extends Device {
  currentLocation?: Location;
}

export default function MapView() {
  const [devices, setDevices] = useState<DeviceWithLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // 1️⃣ načítaj zariadenia
      const { data: devicesData } = await supabase
        .from('devices')
        .select('*');

      if (!devicesData) return;

      const withLocation: DeviceWithLocation[] = [];

      // 2️⃣ ku každému zariadeniu nájdi POSLEDNÚ polohu
      for (const device of devicesData) {
        const { data: loc } = await supabase
          .from('locations')
          .select('*')
          .eq('device_id', device.device_id ?? device.id)
          .order('created_at', { ascending: false })
          .limit(1);

        withLocation.push({
          ...device,
          currentLocation: loc?.[0],
        });
      }

      setDevices(withLocation);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <div className="p-4">Načítavam mapu…</div>;
  }

  return (
    <div className="h-full w-full">
      <LiveMap devices={devices} />
    </div>
  );
}
