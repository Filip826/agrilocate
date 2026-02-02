# ESP32 GPS Tracker - Inštrukcie

## Hardvér

### Potrebné komponenty:
- ESP32 Development Board
- GPS modul (napr. NEO-6M, NEO-7M alebo NEO-8M)
- Napájací zdroj
- Prepojovací kábel

### Zapojenie GPS modulu k ESP32:
```
GPS VCC  -> ESP32 3.3V
GPS GND  -> ESP32 GND
GPS TX   -> ESP32 RX (GPIO 16)
GPS RX   -> ESP32 TX (GPIO 17)
```

## Software

### Knižnice potrebné v Arduino IDE:
1. TinyGPS++
2. WiFi (zabudovaná)
3. HTTPClient (zabudovaná)
4. ArduinoJson

### Vzorový kód pre ESP32:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>
#include <ArduinoJson.h>

// WiFi nastavenia
const char* ssid = "VASE_WIFI_MENO";
const char* password = "VASE_WIFI_HESLO";

// GPS Tracker API nastavenia
const char* serverUrl = "VASE_SUPABASE_URL/functions/v1/gps-tracker";
const char* deviceId = "VASE_DEVICE_ID";  // Z webovej aplikácie
const char* apiKey = "VAS_API_KEY";        // Dostanete po pridaní zariadenia

// GPS Serial nastavenie
HardwareSerial gpsSerial(1);
TinyGPSPlus gps;

// Časovanie
unsigned long lastSend = 0;
const unsigned long sendInterval = 10000; // Odoslať každých 10 sekúnd

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, 16, 17); // RX=16, TX=17

  // Pripojenie k WiFi
  WiFi.begin(ssid, password);
  Serial.print("Pripájanie k WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi pripojené!");
  Serial.print("IP adresa: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Čítanie dát z GPS
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  // Kontrola či máme platnú polohu a či je čas odoslať
  if (gps.location.isValid() && gps.location.isUpdated() &&
      (millis() - lastSend > sendInterval)) {

    sendGPSData();
    lastSend = millis();
  }

  // Debug informácie
  if (millis() % 5000 == 0) {
    Serial.print("Satelity: ");
    Serial.print(gps.satellites.value());
    Serial.print(" | HDOP: ");
    Serial.print(gps.hdop.value());
    Serial.print(" | Lat: ");
    Serial.print(gps.location.lat(), 6);
    Serial.print(" | Lng: ");
    Serial.println(gps.location.lng(), 6);
  }
}

void sendGPSData() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Vytvorenie JSON objektu
    StaticJsonDocument<256> doc;
    doc["device_id"] = deviceId;
    doc["api_key"] = apiKey;
    doc["latitude"] = gps.location.lat();
    doc["longitude"] = gps.location.lng();

    if (gps.altitude.isValid()) {
      doc["altitude"] = gps.altitude.meters();
    }

    if (gps.speed.isValid()) {
      doc["speed"] = gps.speed.kmph();
    }

    if (gps.hdop.isValid()) {
      doc["accuracy"] = gps.hdop.value();
    }

    // Serializácia do string
    String jsonString;
    serializeJson(doc, jsonString);

    // Odoslanie POST requestu
    int httpResponseCode = http.POST(jsonString);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("GPS dáta odoslané!");
      Serial.print("Response code: ");
      Serial.println(httpResponseCode);
      Serial.print("Response: ");
      Serial.println(response);
    } else {
      Serial.print("Chyba pri odosielaní: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("WiFi odpojené!");
  }
}
```

## Postup nastavenia

### 1. Vytvorenie zariadenia vo webovej aplikácii
1. Prihláste sa do webovej aplikácie
2. Kliknite na tlačidlo "Pridať zariadenie" (+)
3. Zadajte názov zariadenia (napr. "Moje auto")
4. Vygenerujte alebo zadajte Device ID (napr. "ESP32_ABC123")
5. Po uložení dostanete API kľúč - **uložte si ho**!

### 2. Konfigurácia ESP32 kódu
1. Otvorte Arduino IDE
2. Skopírujte vzorový kód vyššie
3. Vyplňte tieto hodnoty:
   - `ssid` - názov vašej WiFi siete
   - `password` - heslo k WiFi
   - `serverUrl` - nájdete vo webovej aplikácii (v sekcii "ESP32 Endpoint")
   - `deviceId` - ID zariadenia, ktoré ste vytvorili
   - `apiKey` - API kľúč, ktorý ste dostali

### 3. Nahratie kódu do ESP32
1. Pripojte ESP32 k počítaču cez USB
2. Vyberte správny port v Arduino IDE (Tools > Port)
3. Vyberte správnu dosku (Tools > Board > ESP32 Dev Module)
4. Kliknite na "Upload"

### 4. Testovanie
1. Otvorte Serial Monitor (Tools > Serial Monitor, 115200 baud)
2. Počkajte na pripojenie k WiFi
3. Počkajte kým GPS získa signál (vonku, pri okne)
4. Po získaní GPS signálu sa dáta automaticky odosielajú na server
5. Skontrolujte webovú aplikáciu - zariadenie by malo byť online a viditeľné na mape

## Riešenie problémov

### GPS nedostáva signál
- GPS modul musí byť vonku alebo pri okne
- Prvé získanie signálu môže trvať 1-5 minút ("cold start")
- Skontrolujte zapojenie GPS modulu
- Skontrolujte či GPS má napájanie (LED by mala blikať)

### WiFi sa nepripája
- Skontrolujte SSID a heslo
- Uistite sa, že ESP32 je v dosahu WiFi siete
- Skúste reštartovať ESP32

### Dáta sa neodosielajú na server
- Skontrolujte Device ID a API kľúč
- Skontrolujte server URL
- Otvorte Serial Monitor a pozrite si chybové hlásenia
- Skontrolujte že GPS má platný signál

### Zariadenie je offline vo webovej aplikácii
- Skontrolujte či ESP32 je zapnuté
- Skontrolujte pripojenie k WiFi
- Pozrite sa do Serial Monitoru či sa dáta odosielajú
- Zariadenie je "online" iba keď posiela dáta

## Výkon a optimalizácia

### Šetrenie batérie
- Zvýšte `sendInterval` na vyššiu hodnotu (napr. 60000 = 1 minúta)
- Použite deep sleep režim medzi odosielaniami
- Znížte WiFi vysielaciu silu

### Presnosť GPS
- Používajte modul s externou anténou pre lepší príjem
- Počkajte kým GPS získa viac satelitov (>6)
- Nižší HDOP = lepšia presnosť

## Bezpečnosť

- **NIKDY** nezdieľajte váš API kľúč verejne
- API kľúč je uložený v ESP32 kóde - ak niekto získa vaše ESP32, môže vidieť API kľúč
- Pre produkčné nasazenie zvážte dodatočné šifrovanie
- Pravidelne kontrolujte zariadenia vo webovej aplikácii

## Podpora

Pre ďalšie otázky alebo problémy kontaktujte support@gpstracker.sk
