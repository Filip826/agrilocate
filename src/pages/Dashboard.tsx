import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

import { Navbar } from '../components/Layout/Navbar';
import { Footer } from '../components/Layout/Footer';

import { LiveMap } from '../components/Map/LiveMap';
import { LiveCharts } from '../components/LiveCharts';
import { LiveStats } from '../components/LiveStats';

import { HistoryView } from '../components/History/HistoryView';
import { AboutPage } from './AboutPage';
import { SettingsPage } from './SettingsPage';

import { AIAssistant } from '../components/AI/AIAssistant';
import { useAuth } from '../contexts/AuthContext';

type UiLocation = {
  lat: number;
  lon: number;
  created_at: string;
  device_id: string;
};

type UiDevice = {
  id: string;
  device_name: string;
  is_online: boolean;
  currentLocation?: {
    lat: number;
    lon: number;
    created_at: string;
  };
};

interface DashboardProps {
  initialTab?: 'map' | 'history' | 'about' | 'settings';
}

// Fake história: body stoja na mieste, mení sa len čas
function makeStaticHistory(
  deviceId: string,
  lat: number,
  lon: number
): UiLocation[] {
  const now = Date.now();
  const pts: UiLocation[] = [];

  for (let i = 0; i < 60; i++) {
    pts.push({
      device_id: deviceId,
      lat,
      lon,
      created_at: new Date(now - (60 - i) * 6 * 60 * 1000).toISOString(),
    });
  }

  return pts;
}

