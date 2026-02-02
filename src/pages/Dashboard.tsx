import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

import { Navbar } from '../components/Layout/Navbar';
import { Footer } from '../components/Layout/Footer';

import { LiveMap } from '../components/Map/LiveMap';
import { LiveCharts } from '../components/LiveCharts';
import { LiveStats } from '../components/LiveStats';

import { HistoryView } from '../components/History/HistoryView';
import { AboutPage } from './AboutPage';
import { AIAssistant } from '../components/AI/AIAssistant';

import { Database } from '../lib/database.types';

type Location = Database['public']['Tables']['locations']['Row'];

interface DashboardProps {
  initialTab?: 'map' | 'history' | 'about';
}

export function Dashboard({ initialTab = 'about' }: DashboardProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [lastLocation, setLastLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔽 TU JE HLAVNÁ ZMENA
  const [activeTab, setActiveTab] =
    useState<'map' | 'history' | 'about'>(initialTab);

  const [showAI, setShowAI] = useState(false);

  // =====================
  // LOAD GPS DATA (SUPABASE)
  // =====================
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Supabase error:', error);
        setLoading(false);
        return;
      }

      setLocations(data ?? []);
      setLastLocation(data?.[0] ?? null);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Načítavam GPS dáta…
      </div>
    );
  }

  // =====================
  // FAKE DEVICE PRE LiveMap
  // =====================
  const devices = lastLocation
    ? [
        {
          id: 'single-device',
          device_name: 'Krava',
          is_online: true,
          currentLocation: lastLocation,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ================= NAVBAR ================= */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAIClick={() => setShowAI(true)}
      />

      {/* ================= CONTENT ================= */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* ===== MAPA ===== */}
        {activeTab === 'map' && (
          <div className="space-y-10">
            <LiveMap devices={devices} />
            <LiveCharts locations={locations} />
            <LiveStats locations={locations} />
          </div>
        )}

        {/* ===== HISTÓRIA ===== */}
        {activeTab === 'history' && (
          <HistoryView locations={locations} />
        )}

        {/* ===== O NÁS ===== */}
        {activeTab === 'about' && <AboutPage />}
      </main>

      {/* ================= FOOTER ================= */}
      <Footer />

      {/* ================= AI ASSISTANT ================= */}
      {showAI && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
          <AIAssistant
            onClose={() => setShowAI(false)}
            locations={locations}
          />
        </div>
      )}
    </div>
  );
}
