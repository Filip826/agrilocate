# GPS Tracking System

Moderná webová aplikácia na sledovanie polohy zariadení ESP32 s GPS modulom v reálnom čase.

## Funkcie

### Live Mapa
- Interaktívna mapa s OpenStreetMap podkladom
- Real-time zobrazenie polohy všetkých zariadení
- Automatické aktualizovanie polohy bez obnovenia stránky
- Zobrazenie stavu zariadenia (online/offline)
- Detaily o zariadení (rýchlosť, nadmorská výška, čas aktualizácie)

### Správa Zariadení
- Podpora viacerých GPS zariadení na jeden účet
- Jednoduché pridávanie a odstraňovanie zariadení
- Automatická generácia API kľúčov
- Sledovanie stavu každého zariadenia

### Autentifikácia
- Bezpečné prihlásenie a registrácia
- Každý používateľ vidí len svoje zariadenia
- Ochrana dát pomocou Row Level Security (RLS)

### AI Asistent
- Inteligentný chatbot pre analýzu GPS dát
- Odpovede na otázky o polohe a pohybe zariadení
- Analýza histórie pohybu
- Prirodzený jazyk v slovenčine

### História Pohybu
- Zobrazenie histórie pohybu na mape
- Časové filtre (dnes, včera, posledný týždeň)
- Vizualizácia trasy s označením začiatku a konca
- Štatistiky o počte záznamov

### Stránka O Nás
- Informácie o projekte
- Prehľad funkcií
- Použité technológie
- Kontaktné informácie

## Technológie

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Mapy**: Leaflet, React Leaflet
- **Backend**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime Subscriptions
- **Autentifikácia**: Supabase Auth
- **Edge Functions**: Supabase Edge Functions (Deno)
- **Build Tool**: Vite

## Štruktúra Databázy

### Tabuľka `devices`
Ukladá informácie o GPS zariadeniach:
- `id` - Jedinečný identifikátor zariadenia
- `user_id` - Vlastník zariadenia
- `device_name` - Názov zariadenia
- `device_id` - ID pre ESP32 autentifikáciu
- `api_key` - API kľúč pre ESP32
- `is_online` - Aktuálny stav zariadenia
- `last_seen` - Posledná aktivita
- `created_at` - Dátum vytvorenia

### Tabuľka `locations`
Ukladá GPS súradnice:
- `id` - Jedinečný identifikátor záznamu
- `device_id` - Odkaz na zariadenie
- `latitude` - Zemepisná šírka
- `longitude` - Zemepisná dĺžka
- `altitude` - Nadmorská výška (voliteľné)
- `speed` - Rýchlosť (voliteľné)
- `accuracy` - Presnosť GPS (voliteľné)
- `timestamp` - Čas záznamu

## API Endpoint pre ESP32

### POST `/functions/v1/gps-tracker`

Endpoint pre odosielanie GPS dát z ESP32 zariadení.

**Request Body:**
```json
{
  "device_id": "ESP32_XXXXXXXX",
  "api_key": "your-api-key-here",
  "latitude": 48.1486,
  "longitude": 17.1077,
  "altitude": 152.5,
  "speed": 45.2,
  "accuracy": 12.3
}
```

**Povinné polia:**
- `device_id` - ID zariadenia z webovej aplikácie
- `api_key` - API kľúč dostupný po vytvorení zariadenia
- `latitude` - Zemepisná šírka
- `longitude` - Zemepisná dĺžka

**Voliteľné polia:**
- `altitude` - Nadmorská výška v metroch
- `speed` - Rýchlosť v km/h
- `accuracy` - Presnosť GPS v metroch

**Response:**
```json
{
  "success": true,
  "message": "Location saved successfully"
}
```

## Inštalácia a Spustenie

### Predpoklady
- Node.js 18+
- npm alebo yarn
- Supabase účet

### Kroky

1. Klonujte repozitár:
```bash
git clone <repository-url>
cd gps-tracking-system
```

2. Nainštalujte závislosti:
```bash
npm install
```

3. Spustite aplikáciu:
```bash
npm run dev
```

4. Otvorte prehliadač na `http://localhost:5173`

## ESP32 Setup

Pre detailné inštrukcie k nastaveniu ESP32 zariadenia pozrite súbor [ESP32_INSTRUCTIONS.md](./ESP32_INSTRUCTIONS.md).

### Rýchly štart:
1. Vytvorte zariadenie vo webovej aplikácii
2. Poznačte si Device ID a API kľúč
3. Nahrajte vzorový kód do ESP32 (v ESP32_INSTRUCTIONS.md)
4. Zariadenie sa automaticky pripojí a začne odosielať GPS dáta

## Bezpečnosť

- Všetky dáta sú chránené pomocou Row Level Security (RLS)
- Používatelia vidia len svoje vlastné zariadenia
- API kľúče sú používané pre autentifikáciu ESP32 zariadení
- Komunikácia prebieha cez HTTPS
- Heslá sú bezpečne hashované

## Vývoj

### Spustenie v development režime:
```bash
npm run dev
```

### Build pre produkciu:
```bash
npm run build
```

### Type checking:
```bash
npm run typecheck
```

### Linting:
```bash
npm run lint
```

## Licencia

MIT

## Podpora

Pre otázky a podporu kontaktujte: support@gpstracker.sk
