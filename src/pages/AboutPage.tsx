import { useState } from 'react';
import {
  MapPin,
  Cpu,
  Shield,
  Zap,
  Users,
  Leaf,
} from 'lucide-react';

/* ===== JEDNOTNÉ VEĽKOSTI PÍSMA ===== */
const H2 = "text-2xl md:text-3xl font-semibold";
const H3 = "text-xl font-semibold";
const TEXT = "text-base md:text-lg text-gray-700 leading-relaxed";
const MUTED = "text-sm text-gray-500";

/* ===== SLIDER DATA ===== */
const slides = [
  {
    title: 'GPS sledovanie',
    text: 'Sledujte polohu hospodárskych zvierat v reálnom čase priamo na mape.',
  },
  {
    title: 'História pohybu',
    text: 'Analyzujte pohyb zvierat počas dňa, týždňa alebo dlhšieho obdobia.',
  },
  {
    title: 'AI analýza',
    text: 'AI asistent pomáha vyhodnocovať správanie a aktivitu zvierat.',
  },
];

export function AboutPage() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % slides.length);
  const prev = () =>
    setIndex((i) => (i === 0 ? slides.length - 1 : i - 1));

  return (
    <div className="space-y-20">

      {/* ===== HERO ===== */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl shadow-xl p-12">
        <div className="max-w-4xl mx-auto text-center">
          <Leaf className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">
            AgriLocate
          </h1>
          <p className="text-xl text-green-100">
            Inteligentné GPS na sledovanie hospodárskych zvierat
          </p>
        </div>
      </div>

      {/* ===== O PROJEKTE ===== */}
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-5xl mx-auto">
        <h2 className={`${H2} mb-6`}>
          O projekte
        </h2>
        <p className={`${TEXT} mb-4`}>
          AgriLocate je moderný systém určený pre farmárov a chovateľov,
          ktorí chcú mať prehľad o polohe a pohybe svojho dobytka.
          Pomocou GPS technológie a webovej aplikácie poskytuje
          okamžité informácie v reálnom čase.
        </p>
        <p className={TEXT}>
          Projekt spája hardvér (ESP32 s GPS modulom),
          cloudové služby a moderný frontend do jedného
          jednoduchého a prehľadného riešenia.
        </p>
      </div>

      {/* ===== PREČO VZNIKOL PROJEKT ===== */}
      <div className="bg-green-50 rounded-2xl p-8 max-w-5xl mx-auto">
        <h2 className={`${H2} text-green-700 mb-4`}>
          Prečo vznikol náš projekt?
        </h2>
        <p className={`${TEXT} mb-3`}>
          Projekt AgriLocate vznikol ako reakcia na reálne problémy
          v poľnohospodárstve – stratené zvieratá, nedostatok
          prehľadu o pohybe a časovo náročné manuálne kontroly.
        </p>
        <p className={TEXT}>
          Naším cieľom bolo vytvoriť cenovo dostupné, jednoduché
          a moderné riešenie, ktoré pomôže farmárom zefektívniť
          ich každodennú prácu.
        </p>
      </div>

      {/* ===== SLIDER ===== */}
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto text-center">
        <h3 className={`${H2} mb-4`}>
          {slides[index].title}
        </h3>
        <p className={TEXT}>
          {slides[index].text}
        </p>

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={prev}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            ←
          </button>
          <button
            onClick={next}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            →
          </button>
        </div>
      </div>

      {/* ===== FUNKCIE ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <Feature icon={<Zap />} title="Real-time sledovanie" />
        <Feature icon={<MapPin />} title="Presná poloha" />
        <Feature icon={<Users />} title="Viac zariadení" />
        <Feature icon={<Shield />} title="Bezpečné dáta" />
        <Feature icon={<Cpu />} title="ESP32 podpora" />
        <Feature icon={<Leaf />} title="Smart farming" />
      </div>

      {/* ===== GPS MODUL – OBRÁZOK + OPIS ===== */}
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

          <div>
            <img
              src="/obrazky/picture1.jpg"
              alt="GPS modul zapojený na testovacej doske"
              className="w-full h-[360px] object-contain rounded-xl shadow bg-gray-50 p-4"
            />
            <p className={`${MUTED} text-center mt-2`}>
              GPS modul zapojený počas vývoja projektu
            </p>
          </div>

          <div className="space-y-4">
            <h3 className={`${H2} text-green-600`}>
              Popis GPS modulu
            </h3>

            <p className={TEXT}>
              GPS modul prijíma signály zo satelitov a určuje presnú polohu
              zariadenia. Tieto údaje sú spracované mikrokontrolérom ESP32
              a odosielané do webovej aplikácie.
            </p>

            <p className={TEXT}>
              Modul bol testovaný v  terénnych podmienkach,
              aby bola zabezpečená presnosť a spoľahlivosť meraní.
            </p>

       <ul className={`${TEXT} list-disc list-inside pl-4`}>
  <li>Príjem GPS signálu</li>
  <li>Prepojenie s ESP32</li>
  <li>Reálne testovanie</li>
  <li>Prenos dát do cloudu</li>
</ul>
          </div>

        </div>
      </div>

      {/* ===== ZAKLADATELIA ===== */}
      <div className="max-w-5xl mx-auto space-y-8">
        <h2 className={`${H2} text-center`}>
          Zakladatelia projektu
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Founder
            name="Filip Hodák"
            role="Spoluzakladateľ"
            img="/obrazky/filip.jpg"
            text="Zodpovedný za vývoj aplikácie, GPS riešenie a technickú architektúru."
          />
          <Founder
            name="Damian Kvasňák"
            role="Spoluzakladateľ"
            img="/obrazky/damian.jpg"
            text="Zameriava sa na dizajn, používateľské rozhranie a prezentáciu projektu."
          />
        </div>
      </div>

      {/* ===== REÁLNE TESTOVANIE ===== */}
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-6xl mx-auto space-y-6">
        <h2 className={`${H2} text-center`}>
          Reálne testovanie v praxi
        </h2>

        <p className={`${TEXT} text-center max-w-3xl mx-auto`}>
          Súčasťou vývoja projektu AgriLocate bolo aj reálne testovanie
          GPS zariadenia priamo na hospodárskom zvierati.
          Testovali sme stabilitu signálu, prenos dát a praktické uchytenie.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { src: "/obrazky/4.jpg", text: "Prvé nasadenie GPS zariadenia priamo na zviera." },
            { src: "/obrazky/3.jpg", text: "Detail uchytenia GPS zariadenia a elektroniky." },
            { src: "/obrazky/2.jpg", text: "Testovanie stability signálu v reálnych podmienkach." },
            { src: "/obrazky/1.jpg", text: "Sledovanie pohybu hospodárskeho zvieraťa v teréne." },
          ].map((img) => (
            <div key={img.src} className="space-y-3">
              <img
                src={img.src}
                alt={img.text}
                className="w-full h-96 md:h-[500px] object-cover rounded-lg"
              />
              <p className={`${MUTED} text-center`}>
                {img.text}
              </p>
            </div>
          ))}
        </div>

        <p className={`${TEXT} text-center max-w-4xl mx-auto`}>
          Výsledky testovania potvrdili funkčnosť systému aj v reálnych
          podmienkach. Získané GPS dáta boli zobrazované v aplikácii
          AgriLocate a ďalej analyzované pomocou AI asistenta.
        </p>
      </div>

      {/* ===== SPÄTNÁ VÄZBA ===== */}
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-5xl mx-auto space-y-6">
        <h2 className={`${H2} text-center`}>
          Spätná väzba
        </h2>

        <div className="flex justify-center">
          <img
            src="/obrazky/spetna vazba.png"
            alt="Spätná väzba používateľa"
            className="w-full max-w-5xl rounded-xl shadow-lg"
          />
        </div>
      </div>

      {/* ===== TECHNOLÓGIE ===== */}
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-5xl mx-auto">
        <h2 className={`${H2} mb-6`}>
          Použité technológie
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['React', 'TypeScript', 'Supabase', 'OpenStreetMap'].map((t) => (
            <div
              key={t}
              className="text-center p-4 bg-gray-50 rounded-lg font-medium"
            >
              {t}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ===== POMOCNÉ KOMPONENTY ===== */

function Feature({
  icon,
  title,
}: {
  icon: JSX.Element;
  title: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 text-center">
      <div className="w-12 h-12 mx-auto mb-4 text-green-600">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-800">
        {title}
      </h3>
    </div>
  );
}

function Founder({
  name,
  role,
  img,
  text,
}: {
  name: string;
  role: string;
  img: string;
  text: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
      <img
        src={img}
        alt={name}
        className="w-40 h-40 mx-auto rounded-full object-cover mb-4"
      />
      <h4 className={`${H3}`}>{name}</h4>
      <p className={`${TEXT} text-green-600 font-medium`}>
  {role}
</p>
      <p className={`${MUTED} mt-3`}>{text}</p>
    </div>
  );
}
