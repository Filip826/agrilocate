export function Footer() {
  const company = {
    name: 'AgriLocate s.r.o.',
    phone: '+421 900 123 456',
    email: 'agrilocate@gmail.com',
    address: 'Hlavná 123, 040 01 Košice, Slovensko',
    founders: ['Filip Hodák', 'Damian Kvasňák'],
    logoUrl: '/obrazky/logo.png',
  };

  return (
    <footer className="mt-8 border-t border-gray-800 bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

          {/* ===== KONTAKTY ===== */}
          <div className="text-sm text-white text-center md:justify-self-start mt-10">
            <h5 className="text-base font-medium mb-2 text-white">
              Kontakty
            </h5>

            <p>
              📞{' '}
              <a
                href={`tel:${company.phone}`}
                className="text-blue-400 hover:underline"
              >
                {company.phone}
              </a>
            </p>

            <p>
              ✉️{' '}
              <a
                href={`mailto:${company.email}`}
                className="text-blue-400 hover:underline"
              >
                {company.email}
              </a>
            </p>

            <p className="mt-1">
              📍 {company.address}
            </p>
          </div>

          {/* ===== LOGO + NÁZOV ===== */}
          <div className="flex flex-col items-center text-center">
            <div className="w-40 h-40 md:w-44 md:h-44 mb-3">
              <img
                src={company.logoUrl}
                alt="Logo AgriLocate"
                className="w-full h-full object-contain"
              />
            </div>

            {/* ⬇️ TOTO JE DÔLEŽITÉ */}
            <h4 className="text-xl font-semibold text-white">
              {company.name}
            </h4>

            <p className="text-sm mt-1 text-white">
              GPS monitoring dobytka • LoRa • Supabase
            </p>
          </div>

          {/* ===== ZAKLADATELIA ===== */}
          <div className="text-sm text-white text-center md:justify-self-end mt-10">
            <h5 className="text-base font-medium mb-2 text-white">
              Zakladatelia
            </h5>

            <ul className="space-y-1">
              {company.founders.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>

        </div>

        {/* ===== COPYRIGHT ===== */}
        <div className="mt-8 text-xs text-white text-center">
          © {new Date().getFullYear()} {company.name}. Všetky práva vyhradené.
        </div>
      </div>
    </footer>
  );
}