export function Dashboard({ initialTab = 'about' }: DashboardProps) {
  const { user } = useAuth();

  const [activeTab, setActiveTab] =
    useState<'map' | 'history' | 'about' | 'settings'>(initialTab);

  const [showAI, setShowAI] = useState(false);

  const ADMIN_EMAIL = 'hodakfilip24@gmail.com';
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const protectedTabs = useMemo(
    () => new Set(['map', 'history', 'settings']),
    []
  );

  useEffect(() => {
    if (!user && protectedTabs.has(activeTab)) {
      setActiveTab('about');
    }
  }, [user, activeTab, protectedTabs]);

  const BASE_LAT = 48.977345;
  const BASE_LON = 20.420361;
  const OFFSET = 0.00045;

  const REAL_ID = 'device_id';
  const FAKE2_ID = 'device-fake-2';
  const FAKE3_ID = 'device-fake-3';

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(REAL_ID);

  const [realLocations, setRealLocations] = useState<UiLocation[]>([]);
  const [realLast, setRealLast] = useState<UiLocation | null>(null);
  const [loading, setLoading] = useState(false);

  const fake2Current = useMemo(
    () => ({
      lat: BASE_LAT + OFFSET,
      lon: BASE_LON,
      created_at: new Date().toISOString(),
    }),
    []
  );

  const fake3Current = useMemo(
    () => ({
      lat: BASE_LAT,
      lon: BASE_LON + OFFSET,
      created_at: new Date().toISOString(),
    }),
    []
  );

  const fake2History = useMemo(
    () => makeStaticHistory(FAKE2_ID, fake2Current.lat, fake2Current.lon),
    [fake2Current.lat, fake2Current.lon]
  );

  const fake3History = useMemo(
    () => makeStaticHistory(FAKE3_ID, fake3Current.lat, fake3Current.lon),
    [fake3Current.lat, fake3Current.lon]
  );

  // ====== Load real data ======
  useEffect(() => {
    const load = async () => {
      if (!user) {
        setRealLocations([]);
        setRealLast(null);
        setLoading(false);
        return;
      }

      if (!isAdmin) {
        setRealLocations([]);
        setRealLast(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1500);

      if (error) {
        console.error('Supabase error:', error);
        setLoading(false);
        return;
      }

      const mapped: UiLocation[] = (data ?? []).map((r: any) => ({
        device_id: String(r.device_id ?? REAL_ID),
        lat: Number(r.lat ?? r.latitude),
        lon: Number(r.lon ?? r.longitude),
        created_at: String(r.created_at ?? r.timestamp),
      }));

      mapped.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setRealLocations(mapped);
      setRealLast(mapped[mapped.length - 1] ?? null);
      setLoading(false);
    };

    load();
  }, [user, isAdmin]);

  // ====== Realtime updates ======
  useEffect(() => {
    if (!user || !isAdmin) return;

    const channel = supabase
      .channel('locations-realtime-dashboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'locations',
        },
        (payload) => {
          const r = payload.new as any;

          const newLocation: UiLocation = {
            device_id: String(r.device_id ?? REAL_ID),
            lat: Number(r.lat ?? r.latitude),
            lon: Number(r.lon ?? r.longitude),
            created_at: String(r.created_at ?? r.timestamp),
          };

          setRealLocations((prev) => {
            const updated = [...prev, newLocation];

            updated.sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );

            return updated.slice(-1500);
          });

          setRealLast(newLocation);
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);

  const devices: UiDevice[] = useMemo(() => {
    if (!isAdmin) return [];

    const realCurrent =
      realLast ??
      ({
        device_id: REAL_ID,
        lat: BASE_LAT,
        lon: BASE_LON,
        created_at: new Date().toISOString(),
      } as UiLocation);

    return [
      {
        id: REAL_ID,
        device_name: 'Zariadenie 1 (Reálne)',
        is_online: true,
        currentLocation: {
          lat: realCurrent.lat,
          lon: realCurrent.lon,
          created_at: realCurrent.created_at,
        },
      },
      {
        id: FAKE2_ID,
        device_name: 'Zariadenie 2 ',
        is_online: true,
        currentLocation: fake2Current,
      },
      {
        id: FAKE3_ID,
        device_name: 'Zariadenie 3 ',
        is_online: true,
        currentLocation: fake3Current,
      },
    ];
  }, [isAdmin, realLast, fake2Current, fake3Current]);

  const selectedLocations: UiLocation[] = useMemo(() => {
    if (!isAdmin) return [];

    if (selectedDeviceId === REAL_ID) return realLocations;
    if (selectedDeviceId === FAKE2_ID) return fake2History;
    if (selectedDeviceId === FAKE3_ID) return fake3History;
    return [];
  }, [isAdmin, selectedDeviceId, realLocations, fake2History, fake3History]);

  const selectedDeviceName = useMemo(() => {
    if (!isAdmin) return 'Bez dát';
    return (
      devices.find((d) => d.id === selectedDeviceId)?.device_name ??
      'Zariadenie'
    );
  }, [isAdmin, devices, selectedDeviceId]);

  const isFakeSelected = selectedDeviceId !== REAL_ID;

  const allLocationsForHistory: UiLocation[] = useMemo(() => {
    if (!isAdmin) return [];

    const all = [...realLocations, ...fake2History, ...fake3History];
    all.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return all;
  }, [isAdmin, realLocations, fake2History, fake3History]);

  const devicesForHistory = useMemo(() => {
    if (!isAdmin) return [];

    return [
      { id: REAL_ID, name: 'Zariadenie 1 (Reálne)' },
      { id: FAKE2_ID, name: 'Zariadenie 2 ' },
      { id: FAKE3_ID, name: 'Zariadenie 3 ' },
    ];
  }, [isAdmin]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAIClick={() => setShowAI(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {activeTab === 'about' && <AboutPage />}

        {activeTab === 'map' && (
          <div className="space-y-6">
            {!user ? (
              <div className="bg-white rounded-xl shadow p-6 text-gray-700">
                Pre mapu sa musíš prihlásiť.
              </div>
            ) : loading ? (
              <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
                Načítavam GPS dáta…
              </div>
            ) : (
              <>
                {!isAdmin && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4">
                    Tento účet nemá prístup k GPS dátam. Dáta sú dostupné iba
                    pre účet <b>{ADMIN_EMAIL}</b>.
                  </div>
                )}

                <div className="bg-white rounded-xl shadow p-4">
                  <div className="text-sm text-gray-600">
                    Vybrané zariadenie:
                  </div>
                  <div className="text-lg font-semibold">
                    {selectedDeviceName}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {isAdmin
                      ? 'Klikni na marker na mape a prepneš grafy + prehľad aktivity.'
                      : 'Pre tento účet sú dáta skryté.'}
                  </div>
                </div>

                <LiveMap
                  devices={devices as any}
                  selectedDeviceId={selectedDeviceId}
                  onDeviceSelect={(id: string) => setSelectedDeviceId(id)}
                />

                <LiveCharts locations={selectedLocations as any} />
                <LiveStats locations={selectedLocations as any} />
              </>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {!user ? (
              <div className="bg-white rounded-xl shadow p-6 text-gray-700">
                Pre históriu sa musíš prihlásiť.
              </div>
            ) : !isAdmin ? (
              <div className="bg-white rounded-xl shadow p-6 text-gray-700">
                Pre tento účet je história prázdna. Dáta sú dostupné iba pre
                účet <b>{ADMIN_EMAIL}</b>.
              </div>
            ) : (
              <HistoryView
                locations={allLocationsForHistory as any}
                devices={devicesForHistory}
              />
            )}
          </div>
        )}

        {activeTab === 'settings' && (user ? <SettingsPage /> : <AboutPage />)}
      </main>

      <Footer />

      {showAI && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
          <AIAssistant
            onClose={() => setShowAI(false)}
            deviceId={selectedDeviceId}
            deviceName={selectedDeviceName}
            isFakeDevice={isFakeSelected || !isAdmin}
            locations={selectedLocations as any}
          />
        </div>
      )}
    </div>
  );
}