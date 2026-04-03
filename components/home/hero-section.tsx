import Link from 'next/link';
import { getConnection } from '@/lib/db';

async function getStats() {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM tiendas) AS total_tiendas,
        (SELECT COUNT(*) FROM productos WHERE activo = 1) AS total_productos
    `);
    return result.recordset[0] as { total_tiendas: number; total_productos: number };
  } catch {
    return { total_tiendas: 0, total_productos: 0 };
  }
}

export async function HeroSection() {
  const stats = await getStats();

  return (
    <section className="relative overflow-hidden" style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Imagen de fondo con ken burns */}
      <style>{`
        @keyframes kenburns-hero {
          0%   { transform: scale(1)    translateX(0)   translateY(0); }
          50%  { transform: scale(1.07) translateX(-1%) translateY(-1%); }
          100% { transform: scale(1)    translateX(0)   translateY(0); }
        }
        .hero-bg { animation: kenburns-hero 20s ease-in-out infinite; }
      `}</style>

      <img
        src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80"
        alt=""
        aria-hidden="true"
        className="hero-bg absolute inset-0 h-full w-full object-cover"
      />
      {/* Overlay que respeta el tema */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,15,35,0.82) 0%, rgba(20,40,110,0.72) 100%)' }} />

      {/* Contenido */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-36">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6"
            style={{ backgroundColor: 'rgba(96,165,250,0.15)', color: 'rgba(147,197,253,0.95)', border: '1px solid rgba(96,165,250,0.3)' }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'rgba(147,197,253,0.9)' }} />
            Tecnología de calidad para Honduras
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-white">
            <span className="block">Tu tienda de</span>
            <span className="block mt-1" style={{ color: '#93c5fd' }}>tecnología online</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Descubre nuestra selección de productos tecnológicos cuidadosamente elegidos.
            Compra en línea con envío a todo Honduras o visítanos en nuestras tiendas físicas.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/productos" className="btn-primary px-8 py-3 w-full sm:w-auto">
              Ver productos
            </Link>
            <Link href="/tiendas" className="px-8 py-3 w-full sm:w-auto rounded-lg font-semibold text-sm text-white text-center transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}
              onMouseEnter={undefined} onMouseLeave={undefined}>
              Encontrar tienda
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: stats.total_productos.toString(), label: 'Productos' },
              { value: stats.total_tiendas.toString(), label: 'Tiendas' },
              { value: '24/7', label: 'Soporte' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
