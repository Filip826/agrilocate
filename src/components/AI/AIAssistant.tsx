import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  onClose: () => void;
  locations: any[];
}

/* ================== GPS ANALÝZA ================== */
function analyzeMovement(locations: any[]) {
  if (!locations || locations.length < 2) {
    return 'Nie je dostatok GPS dát na vyhodnotenie pohybu.';
  }

  const sorted = [...locations].sort(
    (a, b) =>
      new Date(a.created_at).getTime() -
      new Date(b.created_at).getTime()
  );

  const start = sorted[0];
  const end = sorted[sorted.length - 1];

  const directDistance =
    Math.sqrt(
      Math.pow(end.lat - start.lat, 2) +
      Math.pow(end.lon - start.lon, 2)
    ) * 111_000;

  let totalDistance = 0;

  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1];
    const b = sorted[i];

    totalDistance +=
      Math.sqrt(
        Math.pow(b.lat - a.lat, 2) +
        Math.pow(b.lon - a.lon, 2)
      ) * 111_000;
  }

  return `
GPS ZHRNUTIE (FAKTY):
- Priamy posun od prvej po poslednú polohu: ${directDistance.toFixed(1)} m
- Celková prejdená vzdialenosť (trasa): ${totalDistance.toFixed(1)} m
- Počet zaznamenaných bodov: ${sorted.length}
`;
}

/* ================== KOMPONENT ================== */
export function AIAssistant({ onClose, locations }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Ahoj 👋 Som AI asistent. Viem odpovedať na farmárske otázky a analyzovať GPS pohyb kravy.',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const wantsMovement =
        /(pohyb|aktiv|kde|gps|trasa|vzdialenost|meter|km|dnes|vcera)/i.test(
          userMessage
        );

      const gpsSummary = wantsMovement
        ? analyzeMovement(locations)
        : null;

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage,
          gps_summary: gpsSummary,
        },
      });

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data?.reply ?? '⚠️ AI nemá odpoveď.',
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '❌ Chyba pri komunikácii s AI serverom.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-[600px] flex flex-col">

        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold">AI Asistent</h2>
          </div>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`p-4 rounded-xl max-w-[70%] whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && <div className="text-sm text-gray-500">AI analyzuje…</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border rounded-lg px-4 py-2"
            placeholder="Napíš otázku…"
          />
          <button className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-5">
            <Send />
          </button>
        </form>

      </div>
    </div>
  );
}
